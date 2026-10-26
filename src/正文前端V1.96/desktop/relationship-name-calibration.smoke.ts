import { resolveCanonicalCharacterName, resolveCanonicalCharacterTargets } from '../engine/character-name-registry.ts';
import {
  calibrateRelationshipNamesInStatData,
  resolveCanonicalRelationshipContactName,
} from './relationship-name-calibration.ts';

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

assertEqual(resolveCanonicalCharacterName('响子'), '白石响子', 'given-name alias resolves to full name');
assertEqual(resolveCanonicalCharacterName('白石·响子'), '白石响子', 'middle dot full name resolves');
assertEqual(resolveCanonicalCharacterName(' 白石 响子 '), '白石响子', 'spaces in full name resolve');
assertEqual(resolveCanonicalCharacterName('天音'), '响木天音', 'portrait registry alias resolves');
assertEqual(resolveCanonicalCharacterName('静夜'), '小夜月静夜', 'portrait-only full name resolves');
assertEqual(resolveCanonicalCharacterName('未登记·人物'), '未登记·人物', 'unknown name remains unchanged');
assertEqual(
  resolveCanonicalRelationshipContactName('在场人物'),
  '在场人物',
  'reserved relationship key remains unchanged',
);
assertDeepEqual(resolveCanonicalCharacterTargets('双子巫女'), ['风音', '铃音'], 'group alias expands');

const statData: Record<string, unknown> = {
  关系系统: {
    在场人物: ['响子', '白石·响子', '双子巫女'],
    白石响子: { 好感度: 40, 关系类型: '熟人' },
    响子: { 好感度: 25, 关系类型: '朋友' },
    '白石·响子': { 好感度: 45, 支配度: 12 },
  },
};

const calibration = calibrateRelationshipNamesInStatData(statData);
const relationships = statData.关系系统 as Record<string, unknown>;
const kyoko = relationships.白石响子 as Record<string, unknown>;

assertEqual(calibration.changed, true, 'relationship aliases trigger calibration');
assertEqual('响子' in relationships, false, 'given-name alias key removed');
assertEqual('白石·响子' in relationships, false, 'middle dot alias key removed');
assertEqual(kyoko.好感度, 45, 'duplicate contacts preserve highest affection');
assertEqual(kyoko.支配度, 12, 'duplicate contact fields merge');
assertDeepEqual(relationships.在场人物, ['白石响子', '风音', '铃音'], 'present names canonicalize and deduplicate');
assertEqual(calibrateRelationshipNamesInStatData(statData).changed, false, 'calibration is idempotent');

console.log('[relationship-name-calibration] 15 cases passed');
