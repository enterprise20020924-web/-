export type DialogueSegmentKind = 'user' | 'npc' | 'narration';
export type DialogueSide = 'left' | 'right' | 'center';
export type DialogueMood = 'neutral' | 'happy' | 'angry' | 'surprised';

export interface DialogueSegment {
  id: string;
  kind: DialogueSegmentKind;
  side: DialogueSide;
  speaker: string | null;
  text: string;
  mood: DialogueMood;
  moodConfidence: number;
  sourceIndex: number;
}

export interface DialogueSource {
  id: string;
  messageId: string;
  content: string;
  knownCharacters: string[];
  userAliases: string[];
}

export interface DialogueSplitResult {
  segments: DialogueSegment[];
  sourceMessageId: string;
  sourceContentHash: string;
  knownCharacters: string[];
}
