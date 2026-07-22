export type DialogueSegmentKind = 'user' | 'npc' | 'narration';
export type DialogueSide = 'left' | 'right' | 'center';
export type DialogueMood = 'neutral' | 'happy' | 'angry' | 'surprised';
export type DialogueMapKind = 'speech' | 'narration' | 'sfx' | 'action';
export type DialogueSpeakerSource = 'fallback' | 'map';
export type DialogueSpeakerInferenceMode = 'normal' | 'conservative';
export type NarrativeViewMode = 'gal' | 'chat';

export interface DialogueMapEntry {
  i: number;
  p: number | null;
  line_start: string | null;
  line_end: string | null;
  anchor: string;
  speaker: string | null;
  focus: string | null;
  kind: DialogueMapKind;
}

export interface StoredDialogueMap {
  version: 1;
  sourceHash: string;
  entries: DialogueMapEntry[];
}

export interface DialogueSourceParagraphPart {
  text: string;
  sourceIndex: number;
}

export interface DialogueSegment {
  id: string;
  kind: DialogueSegmentKind;
  side: DialogueSide;
  speaker: string | null;
  focusSpeaker?: string | null;
  speakerSource?: DialogueSpeakerSource;
  mapAnchor?: string | null;
  mapKind?: DialogueMapKind | null;
  text: string;
  mood: DialogueMood;
  moodConfidence: number;
  /** Zero-based blank-line-delimited source paragraph index before splitting; dialogue_map.p is sourceIndex + 1. */
  sourceIndex: number;
  /** Original natural paragraphs retained when several narration segments share one compact GAL page. */
  sourceParagraphParts?: DialogueSourceParagraphPart[];
}

export interface DialogueSource {
  id: string;
  messageId: string;
  content: string;
  knownCharacters: string[];
  userAliases: string[];
  primaryUserName?: string | null;
  secondaryUserNames?: string[];
  dialogueMap?: DialogueMapEntry[];
  speakerInferenceMode?: DialogueSpeakerInferenceMode;
}

export interface DialogueSplitResult {
  segments: DialogueSegment[];
  sourceMessageId: string;
  sourceContentHash: string;
  knownCharacters: string[];
}
