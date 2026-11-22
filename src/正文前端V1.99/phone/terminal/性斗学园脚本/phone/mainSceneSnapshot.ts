import { clipText, safeString, uniqueStrings } from './text';

const MAIN_CONTENT_TAGS = ['content', 'maintext', 'mainteext', 'maintxt', 'main_text', 'main_txt'];
const MAIN_CONTENT_TAG_PATTERN = MAIN_CONTENT_TAGS.join('|');

function getSillyTavernContext(): any {
  const globalAny = window as any;
  if (typeof globalAny.SillyTavern?.getContext === 'function') return globalAny.SillyTavern.getContext();
  if (typeof (globalThis as any).SillyTavern?.getContext === 'function') return (globalThis as any).SillyTavern.getContext();
  return null;
}

function cleanMainText(text: string): string {
  return safeString(text)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/【严禁[\s\S]*?(?=【|$)/g, '')
    .replace(/【NSFW禁词[\s\S]*?(?=【|$)/g, '')
    .replace(/Basic_confirmation[\s\S]*?(?=```|$)/g, '')
    .replace(/以下是用户的本轮输入：[\s\S]*?(?=\n```|$)/g, '')
    .replace(/以下输入的代码为接下来剧情相关记忆条目的对应的索引编码[\s\S]*?(?=\n```|$)/g, '')
    .replace(/# 记忆召回[\s\S]*?(?=\n```|$)/g, '')
    .replace(/# 补充信息[\s\S]*?(?=\n```|$)/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readRawMessageText(message: unknown): string {
  if (!message || typeof message !== 'object') return '';
  const source = message as Record<string, unknown>;
  const content = source.content ?? source.mes ?? source.text;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return safeString((item as Record<string, unknown>).text);
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
}

function extractTaggedMainContent(text: string): string {
  const source = safeString(text);
  if (!source) return '';
  const pattern = new RegExp(`<\\s*(${MAIN_CONTENT_TAG_PATTERN})\\b[^>]*>([\\s\\S]*?)<\\s*\\/\\s*\\1\\s*>`, 'gi');
  const blocks: string[] = [];
  for (const match of source.matchAll(pattern)) {
    const content = cleanMainText(match[2] || '');
    if (content) blocks.push(content);
  }
  return blocks.join('\n');
}

function readRecentMainChat(limit = 16): string[] {
  const context = getSillyTavernContext();
  const chat = Array.isArray(context?.chat) ? context.chat : [];
  return chat
    .slice(-Math.max(1, limit))
    .map((message: any) => {
      const rawText = readRawMessageText(message);
      const text = extractTaggedMainContent(rawText);
      if (!text) return '';
      return text;
    })
    .filter(Boolean);
}

function formatWeekday(value: unknown): string {
  const weekday = Number(value);
  if (!Number.isFinite(weekday)) return safeString(value);
  return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][Math.max(1, Math.min(7, weekday)) - 1] || '';
}

export function buildMainSceneSnapshot(
  characterData: any,
  options: { includeRecentChat?: boolean; recentChatLimit?: number } = {},
): string {
  const time = characterData?.时间系统 || {};
  const location = characterData?.位置系统 || {};
  const relation = characterData?.关系系统 || {};
  const task = characterData?.任务系统?.主线任务 || {};
  const presentCharacters = Array.isArray(relation?.在场人物) ? relation.在场人物.map(safeString).filter(Boolean) : [];
  const dateLine = uniqueStrings([time.日期, formatWeekday(time.星期), time.时间]).join(' ');
  const locationLine = uniqueStrings([location.地点名称, location.坐标, location.楼层 ? `${location.楼层}F` : '']).join(' ');
  const lines = [
    '【主线快照】',
    dateLine ? `时间：${dateLine}` : '',
    locationLine ? `地点：${locationLine}` : '',
    presentCharacters.length ? `在场人物：${presentCharacters.join('、')}` : '',
    safeString(task.名称) ? `当前主线任务：${safeString(task.名称)}（${safeString(task.状态) || '进行中'}）` : '',
    safeString(task.描述) ? `任务描述：${clipText(safeString(task.描述), 240)}` : '',
  ].filter(Boolean);

  if (options.includeRecentChat) {
    const recentChatLimit = Math.max(0, Math.round(Number(options.recentChatLimit ?? 16)));
    const recent = recentChatLimit > 0 ? readRecentMainChat(recentChatLimit) : [];
    if (recent.length) {
      lines.push('最近正文片段：');
      lines.push(...recent.map(line => `- ${line}`));
    }
  }

  return lines.join('\n');
}
