export type TrainingMode = 'training' | 'special';
export type TrainingEmblem = 'sword' | 'shield' | 'star';

export interface TrainingStage {
  id: string;
  title: string;
  emblem: TrainingEmblem;
}

/** 毛胚展示位，后续在此编排关卡名称、对手与机制。 */
export const trainingStages: Record<TrainingMode, TrainingStage[]> = {
  training: [
    { id: 'training-01', title: '第一特训', emblem: 'shield' },
    { id: 'training-02', title: '第二特训', emblem: 'sword' },
    { id: 'training-03', title: '第三特训', emblem: 'star' },
  ],
  special: [
    { id: 'special-01', title: '特殊战Ⅰ', emblem: 'shield' },
    { id: 'special-02', title: '特殊战Ⅱ', emblem: 'sword' },
    { id: 'special-03', title: '特殊战Ⅲ', emblem: 'star' },
  ],
};

export const trainingDisplayCharacter = {
  name: '欧鲸鲸',
  fullbodyUrl:
    'https://raw.githubusercontent.com/enterprise20020924-web/-/c51f864b1a8a37a7f45fd1892d2d41d681f2a320/llm1/全身立绘/欧鲸鲸4K.png',
};
