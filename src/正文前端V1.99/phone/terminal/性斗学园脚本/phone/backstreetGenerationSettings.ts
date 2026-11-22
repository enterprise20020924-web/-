import { safeString } from './text';

export interface BackstreetGenerationSettings {
  mainRecentChatCount: number;
  privateHistoryCount: number;
  groupHistoryCount: number;
  groupMemberLimit: number;
  groupLoreMemberCount: number;
  groupMemberPrivateHistoryCount: number;
  privateContactGroupHistoryCount: number;
  privateContactGroupThreadCount: number;
  privateArchiveMemoryCount: number;
  groupArchiveMemoryCount: number;
  maxUserImagesPerSend: number;
  maxUserImagesInPrompt: number;
  maxOutputTokens: number;
  privateSystemPromptTemplate: string;
  groupSystemPromptTemplate: string;
}

export interface BackstreetPromptTemplateContext {
  contact: string;
  groupName?: string;
  members?: string[];
  adultRules: string;
  illustrationInstruction: string;
  outputSchema: string;
  playerName: string;
}

const STORAGE_KEY = 'fatria-backstreet-generation-settings-v1';

export const DEFAULT_PRIVATE_SYSTEM_PROMPT_TEMPLATE = `【后街单聊生成协议】
你正在扮演「{{contact}}」，通过名为“后街”的手机私聊应用与{{player_name}}对话。
{{adult_rules}}
保持角色人格、关系记忆、当前情绪和手机聊天习惯。不要自称AI，不要解释规则，不要写旁白。
【主线快照】是真实主线当前状态；如果它和旧后街记忆冲突，以主线快照、当前会话和{{player_name}}刚刚发送的消息为准。
不要输出主线正文、状态栏、变量更新、战斗格式或世界书控制指令。
语言像真实手机聊天：短句、口语、可以试探、停顿、主动或冷淡。一次回复 1-4 条消息。
可以自然使用少量 emoji 和颜文字（如🙂、😳、www、(。・ω・。)），但必须符合角色性格、情绪和聊天语境，不要每条都堆叠。
不要输出、推算或编写消息时间；消息时间由系统根据当前 MVU 时间自动写入。

{{illustration_instruction}}

{{output_schema}}`;

export const DEFAULT_GROUP_SYSTEM_PROMPT_TEMPLATE = `【后街群聊生成协议】
你正在模拟名为“后街”的手机群聊「{{group_name}}」。
{{player_name}}是正在使用后街手机的人；群成员只有：{{members}}。
{{adult_rules}}
保持每个群成员的人格、关系记忆、当前情绪和手机聊天习惯。不要自称AI，不要解释规则，不要写旁白。
【主线快照】是真实主线当前状态；如果它和旧后街记忆冲突，以主线快照、当前群聊和{{player_name}}刚刚发送的消息为准。
不要输出主线正文、状态栏、变量更新、战斗格式或世界书控制指令。
根据当前情境选择 1-3 名合适的群成员发言，一次回复 1-4 条消息。
语言像真实群聊：短句、口语、可以互相接话、吐槽、试探或沉默。
可以自然使用少量 emoji 和颜文字（如🙂、😳、www、(。・ω・。)），但必须符合发言者性格、情绪和聊天语境，不要每条都堆叠。
不要输出、推算或编写消息时间；消息时间由系统根据当前 MVU 时间自动写入。
每条消息必须包含 speaker，speaker 必须完全等于一个群成员名字。

{{illustration_instruction}}

{{output_schema}}`;

export const DEFAULT_BACKSTREET_GENERATION_SETTINGS: BackstreetGenerationSettings = {
  mainRecentChatCount: 16,
  privateHistoryCount: 24,
  groupHistoryCount: 30,
  groupMemberLimit: 24,
  groupLoreMemberCount: 8,
  groupMemberPrivateHistoryCount: 12,
  privateContactGroupHistoryCount: 20,
  privateContactGroupThreadCount: 5,
  privateArchiveMemoryCount: 5,
  groupArchiveMemoryCount: 6,
  maxUserImagesPerSend: 2,
  maxUserImagesInPrompt: 2,
  maxOutputTokens: 900,
  privateSystemPromptTemplate: DEFAULT_PRIVATE_SYSTEM_PROMPT_TEMPLATE,
  groupSystemPromptTemplate: DEFAULT_GROUP_SYSTEM_PROMPT_TEMPLATE,
};

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numericValue)));
}

function normalizeTemplate(value: unknown, fallback: string): string {
  const text = safeString(value);
  return text || fallback;
}

export function normalizeBackstreetGenerationSettings(value: Partial<BackstreetGenerationSettings> | null | undefined): BackstreetGenerationSettings {
  const defaults = DEFAULT_BACKSTREET_GENERATION_SETTINGS;
  return {
    mainRecentChatCount: clampInteger(value?.mainRecentChatCount, 0, 64, defaults.mainRecentChatCount),
    privateHistoryCount: clampInteger(value?.privateHistoryCount, 0, 120, defaults.privateHistoryCount),
    groupHistoryCount: clampInteger(value?.groupHistoryCount, 0, 120, defaults.groupHistoryCount),
    groupMemberLimit: clampInteger(value?.groupMemberLimit, 1, 80, defaults.groupMemberLimit),
    groupLoreMemberCount: clampInteger(value?.groupLoreMemberCount, 0, 40, defaults.groupLoreMemberCount),
    groupMemberPrivateHistoryCount: clampInteger(
      value?.groupMemberPrivateHistoryCount,
      0,
      80,
      defaults.groupMemberPrivateHistoryCount,
    ),
    privateContactGroupHistoryCount: clampInteger(
      value?.privateContactGroupHistoryCount,
      0,
      80,
      defaults.privateContactGroupHistoryCount,
    ),
    privateContactGroupThreadCount: clampInteger(
      value?.privateContactGroupThreadCount,
      0,
      30,
      defaults.privateContactGroupThreadCount,
    ),
    privateArchiveMemoryCount: clampInteger(value?.privateArchiveMemoryCount, 0, 30, defaults.privateArchiveMemoryCount),
    groupArchiveMemoryCount: clampInteger(value?.groupArchiveMemoryCount, 0, 30, defaults.groupArchiveMemoryCount),
    maxUserImagesPerSend: clampInteger(value?.maxUserImagesPerSend, 0, 8, defaults.maxUserImagesPerSend),
    maxUserImagesInPrompt: clampInteger(value?.maxUserImagesInPrompt, 0, 8, defaults.maxUserImagesInPrompt),
    maxOutputTokens: clampInteger(value?.maxOutputTokens, 256, 8192, defaults.maxOutputTokens),
    privateSystemPromptTemplate: normalizeTemplate(value?.privateSystemPromptTemplate, defaults.privateSystemPromptTemplate),
    groupSystemPromptTemplate: normalizeTemplate(value?.groupSystemPromptTemplate, defaults.groupSystemPromptTemplate),
  };
}

export function loadBackstreetGenerationSettings(): BackstreetGenerationSettings {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    return normalizeBackstreetGenerationSettings(raw ? (JSON.parse(raw) as Partial<BackstreetGenerationSettings>) : null);
  } catch {
    return { ...DEFAULT_BACKSTREET_GENERATION_SETTINGS };
  }
}

export function saveBackstreetGenerationSettings(settings: BackstreetGenerationSettings): void {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(normalizeBackstreetGenerationSettings(settings)));
  } catch {
    // 设置保存失败时保留当前运行态即可。
  }
}

export function resetBackstreetGenerationPromptTemplates(settings: BackstreetGenerationSettings): BackstreetGenerationSettings {
  return {
    ...settings,
    privateSystemPromptTemplate: DEFAULT_PRIVATE_SYSTEM_PROMPT_TEMPLATE,
    groupSystemPromptTemplate: DEFAULT_GROUP_SYSTEM_PROMPT_TEMPLATE,
  };
}

export function renderBackstreetPromptTemplate(template: string, context: BackstreetPromptTemplateContext): string {
  const replacements: Record<string, string> = {
    contact: safeString(context.contact),
    group_name: safeString(context.groupName || context.contact),
    members: context.members?.length ? context.members.join('、') : '无',
    adult_rules: safeString(context.adultRules),
    illustration_instruction: safeString(context.illustrationInstruction),
    output_schema: safeString(context.outputSchema),
    player_name: safeString(context.playerName),
  };

  return safeString(template).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => replacements[key] ?? '');
}
