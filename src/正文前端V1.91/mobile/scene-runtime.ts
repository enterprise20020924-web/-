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

const FULLBODY_ASSET_BASE_URL = 'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/全身立绘/';
const DEFAULT_SCENE_BACKGROUND_FILES = ['新学校入口.png'];
const FALLBACK_STAGE_LOCATION_LABELS = new Set(['初始点', '初始地'].map(normalizeStageLocationName));
const STAGE_LOCATION_BACKGROUND_FILES: Record<string, string[]> = {
  [normalizeStageLocationName('D/C班基础教室')]: ['D_C班基础教室.png'],
  [normalizeStageLocationName('DC班基础教室')]: ['D_C班基础教室.png'],
  [normalizeStageLocationName('A/B班进阶教室')]: ['AB班进阶教室.png'],
  [normalizeStageLocationName('AB班进阶教室')]: ['AB班进阶教室.png'],
  [normalizeStageLocationName('S班特别教室')]: ['S班特别教室.png'],
  [normalizeStageLocationName('博览图书馆')]: ['博览图书馆中央大厅.png', '博览图书馆中央阅览大厅.png'],
  [normalizeStageLocationName('博览图书馆中央大厅')]: ['博览图书馆中央大厅.png', '博览图书馆中央阅览大厅.png'],
  [normalizeStageLocationName('博览图书馆中央阅览大厅')]: ['博览图书馆中央阅览大厅.png'],
  [normalizeStageLocationName('体育联盟-综合训练场')]: ['体育联盟总部主体育馆.png'],
  [normalizeStageLocationName('体育联盟总部主体育馆')]: ['体育联盟总部主体育馆.png'],
  [normalizeStageLocationName('沙滩排球场')]: ['私人海滩沙滩排球场.png'],
  [normalizeStageLocationName('私人海滩沙滩排球场')]: ['私人海滩沙滩排球场.png'],
  [normalizeStageLocationName('权力之塔-学生会总部')]: ['权力之塔学生会总部.png'],
  [normalizeStageLocationName('权力之塔学生会总部')]: ['权力之塔学生会总部.png'],
  [normalizeStageLocationName('学生会最高监控中心')]: ['权力之塔瞭望塔监控室.png'],
  [normalizeStageLocationName('权力之塔瞭望塔监控室')]: ['权力之塔瞭望塔监控室.png'],
  [normalizeStageLocationName('女王宫殿-女权协会总部')]: ['女王宫殿女权协会总部.png'],
  [normalizeStageLocationName('女王宫殿女权协会总部')]: ['女王宫殿女权协会总部.png'],
  [normalizeStageLocationName('女王宫殿-女权协会生活区')]: ['女权协会生活宿舍豪华单间.png'],
  [normalizeStageLocationName('女权协会生活宿舍豪华单间')]: ['女权协会生活宿舍豪华单间.png'],
  [normalizeStageLocationName('学生宿舍A栋')]: ['学生宿舍A栋单人间.png'],
  [normalizeStageLocationName('学生宿舍A栋单人间')]: ['学生宿舍A栋单人间.png'],
  [normalizeStageLocationName('学生宿舍B栋')]: ['学生宿舍B栋单人间.png'],
  [normalizeStageLocationName('学生宿舍B栋单人间')]: ['学生宿舍B栋单人间.png'],
  [normalizeStageLocationName('餐厅')]: ['天海学园食堂.png'],
  [normalizeStageLocationName('天海学园食堂')]: ['天海学园食堂.png'],
  [normalizeStageLocationName('综合商业街')]: ['综合商业街.png'],
  [normalizeStageLocationName('男性自保联盟秘密集会点')]: ['男性自保联盟秘密集会点.png'],
};

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
    backgroundUrls: resolveMobileStageBackgroundFiles(locationLabel).map(resolveFullbodyAssetUrl),
  };
}

export function resolveMobileStageBackgroundFiles(locationName: string) {
  const normalizedLocationName = normalizeStageLocationName(locationName);
  const directMatch = STAGE_LOCATION_BACKGROUND_FILES[normalizedLocationName];
  const fuzzyMatch =
    directMatch ??
    Object.entries(STAGE_LOCATION_BACKGROUND_FILES).find(
      ([locationKey]) =>
        normalizedLocationName.includes(locationKey) ||
        (normalizedLocationName.length > 0 && locationKey.includes(normalizedLocationName)),
    )?.[1];

  return uniqueNonEmpty([...(fuzzyMatch ?? DEFAULT_SCENE_BACKGROUND_FILES), ...DEFAULT_SCENE_BACKGROUND_FILES]);
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

function resolveFullbodyAssetUrl(fileName: string) {
  try {
    return new URL(fileName, FULLBODY_ASSET_BASE_URL).href;
  } catch {
    return `${FULLBODY_ASSET_BASE_URL}${encodeURIComponent(fileName)}`;
  }
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
