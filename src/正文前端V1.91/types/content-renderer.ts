import type { DeviceMode } from '../device-mode';
import type { DialogueMapEntry } from './narrative';

export interface ParallelEvent {
  character: string;
  description: string;
}

export interface ChoiceOption {
  label: string;
  text: string;
}

export interface ContentRendererContext {
  layout_mode: DeviceMode;
  message_id: number;
  content: string;
  thinking_content: string;
  parallel_events: ParallelEvent[];
  choice_options: ChoiceOption[];
  json_patch_blocks: string[];
  during_streaming: boolean;
  dialogue_map: DialogueMapEntry[];
  variable_revision: number;
  variable_refresh_needed: boolean;
  set_original_content_visible: (visible: boolean) => void;
  set_variable_refresh_needed: (needed: boolean) => void;
}
