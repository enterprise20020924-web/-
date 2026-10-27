import { campusSupplementScenes, campusSupplementLocationScenes } from './generated/campus-supplement-scenes';

/** Explicit matches to 学园 backgrounds. Indoor scenes never fall back to another room. */
export interface CampusScene {
  file: string;
  caption: string;
  url: string;
}

const assetBase = 'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/全身立绘/';
const supplementAssetBase = 'https://raw.githubusercontent.com/enterprise20020924-web/-/main/llm1/天海附加背景/';
const scene = (file: string, caption: string, sourceBase = assetBase): CampusScene => ({
  file,
  caption,
  url: new URL(file, sourceBase).href,
});

export const campusSceneAssets: Record<string, CampusScene> = {
  ...campusSupplementScenes,
  entrance: scene('新学校入口.png', '学院正门 · 中央轴线'),
  courtyard: scene('第七教学楼群中央庭院.png', '第七教学楼 · 中央庭院'),
  classroom: scene('D_C班基础教室.png', 'D/C班基础教室 · 室内'),
  library: scene('博览图书馆中央阅览大厅.png', '博览图书馆 · 中央阅览大厅'),
  gym: scene('体育联盟总部主体育馆.png', '综合体育馆 · 建筑外观'),
  volleyball: scene('私人海滩沙滩排球场.png', '沙滩排球场 · 海岸场景'),
  watchroom: scene('权力之塔瞭望塔监控室.png', '权力之塔瞭望塔 · 监控室'),
  council: scene('权力之塔学生会总部.png', '学生会总部 · 主会议厅'),
  'mutual-aid': scene('男性自保联盟秘密集会点.png', '学生互助联盟 · 秘密集会点', supplementAssetBase),
  'womens-council': scene('女王宫殿女权协会总部.png', '女子自治协会 · 主会议厅'),
  'womens-room': scene('女权协会生活宿舍豪华单间.png', '女子自治协会生活区 · 私人房间'),
  'dorm-a': scene('学生宿舍A栋单人间.png', '学生宿舍 A 栋 · 单人间'),
  'dorm-b': scene('学生宿舍B栋单人间.png', '学生宿舍 B 栋 · 单人间'),
  dining: scene('天海学园食堂.png', '学园食堂 · 主用餐区', supplementAssetBase),
  shops: scene('综合商业街.png', '综合商业街 · 主通道'),
};

// Regional covers show one named, confirmed scene within the region, not an
// invented full panorama. Captions identify the actual scene shown.
export const campusRegionScenes: Record<string, string> = {
  teaching: 'courtyard',
  research: 'library',
  commercial: 'shops',
  central: 'entrance',
  dormitory: 'dorm-a',
  residence: 'location-30',
  clubs: 'womens-council',
  sports: 'gym',
  services: 'dining',
  mountain: 'location-50',
  beach: 'location-47',
  underground: 'mutual-aid',
};

export const campusLocationScenes: Partial<Record<number, string>> = {
  ...campusSupplementLocationScenes,
  1: 'classroom',
  7: 'library',
  8: 'gym',
  14: 'volleyball',
  15: 'watchroom',
  16: 'council',
  19: 'mutual-aid',
  26: 'womens-council',
  27: 'womens-room',
  32: 'dorm-a',
  33: 'dorm-b',
  35: 'dining',
  37: 'shops',
  38: 'entrance',
};
