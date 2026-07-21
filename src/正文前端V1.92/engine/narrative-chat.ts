import type { DialogueSegment } from '../types/narrative';

export type NarrativeChatSide = 'left' | 'right';
export type NarrativeChatAvatarKind = 'avatar' | 'portrait';

export interface NarrativeChatAvatarCandidate {
  url: string;
  kind: NarrativeChatAvatarKind;
}

export interface NarrativeChatNarrationRow {
  id: string;
  segmentId: string;
  kind: 'narration';
  text: string;
  sourceIndex: number;
}

export interface NarrativeChatDialogueRow {
  id: string;
  segmentId: string;
  kind: 'dialogue';
  segmentKind: 'user' | 'npc';
  side: NarrativeChatSide;
  speaker: string;
  affiliation: string | null;
  avatarCandidates: NarrativeChatAvatarCandidate[];
  text: string;
  sourceIndex: number;
  startsGroup: boolean;
  endsGroup: boolean;
}

export type NarrativeChatRow = NarrativeChatNarrationRow | NarrativeChatDialogueRow;
export type NarrativeChatAppendAction = 'none' | 'follow' | 'notify';

export interface NarrativeChatResolvers {
  resolveSpeakerName(segment: DialogueSegment): string;
  resolveAffiliation(segment: DialogueSegment): string | null;
  resolveAvatarCandidates(segment: DialogueSegment): NarrativeChatAvatarCandidate[];
}

type NarrativeChatTextPart = {
  kind: 'dialogue' | 'narration';
  text: string;
};

type NarrativeChatQuoteMatch = {
  start: number;
  end: number;
  text: string;
};

const CHAT_QUOTE_PATTERN = /“([^”\n]+)”|「([^」\n]+)」|『([^』\n]+)』|"([^"\n]+)"/g;
const CHAT_ATTRIBUTION_VERB_ALTERNATIVES =
  '打招呼道|招呼道|低声说|低声道|轻声说|柔声说|冷声说|厉声说|小声说|沉声说|说道|问道|喊道|答道|回答道|解释道|提醒道|回应道|补了一句|说完|问完|答完|说着|问着|答着|开口|出声|回答|解释|提醒|回应|嘟囔|念叨|低语|喃喃|笑道|说|问|喊';
const CHAT_ATTRIBUTION_VERB_PATTERN = `(?:${CHAT_ATTRIBUTION_VERB_ALTERNATIVES})`;
const CHAT_ATTRIBUTION_SUBJECT_PATTERN =
  '(?:(?:她|他|TA|Ta|ta|对方|那人|这人|这个人|那个人|那道声音|这道声音|[\\u4e00-\\u9fa5A-Za-z·]{1,16})\\s*)?';
const CHAT_ATTRIBUTION_MODIFIER_PATTERN =
  '(?:(?:有些|略微|微微|轻轻|低声|轻声|柔声|冷声|厉声|小声|大声|沉声|淡淡|缓缓|慢慢|认真|平静|温和|温柔|急切|犹豫|迟疑)(?:地)?\\s*)*';
const CHAT_TRAILING_ATTRIBUTION_PATTERN = new RegExp(
  `(?:[，,]\\s*)?${CHAT_ATTRIBUTION_SUBJECT_PATTERN}${CHAT_ATTRIBUTION_MODIFIER_PATTERN}${CHAT_ATTRIBUTION_VERB_PATTERN}[：:，,。.!！?？；;\\s]*$`,
  'u',
);
const CHAT_LEADING_ATTRIBUTION_PATTERN = new RegExp(
  `^${CHAT_ATTRIBUTION_SUBJECT_PATTERN}${CHAT_ATTRIBUTION_MODIFIER_PATTERN}${CHAT_ATTRIBUTION_VERB_PATTERN}[：:，,。.!！?？；;\\s]+`,
  'u',
);
const CHAT_ONLY_PUNCTUATION_PATTERN = /^[，,。.!！?？；;：:…—\s]+$/;

export function buildNarrativeChatRows(
  segments: DialogueSegment[],
  resolvers: NarrativeChatResolvers,
): NarrativeChatRow[] {
  const rows = segments.flatMap<NarrativeChatRow>(segment => {
    if (segment.kind === 'narration' || isNarrativeChatStructuralNarration(segment)) {
      const narrationText = stripNarrationAttribution(segment.text, segment);
      return narrationText.length > 0 ? [createNarrationRow(segment, narrationText, 0)] : [];
    }

    const speaker = resolvers.resolveSpeakerName(segment).trim() || (segment.kind === 'user' ? '你' : '角色');
    const affiliation = normalizeOptionalText(resolvers.resolveAffiliation(segment));
    const avatarCandidates = uniqueAvatarCandidates(resolvers.resolveAvatarCandidates(segment));

    return splitNarrativeChatSegmentText(segment).map<NarrativeChatRow>((part, partIndex) => {
      if (part.kind === 'narration') {
        return createNarrationRow(segment, part.text, partIndex);
      }

      return {
        id: `chat:${segment.id}:dialogue:${partIndex}`,
        segmentId: segment.id,
        kind: 'dialogue',
        segmentKind: segment.kind,
        side: segment.kind === 'npc' ? 'left' : 'right',
        speaker,
        affiliation,
        avatarCandidates,
        text: part.text,
        sourceIndex: segment.sourceIndex,
        startsGroup: true,
        endsGroup: true,
      };
    });
  });

  return rows.map((row, index) => {
    if (row.kind === 'narration') {
      return row;
    }

    return {
      ...row,
      startsGroup: !isSameDialogueGroup(rows[index - 1], row),
      endsGroup: !isSameDialogueGroup(row, rows[index + 1]),
    };
  });
}

export function splitNarrativeChatSegmentText(segment: DialogueSegment): NarrativeChatTextPart[] {
  if (segment.kind === 'narration') {
    return [{ kind: 'narration', text: segment.text }];
  }

  const quoteMatches = findNarrativeChatQuoteMatches(segment.text);
  if (quoteMatches.length > 0 && shouldExtractNarrativeChatQuotes(segment, quoteMatches[0])) {
    const parts: NarrativeChatTextPart[] = [];
    let cursor = 0;

    quoteMatches.forEach(match => {
      appendNarrationPart(parts, segment.text.slice(cursor, match.start), segment);
      const dialogueText = match.text.trim();
      if (dialogueText.length > 0) {
        parts.push({ kind: 'dialogue', text: dialogueText });
      }
      cursor = match.end;
    });

    appendNarrationPart(parts, segment.text.slice(cursor), segment);
    return parts;
  }

  const dialogueText = stripLeadingDialogueAttribution(segment.text, segment);
  return dialogueText.length > 0 ? [{ kind: 'dialogue', text: dialogueText }] : [];
}

export function resolveNarrativeChatAppendAction(options: {
  isStreaming: boolean;
  isNearLatest: boolean;
  previousRowCount: number;
  rowCount: number;
}): NarrativeChatAppendAction {
  if (!options.isStreaming || options.rowCount <= options.previousRowCount) {
    return 'none';
  }

  return options.isNearLatest || options.previousRowCount === 0 ? 'follow' : 'notify';
}

function isSameDialogueGroup(left: NarrativeChatRow | undefined, right: NarrativeChatRow | undefined) {
  if (left?.kind !== 'dialogue' || right?.kind !== 'dialogue') {
    return false;
  }

  return left.side === right.side && normalizeSpeakerKey(left.speaker) === normalizeSpeakerKey(right.speaker);
}

function createNarrationRow(segment: DialogueSegment, text: string, partIndex: number): NarrativeChatNarrationRow {
  return {
    id: `chat:${segment.id}:narration:${partIndex}`,
    segmentId: segment.id,
    kind: 'narration',
    text,
    sourceIndex: segment.sourceIndex,
  };
}

function isNarrativeChatStructuralNarration(segment: DialogueSegment) {
  return /(?:-prequote(?:-action)?-|-tail-)/.test(segment.id);
}

function findNarrativeChatQuoteMatches(text: string): NarrativeChatQuoteMatch[] {
  return Array.from(text.matchAll(CHAT_QUOTE_PATTERN)).map(match => ({
    start: match.index,
    end: match.index + match[0].length,
    text: match[1] ?? match[2] ?? match[3] ?? match[4] ?? '',
  }));
}

function shouldExtractNarrativeChatQuotes(segment: DialogueSegment, firstMatch: NarrativeChatQuoteMatch) {
  const firstVisibleIndex = segment.text.search(/\S/);
  if (firstMatch.start === firstVisibleIndex) {
    return true;
  }

  const leadingText = segment.text.slice(0, firstMatch.start).trim();
  if (isNarrativeChatAttributionText(leadingText, segment) || /[：:]\s*$/.test(leadingText)) {
    return true;
  }

  if (segment.mapKind !== 'speech') {
    return false;
  }

  const trailingText = segment.text.slice(firstMatch.end).trim();
  return (
    trailingText.length === 0 ||
    /^[，,。.!！?？；;：:…—\s]*$/.test(trailingText) ||
    /[。.!！?？；;]\s*$/.test(leadingText)
  );
}

function appendNarrationPart(parts: NarrativeChatTextPart[], value: string, segment: DialogueSegment) {
  const narrationText = stripNarrationAttribution(value, segment);
  if (narrationText.length > 0) {
    parts.push({ kind: 'narration', text: narrationText });
  }
}

function stripNarrationAttribution(value: string, segment: DialogueSegment) {
  const original = value.trim();
  let normalized = original;
  normalized = normalized.replace(CHAT_TRAILING_ATTRIBUTION_PATTERN, '').trim();
  normalized = normalized.replace(CHAT_LEADING_ATTRIBUTION_PATTERN, '').trim();
  normalized = stripBareDaoAttribution(normalized, segment);
  if (normalized.length === 0 && original.length > 0 && !isSafeWholeAttribution(original, segment)) {
    normalized = original;
  }
  normalized = normalized.replace(/^[，,；;：:\s]+|[，,；;：:\s]+$/g, '').trim();
  return CHAT_ONLY_PUNCTUATION_PATTERN.test(normalized) ? '' : normalized;
}

function stripLeadingDialogueAttribution(value: string, segment: DialogueSegment) {
  const normalized = value.trim();
  let withoutAttribution = stripLeadingBareDaoAttribution(
    normalized.replace(CHAT_LEADING_ATTRIBUTION_PATTERN, '').trim(),
    segment,
  );
  if (withoutAttribution.length === 0 && normalized.length > 0 && !isSafeWholeAttribution(normalized, segment)) {
    withoutAttribution = normalized;
  }
  if (withoutAttribution.length === 0 || CHAT_ONLY_PUNCTUATION_PATTERN.test(withoutAttribution)) {
    return '';
  }

  return withoutAttribution;
}

function isNarrativeChatAttributionText(value: string, segment: DialogueSegment) {
  const normalized = value.trim();
  return (
    CHAT_TRAILING_ATTRIBUTION_PATTERN.test(normalized) || stripBareDaoAttribution(normalized, segment).length === 0
  );
}

function stripBareDaoAttribution(value: string, segment: DialogueSegment) {
  const subjectPattern = createBareDaoSubjectPattern(segment);
  return value.replace(new RegExp(`(?:[，,]\\s*)?${subjectPattern}\\s*道[：:，,。.!！?？；;\\s]*$`, 'u'), '').trim();
}

function stripLeadingBareDaoAttribution(value: string, segment: DialogueSegment) {
  const subjectPattern = createBareDaoSubjectPattern(segment);
  return value.replace(new RegExp(`^${subjectPattern}\\s*道[：:，,。.!！?？；;\\s]+`, 'u'), '').trim();
}

function createBareDaoSubjectPattern(segment: DialogueSegment) {
  const subjects = ['她', '他', 'TA', 'Ta', 'ta', '对方', '那人', '这人', '这个人', '那个人'];
  const speaker = segment.speaker?.trim() ?? '';
  if (speaker.length > 0) {
    subjects.push(speaker);
  }
  const focusSpeaker = segment.focusSpeaker?.trim() ?? '';
  if (focusSpeaker.length > 0) {
    subjects.push(focusSpeaker);
  }

  return `(?:${[...new Set(subjects)].map(escapeRegExp).join('|')})`;
}

function isSafeWholeAttribution(value: string, segment: DialogueSegment) {
  const subjectPattern = createBareDaoSubjectPattern(segment);
  return new RegExp(
    `^${subjectPattern}\\s*${CHAT_ATTRIBUTION_MODIFIER_PATTERN}(?:${CHAT_ATTRIBUTION_VERB_ALTERNATIVES}|道)[：:，,。.!！?？；;\\s]*$`,
    'u',
  ).test(value.trim());
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSpeakerKey(value: string) {
  return value.replace(/[\s{}【】[\]（）()]/g, '').toLocaleLowerCase();
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function uniqueAvatarCandidates(candidates: NarrativeChatAvatarCandidate[]) {
  const seen = new Set<string>();
  const result: NarrativeChatAvatarCandidate[] = [];

  for (const candidate of candidates) {
    const url = candidate.url.trim();
    if (url.length === 0 || seen.has(url)) {
      continue;
    }

    seen.add(url);
    result.push({ url, kind: candidate.kind });
  }

  return result;
}
