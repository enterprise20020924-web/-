export type UserPortraitGender = 'male' | 'female';

type MvuMessageOption = { type: 'message'; message_id: number | 'latest' };

type TavernVariableGlobal = typeof globalThis & {
  Mvu?: {
    getMvuData?: (option: MvuMessageOption) => unknown;
  };
  getVariables?: (option: MvuMessageOption) => unknown;
};

export function unwrapMvuValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

export function readPath(source: unknown, path: string[]) {
  let current = source;

  for (const key of path) {
    const record = asRecord(unwrapMvuValue(current));
    if (record === null || !(key in record)) {
      return undefined;
    }

    current = record[key];
  }

  return unwrapMvuValue(current);
}

export function readVariableSnapshots(messageId: number, variableRevision: number) {
  void variableRevision;

  return [
    readMvuData(messageId),
    readVariables(messageId),
    readMvuData('latest'),
    readVariables('latest'),
    readMvuData(0),
    readVariables(0),
  ];
}

export function readFirstPathValue(snapshots: unknown[], paths: string[][]) {
  for (const snapshot of snapshots) {
    for (const path of paths) {
      const value = readPath(snapshot, path);
      if (String(unwrapMvuValue(value) ?? '').trim().length > 0) {
        return value;
      }
    }
  }

  return null;
}

export function readUserPortraitGender(messageId: number, variableRevision: number): UserPortraitGender {
  const snapshots = readVariableSnapshots(messageId, variableRevision);

  for (const snapshot of snapshots) {
    const gender =
      normalizeUserPortraitGender(readPath(snapshot, ['stat_data', '角色基础', '性别'])) ??
      normalizeUserPortraitGender(readPath(snapshot, ['角色基础', '性别']));
    if (gender !== null) {
      return gender;
    }
  }

  return 'female';
}

export function readUserRoleName(messageId: number, variableRevision: number) {
  const roleName = readFirstPathValue(readVariableSnapshots(messageId, variableRevision), [
    ['stat_data', '角色基础', '_姓名'],
    ['stat_data', '角色基础', '姓名'],
    ['角色基础', '_姓名'],
    ['角色基础', '姓名'],
  ]);
  const normalizedRoleName = String(unwrapMvuValue(roleName) ?? '').trim();

  return normalizedRoleName.length > 0 ? normalizedRoleName : null;
}

function normalizeUserPortraitGender(value: unknown): UserPortraitGender | null {
  const normalizedValue = String(unwrapMvuValue(value) ?? '').trim();
  if (normalizedValue === '男') {
    return 'male';
  }

  if (normalizedValue === '女') {
    return 'female';
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readMvuData(messageId: number | 'latest') {
  for (const runtime of getTavernRuntimeCandidates()) {
    try {
      const value = runtime.Mvu?.getMvuData?.({ type: 'message', message_id: messageId });
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch {
      // MVU may only be reachable through another same-origin frame.
    }
  }

  return null;
}

function readVariables(messageId: number | 'latest') {
  for (const runtime of getTavernRuntimeCandidates()) {
    try {
      const value = runtime.getVariables?.({ type: 'message', message_id: messageId });
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch {
      // Tavern Helper may only be reachable through another same-origin frame.
    }
  }

  return null;
}

function getTavernRuntimeCandidates() {
  const candidates: TavernVariableGlobal[] = [globalThis as TavernVariableGlobal];
  try {
    if (typeof window !== 'undefined' && window.parent !== window) {
      candidates.push(window.parent as unknown as TavernVariableGlobal);
    }
  } catch {
    // Cross-origin preview containers cannot expose their parent runtime.
  }

  return candidates.filter((candidate, index) => candidates.indexOf(candidate) === index);
}
