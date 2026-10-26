import { isPlausibleSpeakerLabel, uniqueNonEmpty } from './text-runtime';

export function resolveSexBattleChoiceEnemyName(
  optionText: string,
  knownSpeakers: string[],
  fallbackNames: Array<string | null | undefined>,
) {
  return uniqueNonEmpty([inferSexBattleEnemyNameFromOptionText(optionText, knownSpeakers), ...fallbackNames])[0];
}

function inferSexBattleEnemyNameFromOptionText(text: string, knownSpeakers: string[]) {
  const normalizedText = text
    .replace(/[【】]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const mentionedKnownSpeaker = findMentionedKnownSpeaker(normalizedText, knownSpeakers);
  if (mentionedKnownSpeaker !== null) {
    return mentionedKnownSpeaker;
  }

  const patterns = [
    /(?:向|对|与|找|挑战)\s*([^，,。！？!?；;：:\n]{1,16})\s*(?:发起|进行|开始|进入)?性斗/u,
    /(?:发起|进行|开始|进入)性斗\s*(?:对象|目标|对手)?\s*[:：\-—]?\s*([^，,。！？!?；;：:\n]{1,16})/u,
  ];

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    const candidate = sanitizeSexBattleEnemyNameCandidate(match?.[1] ?? '');
    if (candidate !== null) {
      return candidate;
    }
  }

  return null;
}

function sanitizeSexBattleEnemyNameCandidate(candidate: string) {
  const normalizedCandidate = candidate
    .replace(/^[“"'[(（《<]+|[”"'\])）》>]+$/g, '')
    .replace(/^(?:对象|目标|对手|角色|人物)\s*[:：\-—]?\s*/u, '')
    .trim();

  return normalizedCandidate.length > 0 && normalizedCandidate.length <= 16 ? normalizedCandidate : null;
}

function findMentionedKnownSpeaker(text: string, speakerNames: string[]) {
  const matches = speakerNames
    .filter(isPlausibleSpeakerLabel)
    .map(speaker => ({ speaker, index: text.indexOf(speaker) }))
    .filter(match => match.index >= 0)
    .sort((left, right) => left.index - right.index || right.speaker.length - left.speaker.length);

  return matches[0]?.speaker ?? null;
}
