import { campusLocations } from './campus-map-data';
import { getScheduledCampusVisit, type CampusSchedulePeriod } from './campus-character-schedule';

export type CampusEncounterKind = 'resident' | 'regular' | 'occasional' | 'conditional';
export type CampusEncounterRegion =
  | 'teaching'
  | 'research'
  | 'commercial'
  | 'central'
  | 'dormitory'
  | 'residence'
  | 'clubs'
  | 'sports'
  | 'services'
  | 'mountain'
  | 'beach'
  | 'underground';

export interface CampusCharacterVisit {
  region: CampusEncounterRegion;
  kind: CampusEncounterKind;
  place: string;
  ids: number[];
  note: string;
  inferred: boolean;
}
export interface CampusCharacterHabit {
  name: string;
  affiliation: string;
  avatarFile: string | null;
  visits: CampusCharacterVisit[];
}
export interface CampusCharacterEncounter {
  person: CampusCharacterHabit;
  visits: CampusCharacterVisit[];
  kind: CampusEncounterKind;
}

const visit = (
  region: CampusEncounterRegion,
  kind: CampusEncounterKind,
  place: string,
  ids: number[] = [],
  note = '',
  inferred = false,
): CampusCharacterVisit => ({ region, kind, place, ids, note, inferred });

const person = (
  name: string,
  affiliation: string,
  avatarFile: string | null,
  visits: CampusCharacterVisit[],
): CampusCharacterHabit => ({ name, affiliation, avatarFile, visits });

// World-book habits retained as source data. The schedule below chooses one current stop.
// Source: 学园/人物日常活动地点汇总_20261022.md.
// Avatar filenames checked against llm1/Q版 on 2026-10-22. Missing portraits
// deliberately stay null: fuzzy name matching can assign another person's face.
export const campusCharacterHabits: CampusCharacterHabit[] = [
  person('伊甸阿斯莫德', '学院院长', null, [visit('central', 'resident', '院长办公室', [17], '负责学院校务。', false)]),
  person('芙莲', '特聘教师', '芙莲.png', [
    visit('teaching', 'regular', '教职办公区', [], '具体办公室尚未指定，按教师身份推定。', true),
    visit('clubs', 'occasional', '蝶变之所', [24], '有组织关联，具体活动安排未写明。', true),
    visit('residence', 'occasional', '教职工宿舍', [34], '按教职工身份推定，未确认具体住所。', true),
  ]),
  person('白石响子', 'S班教师', '白石响子.png', [
    visit('teaching', 'regular', '教师办公室', [5], '地点条目列在 B/C/D 办公室；授课时也会到 S 班教学区域。', false),
  ]),
  person('绫濑川', 'A班班主任 · 学院护士', '绫濑川.png', [
    visit('services', 'resident', '学校医院', [43], '在校医岗位工作。', false),
    visit('teaching', 'regular', '进阶教学区', [2], 'A 班授课期间。', false),
    visit('teaching', 'regular', 'S/A班教师办公室', [4], '按 A 班班主任职责安排办公地点。', true),
  ]),
  person('维纳斯', 'B班教师', null, [
    visit('sports', 'regular', '综合训练场', [8], '日常训练与教学。', false),
    visit('sports', 'occasional', '综合竞技场', [39], '竞技场可遇记录。', false),
    visit('teaching', 'regular', '进阶教室', [2], 'B 班授课期间。', false),
  ]),
  person('索菲亚', 'C班教师', '索菲亚.png', [
    visit('teaching', 'regular', '基础教学区', [1, 5], '按 C 班教师职责安排授课与办公。', true),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
  ]),
  person('莉莉安', 'D班教师', '莉莉安.png', [
    visit('teaching', 'regular', '基础教室', [1], 'D 班授课期间。', false),
    visit('teaching', 'regular', 'B/C/D班教师办公室', [5], '按 D 班教师职责安排办公地点。', true),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
    visit('beach', 'occasional', '私人海滩', [47], '', false),
  ]),
  person('弗洛拉梅斯梅尔', '心理健康中心', '弗洛拉梅斯梅尔.png', [
    visit('teaching', 'resident', '心理健康中心', [44], '服务大厅二楼的心理诊疗室。', false),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
    visit('central', 'occasional', '中心湖', [41], '', false),
  ]),
  person('布伦希尔德', '体育科主任', '布伦希尔德.png', [
    visit('sports', 'regular', '体育训练区', [8], '按体育科主任与体能教师职责推定。', true),
    visit('residence', 'occasional', '教职工宿舍', [34], '按教职工身份推定，未确认具体住所。', true),
  ]),
  person('加藤鹰', '教师', null, [
    visit('teaching', 'regular', '教职办公区', [], '尚未指定固定办公室。', true),
    visit('teaching', 'occasional', '基础教室', [1], '地点条目注明偶尔出现。', false),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
  ]),
  person('佐藤健', '基础教学教师', null, [
    visit('teaching', 'regular', '基础教室', [1], '负责基础教学。', false),
    visit('teaching', 'regular', 'B/C/D班教师办公室', [5], '按基础教学职责安排办公地点。', true),
  ]),
  person('艾琳海德', '学生会会长', '艾琳海德.png', [
    visit('central', 'resident', '学生会总部', [16], '会长办公室与校务处理区域。', false),
    visit('sports', 'occasional', '综合竞技场', [39], '', false),
    visit('teaching', 'occasional', '特别辅导室', [3], '', false),
  ]),
  person('响木天音', '学生会干事', '响木天音.png', [
    visit('central', 'regular', '学生会总部', [16], '按学生会干事职责推定，也会在校内处理事务。', true),
  ]),
  person('克莉丝汀', '学生会文书', '克莉丝汀_1.png', [
    visit('central', 'resident', '学生会总部', [16], '文书办公区是个人设定中的出现地点。', false),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
    visit('clubs', 'occasional', '空置社团活动室', [45], '', false),
  ]),
  person('神崎凛', '学生会 · 纪律委员', '神崎凛1.png', [
    visit('central', 'regular', '学生会与监控中心', [16, 15, 18], '办公、监控与巡查；也可能在广场或湖边遇见。', false),
    visit('central', 'occasional', '广场与中心湖', [36, 41], '', false),
    visit('dormitory', 'occasional', '学生宿舍 B 栋', [33], '可遇记录，不代表已确认住所。', false),
  ]),
  person('爱丽丝温特', '学生会 · 特别辅导', '爱丽丝.png', [
    visit('teaching', 'resident', '特别辅导室', [3], 'S 班特别教室是她的私人辅导室。', false),
    visit('teaching', 'occasional', 'S/A班教师办公室', [4], '教师办公室可遇记录。', false),
    visit('central', 'conditional', '中心广场迎新处', [36], '入学周开展迎新时出现。', false),
  ]),
  person('黑崎晴雯', '学生会 · 风纪委员', '黑崎晴雯.png', [
    visit('central', 'regular', '学生会与校内巡查', [16], '根据风纪委员职责推定，未设固定巡逻路线。', true),
    visit('teaching', 'occasional', '教学楼巡查', [], '教学楼可作执勤备选点，路线未明确。', true),
  ]),
  person('莎拉斯通', '女子自治协会会长', '莎拉斯通.png', [
    visit('clubs', 'resident', '协会总部', [26], '女王宫殿与协会事务区域。', false),
    visit('sports', 'occasional', '综合竞技场', [39], '', false),
    visit('central', 'occasional', '学生会总部', [16], '', false),
  ]),
  person('维多利亚戈德温', '女子自治协会', '维多利亚戈德温.png', [
    visit('clubs', 'regular', '协会总部与生活区', [26, 27], '', false),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
  ]),
  person('艾丽卡施耐德', '女子自治协会', '艾丽卡施耐德.png', [
    visit('clubs', 'regular', '协会总部与生活区', [26, 27], '', false),
    visit('sports', 'occasional', '器械训练部', [11], '', false),
  ]),
  person('雪莉克里姆希尔德', '女子自治协会 · A班', '雪莉克里姆希尔德.png', [
    visit('clubs', 'regular', '协会总部', [26], '', false),
    visit('teaching', 'regular', '进阶教室', [2], '', false),
    visit('sports', 'occasional', '综合竞技场', [39], '', false),
    visit('central', 'occasional', '中心广场', [36], '', false),
  ]),
  person('白川千夏', '女子自治协会 · B班', '白川千夏.png', [
    visit('clubs', 'regular', '协会总部与生活区', [26, 27], '', false),
    visit('teaching', 'regular', '进阶教室', [2], '', false),
    visit('dormitory', 'occasional', '学生宿舍 B 栋', [33], '仅有可遇记录，未确认住在 B 栋。', false),
  ]),
  person('明日香', 'BF社社长', '明日香.png', [
    visit(
      'dormitory',
      'resident',
      'BF社研究所',
      [28, 29],
      '研究总部与高安全实验区；此处表示研究据点，不表示宿舍分配。',
      false,
    ),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
  ]),
  person('艾米丽威廉姆斯', 'BF社实验组长', '艾米莉威廉姆斯.png', [
    visit('dormitory', 'resident', 'BF社实验区', [28, 29], '研究总部与高安全实验区。', false),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
  ]),
  person('安娜科兹洛娃', '体育联盟 · 体操部', '安娜.png', [
    visit('sports', 'regular', '体操与器械训练区', [8, 11], '', false),
    visit('central', 'occasional', '中心湖', [41], '', false),
  ]),
  person('赵婷婷', '体育联盟 · 游泳部', '赵婷婷.png', [
    visit('sports', 'regular', '游泳馆', [9], '游泳部日常训练。', false),
    visit('sports', 'occasional', '辅助训练场地', [8, 11], '也会使用综合与器械训练场地。', false),
    visit('services', 'occasional', '餐厅', [35], '', false),
  ]),
  person('李小云', '体育联盟 · 武术部', '李小云.png', [
    visit('sports', 'regular', '武术部道场', [12], '', false),
    visit('sports', 'occasional', '综合训练场', [8], '综合训练场可遇记录。', false),
    visit('services', 'occasional', '餐厅', [35], '', false),
  ]),
  person('水无月澪', '体育联盟 · 潜水部', null, [
    visit('sports', 'regular', '水上训练空间', [9], '按潜水部部长职责推定，专属场地未确认。', true),
    visit('beach', 'conditional', '海滩水上训练', [47], '开展水上训练时可能出现，场地按职责推定。', true),
  ]),
  person('克劳迪娅威斯特', '研究会', '克劳迪娅威斯特.png', [
    visit('research', 'resident', '图书馆深处', [7], '主要在图书馆深处的“西西里礼拜堂”。', false),
  ]),
  person('中岛诗织', '研究会', '中岛诗织.png', [
    visit('research', 'regular', '图书馆与植物栽培区', [7, 6], '温室的地图位置尚未确认。', false),
    visit('teaching', 'regular', '进阶教室', [2], '', false),
  ]),
  person('月下香', '研究会 · 特别研究员', '月下香.png', [
    visit('research', 'regular', '植物栽培区与图书馆', [6, 7], '温室的地图位置尚未确认。', false),
    visit('teaching', 'occasional', '特别辅导室', [3], '', false),
    visit('mountain', 'occasional', '静心茶室', [49], '', false),
  ]),
  person('黑塔小姐', '研究会 · B班', '黑塔小姐.png', [
    visit('research', 'regular', '博览图书馆', [7], '', false),
    visit('teaching', 'regular', '进阶教室', [2], '', false),
    visit('central', 'occasional', '中心湖', [41], '', false),
    visit('sports', 'occasional', '综合训练场', [8], '', false),
  ]),
  person('维斯伊尔', '艺术社 · 绘画', '维斯伊尔.png', [
    visit(
      'clubs',
      'conditional',
      '艺术社 · 位置待确认',
      [],
      '艺术社的地图位置尚未确认，仅暂列社团导览；与蝶变之所是不同组织。',
      true,
    ),
  ]),
  person('伽拉娜', '艺术社 · 雕塑部', '伽拉娜.png', [
    visit(
      'clubs',
      'conditional',
      '雕塑室 · 位置待确认',
      [],
      '艺术社的地图位置尚未确认，仅暂列社团导览；与蝶变之所是不同组织。',
      true,
    ),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
    visit('sports', 'occasional', '体育联盟桑拿房', [], '个人出现地点明确，但尚未对应独立地图地点。', false),
  ]),
  person('墨染', '艺术社 · 书法部', '墨柒.png', [
    visit(
      'clubs',
      'conditional',
      '书法部 · 位置待确认',
      [],
      '别名墨柒。艺术社的地图位置尚未确认，仅暂列社团导览；与蝶变之所是不同组织。',
      true,
    ),
  ]),
  person('缪斯', '艺术社 · 声乐部', '缪斯.png', [
    visit(
      'clubs',
      'conditional',
      '排练室 · 位置待确认',
      [],
      '艺术社的地图位置尚未确认，仅暂列社团导览；与蝶变之所是不同组织。',
      true,
    ),
  ]),
  person('露美', '艺术社 · 摄影部', '露美.png', [
    visit(
      'clubs',
      'conditional',
      '暗房 · 位置待确认',
      [],
      '艺术社的地图位置尚未确认，仅暂列社团导览；与蝶变之所是不同组织。',
      true,
    ),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
    visit('teaching', 'regular', '进阶教室', [2], '按 A 班身份安排上课地点。', true),
  ]),
  person('露娜拉克缇丝', '地下联盟 · 商人', '露娜拉克缇丝.png', [
    visit('underground', 'regular', '地下市场与交易点', [21, 22, 23], '', false),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
    visit('dormitory', 'occasional', '学生宿舍 A 栋', [32], '可遇记录，不作为住所依据。', false),
  ]),
  person('伊丽莎白夜羽', '地下联盟', '伊丽莎白夜羽.png', [
    visit('underground', 'regular', '地下据点与市场', [21, 22], '', false),
    visit('dormitory', 'occasional', '学生宿舍 B 栋', [33], '', false),
    visit('central', 'occasional', '中心湖', [41], '', false),
  ]),
  person('樱岛麻衣', '地下联盟 · 月光赌场', '樱岛麻衣.png', [
    visit('underground', 'resident', '月光赌场', [], '赌场尚无独立地图地点；地下市场也有可遇记录。', false),
    visit('underground', 'occasional', '地下旧货市场', [22], '', false),
    visit('central', 'occasional', '学生会总部', [16], '', false),
  ]),
  person('潘多拉小姐', '地下市场店主', '潘多拉小姐.png', [
    visit('underground', 'resident', '旧货市场店铺', [22], '', false),
  ]),
  person('蝶', '蝶变之所', '蝶.png', [
    visit('clubs', 'resident', '蝶变之所总部', [24], '', false),
    visit('underground', 'regular', '材料实验室', [25], '', false),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
  ]),
  person('雪', '蝶变之所 · 实验室', '雪.png', [
    visit('underground', 'resident', '材料实验室', [25], '', false),
    visit('services', 'occasional', '学校医院', [43], '为取用器材等事务来访，并非驻院人员。', false),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
  ]),
  person('风', '蝶变之所', '风.png', [
    visit('clubs', 'regular', '总部设计活动区', [24], '', false),
    visit('teaching', 'occasional', '基础教室', [1], '', false),
    visit('dormitory', 'occasional', '学生宿舍 B 栋', [33], '', false),
    visit('central', 'occasional', '中心湖', [41], '', false),
  ]),
  person('田中勇', '学生互助联盟', null, [visit('underground', 'resident', '秘密集会点', [19], '', false)]),
  person('李强', '学生互助联盟 · 情报员', null, [
    visit('underground', 'regular', '秘密集会点', [19], '也在校园收集信息，未设固定路线。', false),
  ]),
  person('如月诗乃', '学生服务中心 · B班', '如月诗乃.png', [
    visit('teaching', 'resident', '服务大厅接待窗口', [42], '在大厅一楼负责接待与借贷业务。', false),
    visit('teaching', 'regular', '进阶教室', [2], 'B 班上课期间。', false),
  ]),
  person('森莉花', '学生服务中心 · 研究会', '森莉花.png', [
    visit('teaching', 'resident', '服务大厅技术区', [42], '在大厅一楼工作。', false),
    visit('teaching', 'regular', '进阶教室', [2], 'A 班上课期间。', false),
    visit('research', 'regular', '研究会活动空间', [7], '研究会活动时。', true),
  ]),
  person('阿米莉亚安斯华斯', 'C班学生', '艾米莉亚.png', [
    visit('teaching', 'regular', '基础教室', [1], '按 C 班身份安排上课地点。', true),
    visit('teaching', 'conditional', '综合服务大厅', [42], '有挂牌或委托业务时出现，并非柜台职员。', false),
  ]),
  person('樱井结衣', 'D班学生', '樱井结衣.png', [
    visit('teaching', 'regular', '基础教室', [1], '按 D 班身份安排上课地点。', true),
    visit('teaching', 'conditional', '综合服务大厅', [42], '有挂牌或委托业务时出现，并非柜台职员。', false),
  ]),
  person('伊甸芙宁', '独立活动', '伊甸芙宁.png', [
    visit(
      'central',
      'regular',
      '院长办公室与学生会',
      [17, 16, 36],
      '个人设定明确列出院长办公室、学生会和中心广场。',
      false,
    ),
  ]),
  person('沐芯兰', '独立工坊 · A班', '沐芯兰.png', [
    visit('clubs', 'resident', '社团房间内的工坊', [45], '', false),
    visit('dormitory', 'resident', '学生宿舍 A 栋', [32], '人物设定明确写有 A 栋住所。', false),
    visit('teaching', 'regular', '进阶教室', [2], '', false),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
    visit('sports', 'occasional', '竞技场观众席', [39], '以观众身份出现。', false),
  ]),
  person('安琪', '自由活动', '安琪.png', [
    visit('services', 'regular', '餐厅', [35], '流动活动点，不是在此工作的员工。', false),
    visit('central', 'regular', '中心广场', [36], '公共区域可遇，未设固定据点。', false),
    visit('sports', 'occasional', '综合竞技场', [39], '', false),
    visit('underground', 'occasional', '地下旧货市场', [22], '', false),
  ]),
  person('美咲绫', '茶艺部', '美咲绫.png', [
    visit('mountain', 'resident', '静心茶室', [49], '茶室的主要负责人。', false),
    visit('mountain', 'occasional', '风铃神社', [50], '', false),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
  ]),
  person('角楯花凛', '自由活动', '花凛.png', [
    visit('dormitory', 'regular', '宿舍区', [32, 33], '两栋均有可遇记录，未确认固定住所。', false),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
    visit('sports', 'occasional', '综合竞技场', [39], '', false),
  ]),
  person('月城遥', '主角同班同学', '月城遥.png', [
    visit('teaching', 'regular', '主角所在班级', [], '班级随主角设置变化，暂不分配固定教室。', true),
    visit('dormitory', 'occasional', '学生宿舍 B 栋', [33], '', false),
  ]),
  person('零', '巫术研究社', '零.png', [
    visit('clubs', 'resident', '社团活动室', [45], '', false),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
  ]),
  person('桃乃爱', '自由活动', '桃乃爱.png', [
    visit('central', 'regular', '中心广场', [36], '流动落点，未写固定据点。', false),
    visit('services', 'regular', '餐厅', [35], '可遇记录，不是餐厅员工。', false),
    visit('dormitory', 'occasional', '学生宿舍 B 栋', [33], '', false),
  ]),
  person('上杉亚衣', '独立活动', '上杉亚衣.png', [
    visit('dormitory', 'regular', '学生宿舍 B 栋附近', [33], '也会跟随主角日常活动；不据此指定房号。', false),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
    visit('mountain', 'occasional', '静心茶室', [49], '', false),
    visit('clubs', 'conditional', '协会总部', [26], '加入协会之后。', false),
  ]),
  person('天宫院抚子', 'S班学生', '天宫院抚子.png', [
    visit('teaching', 'regular', 'S班教学区域', [], '按 S 班身份推定，未将其归入爱丽丝的私人辅导室。', true),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
    visit('central', 'occasional', '中心广场', [36], '', false),
    visit('clubs', 'occasional', '蝶变之所', [24], '', false),
  ]),
  person('索亚伊万诺娃', 'S班学生', '索亚伊万诺娃.png', [
    visit('teaching', 'regular', 'S班教学区域', [], '按 S 班身份推定，未将其归入爱丽丝的私人辅导室。', true),
    visit('mountain', 'occasional', '学院后山', [40], '', false),
    visit('services', 'occasional', '餐厅', [35], '', false),
    visit('central', 'occasional', '中心广场', [36], '', false),
    visit('residence', 'occasional', '交流会馆 A', [30], '地点可遇，不表示在此住宿。', false),
  ]),
  person('九条凛音', 'S班班长', '九条凛音.png', [
    visit('teaching', 'regular', 'S班教学区域', [], '按 S 班身份推定，未将其归入爱丽丝的私人辅导室。', true),
    visit('central', 'occasional', '学生会总部', [16], '', false),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
  ]),
  person('艾格妮丝蔷薇', 'S班学生', '艾格妮丝.png', [
    visit('dormitory', 'regular', '两栋宿舍之间', [32, 33], '个人设定的活动范围，并非两栋都属于她的住所。', false),
    visit('teaching', 'regular', 'S班教学区域', [], '按 S 班身份推定，未将其归入爱丽丝的私人辅导室。', true),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
    visit('underground', 'occasional', '下水道入口', [], '个人出现地点明确，尚未对应独立地点。', false),
  ]),
  person('薇丝佩菈', 'S班学生', '薇丝佩菈.png', [
    visit('teaching', 'regular', 'S班教学区域', [], '按 S 班身份推定，未将其归入爱丽丝的私人辅导室。', true),
  ]),
  person('凰天羽', 'A班学生', '凰天羽.png', [
    visit('teaching', 'regular', '进阶教室', [2], '按人物班级安排上课地点。', true),
    visit('mountain', 'occasional', '学院后山', [40], '', false),
    visit('central', 'occasional', '中心广场', [36], '', false),
    visit('services', 'occasional', '学校医院', [43], '', false),
  ]),
  person('赤城朱音', 'A班 · 体育联盟', '赤城朱音.png', [
    visit('teaching', 'regular', '进阶教室', [2], '按人物班级安排上课地点。', true),
    visit('sports', 'regular', '综合训练场', [8], '', false),
    visit('sports', 'occasional', '游泳馆', [9], '', false),
  ]),
  person('蓝原结衣', 'A班学生', '蓝原结衣.png', [
    visit('teaching', 'regular', '进阶教室', [2], '按人物班级安排上课地点。', true),
    visit('research', 'regular', '博览图书馆', [7], '', false),
    visit('mountain', 'occasional', '静心茶室', [49], '', false),
  ]),
  person('橘美玲', '商业街店主 · B班', null, [
    visit('commercial', 'resident', '商业街店铺', [37], '本人条目为 B 班；人物目录的 A 班记录不采用。', false),
    visit('teaching', 'regular', '进阶教室', [2], '按人物班级安排上课地点。', true),
    visit('central', 'occasional', '中心广场', [36], '', false),
  ]),
  person('克里奥佩特拉七世', 'B班学生', null, [
    visit('teaching', 'regular', '进阶教室', [2], '按人物班级安排上课地点。', true),
    visit('mountain', 'occasional', '静心茶室', [49], '', false),
    visit('central', 'occasional', '中心广场', [36], '', false),
  ]),
  person('星野光', 'B班学生', '星野光.png', [
    visit('teaching', 'regular', '进阶教室', [2], '按人物班级安排上课地点。', true),
    visit('central', 'occasional', '中心广场', [36], '', false),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
  ]),
  person('望月静', 'B班 · 图书委员会', '望月静.png', [
    visit('research', 'regular', '图书馆阅览与管理区', [7], '图书委员活动位置，不代表住在图书馆。', false),
    visit('teaching', 'regular', '进阶教室', [2], '按人物班级安排上课地点。', true),
  ]),
  person('早坂蕾娜', 'B班学生', '早坂蕾娜.png', [
    visit('teaching', 'regular', '进阶教室', [2], '按人物班级安排上课地点。', true),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
  ]),
  person('伊尼亚德瓦卢瓦', 'C班学生', '伊尼亚德瓦卢瓦.png', [
    visit('teaching', 'regular', '基础教室', [1], '按人物班级安排上课地点。', true),
    visit('teaching', 'occasional', '母亲的办公区', [5], '母亲为索菲亚，此处仅作关系推定。', true),
  ]),
  person('娜拉', 'C班 · 后山活动', null, [
    visit('mountain', 'regular', '学院后山', [40], '所属字段明确写后山。', false),
    visit('teaching', 'regular', '基础教室', [1], '按人物班级安排上课地点。', true),
    visit('services', 'occasional', '餐厅', [35], '', false),
    visit('central', 'occasional', '中心广场', [36], '', false),
    visit('dormitory', 'occasional', '学生宿舍 A 栋', [32], '可遇记录，未确认住所。', false),
  ]),
  person('小鸟游雏子', 'C班学生', '小鸟游雏子.png', [
    visit('teaching', 'regular', '基础教室', [1], '按人物班级安排上课地点。', true),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
    visit('mountain', 'occasional', '学院后山', [40], '', false),
    visit('central', 'occasional', '中心广场', [36], '', false),
  ]),
  person('猫宫宁宁', 'C班学生', '猫宫宁宁.png', [
    visit('teaching', 'regular', '基础教室', [1], '按人物班级安排上课地点。', true),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
    visit('mountain', 'occasional', '学院后山', [40], '', false),
    visit('central', 'occasional', '中心广场', [36], '', false),
  ]),
  person('犬饲真子', 'C班学生', '犬饲真子.png', [
    visit('teaching', 'regular', '基础教室', [1], '按人物班级安排上课地点。', true),
    visit('underground', 'occasional', '地下旧货市场', [22], '', false),
  ]),
  person('娜塔莎斯迈尔', 'D班学生', '娜塔莎斯迈尔.png', [
    visit('teaching', 'regular', '基础教室', [1], '按人物班级安排上课地点。', true),
  ]),
  person('米莉', 'D班 · 体育联盟啦啦队', '米莉.png', [
    visit('teaching', 'regular', '基础教室', [1], '按人物班级安排上课地点。', true),
    visit('sports', 'conditional', '训练区与竞技场', [8, 39], '啦啦队训练、比赛应援时；具体场地按职责推定。', true),
  ]),
  person('铃木惠美', 'D班学生', '铃木惠美.png', [
    visit('teaching', 'regular', '基础教室', [1], '按人物班级安排上课地点。', true),
  ]),
  person('山田花子', 'D班学生', '山田花子.png', [
    visit('teaching', 'regular', '基础教室', [1], '按人物班级安排上课地点。', true),
  ]),
  person('佐藤幸子', 'D班学生', '佐藤幸子.png', [
    visit('teaching', 'regular', '基础教室', [1], '按人物班级安排上课地点。', true),
    visit('services', 'regular', '学校医院', [43], '地点条目注明经常出现，并非医院员工。', false),
    visit('mountain', 'occasional', '学院后山', [40], '', false),
  ]),
  person('风音', '风铃神社', '风音.png', [
    visit('mountain', 'resident', '风铃神社', [50], '', false),
    visit('research', 'occasional', '博览图书馆', [7], '', false),
    visit('central', 'occasional', '中心湖', [41], '', false),
  ]),
  person('铃音', '风铃神社', '铃音.png', [
    visit('mountain', 'resident', '风铃神社', [50], '', false),
    visit('central', 'occasional', '中心广场', [36], '', false),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
  ]),
  person('梅朵', '广播社社长 · 赛事解说', '梅朵.png', [
    visit('sports', 'conditional', '竞技场解说席', [39], '赛事解说时出现；广播室尚无独立地图地点。', false),
    visit('central', 'occasional', '中心广场采访', [36], '', false),
    visit('dormitory', 'occasional', '学生宿舍 A 栋', [32], '可遇记录，未确认住所。', false),
  ]),
  person('花火', '期中转学生 · A班', null, [
    visit('teaching', 'conditional', '进阶教室', [2], '期中转入学园并选择 A 班之后。', false),
  ]),
  person('句星兰熙', '园艺社社长 · A班', null, [
    visit('teaching', 'conditional', '进阶教室', [2], '返校后按 A 班身份上课。', false),
    visit('research', 'conditional', '园艺相关活动', [], '园艺社的位置尚未确认，不能直接认定其使用研究会温室。', true),
  ]),
  person('伊莉雅', '转学生 · B班', null, [
    visit('teaching', 'conditional', '进阶教室', [2], '转入学园 B 班之后。', false),
    visit('central', 'conditional', '院长办公室', [17], '院长召见时出现。', false),
  ]),
  person('辣妹子阳菜', 'A班学生', '阳菜.png', [
    visit('teaching', 'regular', '进阶教室', [2], '按人物班级安排上课地点。', true),
    visit('central', 'occasional', '中心广场', [36], '', false),
    visit('commercial', 'occasional', '综合商业街', [37], '', false),
  ]),
  person('夏洛特', '皇家学院交换生', '夏洛特.png', [
    visit('teaching', 'conditional', '转学后的教学区', [], '正式转入天海学园之后，具体班级未定。', true),
    visit('residence', 'conditional', '交流居住区域', [], '转学或交流期间的居住安排，尚未指定 A/B 会馆。', true),
    visit('services', 'conditional', '餐厅', [35], '仅对应转学后的相关剧情，不设固定用餐时刻。', true),
  ]),
  person('柳烟霞', '玉台仙苑交换生', '柳烟霞.png', [
    visit('teaching', 'conditional', '转学后的教学区', [], '转学之后，具体班级未定。', true),
    visit('dormitory', 'conditional', 'A栋走廊', [32], '仅在转学后的相关剧情出现，不据此认定住所。', true),
    visit('mountain', 'conditional', '神社夜间活动', [50], '仅对应转学后的特定夜间剧情。', true),
  ]),
  person('安洁莉卡', '教会交换生', '安洁莉卡.png', [
    visit('teaching', 'conditional', '转学后的教学区', [], '若正式转学，具体班级未定。', true),
    visit('residence', 'conditional', '交流居住区域', [], '若转学或交流，具体房间未定。', true),
    visit('central', 'conditional', '夜间中心湖', [41], '相关夜间剧情发生时。', true),
    visit('mountain', 'conditional', '神社夜间活动', [50], '相关夜间剧情发生时。', true),
  ]),
  person('莉莉娜', '魔界学院交换生', '莉莉娜.png', [
    visit('teaching', 'conditional', '转学后的教学区', [], '若正式转学，具体班级未定。', true),
    visit('residence', 'conditional', '交流居住区域', [], '若转学或交流，具体房间未定。', true),
  ]),
  person('莉莉丝', '魔界学院交换生', '莉莉丝.png', [
    visit('commercial', 'conditional', '商业街甜品店', [37], '学园祭来访或转学相关剧情中可能出现。', true),
    visit('residence', 'conditional', '交流居住区域', [], '若转学或交流，具体房间未定。', true),
  ]),
  person('希安', '夏日剧情入学人物', null, [
    visit('teaching', 'conditional', '入学后的教学区', [], '夏日剧情后正式入学，具体班级未定。', true),
    visit('central', 'conditional', '中心广场', [36], '夏日剧情后入学，公共活动点仅为推定。', true),
  ]),
  person('迦南', '夏日剧情后教师', null, [
    visit('teaching', 'conditional', '教职办公与教学区', [], '夏日剧情后成为教师，具体授课区域与办公室未定。', true),
  ]),
  person('菲奥娜', '瓦莱里乌斯皇家学院', '菲奥娜.png', [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
  person('玛德琳', '瓦莱里乌斯皇家学院', '玛德琳.png', [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
  person('伊莎贝拉', '瓦莱里乌斯皇家学院', '伊莎贝拉.png', [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
  person('阿黛尔', '瓦莱里乌斯皇家学院', '阿黛尔.png', [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
  person('玄霜', '玉台仙苑', '玄霜.png', [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
  person('青鸢', '玉台仙苑', '青鸢.png', [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
  person('云溪', '玉台仙苑', '云溪.png', [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
  person('贝阿切丝特', '聖·塞拉芬娜修道院', '贝阿切丝特.png', [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
  person('特蕾莎', '聖·塞拉芬娜修道院', '特蕾莎.png', [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
  person('玛利亚', '聖·塞拉芬娜修道院', '玛利亚.png', [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
  person('贝尔芬格', '基赫纳学院', '贝尔芬格.png', [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
  person('梅菲丝', '基赫纳学院', '梅菲丝.png', [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
  person('赛莲', '基赫纳学院', null, [
    visit('residence', 'conditional', '外校来访与交流', [], '外校交流来访时暂列本区，A/B 会馆及房间尚未确认。', true),
    visit('sports', 'conditional', '校际活动场地', [39], '校际活动或赛事期间；不表示平时在本校训练。', true),
  ]),
];

export const campusEncounterKinds: Record<CampusEncounterKind, { label: string; order: number }> = {
  resident: { label: '常驻', order: 0 },
  regular: { label: '日常', order: 1 },
  occasional: { label: '偶遇', order: 2 },
  conditional: { label: '条件', order: 3 },
};

export function getCampusCharacterCurrentVisit(
  person: CampusCharacterHabit,
  period: CampusSchedulePeriod = 'daytime',
): CampusCharacterVisit {
  const primary = [...person.visits].sort(
    (a, b) => campusEncounterKinds[a.kind].order - campusEncounterKinds[b.kind].order,
  )[0];
  // Match the original followed-person destination, including its first concrete sub-location.
  const location = primary.ids.flatMap(
    id => campusLocations.find(location => location.id === id && location.region.id === primary.region) ?? [],
  )[0];
  const daytime = {
    ...primary,
    ids: location ? [location.id] : [],
    place: location && primary.ids.length > 1 ? location.name : primary.place,
  };
  return getScheduledCampusVisit(person, daytime, period);
}

export function getCampusCharacterEncounters(
  regionId: string,
  locationId?: number,
  unmappedPlace?: string,
  period: CampusSchedulePeriod = 'daytime',
): CampusCharacterEncounter[] {
  return campusCharacterHabits
    .flatMap(person => {
      const visit = getCampusCharacterCurrentVisit(person, period);
      const matches =
        visit.region === regionId &&
        (locationId === undefined || visit.ids.includes(locationId)) &&
        (unmappedPlace === undefined || (visit.ids.length === 0 && visit.place === unmappedPlace));
      return matches ? [{ person, visits: [visit], kind: visit.kind }] : [];
    })
    .sort((a, b) => campusEncounterKinds[a.kind].order - campusEncounterKinds[b.kind].order);
}

export function getCampusRegionPlaceGroups(regionId: string, period: CampusSchedulePeriod = 'daytime') {
  return campusLocations
    .filter(location => location.region.id === regionId)
    .map(location => ({
      location,
      people: getCampusCharacterEncounters(regionId, location.id, undefined, period),
    }));
}

export function getCampusUnmappedPlaceGroups(regionId: string, period: CampusSchedulePeriod = 'daytime') {
  const names = [
    ...new Set(
      campusCharacterHabits.flatMap(person => {
        const visit = getCampusCharacterCurrentVisit(person, period);
        return visit.region === regionId && visit.ids.length === 0 ? [visit.place] : [];
      }),
    ),
  ];
  return names.map(place => ({ place, people: getCampusCharacterEncounters(regionId, undefined, place, period) }));
}

export function getCampusEncounterPlaces(encounter: CampusCharacterEncounter) {
  return [...new Set(encounter.visits.flatMap(visit => visit.ids))].flatMap(
    id => campusLocations.find(location => location.id === id) ?? [],
  );
}

export function getCampusCharacterAvatarUrls(person: CampusCharacterHabit): string[] {
  if (!person.avatarFile) return [];
  const file = encodeURIComponent(person.avatarFile);
  return [
    `https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/Q%E7%89%88/${file}`,
    `https://raw.githubusercontent.com/enterprise20020924-web/-/main/llm1/Q%E7%89%88/${file}`,
  ];
}
