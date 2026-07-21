import { createChoiceOptionKey, parseJsonPatchPanel, partitionChoiceOptions } from './panel-runtime.ts';
import { resolveSexBattleChoiceEnemyName } from './choice-runtime.ts';
import { extractChoiceOptions } from '../engine/content-blocks.ts';

function assertEqual(actual: unknown, expected: unknown, name: string) {
  if (actual !== expected) {
    throw Error(`${name}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, name: string) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw Error(`${name}: expected ${expectedText}, received ${actualText}`);
  }
}

const options = [
  { label: 'A', text: '第一项' },
  { label: 'B', text: '第二项' },
  { label: 'C', text: '第三项' },
  { label: 'D', text: '第四项' },
  { label: 'E', text: '向天音发起性斗' },
  { label: 'F', text: '第六项' },
];

const partitioned = partitionChoiceOptions(options);
assertDeepEqual(
  partitioned.regular.map(entry => entry.option.label),
  ['A', 'B', 'C', 'D', 'F'],
  'regular options preserve all non-E entries',
);
assertEqual(partitioned.sexBattle?.originalIndex, 4, 'E keeps actual index');
assertEqual(partitioned.sexBattle?.option.label, 'E', 'E is extracted');
assertEqual(partitioned.regular.at(-1)?.originalIndex, 5, 'option after E is preserved');

const extractedOptions = extractChoiceOptions(`
<choice>
A. 第一项
E. 任意位置的性斗项
B. 第二项
C. 第三项
D. 第四项
F. 第六项
</choice>
`);
assertDeepEqual(
  extractedOptions.map(option => option.label),
  ['A', 'E', 'B', 'C', 'D', 'F'],
  'content extraction preserves more than five options and arbitrary E position',
);

const earlySexBattle = partitionChoiceOptions([
  { label: 'A', text: '普通选项' },
  { label: 'E', text: '开始性斗：千夏' },
  { label: 'B', text: '后续选项' },
]);
assertEqual(earlySexBattle.sexBattle?.originalIndex, 1, 'early E index');
assertDeepEqual(
  earlySexBattle.regular.map(entry => entry.option.label),
  ['A', 'B'],
  'early E does not remove later options',
);

assertEqual(
  createChoiceOptionKey(options[0], 0) !== createChoiceOptionKey(options[0], 1),
  true,
  'choice keys include original index',
);

const parsedPatch = parseJsonPatchPanel(
  JSON.stringify([
    { op: 'remove', path: '/关系系统/在场人物/0' },
    { op: 'replace', path: '/角色/好感度', value: 12 },
  ]),
);
assertEqual(parsedPatch?.operations.length, 2, 'parsed operation count');
assertEqual(parsedPatch?.operations[0]?.title, '在场人物 第 1 项 移除', 'array item title');
assertEqual(parsedPatch?.operations[0]?.pathTrail, '关系系统', 'array item trail');
assertEqual(parsedPatch?.operations[1]?.title, '好感度 更新', 'replace title');

const invalidPatch = parseJsonPatchPanel('{invalid');
assertEqual(invalidPatch?.operations.length, 0, 'invalid patch has no operations');
assertEqual(invalidPatch?.rawText, '{invalid', 'invalid patch raw text');

assertEqual(resolveSexBattleChoiceEnemyName('向天音发起性斗', ['天音'], []), '天音', 'known speaker target');
assertEqual(resolveSexBattleChoiceEnemyName('发起性斗：千夏', [], []), '千夏', 'explicit target');
assertEqual(resolveSexBattleChoiceEnemyName('特殊行动', [], [null, '亚衣']), '亚衣', 'fallback target');

console.log('[desktop-panel-runtime] 12 cases passed');
