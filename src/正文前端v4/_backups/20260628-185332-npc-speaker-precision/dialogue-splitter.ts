import type { DialogueSegment, DialogueSource, DialogueSplitResult } from '../types/narrative';
import { inferDialogueEmotion } from './dialogue-emotion';

const SPEECH_VERB_PATTERN =
  /(说|问|喊|道|低声说|低声道|答道|回答|回答道|解释|解释道|提醒|提醒道|开口|回应|嘟囔|念叨|压低声音|笑道|轻笑说|微笑说|补了一句|骂道|吼道|叫道|冷声|冷声说|厉声|厉声说|轻声|轻声说|低语|喃喃)/;
const LEADING_ATTRIBUTION_PATTERN =
  /(说|问|喊|道|答道|回答|回答道|解释|解释道|提醒|开口|回应|嘟囔|念叨|压低声音|笑道|轻笑说|微笑说|骂道|吼道|叫道|冷声|冷声说|厉声|厉声说|轻声|轻声说|低语|喃喃|轻笑|微笑|错愕|惊讶|恼火|睁大眼|抬头|停步|攥紧|松了口气|舒了口气)[：:，,。！？!?]*$/;
const ATTRIBUTION_BOUNDARY_PATTERN = /[。！？!?；;]\s*$/;
const SPEECH_VERB_TAIL_PATTERN =
  /(?:低声说|低声道|回答道|解释道|提醒道|压低声音|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|答道|回答|解释|提醒|嘟囔|念叨|笑道|骂道|吼道|叫道|冷声|厉声|轻声|低语|喃喃|开口|回应|说|问|喊|道)$/;
const SPEECH_TAG_TAIL_PATTERN =
  /(?:[，,]\s*)?(?:(?:[\u4e00-\u9fa5A-Za-z]{1,8}地|低声|轻声|柔声|冷声|厉声|小声|大声|沉声|淡淡|缓缓|慢慢|认真|平静|温柔|急切|犹豫|一字一顿|压低声音)\s*)?(?:低声说|低声道|回答道|解释道|提醒道|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|答道|回答|解释|提醒|嘟囔|念叨|笑道|骂道|吼道|叫道|低语|喃喃|开口|回应|说|问|喊|道)$/;
const CROSS_PARAGRAPH_ATTRIBUTION_TAIL_PATTERN =
  /(?:这么|这样|如此)?(?:向[^。！？!?；;\n]{0,20})?(?:打招呼道|招呼道|低声说|低声道|回答道|解释道|提醒道|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|说道|问道|喊道|答道|笑道|骂道|吼道|叫道|回答|解释|提醒|嘟囔|念叨|低语|喃喃|开口|回应|说|问|喊|道)[。！？!?]*$/;
const SELF_NAMED_SPEAKER_PATTERN =
  /(?:我叫|名叫|叫做)([\u4e00-\u9fa5A-Za-z]{2,10})(?=[，,。！？!?、\s“”"'「」『』]|$)|自称([\u4e00-\u9fa5A-Za-z]{2,10}?)(?=的那位|这位|那位|同学|学姐|学长|老师|先生|小姐|女士|[，,。！？!?、\s“”"'「」『』]|$)/g;
const DIALOGUE_QUOTE_PUNCTUATION_PATTERN = /[，,。！？!?；;…❓❗]|\.\.\./;
const SHORT_NARRATION_MAX_CHARS = 56;
const SHORT_NARRATION_GROUP_MAX_CHARS = 120;
const SHORT_NARRATION_GROUP_MAX_SEGMENTS = 3;
const NARRATIVE_SPEAKER_LABEL_PATTERN =
  /旁白|叙述|系统|提示|说明|补充|备注|注释|小字|文字|标题|规则|选项|状态|环境|地点|时间|画面|镜头|场景|内心|心理|独白|心声|声音|广播|公告|通知|字幕|旁注|前情|总结|信息|面板|日志|内容|下一行|下面|上面|本段/;
const SPEAKER_LABEL_MAX_LENGTH = 8;
const QUOTE_PAIRS = [
  ['“', '”'],
  ['「', '」'],
  ['『', '』'],
  ['"', '"'],
] as const;
const COLON_LINE_PATTERN = /^([^：:]{1,18})[：:]\s*(.+)$/;
const ATTRIBUTION_ACTION_TAIL_PATTERN = LEADING_ATTRIBUTION_PATTERN;
const LEADING_ACTION_AFTER_SPEAKER_PATTERN =
  /^(?:从|向|朝|对|把|被|在|低头|抬头|转身|回头|走|跑|站|坐|靠|停|凑|退|伸|收|拿|放|推|拉|扶|抱|拍|点|摇|眨|睁|眯|皱|抿|咬|捂|笑|轻笑|微笑|苦笑|愣|怔|叹|开口|回应|说|问|喊|道)/;
const LEADING_ACTION_SUBJECT_PATTERN =
  /^([\u4e00-\u9fa5A-Za-z]{2,10})(?=(?:从|向|朝|对|把|被|在|低头|抬头|转身|回头|走|跑|站|坐|靠|停|凑|退|伸|收|拿|放|推|拉|扶|抱|拍|点|摇|眨|睁|眯|皱|抿|咬|捂|笑|轻笑|微笑|苦笑|愣|怔|叹|开口|回应|说|问|喊|道))/;
const GENERIC_ACTION_SUBJECT_PATTERN =
  /^(?:这|那|这个|那个|这种|那种|这些|那些|有人|众人|大家|所有人|声音|笑声|话语|目光|空气|气氛|文件|资料|纸张|书页|门|窗|光线|脚步|教室|走廊)$/;

type QuoteMatch = {
  start: number;
  end: number;
  text: string;
};

function hashContent(input: string) {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(index);
  }
  return `bp-${Math.abs(hash >>> 0).toString(16)}`;
}

function normalizeText(content: string) {
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
  const withoutHiddenBlocks = normalizedContent
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, '')
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<option>[\s\S]*?<\/option>/gi, '')
    .replace(/<sum>[\s\S]*?<\/sum>/gi, '');
  const contentMatches = Array.from(withoutHiddenBlocks.matchAll(/<content>([\s\S]*?)<\/content>/gi));
  const maintextMatches = Array.from(withoutHiddenBlocks.matchAll(/<maintext>([\s\S]*?)<\/maintext>/gi));
  const visibleMatches = contentMatches.length > 0 ? contentMatches : maintextMatches;
  const visibleContent = visibleMatches.length > 0
    ? visibleMatches[visibleMatches.length - 1][1]
    : withoutHiddenBlocks;

  return visibleContent
    .replace(/<\/?(?:content|maintext)>/gi, '')
    .replace(/^\s*<[^>\n]+>\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function withEmotion(
  segment: Omit<DialogueSegment, 'mood' | 'moodConfidence'>,
  emotionText = segment.text,
): DialogueSegment {
  const emotion = inferDialogueEmotion(emotionText);
  return {
    ...segment,
    mood: emotion.mood,
    moodConfidence: emotion.confidence,
  };
}

function splitNarrationParagraph(paragraph: string, paragraphIndex: number, idPrefix = 'narration') {
  const sentences = paragraph
    .split(/(?<=[。！？!?；;…])/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);

  if (sentences.length === 0) {
    return [
      withEmotion({
        id: `segment-${paragraphIndex}-${idPrefix}-0`,
        kind: 'narration',
        side: 'center',
        speaker: null,
        text: paragraph,
        sourceIndex: paragraphIndex,
      }),
    ];
  }

  return sentences.map(
    (sentence, sentenceIndex) =>
      withEmotion({
        id: `segment-${paragraphIndex}-${idPrefix}-${sentenceIndex}`,
        kind: 'narration',
        side: 'center',
        speaker: null,
        text: sentence,
        sourceIndex: paragraphIndex,
      }),
  );
}

function uniqueNonEmpty(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalizedValue = value.trim();
    if (normalizedValue.length === 0 || seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    result.push(normalizedValue);
  }

  return result;
}

function createSpeakerCandidates(source: DialogueSource) {
  const knownCharacters = source.knownCharacters.filter(isPlausibleSpeakerLabel);
  return uniqueNonEmpty([...knownCharacters, ...source.userAliases]).sort((left, right) => {
    return right.length - left.length;
  });
}

function findKnownSpeaker(label: string, source: DialogueSource) {
  const normalizedLabel = label.trim();
  if (!source.userAliases.includes(normalizedLabel) && !isPlausibleSpeakerLabel(normalizedLabel)) {
    return null;
  }

  return createSpeakerCandidates(source).find(speaker => speaker === normalizedLabel) ?? null;
}

function findSelfNamedSpeaker(text: string, source: DialogueSource) {
  SELF_NAMED_SPEAKER_PATTERN.lastIndex = 0;

  for (const match of text.matchAll(SELF_NAMED_SPEAKER_PATTERN)) {
    const speaker = findKnownSpeaker(match[1] ?? match[2] ?? '', source);
    if (speaker !== null) {
      return speaker;
    }
  }

  return null;
}

function hasDialoguePunctuation(text: string) {
  return DIALOGUE_QUOTE_PUNCTUATION_PATTERN.test(text);
}

function getCompactTextLength(text: string) {
  return text.replace(/\s+/g, '').length;
}

function hasDialogueLikeQuote(text: string) {
  return findQuoteMatches(text).some(match => hasDialoguePunctuation(match.text));
}

function isMergeableShortNarration(segment: DialogueSegment) {
  return (
    segment.kind === 'narration' &&
    segment.speaker === null &&
    getCompactTextLength(segment.text) <= SHORT_NARRATION_MAX_CHARS &&
    !hasDialogueLikeQuote(segment.text)
  );
}

function isPlausibleSpeakerLabel(label: string) {
  const normalizedLabel = label.trim();
  if (normalizedLabel.length === 0 || normalizedLabel.length > SPEAKER_LABEL_MAX_LENGTH) {
    return false;
  }

  if (NARRATIVE_SPEAKER_LABEL_PATTERN.test(normalizedLabel)) {
    return false;
  }

  return !/[，,。！？!?；;、]/.test(normalizedLabel);
}

function isPlausibleActionSpeakerLabel(label: string) {
  return isPlausibleSpeakerLabel(label) && !GENERIC_ACTION_SUBJECT_PATTERN.test(label.trim());
}

function findSpeakerInText(text: string, source: DialogueSource) {
  const matches = createSpeakerCandidates(source)
    .map(speaker => ({ speaker, index: text.indexOf(speaker) }))
    .filter(match => match.index >= 0)
    .sort((left, right) => left.index - right.index || right.speaker.length - left.speaker.length);
  return matches[0]?.speaker ?? null;
}

function scoreSpeakerCandidate(speaker: string, contextBefore: string, contextAfter: string) {
  let score = Number.NEGATIVE_INFINITY;
  const beforeIndex = contextBefore.lastIndexOf(speaker);

  if (beforeIndex >= 0) {
    const distance = contextBefore.length - beforeIndex - speaker.length;
    const afterName = contextBefore.slice(beforeIndex + speaker.length);
    score = Math.max(score, 240 - distance * 4 + (SPEECH_VERB_PATTERN.test(afterName) ? 120 : 0));
  }

  const afterIndex = contextAfter.indexOf(speaker);
  if (afterIndex >= 0) {
    const afterName = contextAfter.slice(afterIndex + speaker.length, afterIndex + speaker.length + 16);
    score = Math.max(score, 220 - afterIndex * 4 + (SPEECH_VERB_PATTERN.test(afterName) ? 120 : 0));
  }

  return score;
}

function inferSpeaker(
  contextBefore: string,
  contextAfter: string,
  source: DialogueSource,
) {
  const scoredCandidates = createSpeakerCandidates(source)
    .map(speaker => ({ speaker, score: scoreSpeakerCandidate(speaker, contextBefore, contextAfter) }))
    .filter(candidate => Number.isFinite(candidate.score))
    .sort((left, right) => right.score - left.score || right.speaker.length - left.speaker.length);
  const bestCandidate = scoredCandidates[0];
  if (bestCandidate !== undefined) {
    return bestCandidate.speaker;
  }

  const windowText = `${contextBefore}${contextAfter}`;
  const fallbackMatch = windowText.match(/([\u4e00-\u9fa5A-Za-z{}]{1,10})(?=.{0,6}(?:说|问|喊|答|提醒|开口))/);
  return fallbackMatch !== null ? findKnownSpeaker(fallbackMatch[1], source) : null;
}

function inferLeadingAttribution(leadingText: string, source: DialogueSource) {
  const trimmedText = leadingText.trim();
  if (trimmedText.length === 0 || !LEADING_ATTRIBUTION_PATTERN.test(trimmedText)) {
    return null;
  }

  const speakerCandidates = createSpeakerCandidates(source);
  const speakerMatches = speakerCandidates
    .map(speaker => ({ speaker, index: trimmedText.indexOf(speaker) }))
    .filter(match => match.index >= 0)
    .sort((left, right) => left.index - right.index || right.speaker.length - left.speaker.length);
  const firstMatch = speakerMatches[0];

  if (firstMatch === undefined) {
    return null;
  }

  const prefix = trimmedText.slice(0, firstMatch.index).trim();
  if (prefix.length > 0 && !ATTRIBUTION_BOUNDARY_PATTERN.test(prefix)) {
    return null;
  }

  return {
    prefix,
    speaker: firstMatch.speaker,
    text: trimmedText.slice(firstMatch.index).trim(),
  };
}

function extractLeadingActionText(attributionText: string, speaker: string) {
  const normalizedText = attributionText.replace(/[：:，,。！？!?]*$/, '').trim();
  const actionText = normalizedText.replace(SPEECH_TAG_TAIL_PATTERN, '').replace(SPEECH_VERB_TAIL_PATTERN, '').trim();

  if (actionText.length === 0 || actionText === speaker) {
    return null;
  }

  return actionText;
}

function inferTrailingAttribution(trailingText: string, source: DialogueSource) {
  const leadingWhitespaceLength = trailingText.length - trailingText.trimStart().length;
  const trimmedText = trailingText.trimStart();
  const match = trimmedText.match(/^([^“”「」『』"\n]{1,36}[。！？!?，,；;]?)/);
  const candidate = match?.[1]?.trim() ?? '';

  if (candidate.length === 0 || !ATTRIBUTION_ACTION_TAIL_PATTERN.test(candidate)) {
    return null;
  }

  const speaker = findSpeakerInText(candidate, source);
  if (speaker === null) {
    return null;
  }

  return {
    consumedLength: leadingWhitespaceLength + (match?.[1]?.length ?? 0),
    speaker,
    text: candidate,
  };
}

function findQuotePairAt(text: string, index: number) {
  return QUOTE_PAIRS.find(([openQuote]) => text.startsWith(openQuote, index)) ?? null;
}

function findClosingQuote(text: string, openQuote: string, closeQuote: string, startIndex: number) {
  for (let index = startIndex; index < text.length; index += 1) {
    if (!text.startsWith(closeQuote, index)) {
      continue;
    }
    if (openQuote === closeQuote && text[index - 1] === '\\') {
      continue;
    }
    return index;
  }

  return -1;
}

function findQuoteMatches(paragraph: string) {
  const matches: QuoteMatch[] = [];
  let cursor = 0;

  while (cursor < paragraph.length) {
    const quotePair = findQuotePairAt(paragraph, cursor);
    if (quotePair === null) {
      cursor += 1;
      continue;
    }

    const [openQuote, closeQuote] = quotePair;
    const contentStart = cursor + openQuote.length;
    const closeIndex = findClosingQuote(paragraph, openQuote, closeQuote, contentStart);
    if (closeIndex < 0) {
      break;
    }

    const end = closeIndex + closeQuote.length;
    matches.push({
      start: cursor,
      end,
      text: paragraph.slice(cursor, end).trim(),
    });
    cursor = end;
  }

  return matches;
}

function isStandaloneQuoteMatch(paragraph: string, match: QuoteMatch) {
  return paragraph.slice(0, match.start).trim().length === 0 && paragraph.slice(match.end).trim().length === 0;
}

function inferAttributionParagraphSpeaker(paragraph: string | undefined, source: DialogueSource) {
  const trimmedText = paragraph?.trim() ?? '';
  if (trimmedText.length === 0 || trimmedText.length > 96 || findQuoteMatches(trimmedText).length > 0) {
    return null;
  }

  if (!CROSS_PARAGRAPH_ATTRIBUTION_TAIL_PATTERN.test(trimmedText)) {
    return null;
  }

  return findSpeakerInText(trimmedText, source);
}

function resolveSegmentKind(speaker: string | null, source: DialogueSource) {
  if (speaker === null) {
    return { kind: 'narration' as const, side: 'center' as const };
  }

  const isKnownCharacter = source.knownCharacters.some(character => isPlausibleSpeakerLabel(character) && character === speaker);
  if (isKnownCharacter) {
    return { kind: 'npc' as const, side: 'right' as const };
  }

  const isUser = source.userAliases.some(alias => alias === speaker);
  if (isUser) {
    return { kind: 'user' as const, side: 'left' as const };
  }

  return { kind: 'npc' as const, side: 'right' as const };
}

function inferLeadingActionSpeaker(paragraph: string, source: DialogueSource) {
  const trimmedParagraph = paragraph.trim();
  const candidateMatch = createSpeakerCandidates(source)
    .filter(speaker => trimmedParagraph.startsWith(speaker))
    .map(speaker => ({ speaker, rest: trimmedParagraph.slice(speaker.length).trimStart() }))
    .filter(match => LEADING_ACTION_AFTER_SPEAKER_PATTERN.test(match.rest))
    .sort((left, right) => right.speaker.length - left.speaker.length)[0];

  if (candidateMatch !== undefined) {
    return candidateMatch.speaker;
  }

  const rawMatch = trimmedParagraph.match(LEADING_ACTION_SUBJECT_PATTERN);
  if (rawMatch === null || !isPlausibleActionSpeakerLabel(rawMatch[1])) {
    return null;
  }

  return rawMatch[1];
}

function splitNamedActionParagraph(paragraph: string, paragraphIndex: number, source: DialogueSource) {
  const speaker = inferLeadingActionSpeaker(paragraph, source);
  if (speaker === null) {
    return null;
  }

  const role = resolveSegmentKind(speaker, source);
  return [
    withEmotion({
      id: `segment-${paragraphIndex}-action-0`,
      kind: role.kind,
      side: role.side,
      speaker,
      text: paragraph,
      sourceIndex: paragraphIndex,
    }),
  ];
}

function splitColonParagraph(paragraph: string, paragraphIndex: number, source: DialogueSource) {
  const match = paragraph.match(COLON_LINE_PATTERN);
  if (match === null) {
    return null;
  }

  const speaker = findKnownSpeaker(match[1], source);
  if (speaker === null) {
    return null;
  }

  const role = resolveSegmentKind(speaker, source);
  return [
    withEmotion(
      {
        id: `segment-${paragraphIndex}-colon-0`,
        kind: role.kind,
        side: role.side,
        speaker,
        text: match[2].trim(),
        sourceIndex: paragraphIndex,
      },
      paragraph,
    ),
  ];
}

function inferQuoteSpeaker(paragraph: string, match: QuoteMatch, source: DialogueSource, nextParagraph?: string) {
  const leading = paragraph.slice(0, match.start).trim();
  const quoteText = match.text;
  const trailingText = paragraph.slice(match.end);
  const trailingAttribution = inferTrailingAttribution(trailingText, source);
  const trailingWindow = trailingText.slice(0, Math.max(24, trailingAttribution?.consumedLength ?? 0));
  const leadingWindow = paragraph.slice(Math.max(0, match.start - 24), match.start);
  const leadingAttribution = inferLeadingAttribution(leading, source);
  const speakerCandidate = inferSpeaker(leadingWindow, trailingWindow, source);
  const withVerb = SPEECH_VERB_PATTERN.test(`${leadingWindow}${trailingWindow}`);
  const selfNamedSpeaker = findSelfNamedSpeaker(quoteText, source);
  const nextParagraphSpeaker = isStandaloneQuoteMatch(paragraph, match)
    ? inferAttributionParagraphSpeaker(nextParagraph, source)
    : null;

  return leadingAttribution?.speaker ?? trailingAttribution?.speaker ?? selfNamedSpeaker ?? nextParagraphSpeaker ?? (withVerb ? speakerCandidate : null);
}

function splitQuotedParagraph(paragraph: string, paragraphIndex: number, source: DialogueSource, nextParagraph?: string) {
  const segments: DialogueSegment[] = [];
  const quoteMatches = findQuoteMatches(paragraph).filter(match => hasDialoguePunctuation(match.text));
  if (!quoteMatches.some(match => inferQuoteSpeaker(paragraph, match, source, nextParagraph) !== null)) {
    return [
      withEmotion({
        id: `segment-${paragraphIndex}-quote-narration-0`,
        kind: 'narration',
        side: 'center',
        speaker: null,
        text: paragraph,
        sourceIndex: paragraphIndex,
      }),
    ];
  }

  let lastCursor = 0;

  quoteMatches.forEach((match, quoteIndex) => {
    const leading = paragraph.slice(lastCursor, match.start).trim();
    const quoteText = match.text;
    const trailingText = paragraph.slice(match.end);
    const trailingAttribution = inferTrailingAttribution(trailingText, source);
    const trailingWindow = trailingText.slice(0, Math.max(24, trailingAttribution?.consumedLength ?? 0));
    const leadingWindow = paragraph.slice(Math.max(0, match.start - 24), match.start);
    const leadingAttribution = inferLeadingAttribution(leading, source);
    if (leadingAttribution !== null) {
      if (leadingAttribution.prefix.length > 0) {
        segments.push(...splitNarrationParagraph(leadingAttribution.prefix, paragraphIndex, `prequote-${quoteIndex}`));
      }

      const actionText = extractLeadingActionText(leadingAttribution.text, leadingAttribution.speaker);
      if (actionText !== null) {
        segments.push(...splitNarrationParagraph(actionText, paragraphIndex, `prequote-action-${quoteIndex}`));
      }
    } else if (leading.length > 0) {
      segments.push(...splitNarrationParagraph(leading, paragraphIndex, `prequote-${quoteIndex}`));
    }

    const speakerCandidate = inferSpeaker(leadingWindow, trailingWindow, source);
    const withVerb = SPEECH_VERB_PATTERN.test(`${leadingWindow}${trailingWindow}`);
    const selfNamedSpeaker = findSelfNamedSpeaker(quoteText, source);
    const nextParagraphSpeaker = isStandaloneQuoteMatch(paragraph, match)
      ? inferAttributionParagraphSpeaker(nextParagraph, source)
      : null;
    const speaker =
      leadingAttribution?.speaker ?? trailingAttribution?.speaker ?? selfNamedSpeaker ?? nextParagraphSpeaker ?? (withVerb ? speakerCandidate : null);
    const role = resolveSegmentKind(speaker, source);

    segments.push(
      withEmotion(
        {
          id: `segment-${paragraphIndex}-quote-${quoteIndex}`,
          kind: role.kind,
          side: role.side,
          speaker,
          text: quoteText,
          sourceIndex: paragraphIndex,
        },
        `${leadingWindow} ${quoteText} ${trailingWindow}`,
      ),
    );

    lastCursor = match.end + (trailingAttribution?.consumedLength ?? 0);
  });

  const tail = paragraph.slice(lastCursor).trim();
  if (tail.length > 0) {
    segments.push(...splitNarrationParagraph(tail, paragraphIndex, 'tail'));
  }

  return segments;
}

function splitParagraph(paragraph: string, paragraphIndex: number, source: DialogueSource, nextParagraph?: string) {
  const colonSegments = splitColonParagraph(paragraph, paragraphIndex, source);
  if (colonSegments !== null) {
    return colonSegments;
  }

  if (findQuoteMatches(paragraph).length > 0) {
    return splitQuotedParagraph(paragraph, paragraphIndex, source, nextParagraph);
  }

  const namedActionSegments = splitNamedActionParagraph(paragraph, paragraphIndex, source);
  if (namedActionSegments !== null) {
    return namedActionSegments;
  }

  return splitNarrationParagraph(paragraph, paragraphIndex);
}

function mergeShortNarrationSegments(segments: DialogueSegment[]) {
  const mergedSegments: DialogueSegment[] = [];
  let segmentIndex = 0;

  while (segmentIndex < segments.length) {
    const segment = segments[segmentIndex];
    if (!isMergeableShortNarration(segment)) {
      mergedSegments.push(segment);
      segmentIndex += 1;
      continue;
    }

    const group = [segment];
    let groupLength = getCompactTextLength(segment.text);
    let nextIndex = segmentIndex + 1;

    while (nextIndex < segments.length && group.length < SHORT_NARRATION_GROUP_MAX_SEGMENTS) {
      const nextSegment = segments[nextIndex];
      if (!isMergeableShortNarration(nextSegment)) {
        break;
      }

      const nextLength = getCompactTextLength(nextSegment.text);
      if (groupLength + nextLength > SHORT_NARRATION_GROUP_MAX_CHARS) {
        break;
      }

      group.push(nextSegment);
      groupLength += nextLength;
      nextIndex += 1;
    }

    if (group.length === 1) {
      mergedSegments.push(segment);
      segmentIndex += 1;
      continue;
    }

    const mergedText = group.map(item => item.text).join('\n');
    mergedSegments.push(
      withEmotion(
        {
          ...group[0],
          id: `${group[0].id}-merged-${group.length}`,
          text: mergedText,
        },
        mergedText.replace(/\n/g, ' '),
      ),
    );
    segmentIndex = nextIndex;
  }

  return mergedSegments;
}

export function splitDialogueSource(source: DialogueSource): DialogueSplitResult {
  const content = normalizeText(source.content);
  const paragraphs = content
    .split(/\n{2,}/)
    .flatMap(block => block.split('\n'))
    .map(block => block.trim())
    .filter(block => block.length > 0);

  const segments = paragraphs.flatMap((paragraph, paragraphIndex) =>
    splitParagraph(paragraph, paragraphIndex, source, paragraphs[paragraphIndex + 1]),
  );

  return {
    segments: mergeShortNarrationSegments(segments),
    sourceMessageId: source.messageId,
    sourceContentHash: hashContent(content),
    knownCharacters: source.knownCharacters,
  };
}
