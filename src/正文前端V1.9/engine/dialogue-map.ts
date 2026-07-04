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
  '每个条目格式：{"i":1,"p":1,"anchor":"2到12字短锚点","speaker":null,"focus":"角色名或null","kind":"speech|narration|sfx|action"}。',
  'dialogue_map 只能标注你刚刚写进 <content> 的正文展示段落；不要标注摘要、提示词、代码块、其他前端片段。',
  '写 dialogue_map 前必须回看 <content> 的最终文本，以该文本实际出现的自然段/独立台词为准逐条标注。',
  'p 是前端展示段落编号：按 <content> 内非空展示段从 1 开始计数；每个自然段或独立台词通常对应一个 p。',
  '你需要为每个展示段做语义归属裁判：这段是台词、动作、旁白还是拟声；名字栏应该是谁；立绘焦点应该是谁。',
  '条目按前端展示段落/独立台词标注，不要按逗号、分句、短语拆分；一个自然叙述段通常只对应一个条目。',
  '同一展示段内如果是同一个角色连续发言，即使中间夹着少量“某人说/冷笑/敲桌子/压低声音”等衔接动作，也只写一个 speech 条目；不要按每个引号拆成多个条目。',
  'anchor 必须取自对应展示段落/台词内部的连续短原文，只写 2 到 12 个字，优先选该段最容易匹配且不泄露长原文的片段。',
  'anchor 不要超过 12 个字，不要整句复制；除非整条展示内容本来很短，否则不要只写“啪”“索亚”这种过短片段。',
  'speaker 控制名字栏：明确有人说话，或该动作段确实应显示人物名时填角色名；不能确定说话人时必须填 null，前端显示旁白。',
  'focus 控制立绘焦点：可填当前应该保留或切换立绘的已登场角色名；没有合适角色时填 null。',
  'kind=speech 只允许用于人物直接说出的台词：带中文/英文引号的台词、角色名冒号后的台词、或明确“某某说/问/答道”的原话；同一 speaker 的引号台词与紧邻发言动作/语气衔接可以作为同一个 speech 展示段。',
  '没有引号、没有冒号、没有直接发言动词的叙述句，必须 kind:"narration" 或 kind:"action"，不得标成 speech。',
  '拟声、撞击声、物体声如“啪”“咚”“哗啦”必须 kind:"sfx"，speaker:null；不要把声音当成角色发言。',
  '不要把地点、楼层、物品、代词短语、否定叙述当成人名，例如“二楼”“她没有退路了”“没有人多说一句话”都必须 speaker:null。',
  '不要因为台词里出现“我”就填 {{user}}；只有正文明确是玩家本人在说话时，speaker 才能填 {{user}}。',
  '路人、陌生男生/女生、眼镜男生、红外套男生、学生会成员、体育联盟成员说“我/你”时，speaker 必须填对应临时身份标签或 null，绝对不要填 {{user}}。',
  '临时路人身份可以用简短名字栏，例如“眼镜男生”“红外套男生”“袖章女生”；不确定具体身份时填 null，不要用 {{user}} 兜底。',
  '引号台词归属要看语义，不要因为上一段是谁说话就惯性归属；如果爱丽丝说话，就写 speaker:"爱丽丝"，如果响木天音说话，就写 speaker:"响木天音"。',
  'anchor 必须来自对应正文段落，简短且相对唯一；i 从 1 开始按输出顺序递增，p 必须对应正文展示段编号。',
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
    const paragraphIndex = sanitizeParagraphNumber(record.p);
    const anchor = sanitizeAnchor(record.anchor);
    if (!Number.isInteger(index) || index <= 0 || anchor.length === 0) {
      continue;
    }

    const lineStart = sanitizeLineNumber(record.line_start);
    const lineEnd = sanitizeLineNumber(record.line_end);
    const normalizedLineStart =
      lineStart !== null && lineEnd !== null && lineStart > lineEnd ? lineEnd : lineStart;
    const normalizedLineEnd =
      lineStart !== null && lineEnd !== null && lineEnd < lineStart ? lineStart : lineEnd;

    entries.push({
      i: index,
      p: paragraphIndex,
      line_start: normalizedLineStart,
      line_end: normalizedLineEnd,
      anchor,
      speaker: sanitizeSpeakerLabel(record.speaker),
      focus: sanitizeSpeakerLabel(record.focus),
      kind: sanitizeMapKind(record.kind),
    });
  }

  return entries.sort((left, right) => (left.p ?? left.i) - (right.p ?? right.i) || left.i - right.i);
}

function sanitizeAnchor(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12);
}

function sanitizeLineNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

function sanitizeParagraphNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
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
