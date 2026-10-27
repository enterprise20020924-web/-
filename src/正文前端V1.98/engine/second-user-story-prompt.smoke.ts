import {
  SECOND_USER_SHIZUYA_STORY_PROMPT,
  SECOND_USER_STORY_PROMPT,
  resolveSecondUserStoryPrompt,
  resolveStoryPromptGenerationSourceUserMessage,
  resolveStoryPromptPrearmAssistantMessage,
  resolveStoryPromptSourceUserMessage,
  shouldInjectSecondUserStoryPrompt,
  shouldInjectSecondUserStoryPromptForGeneration,
  shouldPrearmSecondUserStoryPrompt,
  type StoryPromptChatMessage,
} from './second-user-story-prompt';
import { readCanonicalUserVariableName } from './tavern-variable-runtime';

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

const canonicalHistory: StoryPromptChatMessage[] = [
  { message_id: 0, role: 'assistant' },
  { message_id: 1, role: 'user' },
  { message_id: 2, role: 'assistant' },
  { message_id: 3, role: 'user' },
];

assertEqual(
  shouldPrearmSecondUserStoryPrompt(canonicalHistory.slice(0, 3)),
  true,
  'assistant mes 2 prearms the next generation for assistant mes 4',
);
assertEqual(
  resolveStoryPromptPrearmAssistantMessage(canonicalHistory.slice(0, 3))?.message_id,
  2,
  'prearm resolves the exact assistant mes 2 source',
);
assertEqual(shouldPrearmSecondUserStoryPrompt(canonicalHistory.slice(0, 1)), false, 'assistant mes 0 cannot prearm');
assertEqual(shouldPrearmSecondUserStoryPrompt(canonicalHistory), false, 'user mes 3 is handled by the generation hook');
assertEqual(shouldInjectSecondUserStoryPrompt(canonicalHistory.slice(0, 2)), false, 'first user message');
assertEqual(shouldInjectSecondUserStoryPrompt(canonicalHistory), true, 'second user message at canonical mes 3');
assertEqual(
  shouldInjectSecondUserStoryPrompt([
    canonicalHistory[0]!,
    canonicalHistory[1]!,
    { message_id: 2, role: 'user' },
  ]),
  false,
  'mes 2 cannot trigger even when Tavern reports it as another user message',
);
assertEqual(
  shouldInjectSecondUserStoryPrompt([
    canonicalHistory[0]!,
    canonicalHistory[1]!,
    { message_id: 2, role: 'user', is_hidden: true },
    canonicalHistory[3]!,
  ]),
  true,
  'hidden or extra roles before mes 3 do not change the exact floor trigger',
);
assertEqual(
  shouldInjectSecondUserStoryPrompt([...canonicalHistory, { message_id: 4, role: 'assistant' }]),
  false,
  'completed assistant reply is not a trigger context',
);
assertEqual(
  resolveStoryPromptSourceUserMessage(canonicalHistory)?.message_id,
  3,
  'second user trigger resolves the exact mes 3 source',
);
assertEqual(
  shouldInjectSecondUserStoryPrompt([...canonicalHistory, { message_id: 4, role: 'assistant' }, { message_id: 5, role: 'user' }]),
  false,
  'later user floors cannot trigger',
);
assertEqual(
  shouldInjectSecondUserStoryPromptForGeneration('normal', false, canonicalHistory),
  true,
  'normal generation immediately after mes 3 triggers once',
);
assertEqual(
  shouldInjectSecondUserStoryPromptForGeneration('normal', false, canonicalHistory.slice(0, 3)),
  false,
  'assistant mes 2 cannot trigger the generation hook',
);
assertEqual(
  shouldInjectSecondUserStoryPromptForGeneration('quiet', false, canonicalHistory),
  false,
  'quiet generation cannot consume the story prompt',
);
assertEqual(
  shouldInjectSecondUserStoryPromptForGeneration('swipe', false, canonicalHistory),
  true,
  'retry generation after deleting mes 4 still targets the exact fourth floor',
);
assertEqual(
  resolveStoryPromptGenerationSourceUserMessage([
    ...canonicalHistory,
    { message_id: 4, role: 'assistant', message: '' },
  ])?.message_id,
  3,
  'empty assistant mes 4 placeholder keeps the mes 3 trigger source',
);
assertEqual(
  shouldInjectSecondUserStoryPromptForGeneration('normal', false, [
    ...canonicalHistory,
    { message_id: 4, role: 'assistant', message: 'completed reply' },
  ]),
  false,
  'completed assistant mes 4 cannot retrigger the story prompt',
);
assertEqual(
  shouldInjectSecondUserStoryPromptForGeneration('normal', true, canonicalHistory),
  false,
  'dry run cannot consume the story prompt',
);
assertEqual(SECOND_USER_STORY_PROMPT.endsWith('**'), true, 'prompt keeps the final emphasized instruction');
assertEqual(SECOND_USER_STORY_PROMPT.includes('"啊我操！我的咖啡啊！"'), true, 'prompt keeps the required ending');
assertEqual(
  resolveSecondUserStoryPrompt('小夜月静夜'),
  SECOND_USER_SHIZUYA_STORY_PROMPT,
  'exact full user name selects the Shizuya variant',
);
assertEqual(resolveSecondUserStoryPrompt('静夜'), SECOND_USER_STORY_PROMPT, 'short alias does not select the variant');
assertEqual(
  resolveSecondUserStoryPrompt('小夜月 静夜'),
  SECOND_USER_STORY_PROMPT,
  'spaced name does not select the variant',
);
assertEqual(resolveSecondUserStoryPrompt(null), SECOND_USER_STORY_PROMPT, 'missing user name keeps the base prompt');
assertEqual(
  SECOND_USER_SHIZUYA_STORY_PROMPT.includes('阿斯特赖娅的二代目勇者啊，魔装影姬'),
  true,
  'Shizuya variant keeps the exclusive successor passage',
);
assertEqual(
  SECOND_USER_SHIZUYA_STORY_PROMPT.endsWith('（严格照搬原文，这一回合仅仅描写这段故事，不需要你补充啥，就以我的咖啡作为结尾）'),
  true,
  'Shizuya variant keeps the required plain final instruction',
);

const runtimeHost = globalThis as typeof globalThis & {
  getVariables?: (option: { type: 'message'; message_id: number | 'latest' }) => unknown;
};
const previousGetVariables = runtimeHost.getVariables;
runtimeHost.getVariables = () => ({ stat_data: { 角色基础: { 姓名: '小夜月静夜' } } });
assertEqual(
  readCanonicalUserVariableName(3, 0),
  '小夜月静夜',
  'visible full-name field on user mes 3 selects the exact Shizuya branch',
);
runtimeHost.getVariables = () => ({ stat_data: { 角色基础: { _姓名: ['小夜月静夜'] } } });
assertEqual(
  readCanonicalUserVariableName(3, 0),
  '小夜月静夜',
  'runtime underscore-backed full-name field selects the exact Shizuya branch',
);
runtimeHost.getVariables = previousGetVariables;

console.info('[second-user-story-prompt.smoke] passed');
