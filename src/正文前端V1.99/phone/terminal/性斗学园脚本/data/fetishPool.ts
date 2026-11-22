type BonusKey =
  | '魅力加成'
  | '幸运加成'
  | '基础性斗力加成'
  | '基础性斗力成算'
  | '基础忍耐力加成'
  | '基础忍耐力成算'
  | '闪避率加成'
  | '暴击率加成';

export type FetishAlignment = 'M' | 'S' | 'Switch';

export interface FetishEntry {
  name: string;
  alignment: FetishAlignment;
  description: string;
  bonuses: Partial<Record<BonusKey, number>>;
}

export const grandWheelFetishPool: FetishEntry[] = [
  {
    name: '足控气味依赖',
    alignment: 'M',
    description: '对足部与体味刺激存在明显依赖，顺从状态下兴奋阈值更低。',
    bonuses: { 基础性斗力成算: 20, 基础忍耐力成算: -10 },
  },
  {
    name: '束缚兴奋成瘾',
    alignment: 'M',
    description: '被束缚时进入高敏反应，越被限制越容易进入状态。',
    bonuses: { 基础忍耐力成算: 12, 基础性斗力成算: 8, 幸运加成: 6 },
  },
  {
    name: '露出快感依赖',
    alignment: 'Switch',
    description: '在暴露与被注视时获得兴奋增幅，战斗节奏更激进。',
    bonuses: { 魅力加成: 18, 基础忍耐力加成: -8, 基础性斗力成算: 10 },
  },
  {
    name: '体液收集癖',
    alignment: 'S',
    description: '对掌控与收集过程有强烈欲望，攻击侵略性显著提高。',
    bonuses: { 基础性斗力加成: 24, 幸运加成: 10, 基础忍耐力成算: -6 },
  },
  {
    name: '袜子收集癖',
    alignment: 'Switch',
    description: '对私密贴身物品存在执念，回避动作和魅力表现同步增强。',
    bonuses: { 魅力加成: 14, 闪避率加成: 9, 基础忍耐力成算: -4 },
  },
  {
    name: '耳语服从倾向',
    alignment: 'M',
    description: '对命令语气高度敏感，受到引导时能迅速进入服从状态。',
    bonuses: { 幸运加成: 16, 暴击率加成: 8, 基础忍耐力加成: -6 },
  },
  {
    name: '舔舐反应强化',
    alignment: 'M',
    description: '触碰与舔舐刺激会直接触发神经兴奋，输出与破防能力提升。',
    bonuses: { 基础性斗力成算: 11, 基础忍耐力成算: -7, 魅力加成: 9 },
  },
  {
    name: '乳贴束缚依赖',
    alignment: 'M',
    description: '局部束缚会强化专注，承受压力时仍能保持进攻欲。',
    bonuses: { 基础忍耐力成算: 14, 基础性斗力加成: 16, 幸运加成: -3 },
  },
  {
    name: '项圈归属倾向',
    alignment: 'M',
    description: '拥有明显归属需求，佩戴束缚类标识时战意会被放大。',
    bonuses: { 基础性斗力成算: 13, 魅力加成: 12, 基础忍耐力成算: -8 },
  },
  {
    name: '尾巴玩弄癖',
    alignment: 'Switch',
    description: '偏好持续逗弄类刺激，节奏控制能力提升。',
    bonuses: { 幸运加成: 12, 暴击率加成: 10, 基础性斗力加成: 14 },
  },
  {
    name: '口塞沉迷',
    alignment: 'M',
    description: '语言受限反而诱发更强兴奋，耐受与爆发并存。',
    bonuses: { 基础忍耐力成算: 16, 基础性斗力成算: 6, 魅力加成: -5 },
  },
  {
    name: '脚趾崇拜倾向',
    alignment: 'M',
    description: '对细节部位高度着迷，短时爆发力上升但稳定性下降。',
    bonuses: { 基础性斗力成算: 17, 闪避率加成: 7, 基础忍耐力成算: -11 },
  },
  {
    name: '制服污损执念',
    alignment: 'S',
    description: '破坏整洁秩序会带来支配愉悦，魅力压迫感大幅上升。',
    bonuses: { 魅力加成: 22, 幸运加成: 8, 基础忍耐力加成: -12 },
  },
  {
    name: '命令回应体质',
    alignment: 'S',
    description: '发出指令时获得额外专注，压制能力更强。',
    bonuses: { 基础性斗力加成: 20, 基础忍耐力成算: 9, 幸运加成: -6 },
  },
  {
    name: '高跟踩踏幻想',
    alignment: 'S',
    description: '偏好踩踏支配姿态，暴击与压制效率明显提高。',
    bonuses: { 基础性斗力成算: 12, 暴击率加成: 11, 基础忍耐力加成: -10 },
  },
  {
    name: '温差刺激依赖',
    alignment: 'Switch',
    description: '冷暖交替刺激可显著激活快感回路，临场变数变高。',
    bonuses: { 幸运加成: 14, 基础忍耐力成算: -9, 魅力加成: 10 },
  },
  {
    name: '汗液嗅觉沉溺',
    alignment: 'M',
    description: '对汗味刺激有明显沉迷，近身对抗时战意高涨。',
    bonuses: { 基础性斗力加成: 26, 基础性斗力成算: 7, 基础忍耐力成算: -12 },
  },
  {
    name: '观众注目成瘾',
    alignment: 'Switch',
    description: '被围观时兴奋阈值下降，表现欲与张力同步提升。',
    bonuses: { 魅力加成: 24, 幸运加成: 12, 基础忍耐力成算: -10 },
  },
  {
    name: '轻拍高潮反射',
    alignment: 'M',
    description: '对节律性拍击反应敏锐，爆发窗口更容易触发。',
    bonuses: { 基础性斗力成算: 14, 暴击率加成: 12, 基础忍耐力加成: -8 },
  },
  {
    name: '湿热束缚迷恋',
    alignment: 'M',
    description: '在闷热束缚环境中更容易进入沉浸状态。',
    bonuses: { 基础忍耐力成算: 18, 魅力加成: 8, 幸运加成: -4 },
  },
  {
    name: '绳缚奉纳体质',
    alignment: 'M',
    description: '复杂绳缚会带来献祭感，服从时触发额外战斗冲动。',
    bonuses: { 基础忍耐力成算: 15, 基础性斗力加成: 18, 幸运加成: -5 },
  },
  {
    name: '皮革拘束依恋',
    alignment: 'M',
    description: '对皮革拘束触感上瘾，长期压迫下反而更兴奋。',
    bonuses: { 基础忍耐力加成: 14, 基础性斗力成算: 9, 魅力加成: 8 },
  },
  {
    name: '惩戒期待综合征',
    alignment: 'M',
    description: '对惩戒过程存在期待，面对压制时战斗韧性增强。',
    bonuses: { 基础忍耐力成算: 20, 基础性斗力成算: 6, 幸运加成: -6 },
  },
  {
    name: '服从口令反射',
    alignment: 'M',
    description: '听到明确口令会迅速进入执行状态，动作更果断。',
    bonuses: { 闪避率加成: 10, 基础性斗力加成: 12, 魅力加成: 7 },
  },
  {
    name: '失控羞耻快感',
    alignment: 'M',
    description: '失控与羞耻并存时快感急剧上升，风险与收益同高。',
    bonuses: { 魅力加成: 16, 基础性斗力成算: 11, 基础忍耐力成算: -9 },
  },
  {
    name: '低温蜡烛试炼癖',
    alignment: 'M',
    description: '能将蜡烛温差转化为兴奋，短回合内更容易打出压制。',
    bonuses: { 基础性斗力加成: 15, 暴击率加成: 10, 基础忍耐力加成: -9 },
  },
  {
    name: '耳夹束缚依赖',
    alignment: 'M',
    description: '局部拉扯与束缚会触发专注，回避反应更灵敏。',
    bonuses: { 闪避率加成: 11, 幸运加成: 8, 基础忍耐力成算: -7 },
  },
  {
    name: '上贡癖',
    alignment: 'M',
    description: '对供奉与献上行为有明显依赖，进入服从状态后更容易维持兴奋。',
    bonuses: { 基础忍耐力成算: 13, 基础性斗力加成: 10, 幸运加成: -4 },
  },
  {
    name: '体液沉迷',
    alignment: 'M',
    description: '对体液相关刺激存在持续沉迷，近身缠斗时输出欲望显著提升。',
    bonuses: { 基础性斗力加成: 18, 基础性斗力成算: 8, 基础忍耐力成算: -9 },
  },
  {
    name: '主导链条偏好',
    alignment: 'S',
    description: '偏好利用链条建立支配秩序，压制与威慑同步增强。',
    bonuses: { 基础性斗力加成: 24, 魅力加成: 12, 幸运加成: -4 },
  },
  {
    name: '命令口吻成瘾',
    alignment: 'S',
    description: '使用命令语气会显著提升主导感，技能命中更稳定。',
    bonuses: { 基础性斗力成算: 15, 暴击率加成: 11, 幸运加成: 6 },
  },
  {
    name: '鞭痕美学偏爱',
    alignment: 'S',
    description: '痕迹与秩序感带来愉悦，持续压制能力显著强化。',
    bonuses: { 基础性斗力加成: 22, 基础性斗力成算: 8, 魅力加成: 10 },
  },
  {
    name: '拘束调度本能',
    alignment: 'S',
    description: '擅长安排对手行动空间，节奏掌控和压迫更强。',
    bonuses: { 闪避率加成: 9, 暴击率加成: 9, 基础性斗力加成: 16 },
  },
  {
    name: '女王踩踏仪式感',
    alignment: 'S',
    description: '对仪式化支配动作有强烈偏好，魅力压制力暴涨。',
    bonuses: { 魅力加成: 26, 基础性斗力成算: 10, 基础忍耐力加成: -8 },
  },
  {
    name: '冷酷训诫人格',
    alignment: 'S',
    description: '越冷静越能体现支配力，战斗中更容易打出致命节奏。',
    bonuses: { 暴击率加成: 13, 基础性斗力加成: 18, 幸运加成: 8 },
  },
  {
    name: '羞辱台词收藏癖',
    alignment: 'S',
    description: '对语言支配与羞辱剧本有执念，魅力压迫与控制力并进。',
    bonuses: { 魅力加成: 20, 幸运加成: 10, 基础性斗力成算: 8 },
  },
  {
    name: '高压调教流程控',
    alignment: 'S',
    description: '偏好高压且可重复的调教流程，持续回合输出更稳定。',
    bonuses: { 基础性斗力加成: 20, 基础忍耐力成算: 10, 暴击率加成: 8 },
  },
  {
    name: '规训施压综合征',
    alignment: 'S',
    description: '通过制定规则获取快感，压制与收益效率同步提升。',
    bonuses: { 基础性斗力成算: 16, 魅力加成: 14, 幸运加成: -5 },
  },
  {
    name: '金属束具收藏癖',
    alignment: 'S',
    description: '对金属束具拥有收集和使用执念，主导姿态更具威慑。',
    bonuses: { 基础性斗力加成: 19, 闪避率加成: 8, 基础忍耐力成算: 8 },
  },
  {
    name: '双向调教开关',
    alignment: 'Switch',
    description: '可在支配与服从之间切换，适应不同节奏对局。',
    bonuses: { 幸运加成: 16, 魅力加成: 12, 暴击率加成: 8 },
  },
  {
    name: '主从契约迷恋',
    alignment: 'Switch',
    description: '对主从关系结构高度沉浸，能根据局势切换心态。',
    bonuses: { 基础性斗力加成: 14, 基础忍耐力加成: 14, 幸运加成: 9 },
  },
  {
    name: '拘束舞台表现欲',
    alignment: 'Switch',
    description: '在舞台化拘束场景中表现欲与掌控欲同时增强。',
    bonuses: { 魅力加成: 18, 基础性斗力成算: 9, 闪避率加成: 8 },
  },
  {
    name: '反制挑衅兴奋',
    alignment: 'Switch',
    description: '受到挑衅时会进入反制快感循环，爆发窗口更宽。',
    bonuses: { 暴击率加成: 12, 幸运加成: 10, 基础忍耐力成算: -6 },
  },
  {
    name: '寸止',
    alignment: 'Switch',
    description: '对临界停顿与节奏拉扯高度敏感，能在压抑与爆发之间迅速切换。',
    bonuses: { 暴击率加成: 10, 基础性斗力成算: 9, 基础忍耐力成算: -8 },
  },
  {
    name: '失衡边缘依赖',
    alignment: 'Switch',
    description: '越接近失衡边缘越兴奋，输出上限提高但风险加剧。',
    bonuses: { 基础性斗力成算: 14, 基础忍耐力成算: -10, 魅力加成: 11 },
  },
];
