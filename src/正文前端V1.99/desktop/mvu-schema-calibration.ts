import {
  MVU_SCHEMA_CHILD_ALIASES,
  normalizeMvuSchemaScalarValue,
  resolveMvuSchemaChildAlias,
  resolveMvuSchemaRelationshipField,
} from '../engine/mvu-calibration-standard';

export interface MvuSchemaCalibrationChange {
  path: string;
  message: string;
}

export interface MvuSchemaCalibrationResult {
  changed: boolean;
  changes: MvuSchemaCalibrationChange[];
}

export function calibrateMvuSchemaStandardInStatData(statData: Record<string, unknown>): MvuSchemaCalibrationResult {
  const changes: MvuSchemaCalibrationChange[] = [];

  migrateTopLevelField(statData, '经验', '角色基础', '经验值', changes);
  migrateTopLevelField(statData, '经验值', '角色基础', '经验值', changes);
  migrateTopLevelField(statData, '堕落', '核心状态', '堕落度', changes);
  migrateTopLevelField(statData, '堕落度', '核心状态', '堕落度', changes);

  for (const root of Object.keys(MVU_SCHEMA_CHILD_ALIASES)) {
    const rootRecord = asRecord(statData[root]);
    if (rootRecord === null) {
      continue;
    }

    for (const oldField of Object.keys(rootRecord)) {
      const canonicalField = resolveMvuSchemaChildAlias(root, oldField);
      if (canonicalField !== null && canonicalField !== oldField) {
        migrateRecordField(rootRecord, oldField, canonicalField, root, changes);
      }
    }
  }

  const relationships = asRecord(statData['关系系统']);
  if (relationships !== null) {
    for (const [contactName, relationshipValue] of Object.entries(relationships)) {
      if (contactName === '在场人物') {
        continue;
      }

      const relationship = asRecord(relationshipValue);
      if (relationship === null) {
        continue;
      }

      for (const oldField of Object.keys(relationship)) {
        const canonicalField = resolveMvuSchemaRelationshipField(oldField);
        if (canonicalField !== null && canonicalField !== oldField) {
          migrateRecordField(relationship, oldField, canonicalField, `关系系统.${contactName}`, changes);
        }
      }
    }
  }

  normalizeRecordScalarValues(statData, [], changes);

  return {
    changed: changes.length > 0,
    changes,
  };
}

function migrateTopLevelField(
  statData: Record<string, unknown>,
  oldField: string,
  targetRoot: string,
  targetField: string,
  changes: MvuSchemaCalibrationChange[],
) {
  if (!(oldField in statData)) {
    return;
  }

  const targetRecord = ensureRecord(statData, targetRoot);
  targetRecord[targetField] = mergeCalibrationValues(targetRecord[targetField], statData[oldField]);
  delete statData[oldField];
  changes.push({
    path: `${targetRoot}.${targetField}`,
    message: `${oldField} -> ${targetRoot}.${targetField} 已迁移到发布变量结构。`,
  });
}

function migrateRecordField(
  record: Record<string, unknown>,
  oldField: string,
  canonicalField: string,
  parentPath: string,
  changes: MvuSchemaCalibrationChange[],
) {
  record[canonicalField] = mergeCalibrationValues(record[canonicalField], record[oldField]);
  delete record[oldField];
  changes.push({
    path: `${parentPath}.${canonicalField}`,
    message: `${parentPath}.${oldField} -> ${parentPath}.${canonicalField} 已迁移到发布变量结构。`,
  });
}

function normalizeRecordScalarValues(
  record: Record<string, unknown>,
  parentPath: string[],
  changes: MvuSchemaCalibrationChange[],
) {
  for (const [key, value] of Object.entries(record)) {
    const path = [...parentPath, key];
    const childRecord = asRecord(value);
    if (childRecord !== null) {
      normalizeRecordScalarValues(childRecord, path, changes);
      continue;
    }

    if (Array.isArray(value)) {
      continue;
    }

    const normalization = normalizeMvuSchemaScalarValue(path, value);
    if (!normalization.changed) {
      continue;
    }

    record[key] = normalization.value;
    changes.push({
      path: path.join('.'),
      message: `${path.join('.')} 已按发布变量结构校准为 ${String(normalization.value)}。`,
    });
  }
}

function mergeCalibrationValues(existingValue: unknown, incomingValue: unknown) {
  if (existingValue === undefined) {
    return incomingValue;
  }

  if (Array.isArray(existingValue) && Array.isArray(incomingValue)) {
    return Array.from(new Set([...existingValue, ...incomingValue]));
  }

  const existingRecord = asRecord(existingValue);
  const incomingRecord = asRecord(incomingValue);
  if (existingRecord !== null && incomingRecord !== null) {
    return { ...incomingRecord, ...existingRecord };
  }

  return existingValue;
}

function ensureRecord(record: Record<string, unknown>, key: string) {
  const existingRecord = asRecord(record[key]);
  if (existingRecord !== null) {
    return existingRecord;
  }

  const nextRecord: Record<string, unknown> = {};
  record[key] = nextRecord;
  return nextRecord;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
