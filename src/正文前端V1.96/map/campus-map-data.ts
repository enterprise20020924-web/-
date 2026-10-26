import { campusDestinations } from './generated/campus-destinations';
import { campusContours } from './campus-map-contours';

export type CampusCategory = '教学' | '行政' | '生活' | '运动' | '山海' | '地下';
export interface CampusLandmark {
  id: string;
  name: string;
  category: CampusCategory;
  anchor: [number, number] | null;
  outline: string;
  destinations: number[];
  aliases: string[];
}
const landmark = (
  id: string,
  name: string,
  category: CampusCategory,
  anchor: [number, number] | null,
  outline: string,
  destinations: number[],
  aliases: string[] = [],
): CampusLandmark => ({ id, name, category, anchor, outline, destinations, aliases });

// Reference coordinates are 1672 × 941. Indoor destinations share the corresponding exterior.
const campusBuildings = [
  landmark(
    'teaching',
    '第七教学楼',
    '教学',
    [313, 543],
    campusContours.teachingMain,
    [1, 2, 3, 4, 5],
    ['教学楼', '教室', '教师办公室'],
  ),
  landmark('library', '博览图书馆', '教学', [328, 311], campusContours.library, [7], ['图书馆', '书库']),
  // The twin glass arches are the commercial street. The greenhouse's actual
  // map position is unconfirmed; keep its directory entry without a false pin.
  landmark('greenhouse', '植物研究温室', '教学', null, '', [6], ['温室', '园艺社', '植物栽培区']),
  landmark('shops', '综合商业街', '生活', [541, 334], campusContours.greenhouse, [37], ['商业街', '购物街', '商场']),
  landmark(
    'power',
    '权力之塔',
    '行政',
    [835, 272],
    campusContours.power,
    [15, 16, 17, 18],
    ['行政楼', '学生会', '钟楼', '院长'],
  ),
  landmark(
    'dorm-a',
    '学生宿舍 A 栋',
    '生活',
    [960, 146],
    campusContours.dormA,
    [32, 28],
    ['宿舍A', 'A栋宿舍', '学生宿舍A栋', '行为反馈研究社'],
  ),
  landmark(
    'dorm-b',
    '学生宿舍 B 栋',
    '生活',
    [1090, 146],
    campusContours.dormB,
    [33, 29],
    ['宿舍B', 'B栋宿舍', '学生宿舍B栋'],
  ),
  landmark(
    'exchange',
    '交流与教职工会馆',
    '生活',
    [1303, 211],
    campusContours.exchange,
    [30, 31, 34],
    ['交流会馆', '外校临时居住地', '教职工宿舍'],
  ),
  landmark(
    'clubs',
    '樱庭社团区',
    '教学',
    [1119, 335],
    campusContours.clubs,
    [24, 26, 27, 45],
    ['蝶变之所', '女王宫殿', '社团房间', '女子自治协会'],
  ),
  landmark(
    'arena',
    '综合竞技场',
    '运动',
    [1360, 375],
    campusContours.arena,
    [39],
    ['操场', '足球场', '竞技场', '大礼堂'],
  ),
  landmark(
    'gym',
    '体育联盟综合馆',
    '运动',
    [1342, 511],
    campusContours.gym,
    [8, 10, 11],
    ['第一体育馆', '体育馆', '综合训练场', '器械训练', '天台训练场'],
  ),
  landmark('pool', '游泳部', '运动', [1510, 513], campusContours.pool, [9], ['游泳部', '游泳馆', '泳池']),
  landmark('dojo', '武术部道场', '运动', [1116, 530], campusContours.dojo, [12], ['武术部', '武道馆']),
  landmark('plaza', '中心广场', '生活', [835, 477], campusContours.plaza, [36], ['喷泉', '中央广场', '休憩广场']),
  landmark('lake', '中心湖与水道', '山海', [668, 423], campusContours.lake, [41], ['中心湖', '人工湖', '湖区', '水道']),
  landmark('dining', '餐厅', '生活', [1210, 656], campusContours.shops, [35], ['食堂', '咖啡厅']),
  landmark(
    'services',
    '综合服务大厅',
    '行政',
    [530, 656],
    campusContours.services,
    [42, 44],
    ['服务大厅', '心理健康中心', '心理咨询室'],
  ),
  landmark('hospital', '学校医院', '行政', [1214, 752], campusContours.hospital, [43], ['医院', '医务室', '诊疗区']),
  landmark(
    'gate',
    '学院正门',
    '行政',
    [835, 661],
    campusContours.gate,
    [38],
    ['正门', '学园大门', '学校入口', '天海学院大门', '学院大门'],
  ),
  landmark('shrine', '风铃神社', '山海', [535, 112], campusContours.shrine, [50], ['神社']),
  landmark('onsen', '后山温泉', '山海', [456, 176], campusContours.onsen, [13], ['温泉']),
  landmark(
    'mountain',
    '学院后山',
    '山海',
    [598, 56],
    campusContours.mountain,
    [40, 46],
    ['后山', '后山入口', '山间小径'],
  ),
  landmark('tea', '静心茶室', '生活', [632, 160], campusContours.tea, [49], ['茶室', '茶道俱乐部']),
  landmark('beach', '私人海滩', '山海', [1450, 780], campusContours.beach, [47], ['海滩', '沙滩', '码头', '木栈桥']),
  landmark('volleyball', '沙滩排球场', '运动', [1471, 716], campusContours.volleyball, [14], ['排球场', '沙滩排球']),
  landmark(
    'rental',
    '海滩装备租赁店',
    '生活',
    [1555, 681],
    campusContours.rental,
    [48],
    ['租赁店', '装备租赁', '海边小屋'],
  ),
  landmark(
    'underground',
    '地下区域入口',
    '地下',
    [1479, 642],
    campusContours.underground,
    [19, 20, 21, 22, 23, 25],
    ['地下联盟', '旧货市场', '秘密集会点', '材料实验室', '交易点', '秘密通道'],
  ),
];

export interface CampusRegion {
  id: string;
  name: string;
  category: CampusCategory;
  anchor: [number, number];
  outlines: string[];
  destinations: number[];
  aliases: string[];
  buildings: CampusLandmark[];
  description: string;
}

function region(
  id: string,
  name: string,
  category: CampusCategory,
  anchor: [number, number],
  buildingIds: string[],
  description: string,
  grounds: string[] = [],
  highlightedBuildingIds: string[] = buildingIds,
): CampusRegion {
  const buildings = buildingIds.map(buildingId => {
    const building = campusBuildings.find(item => item.id === buildingId);
    if (!building) throw new Error(`区域缺少建筑：${buildingId}`);
    return building;
  });
  return {
    id,
    name,
    category,
    anchor,
    buildings,
    description,
    // Separate paths form a union in the mask, even when source windings differ.
    outlines: [
      ...grounds,
      ...buildings
        .filter(building => highlightedBuildingIds.includes(building.id))
        .map(building => building.outline)
        .filter(Boolean),
    ],
    destinations: buildings.flatMap(building => building.destinations),
    aliases: buildings.flatMap(building => [building.name, ...building.aliases]),
  };
}

// Major visual clusters are the only map targets. Individual destinations retain
// their building and category for search. Unconfirmed positions remain unpinned.
export const campusRegions: CampusRegion[] = [
  region(
    'teaching',
    '教学区',
    '教学',
    [313, 537],
    ['teaching', 'services'],
    '第七教学楼主楼群与中央庭院，包含各班教室和教师办公室；相关校务设施可从地点目录查看。',
    [campusContours.teachingCampus],
    [],
  ),
  region(
    'research',
    '图书与研究区',
    '教学',
    [328, 311],
    ['library', 'greenhouse'],
    '以博览图书馆为核心的阅览与学习区域。研究会特殊植物栽培区暂列于研究目录，地图位置待确认。',
  ),
  region(
    'commercial',
    '综合商业街',
    '生活',
    [541, 334],
    ['shops'],
    '图书馆东侧的双拱玻璃顶商业建筑，独立于海边生活服务区，提供购物、餐饮和日常补给。',
  ),
  region(
    'central',
    '中央校务区',
    '行政',
    [835, 445],
    ['power', 'plaza', 'lake', 'gate'],
    '从学院正门延伸至权力之塔的中央区域，包含行政楼、中心广场、喷泉及两侧湖区水道。',
    ['M659 279L712 266L956 266L1010 279L1048 596L1037 649L619 649L617 596Z'],
  ),
  region(
    'dormitory',
    '学生宿舍区',
    '生活',
    [1023, 211],
    ['dorm-a', 'dorm-b'],
    '由 A、B 两栋宿舍及共用入口组成，包含学生住宿空间与宿舍内的研究设施。',
    ['M910 188L1136 188L1139 242L909 242Z'],
  ),
  region(
    'residence',
    '交流会馆区',
    '生活',
    [1303, 219],
    ['exchange'],
    '外校交流学生与教职工的居住会馆，包含接待、住宿和公共生活空间。',
  ),
  region(
    'clubs',
    '社团活动区',
    '教学',
    [1126, 339],
    ['clubs'],
    '围绕樱庭院落分布的社团会馆，包含艺术设计社、女子自治协会和可申请的社团房间。',
  ),
  region(
    'sports',
    '运动区',
    '运动',
    [1326, 451],
    ['arena', 'gym', 'pool', 'dojo'],
    '右侧成组的竞技场、综合体育馆、游泳馆与武术道场，共同构成校园运动区域。',
    ['M1213 328L1509 329L1541 444L1569 576L1501 602L1249 603L1231 566L1082 576L1079 475L1203 466L1201 381Z'],
  ),
  region(
    'services',
    '生活服务区',
    '生活',
    [1210, 684],
    ['dining', 'hospital'],
    '校园前侧的餐厅与学校医院，提供日常用餐和诊疗服务。',
    ['M1071 638L1318 647L1332 799L1295 830L1090 813L1064 749Z'],
  ),
  region(
    'mountain',
    '后山神社区',
    '山海',
    [529, 169],
    ['mountain', 'shrine', 'onsen', 'tea'],
    '整片后山园林及其间的风铃神社、温泉、茶室和登山入口。',
  ),
  region(
    'beach',
    '海滨活动区',
    '山海',
    [1462, 785],
    ['beach', 'volleyball', 'rental'],
    '沿海滩展开的休闲活动区，包含沙滩排球、装备租赁、海边小屋与木栈桥。',
  ),
  region(
    'underground',
    '地下区域',
    '地下',
    [1479, 642],
    ['underground'],
    '通过地面入口进入的地下通道、集会点、市场与实验空间。',
  ),
];

const regionByBuilding = new Map<string, CampusRegion>();
for (const area of campusRegions) {
  for (const building of area.buildings) {
    if (regionByBuilding.has(building.id)) throw new Error(`建筑重复归属：${building.name}`);
    regionByBuilding.set(building.id, area);
  }
}
if (regionByBuilding.size !== campusBuildings.length) throw new Error('地图存在未分组的建筑');

export const campusCategories: CampusCategory[] = ['教学', '行政', '生活', '运动', '山海', '地下'];
const campusLocationMapNotes: Partial<Record<number, string>> = {
  24: '地下研发总部以地面社团会馆入口定位',
  28: '地下研究空间以学生宿舍 A 栋入口定位',
  29: '地下实验空间以学生宿舍 B 栋入口定位',
};
export const campusLocations = campusDestinations.map(destination => {
  const host = campusBuildings.find(item => item.destinations.includes(destination.id));
  if (!host) throw new Error(`地图缺少地点：${destination.name}`);
  return {
    ...destination,
    landmark: host,
    region: regionByBuilding.get(host.id)!,
    mapNote: campusLocationMapNotes[destination.id],
  };
});
export type CampusLocation = (typeof campusLocations)[number];

function normalize(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s/／·・()（）\-—_]/g, '');
}
export function resolveCampusLocation(label: string): {
  region: CampusRegion;
  landmark?: CampusLandmark;
  location?: CampusLocation;
} | null {
  const key = normalize(label);
  if (!key || /未同步|未识别|未知/.test(key)) return null;
  const exact = campusLocations.find(location => normalize(location.name) === key);
  if (exact) return { region: exact.region, landmark: exact.landmark, location: exact };
  const contained = [...campusLocations]
    .sort((a, b) => b.name.length - a.name.length)
    .find(location => key.includes(normalize(location.name)));
  if (contained) return { region: contained.region, landmark: contained.landmark, location: contained };
  const exactRegion = campusRegions.find(area => normalize(area.name) === key);
  if (exactRegion) return { region: exactRegion };
  const host = campusBuildings.find(item => [item.name, ...item.aliases].some(alias => key.includes(normalize(alias))));
  if (host) return { region: regionByBuilding.get(host.id)!, landmark: host };
  const area = campusRegions.find(item => key.includes(normalize(item.name)));
  return area ? { region: area } : null;
}
