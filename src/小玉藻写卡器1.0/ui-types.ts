export type WorkStatus = 'pending' | 'running' | 'done' | 'error';

export type WriterStep = 'setup' | 'beginner' | 'editor' | 'opening' | 'persona';

export type GenerationMode = 'stream' | 'nonstream' | 'fake-stream';

export type BeginnerWorldMode = 'auto' | 'existing' | 'custom';

export interface WorkStage {
  key: string;
  title: string;
  detail: string;
  status: WorkStatus;
  error?: string;
  progress?: number;
}

export type FormatTargetKind = 'worldview' | 'role' | 'opening' | 'persona-normal' | 'persona-multistage';

export interface FormatReviewItem {
  id: string;
  issues: string[];
  kind: FormatTargetKind;
  originalRaw: string;
  raw: string;
  title: string;
  valid: boolean;
}
