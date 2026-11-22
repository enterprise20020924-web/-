import { canonicalPresetRgbName } from './preset-rgb-names';

export interface RgbNameSpan {
  start: number;
  end: number;
  name: string;
}

export const RGB_ROLE_OUTPUT_CONTRACT = [
  '<baipo_rgb_role_protocol>',
  '【正文人物姓名标记协议】',
  '在普通剧情 <content> 或 <maintext> 正文中，每一次明确出现人物姓名，都必须立即用 <RGB>姓名</RGB> 包裹；旁白、动作描述和人物台词中的姓名同样处理。',
  '标签内只放该人物的规范姓名，优先使用世界书或当前变量中的完整姓名；不要把整句话、动作、标点或称谓一起包进去。她、他、你、我等代词和未具名的普通女生、工作人员等泛称不标记。',
  '风、雪、光、零等词只有明确指代人物姓名时才标记；天气、景物、数值、物品、地点和组织名称均不标记。',
  '正确示例：窗外的风越来越大，<RGB>雪</RGB>关上窗。“我去找<RGB>神崎凛</RGB>。”<台词1 speaker="雪" focus="雪"/>',
  'RGB 标签必须使用固定的大写名称、成对闭合，不添加颜色、style、class 或其他属性。颜色由前端处理，不需要输出任何美化代码。',
  '保留前面的逐句台词标签规则。speaker、focus 属性中的名字仍是普通文本，不嵌套 RGB 标签；变量更新、分析、建议选项和其他控制数据中也不添加 RGB 标签。',
  '</baipo_rgb_role_protocol>',
].join('\n');

export function stripRgbTags(text: string) {
  return text.replace(/<\/?RGB\s*>/gi, '').replace(/<\/?(?:R|RG|RGB)\s*$/i, '');
}

/** RGB 只提供显示标记；切句、说话人和台词锚点仍使用可见纯文本。 */
export function parseRgbText(source: string): { text: string; rgbSpans: RgbNameSpan[] } {
  let cursor = 0;
  let text = '';
  const rgbSpans: RgbNameSpan[] = [];
  for (const match of source.matchAll(/<RGB\s*>([^<>\r\n]*?)<\/RGB\s*>/gi)) {
    text += stripRgbTags(source.slice(cursor, match.index));
    const body = match[1];
    const name = body.trim();
    if (name) {
      const start = text.length + body.indexOf(name);
      rgbSpans.push({ start, end: start + name.length, name });
    }
    text += body;
    cursor = match.index + match[0].length;
  }
  text += stripRgbTags(source.slice(cursor));
  return { text, rgbSpans };
}

export function projectRgbSpans(source: string, spans: RgbNameSpan[] | undefined, fragment: string, from = 0) {
  const start = source.indexOf(fragment, from);
  if (start < 0) return { end: from, rgbSpans: [] as RgbNameSpan[] };
  const end = start + fragment.length;
  return {
    end,
    rgbSpans: (spans ?? [])
      .filter(span => span.start >= start && span.end <= end)
      .map(span => ({ ...span, start: span.start - start, end: span.end - start })),
  };
}

export function joinRgbSpans(parts: Array<{ text: string; rgbSpans?: RgbNameSpan[] }>, joinedText: string) {
  const rgbSpans: RgbNameSpan[] = [];
  let cursor = 0;
  for (const part of parts) {
    const text = part.text.trim();
    const offset = joinedText.indexOf(text, cursor);
    if (offset < 0) continue;
    const projection = projectRgbSpans(part.text, part.rgbSpans, text);
    rgbSpans.push(
      ...projection.rgbSpans.map(span => ({ ...span, start: span.start + offset, end: span.end + offset })),
    );
    cursor = offset + text.length;
  }
  return rgbSpans.length ? { rgbSpans } : {};
}

export function splitRgbDisplayParts(text: string, spans: RgbNameSpan[] = []) {
  const parts: Array<{ text: string; name: string | null }> = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start < cursor || span.end > text.length) continue;
    if (span.start > cursor) parts.push({ text: text.slice(cursor, span.start), name: null });
    parts.push({ text: text.slice(span.start, span.end), name: span.name });
    cursor = span.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), name: null });
  return parts;
}

export function rgbNameColors(name: string) {
  const palette = [
    ['#145d94', '#9dd5ff'],
    ['#14675d', '#93e4d2'],
    ['#744292', '#d9baff'],
    ['#9a3655', '#ffb5ce'],
    ['#77530d', '#f4d995'],
  ];
  let hash = 0;
  for (const char of canonicalPresetRgbName(name)
    .normalize('NFKC')
    .replace(/[\s·・]/g, ''))
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}
