import {
  getMobileChoiceOptionKey,
  inferMobileSexBattleEnemyName,
  isMobileSexBattleChoiceOption,
  parseMobileJsonPatchPanel,
} from './content-panels.ts';

function assertEqual(actual: unknown, expected: unknown, name: string) {
  if (actual !== expected) {
    throw Error(`${name}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

const directPanel = parseMobileJsonPatchPanel(`[
  { "op": "replace", "path": "/核心状态/$耐力", "value": 88 },
  { "op": "add", "path": "/关系系统/在场人物/-", "value": "响木天音" }
]`);
assertEqual(directPanel?.operations.length, 2, 'direct JSON patch array');
assertEqual(directPanel?.operations[0]?.title, '$耐力 更新', 'replace operation title');
assertEqual(directPanel?.operations[1]?.pathTrail, '关系系统', 'append operation path trail');
assertEqual(directPanel?.operations[1]?.title, '关系系统 新增记录', 'append operation title');

const wrappedPanel = parseMobileJsonPatchPanel(
  JSON.stringify({ operations: [{ op: 'remove', path: '/任务系统/支线任务/旧记录' }] }),
);
assertEqual(wrappedPanel?.operations[0]?.opLabel, '移除', 'wrapped operations payload');

const rawPanel = parseMobileJsonPatchPanel('not-json');
assertEqual(rawPanel?.operations.length, 0, 'invalid JSON falls back to raw');
assertEqual(rawPanel?.rawText, 'not-json', 'raw JSON patch text preserved');

const battleOption = { label: 'E', text: '向响木天音发起性斗' };
assertEqual(isMobileSexBattleChoiceOption(battleOption), true, 'sex battle option detection');
assertEqual(inferMobileSexBattleEnemyName(battleOption.text, ['响木天音']), '响木天音', 'known enemy detection');
assertEqual(getMobileChoiceOptionKey(battleOption, 4), 'E-4-向响木天音发起性斗', 'choice option key');

console.log('[mobile-content-panels] 10 cases passed');
