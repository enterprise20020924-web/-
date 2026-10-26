import { campusDestinations } from '../map/generated/campus-destinations';
import { campusLocationScenes, campusSceneAssets } from '../map/campus-map-scenes';

export interface StageBackgroundDefinition {
  id: number;
  name: string;
  aliases: readonly string[];
  sceneKey: string;
  file: string;
  caption: string;
  url: string;
  source: 'supplement' | 'existing';
}

export const defaultStageBackgroundFile = '新学校入口.png';
export const defaultStageBackgroundUrl = campusSceneAssets.entrance.url!;

// Explicit user choices for GAL; the map's destination thumbnails stay independent.
export const stageBackgroundOverrides: Partial<Record<number, string>> = {
  36: 'entrance', // 中心广场沿用旧 GAL 的《新学校入口.png》。
};

// Only explicit names for the same destination belong here. Broad labels such as
// “教室”, “宿舍” and “监控室” must not silently select an arbitrary room.
const locationAliases: Partial<Record<number, readonly string[]>> = {
  6: ['特殊植物栽培区', '植物研究温室'],
  7: ['博览图书馆中央大厅', '博览图书馆中央阅览大厅'],
  8: ['体育联盟总部主体育馆', '第一体育馆'],
  9: ['体育联盟游泳馆', '游泳部'],
  11: ['器械训练部'],
  12: ['武术部道场', '武道馆'],
  14: ['私人海滩沙滩排球场'],
  15: ['权力之塔瞭望塔监控室', '瞭望塔监控室'],
  16: ['学生会总部'],
  18: ['最高监控中心', '天文台主监控室'],
  19: ['男性自保联盟秘密集会点'],
  24: ['艺术设计社总部'],
  25: ['材料实验室'],
  26: ['女王宫殿女权协会总部', '女权协会总部', '女子自治协会总部'],
  27: ['女王宫殿女权协会生活区', '女权协会生活宿舍豪华单间', '女子自治协会生活区'],
  30: ['交流会馆A栋', '国际交流会馆A栋'],
  31: ['交流会馆B栋', '国际交流会馆B栋'],
  32: ['学生宿舍A栋单人间'],
  33: ['学生宿舍B栋单人间'],
  35: ['天海学园食堂', '学园食堂', '中央食堂'],
  36: ['中央广场'],
  37: ['商业街'],
  38: ['学园正门', '学院大门', '天海学院大门', '学园大门', '学校入口'],
  40: ['学园后山', '后山'],
  42: ['校务服务大厅'],
  43: ['学园医院', '校医院'],
  44: ['心理咨询中心'],
  45: ['未分配社团房间'],
  48: ['海滩装备租赁店'],
};

// Reuse the map's confirmed image selection instead of maintaining a second
// filename table. No map geometry or image payload is loaded for this registry.
export const stageBackgrounds: StageBackgroundDefinition[] = campusDestinations.map(location => {
  const sceneKey = stageBackgroundOverrides[location.id] ?? campusLocationScenes[location.id];
  const asset = sceneKey ? campusSceneAssets[sceneKey] : undefined;
  if (!sceneKey || !asset) throw new Error(`地点缺少背景：${location.name}`);
  return {
    id: location.id,
    name: location.name,
    aliases: locationAliases[location.id] ?? [],
    sceneKey,
    ...asset,
    source: sceneKey.startsWith('location-') ? 'supplement' : 'existing',
  };
});

export function normalizeStageBackgroundName(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s/\\_\-–—−·・:：()（）[\]【】]/g, '');
}

const lookupEntries = stageBackgrounds.flatMap(scene =>
  [scene.name, ...scene.aliases].map(name => ({ key: normalizeStageBackgroundName(name), scene })),
);

export function resolveStageBackground(locationName: string): StageBackgroundDefinition | null {
  const key = normalizeStageBackgroundName(locationName);
  if (!key || /未同步|未识别|未知/.test(key)) return null;
  const exact = lookupEntries.find(entry => entry.key === key);
  if (exact) return exact.scene;
  // Full names win over shorter names (“后山温泉” over “后山”). For equally
  // specific names in a breadcrumb, the rightmost destination is the leaf.
  const contained = lookupEntries
    .filter(entry => key.includes(entry.key))
    .sort((a, b) => b.key.length - a.key.length || key.lastIndexOf(b.key) - key.lastIndexOf(a.key));
  return contained[0]?.scene ?? null;
}

export function resolveStageBackgroundFiles(locationName: string): string[] {
  const scene = resolveStageBackground(locationName);
  return [...new Set([...(scene ? [scene.file] : []), defaultStageBackgroundFile])];
}

export function resolveStageBackgroundUrls(locationName: string): string[] {
  const scene = resolveStageBackground(locationName);
  const primaryUrls = scene?.url
    ? [
        scene.url,
        scene.url.replace(
          'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/',
          'https://raw.githubusercontent.com/enterprise20020924-web/-/main/',
        ),
      ]
    : [];
  return [...new Set([...primaryUrls, defaultStageBackgroundUrl])];
}

export async function loadStageBackgroundUrls(locationName: string): Promise<string[]> {
  return resolveStageBackgroundUrls(locationName);
}
