import { extractXmlTag, parseJsonBlock } from './xmlToolCall';
import { safeString } from './text';

export interface ParsedBackstreetReply {
  type: 'text' | 'system' | 'image';
  speaker?: string;
  time: string;
  text: string;
  prompt?: string;
}

function normalizeReplyItem(value: unknown): ParsedBackstreetReply | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const text = safeString(item.text);
  const rawType = safeString(item.type).toLowerCase();
  const prompt = safeString(item.prompt || item.imagePrompt || item.image_prompt || item.novelai_prompt);
  if (rawType === 'image' || rawType === 'illustration') {
    if (!prompt) return null;
    return {
      type: 'image',
      speaker: safeString(item.speaker || item.sender),
      time: safeString(item.time),
      text: text || safeString(item.caption) || '图片',
      prompt,
    };
  }

  if (!text) return null;
  const type = rawType === 'system' ? 'system' : 'text';
  return {
    type,
    speaker: safeString(item.speaker || item.sender),
    time: safeString(item.time),
    text,
  };
}

function extractBackstreetPayload(content: string): string {
  const tagged = extractXmlTag(content, 'backstreet');
  if (tagged) return tagged;

  const raw = safeString(content);
  const openTag = raw.match(/<backstreet[^>]*>/i);
  if (!openTag || openTag.index === undefined) return raw;

  return raw
    .slice(openTag.index + openTag[0].length)
    .replace(/<\/backstreet>[\s\S]*$/i, '')
    .trim();
}

function unescapeJsonString(value: string): string {
  const raw = safeString(value);
  if (!raw) return '';
  try {
    return JSON.parse(`"${raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`) as string;
  } catch {
    return raw.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\').trim();
  }
}

function parsePartialTextFields(payload: string): ParsedBackstreetReply[] {
  const replies: ParsedBackstreetReply[] = [];
  const pattern = /(?:"speaker"\s*:\s*"((?:\\.|[^"\\])*)"?[\s\S]{0,120}?)?"time"\s*:\s*"((?:\\.|[^"\\])*)"?[\s\S]{0,120}?"text"\s*:\s*"((?:\\.|[^"\\])*)"?/g;
  for (const match of payload.matchAll(pattern)) {
    const text = unescapeJsonString(match[3] || '');
    if (!text) continue;
    replies.push({ type: 'text', speaker: unescapeJsonString(match[1] || ''), time: unescapeJsonString(match[2] || ''), text });
  }
  if (replies.length > 0) return replies;

  const textPattern = /"text"\s*:\s*"((?:\\.|[^"\\])*)"?/g;
  for (const match of payload.matchAll(textPattern)) {
    const text = unescapeJsonString(match[1] || '');
    if (text) replies.push({ type: 'text', time: '', text });
  }
  return replies;
}

export function parseBackstreetReply(content: string): ParsedBackstreetReply[] {
  const payload = extractBackstreetPayload(content);
  const parsed = parseJsonBlock<unknown>(payload);

  if (Array.isArray(parsed)) {
    return parsed.map(normalizeReplyItem).filter((item): item is ParsedBackstreetReply => !!item);
  }

  if (parsed && typeof parsed === 'object') {
    const item = normalizeReplyItem(parsed);
    if (item) return [item];
  }

  const partialReplies = parsePartialTextFields(payload);
  if (partialReplies.length > 0) return partialReplies;

  const fallbackText = safeString(content)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<backstreet>|<\/backstreet>/gi, '')
    .trim();
  return fallbackText ? [{ type: 'text', time: '', text: fallbackText }] : [];
}
