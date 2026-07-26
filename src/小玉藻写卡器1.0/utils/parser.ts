export function stripCodeFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:yaml|yml|xml|html|text|md)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export function extractTag(value: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = value.match(new RegExp(`<${escaped}>([\\s\\S]*?)<\\/${escaped}>`, 'i'));
  return stripCodeFence(match?.[1] ?? '');
}

export function hasTag(value: string, tag: string): boolean {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`<${escaped}>[\\s\\S]*?<\\/${escaped}>`, 'i').test(value);
}

export function extractContent(value: string): string {
  const withoutThinking = value.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
  return stripCodeFence(extractTag(withoutThinking, 'content') || withoutThinking);
}

export function splitAliases(value: string): string[] {
  return value
    .split(/[,\n，、/|]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function toSafeRoleKey(value: string): string {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
    .replace(/^_+|_+$/g, '');
}

export function normalizeRoleName(name: string, fallback: string): string {
  const safeFallback = toSafeRoleKey(fallback) || '角色';
  return toSafeRoleKey(name || fallback) || safeFallback;
}
