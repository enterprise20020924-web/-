import { MainlineTimeline } from './types';

export interface MainlineTimelineConfig {
  icon: string;
  accentClass: string;
  summary: string;
  start?: { date: string; weekday: number };
  openingPrompt: string;
}

export const MAINLINE_TIMELINE_CONFIG: Record<MainlineTimeline, MainlineTimelineConfig> = {
  [MainlineTimeline.NONE]: {
    icon: 'fa-school',
    accentClass: 'border-sky-400/35 bg-sky-400/10 text-sky-200',
    summary:
      '从 2025 年 3 月 17 日的入学日开始。玩家先经历分班、熟悉校规与校园势力、建立最初的人际关系；大型事件会按时间控制器的顺序逐步开放。',
    openingPrompt:
      '当前主线时间线：入学线，日期应处于 2025 年 3 月 17 日之后的入学初期。请从新生报到、分班、熟悉天海学园校规与校园势力、初识同学或老师开始叙事；玩家尚未参与任何大型主线活动。必须按世界书的时间控制器自然推进：先是第 2 周的“天海学园偶像总选举·欲望之星”，再到第 4 周运动会、第 6 周学院祭、第 8 周期中考核与第 9 周夏日旅行。不得预支、跳过或默认玩家已经完成后续事件。',
  },
  [MainlineTimeline.IDOL]: {
    icon: 'fa-music',
    accentClass: 'border-pink-400/35 bg-pink-400/10 text-pink-200',
    summary:
      '第 2 周“天海学园偶像总选举·欲望之星”前两天。学生会即将开放报名，玩家可准备以候选人身份登台，或作为经纪人与一位候选人结成搭档，面对训练、拉票、评审与暗中破坏。',
    start: { date: '2025-03-24', weekday: 1 },
    openingPrompt:
      '当前主线时间线：偶像线。当前日期为 2025 年 3 月 24 日，正处于第 2 周“天海学园偶像总选举·欲望之星”正式公告前两天；此时只应出现报名预告、候选人筹备、粉丝与势力的暗中布局，不得直接跳入训练日、预选赛、半决赛或总决赛。请自然把开局引向学生会在中央广场公布选举、报名与组队的契机。玩家可选择女性候选人路线，或作为经纪人为 NPC 制定训练、拉票和防破坏策略；候选人包括星野光、雪莉·克里姆希尔德、早坂蕾娜、娜塔莎等。以世界书阶段条目为准逐日推进，勿回退重演入学期，也不要提前进入运动会、学院祭、期中考试或夏日旅行。',
  },
  [MainlineTimeline.SPORTS]: {
    icon: 'fa-running',
    accentClass: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200',
    summary:
      '第 4 周“天海性斗运动会”前两天。欲望竞技场即将举办开幕式与自由招募，红焰、苍岚、紫电三队的阵营角力已开始升温；玩家需要决定站队、招募与战前策略。',
    start: { date: '2025-04-08', weekday: 2 },
    openingPrompt:
      '当前主线时间线：运动会线。当前日期为 2025 年 4 月 8 日，正处于第 4 周“天海性斗运动会”开幕前两天。欲望竞技场尚未进入正式比赛日；开局应呈现三队招募、队员磨合、情报交换和战前策略，而非直接宣告比赛结果。请自然把剧情导向周四的开幕式、三军分阵与自由招募；红焰、苍岚、紫电三队之间的博弈是当前核心。随后依世界书阶段安排推进个人赛、团体赛与三军大决战。不得回退重演入学或偶像线，不得提前进入学院祭、期中考试或夏日旅行。',
  },
  [MainlineTimeline.FESTIVAL]: {
    icon: 'fa-masks-theater',
    accentClass: 'border-violet-400/35 bg-violet-400/10 text-violet-200',
    summary:
      '第 6 周“天海学园祭·淫靡嘉年华”前两天。全校正搭建摊位，同时四所外校的交流访问团即将抵达；自由探索校园祭活动与接待、调查外校来客的叙事任务将并行展开。',
    start: { date: '2025-04-21', weekday: 1 },
    openingPrompt:
      '当前主线时间线：学院祭线。当前日期为 2025 年 4 月 21 日，正处于第 6 周“天海学园祭·淫靡嘉年华”准备日前两天。开局应呈现全校停课搭建摊位、各势力准备活动，以及四所外校访问团将以文化交流名义抵达的氛围；不要直接跳到校园祭开放日或五校对决。请把玩家自然引向准备日的摊位协助、情报侦察、外宾接待或地下联盟的 VIP 邀请。正式开放后，校园祭自由探索轴与外校角色叙事轴并行推进，外校角色会影响最终的五校对决。不得回退重演此前主线，也不要提前进入期中考试或夏日旅行。',
  },
  [MainlineTimeline.MIDTERM]: {
    icon: 'fa-book-open',
    accentClass: 'border-amber-400/35 bg-amber-400/10 text-amber-200',
    summary:
      '第 8 周“期中考核·命运的四日间”前两天。第七教学楼与欲望竞技场将进行连续四日筛选，胜负会影响班级分配、声望与后续命运；地下联盟的赌盘也会随考核开放。',
    start: { date: '2025-05-03', weekday: 6 },
    openingPrompt:
      '当前主线时间线：期中考试线。当前日期为 2025 年 5 月 3 日，正处于第 8 周“期中考核·命运的四日间”开始前两天。开局必须从考前公告、备战、同学间的压力与资源筹备开始，不得直接跳到任何一天的赛程、班级分配或首席决赛结果。请将当前重心放在即将于第七教学楼和欲望竞技场展开的四日连续考核：胜负会影响班级分配与声望，第二日至第四日地下联盟赌盘会开放，连续失利还会带来惩罚风险。依世界书的每日阶段推进，不得回退此前主线，也不得提前进入夏日旅行。',
  },
  [MainlineTimeline.SUMMER]: {
    icon: 'fa-umbrella-beach',
    accentClass: 'border-orange-400/35 bg-orange-400/10 text-orange-200',
    summary:
      '第 9 周“碧波假日·七日物语”前两天。考核结束后的全校休学旅行即将出发，首两日以海滩度假与竞技为主，随后会前往潮音岛、太阳部落与龙宫海渊殿，展开探索、交涉与试炼。',
    start: { date: '2025-05-10', weekday: 6 },
    openingPrompt:
      '当前主线时间线：夏日休学旅行线。当前日期为 2025 年 5 月 10 日，正处于第 9 周“碧波假日·七日物语”出发前两天。开局应从旅行通知、行李准备、同伴邀约、集合分组或对北部海滩行程的期待开始，不得直接让玩家抵达潮音岛、遭遇海洋魔物娘、进入龙宫或获得旅行结局。请依七日安排推进：Day 1-2 为学院海滩与水上竞技，Day 3 才登潮音岛并接触太阳部落的真白凪沙，Day 4 才出现深海遭遇与庄方宜，之后才进入龙宫交涉、秘境试炼和告别派对。不得回退重演此前主线。',
  },
};

export function getMainlineTimelineUpdates(timeline: MainlineTimeline): Record<string, string | number> {
  const start = MAINLINE_TIMELINE_CONFIG[timeline].start;
  if (!start) return {};

  return {
    '时间系统.日期': start.date,
    '时间系统.星期': start.weekday,
  };
}
