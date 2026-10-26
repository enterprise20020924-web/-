import type { DialogueMood } from '../types/narrative';

type EmotionRule = {
  mood: Exclude<DialogueMood, 'neutral'>;
  patterns: RegExp[];
  priority: number;
};

export interface DialogueEmotionResult {
  mood: DialogueMood;
  confidence: number;
}

const MIN_CONFIDENCE = 0.55;

const EMOTION_RULES: EmotionRule[] = [
  {
    mood: 'angry',
    priority: 3,
    patterns: [
      /怒|恼火|愤怒|暴躁|火大|生气|气急|不耐烦/,
      /咬牙|攥紧|握紧|拍案|瞪(?:着|向|了)?/,
      /冷声|厉声|质问|呵斥|吼|骂|讥讽/,
      /杀意|敌意|威胁|挑衅|压迫感/,
    ],
  },
  {
    mood: 'surprised',
    priority: 2,
    patterns: [
      /惊讶|震惊|错愕|愕然|诧异|吃惊/,
      /愣住|怔住|呆住|僵住|猛地|突然/,
      /瞪大|睁大|倒吸|没想到|怎么会/,
      /[！？?!]{2,}/,
    ],
  },
  {
    mood: 'happy',
    priority: 1,
    patterns: [
      /笑|微笑|轻笑|莞尔|弯起嘴角|扬起嘴角/,
      /高兴|开心|愉快|满意|欣喜|雀跃|放松/,
      /温柔|调侃|打趣|松了口气|舒了口气/,
      /哈哈|嘿嘿|嘻嘻/,
    ],
  },
];

function normalizeDialogueText(text: string) {
  return text
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function inferDialogueEmotion(text: string): DialogueEmotionResult {
  const normalizedText = normalizeDialogueText(text);
  if (normalizedText.length === 0) {
    return { mood: 'neutral', confidence: 0 };
  }

  const scores = EMOTION_RULES.map(rule => {
    const hits = rule.patterns.filter(pattern => pattern.test(normalizedText)).length;
    return {
      mood: rule.mood,
      priority: rule.priority,
      score: hits,
    };
  }).filter(result => result.score > 0);

  if (scores.length === 0) {
    return { mood: 'neutral', confidence: 0.2 };
  }

  scores.sort((left, right) => right.score - left.score || right.priority - left.priority);
  const best = scores[0];
  const confidence = Math.min(0.95, 0.42 + best.score * 0.22);

  if (confidence < MIN_CONFIDENCE) {
    return { mood: 'neutral', confidence };
  }

  return {
    mood: best.mood,
    confidence,
  };
}
