import type { DialogueMapEntry, DialogueMapKind, StoredDialogueMap } from '../types/narrative';

export const DIALOGUE_MAP_DATA_KEY = 'baipo_dialogue_map_v1';
export const DIALOGUE_MAP_PROMPT_ID = 'baipo-dialogue-map-contract-v1';

const DIALOGUE_MAP_TAG_PATTERN = /<dialogue_map\b[^>]*>[\s\S]*?<\/dialogue_map>/gi;
const DIALOGUE_MAP_CAPTURE_PATTERN = /<dialogue_map\b[^>]*>([\s\S]*?)<\/dialogue_map>/gi;
const CONTENT_CLOSE_TAG_PATTERN = /<\/(?:content|maintext)>/gi;
const VALID_DIALOGUE_MAP_KINDS = new Set<DialogueMapKind>(['speech', 'narration', 'sfx', 'action']);
const NON_PERSON_LABEL_PATTERN =
  /^(?:旁白|叙述|系统|提示|说明|地点|时间|画面|镜头|场景|声音|广播|公告|通知|字幕|二楼|三楼|一楼|没有人|没人|无人|谁|什么|这里|那里|这个|那个|这种|那种|她|他|它|TA|Ta|ta)(?:[\s\S]*)$/;
const LOCATION_OR_OBJECT_LABEL_PATTERN =
  /(?:位置|座位|窗边|门边|门口|角落|中央|中间|前排|后排|左侧|右侧|旁边|附近|尽头|入口|出口|桌旁|桌边|椅子|沙发|讲台|设备柜|教室|走廊|楼道|楼梯|办公室|宿舍|餐厅|食堂|商业街|训练场|图书馆|宫殿|海滩|学生会|协会|联盟|制服|校服|空气|气氛|文件|资料|纸张|书页|光线|脚步)$/;
const UNSAFE_LABEL_FRAGMENT_PATTERN = /(?:没有人|没人|无人|谁敢|多说一句|特别关注|没有退路|没有抬头)/;

export const DIALOGUE_MAP_OUTPUT_CONTRACT = [
  '【正文前端 dialogue_map 标注协议】',
  '当本次回复是普通剧情正文，并且输出 <content>...</content> 时，必须紧跟在 </content> 后输出一个 <dialogue_map>...</dialogue_map>。',
  '如果本次回复是 <fight> 战斗楼层，禁止输出 dialogue_map。',
  'dialogue_map 必须写在成对标签内：<dialogue_map>[JSON数组]</dialogue_map>。绝对禁止裸输出 JSON 数组，绝对禁止把 dialogue_map 放进 <content> 内。',
  'dialogue_map 标签外禁止写注释、解释、标题或 Markdown 代码块。',
  '每个条目格式：{"i":1,"anchor":"该段正文中连续8到24个字的原文锚点","speaker":null,"focus":"角色名或null","kind":"speech|narration|sfx|action"}。',
  'dialogue_map 只能标注你刚刚写进 <content> 的正文展示段落；不要标注摘要、提示词、代码块、其他前端片段。',
  '写 dialogue_map 前必须回看 <content> 的最终文本，以该文本实际出现的自然段/独立台词为准逐条标注。',
  '条目按前端展示段落/独立台词标注，不要按逗号、分句、短语拆分；一个自然叙述段通常只对应一个条目。',
  'anchor 必须取自该条展示段落/台词内部的连续原文，不要只写“啪”“索亚”“厚重的书页”这种过短片段，除非整条展示内容本来就只有这么短。',
  'speaker 控制名字栏：明确有人说话，或该动作段确实应显示人物名时填角色名；没有明确说话人时填 null，前端显示旁白。',
  'focus 控制立绘焦点：可填当前应该保留或切换立绘的已登场角色名；没有合适角色时填 null。',
  'kind=speech 只允许用于人物直接说出的台词：带中文/英文引号的台词、角色名冒号后的台词、或明确“某某说/问/答道”的原话。',
  '没有引号、没有冒号、没有直接发言动词的叙述句，必须 kind:"narration" 或 kind:"action"，不得标成 speech。',
  '拟声、撞击声、物体声如“啪”“咚”“哗啦”必须 kind:"sfx"，speaker:null；不要把声音当成角色发言。',
  '不要把地点、楼层、物品、代词短语、否定叙述当成人名，例如“二楼”“她没有退路了”“没有人多说一句话”都必须 speaker:null。',
  '引号台词归属要看语义，不要因为上一段是谁说话就惯性归属；如果爱丽丝说话，就写 speaker:"爱丽丝"，如果响木天音说话，就写 speaker:"响木天音"。',
  'anchor 必须来自对应正文段落，尽量短而唯一；i 从 1 开始按正文展示顺序递增。',
].join('\n');

export function hashDialogueMapSource(input: string) {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
  }
  return `bp-map-${Math.abs(hash >>> 0).toString(16)}`;
}

export function stripDialogueMapBlocks(text: string) {
  return text.replace(DIALOGUE_MAP_TAG_PATTERN, '').replace(/\n{3,}/g, '\n\n').trim();
}

export function createStoredDialogueMap(entries: DialogueMapEntry[], sourceText: string): StoredDialogueMap {
  return {
    version: 1,
    sourceHash: hashDialogueMapSource(sourceText),
    entries,
  };
}

export function readStoredDialogueMap(value: unknown, sourceText: string): StoredDialogueMap | null {
  const record = asRecord(value);
  if (record === null || record.version !== 1 || record.sourceHash !== hashDialogueMapSource(sourceText)) {
    return null;
  }

  const entries = sanitizeDialogueMapEntries(record.entries);
  return entries.length > 0
    ? {
        version: 1,
        sourceHash: record.sourceHash,
        entries,
      }
    : null;
}

export function extractDialogueMapFromMessage(message: string) {
  const rawEntries: string[] = [];
  DIALOGUE_MAP_CAPTURE_PATTERN.lastIndex = 0;
  for (const match of message.matchAll(DIALOGUE_MAP_CAPTURE_PATTERN)) {
    rawEntries.push(match[1] ?? '');
  }
  const bareMap = rawEntries.length === 0 ? extractBareDialogueMapAfterContent(message) : null;
  const payload = rawEntries[rawEntries.length - 1] ?? bareMap?.payload ?? '';

  return {
    found: rawEntries.length > 0 || bareMap !== null,
    cleanedMessage:
      bareMap === null
        ? stripDialogueMapBlocks(message)
        : stripDialogueMapBlocks(`${message.slice(0, bareMap.start)}${message.slice(bareMap.end)}`),
    entries: sanitizeDialogueMapEntries(parseDialogueMapPayload(payload)),
  };
}

function parseDialogueMapPayload(payload: string): unknown {
  const normalizedPayload = unwrapCodeFence(payload.trim());
  if (normalizedPayload.length === 0) {
    return null;
  }

  const candidates = [
    normalizedPayload,
    sliceJsonCandidate(normalizedPayload, '[', ']'),
    sliceJsonCandidate(normalizedPayload, '{', '}'),
  ].filter((candidate): candidate is string => candidate !== null && candidate.trim().length > 0);

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Keep trying narrower JSON candidates.
    }
  }

  return null;
}

function sanitizeDialogueMapEntries(value: unknown): DialogueMapEntry[] {
  const rawEntries = Array.isArray(value) ? value : Array.isArray(asRecord(value)?.entries) ? asRecord(value)?.entries : [];
  const entries: DialogueMapEntry[] = [];

  for (const rawEntry of rawEntries ?? []) {
    const record = asRecord(rawEntry);
    if (record === null) {
      continue;
    }

    const index = Number(record.i);
    const anchor = sanitizeAnchor(record.anchor);
    if (!Number.isInteger(index) || index <= 0 || anchor.length === 0) {
      continue;
    }

    entries.push({
      i: index,
      anchor,
      speaker: sanitizeSpeakerLabel(record.speaker),
      focus: sanitizeSpeakerLabel(record.focus),
      kind: sanitizeMapKind(record.kind),
    });
  }

  return entries.sort((left, right) => left.i - right.i);
}

function sanitizeAnchor(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function sanitizeSpeakerLabel(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalizedValue = String(value).trim();
  if (
    normalizedValue.length === 0 ||
    normalizedValue === 'null' ||
    normalizedValue === '旁白' ||
    normalizedValue.length > 18 ||
    /[，,。！？!?；;、"'“”「」『』<>[\]{}]/.test(normalizedValue) ||
    NON_PERSON_LABEL_PATTERN.test(normalizedValue) ||
    LOCATION_OR_OBJECT_LABEL_PATTERN.test(normalizedValue) ||
    UNSAFE_LABEL_FRAGMENT_PATTERN.test(normalizedValue)
  ) {
    return null;
  }

  return normalizedValue;
}

function sanitizeMapKind(value: unknown): DialogueMapKind {
  const normalizedValue = String(value ?? '').trim() as DialogueMapKind;
  return VALID_DIALOGUE_MAP_KINDS.has(normalizedValue) ? normalizedValue : 'narration';
}

function unwrapCodeFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function sliceJsonCandidate(value: string, open: '[' | '{', close: ']' | '}') {
  const start = value.indexOf(open);
  const end = value.lastIndexOf(close);
  return start >= 0 && end > start ? value.slice(start, end + 1) : null;
}

function extractBareDialogueMapAfterContent(message: string) {
  CONTENT_CLOSE_TAG_PATTERN.lastIndex = 0;
  let closeMatch: RegExpExecArray | null = null;
  for (;;) {
    const nextMatch = CONTENT_CLOSE_TAG_PATTERN.exec(message);
    if (nextMatch === null) {
      break;
    }
    closeMatch = nextMatch;
  }

  if (closeMatch === null) {
    return null;
  }

  const contentEnd = closeMatch.index + closeMatch[0].length;
  const tail = message.slice(contentEnd);
  const whitespaceMatch = tail.match(/^\s*/);
  const jsonStartInTail = whitespaceMatch?.[0].length ?? 0;
  if (tail[jsonStartInTail] !== '[') {
    return null;
  }

  const jsonEndInTail = findJsonArrayEnd(tail, jsonStartInTail);
  if (jsonEndInTail === null) {
    return null;
  }

  const payload = tail.slice(jsonStartInTail, jsonEndInTail + 1);
  if (sanitizeDialogueMapEntries(parseDialogueMapPayload(payload)).length === 0) {
    return null;
  }

  return {
    payload,
    start: contentEnd + jsonStartInTail,
    end: contentEnd + jsonEndInTail + 1,
  };
}

function findJsonArrayEnd(value: string, start: number) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const char = value[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '[') {
      depth += 1;
      continue;
    }

    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}
