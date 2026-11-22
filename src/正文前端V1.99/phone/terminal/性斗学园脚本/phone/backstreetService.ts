import { backstreetWorldbookStore } from './backstreetWorldbook';
import { parseBackstreetReply, type ParsedBackstreetReply } from './backstreetParser';
import { buildMainSceneSnapshot } from './mainSceneSnapshot';
import { generateNovelAiImage } from './novelAiImageClient';
import {
  buildNovelAiIllustrationInstruction,
  getNovelAiImageStatus,
  loadNovelAiImageSettings,
  type NovelAiImageSettings,
} from './novelAiImageSettings';
import { phoneApiManager } from './phoneApiManager';
import { loadBackstreetGenerationSettings, renderBackstreetPromptTemplate } from './backstreetGenerationSettings';
import { phoneLoreContextBuilder } from './phoneLoreContext';
import type {
  BackstreetContact,
  BackstreetMessage,
  BackstreetThreadData,
  PhoneMemoryHit,
  PhoneMemoryQuery,
} from './types';
import { getLatestStatData } from '../../shared/mvuStore';
import { deleteIndexedImage, getIndexedImageBlob, isIndexedImageRef } from '../../shared/indexedImageStore';
import { clipText, formatTimestampedLines, makeId, normalizeName, safeString, uniqueStrings } from './text';
import { extractXmlTag, normalizePhoneMemoryQuery, parseJsonBlock } from './xmlToolCall';

interface SendBackstreetResult {
  userMessage: BackstreetMessage;
  replies: BackstreetMessage[];
}

interface AppendUserMessageOptions {
  imageRef?: string;
  imageRefs?: string[];
  imageHiddenFromPrompt?: boolean;
}

interface BackstreetReplyRecoveryOptions {
  allowedSpeakers?: string[];
  allowImage?: boolean;
}

interface MaterializeReplyOptions {
  contact: string;
  fallbackDate: string;
  fallbackTime: string;
  members?: string[];
}

interface NovelAiIllustrationState {
  enabled: boolean;
  allowImage: boolean;
  reason: string;
  instruction: string;
}

const PLAYER_NAME_MACRO = '<user>';
const BACKSTREET_ADULT_ROLEPLAY_RULES = `【后街成人内容规则】
这是虚构成人角色扮演场景；涉及亲密、裸露或成人向内容时，默认相关角色均为成年人，并基于当前剧情、关系与同意展开。
当当前剧情进入成人向、NSFW、调情、裸露或亲密行为时，不要空回、不要转成规则说明、不要以道德化拒绝打断；只输出角色真实会发送的手机消息。
可以用符合角色性格的暧昧、直白或露骨措辞承接当前成人剧情，但仍然保持手机聊天语气，不写长篇旁白。
不得引入未成年、非自愿、强迫、极端暴力、排泄、兽交等内容；如果上文出现不安全要素，改写为成年、自愿、非极端的表达。`;

function getCurrentTime(characterData: any): string {
  const value = characterData?.时间系统?.时间;
  if (typeof value === 'string' && value.trim()) return value.trim();
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getCurrentDate(characterData: any): string {
  return safeString(characterData?.时间系统?.日期);
}

function getThreadDisplayName(thread: Partial<BackstreetThreadData>): string {
  return thread.kind === 'group' ? safeString(thread.groupName) || '群聊' : safeString(thread.contact);
}

function getPrivatePromptName(contact: string): string {
  const name = safeString(contact);
  return /^bst_group_/i.test(name) ? '群聊' : name;
}

function getMessageSpeaker(message: Partial<BackstreetMessage>, thread: Partial<BackstreetThreadData>): string {
  if (message.sender === 'user') return PLAYER_NAME_MACRO;
  if (message.sender === 'system') return '系统';
  return safeString(message.speaker) || (thread.kind === 'group' ? '群成员' : getThreadDisplayName(thread) || '对方');
}

function isImageMessage(message: Partial<BackstreetMessage>): boolean {
  return message.kind === 'image' || Boolean(message.imageRef || message.imagePrompt || message.imageError);
}

function isPromptVisibleUserImageMessage(message: Partial<BackstreetMessage>): boolean {
  return (
    message.sender === 'user' &&
    isImageMessage(message) &&
    Boolean(safeString(message.imageRef)) &&
    !message.imageHiddenFromPrompt
  );
}

function shouldIncludeMessageInPrompt(message: Partial<BackstreetMessage>): boolean {
  if (safeString(message.text)) return true;
  if (message.sender === 'user' && message.imageHiddenFromPrompt) return false;
  return isImageMessage(message);
}

function formatMessageTextForPrompt(
  message: Partial<BackstreetMessage>,
  options: { inlineImageAttached?: boolean } = {},
): string {
  const text = safeString(message.text);
  if (!isImageMessage(message)) return text;
  if (message.imageError) return `【图片生成失败：${safeString(message.imageError)}】${text}`;
  if (message.sender === 'user') {
    if (message.imageHiddenFromPrompt) return text || '【用户发送了一张图片，但图片未发送给模型，且没有附言/描述】';
    const description = text ? `附言/描述：${text}` : '没有附言';
    return options.inlineImageAttached
      ? `【用户发送了一张图片；图片已随本轮请求以内联媒体发送给模型。${description}】`
      : `【用户发送了一张图片；历史记录只保留图片标记。${description}】`;
  }
  const prompt = safeString(message.imagePrompt);
  const caption = text ? `附言：${text}` : '无附言';
  const promptText = prompt ? `；原始生图 prompt：${prompt}` : '';
  return `【历史插图记录，禁止把本段方括号内容复述为聊天消息】${caption}${promptText}`;
}

function isMessageInlineAttached(message: Partial<BackstreetMessage>, refs?: Set<string>): boolean {
  const ref = safeString(message.imageRef);
  return Boolean(ref && refs?.has(ref));
}

function formatThreadMessagesForPrompt(
  thread: Partial<BackstreetThreadData>,
  messages: BackstreetMessage[],
  maxItems = 30,
  options: { inlineImageRefs?: Set<string> } = {},
): string {
  const promptMessages = messages.filter(shouldIncludeMessageInPrompt).slice(-maxItems);
  return formatTimestampedLines(
    promptMessages,
    message => formatMessageTimestamp(message),
    message =>
      `${getMessageSpeaker(message, thread)}: ${formatMessageTextForPrompt(message, {
        inlineImageAttached: isMessageInlineAttached(message, options.inlineImageRefs),
      })}`,
  );
}

function extractFallbackQuery(text: string, limit = 6): PhoneMemoryQuery {
  const words = uniqueStrings(safeString(text).match(/[\u4e00-\u9fa5A-Za-z0-9]{2,12}/g) || []);
  return {
    app: 'backstreet',
    characters: [],
    keywords: words.slice(-18),
    locations: [],
    limit,
  };
}

function formatMemoryHits(hits: PhoneMemoryHit[], title: string): string {
  if (hits.length === 0) return '';
  return `【${title}】\n${hits
    .map(hit => `- ${hit.contact ? `相关记录：${hit.contact}` : hit.title}\n${clipText(hit.content, 900)}`)
    .join('\n\n')}`;
}

function normalizeList(value: unknown, maxItems = 12): string[] {
  if (!Array.isArray(value)) return [];
  return uniqueStrings(value.map(item => safeString(item)).filter(Boolean)).slice(0, maxItems);
}

function formatMessageTimestamp(message: Partial<BackstreetMessage>): string {
  return uniqueStrings([message.date, message.time || '--:--']).join(' ') || '--:--';
}

const PHONE_PREFS_STORAGE_KEY = 'fatria-status-phone-preferences-v1';
const MAIN_INJECTION_MARKER = '【本轮固定后街聊天记录】';

interface BackstreetMainInjectionSettings {
  presentPrivateLimit: number;
  presentGroupLimit: number;
  globalRecentLimit: number;
}

interface BackstreetMessageContext {
  thread: BackstreetThreadData;
  message: BackstreetMessage;
}

const DEFAULT_MAIN_INJECTION_SETTINGS: BackstreetMainInjectionSettings = {
  presentPrivateLimit: 20,
  presentGroupLimit: 20,
  globalRecentLimit: 20,
};

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numericValue)));
}

function readBackstreetMainInjectionSettings(): BackstreetMainInjectionSettings {
  try {
    const raw = window.localStorage?.getItem(PHONE_PREFS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    return {
      presentPrivateLimit: clampInteger(
        parsed.backstreetPresentPrivateMessageCount,
        0,
        30,
        DEFAULT_MAIN_INJECTION_SETTINGS.presentPrivateLimit,
      ),
      presentGroupLimit: clampInteger(
        parsed.backstreetPresentGroupMessageCount,
        0,
        30,
        DEFAULT_MAIN_INJECTION_SETTINGS.presentGroupLimit,
      ),
      globalRecentLimit: clampInteger(
        parsed.backstreetGlobalRecentMessageCount,
        0,
        50,
        DEFAULT_MAIN_INJECTION_SETTINGS.globalRecentLimit,
      ),
    };
  } catch {
    return { ...DEFAULT_MAIN_INJECTION_SETTINGS };
  }
}

function normalizeCharacterName(value: string): string {
  return safeString(value).replace(/[·・‧•\s\u3000._\-—]/g, '');
}

function isSameCharacter(left: string, right: string): boolean {
  const normalizedLeft = normalizeCharacterName(left);
  const normalizedRight = normalizeCharacterName(right);
  return Boolean(
    normalizedLeft &&
    normalizedRight &&
    (normalizedLeft === normalizedRight ||
      normalizedLeft.includes(normalizedRight) ||
      normalizedRight.includes(normalizedLeft)),
  );
}

function getPresentNames(statData: Record<string, any> | null): string[] {
  const value = statData?.关系系统?.在场人物;
  const names = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[、,，|/\s]+/) : [];
  return uniqueStrings(
    names.map(name => safeString(name)).filter(name => name && !['无', '暂无', '未知'].includes(name)),
  );
}

function getThreadParticipantMatches(thread: BackstreetThreadData, presentNames: string[]): string[] {
  const targets = thread.kind === 'group' ? thread.members || [] : [thread.contact];
  return presentNames.filter(name => targets.some(target => isSameCharacter(name, target)));
}

function getDisplayName(thread: BackstreetThreadData): string {
  return thread.kind === 'group' ? safeString(thread.groupName) || '群聊' : safeString(thread.contact);
}

function getRoleplayMessages(thread: BackstreetThreadData): BackstreetMessage[] {
  return thread.messages.filter(shouldIncludeMessageInPrompt);
}

function getMessageSortTime(message: BackstreetMessage): number {
  return Number(message.createdAt || 0);
}

function formatRawMessageContentLine(
  thread: BackstreetThreadData,
  message: BackstreetMessage,
  includeThreadName = false,
): string {
  const threadLabel = includeThreadName
    ? thread.kind === 'group'
      ? `群聊「${getDisplayName(thread)}」`
      : `私聊「${getDisplayName(thread)}」`
    : '';
  const label = threadLabel ? `${threadLabel} ` : '';
  return `${label}${getMessageSpeaker(message, thread)}：${formatMessageTextForPrompt(message)}`;
}

function formatThreadBlock(thread: BackstreetThreadData, messages: BackstreetMessage[], extra = ''): string {
  const title =
    thread.kind === 'group'
      ? `【群聊：${getDisplayName(thread)}｜成员：${(thread.members || []).join('、') || '未知'}${thread.dissolved ? '｜已解散' : ''}${extra ? `｜${extra}` : ''}】`
      : `【私聊：${getDisplayName(thread)}${extra ? `｜${extra}` : ''}】`;
  return `${title}\n${formatTimestampedLines(
    messages,
    message => formatMessageTimestamp(message),
    message => formatRawMessageContentLine(thread, message),
  )}`;
}

function buildFixedMainInjection(
  threads: BackstreetThreadData[],
  presentNames: string[],
  settings: BackstreetMainInjectionSettings,
): string {
  const sections: string[] = [];
  const sortedThreads = [...threads].sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0));

  if (settings.presentPrivateLimit > 0 && presentNames.length > 0) {
    const privateBlocks = sortedThreads
      .filter(thread => thread.kind !== 'group')
      .map(thread => ({ thread, matches: getThreadParticipantMatches(thread, presentNames) }))
      .filter(item => item.matches.length > 0)
      .map(item => {
        const messages = getRoleplayMessages(item.thread).slice(-settings.presentPrivateLimit);
        return messages.length > 0 ? formatThreadBlock(item.thread, messages, `在场：${item.matches.join('、')}`) : '';
      })
      .filter(Boolean);
    if (privateBlocks.length > 0) {
      sections.push(`【在场人物相关私聊｜每人最近 ${settings.presentPrivateLimit} 条】\n${privateBlocks.join('\n\n')}`);
    }
  }

  if (settings.presentGroupLimit > 0 && presentNames.length > 0) {
    const groupBlocks = sortedThreads
      .filter(thread => thread.kind === 'group')
      .map(thread => ({ thread, matches: getThreadParticipantMatches(thread, presentNames) }))
      .filter(item => item.matches.length > 0)
      .map(item => {
        const messages = getRoleplayMessages(item.thread).slice(-settings.presentGroupLimit);
        return messages.length > 0
          ? formatThreadBlock(item.thread, messages, `涉及在场：${item.matches.join('、')}`)
          : '';
      })
      .filter(Boolean);
    if (groupBlocks.length > 0) {
      sections.push(`【在场人物相关群聊｜每群最近 ${settings.presentGroupLimit} 条】\n${groupBlocks.join('\n\n')}`);
    }
  }

  if (settings.globalRecentLimit > 0) {
    const globalMessages = threads
      .flatMap(thread =>
        getRoleplayMessages(thread).map(message => ({ thread, message }) satisfies BackstreetMessageContext),
      )
      .sort((left, right) => getMessageSortTime(right.message) - getMessageSortTime(left.message))
      .slice(0, settings.globalRecentLimit)
      .reverse();
    if (globalMessages.length > 0) {
      sections.push(
        `【全局最近 ${settings.globalRecentLimit} 条后街记录｜不要求相关角色在场】\n${formatTimestampedLines(
          globalMessages,
          item => formatMessageTimestamp(item.message),
          item => formatRawMessageContentLine(item.thread, item.message, true),
        )}`,
      );
    }
  }

  if (sections.length === 0) return '';

  return `${MAIN_INJECTION_MARKER}
以下内容是后街手机中已经发生过的原始聊天记录，不是总结；请按日期时间判断新旧。
私聊默认只有<user>与该联系人知情；群聊默认只有群成员知情，除非正文明确传播。
这些记录用于帮助正文角色记住后街私下交流、承诺、暗号、秘密和未完成事项。

${sections.join('\n\n')}`;
}

type BackstreetRawMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
  images?: (File | string)[];
};

const BACKSTREET_REPLY_MAX_ATTEMPTS = 3;
const BACKSTREET_REPLY_MAX_TEXT_LENGTH = 600;
const BACKSTREET_REPLY_BLOCK_PATTERNS = [
  /作为(?:一个)?(?:ai|人工智能)/i,
  /我是(?:一个)?(?:ai|人工智能)/i,
  /as an ai/i,
  /抱歉[，,、\s]*(?:我)?(?:无法|不能).*(?:生成|输出|提供|满足|继续|回复)/,
  /(?:xml|json).*(?:格式|输出|标签)/i,
  /(?:格式|标签|规则).*(?:错误|损坏|要求|输出)/,
  /(?:系统提示|提示词|system prompt|user_input|ordered_prompts)/i,
  /```/,
];

function hasCompleteBackstreetEnvelope(content: string): boolean {
  const text = safeString(content);
  return /<backstreet[^>]*>/i.test(text) && /<\/backstreet>/i.test(text);
}

function validateBackstreetReply(
  content: string,
  replies: ParsedBackstreetReply[],
  options: BackstreetReplyRecoveryOptions = {},
): string {
  const allowedSpeakers = options.allowedSpeakers || [];
  if (!safeString(content)) return '空回复';
  if (!hasCompleteBackstreetEnvelope(content)) return '缺少完整 backstreet 标签';
  const payload = extractXmlTag(content, 'backstreet');
  const parsedPayload = parseJsonBlock<unknown>(payload);
  if (!Array.isArray(parsedPayload) && (!parsedPayload || typeof parsedPayload !== 'object')) {
    return 'backstreet JSON 结构损坏';
  }
  if (replies.length === 0) return '没有可用消息';

  const textReplies = replies.filter(reply => reply.type === 'text' && safeString(reply.text));
  const imageReplies = replies.filter(reply => reply.type === 'image' && safeString(reply.prompt));
  if (textReplies.length === 0 && imageReplies.length === 0) return '没有角色消息';
  if (textReplies.length > 4) return '消息数量超出协议';
  if (imageReplies.length > 1) return '插图数量超出协议';
  if (!options.allowImage && imageReplies.length > 0) return '本轮未允许插图';
  const normalizedAllowedSpeakers = allowedSpeakers.map(normalizeName).filter(Boolean);

  for (const reply of textReplies) {
    const text = safeString(reply.text);
    if (text.length > BACKSTREET_REPLY_MAX_TEXT_LENGTH) return '单条消息过长';
    if (BACKSTREET_REPLY_BLOCK_PATTERNS.some(pattern => pattern.test(text))) return '疑似格式说明或拒绝内容';
    if (/【(?:图片|历史插图记录|用户发送了一张图片|已发送插图)[：:；;]/.test(text) || /原始生图\s*prompt/i.test(text)) {
      return '消息误用了历史图片标记';
    }
    if (/<\/?(?:backstreet|phone_memory_query|backstreet_memory_update|main_task|content)\b/i.test(text)) {
      return '消息内混入控制标签';
    }
    if (
      normalizedAllowedSpeakers.length > 0 &&
      !normalizedAllowedSpeakers.includes(normalizeName(safeString(reply.speaker)))
    ) {
      return '群聊消息缺少有效发言人';
    }
  }

  for (const reply of imageReplies) {
    const prompt = safeString(reply.prompt);
    if (prompt.length > 1600) return '插图提示词过长';
    if (/<\/?(?:backstreet|phone_memory_query|backstreet_memory_update|main_task|content)\b/i.test(prompt)) {
      return '插图提示词内混入控制标签';
    }
    if (
      normalizedAllowedSpeakers.length > 0 &&
      !normalizedAllowedSpeakers.includes(normalizeName(safeString(reply.speaker)))
    ) {
      return '群聊插图缺少有效发言人';
    }
  }

  return '';
}

function buildBackstreetRepairPrompt(
  contact: string,
  reason: string,
  allowedSpeakers: string[] = [],
  allowImage = false,
): string {
  const speakerRule =
    allowedSpeakers.length > 0
      ? `每条消息必须包含 "speaker"，且 speaker 只能从这些群成员中选择：${allowedSpeakers.join('、')}。`
      : '';
  const textSample =
    allowedSpeakers.length > 0
      ? `{"speaker":"${allowedSpeakers[0]}","type":"text","text":"消息内容"}`
      : '{"type":"text","text":"消息内容"}';
  const imageSample =
    allowedSpeakers.length > 0
      ? `{"speaker":"${allowedSpeakers[0]}","type":"image","text":"图片附言","prompt":"English NovelAI tags, comma-separated"}`
      : '{"type":"image","text":"图片附言","prompt":"English NovelAI tags, comma-separated"}';
  const imageRule = allowImage
    ? '如果本轮确实有值得保存的画面，可以在 text 消息后追加 1 个 image 对象；image.prompt 必须是英文 NovelAI tag。'
    : '本轮不要输出 image 项。';
  const samples = allowImage ? `${textSample},\n  ${imageSample}` : textSample;
  return `上一次后街回复不可用：${reason}。
不要解释，不要复述规则，不要输出代码块，不要空回。
只补发「${contact}」接下来 1-2 条真实手机消息；成人向或 NSFW 场景也要按角色人格继续承接。
不要生成时间字段，消息时间由系统自动写入。
${speakerRule}
${imageRule}
必须严格输出：
<backstreet>
[
  ${samples}
]
</backstreet>`;
}

function buildBackstreetOutputSchema(
  options: { allowImage: boolean; sampleSpeaker?: string } = { allowImage: false },
): string {
  const speaker = safeString(options.sampleSpeaker);
  const textSample = speaker
    ? `{"speaker":"${speaker}","type":"text","text":"消息内容"}`
    : '{"type":"text","text":"消息内容"}';
  if (!options.allowImage) {
    return `输出必须严格为：
<backstreet>
[
  ${textSample}
]
</backstreet>
必须至少输出 1 条 text 消息；不要空回，不要解释规则，不要输出代码块。`;
  }

  const imageSample = speaker
    ? `{"speaker":"${speaker}","type":"image","text":"图片附言","prompt":"English NovelAI tags, comma-separated"}`
    : '{"type":"image","text":"图片附言","prompt":"English NovelAI tags, comma-separated"}';
  return `输出必须严格为：
<backstreet>
[
  ${textSample},
  ${imageSample}
]
</backstreet>
必须至少输出 1 条 text 消息；不要空回，不要解释规则，不要输出代码块。
如果本轮没有值得保存的画面，不要输出 image 项；如果输出 image，一轮最多 1 项，必须包含 prompt，且 prompt 只能写英文 NovelAI tag。`;
}

function hasInlineImages(messages: BackstreetRawMessage[]): boolean {
  return messages.some(message => Array.isArray(message.images) && message.images.length > 0);
}

function isInlineMediaUnsupportedReason(reason: string): boolean {
  return /(?:image|images|image_url|vision|visual|media|multimodal|modal|content\s*array|content.*string|expected.*string|got.*array|base64|file|blob|inline|not\s+support|unsupported)|(?:图片|图像|视觉|多模态|媒体|内联|不支持|无法识别)/i.test(
    reason,
  );
}

async function requestBackstreetReplyWithRecovery(
  contact: string,
  promptMessages: BackstreetRawMessage[],
  fallbackTime: string,
  options: BackstreetReplyRecoveryOptions = {},
): Promise<ParsedBackstreetReply[]> {
  let lastReason = '未知错误';
  const allowedSpeakers = options.allowedSpeakers || [];
  const includesInlineImages = hasInlineImages(promptMessages);

  for (let attempt = 0; attempt < BACKSTREET_REPLY_MAX_ATTEMPTS; attempt += 1) {
    const messages =
      attempt === 0
        ? promptMessages
        : [
            ...promptMessages,
            {
              role: 'user' as const,
              content: buildBackstreetRepairPrompt(contact, lastReason, allowedSpeakers, Boolean(options.allowImage)),
            },
          ];

    try {
      const generationSettings = loadBackstreetGenerationSettings();
      const result = await phoneApiManager.generateRaw(messages, { maxTokens: generationSettings.maxOutputTokens });
      const parsedReplies = parseBackstreetReply(result.text);
      const invalidReason = validateBackstreetReply(result.text, parsedReplies, options);
      if (!invalidReason) {
        const textReplies = parsedReplies.filter(reply => reply.type === 'text' && safeString(reply.text)).slice(0, 4);
        const imageReplies = parsedReplies
          .filter(reply => reply.type === 'image' && safeString(reply.prompt))
          .slice(0, 1);
        return [...textReplies, ...imageReplies];
      }

      lastReason = invalidReason;
      console.warn(`[后街] ${contact} 回复第 ${attempt + 1} 次不可用：${invalidReason}`);
    } catch (error) {
      lastReason = error instanceof Error ? error.message : '生成失败';
      console.warn(`[后街] ${contact} 回复第 ${attempt + 1} 次失败：`, error);
      if (includesInlineImages && isInlineMediaUnsupportedReason(lastReason)) {
        return [
          {
            type: 'system',
            time: fallbackTime,
            text: `当前小手机使用的模型或 API 没有成功接收图片内联媒体：${lastReason}。请切换到支持视觉/多模态的模型，或使用支持 image_url/data URL 的第二 API。`,
          },
        ];
      }
    }
  }

  return [
    {
      type: 'system',
      time: fallbackTime,
      text: '对方暂时没有回复，请稍后重试。',
    },
  ];
}

function imageFileExtension(mimeType: string): string {
  const subtype = safeString(mimeType).split('/')[1] || 'png';
  if (subtype === 'jpeg') return 'jpg';
  if (/^[a-z0-9]+$/i.test(subtype)) return subtype.toLowerCase();
  return 'png';
}

function getPromptVisibleUserImageMessages(messages: BackstreetMessage[]): BackstreetMessage[] {
  return messages.filter(isPromptVisibleUserImageMessage);
}

async function buildInlineImageFile(message: BackstreetMessage): Promise<File | string> {
  const ref = safeString(message.imageRef);
  if (!ref) throw new Error('图片附件缺少引用，无法发送给小手机 AI');
  if (!isIndexedImageRef(ref) && (/^https?:\/\//i.test(ref) || /^data:image\//i.test(ref))) return ref;
  const blob = await getIndexedImageBlob(ref).catch(() => null);
  if (!blob) throw new Error('图片附件读取失败，无法发送给小手机 AI');
  const type = blob.type || 'image/png';
  const extension = imageFileExtension(type);
  return new File([blob], `${message.id || 'backstreet-image'}.${extension}`, { type });
}

async function buildInlineImagesForPrompt(
  messages: BackstreetMessage[],
): Promise<{ images: (File | string)[]; refs: Set<string> }> {
  const generationSettings = loadBackstreetGenerationSettings();
  const promptImageMessages =
    generationSettings.maxUserImagesInPrompt > 0
      ? getPromptVisibleUserImageMessages(messages).slice(-generationSettings.maxUserImagesInPrompt)
      : [];
  const images: (File | string)[] = [];
  const refs = new Set<string>();

  for (const message of promptImageMessages) {
    const ref = safeString(message.imageRef);
    if (!ref) continue;
    images.push(await buildInlineImageFile(message));
    refs.add(ref);
  }

  return { images, refs };
}

function normalizeAppendImageRefs(options: AppendUserMessageOptions): string[] {
  const refs = uniqueStrings(
    [...(Array.isArray(options.imageRefs) ? options.imageRefs : []), options.imageRef].filter(Boolean),
  );
  const generationSettings = loadBackstreetGenerationSettings();
  if (refs.length > generationSettings.maxUserImagesPerSend) {
    throw new Error(`单次最多只能发送 ${generationSettings.maxUserImagesPerSend} 张图片`);
  }
  return refs;
}

function buildGroupMemberPrivateHistory(
  threads: BackstreetThreadData[],
  members: string[],
  messageLimit: number,
): string {
  if (messageLimit <= 0) return '';
  const memberNames = normalizeList(members, 24);
  if (memberNames.length === 0) return '';

  const memberPrivateThreads = threads
    .filter(thread => thread.kind !== 'group')
    .map(thread => ({
      thread,
      matches: memberNames.filter(member => isSameCharacter(member, thread.contact)),
    }))
    .filter(item => item.matches.length > 0)
    .sort((left, right) => {
      const leftIndex = memberNames.findIndex(member => left.matches.some(match => isSameCharacter(member, match)));
      const rightIndex = memberNames.findIndex(member => right.matches.some(match => isSameCharacter(member, match)));
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;
      return Number(right.thread.updatedAt || 0) - Number(left.thread.updatedAt || 0);
    })
    .slice(0, memberNames.length);

  const blocks = memberPrivateThreads
    .map(item => {
      const messages = getRoleplayMessages(item.thread).slice(-messageLimit);
      return messages.length > 0
        ? formatThreadBlock(item.thread, messages, `群成员私聊参考：${item.matches.join('、')}｜非群内公开`)
        : '';
    })
    .filter(Boolean);

  if (blocks.length === 0) return '';
  return `【群成员相关私聊记录｜仅供关系与记忆参考，默认不是群内公开信息】\n${blocks.join('\n\n')}`;
}

function buildPrivateContactGroupHistory(
  threads: BackstreetThreadData[],
  contact: string,
  messageLimit: number,
  threadLimit: number,
  groupMemberLimit: number,
): string {
  const contactName = safeString(contact);
  if (!contactName || contactName === '群聊' || messageLimit <= 0 || threadLimit <= 0) return '';

  const groupThreads = threads
    .filter(
      thread =>
        thread.kind === 'group' &&
        normalizeList(thread.members, groupMemberLimit).some(member => isSameCharacter(member, contactName)),
    )
    .sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0))
    .slice(0, threadLimit);

  const blocks = groupThreads
    .map(thread => {
      const messages = getRoleplayMessages(thread).slice(-messageLimit);
      return messages.length > 0 ? formatThreadBlock(thread, messages, `私聊对象参与群聊参考：${contactName}`) : '';
    })
    .filter(Boolean);

  if (blocks.length === 0) return '';
  return `【私聊对象相关群聊记录｜${contactName}参与过的后街群聊】\n${blocks.join('\n\n')}`;
}

function shouldAllowNovelAiIllustration(settings: NovelAiImageSettings): { allowImage: boolean; reason: string } {
  const status = getNovelAiImageStatus(settings);
  if (!status.ready) return { allowImage: false, reason: status.reason };
  return { allowImage: true, reason: 'NovelAI 生图模式已开启，本轮始终允许 AI 根据上下文自行判断是否输出 image' };
}

function buildDisabledNovelAiIllustrationInstruction(reason: string): string {
  return `【后街插图规则】
NovelAI 生图模式已开启，但本轮不允许输出 image 项。
原因：${reason}
本轮必须只输出 text 消息；不要空回，不要解释插图规则，不要把本段内容复述进聊天。`;
}

function buildIllustrationStateForThread(
  thread: BackstreetThreadData,
  characterData: any,
  settings: NovelAiImageSettings,
  groupMemberLimit = 24,
): NovelAiIllustrationState {
  const status = getNovelAiImageStatus(settings);
  if (!status.ready) {
    return { enabled: false, allowImage: false, reason: status.reason, instruction: '' };
  }

  const decision = shouldAllowNovelAiIllustration(settings);
  if (!decision.allowImage) {
    return {
      enabled: true,
      allowImage: false,
      reason: decision.reason,
      instruction: buildDisabledNovelAiIllustrationInstruction(decision.reason),
    };
  }

  const instruction = buildNovelAiIllustrationInstruction(
    {
      contact: getThreadDisplayName(thread),
      members: thread.kind === 'group' ? normalizeList(thread.members, groupMemberLimit) : [],
      location: `${safeString(characterData?.位置系统?.地点名称)} ${safeString(characterData?.位置系统?.坐标)}`.trim(),
      time: getCurrentTime(characterData),
      isGroup: thread.kind === 'group',
    },
    settings,
  );
  return {
    enabled: true,
    allowImage: true,
    reason: decision.reason,
    instruction: `【后街插图规则】
本轮插图状态：本轮允许输出 1 个 image 项。
允许原因：${decision.reason}

${instruction}`,
  };
}

function logNovelAiIllustrationState(thread: BackstreetThreadData, state: NovelAiIllustrationState): void {
  if (!state.enabled) return;
  console.info(`[后街] NovelAI 插图规则已并入系统提示词：${getThreadDisplayName(thread)}`, {
    allowImage: state.allowImage,
    reason: state.reason,
  });
}

export class BackstreetService {
  private async enforceUserImagePromptLimit(
    contact: string,
    thread: BackstreetThreadData,
  ): Promise<BackstreetThreadData> {
    const visibleImages = getPromptVisibleUserImageMessages(thread.messages);
    const generationSettings = loadBackstreetGenerationSettings();
    const overflowCount = visibleImages.length - generationSettings.maxUserImagesInPrompt;
    if (overflowCount <= 0) return thread;

    let nextThread = thread;
    for (const message of visibleImages.slice(0, overflowCount)) {
      nextThread = await backstreetWorldbookStore.replaceMessage(contact, message.id, {
        ...message,
        imageHiddenFromPrompt: true,
      });
    }
    return nextThread;
  }

  async ensureReady(): Promise<void> {
    await backstreetWorldbookStore.ensureReady();
  }

  async listContacts(characterData: any): Promise<BackstreetContact[]> {
    return backstreetWorldbookStore.listContacts(characterData);
  }

  async createGroup(name: string, members: string[]): Promise<BackstreetContact> {
    await backstreetWorldbookStore.ensureReady();
    return backstreetWorldbookStore.createGroup(name, members);
  }

  async addGroupMembers(contact: string, members: string[], characterData: any): Promise<BackstreetMessage[]> {
    const thread = await backstreetWorldbookStore.addGroupMembers(
      contact,
      members,
      getCurrentDate(characterData),
      getCurrentTime(characterData),
    );
    return thread.messages;
  }

  async removeGroupMember(contact: string, member: string, characterData: any): Promise<BackstreetMessage[]> {
    const thread = await backstreetWorldbookStore.removeGroupMember(
      contact,
      member,
      getCurrentDate(characterData),
      getCurrentTime(characterData),
    );
    return thread.messages;
  }

  async dissolveGroup(contact: string, characterData: any): Promise<BackstreetMessage[]> {
    const thread = await backstreetWorldbookStore.dissolveGroup(
      contact,
      getCurrentDate(characterData),
      getCurrentTime(characterData),
    );
    return thread.messages;
  }

  async getMessages(contact: string): Promise<BackstreetMessage[]> {
    const thread = await backstreetWorldbookStore.getThread(contact);
    return thread.messages;
  }

  async appendUserMessage(
    contact: string,
    text: string,
    characterData: any,
    options: AppendUserMessageOptions = {},
  ): Promise<BackstreetMessage> {
    const thread = await backstreetWorldbookStore.getThread(contact);
    if (thread.kind === 'group' && thread.dissolved) throw new Error('群聊已解散，不能继续发送消息');
    const currentDate = getCurrentDate(characterData);
    const currentTime = getCurrentTime(characterData);
    const messageText = safeString(text);
    const imageRefs = normalizeAppendImageRefs(options);
    if (!messageText && imageRefs.length === 0) {
      throw new Error('不能发送空消息');
    }
    const userMessages: BackstreetMessage[] =
      imageRefs.length > 0
        ? imageRefs.map((imageRef, index) => ({
            id: makeId('bst_user_img'),
            sender: 'user',
            kind: 'image',
            date: currentDate,
            time: currentTime,
            text: index === 0 ? messageText : '',
            imageRef,
            imageSource: 'user',
            imageHiddenFromPrompt: options.imageHiddenFromPrompt || undefined,
            createdAt: Date.now() + index,
          }))
        : [
            {
              id: makeId('bst_user'),
              sender: 'user',
              kind: 'text',
              date: currentDate,
              time: currentTime,
              text: messageText,
              createdAt: Date.now(),
            },
          ];

    const nextThread = await backstreetWorldbookStore.appendMessages(contact, userMessages);
    await this.enforceUserImagePromptLimit(contact, nextThread);
    return userMessages[0];
  }

  async generateContactReply(contact: string, characterData: any): Promise<BackstreetMessage[]> {
    let thread = await backstreetWorldbookStore.getThread(contact);
    if (thread.kind === 'group' && thread.dissolved) throw new Error('群聊已解散，不能继续生成回复');
    thread = await this.enforceUserImagePromptLimit(contact, thread);
    const replies =
      thread.kind === 'group'
        ? await this.generateGroupReply(thread, characterData)
        : await this.generateReply(contact, thread.messages, characterData);
    const persistentReplies = replies.filter(reply => reply.sender === 'contact' || reply.sender === 'system');
    if (persistentReplies.length > 0) {
      await backstreetWorldbookStore.appendMessages(contact, persistentReplies);
    }
    return replies;
  }

  async setUserImagePromptHidden(contact: string, messageId: string, hidden: boolean): Promise<BackstreetMessage[]> {
    const thread = await backstreetWorldbookStore.getThread(contact);
    const message = thread.messages.find(item => item.id === messageId);
    if (!message || message.sender !== 'user' || !isImageMessage(message) || !safeString(message.imageRef)) {
      throw new Error('未找到可设置的用户图片消息');
    }

    let nextThread = await backstreetWorldbookStore.replaceMessage(contact, messageId, {
      ...message,
      imageHiddenFromPrompt: hidden || undefined,
    });
    if (!hidden) nextThread = await this.enforceUserImagePromptLimit(contact, nextThread);
    return nextThread.messages;
  }

  async deleteMessage(contact: string, messageId: string): Promise<BackstreetMessage[]> {
    const thread = await backstreetWorldbookStore.deleteMessage(contact, messageId);
    return thread.messages;
  }

  async deleteMessagesAfter(contact: string, messageId: string): Promise<BackstreetMessage[]> {
    const thread = await backstreetWorldbookStore.deleteMessagesAfter(contact, messageId);
    return thread.messages;
  }

  async rerollImageMessage(contact: string, messageId: string): Promise<BackstreetMessage[]> {
    const thread = await backstreetWorldbookStore.getThread(contact);
    const message = thread.messages.find(item => item.id === messageId);
    if (!message || !isImageMessage(message)) throw new Error('未找到可重 roll 的图片消息');
    if (message.imageSource !== 'novelai' || !safeString(message.imagePrompt)) {
      throw new Error('只有 NovelAI 生成的图片可以重 roll');
    }

    const previousRef = safeString(message.imageRef);
    const shouldReplaceFailureText =
      Boolean(safeString(message.imageError)) && safeString(message.text).startsWith('插图生成失败：');
    const image = await generateNovelAiImage(message.imagePrompt || '', undefined, { applyPrefix: false });
    const nextMessage: BackstreetMessage = {
      ...message,
      kind: 'image',
      text: shouldReplaceFailureText ? '图片' : message.text,
      imageRef: image.ref,
      imagePrompt: image.prompt,
      imageNegativePrompt: image.negativePrompt,
      imageSource: 'novelai',
      imageError: undefined,
      createdAt: Date.now(),
    };

    const nextThread = await backstreetWorldbookStore.replaceMessage(contact, messageId, nextMessage);
    if (previousRef && previousRef !== image.ref) {
      void deleteIndexedImage(previousRef).catch(() => undefined);
    }
    return nextThread.messages;
  }

  async sendMessage(
    contact: string,
    text: string,
    characterData: any,
    options: AppendUserMessageOptions = {},
  ): Promise<SendBackstreetResult> {
    const userMessage = await this.appendUserMessage(contact, text, characterData, options);
    const replies = await this.generateContactReply(contact, characterData);
    return { userMessage, replies };
  }

  async buildMainChatInjection(_promptMessages: unknown[]): Promise<string> {
    const settings = readBackstreetMainInjectionSettings();
    if (settings.presentPrivateLimit <= 0 && settings.presentGroupLimit <= 0 && settings.globalRecentLimit <= 0) {
      return '';
    }

    const statData = await getLatestStatData().catch(() => null);
    const presentNames = getPresentNames(statData);
    const threads = await backstreetWorldbookStore.listRawThreads({ force: true });
    return buildFixedMainInjection(threads, presentNames, settings);
  }

  private normalizeGroupSpeaker(speaker: string, members: string[]): string {
    const normalizedSpeaker = normalizeName(speaker);
    return members.find(member => normalizeName(member) === normalizedSpeaker) || members[0] || '群成员';
  }

  private async materializeParsedReplies(
    parsedReplies: ParsedBackstreetReply[],
    options: MaterializeReplyOptions,
  ): Promise<BackstreetMessage[]> {
    const messages: BackstreetMessage[] = [];
    for (const reply of parsedReplies) {
      const createdAt = Date.now() + messages.length;
      const speaker = options.members?.length
        ? this.normalizeGroupSpeaker(reply.speaker || '', options.members)
        : undefined;

      if (reply.type === 'image') {
        try {
          const image = await generateNovelAiImage(reply.prompt || '');
          messages.push({
            id: makeId('bst_contact_img'),
            sender: 'contact',
            kind: 'image',
            speaker,
            date: options.fallbackDate,
            time: options.fallbackTime,
            text: safeString(reply.text) || '图片',
            imageRef: image.ref,
            imagePrompt: image.prompt,
            imageNegativePrompt: image.negativePrompt,
            imageSource: 'novelai',
            createdAt,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'NovelAI 生图失败';
          console.error('[后街] NovelAI 插图生成失败:', error);
          messages.push({
            id: makeId('bst_img_error'),
            sender: 'system',
            kind: 'image',
            speaker: '系统',
            date: options.fallbackDate,
            time: options.fallbackTime,
            text: `插图生成失败：${message}`,
            imagePrompt: safeString(reply.prompt),
            imageSource: 'novelai',
            imageError: message,
            createdAt,
          });
        }
        continue;
      }

      messages.push({
        id: makeId(options.members?.length ? 'bst_group_contact' : 'bst_contact'),
        sender: reply.type === 'system' ? 'system' : 'contact',
        kind: 'text',
        speaker,
        date: options.fallbackDate,
        time: options.fallbackTime,
        text: reply.text,
        createdAt,
      });
    }
    return messages;
  }

  private async generateGroupReply(thread: BackstreetThreadData, characterData: any): Promise<BackstreetMessage[]> {
    const groupName = getThreadDisplayName(thread);
    const generationSettings = loadBackstreetGenerationSettings();
    const members = normalizeList(thread.members, generationSettings.groupMemberLimit);
    if (thread.dissolved) throw new Error('群聊已解散，不能继续生成回复');
    if (members.length === 0) throw new Error('群聊没有可回复的成员');
    const latestUserMessageObject = thread.messages.filter(message => message.sender === 'user').at(-1);
    const userImagePromptState = await buildInlineImagesForPrompt(thread.messages);
    const latestUserMessage = latestUserMessageObject
      ? formatMessageTextForPrompt(latestUserMessageObject, {
          inlineImageAttached: isMessageInlineAttached(latestUserMessageObject, userImagePromptState.refs),
        })
      : '';
    const locationText = `${safeString(characterData?.位置系统?.地点名称)} ${safeString(characterData?.位置系统?.坐标)}`;
    const keywordQuery = extractFallbackQuery(
      `${groupName}\n${members.join('\n')}\n${latestUserMessage}\n${locationText}`,
      6,
    );
    const query = normalizePhoneMemoryQuery({
      characters: members,
      keywords: uniqueStrings([groupName, ...members, ...keywordQuery.keywords]),
      locations: [safeString(characterData?.位置系统?.地点名称), safeString(characterData?.位置系统?.坐标)],
      limit: generationSettings.groupArchiveMemoryCount,
    });

    const [archiveHits, loreContexts, rawThreads] = await Promise.all([
      backstreetWorldbookStore.searchArchiveMemory(query),
      Promise.all(
        members
          .slice(0, generationSettings.groupLoreMemberCount)
          .map(member => phoneLoreContextBuilder.build({ contact: member, characterData }).catch(() => '')),
      ),
      backstreetWorldbookStore.listRawThreads({ force: true }),
    ]);
    const whitelistLoreContext = uniqueStrings(loreContexts.filter(Boolean)).join('\n\n');
    const groupMemberPrivateHistory = buildGroupMemberPrivateHistory(
      rawThreads,
      members,
      generationSettings.groupMemberPrivateHistoryCount,
    );
    const mainSceneSnapshot = buildMainSceneSnapshot(characterData, {
      includeRecentChat: true,
      recentChatLimit: generationSettings.mainRecentChatCount,
    });
    const historyMessages = thread.messages.filter(shouldIncludeMessageInPrompt);
    const historyText = formatThreadMessagesForPrompt(thread, historyMessages, generationSettings.groupHistoryCount, {
      inlineImageRefs: userImagePromptState.refs,
    });
    const novelAiImageSettings = loadNovelAiImageSettings();
    const illustrationState = buildIllustrationStateForThread(
      thread,
      characterData,
      novelAiImageSettings,
      generationSettings.groupMemberLimit,
    );
    logNovelAiIllustrationState(thread, illustrationState);
    const outputSchema = buildBackstreetOutputSchema({
      allowImage: illustrationState.allowImage,
      sampleSpeaker: members[0] || '群成员',
    });

    const systemPrompt = renderBackstreetPromptTemplate(generationSettings.groupSystemPromptTemplate, {
      contact: groupName,
      groupName,
      members,
      adultRules: BACKSTREET_ADULT_ROLEPLAY_RULES,
      illustrationInstruction: illustrationState.instruction,
      outputSchema,
      playerName: PLAYER_NAME_MACRO,
    });

    const phoneContext = `${whitelistLoreContext || '【后街白名单世界书】暂无可用条目'}

${mainSceneSnapshot}

【后街当前群聊】
${historyText || '暂无'}

${groupMemberPrivateHistory || '【群成员相关私聊记录】暂无'}

${formatMemoryHits(archiveHits, '筛选的过往后街群聊记录') || '【筛选的过往后街群聊记录】暂无'}`;

    const userPrompt = `当前时间：${getCurrentTime(characterData)}
当前位置：${safeString(characterData?.位置系统?.地点名称) || '未知'} ${safeString(characterData?.位置系统?.坐标)}

${PLAYER_NAME_MACRO}刚刚在群里发送：
${latestUserMessage}

请生成群聊「${groupName}」接下来的回复。`;

    const fallbackTime = getCurrentTime(characterData);
    const fallbackDate = getCurrentDate(characterData);
    const parsedReplies = await requestBackstreetReplyWithRecovery(
      groupName,
      [
        { role: 'system', content: systemPrompt, name: 'SYSTEM (后街群聊规则)' },
        { role: 'system', content: phoneContext, name: 'SYSTEM (后街群聊资料)' },
        { role: 'user', content: userPrompt, images: userImagePromptState.images },
      ],
      fallbackTime,
      { allowedSpeakers: members, allowImage: illustrationState.allowImage },
    );
    return this.materializeParsedReplies(parsedReplies, {
      contact: thread.contact,
      fallbackDate,
      fallbackTime,
      members,
    });
  }

  private async generateReply(
    contact: string,
    messages: BackstreetMessage[],
    characterData: any,
  ): Promise<BackstreetMessage[]> {
    const contactName = getPrivatePromptName(contact);
    const generationSettings = loadBackstreetGenerationSettings();
    const latestUserMessageObject = messages.filter(message => message.sender === 'user').at(-1);
    const userImagePromptState = await buildInlineImagesForPrompt(messages);
    const latestUserMessage = latestUserMessageObject
      ? formatMessageTextForPrompt(latestUserMessageObject, {
          inlineImageAttached: isMessageInlineAttached(latestUserMessageObject, userImagePromptState.refs),
        })
      : '';
    const locationText = `${safeString(characterData?.位置系统?.地点名称)} ${safeString(characterData?.位置系统?.坐标)}`;
    const keywordQuery = extractFallbackQuery(`${contactName}\n${latestUserMessage}\n${locationText}`, 5);
    const query = normalizePhoneMemoryQuery({
      characters: contactName === '群聊' ? [] : [contactName],
      keywords: uniqueStrings([contactName, ...keywordQuery.keywords]),
      locations: [safeString(characterData?.位置系统?.地点名称), safeString(characterData?.位置系统?.坐标)],
      limit: generationSettings.privateArchiveMemoryCount,
    });

    const [archiveHits, whitelistLoreContext, rawThreads] = await Promise.all([
      backstreetWorldbookStore.searchArchiveMemory(query),
      phoneLoreContextBuilder.build({ contact: contactName, characterData }),
      backstreetWorldbookStore.listRawThreads({ force: true }),
    ]);
    const relatedGroupHistory = buildPrivateContactGroupHistory(
      rawThreads,
      contactName,
      generationSettings.privateContactGroupHistoryCount,
      generationSettings.privateContactGroupThreadCount,
      generationSettings.groupMemberLimit,
    );
    const mainSceneSnapshot = buildMainSceneSnapshot(characterData, {
      includeRecentChat: true,
      recentChatLimit: generationSettings.mainRecentChatCount,
    });

    const threadForIllustration: BackstreetThreadData = {
      contact,
      kind: 'private',
      updatedAt: Date.now(),
      messages,
    };
    const historyMessages = messages.filter(
      message => message.sender !== 'system' && shouldIncludeMessageInPrompt(message),
    );
    const historyText = formatThreadMessagesForPrompt(
      threadForIllustration,
      historyMessages,
      generationSettings.privateHistoryCount,
      {
        inlineImageRefs: userImagePromptState.refs,
      },
    );
    const novelAiImageSettings = loadNovelAiImageSettings();
    const illustrationState = buildIllustrationStateForThread(
      threadForIllustration,
      characterData,
      novelAiImageSettings,
    );
    logNovelAiIllustrationState(threadForIllustration, illustrationState);
    const outputSchema = buildBackstreetOutputSchema({ allowImage: illustrationState.allowImage });

    const systemPrompt = renderBackstreetPromptTemplate(generationSettings.privateSystemPromptTemplate, {
      contact: contactName,
      adultRules: BACKSTREET_ADULT_ROLEPLAY_RULES,
      illustrationInstruction: illustrationState.instruction,
      outputSchema,
      playerName: PLAYER_NAME_MACRO,
    });

    const phoneContext = `${whitelistLoreContext}

${mainSceneSnapshot}

【后街当前会话】
${historyText || '暂无'}

${relatedGroupHistory || '【私聊对象相关群聊记录】暂无'}

${formatMemoryHits(archiveHits, '筛选的过往后街聊天记录') || '【筛选的过往后街聊天记录】暂无'}`;

    const userPrompt = `当前时间：${getCurrentTime(characterData)}
当前位置：${safeString(characterData?.位置系统?.地点名称) || '未知'} ${safeString(characterData?.位置系统?.坐标)}

${PLAYER_NAME_MACRO}刚刚发送：
${latestUserMessage}

请生成「${contactName}」接下来的后街回复。`;

    const fallbackTime = getCurrentTime(characterData);
    const fallbackDate = getCurrentDate(characterData);
    const parsedReplies = await requestBackstreetReplyWithRecovery(
      contactName,
      [
        { role: 'system', content: systemPrompt, name: 'SYSTEM (后街规则)' },
        { role: 'system', content: phoneContext, name: 'SYSTEM (后街资料)' },
        { role: 'user', content: userPrompt, images: userImagePromptState.images },
      ],
      fallbackTime,
      { allowImage: illustrationState.allowImage },
    );
    return this.materializeParsedReplies(parsedReplies, {
      contact,
      fallbackDate,
      fallbackTime,
    });
  }
}

export const backstreetService = new BackstreetService();
