import { safeString } from './text';

export type NovelAiImageSizePreset = 'portrait' | 'landscape' | 'square' | 'small_square';

export interface NovelAiImageSettings {
  enabled: boolean;
  apiBaseUrl: string;
  apiKey: string;
  model: string;
  sizePreset: NovelAiImageSizePreset;
  steps: number;
  scale: number;
  positivePromptPrefix: string;
  negativePrompt: string;
  promptTemplate: string;
}

export interface NovelAiImageSizeOption {
  value: NovelAiImageSizePreset;
  label: string;
  width: number;
  height: number;
}

export interface NovelAiIllustrationTemplateContext {
  contact: string;
  members?: string[];
  location?: string;
  time?: string;
  isGroup?: boolean;
}

const NOVELAI_IMAGE_STORAGE_KEY = 'fatria-backstreet-novelai-image-v1';
const NOVELAI_IMAGE_GLOBAL_KEY = '__fatriaBackstreetNovelAiImageSettings';
export const NOVELAI_IMAGE_UPDATED_EVENT = 'fatria-backstreet-novelai-image-updated';
export const OFFICIAL_NOVELAI_IMAGE_API_BASE_URL = 'https://image.novelai.net';
export const NOVELAI_IMAGE_SCALE_MAX = 10;

export const NOVELAI_IMAGE_SIZE_OPTIONS: NovelAiImageSizeOption[] = [
  { value: 'portrait', label: '竖版 (832x1216)', width: 832, height: 1216 },
  { value: 'landscape', label: '横版 (1216x832)', width: 1216, height: 832 },
  { value: 'square', label: '方形 (1024x1024)', width: 1024, height: 1024 },
  { value: 'small_square', label: '小方形 (640x640)', width: 640, height: 640 },
];

export const NOVELAI_IMAGE_MODEL_OPTIONS = [
  'nai-diffusion-4-5-curated',
  'nai-diffusion-4-5-full',
  'nai-diffusion-5-curated',
  'nai-diffusion-5-full',
];

const LEGACY_POSITIVE_PROMPT_PREFIX = 'best quality, amazing quality, very aesthetic, anime style, detailed,';
const DEFAULT_POSITIVE_PROMPT_PREFIX =
  'artist:anmi,artist:lpip,{artist:kantoku},[artist:tiv],artist:hiten_(hitenkei),artist:fuzichoco, best quality, amazing quality, very aesthetic, anime style, detailed,';

const DEFAULT_PROMPT_TEMPLATE = `【后街插图生成说明】
本轮允许你在适当时机为后街聊天附加 1 张 NovelAI 插图提示词。
只有当刚刚的聊天形成明确、值得保存的画面时才生成；普通寒暄、重复表情包、没有画面重点时不要生成。
如果生成插图，请在 <backstreet> 数组中追加一项：
{"type":"image","text":"图片在聊天里附带的短句或说明","prompt":"English NovelAI prompt/tags only, comma-separated."}
群聊中如果生成插图，image 项也必须包含 "speaker"，且 speaker 必须是发送图片的群成员姓名。

选景优先级：
1. 最高：如果当前聊天提到照片、自拍、视频、直播、截图、监控画面或用户刚发送的图片，生成该媒体内容中最值得展示的成人角色场景。
2. 次高：如果当前聊天正在描述成人亲密、挑逗、裸露或性爱过程，生成其中最有画面冲击力的一瞬间。
3. 中等：如果没有明确媒体或 NSFW 场景，生成当前回复里角色表情、身体动作、服装状态、距离感最精彩的画面。
4. 最低：如果只是日常剧情但有明确场景，生成最能代表本轮情绪和关系进展的画面。

prompt 生成规则：
- prompt 必须使用英文 NovelAI/Danbooru 风格 tag，始终用英文逗号分隔，不要写中文、句子、解释或换行。
- 一轮最多 1 张，必须像角色真实发出的照片、自拍、截图、插图分享或聊天中的场景图。
- 禁止生成单独男性图片；如果画面有人物，至少包含 1 位成年女性。
- prompt 只写画面，不要写聊天气泡、手机界面、文字、水印、logo、签名、UI。
- prompt 应包含人物数量构成、地点、时间/光照、镜头、构图、表情、姿势、服装、身体特征、角色互动与关键道具。
- 可用构图与镜头 tag：close-up, upper body, lower body, full body, from above, from below, pov, looking at viewer, dutch angle, depth of field, cinematic lighting, backlighting, indoors, outdoors, bedroom, bathroom, classroom, alley, night, morning。
- 可用人物与状态 tag：1girl, 1boy, 2girls, 1girl 1boy, mature female, adult, long hair, short hair, hair ornament, detailed eyes, blush, embarrassed, smirk, seductive smile, sweat, heavy breathing, torn clothes, lingerie, open clothes, see-through, wet clothes。
- 如果场景含裸露、性器官、性爱、口交、自慰、体液或明显色情行为，prompt 必须以 "nsfw," 开头，并加入合适的成人 NSFW tag，例如 nude, nipples, pussy, partially visible vulva, sex, imminent sex, clothed sex, after sex, missionary, cowgirl position, doggystyle, paizuri, fellatio, cunnilingus, fingering, handjob, footjob, cum, facial, cum on body, bondage, femdom, bdsm。只在剧情确实需要时使用。
- 禁止使用非自愿、未成年、血腥肢解、排泄、兽交等极端标签，例如 rape, non-consensual, guro, mutilation, scat, bestiality。
- 多人互动时可以用 source/target 风格 tag 表达关系，例如 {source#hug}, {target#hug}, {source#hands on another's face}, {target#hands on another's face}，但不要让格式压过画面本身。

规则：
- 不要为了生图破坏 <backstreet> JSON 格式；image 必须是数组中的一个 JSON 对象。
- image.text 写成角色会在聊天里附带的短句，不要复述 prompt。
- image.prompt 不要包含正面提示词前缀；系统会自动把前缀加到 prompt 前方。

当前会话：{{contact}}
群成员：{{members}}
当前时间：{{time}}
当前位置：{{location}}
正面提示词前缀会由系统自动加在 prompt 前方：{{positive_prefix}}
负向提示词会由系统另行发送给 NovelAI：{{negative_prompt}}`;

export const DEFAULT_NOVELAI_IMAGE_SETTINGS: NovelAiImageSettings = {
  enabled: false,
  apiBaseUrl: OFFICIAL_NOVELAI_IMAGE_API_BASE_URL,
  apiKey: '',
  model: 'nai-diffusion-4-5-full',
  sizePreset: 'portrait',
  steps: 28,
  scale: 7,
  positivePromptPrefix: DEFAULT_POSITIVE_PROMPT_PREFIX,
  negativePrompt:
    'lowres, bad anatomy, bad hands, missing fingers, extra digits, fewer digits, cropped, worst quality, low quality, jpeg artifacts, signature, watermark, username, blurry',
  promptTemplate: DEFAULT_PROMPT_TEMPLATE,
};

function getWindowOrNull(): Window | null {
  return typeof window !== 'undefined' ? window : null;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, numericValue));
}

function isSizePreset(value: unknown): value is NovelAiImageSizePreset {
  return NOVELAI_IMAGE_SIZE_OPTIONS.some(option => option.value === value);
}

function normalizeApiKey(value: string): string {
  return safeString(value).replace(/^Bearer\s+/i, '');
}

export function normalizeNovelAiImageApiBaseUrl(value: unknown): string {
  const text = safeString(value).replace(/\/+$/g, '');
  return text || OFFICIAL_NOVELAI_IMAGE_API_BASE_URL;
}

function normalizePositivePromptPrefix(value: unknown): string {
  const text = safeString(value);
  if (!text || text === LEGACY_POSITIVE_PROMPT_PREFIX) return DEFAULT_NOVELAI_IMAGE_SETTINGS.positivePromptPrefix;
  return text;
}

function normalizePromptTemplate(value: unknown): string {
  const text = safeString(value);
  if (!text) return DEFAULT_NOVELAI_IMAGE_SETTINGS.promptTemplate;
  const looksLikeLegacyDefault =
    text.includes('本轮允许你在适当时机为后街聊天附加 1 张插图提示词。') &&
    text.includes(
      'Describe adult character(s), appearance, pose, expression, clothes, lighting, background, camera angle.',
    );
  return looksLikeLegacyDefault ? DEFAULT_NOVELAI_IMAGE_SETTINGS.promptTemplate : text;
}

function normalizeSettings(settings: Partial<NovelAiImageSettings> | null | undefined): NovelAiImageSettings {
  const sizePreset = isSizePreset(settings?.sizePreset)
    ? settings.sizePreset
    : DEFAULT_NOVELAI_IMAGE_SETTINGS.sizePreset;
  const model = safeString(settings?.model);
  return {
    enabled: Boolean(settings?.enabled),
    apiBaseUrl: normalizeNovelAiImageApiBaseUrl(settings?.apiBaseUrl),
    apiKey: normalizeApiKey(safeString(settings?.apiKey)),
    model: NOVELAI_IMAGE_MODEL_OPTIONS.includes(model) ? model : DEFAULT_NOVELAI_IMAGE_SETTINGS.model,
    sizePreset,
    steps: Math.round(clampNumber(settings?.steps, 1, 28, DEFAULT_NOVELAI_IMAGE_SETTINGS.steps)),
    scale: clampNumber(settings?.scale, 1, NOVELAI_IMAGE_SCALE_MAX, DEFAULT_NOVELAI_IMAGE_SETTINGS.scale),
    positivePromptPrefix: normalizePositivePromptPrefix(settings?.positivePromptPrefix),
    negativePrompt: safeString(settings?.negativePrompt) || DEFAULT_NOVELAI_IMAGE_SETTINGS.negativePrompt,
    promptTemplate: normalizePromptTemplate(settings?.promptTemplate),
  };
}

function readGlobalSettings(): NovelAiImageSettings | null {
  const win = getWindowOrNull() as any;
  const value = win?.[NOVELAI_IMAGE_GLOBAL_KEY];
  if (!value || typeof value !== 'object') return null;
  return normalizeSettings(value as Partial<NovelAiImageSettings>);
}

function writeGlobalSettings(settings: NovelAiImageSettings): void {
  const win = getWindowOrNull() as any;
  if (!win) return;
  win[NOVELAI_IMAGE_GLOBAL_KEY] = normalizeSettings(settings);
}

function readLocalSettings(): NovelAiImageSettings | null {
  const win = getWindowOrNull();
  try {
    const raw = win?.localStorage?.getItem(NOVELAI_IMAGE_STORAGE_KEY);
    if (!raw) return null;
    return normalizeSettings(JSON.parse(raw) as Partial<NovelAiImageSettings>);
  } catch {
    return null;
  }
}

export function loadNovelAiImageSettings(): NovelAiImageSettings {
  const localSettings = readLocalSettings();
  if (localSettings) {
    writeGlobalSettings(localSettings);
    return localSettings;
  }

  const globalSettings = readGlobalSettings();
  if (globalSettings) return globalSettings;

  return { ...DEFAULT_NOVELAI_IMAGE_SETTINGS };
}

export function saveNovelAiImageSettings(settings: NovelAiImageSettings): void {
  const normalized = normalizeSettings(settings);
  writeGlobalSettings(normalized);
  try {
    getWindowOrNull()?.localStorage?.setItem(NOVELAI_IMAGE_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // localStorage 不可用时保持本次页面运行态即可。
  }
  getWindowOrNull()?.dispatchEvent(new CustomEvent(NOVELAI_IMAGE_UPDATED_EVENT, { detail: normalized }));
}

export function getNovelAiImageSize(settings = loadNovelAiImageSettings()): NovelAiImageSizeOption {
  return (
    NOVELAI_IMAGE_SIZE_OPTIONS.find(option => option.value === settings.sizePreset) || NOVELAI_IMAGE_SIZE_OPTIONS[0]
  );
}

export function isNovelAiImageReady(settings = loadNovelAiImageSettings()): boolean {
  return Boolean(settings.enabled && safeString(settings.apiKey) && safeString(settings.model));
}

export function getNovelAiImageStatus(settings = loadNovelAiImageSettings()): {
  ready: boolean;
  settings: NovelAiImageSettings;
  reason: string;
} {
  if (!settings.enabled) return { ready: false, settings, reason: '未启用 NovelAI 生图' };
  if (!safeString(settings.apiBaseUrl)) return { ready: false, settings, reason: '未填写 NovelAI 接口地址' };
  if (!safeString(settings.apiKey)) return { ready: false, settings, reason: '未填写 NovelAI API Key' };
  if (!safeString(settings.model)) return { ready: false, settings, reason: '未选择 NovelAI 模型' };
  return { ready: true, settings, reason: 'NovelAI 生图已就绪' };
}

export function buildNovelAiPositivePrompt(prompt: string, settings = loadNovelAiImageSettings()): string {
  return uniqueJoin([settings.positivePromptPrefix, prompt], ', ');
}

export function buildNovelAiIllustrationInstruction(
  context: NovelAiIllustrationTemplateContext,
  settings = loadNovelAiImageSettings(),
): string {
  const replacements: Record<string, string> = {
    contact: safeString(context.contact),
    members: context.members?.length ? context.members.join('、') : '无',
    location: safeString(context.location) || '未知',
    time: safeString(context.time) || '未知',
    positive_prefix: safeString(settings.positivePromptPrefix),
    negative_prompt: safeString(settings.negativePrompt),
    mode: context.isGroup ? 'group' : 'private',
  };

  return safeString(settings.promptTemplate).replace(
    /\{\{\s*(\w+)\s*\}\}/g,
    (_, key: string) => replacements[key] ?? '',
  );
}

function uniqueJoin(values: string[], separator: string): string {
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const text = safeString(value).replace(/^[,\s]+|[,\s]+$/g, '');
    if (!text || seen.has(text)) continue;
    seen.add(text);
    parts.push(text);
  }
  return parts.join(separator);
}
