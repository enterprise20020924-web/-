import type { CharacterData, UserProfile } from '../types';
import { assertPersonaContentClean, isPersonaContentClean } from './personaContentGuard';
import {
  USER_PROFILE_SECTIONS,
  formatUserProfile,
  parseUserProfile,
  personalizeUserInfo,
  readUserProfile,
} from './userProfile';

export type UserInfoGenerationMode = 'ai_plays_user' | 'ai_reads_user';

type GeneratePalettePersonaOptions = {
  mode?: UserInfoGenerationMode;
  onStream?: (previewText: string) => void;
};

export type PalettePersonaGenerationResult = {
  appearance: string;
  background: string;
  palette: string;
  userProfile: UserProfile;
};

const userInfoWritingGuidePrompt = `用户信息成品生成规格

你根据玩家提供的四项素材整理可直接保存的 OC 用户设定。
按以下四个栏目组织正文。
${USER_PROFILE_SECTIONS.map(section => `${section.title}\n${section.hint}`).join('\n\n')}

保留素材里的基础事实和具体想法、选择、行为，使用自然段表达。
缺少的素材可以留空，不编造经历、关系、资源或能力。
场景表达只补充前三项无法表达、且素材中已经明确的具体反应。
正文中的玩家姓名和代称统一写成 <user>，姓名标签也写成“姓名：<user>”。
使用“姓名_基础信息”“姓名_生活结构”“姓名_人物性情”“姓名_场景表达”四对闭合 XML 标签，标签前缀使用输入的姓名。
最终正文只包含成品设定。`;

function stripCodeFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:yaml|yml|xml|html|text|md)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function extractTag(value: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = value.match(new RegExp(`<${escaped}>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
  return stripCodeFence(match?.[1] ?? '');
}

function hasTag(value: string, tag: string): boolean {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<${escaped}>[\\s\\S]*?<\\/${escaped}>`, 'i').test(value);
}

function extractContent(value: string): string {
  const withoutThinking = value.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
  return stripCodeFence(extractTag(withoutThinking, 'content') || withoutThinking);
}

function extractGeneratedText(result: unknown): string {
  if (typeof result === 'string') return result;
  if (!result || typeof result !== 'object') return '';

  const source = result as Record<string, any>;
  return String(
    source.choices?.[0]?.message?.content ??
      source.results?.[0]?.text ??
      source.text ??
      source.content ??
      source.body?.text ??
      source.message ??
      '',
  );
}

function getModeLabel(mode: UserInfoGenerationMode): string {
  return mode === 'ai_plays_user' ? '抢话用户信息' : '不抢话用户信息';
}

function getModeInstruction(mode: UserInfoGenerationMode): string {
  if (mode === 'ai_plays_user') {
    return [
      '这份设定用于 AI 续写玩家的日常口吻与反应。',
      '人物性情写清如何理解事物、为什么如此选择，以及具体如何行动。',
      '场景表达仅整理素材中特意指定的反应，避免复述前三项。',
      '重大关系决定、承诺和不可逆选择仍由玩家作出。',
    ].join('\n');
  }

  return [
    '玩家自行书写自己的台词和行动，AI 根据前三项理解玩家。',
    '场景表达允许留空，已有素材则按玩家原意整理。',
    'AI 只理解和回应玩家，不续写玩家的台词、心理或行动。',
  ].join('\n');
}

const finalUserInfoForbiddenArtifacts = [
  { label: '教程标题', pattern: /写法教程|实操检查清单|常见错误/u },
  { label: '教学分类词', pattern: /抢话党|不抢话党|抢话模式|不抢话模式|抢话用户信息|不抢话用户信息|生成类型/u },
  { label: '结构模板词', pattern: /输出结构|完整结构|核心原则|检查清单|建议栏目|当前目标/u },
  { label: '教程口吻', pattern: /怎么写|这部分|什么意思|看到了吗|回到开头|可使用的成品栏目/u },
  { label: '示例残留', pattern: /例如平时|例如：|如果你的用户信息里写了/u },
  { label: '未生成占位', pattern: /未填写|待补充|你的角色名|（填表）|\(填表\)/u },
  {
    label: '多阶段残留',
    pattern:
      /multistage_persona|stage_early|stage_middle|stage_close|stage_common|多阶段调色盘|EJS|初识期\s*0\s*[~～-]\s*30|熟悉期\s*31\s*[~～-]\s*70|亲近期\s*71\s*[~～-]\s*100/u,
  },
  {
    label: '角色卡任务残留',
    pattern: /role_result|quick_view|角色速览|角色基础信息\s*YAML|角色正式名|aliases|role_name/u,
  },
];

function findFinalUserInfoArtifact(content: string): { label: string; match: string } | null {
  const value = String(content || '');
  for (const artifact of finalUserInfoForbiddenArtifacts) {
    const match = value.match(artifact.pattern)?.[0];
    if (match) {
      return { label: artifact.label, match };
    }
  }
  return null;
}

function assertFinalUserInfoConcrete(content: string): void {
  const hit = findFinalUserInfoArtifact(content);
  if (hit) {
    throw new Error(`用户信息像教程或模板内容：${hit.label}（${hit.match}），需重新生成。`);
  }
}

function requiredTag(value: string, tag: string, label: string): string {
  if (!hasTag(value, tag)) throw new Error(`用户信息生成缺少 ${label}，需重新生成`);
  const content = extractTag(value, tag);
  if (!content.trim()) throw new Error(`用户信息生成缺少 ${label}，需重新生成`);
  return content;
}

function buildUserSeed(data: CharacterData): string {
  return [
    `姓名：${data.name.trim() || '未填写'}`,
    `年龄：${Number.isFinite(data.age) ? data.age : '未填写'}`,
    `性别：${data.gender}`,
    '',
    personalizeUserInfo(formatUserProfile(readUserProfile(data), data.name), '', data),
    '',
    '【开局情景大纲】',
    data.openingSceneOutline?.trim() || '未填写',
  ].join('\n');
}

function buildUserInput(data: CharacterData, mode: UserInfoGenerationMode): string {
  return [
    '【用户信息生成】',
    `生成类型：${getModeLabel(mode)}`,
    '',
    '【已生成世界观】',
    '性斗学园开局用户信息生成；世界观只作为校园语境，不要把 user 写成 NPC。',
    '',
    '【用户素材】',
    buildUserSeed(data),
  ].join('\n');
}

function buildTaskInstruction(mode: UserInfoGenerationMode): string {
  return [
    '生成一份可直接写入酒馆用户设定的用户信息。',
    '本轮不是写 NPC，也不是写攻略对象；创作对象是 user 本人。',
    '本轮创作对象是用户本人，也就是玩家在性斗学园中扮演的 {{user}} / user。',
    '目标是让 AI 在后续互动中正确处理 user：当前模式要么用于扮演并续写 user，要么用于只读取并理解 user。',
    '按基础信息、生活结构、人物性情、场景表达四项整理提供的素材，各项内容保持原有含义。',
    '姓名、年龄、性别和开局情景作为辅助语境，开局情景不写入长期设定。',
    getModeInstruction(mode),
    '不要写成文学化小说人设；用短句、分组和说明书式表达。',
    '每一行都必须是最终设定内容，不允许是写作指导。',
    '不要输出“这部分应该写什么”的教程说明，直接给最终用户信息正文。',
    '禁止输出创作过程、教程说明、模板说明、字段解释、检查清单或“这里应该写什么”。',
    '禁止出现模式标签、教程标签、结构标签、示例标签、占位内容或未填写字段。',
    '不要和用户对话，不要询问下一步。',
    '输出必须放在 <content><user_info>...</user_info></content> 中。',
    '<user_info> 内按输入姓名生成四对栏目 XML 标签，正文中的玩家写作 <user>。',
  ].join('\n');
}

function buildModeOutputRules(mode: UserInfoGenerationMode): string {
  return [
    '按基础信息、生活结构、人物性情、场景表达的顺序输出四对闭合标签。',
    '标签前缀使用输入姓名，正文中的玩家使用 <user>。',
    '栏目内只写具体设定，缺少素材的栏目允许留空。',
    getModeInstruction(mode),
  ].join('\n');
}

function buildOrderedPrompts(userInput: string, mode: UserInfoGenerationMode): RolePrompt[] {
  return [
    { role: 'system', content: userInfoWritingGuidePrompt },
    {
      role: 'system',
      content: ['<task_scope>', buildTaskInstruction(mode), '</task_scope>'].join('\n'),
    },
    {
      role: 'system',
      content: [
        '输出格式要求（强制执行）',
        '',
        '每次回复必须严格遵守以下结构：',
        '<content>',
        '<user_info>',
        '[最终用户信息正文]',
        '</user_info>',
        '</content>',
        '',
        '铁律：',
        '- 不得在标签外输出任何内容。',
        '- <user_info> 内必须是可直接写入用户设定的成品正文。',
        '- <user_info> 内不得出现教程、写法说明、示例、占位符或未填写字段。',
        '- 所有开标签必须闭合。',
        '',
        buildModeOutputRules(mode),
      ].join('\n'),
    },
    {
      role: 'user',
      content: userInput,
    },
  ];
}

function extractOpenTagContent(value: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startMatch = value.match(new RegExp(`<${escaped}>`, 'i'));
  if (!startMatch || startMatch.index === undefined) return '';

  const afterStart = value.slice(startMatch.index + startMatch[0].length);
  const endMatch = afterStart.match(new RegExp(`</${escaped}>`, 'i'));
  return stripCodeFence((endMatch?.index === undefined ? afterStart : afterStart.slice(0, endMatch.index)).trim());
}

export function formatPalettePersonaStreamPreview(fullText: string, _mode: UserInfoGenerationMode): string {
  const content = extractContent(String(fullText || ''));
  const userInfo = extractOpenTagContent(content, 'user_info');
  if (!userInfo || !isPersonaContentClean(userInfo) || findFinalUserInfoArtifact(userInfo)) return '';
  return userInfo;
}

function formatUserInfoResult(raw: string): PalettePersonaGenerationResult {
  const content = extractContent(raw);
  const userInfo = stripCodeFence(requiredTag(content, 'user_info', '<user_info>'));

  assertPersonaContentClean('用户信息', userInfo);
  assertFinalUserInfoConcrete(userInfo);
  const userProfile = parseUserProfile(userInfo);
  if (!userProfile.basicInfo) throw new Error('用户信息缺少基础信息栏目，请重新生成。');
  return {
    appearance: '',
    background: '',
    palette: userInfo,
    userProfile,
  };
}

export async function generatePalettePersona(
  data: CharacterData,
  options: GeneratePalettePersonaOptions = {},
): Promise<PalettePersonaGenerationResult> {
  if (typeof generateRaw !== 'function') {
    throw new Error('当前酒馆环境不支持 generateRaw，无法调用主 API 生成用户信息。');
  }

  const mode = options.mode ?? 'ai_reads_user';
  const userInput = buildUserInput(data, mode);
  const generationId = `xuedou-user-info-${mode}-${Date.now()}`;
  const streamListener =
    typeof eventOn === 'function' && typeof iframe_events !== 'undefined' && iframe_events.STREAM_TOKEN_RECEIVED_FULLY
      ? eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, (fullText: string, streamGenerationId?: string) => {
          if (streamGenerationId && streamGenerationId !== generationId) return;
          options.onStream?.(formatPalettePersonaStreamPreview(fullText, mode));
        })
      : null;

  try {
    const raw = await generateRaw({
      generation_id: generationId,
      user_input: userInput,
      ordered_prompts: buildOrderedPrompts(userInput, mode),
      overrides: {
        world_info_before: '',
        persona_description: '',
        char_description: '',
        char_personality: '',
        scenario: '',
        world_info_after: '',
        dialogue_examples: '',
        chat_history: {
          with_depth_entries: false,
          author_note: '',
          prompts: [],
        },
      },
      max_chat_history: 0,
      should_stream: true,
      should_silence: true,
    });

    const formatted = formatUserInfoResult(extractGeneratedText(raw));
    if (!formatted.palette.trim()) throw new Error('主 API 返回为空，请稍后重试。');
    return formatted;
  } finally {
    streamListener?.stop();
  }
}
