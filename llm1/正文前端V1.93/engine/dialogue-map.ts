import type { DialogueMapEntry, DialogueMapKind, StoredDialogueMap } from '../types/narrative';

export const DIALOGUE_MAP_DATA_KEY = 'baipo_dialogue_map_v1';
export const DIALOGUE_MAP_PROMPT_ID = 'baipo-dialogue-map-contract-v1';

const DIALOGUE_MAP_TAG_PATTERN = /<dialogue_map\b[^>]*>[\s\S]*?<\/dialogue_map>/gi;
const DIALOGUE_MAP_CAPTURE_PATTERN = /<dialogue_map\b[^>]*>([\s\S]*?)<\/dialogue_map>/gi;
const INLINE_DIALOGUE_TAG_PATTERN = /<台词(\d+)\b([^<>]*?)\/?>/giu;
const INLINE_DIALOGUE_ATTRIBUTE_PATTERN = /\b(speaker|focus)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/giu;
const CONTENT_BLOCK_CAPTURE_PATTERN = /(<(content|maintext)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi;
const CONTENT_CLOSE_TAG_PATTERN = /<\/(?:content|maintext)>/gi;
const VALID_DIALOGUE_MAP_KINDS = new Set<DialogueMapKind>(['speech', 'narration', 'sfx', 'action']);
const NON_PERSON_LABEL_PATTERN =
  /^(?:旁白|叙述|系统|提示|说明|地点|时间|画面|镜头|场景|声音|广播|公告|通知|字幕|二楼|三楼|一楼|没有人|没人|无人|谁|什么|这里|那里|这个|那个|这种|那种|她|他|它|TA|Ta|ta)(?:[\s\S]*)$/;
const LOCATION_OR_OBJECT_LABEL_PATTERN =
  /(?:位置|座位|窗边|门边|门口|角落|中央|中间|前排|后排|左侧|右侧|旁边|附近|尽头|入口|出口|桌旁|桌边|椅子|沙发|讲台|设备柜|教室|走廊|楼道|楼梯|办公室|宿舍|餐厅|食堂|商业街|训练场|图书馆|宫殿|海滩|学生会|协会|联盟|制服|校服|空气|气氛|文件|资料|纸张|书页|光线|脚步)$/;
const UNSAFE_LABEL_FRAGMENT_PATTERN = /(?:没有人|没人|无人|谁敢|多说一句|特别关注|没有退路|没有抬头)/;

export const DIALOGUE_MAP_OUTPUT_CONTRACT = [
  '<baipo_dialogue_map_protocol>',
  '**此段规则为meta级别规则，不允许遗忘**',
  '【正文前端逐句台词标签协议】',
  '普通剧情输出 <content>...</content> 时，必须在写出每一句人物直接台词的当下，紧跟一个同一行自闭合标签；<fight> 战斗楼层禁止输出这些标签。标签是控制数据，不是正文内容。',
  '固定格式：第一句台词后写 <台词1 speaker="说话人名或null" focus="焦点名或null"/>，第二句写 <台词2 .../>，之后严格按正文出现顺序连续编号，禁止跳号、重号、倒序或省略。',
  '示例：“大家早上好！”<台词1 speaker="星野光" focus="星野光"/>她向台下挥手。',
  '标签必须紧贴它所标注台词的末尾：带引号台词放在闭引号之后；角色名冒号后的无引号原话放在该句句末之后；台词后的动作或旁白必须写在标签之后。不得把若干句台词共用一个标签。',
  '强制台词判定：凡成对中文或英文双引号内含句末符号（。！？!?……）的内容，一律是直接台词并必须紧跟标签；“啊？干嘛？”之类短句、语气词、单字问答和路人发言也绝不能漏。明确“某人说/问/答/喊”的无引号原话同样需要标签。',
  '纯旁白、动作、环境、心理描写、被提及的书面文字、物体声和拟声不加台词标签。正文中每出现一句直接台词就立即写标签，不得等正文完成后再回头补，不得只标主要人物、只标部分台词或用省略号代替。',
  'speaker 必须在写该句时根据当前语义确定：优先使用明确姓名；临时人物使用“普通女生、眼镜男生、引导员、工作人员”等正文身份；确实无法判断才写 null。不得虚构姓名，不得把普通男生/女生归为玩家，不得因省事批量写 null。简称、完整姓名与玩家身份由前端统一解析。',
  '只要 speaker 非 null，focus 就必须非 null并默认逐字复制 speaker，路人同样如此；只有正文明确把镜头转向另一角色时 focus 才能不同。speaker 为 null 且没有明确焦点时 focus 才写 null。无对应立绘的 focus 只保留身份，不展示立绘。',
  '同一自然段有多句台词时，每句仍各自紧跟独立编号标签；两个不同说话人的台词绝不能共用标签。标签属性必须使用英文双引号，标签内不得添加解释、Markdown 或其他字段。',
  '禁止在 </content> 后再输出 dialogue_map JSON；前端会按每个台词标签的实际位置机械生成 p、line_start、line_end、anchor 并写入变量。输出前只需核对：直接台词数量必须与台词标签数量完全相同，编号必须从 1 连续到最后一条。',
  '</baipo_dialogue_map_protocol>',
].join('\n');

export function hashDialogueMapSource(input: string) {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
  }
  return `bp-map-${Math.abs(hash >>> 0).toString(16)}`;
}

export function stripDialogueMapBlocks(text: string) {
  return text
    .replace(DIALOGUE_MAP_TAG_PATTERN, '')
    .replace(INLINE_DIALOGUE_TAG_PATTERN, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function stripInlineDialogueMarkers(text: string) {
  return text.replace(INLINE_DIALOGUE_TAG_PATTERN, '');
}

export function createStoredDialogueMap(entries: DialogueMapEntry[], sourceText: string): StoredDialogueMap {
  return {
    version: 1,
    sourceHash: hashDialogueMapSource(sourceText),
    entries: entries.map(ensureDialogueMapEntryFocus),
  };
}

export function readStoredDialogueMap(
  value: unknown,
  sourceText: string,
  allowSourceCompatibleHashMismatch = false,
): StoredDialogueMap | null {
  const record = asRecord(value);
  if (record === null || record.version !== 1) {
    return null;
  }

  const storedSourceHash = typeof record.sourceHash === 'string' ? record.sourceHash : '';
  const entries = sanitizeDialogueMapEntries(record.entries);
  const sourceHashMatches = storedSourceHash === hashDialogueMapSource(sourceText);
  const paragraphs = getNormalizedSourceParagraphs(sourceText);
  const boundaryParagraphs = getBoundarySourceParagraphs(sourceText);
  const hasSourceCompatibleSignature =
    entries.some(entry => findBoundaryParagraphNumber(entry, boundaryParagraphs) !== null) ||
    filterDialogueMapEntriesForSource(entries, sourceText).length > 0 ||
    findGlobalParagraphOffset(entries, sourceText, paragraphs) !== null;
  if (
    entries.length === 0 ||
    (!sourceHashMatches && (!allowSourceCompatibleHashMismatch || !hasSourceCompatibleSignature))
  ) {
    return null;
  }

  return {
    version: 1,
    sourceHash: storedSourceHash,
    entries,
  };
}

function getNormalizedSourceParagraphs(sourceText: string) {
  return sourceText
    .split(/\n(?:[ \t]*\n)+/)
    .map(paragraph => normalizeVerificationText(paragraph))
    .filter(paragraph => paragraph.length > 0);
}

function getBoundarySourceParagraphs(sourceText: string) {
  return sourceText
    .split(/\n(?:[ \t]*\n)+/)
    .map(paragraph => normalizeBoundaryText(paragraph))
    .filter(paragraph => paragraph.length > 0);
}

export function filterDialogueMapEntriesForSource(entries: DialogueMapEntry[], sourceText: string) {
  const paragraphs = getNormalizedSourceParagraphs(sourceText);
  const boundaryParagraphs = getBoundarySourceParagraphs(sourceText);
  if (paragraphs.length === 0) {
    return [];
  }

  return entries.filter(entry => {
    const paragraphNumber = entry.p;
    if (paragraphNumber === null || paragraphNumber > paragraphs.length) {
      return false;
    }

    if (findBoundaryParagraphNumber(entry, boundaryParagraphs) === paragraphNumber) {
      return true;
    }

    const paragraph = paragraphs[paragraphNumber - 1];
    const anchor = normalizeVerificationText(entry.anchor);
    const matchingParagraphs = paragraphs.filter(candidate => anchor.length > 0 && candidate.includes(anchor));
    return anchor.length > 0 && matchingParagraphs.length === 1 && paragraph.includes(anchor);
  });
}

export function calibrateDialogueMapEntriesForSource(entries: DialogueMapEntry[], sourceText: string) {
  const focusNormalizedEntries = entries.map(ensureDialogueMapEntryFocus);
  const paragraphs = getNormalizedSourceParagraphs(sourceText);
  const boundaryParagraphs = getBoundarySourceParagraphs(sourceText);
  if (focusNormalizedEntries.length === 0 || paragraphs.length === 0) {
    return [];
  }

  let hasBoundaryCalibration = false;
  const boundaryCalibratedEntries = focusNormalizedEntries.map(entry => {
    const paragraphNumber = findBoundaryParagraphNumber(entry, boundaryParagraphs);
    if (paragraphNumber === null || paragraphNumber === entry.p) {
      return entry;
    }

    hasBoundaryCalibration = true;
    return { ...entry, p: paragraphNumber };
  });
  if (hasBoundaryCalibration) {
    return boundaryCalibratedEntries;
  }

  const globalOffset = findGlobalParagraphOffset(focusNormalizedEntries, sourceText, paragraphs);
  if (globalOffset === null) {
    return focusNormalizedEntries;
  }

  return focusNormalizedEntries.map(entry => ({
    ...entry,
    i: entry.i + globalOffset,
    p: entry.p === null ? null : entry.p + globalOffset,
  }));
}

function findBoundaryParagraphNumber(entry: DialogueMapEntry, paragraphs: string[]) {
  const lineStart = normalizeBoundaryText(entry.line_start ?? '');
  const lineEnd = normalizeBoundaryText(entry.line_end ?? '');
  const anchor = normalizeBoundaryText(entry.anchor);
  if (lineStart.length === 0 && lineEnd.length === 0 && anchor.length === 0) {
    return null;
  }

  const findUniqueMatch = (predicate: (paragraph: string) => boolean) => {
    const matches = paragraphs
      .map((paragraph, index) => (predicate(paragraph) ? index + 1 : null))
      .filter((paragraphNumber): paragraphNumber is number => paragraphNumber !== null);
    return matches.length === 1 ? matches[0] : null;
  };

  if (lineStart.length > 0 && lineEnd.length > 0) {
    const exactMatch = findUniqueMatch(paragraph => paragraph === lineStart && paragraph === lineEnd);
    if (exactMatch !== null) {
      return exactMatch;
    }

    const strictBoundaryMatch = findUniqueMatch(
      paragraph => paragraph.startsWith(lineStart) && paragraph.endsWith(lineEnd),
    );
    if (strictBoundaryMatch !== null) {
      return strictBoundaryMatch;
    }
  }

  // Some models copy the dialogue sentence edges instead of the whole natural
  // paragraph edges. Accept that only when all supplied snippets identify one
  // and the same paragraph; snippet length is never used as a validity gate.
  return findUniqueMatch(paragraph => {
    const containsStart = lineStart.length > 0 && paragraph.includes(lineStart);
    const containsEnd = lineEnd.length > 0 && paragraph.includes(lineEnd);
    const containsAnchor = anchor.length > 0 && paragraph.includes(anchor);
    const startsAtBoundary = lineStart.length > 0 && paragraph.startsWith(lineStart);
    const endsAtBoundary = lineEnd.length > 0 && paragraph.endsWith(lineEnd);

    return (
      (startsAtBoundary && (containsEnd || containsAnchor)) ||
      (endsAtBoundary && (containsStart || containsAnchor)) ||
      (containsAnchor && containsStart && containsEnd)
    );
  });
}

function findGlobalParagraphOffset(entries: DialogueMapEntry[], sourceText: string, paragraphs: string[]) {
  const hasContinuousDeclaredParagraphs = entries.every(
    (entry, index) => entry.i === index + 1 && entry.p === index + 1,
  );
  if (!hasContinuousDeclaredParagraphs || entries.length < 3 || paragraphs.length <= entries.length) {
    return null;
  }

  const anchorOffsets = entries
    .map(entry => {
      const anchor = normalizeVerificationText(entry.anchor);
      if (anchor.length < 2 || entry.p === null) {
        return null;
      }

      const matchingParagraphs = paragraphs
        .map((paragraph, index) => (paragraph.includes(anchor) ? index + 1 : null))
        .filter((paragraphNumber): paragraphNumber is number => paragraphNumber !== null);
      return matchingParagraphs.length === 1 ? matchingParagraphs[0] - entry.p : null;
    })
    .filter((offset): offset is number => offset !== null);
  const requiredAnchorCount = Math.max(3, Math.ceil(entries.length * 0.7));
  const uniqueOffsets = new Set(anchorOffsets);
  const globalOffset = anchorOffsets[0] ?? 0;
  const maximumGlobalOffset = Math.max(1, Math.ceil(paragraphs.length * 0.1));
  if (
    anchorOffsets.length < requiredAnchorCount ||
    uniqueOffsets.size !== 1 ||
    globalOffset <= 0 ||
    globalOffset > maximumGlobalOffset
  ) {
    return null;
  }

  const shiftedEntries = entries.map(entry => ({
    ...entry,
    i: entry.i + globalOffset,
    p: entry.p === null ? null : entry.p + globalOffset,
  }));
  const calibratedEntries = filterDialogueMapEntriesForSource(shiftedEntries, sourceText);
  return calibratedEntries.length >= requiredAnchorCount ? globalOffset : null;
}

export function isDialogueMapCompleteForSource(entries: DialogueMapEntry[], sourceText: string) {
  const paragraphs = getNormalizedSourceParagraphs(sourceText);
  if (paragraphs.length === 0) {
    return entries.length === 0;
  }
  if (entries.length === 0) {
    return true;
  }

  return entries.every(
    (entry, index) =>
      entry.i === index + 1 && entry.p !== null && entry.p <= paragraphs.length,
  );
}

function normalizeVerificationText(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[{}·・•‧∙･．.\s"'“”「」『』]/g, '')
    .trim();
}

function normalizeBoundaryText(value: string) {
  return value.normalize('NFKC').replace(/\s+/g, '').trim();
}

export function getCurrentSwipeVariableValue(message: unknown, key: string): unknown {
  const messageRecord = asRecord(message);
  const variables = messageRecord?.variables;
  if (variables === null || variables === undefined) {
    return undefined;
  }

  const directValue = asRecord(variables)?.[key];
  if (directValue !== undefined) {
    return directValue;
  }

  const rawSwipeId = Number(messageRecord?.swipe_id);
  const swipeId = Number.isInteger(rawSwipeId) && rawSwipeId >= 0 ? rawSwipeId : 0;
  const swipeVariables = Array.isArray(variables) ? variables[swipeId] : asRecord(variables)?.[String(swipeId)];
  return asRecord(swipeVariables)?.[key];
}

export function extractDialogueMapFromMessage(message: string) {
  const inlineExtraction = extractInlineDialogueMapFromMessage(message);
  const messageWithoutInlineMarkers = inlineExtraction.cleanedMessage;
  const rawEntries: string[] = [];
  DIALOGUE_MAP_CAPTURE_PATTERN.lastIndex = 0;
  for (const match of messageWithoutInlineMarkers.matchAll(DIALOGUE_MAP_CAPTURE_PATTERN)) {
    rawEntries.push(match[1] ?? '');
  }
  const bareMap =
    rawEntries.length === 0 ? extractBareDialogueMapAfterContent(messageWithoutInlineMarkers) : null;
  const payload = rawEntries[rawEntries.length - 1] ?? bareMap?.payload ?? '';
  const legacyEntries = sanitizeDialogueMapEntries(parseDialogueMapPayload(payload));
  const legacyFound = rawEntries.length > 0 || bareMap !== null;
  const cleanedMessage =
    bareMap === null
      ? stripDialogueMapBlocks(messageWithoutInlineMarkers)
      : stripDialogueMapBlocks(
          `${messageWithoutInlineMarkers.slice(0, bareMap.start)}${messageWithoutInlineMarkers.slice(bareMap.end)}`,
        );

  return {
    found: inlineExtraction.found || legacyFound,
    cleanedMessage,
    entries: inlineExtraction.entries.length > 0 ? inlineExtraction.entries : legacyEntries,
  };
}

function extractInlineDialogueMapFromMessage(message: string) {
  let found = false;
  let entries: DialogueMapEntry[] = [];
  CONTENT_BLOCK_CAPTURE_PATTERN.lastIndex = 0;

  const cleanedMessage = message.replace(
    CONTENT_BLOCK_CAPTURE_PATTERN,
    (_fullMatch, openTag: string, _tagName: string, contentBody: string, closeTag: string) => {
      const extraction = extractInlineDialogueMapFromContent(contentBody);
      if (!found && extraction.found) {
        found = true;
        entries = extraction.entries;
      }
      return `${openTag}${extraction.cleanedContent}${closeTag}`;
    },
  );

  return { found, cleanedMessage, entries };
}

function extractInlineDialogueMapFromContent(content: string) {
  INLINE_DIALOGUE_TAG_PATTERN.lastIndex = 0;
  const markers = Array.from(content.matchAll(INLINE_DIALOGUE_TAG_PATTERN));
  const cleanedContent = stripInlineDialogueMarkers(content);
  if (markers.length === 0) {
    return { found: false, cleanedContent, entries: [] as DialogueMapEntry[] };
  }

  const paragraphs = splitNaturalParagraphs(cleanedContent);
  const entries = markers.flatMap((marker, markerIndex) => {
    const markerOffset = marker.index ?? 0;
    const cleanedPrefix = stripInlineDialogueMarkers(content.slice(0, markerOffset));
    const prefixParagraphs = splitNaturalParagraphs(cleanedPrefix);
    const paragraphNumber = prefixParagraphs.length;
    const paragraph = paragraphs[paragraphNumber - 1];
    const paragraphPrefix = prefixParagraphs[paragraphNumber - 1];
    if (paragraphNumber <= 0 || paragraph === undefined || paragraphPrefix === undefined) {
      return [];
    }

    const attributes = parseInlineDialogueAttributes(marker[2] ?? '');
    const speaker = sanitizeSpeakerLabel(attributes.speaker);
    const focus = sanitizeSpeakerLabel(attributes.focus) ?? speaker;
    return [
      {
        i: markerIndex + 1,
        p: paragraphNumber,
        line_start: sanitizeBoundarySnippet(paragraph, 'start'),
        line_end: sanitizeBoundarySnippet(paragraph, 'end'),
        anchor: extractInlineDialogueAnchor(paragraphPrefix),
        speaker,
        focus,
        kind: 'speech' as const,
      },
    ];
  });

  return {
    found: true,
    cleanedContent,
    entries: sanitizeDialogueMapEntries(entries),
  };
}

function splitNaturalParagraphs(content: string) {
  return content
    .split(/\n(?:[ \t]*\n)+/)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0);
}

function parseInlineDialogueAttributes(source: string) {
  const attributes: { speaker?: string; focus?: string } = {};
  INLINE_DIALOGUE_ATTRIBUTE_PATTERN.lastIndex = 0;
  for (const match of source.matchAll(INLINE_DIALOGUE_ATTRIBUTE_PATTERN)) {
    const key = match[1]?.toLowerCase() as 'speaker' | 'focus' | undefined;
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    if (key !== undefined) {
      attributes[key] = value;
    }
  }
  return attributes;
}

function extractInlineDialogueAnchor(paragraphPrefix: string) {
  const text = paragraphPrefix.trim();
  const quotedTail = text.match(/(?:“([^”]+)”|"([^"]+)"|「([^」]+)」|『([^』]+)』)$/u);
  if (quotedTail !== null) {
    return sanitizeAnchor(quotedTail.slice(1).find(value => value !== undefined) ?? quotedTail[0]);
  }

  const colonIndex = Math.max(text.lastIndexOf('：'), text.lastIndexOf(':'));
  const directSpeechTail = colonIndex >= 0 ? text.slice(colonIndex + 1) : text.slice(-12);
  return sanitizeAnchor(directSpeechTail) || sanitizeAnchor(text);
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
  const record = asRecord(value);
  const nestedEntries = record?.entries;
  const rawEntries: unknown[] = Array.isArray(value) ? value : Array.isArray(nestedEntries) ? nestedEntries : [];
  const entries: DialogueMapEntry[] = [];

  for (const rawEntry of rawEntries) {
    const entryRecord = asRecord(rawEntry);
    if (entryRecord === null) {
      continue;
    }

    const index = Number(entryRecord.i);
    const paragraphIndex = sanitizeParagraphNumber(entryRecord.p);
    const lineStart = sanitizeBoundarySnippet(entryRecord.line_start, 'start');
    const lineEnd = sanitizeBoundarySnippet(entryRecord.line_end, 'end');
    const anchor = sanitizeAnchor(entryRecord.anchor) || lineStart || lineEnd || '';
    if (!Number.isInteger(index) || index <= 0 || anchor.length === 0) {
      continue;
    }

    const speaker = sanitizeSpeakerLabel(entryRecord.speaker);
    const focus = sanitizeSpeakerLabel(entryRecord.focus);
    entries.push({
      i: index,
      p: paragraphIndex,
      line_start: lineStart,
      line_end: lineEnd,
      anchor,
      speaker,
      focus: focus ?? speaker,
      kind: sanitizeMapKind(entryRecord.kind),
    });
  }

  return entries.sort((left, right) => (left.p ?? left.i) - (right.p ?? right.i) || left.i - right.i);
}

function ensureDialogueMapEntryFocus(entry: DialogueMapEntry): DialogueMapEntry {
  if (
    entry.speaker === null ||
    entry.speaker === undefined ||
    (entry.focus !== null && entry.focus !== undefined)
  ) {
    return entry;
  }

  return { ...entry, focus: entry.speaker };
}

function sanitizeAnchor(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12);
}

function sanitizeBoundarySnippet(value: unknown, edge: 'start' | 'end') {
  if (typeof value !== 'string') {
    return null;
  }

  const text = value.replace(/\s+/g, ' ').trim();
  const normalizedValue = edge === 'start' ? text.slice(0, 10) : text.slice(-10);
  return normalizedValue.length > 0 ? normalizedValue : null;
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
  return value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
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
