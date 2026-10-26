import {
  MVU_CALIBRATION_SCHEMA_SOURCE_URL,
  normalizeMvuSchemaScalarValue,
  resolveMvuSchemaChildAlias,
  resolveMvuSchemaRelationshipField,
} from '../engine/mvu-calibration-standard.ts';
import { calibrateMvuSchemaStandardInStatData } from './mvu-schema-calibration.ts';

function assertEqual(actual: unknown, expected: unknown, name: string) {
  if (actual !== expected) {
    throw Error(`${name}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

assertEqual(
  MVU_CALIBRATION_SCHEMA_SOURCE_URL,
  'https://cdn.jsdelivr.net/gh/vincentrong2005/Fatria/dist/性斗学园/变量结构/index.js',
  'published schema source is pinned in calibration metadata',
);
assertEqual(resolveMvuSchemaChildAlias('角色基础', '经验'), '经验值', 'experience alias resolves');
assertEqual(resolveMvuSchemaChildAlias('核心状态', '堕落'), '堕落度', 'corruption alias resolves');
assertEqual(resolveMvuSchemaRelationshipField('屈服度'), '支配度', 'legacy submission resolves to dominance');
assertEqual(resolveMvuSchemaRelationshipField('誓约'), '誓约', 'pledge is a standard relationship field');
assertEqual(normalizeMvuSchemaScalarValue(['角色基础', '经验值'], -5).value, 0, 'experience clamps to zero');
assertEqual(normalizeMvuSchemaScalarValue(['核心状态', '堕落度'], 130).value, 100, 'corruption clamps to 100');
assertEqual(
  normalizeMvuSchemaScalarValue(['关系系统', '白石响子', '支配度'], -150).value,
  -100,
  'dominance clamps to -100',
);

const statData: Record<string, unknown> = {
  角色基础: { 经验: '25' },
  核心状态: { 堕落: '140' },
  关系系统: {
    在场人物: ['响子'],
    当前人物: ['天音'],
    响子: { 好感度: '120', 屈服度: '-130', 关系类型: '朋友' },
  },
};

const calibration = calibrateMvuSchemaStandardInStatData(statData);
const characterBase = statData.角色基础 as Record<string, unknown>;
const coreState = statData.核心状态 as Record<string, unknown>;
const relationshipSystem = statData.关系系统 as Record<string, unknown>;
const relationship = relationshipSystem.响子 as Record<string, unknown>;

assertEqual(calibration.changed, true, 'legacy fields trigger schema calibration');
assertEqual('经验' in characterBase, false, 'legacy experience field removed');
assertEqual(characterBase.经验值, 25, 'experience migrates and coerces');
assertEqual('堕落' in coreState, false, 'legacy corruption field removed');
assertEqual(coreState.堕落度, 100, 'corruption migrates and clamps');
assertEqual('屈服度' in relationship, false, 'legacy submission field removed');
assertEqual(relationship.支配度, -100, 'dominance migrates and clamps');
assertEqual(relationship.好感度, 100, 'affection follows published range');
assertEqual('当前人物' in relationshipSystem, false, 'legacy present-character field removed');
assertEqual((relationshipSystem.在场人物 as unknown[]).length, 2, 'present-character arrays merge');
assertEqual((relationshipSystem.在场人物 as unknown[])[1], '天音', 'legacy present characters are preserved');
assertEqual(calibrateMvuSchemaStandardInStatData(statData).changed, false, 'schema calibration is idempotent');

const topLevelLegacy: Record<string, unknown> = { 经验: '9', 堕落度: '31' };
calibrateMvuSchemaStandardInStatData(topLevelLegacy);
assertEqual((topLevelLegacy.角色基础 as Record<string, unknown>).经验值, 9, 'top-level experience migrates');
assertEqual((topLevelLegacy.核心状态 as Record<string, unknown>).堕落度, 31, 'top-level corruption migrates');

console.log('[mvu-schema-calibration] 22 cases passed');
