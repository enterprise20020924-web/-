import { jsonrepair } from 'jsonrepair';
import type { PhoneMemoryQuery } from './types';
import { safeString, uniqueStrings } from './text';

export function extractXmlTag(content: string, tagName: string): string {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = safeString(content).match(pattern);
  return match?.[1]?.trim() || '';
}

export function parseJsonBlock<T>(content: string): T | null {
  const raw = safeString(content);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      return JSON.parse(jsonrepair(raw)) as T;
    } catch {
      return null;
    }
  }
}

export function normalizePhoneMemoryQuery(value: Partial<PhoneMemoryQuery> | null): PhoneMemoryQuery {
  return {
    app: 'backstreet',
    characters: uniqueStrings(Array.isArray(value?.characters) ? value.characters : []),
    keywords: uniqueStrings(Array.isArray(value?.keywords) ? value.keywords : []),
    locations: uniqueStrings(Array.isArray(value?.locations) ? value.locations : []),
    limit: Math.min(12, Math.max(1, Number(value?.limit || 6))),
  };
}

export function parsePhoneMemoryQuery(content: string): PhoneMemoryQuery {
  const tagged = extractXmlTag(content, 'phone_memory_query');
  return normalizePhoneMemoryQuery(parseJsonBlock<Partial<PhoneMemoryQuery>>(tagged || content));
}
