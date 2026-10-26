export interface MobileStageSceneView {
  timeLabel: string;
  locationLabel: string;
  backgroundUrls: string[];
}

type MvuMessageOption = { type: 'message'; message_id: number | 'latest' };

type TavernVariableGlobal = typeof globalThis & {
  Mvu?: {
    getMvuData?: (option: MvuMessageOption) => unknown;
  };
  getVariables?: (option: MvuMessageOption) => unknown;
};

const FALLBACK_STAGE_LOCATION_LABELS = new Set(['初始点', '初始地'].map(normalizeStageLocationName));

export function readMobileStageSceneView(messageId: number, variableRevision = 0): MobileStageSceneView {
  void variableRevision;
  return deriveMobileStageSceneView(readVariableSnapshots(messageId));
}

export function deriveMobileStageSceneView(snapshots: unknown[]): MobileStageSceneView {
  const timeLabel = readStageTimeLabel(snapshots);
  const locationLabel = readStageLocationLabel(snapshots);

  return {
    timeLabel,
    locationLabel,
    backgroundUrls: resolveStageBackgroundUrls(locationLabel),
  };
}

export function resolveMobileStageBackgroundFiles(locationName: string) {
  return resolveStageBackgroundFiles(locationName);
}

function readStageTimeLabel(snapshots: unknown[]) {
  const date = readFirstPathValue(snapshots, [
    ['stat_data', '时间系统', '日期'],
    ['时间系统', '日期'],
  ]);
  const weekday = readFirstPathValue(snapshots, [
    ['stat_data', '时间系统', '星期'],
    ['时间系统', '星期'],
  ]);
  const time = readFirstPathValue(snapshots, [
    ['stat_data', '时间系统', '时间'],
    ['时间系统', '时间'],
  ]);
  const parts = uniqueNonEmpty([formatStageDate(date), formatStageWeekday(weekday), formatStageClock(time)]);

  return parts.length > 0 ? parts.join(' ') : '时间未同步';
}

function readStageLocationLabel(snapshots: unknown[]) {
  const locationNames = readPathTextValues(snapshots, [
    ['stat_data', '位置系统', '地点名称'],
    ['位置系统', '地点名称'],
    ['stat_data', '位置系统', '当前地点'],
    ['位置系统', '当前地点'],
    ['stat_data', '位置系统', '地点'],
    ['位置系统', '地点'],
    ['stat_data', '位置系统', '当前位置'],
    ['位置系统', '当前位置'],
    ['stat_data', '位置系统', '区域'],
    ['位置系统', '区域'],
    ['stat_data', '位置系统', '当前区域'],
    ['位置系统', '当前区域'],
    ['stat_data', '世界', '当前地点'],
    ['世界', '当前地点'],
    ['stat_data', '地点名称'],
    ['地点名称'],
    ['stat_data', '当前地点'],
    ['当前地点'],
    ['stat_data', '地点'],
    ['地点'],
    ['stat_data', '当前位置'],
    ['当前位置'],
    ['stat_data', '区域'],
    ['区域'],
    ['stat_data', '当前区域'],
    ['当前区域'],
  ]);
  const explicitLocation = locationNames.find(locationName => !isFallbackStageLocationLabel(locationName));

  return explicitLocation ?? '地点未同步';
}

function readVariableSnapshots(messageId: number) {
  return [
    readMvuData(messageId),
    readVariables(messageId),
    readMvuData('latest'),
    readVariables('latest'),
    readMvuData(0),
    readVariables(0),
  ];
}

function readMvuData(messageId: number | 'latest') {
  for (const runtime of getTavernRuntimeCandidates()) {
    try {
      const value = runtime.Mvu?.getMvuData?.({ type: 'message', message_id: messageId });
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch {
      // Continue with the parent frame when MVU is not exposed locally.
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
      // Continue with the parent frame when variables are not exposed locally.
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
    // Cross-frame access may be blocked in standalone previews.
  }

  return candidates.filter((candidate, index) => candidates.indexOf(candidate) === index);
}

function readFirstPathValue(snapshots: unknown[], paths: string[][]) {
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

function readPathTextValues(snapshots: unknown[], paths: string[][]) {
  const values: string[] = [];
  const seen = new Set<string>();

  for (const snapshot of snapshots) {
    for (const path of paths) {
      const normalizedValue = String(unwrapMvuValue(readPath(snapshot, path)) ?? '').trim();
      if (normalizedValue.length === 0 || seen.has(normalizedValue)) {
        continue;
      }

      seen.add(normalizedValue);
      values.push(normalizedValue);
    }
  }

  return values;
}

function readPath(source: unknown, path: string[]) {
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

function normalizeStageLocationName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '')
    .replace(/[／]/g, '/')
    .replace(/[－–—−]/g, '-');
}

function isFallbackStageLocationLabel(locationName: string) {
  return FALLBACK_STAGE_LOCATION_LABELS.has(normalizeStageLocationName(locationName));
}

function formatStageDate(value: unknown) {
  const normalizedValue = String(unwrapMvuValue(value) ?? '').trim();
  const dateMatch = normalizedValue.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);
  if (dateMatch === null) {
    return normalizedValue;
  }

  return `${dateMatch[1]}年${Number(dateMatch[2])}月${Number(dateMatch[3])}日`;
}

function formatStageWeekday(value: unknown) {
  const normalizedValue = String(unwrapMvuValue(value) ?? '').trim();
  const weekdayMap: Record<string, string> = {
    '0': '星期日',
    '1': '星期一',
    '2': '星期二',
    '3': '星期三',
    '4': '星期四',
    '5': '星期五',
    '6': '星期六',
    '7': '星期日',
    日: '星期日',
    天: '星期日',
    一: '星期一',
    二: '星期二',
    三: '星期三',
    四: '星期四',
    五: '星期五',
    六: '星期六',
  };

  return weekdayMap[normalizedValue] ?? normalizedValue.replace(/^周/, '星期');
}

function formatStageClock(value: unknown) {
  const normalizedValue = String(unwrapMvuValue(value) ?? '').trim();
  const timeMatch = normalizedValue.match(/^(\d{1,2})[:：](\d{1,2})$/);
  if (timeMatch === null) {
    return normalizedValue;
  }

  return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2].padStart(2, '0')}`;
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(value => value?.trim() ?? '').filter(value => value.length > 0)));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function unwrapMvuValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}
import { resolveStageBackgroundFiles, resolveStageBackgroundUrls } from '../engine/stage-backgrounds';
