import type { DialogueSegment, DialogueSource, DialogueSplitResult } from '../types/narrative';
import { inferDialogueEmotion } from './dialogue-emotion';

const SPEECH_VERB_PATTERN =
  /(说|问|喊|道|低声说|低声道|答道|回答|回答道|解释|解释道|提醒|提醒道|开口|回应|嘟囔|念叨|压低声音|笑道|轻笑说|微笑说|补了一句|骂道|吼道|叫道|冷声|冷声说|厉声|厉声说|轻声|轻声说|低语|喃喃)/;
const LEADING_ATTRIBUTION_PATTERN =
  /(说|问|喊|道|答道|回答|回答道|解释|解释道|提醒|开口|回应|嘟囔|念叨|压低声音|笑道|轻笑说|微笑说|骂道|吼道|叫道|冷声|冷声说|厉声|厉声说|轻声|轻声说|低语|喃喃|轻笑|微笑|错愕|惊讶|恼火|睁大眼|抬头|抬起头|转头|转过头|回头|看向|垂眸|停步|攥紧|松了口气|舒了口气)[：:，,。！？!?]*$/;
const ATTRIBUTION_BOUNDARY_PATTERN = /[。！？!?；;]\s*$/;
const SPEECH_VERB_TAIL_PATTERN =
  /(?:低声说|低声道|回答道|解释道|提醒道|压低声音|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|答道|回答|解释|提醒|嘟囔|念叨|笑道|骂道|吼道|叫道|冷声|厉声|轻声|低语|喃喃|开口|回应|说|问|喊|道)$/;
const SPEECH_TAG_TAIL_PATTERN =
  /(?:[，,]\s*)?(?:(?:[\u4e00-\u9fa5A-Za-z]{1,8}地|低声|轻声|柔声|冷声|厉声|小声|大声|沉声|淡淡|缓缓|慢慢|认真|平静|温柔|急切|犹豫|一字一顿|压低声音)\s*)?(?:低声说|低声道|回答道|解释道|提醒道|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|答道|回答|解释|提醒|嘟囔|念叨|笑道|骂道|吼道|叫道|低语|喃喃|开口|回应|说|问|喊|道)$/;
const CROSS_PARAGRAPH_ATTRIBUTION_TAIL_PATTERN =
  /(?:这么|这样|如此)?(?:向[^。！？!?；;\n]{0,20})?(?:打招呼道|招呼道|低声说|低声道|回答道|解释道|提醒道|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|说道|问道|喊道|答道|笑道|骂道|吼道|叫道|回答|解释|提醒|嘟囔|念叨|低语|喃喃|开口|回应|说|问|喊|道)[。！？!?]*$/;
const COLON_SPEECH_LABEL_PATTERN =
  /(?:低声说|低声道|回答道|解释道|提醒道|压低声音|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|说道|问道|喊道|答道|回答|解释|提醒|嘟囔|念叨|笑道|骂道|吼道|叫道|冷声|厉声|轻声|低声|柔声|小声|大声|沉声|低语|喃喃|开口|回应|说|问|喊|道)$/;
const COLON_MENTAL_LABEL_PATTERN = /(?:心里|内心|心中|脑海|默念|心想|想道|想着)/;
const CONTEXTUAL_MENTION_BEFORE_PATTERN = /(?:是|为|叫做|名叫|名为|自称|正是|便是|就是)\s*$/;
const CONTEXTUAL_MENTION_AFTER_PATTERN =
  /^\s*(?:，|,)?\s*(?:正|正在|仍然|仍旧|依旧|始终|一直|只是|低头|抬手|抬头|抬起头|转头|转过头|转身|回头|看向|垂眸|坐|站|靠|走|走来|走过来|走进|走进来|跑|停|拿|拿着|捧|捧着|抱|抱着|夹|夹着|翻|把|向|朝|对|在|坐在|站在|靠在|位于)/;
const SELF_NAMED_SPEAKER_PATTERN =
  /(?:我叫|名叫|叫做)([\u4e00-\u9fa5A-Za-z]{2,10})(?=[，,。！？!?、\s“”"'「」『』]|$)|自称([\u4e00-\u9fa5A-Za-z]{2,10}?)(?=的那位|这位|那位|同学|学姐|学长|老师|先生|小姐|女士|[，,。！？!?、\s“”"'「」『』]|$)/g;
const DIALOGUE_QUOTE_PUNCTUATION_PATTERN = /[，,。！？!?；;…❓❗]|\.\.\./;
const SHORT_NARRATION_MAX_CHARS = 56;
const SHORT_NARRATION_GROUP_MAX_CHARS = 120;
const SHORT_NARRATION_GROUP_MAX_SEGMENTS = 3;
const NARRATIVE_SPEAKER_LABEL_PATTERN =
  /旁白|叙述|系统|提示|说明|补充|备注|注释|小字|文字|标题|规则|选项|状态|环境|地点|时间|画面|镜头|场景|内心|心理|独白|心声|声音|广播|公告|通知|字幕|旁注|前情|总结|信息|面板|日志|内容|下一行|下面|上面|本段/;
const NON_PERSON_SPEAKER_LABEL_PATTERN =
  /^(?:[一二三四五六七八九十0-9]+楼|[一二三四五六七八九十0-9]+层|(?:这|那)(?:个|种|些|套|件|份|张|条|段|句|本)?[\u4e00-\u9fa5]{0,6}|.*(?:制服|校服|裙摆|锁骨|空气|气氛|阳光|地板|窗外|门口|角落|地方|过场|记录|记录表|文件|资料|纸张|走廊|楼道|楼梯|教室|办公室|宿舍|餐厅|食堂|商业街|训练场|图书馆|宫殿|海滩|学生会|协会|联盟))$/;
const LOCATION_LIKE_SPEAKER_LABEL_PATTERN =
  /(?:位置|座位|窗边|门边|门口|角落|中央|中间|前排|后排|左侧|右侧|旁边|附近|尽头|入口|出口|桌旁|桌边|椅子|沙发|讲台|设备柜|教室|走廊|楼道|楼梯|办公室|宿舍|餐厅|食堂|商业街|训练场|图书馆|宫殿|海滩|学生会|协会|联盟)/;
const LOCATED_KNOWN_SPEAKER_PREFIX_PATTERN =
  /(?:^|[。！？!?；;，,、—-]\s*)[^。！？!?；;\n]{0,32}(?:位置|座位|窗边|门边|门口|角落|中央|中间|前排|后排|左侧|右侧|旁边|附近|尽头|入口|出口|桌旁|桌边|椅子|沙发|讲台|设备柜)[^。！？!?；;\n]{0,12}(?:坐着|站着|靠着|待着|蹲着|躺着|趴着|坐在|站在|靠在|有|是)\s*$/;
const PRONOUN_ACTION_LABEL_PATTERN =
  /^(?:她|他|它|TA|Ta|ta|我|你).*(?:心里|内心|心中|脑海|默念|心想|想道|想着|低声|轻声|柔声|冷声|厉声|开口|回应|说|问|喊|道|念叨|嘟囔|低语|喃喃|抬头|抬起头|低头|转头|转过头|回头|看向|垂眸|没有抬头)$/;
const CONTEXTUAL_ACTION_LABEL_PATTERN =
  /^(?:她|他|TA|Ta|ta|这个女人|那个女人|这女人|那女人|这个男人|那个男人|这男人|那男人|这个人|那个人|对方|女人|男人|少女|少年|女生|男生|女学生|男学生).*(?:心里|内心|心中|脑海|默念|心想|想道|想着|低声|轻声|柔声|冷声|厉声|开口|回应|说|问|喊|道|念叨|嘟囔|低语|喃喃|抬手|抬头|抬起头|低头|转头|转过头|回头|看向|垂眸|没有抬头)$/;
const CONTEXTUAL_ACTION_PARAGRAPH_PATTERN =
  /(?:^|[。！？!?；;，,、—-]\s*)(?:她|他|TA|Ta|ta|这个女人|那个女人|这女人|那女人|这个男人|那个男人|这男人|那男人|这个人|那个人|对方|女人|男人|少女|少年|女生|男生|女学生|男学生)[^。！？!?；;\n]{0,56}(?:心里|内心|心中|脑海|默念|心想|想道|想着|低声|轻声|柔声|冷声|厉声|开口|回应|说|问|喊|道|念叨|嘟囔|低语|喃喃|抬手|抬头|抬起头|低头|转头|转过头|回头|看向|垂眸|没有抬头)/;
const CONTEXTUAL_ATTRIBUTION_PATTERN =
  /(?:^|[。！？!?；;，,]\s*)(?:她(?:的声音)?|他(?:的声音)?|TA|Ta|ta|这个女人|那个女人|这女人|那女人|这个男人|那个男人|这男人|那男人|这个人|那个人|对方|女人|男人|少女|少年|女生|男生|女学生|男学生)[^。！？!?；;\n]{0,48}(?:低声说|低声道|回答道|解释道|提醒道|压低声音|补了一句|轻笑说|微笑说|冷声说|厉声说|轻声说|答道|回答|解释|提醒|嘟囔|念叨|笑道|骂道|吼道|叫道|低语|喃喃|开口|回应|打招呼|招呼|说|问|喊|道|抬头|抬起头|低头|转头|转过头|回头|看向|垂眸|没有抬头)[：:，,。！？!?]*$/;
const SPEAKER_LOOKUP_SEPARATOR_PATTERN = /[{}·・•‧∙･．.\s]/g;
const GENERIC_USER_ALIAS_PATTERN = /^(?:\{\{user\}\}|我|你)$/;
const SPEAKER_LABEL_MAX_LENGTH = 8;
const SPEAKER_CARRY_MAX_PARAGRAPHS = 2;
const QUOTE_PAIRS = [
  ['“', '”'],
  ['「', '」'],
  ['『', '』'],
  ['"', '"'],
] as const;
const COLON_LINE_PATTERN = /^([^：:]{1,18})[：:]\s*(.+)$/;
const ATTRIBUTION_ACTION_TAIL_PATTERN = LEADING_ATTRIBUTION_PATTERN;
const LEADING_ACTION_AFTER_SPEAKER_PATTERN =
  /^(?:自始至终|始终|一直|仍然|仍旧|依旧|还是|只是|正|正在|终于|缓缓|慢慢|并没有|没有|未曾|从|向|朝|对|把|被|在|低头|抬手|抬头|抬起头|转头|转过头|转身|回头|看向|垂眸|走|走来|走过来|走进|走进来|跑|站|坐|靠|停|凑|退|伸|收|拿|拿着|捧|捧着|放|推|拉|扶|抱|抱着|夹|夹着|拍|点|摇|眨|睁|眯|皱|抿|咬|捂|笑|轻笑|微笑|苦笑|愣|怔|叹|开口|回应|说|问|喊|道)/;
const LEADING_ACTION_SUBJECT_PATTERN =
  /^([\u4e00-\u9fa5A-Za-z]{2,10})(?=(?:自始至终|始终|一直|仍然|仍旧|依旧|还是|只是|正|正在|终于|缓缓|慢慢|并没有|没有|未曾|从|向|朝|对|把|被|在|低头|抬手|抬头|抬起头|转头|转过头|转身|回头|看向|垂眸|走|走来|走过来|走进|走进来|跑|站|坐|靠|停|凑|退|伸|收|拿|拿着|捧|捧着|放|推|拉|扶|抱|抱着|夹|夹着|拍|点|摇|眨|睁|眯|皱|抿|咬|捂|笑|轻笑|微笑|苦笑|愣|怔|叹|开口|回应|说|问|喊|道))/;
const EMBEDDED_ACTION_PREFIX_BOUNDARY_PATTERN = /[。！？!?；;，,]\s*$/;
const GENERIC_ACTION_SUBJECT_PATTERN =
  /^(?:这|那|这个|那个|这种|那种|这些|那些|有人|众人|大家|所有人|声音|笑声|话语|目光|空气|气氛|文件|资料|纸张|书页|门|窗|光线|脚步|教室|走廊|楼道|楼梯|制服|校服)$/;

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

function normalizeSpeakerLookupText(value: string) {
  return value.replace(SPEAKER_LOOKUP_SEPARATOR_PATTERN, '').trim();
}

function isGenericUserAlias(alias: string) {
  return GENERIC_USER_ALIAS_PATTERN.test(alias.trim());
}

function isSameSpeakerName(left: string, right: string) {
  const normalizedLeft = normalizeSpeakerLookupText(left);
  const normalizedRight = normalizeSpeakerLookupText(right);
  if (normalizedLeft.length === 0 || normalizedRight.length === 0) {
    return false;
  }

  return (
    normalizedLeft === normalizedRight ||
    (normalizedLeft.length >= 2 &&
      normalizedRight.length >= 2 &&
      (normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)))
  );
}

function isSourceUserSpeaker(speaker: string, source: DialogueSource) {
  return source.userAliases.some(alias => isSameSpeakerName(speaker, alias));
}

function createLookupTextMap(text: string) {
  let normalized = '';
  const indexes: number[] = [];

  for (let index = 0; index < text.length; index += 1) {
    const normalizedChar = normalizeSpeakerLookupText(text[index]);
    if (normalizedChar.length === 0) {
      continue;
    }

    normalized += normalizedChar;
    indexes.push(index);
  }

  return { normalized, indexes };
}

function findSpeakerRange(text: string, speaker: string) {
  const directIndex = text.indexOf(speaker);
  if (directIndex >= 0) {
    return { index: directIndex, end: directIndex + speaker.length };
  }

  const normalizedSpeaker = normalizeSpeakerLookupText(speaker);
  if (normalizedSpeaker.length < 2) {
    return null;
  }

  const lookup = createLookupTextMap(text);
  const normalizedIndex = lookup.normalized.indexOf(normalizedSpeaker);
  if (normalizedIndex < 0) {
    return null;
  }

  const start = lookup.indexes[normalizedIndex];
  const end = lookup.indexes[normalizedIndex + normalizedSpeaker.length - 1] + 1;
  return { index: start, end };
}

function findLastSpeakerRange(text: string, speaker: string) {
  const directIndex = text.lastIndexOf(speaker);
  if (directIndex >= 0) {
    return { index: directIndex, end: directIndex + speaker.length };
  }

  const normalizedSpeaker = normalizeSpeakerLookupText(speaker);
  if (normalizedSpeaker.length < 2) {
    return null;
  }

  const lookup = createLookupTextMap(text);
  const normalizedIndex = lookup.normalized.lastIndexOf(normalizedSpeaker);
  if (normalizedIndex < 0) {
    return null;
  }

  const start = lookup.indexes[normalizedIndex];
  const end = lookup.indexes[normalizedIndex + normalizedSpeaker.length - 1] + 1;
  return { index: start, end };
}

function findSpeakerRangeAtStart(text: string, speaker: string) {
  const range = findSpeakerRange(text, speaker);
  if (range === null || text.slice(0, range.index).trim().length > 0) {
    return null;
  }

  return range;
}

function createSpeakerCandidates(source: DialogueSource) {
  const knownCharacters = source.knownCharacters.filter(isPlausibleSpeakerLabel);
  const specificUserAliases = source.userAliases.filter(alias => !isGenericUserAlias(alias));
  return uniqueNonEmpty([...knownCharacters, ...specificUserAliases]).sort((left, right) => {
    return normalizeSpeakerLookupText(right).length - normalizeSpeakerLookupText(left).length;
  });
}

function findKnownSpeaker(label: string, source: DialogueSource) {
  const normalizedLabel = label.trim();
  if (!source.userAliases.includes(normalizedLabel) && !isPlausibleSpeakerLabel(normalizedLabel)) {
    return null;
  }

  return createSpeakerCandidates(source).find(speaker => isSameSpeakerName(speaker, normalizedLabel)) ?? null;
}

function isStableContextSpeaker(speaker: string, source: DialogueSource) {
  return findKnownSpeaker(speaker, source) !== null;
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

function isNonPersonSpeakerLabel(label: string) {
  const normalizedLabel = label.trim();
  return (
    NARRATIVE_SPEAKER_LABEL_PATTERN.test(normalizedLabel) ||
    NON_PERSON_SPEAKER_LABEL_PATTERN.test(normalizedLabel) ||
    GENERIC_ACTION_SUBJECT_PATTERN.test(normalizedLabel) ||
    LOCATION_LIKE_SPEAKER_LABEL_PATTERN.test(normalizedLabel)
  );
}

function isPlausibleSpeakerLabel(label: string) {
  const normalizedLabel = label.trim();
  if (normalizedLabel.length === 0 || normalizedLabel.length > SPEAKER_LABEL_MAX_LENGTH) {
    return false;
  }

  if (isNonPersonSpeakerLabel(normalizedLabel)) {
    return false;
  }

  if (PRONOUN_ACTION_LABEL_PATTERN.test(normalizedLabel)) {
    return false;
  }

  return !/[，,。！？!?；;、]/.test(normalizedLabel);
}

function isPlausibleActionSpeakerLabel(label: string) {
  return isPlausibleSpeakerLabel(label) && !isNonPersonSpeakerLabel(label.trim());
}

function findSpeakerInText(text: string, source: DialogueSource) {
  const matches = createSpeakerCandidates(source)
    .map(speaker => ({ speaker, range: findSpeakerRange(text, speaker) }))
    .filter((match): match is { speaker: string; range: { index: number; end: number } } => match.range !== null)
    .sort((left, right) => left.range.index - right.range.index || right.speaker.length - left.speaker.length);
  return matches[0]?.speaker ?? null;
}

function scoreSpeakerCandidate(speaker: string, contextBefore: string, contextAfter: string) {
  let score = Number.NEGATIVE_INFINITY;
  const beforeRange = findLastSpeakerRange(contextBefore, speaker);

  if (beforeRange !== null) {
    const distance = contextBefore.length - beforeRange.end;
    const afterName = contextBefore.slice(beforeRange.end);
    score = Math.max(score, 240 - distance * 4 + (SPEECH_VERB_PATTERN.test(afterName) ? 120 : 0));
  }

  const afterRange = findSpeakerRange(contextAfter, speaker);
  if (afterRange !== null) {
    const afterName = contextAfter.slice(afterRange.end, afterRange.end + 16);
    score = Math.max(score, 220 - afterRange.index * 4 + (SPEECH_VERB_PATTERN.test(afterName) ? 120 : 0));
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
    .map(speaker => ({ speaker, range: findSpeakerRange(trimmedText, speaker) }))
    .filter((match): match is { speaker: string; range: { index: number; end: number } } => match.range !== null)
    .sort((left, right) => left.range.index - right.range.index || right.speaker.length - left.speaker.length);
  const firstMatch = speakerMatches[0];

  if (firstMatch === undefined) {
    return null;
  }

  const prefix = trimmedText.slice(0, firstMatch.range.index).trim();
  if (prefix.length > 0 && !ATTRIBUTION_BOUNDARY_PATTERN.test(prefix)) {
    return null;
  }

  return {
    prefix,
    speaker: firstMatch.speaker,
    text: trimmedText.slice(firstMatch.range.index).trim(),
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

function inferContextualAttributionSpeaker(text: string, previousSpeaker: string | null) {
  const trimmedText = text.trim();
  if (previousSpeaker === null || trimmedText.length === 0) {
    return null;
  }

  return CONTEXTUAL_ATTRIBUTION_PATTERN.test(trimmedText) ? previousSpeaker : null;
}

function inferContextualActionSpeaker(paragraph: string, previousSpeaker: string | null) {
  const trimmedParagraph = paragraph.trim();
  if (previousSpeaker === null || trimmedParagraph.length === 0) {
    return null;
  }

  return CONTEXTUAL_ACTION_PARAGRAPH_PATTERN.test(trimmedParagraph) ? previousSpeaker : null;
}

function inferLocatedKnownSpeaker(paragraph: string, source: DialogueSource) {
  const matches = createSpeakerCandidates(source)
    .filter(speaker => speaker.length >= 2)
    .map(speaker => {
      const range = findSpeakerRange(paragraph, speaker);
      return { speaker, range };
    })
    .filter((match): match is { speaker: string; range: { index: number; end: number } } => match.range !== null)
    .map(match => ({
      ...match,
      prefix: paragraph.slice(0, match.range.index).trim(),
      rest: paragraph.slice(match.range.end).trimStart(),
    }))
    .filter(match => LOCATED_KNOWN_SPEAKER_PREFIX_PATTERN.test(match.prefix))
    .filter(match => match.rest.length === 0 || /^[，,。！？!?；;\s]/.test(match.rest))
    .sort(
      (left, right) =>
        left.range.index - right.range.index ||
        normalizeSpeakerLookupText(right.speaker).length - normalizeSpeakerLookupText(left.speaker).length,
    );

  return matches[0]?.speaker ?? null;
}

function normalizeColonLabel(label: string) {
  return label.replace(/[：:，,。！？!?；;]*$/g, '').trim();
}

function isMentalColonParagraph(paragraph: string) {
  const match = paragraph.match(COLON_LINE_PATTERN);
  return match !== null && COLON_MENTAL_LABEL_PATTERN.test(normalizeColonLabel(match[1]));
}

function shouldSplitColonAsDialogue(label: string, speaker: string, source: DialogueSource) {
  const normalizedLabel = normalizeColonLabel(label);
  if (normalizedLabel.length === 0 || COLON_MENTAL_LABEL_PATTERN.test(normalizedLabel)) {
    return false;
  }

  if (isSameSpeakerName(normalizedLabel, speaker)) {
    return true;
  }

  const namedSpeaker = findSpeakerInText(normalizedLabel, source);
  if (namedSpeaker !== null && COLON_SPEECH_LABEL_PATTERN.test(normalizedLabel)) {
    return true;
  }

  return CONTEXTUAL_ACTION_LABEL_PATTERN.test(normalizedLabel) && COLON_SPEECH_LABEL_PATTERN.test(normalizedLabel);
}

function resolveSegmentKind(speaker: string | null, source: DialogueSource) {
  if (speaker === null) {
    return { kind: 'narration' as const, side: 'center' as const };
  }

  const isUser = isSourceUserSpeaker(speaker, source);
  if (isUser) {
    return { kind: 'user' as const, side: 'left' as const };
  }

  const isKnownCharacter = source.knownCharacters.some(character => isPlausibleSpeakerLabel(character) && character === speaker);
  if (isKnownCharacter) {
    return { kind: 'npc' as const, side: 'right' as const };
  }

  return { kind: 'npc' as const, side: 'right' as const };
}

function inferEmbeddedActionSpeaker(paragraph: string, source: DialogueSource) {
  const matches = createSpeakerCandidates(source)
    .filter(speaker => speaker.length >= 2)
    .map(speaker => {
      const range = findSpeakerRange(paragraph, speaker);
      return { speaker, range };
    })
    .filter((match): match is { speaker: string; range: { index: number; end: number } } => match.range !== null)
    .map(match => ({
      ...match,
      prefix: paragraph.slice(0, match.range.index).trim(),
      rest: paragraph.slice(match.range.end).trimStart(),
    }))
    .filter(match => LEADING_ACTION_AFTER_SPEAKER_PATTERN.test(match.rest))
    .filter(match => match.prefix.length === 0 || EMBEDDED_ACTION_PREFIX_BOUNDARY_PATTERN.test(match.prefix))
    .sort((left, right) => left.range.index - right.range.index || right.speaker.length - left.speaker.length);

  return matches[0]?.speaker ?? null;
}

function inferLeadingActionSpeaker(paragraph: string, source: DialogueSource) {
  const trimmedParagraph = paragraph.trim();
  const candidateMatch = createSpeakerCandidates(source)
    .map(speaker => {
      const range = findSpeakerRangeAtStart(trimmedParagraph, speaker);
      return range === null ? null : { speaker, rest: trimmedParagraph.slice(range.end).trimStart() };
    })
    .filter((match): match is { speaker: string; rest: string } => match !== null)
    .filter(match => LEADING_ACTION_AFTER_SPEAKER_PATTERN.test(match.rest))
    .sort((left, right) => right.speaker.length - left.speaker.length)[0];

  if (candidateMatch !== undefined) {
    return candidateMatch.speaker;
  }

  const locatedKnownSpeaker = inferLocatedKnownSpeaker(trimmedParagraph, source);
  if (locatedKnownSpeaker !== null) {
    return locatedKnownSpeaker;
  }

  const embeddedSpeaker = inferEmbeddedActionSpeaker(trimmedParagraph, source);
  if (embeddedSpeaker !== null) {
    return embeddedSpeaker;
  }

  const rawMatch = trimmedParagraph.match(LEADING_ACTION_SUBJECT_PATTERN);
  if (rawMatch === null || !isPlausibleActionSpeakerLabel(rawMatch[1])) {
    return null;
  }

  const knownSpeaker = findKnownSpeaker(rawMatch[1], source);
  if (knownSpeaker !== null) {
    return knownSpeaker;
  }

  const rawActionText = trimmedParagraph.slice(rawMatch[1].length).trimStart();
  return SPEECH_VERB_PATTERN.test(rawActionText.slice(0, 12)) ? rawMatch[1] : null;
}

function splitNamedActionParagraph(
  paragraph: string,
  paragraphIndex: number,
  source: DialogueSource,
  previousSpeaker: string | null,
) {
  if (isMentalColonParagraph(paragraph)) {
    return null;
  }

  const speaker = inferLeadingActionSpeaker(paragraph, source) ?? inferContextualActionSpeaker(paragraph, previousSpeaker);
  if (speaker === null) {
    return null;
  }

  const role = resolveSegmentKind(speaker, source);
  if (role.kind === 'user' && !SPEECH_VERB_PATTERN.test(paragraph)) {
    return null;
  }

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

function resolveColonSpeaker(label: string, source: DialogueSource, previousSpeaker: string | null) {
  const normalizedLabel = label.trim();
  const directSpeaker = findKnownSpeaker(normalizedLabel, source) ?? findSpeakerInText(normalizedLabel, source);
  if (directSpeaker !== null) {
    return directSpeaker;
  }

  if (previousSpeaker !== null && CONTEXTUAL_ACTION_LABEL_PATTERN.test(normalizedLabel)) {
    return previousSpeaker;
  }

  return null;
}

function splitColonParagraph(
  paragraph: string,
  paragraphIndex: number,
  source: DialogueSource,
  previousSpeaker: string | null,
) {
  const match = paragraph.match(COLON_LINE_PATTERN);
  if (match === null) {
    return null;
  }

  const speaker = resolveColonSpeaker(match[1], source, previousSpeaker);
  if (speaker === null) {
    return null;
  }

  if (!shouldSplitColonAsDialogue(match[1], speaker, source)) {
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

function inferQuoteSpeaker(
  paragraph: string,
  match: QuoteMatch,
  source: DialogueSource,
  nextParagraph?: string,
  previousSpeaker: string | null = null,
) {
  const leading = paragraph.slice(0, match.start).trim();
  const quoteText = match.text;
  const trailingText = paragraph.slice(match.end);
  const trailingAttribution = inferTrailingAttribution(trailingText, source);
  const trailingWindow = trailingText.slice(0, Math.max(24, trailingAttribution?.consumedLength ?? 0));
  const leadingWindow = paragraph.slice(Math.max(0, match.start - 24), match.start);
  const leadingAttribution = inferLeadingAttribution(leading, source);
  const contextualAttributionSpeaker =
    inferContextualAttributionSpeaker(leading, previousSpeaker) ??
    inferContextualAttributionSpeaker(trailingWindow, previousSpeaker);
  const speakerCandidate = inferSpeaker(leadingWindow, trailingWindow, source);
  const withVerb = SPEECH_VERB_PATTERN.test(`${leadingWindow}${trailingWindow}`);
  const selfNamedSpeaker = findSelfNamedSpeaker(quoteText, source);
  const nextParagraphSpeaker = isStandaloneQuoteMatch(paragraph, match)
    ? inferAttributionParagraphSpeaker(nextParagraph, source)
    : null;

  return (
    leadingAttribution?.speaker ??
    trailingAttribution?.speaker ??
    contextualAttributionSpeaker ??
    selfNamedSpeaker ??
    nextParagraphSpeaker ??
    (withVerb ? speakerCandidate : null) ??
    (isStandaloneQuoteMatch(paragraph, match) ? previousSpeaker : null)
  );
}

function splitQuotedParagraph(
  paragraph: string,
  paragraphIndex: number,
  source: DialogueSource,
  nextParagraph?: string,
  previousSpeaker: string | null = null,
) {
  const segments: DialogueSegment[] = [];
  const quoteMatches = findQuoteMatches(paragraph).filter(match => hasDialoguePunctuation(match.text));
  if (!quoteMatches.some(match => inferQuoteSpeaker(paragraph, match, source, nextParagraph, previousSpeaker) !== null)) {
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
    const contextualAttributionSpeaker =
      inferContextualAttributionSpeaker(leading, previousSpeaker) ??
      inferContextualAttributionSpeaker(trailingWindow, previousSpeaker);
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
      leadingAttribution?.speaker ??
      trailingAttribution?.speaker ??
      contextualAttributionSpeaker ??
      selfNamedSpeaker ??
      nextParagraphSpeaker ??
      (withVerb ? speakerCandidate : null) ??
      (isStandaloneQuoteMatch(paragraph, match) ? previousSpeaker : null);
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

function splitParagraph(
  paragraph: string,
  paragraphIndex: number,
  source: DialogueSource,
  nextParagraph?: string,
  previousSpeaker: string | null = null,
) {
  const colonSegments = splitColonParagraph(paragraph, paragraphIndex, source, previousSpeaker);
  if (colonSegments !== null) {
    return colonSegments;
  }

  if (findQuoteMatches(paragraph).length > 0) {
    return splitQuotedParagraph(paragraph, paragraphIndex, source, nextParagraph, previousSpeaker);
  }

  const namedActionSegments = splitNamedActionParagraph(paragraph, paragraphIndex, source, previousSpeaker);
  if (namedActionSegments !== null) {
    return namedActionSegments;
  }

  return splitNarrationParagraph(paragraph, paragraphIndex);
}

function findLastStableExplicitSpeaker(segments: DialogueSegment[], source: DialogueSource) {
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const speaker = segments[index]?.speaker;
    if (speaker !== null && speaker !== undefined && isStableContextSpeaker(speaker, source)) {
      return speaker;
    }
  }

  return null;
}

function findContextualMentionedSpeaker(paragraph: string, source: DialogueSource) {
  const matches = createSpeakerCandidates(source)
    .filter(isPlausibleSpeakerLabel)
    .map(speaker => ({ speaker, range: findSpeakerRange(paragraph, speaker) }))
    .filter((match): match is { speaker: string; range: { index: number; end: number } } => match.range !== null)
    .map(match => ({
      ...match,
      before: paragraph.slice(Math.max(0, match.range.index - 18), match.range.index),
      after: paragraph.slice(match.range.end, match.range.end + 32),
    }))
    .filter(
      match =>
        CONTEXTUAL_MENTION_BEFORE_PATTERN.test(match.before) ||
        CONTEXTUAL_MENTION_AFTER_PATTERN.test(match.after),
    )
    .sort(
      (left, right) =>
        left.range.index - right.range.index ||
        normalizeSpeakerLookupText(right.speaker).length - normalizeSpeakerLookupText(left.speaker).length,
    );

  return matches[0]?.speaker ?? null;
}

function inferParagraphActorSpeaker(paragraph: string, source: DialogueSource, previousSpeaker: string | null) {
  return (
    inferLeadingActionSpeaker(paragraph, source) ??
    inferContextualActionSpeaker(paragraph, previousSpeaker) ??
    findContextualMentionedSpeaker(paragraph, source)
  );
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

  const segments: DialogueSegment[] = [];
  let recentContextSpeaker: string | null = null;
  let recentContextSpeakerDistance = Number.POSITIVE_INFINITY;

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const carriedSpeaker =
      recentContextSpeakerDistance <= SPEAKER_CARRY_MAX_PARAGRAPHS ? recentContextSpeaker : null;
    const paragraphSegments = splitParagraph(
      paragraph,
      paragraphIndex,
      source,
      paragraphs[paragraphIndex + 1],
      carriedSpeaker,
    );
    const explicitSpeaker = findLastStableExplicitSpeaker(paragraphSegments, source);
    const paragraphActor = inferParagraphActorSpeaker(paragraph, source, carriedSpeaker);

    segments.push(...paragraphSegments);

    const contextSpeaker =
      explicitSpeaker ??
      (paragraphActor !== null && isStableContextSpeaker(paragraphActor, source) ? paragraphActor : null);

    if (contextSpeaker !== null) {
      recentContextSpeaker = contextSpeaker;
      recentContextSpeakerDistance = 0;
      return;
    }

    recentContextSpeakerDistance += 1;
  });

  return {
    segments: mergeShortNarrationSegments(segments),
    sourceMessageId: source.messageId,
    sourceContentHash: hashContent(content),
    knownCharacters: source.knownCharacters,
  };
}
