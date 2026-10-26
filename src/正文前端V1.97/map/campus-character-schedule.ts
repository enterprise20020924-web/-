import { campusLocations } from './campus-map-data';
import type { CampusCharacterHabit, CampusCharacterVisit, CampusEncounterRegion } from './campus-character-encounters';

export type CampusSchedulePeriod = 'home' | 'daytime' | 'afterSchool';
type CampusScheduleStop = number | { region: CampusEncounterRegion; place: string };
export interface CampusDailySchedule {
  afterSchool: CampusScheduleStop;
  home: CampusScheduleStop;
  activity: string;
  fixed?: boolean;
}

// Authored daily routing, based on the world-book habits and event inventory.
// 08:00–16:00 preserves the previous primary location unless explicitly fixed by the author.
// Home assignments without an explicit world-book address are documented as design choices.
const routes: [string, CampusScheduleStop, CampusScheduleStop, string, boolean?][] = [
  ['伊甸阿斯莫德', 17, 17, '全天留在院长办公室。', true],
  ['芙莲', 24, 34, '前往蝶变之所，接触熟悉的组织成员。'],
  ['白石响子', 34, 34, '回教职工休息区放松、整理课程。'],
  ['绫濑川', 7, 34, '查阅医学与教学资料。'],
  ['维纳斯', 11, 34, '进行器械训练，保持体能。'],
  ['索菲亚', 7, 34, '查阅理论资料，整理研究课题。'],
  ['莉莉安', 47, 34, '换下工作装，在海边放松。'],
  ['弗洛拉梅斯梅尔', 41, 34, '沿湖散步，暂时离开心理诊疗工作。'],
  ['布伦希尔德', 37, 34, '去商业街看看布丁和少女漫画。'],
  ['加藤鹰', 37, 34, '在商业街闲逛、购买日常用品。'],
  ['佐藤健', 7, 34, '安静阅读，准备基础教学资料。'],
  ['艾琳海德', 16, 16, '在学生会总部办公、活动，休息时回楼内单间宿舍。', true],
  ['响木天音', 16, 16, '在学生会总部办公、活动，休息时回楼内单间宿舍。', true],
  ['克莉丝汀', 16, 16, '在学生会总部办公、活动，休息时回楼内单间宿舍。', true],
  ['神崎凛', 16, 16, '在学生会总部办公、活动，休息时回楼内单间宿舍。', true],
  ['爱丽丝温特', 16, 16, '在学生会总部办公、活动，休息时回楼内单间宿舍。', true],
  ['黑崎晴雯', 16, 16, '在学生会总部办公、活动，休息时回楼内单间宿舍。', true],
  ['莎拉斯通', 39, 27, '观看比赛，留意新出现的强手。'],
  ['维多利亚戈德温', 37, 27, '查看商业街交易与货品。'],
  ['艾丽卡施耐德', 11, 27, '进行力量训练，维护体能。'],
  ['雪莉克里姆希尔德', 39, 27, '到竞技场练习或寻找对手。'],
  ['白川千夏', 27, 27, '回协会生活区与成员相处。'],
  ['明日香', 7, 32, '查资料，为下一项产品试验做准备。'],
  ['艾米丽威廉姆斯', 29, 32, '在实验区继续设备研究。'],
  ['安娜科兹洛娃', 11, 32, '继续器械与体能训练。'],
  ['赵婷婷', 41, 32, '结束游泳训练后到湖边休息。'],
  ['李小云', 8, 32, '在综合训练场进行个人训练。'],
  ['水无月澪', 47, 32, '到海边观察水域、准备潜水训练。'],
  ['克劳迪娅威斯特', 49, 32, '离开图书馆，到茶室安静休息。'],
  ['中岛诗织', 6, 32, '去植物栽培区观察与记录样本。'],
  ['月下香', 49, 32, '到茶室研究香气、品茶。'],
  ['黑塔小姐', 41, 33, '带着书到湖边阅读、思考。'],
  ['维斯伊尔', 7, 32, '寻找绘画与艺术创作资料。'],
  ['伽拉娜', 13, 32, '在温泉休息，放松雕塑工作后的疲劳。'],
  ['墨染', 7, 32, '临摹古籍，练习书法。'],
  ['缪斯', 36, 32, '在广场练声、尝试小型演出。'],
  ['露美', 39, 32, '到竞技场拍摄比赛素材。'],
  ['露娜拉克缇丝', 37, 32, '到地面商业街观察货源。'],
  ['伊丽莎白夜羽', 41, 33, '在湖边享受安静时光。'],
  ['樱岛麻衣', 37, 33, '离开赌场，到商业街采购。'],
  ['潘多拉小姐', 23, 33, '到临时交易点寻找新藏品。'],
  ['蝶', 25, 32, '前往材料实验室查看研发进度。'],
  ['雪', 7, 32, '查阅实验所需的资料。'],
  ['风', 37, 33, '挑选化妆品和服装。'],
  ['田中勇', 8, 33, '进行自保与体能练习。'],
  ['李强', 36, 33, '在广场收集校园消息。'],
  ['如月诗乃', 37, 33, '查看商品价格，安排生活采购。'],
  ['森莉花', 7, 32, '整理研究资料和实验记录。'],
  ['阿米莉亚安斯华斯', 37, 33, '看看服饰与礼品店。'],
  ['樱井结衣', 36, 33, '放学后在广场与同学交流。'],
  ['伊甸芙宁', 37, 32, '逛游戏相关店铺，处理装备与补给。'],
  ['沐芯兰', 7, 32, '查找机械与人偶制作资料。'],
  ['安琪', 22, 32, '寻找能用于 Villkiss 的设备和能源。'],
  ['美咲绫', 50, 49, '到神社拜访双子、取用茶室所需物品。'],
  ['角楯花凛', 35, 33, '结束清洁工作后用餐、休息。'],
  ['月城遥', 33, 33, '回宿舍活动，留意熟悉的同学。'],
  ['零', 37, 33, '寻找游戏、手办与新周边。'],
  ['桃乃爱', 35, 33, '到餐厅吃甜点。'],
  ['上杉亚衣', 49, 33, '在茶室喝茶、放松。'],
  ['天宫院抚子', 49, 32, '参加茶会，享受讲究的茶点。'],
  ['索亚伊万诺娃', 12, 32, '到武道馆练习格斗。'],
  ['九条凛音', 7, 32, '阅读古典诗集，享受独处。'],
  ['艾格妮丝蔷薇', 49, 32, '在茶室喝红茶。'],
  ['薇丝佩菈', 45, 32, '在空闲社团房间独处、休息。'],
  ['凰天羽', 40, 32, '到后山进行个人修习。'],
  ['赤城朱音', 8, 32, '进行跑步与个人训练。'],
  ['蓝原结衣', 7, 32, '读书，准备辩论资料。'],
  ['橘美玲', 36, 33, '离开店铺，在广场观察潮流与客流。'],
  ['克里奥佩特拉七世', 39, 33, '在竞技场排练舞蹈、准备表演。'],
  ['星野光', 36, 33, '进行街头演出和偶像练习。'],
  ['望月静', 40, 33, '结束图书馆事务后，在后山透气。'],
  ['早坂蕾娜', 33, 33, '回房间准备直播。'],
  ['伊尼亚德瓦卢瓦', 12, 33, '在武道馆练习剑术。'],
  ['娜拉', 35, 32, '去食堂寻找晚饭。'],
  ['小鸟游雏子', 7, 33, '找个安静的位置阅读。'],
  ['猫宫宁宁', 40, 33, '在后山树荫下打盹。'],
  ['犬饲真子', 12, 33, '寻找伙伴一起训练。'],
  ['娜塔莎斯迈尔', 33, 33, '回宿舍打游戏、双排。'],
  ['米莉', 39, 33, '参加啦啦队排练或为比赛应援。'],
  ['铃木惠美', 37, 33, '寻找限时半价便当。'],
  ['山田花子', 41, 33, '在湖边安静休息。'],
  ['佐藤幸子', 37, 33, '逛商业街，顺路看看抽奖活动。'],
  ['风音', 7, 50, '查阅神社、仪式相关的书籍。'],
  ['铃音', 37, 50, '采购神社用品，顺便逛街。'],
  ['梅朵', 39, 32, '回到解说席准备播报与赛事素材。'],
  ['花火', 41, 32, '在湖畔长椅休息。'],
  ['句星兰熙', { region: 'research', place: '园艺社温室' }, 32, '照料花草，泡一壶花茶。'],
  ['伊莉雅', 41, 33, '在安静的湖边整理思绪。'],
  ['辣妹子阳菜', 37, 32, '逛服饰店，看看新流行。'],
  ['夏洛特', 37, 30, '去甜品店看看马卡龙。'],
  ['柳烟霞', 35, 32, '寻找喜欢的小吃。'],
  ['安洁莉卡', 43, 31, '去医院照顾身体，短暂休息。'],
  ['莉莉娜', 37, 31, '到甜品店附近寻找姐姐。'],
  ['莉莉丝', 36, 31, '吃完甜点后在广场散步、认识朋友。'],
  ['希安', 36, 33, '在广场熟悉学园、结识同学。'],
  ['迦南', 34, 34, '回教职工生活区与同事交流。'],
  ['菲奥娜', 39, 30, '观看比赛、练习贵族战法。'],
  ['玛德琳', 35, 30, '借用厨房做料理、寻找试菜伙伴。'],
  ['伊莎贝拉', 41, 30, '在湖边散步，享受安静。'],
  ['阿黛尔', 7, 30, '到偏僻书架旁读小说。'],
  ['玄霜', 37, 30, '到服饰店挑选日常衣物。'],
  ['青鸢', { region: 'research', place: '研究会酒吧' }, 30, '到研究会酒吧找克劳迪娅的熟人聊天。'],
  ['云溪', 6, 30, '观察栽培区植物、记录笔记。'],
  ['贝阿切丝特', 50, 31, '到神社附近安静整理心情。'],
  ['特蕾莎', 13, 31, '到温泉休息、缓解疲劳。'],
  ['玛利亚', 43, 31, '去找安洁莉卡。'],
  ['贝尔芬格', 41, 31, '在湖边远离热闹的人群。'],
  ['梅菲丝', 36, 31, '到广场玩耍、观察来往学生。'],
  ['赛莲', 41, 31, '在湖边散步休息。'],
];

export const campusDailySchedules: Readonly<Record<string, CampusDailySchedule>> = Object.fromEntries(
  routes.map(([name, afterSchool, home, activity, fixed]) => [name, { afterSchool, home, activity, fixed }]),
);

/** Parse the story clock, never the host computer's wall clock. Missing time keeps the daytime preview. */
export function getCampusSchedulePeriod(timeLabel: string): CampusSchedulePeriod {
  const time = timeLabel.match(/(?:^|[^\d])(\d{1,2})\s*[:：]\s*(\d{2})(?!\d)/);
  if (!time) return 'daytime';
  const hour = Number(time[1]);
  const minute = Number(time[2]);
  if (minute > 59 || hour > 24 || (hour === 24 && minute !== 0)) return 'daytime';
  if (hour < 8 || hour === 24) return 'home';
  return hour < 16 ? 'daytime' : 'afterSchool';
}

export function getScheduledCampusVisit(
  person: CampusCharacterHabit,
  daytimeVisit: CampusCharacterVisit,
  period: CampusSchedulePeriod,
): CampusCharacterVisit {
  const schedule = campusDailySchedules[person.name];
  if (!schedule || (period === 'daytime' && !schedule.fixed)) return daytimeVisit;
  // Fixed residents stay at their confirmed home even during the daytime slot.
  const stop = schedule.fixed || period === 'home' ? schedule.home : schedule.afterSchool;
  const location = typeof stop === 'number' ? campusLocations.find(location => location.id === stop) : undefined;
  if (typeof stop === 'number' && !location) return daytimeVisit;
  return {
    region: location
      ? (location.region.id as CampusEncounterRegion)
      : (stop as Exclude<CampusScheduleStop, number>).region,
    place: location?.name ?? (stop as Exclude<CampusScheduleStop, number>).place,
    ids: location ? [location.id] : [],
    // Keep conditional/visiting characters in their existing category: a clock is not a story unlock.
    kind: schedule.fixed ? 'resident' : daytimeVisit.kind === 'conditional' ? 'conditional' : 'regular',
    note: schedule.fixed || period !== 'home' ? schedule.activity : '回到住处休息。',
    inferred: false,
  };
}
