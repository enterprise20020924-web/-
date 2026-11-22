import { getActivatedCheatCodes, saveActivatedCheatCodes } from './localPreferences';
import { getLatestMvuData, grantMoneyWithUpdates } from './mvuStore';
import { MOONCAKE_PERMANENT_EFFECTS, type PermanentConsumableEffect } from './permanentConsumables';
import { createLegendaryEquipmentMvuData, LEGENDARY_EQUIPMENTS } from './legendaryEquipment';

type CheatUpdate = Record<string, any>;

export interface CheatCodeResult {
  ok: boolean;
  code: string;
  title: string;
  message: string;
  reason?: 'invalid' | 'duplicate' | 'unavailable' | 'failed';
}

interface EquipmentOptions {
  level: string;
  description: string;
  stats: Partial<
    Record<
      | '魅力加成'
      | '幸运加成'
      | '基础性斗力加成'
      | '基础性斗力成算'
      | '基础忍耐力加成'
      | '基础忍耐力成算'
      | '闪避率加成'
      | '暴击率加成',
      number
    >
  >;
  slot: string;
}

const equipment = (options: EquipmentOptions) => ({
  类型: '装备',
  等级: options.level,
  描述: options.description,
  加成属性: {
    魅力加成: 0,
    幸运加成: 0,
    基础性斗力加成: 0,
    基础性斗力成算: 0,
    基础忍耐力加成: 0,
    基础忍耐力成算: 0,
    闪避率加成: 0,
    暴击率加成: 0,
    ...options.stats,
  },
  部位: options.slot,
  数量: 1,
});

const equippedEquipment = (name: string, options: EquipmentOptions) => ({
  名称: name,
  等级: options.level,
  描述: options.description,
  加成属性: {
    魅力加成: 0,
    幸运加成: 0,
    基础性斗力加成: 0,
    基础性斗力成算: 0,
    基础忍耐力加成: 0,
    基础忍耐力成算: 0,
    闪避率加成: 0,
    暴击率加成: 0,
    ...options.stats,
  },
});

const permanentConsumable = (options: { level: string; description: string; effect: PermanentConsumableEffect }) => {
  const item: Record<string, any> = {
    类型: '消耗品',
    等级: options.level,
    描述: options.description,
    战斗用品: false,
    数量: 1,
  };
  if (options.effect.永久属性 && Object.keys(options.effect.永久属性).length > 0) {
    item.永久属性 = { ...options.effect.永久属性 };
  }
  if (options.effect.永久加成 && Object.keys(options.effect.永久加成).length > 0) {
    item.永久加成 = { ...options.effect.永久加成 };
  }
  if (options.effect.潜力提升) {
    item.潜力提升 = options.effect.潜力提升;
  }
  return item;
};

const mooncake = (name: string, level: 'A' | 'S', description: string) =>
  permanentConsumable({
    level,
    description,
    effect: MOONCAKE_PERMANENT_EFFECTS[name],
  });

const anniversaryCake = (description: string, bonus?: EquipmentOptions['stats'], staminaRestore?: number) => ({
  类型: '消耗品',
  等级: 'C',
  描述: description,
  战斗用品: true,
  数量: 2,
  ...(bonus ? { 加成属性: bonus } : {}),
  ...(staminaRestore ? { 耐力增加: staminaRestore } : {}),
});

const CHEAT_CODE_UPDATES: Record<string, CheatUpdate> = {
  XDO1YEAR: {
    '物品系统.背包.堕落修女的圣水瓶': createLegendaryEquipmentMvuData(LEGENDARY_EQUIPMENTS.fallenNunHolyWater),
    '物品系统.背包.草莓奶油小蛋糕': anniversaryCake('魅力+5，持续3回合。', { 魅力加成: 5 }),
    '物品系统.背包.巧克力脆片小蛋糕': anniversaryCake('基础性斗力+5，持续3回合。', { 基础性斗力加成: 5 }),
    '物品系统.背包.蓝莓酸奶小蛋糕': anniversaryCake('基础忍耐力+5，持续3回合。', { 基础忍耐力加成: 5 }),
    '物品系统.背包.柠檬糖霜小蛋糕': anniversaryCake('闪避率+3，持续3回合。', { 闪避率加成: 3 }),
    '物品系统.背包.樱桃夹心小蛋糕': anniversaryCake('暴击率+3，持续3回合。', { 暴击率加成: 3 }),
    '物品系统.背包.抹茶红豆小蛋糕': anniversaryCake('战斗中恢复8点耐力。', undefined, 8),
    '物品系统.背包.幸运抽奖券': {
      类型: '其他',
      等级: 'A',
      描述: '可用于商店大转盘抽奖',
      数量: 3,
    },
  },
  SPONSORBLADE: {
    '物品系统.背包.笑里藏·刀': createLegendaryEquipmentMvuData(LEGENDARY_EQUIPMENTS.smilingBlade),
  },
  SPONSORSTAR: {
    '物品系统.背包.不陨之星': createLegendaryEquipmentMvuData(LEGENDARY_EQUIPMENTS.undyingStar),
  },
  SNOW: {
    '物品系统.背包.纯黑丝绒长围巾': equipment({
      level: 'A',
      description:
        '那种"可远观而不可亵玩"的气质。因为太高冷，敌人的攻击似乎都因为自惭形秽而无法命中，同时也散发着致命的成熟魅力',
      stats: { 魅力加成: 10, 闪避率加成: 10 },
      slot: '饰品',
    }),
  },
  PROTECT: {
    '物品系统.背包.袖子过长的宽大卫衣': equipment({
      level: 'B',
      description:
        '激发所有人的保护欲。虽然本体很脆弱，但总能因为奇迹般的运气（幸运）躲过灾难，或者让敌人不忍心下重手。',
      stats: { 幸运加成: 10 },
      slot: '副装备',
    }),
  },
  ENERGY: {
    '物品系统.背包.荧光色运动护腕': equipment({
      level: 'A',
      description: '永远停不下来，充满朝气。比起防御，更相信速度和汗水。',
      stats: { 暴击率加成: 10 },
      slot: '饰品',
    }),
  },
  SILENCE: {
    '物品系统.背包.挂颈式头戴耳机': equipment({
      level: 'B',
      description: '只要戴上耳机，世界就与我无关。极低的存在感让他很容易躲开麻烦（闪避），但也因此变得很难交到朋友。',
      stats: { 魅力加成: -5, 闪避率加成: 15 },
      slot: '饰品',
    }),
  },
  QUEEN: {
    '物品系统.背包.精致的手工缎带': equipment({
      level: 'S',
      description: '举手投足间都是金钱的味道。在校园里，魅力就是她的通行证，没人能拒绝她的请求。',
      stats: { 魅力加成: 10 },
      slot: '饰品',
    }),
  },
  UNKNOWN: {
    '物品系统.背包.黑猫造型的小挎包': equipment({
      level: 'A',
      description: '充满不确定性。没人知道他到底擅长什么，但也可能在关键时刻爆发出惊人的力量。',
      stats: {
        魅力加成: 1,
        幸运加成: 1,
        基础性斗力加成: 1,
        基础忍耐力加成: 1,
        闪避率加成: 1,
        暴击率加成: 1,
      },
      slot: '特殊装备',
    }),
  },
  HOT: {
    '物品系统.背包.五彩渐变美甲': equipment({
      level: 'B',
      description: '虽然看起来爱玩，但吐槽和扇巴掌的力度绝对是校园顶级的。',
      stats: { 魅力加成: 5, 暴击率加成: 5 },
      slot: '饰品',
    }),
  },
  LOVESICK: {
    '物品系统.背包.藏在袖子里的美工刀': equipment({
      level: 'S',
      description: '只要是为了心中所爱（或者执念），可以不计代价毁灭一切。',
      stats: { 基础性斗力成算: 20, 基础忍耐力成算: -20 },
      slot: '主装备',
    }),
  },
  NERD: {
    '物品系统.背包.厚重黑框眼镜': equipment({
      level: 'A',
      description: '知识就是力量！虽然看起来很弱，但总能因为各种奇怪的冷知识而化险为夷。',
      stats: { 魅力加成: -8, 幸运加成: 15, 暴击率加成: 8 },
      slot: '饰品',
    }),
  },
  DEVIL: {
    '物品系统.背包.小恶魔翅膀发夹': equipment({
      level: 'S',
      description: '小小的恶魔，大大的坏心思。总喜欢捉弄别人，但往往会被反捉弄。',
      stats: { 魅力加成: 12, 幸运加成: -5, 基础性斗力成算: 8 },
      slot: '饰品',
    }),
  },
  AIRHEAD: {
    '物品系统.背包.草莓味棒棒糖': equipment({
      level: 'B',
      description: '甜甜的糖果让人放松警惕，虽然脑子不太好使，但身材确实一级棒。',
      stats: { 魅力加成: 15, 幸运加成: 5, 基础性斗力成算: -10 },
      slot: '饰品',
    }),
  },
  SUCCUBUS: {
    '物品系统.背包.魅魔之尾': equipment({
      level: 'SS',
      description: '魅魔的象征，能够吸取他人的精力转化为自己的力量。但也会让周围的人产生奇怪的欲望。',
      stats: { 魅力加成: 20, 幸运加成: -10, 基础性斗力成算: 10, 基础忍耐力成算: -15, 暴击率加成: 5 },
      slot: '特殊装备',
    }),
  },
  CHAOS: {
    '物品系统.背包.不可名状触手': equipment({
      level: 'SS',
      description: '来自深渊的触手，完全不可预测。有时候会帮你，有时候会害你，全看心情。',
      stats: { 魅力加成: -20, 基础性斗力成算: 15, 基础忍耐力成算: 15 },
      slot: '特殊装备',
    }),
  },
  DOLL: {
    '物品系统.背包.人偶专用保养油': equipment({
      level: 'A',
      description: '让人偶的皮肤更加光滑细腻，痛觉进一步迟钝。但也会让感情变得更加淡漠。',
      stats: { 魅力加成: 10, 基础性斗力成算: -15, 基础忍耐力成算: 20 },
      slot: '副装备',
    }),
  },
  BEAST: {
    '物品系统.背包.兽耳发箍': equipment({
      level: 'A',
      description: '让兽化人的感官更加敏锐，反应速度更快。但也会让本能变得更难控制。',
      stats: {
        魅力加成: 5,
        幸运加成: 8,
        基础性斗力成算: 10,
        基础忍耐力成算: 5,
        闪避率加成: 15,
      },
      slot: '饰品',
    }),
  },
  CYBER: {
    '物品系统.背包.机械手臂': equipment({
      level: 'S',
      description: '高度精密的机械义肢，内置多种功能。但会让身体的一部分变得更加冰冷。',
      stats: { 魅力加成: -10, 幸运加成: -5, 基础性斗力成算: 15, 基础忍耐力成算: 20, 暴击率加成: 10 },
      slot: '主装备',
    }),
  },
  PRINCESS: {
    '物品系统.背包.蕾丝阳伞': equipment({
      level: 'A',
      description: '公主的象征，优雅而高贵。虽然看起来很脆弱，但总有人会保护她。',
      stats: { 魅力加成: 8, 幸运加成: 12, 基础性斗力成算: -10 },
      slot: '副装备',
    }),
  },
  DELINQUENT: {
    '物品系统.背包.不良少年头巾': equipment({
      level: 'B',
      description: '看起来很不好惹，但其实内心很善良。总在关键时刻保护弱小。',
      stats: { 魅力加成: -5, 幸运加成: 5, 基础性斗力成算: 10, 基础忍耐力成算: 5 },
      slot: '饰品',
    }),
  },
  SHY: {
    '物品系统.背包.遮脸刘海': equipment({
      level: 'C',
      description: '因为害羞而遮住脸，但这样反而让人更加在意。意外地很会躲藏。',
      stats: { 魅力加成: 3, 闪避率加成: 10 },
      slot: '饰品',
    }),
  },
  MIDAUTUMN8888: {
    '物品系统.背包.五仁月饼': mooncake('五仁月饼', 'A', '坚果与果仁的香气层层叠起，咀嚼后让身体更有进攻节奏。'),
    '物品系统.背包.红豆沙月饼': mooncake('红豆沙月饼', 'A', '细腻的红豆沙带来安定感，让意志更能抵御快感冲击。'),
    '物品系统.背包.蛋黄莲蓉月饼': mooncake('蛋黄莲蓉月饼', 'A', '咸甜交织的馅心像月光一样醇厚，举手投足都更有吸引力。'),
    '物品系统.背包.纯莲蓉月饼': mooncake('纯莲蓉月饼', 'A', '清雅莲香让思绪变得通透，关键时刻更容易抓住机会。'),
    '物品系统.背包.奶黄流心月饼': mooncake('奶黄流心月饼', 'A', '流心馅料在舌尖爆开，短暂的满足化成持续的进攻底气。'),
    '物品系统.背包.栗蓉月饼': mooncake('栗蓉月饼', 'A', '栗香温暖厚重，像一层可靠的护甲沉入身体。'),
    '物品系统.背包.黑芝麻月饼': mooncake('黑芝麻月饼', 'A', '浓郁芝麻香让感官更加锐利，出手时更容易找到破绽。'),
    '物品系统.背包.紫薯月饼': mooncake('紫薯月饼', 'A', '紫薯的甜香让身法变得轻盈，也带来一点意外的好运。'),
    '物品系统.背包.椰蓉月饼': mooncake('椰蓉月饼', 'A', '椰香柔软却不失韧性，外表亲和，内里保持着稳定节奏。'),
    '物品系统.背包.桂花酒酿月饼': mooncake(
      '桂花酒酿月饼',
      'A',
      '桂花与酒酿的微醺香气唤醒潜能，身体仿佛更接近下一次突破。',
    ),
    '物品系统.背包.云腿月饼': mooncake('云腿月饼', 'A', '咸香火腿与酥皮的层次感带来扎实的力量和耐受性。'),
    '物品系统.背包.玫瑰鲜花月饼': mooncake(
      '玫瑰鲜花月饼',
      'A',
      '花瓣香气缠绕在唇齿之间，让气质与临场判断一起变得明亮。',
    ),
    '物品系统.背包.冰皮月饼': mooncake('冰皮月饼', 'S', '冰凉柔软的外皮贴合舌尖，清醒的月色让身法与气质同时升华。'),
    '物品系统.背包.冰淇淋月饼': mooncake(
      '冰淇淋月饼',
      'S',
      '冰淇淋馅料在口中缓慢融化，甜美刺激化作难以忽视的爆发潜能。',
    ),
  },
  MOONRABBITGALA: {
    '物品系统.背包.月亮玉佩': equipment({
      level: 'A',
      description: '玉佩贴在锁骨下方，走动时在胸口轻轻摩擦；月光下，佩戴者的身体曲线格外显眼。',
      stats: { 魅力加成: 8, 幸运加成: 8 },
      slot: '饰品',
    }),
    '物品系统.背包.玉兔兔女郎服': equipment({
      level: 'A',
      description: '兔耳、领结与高开衩剪裁让腰臀几乎无法隐藏，白花花的大腿裸露在外，在战斗中本身就是一种挑衅。',
      stats: { 魅力加成: 12, 闪避率加成: 8 },
      slot: '副装备',
    }),
    '物品系统.背包.银月按摩棒': equipment({
      level: 'A',
      description: '强力版按摩棒，没什么好说的，就是功率大。',
      stats: { 基础性斗力加成: 18, 暴击率加成: 8, 基础忍耐力加成: -6 },
      slot: '饰品',
    }),
    '物品系统.背包.嫦娥仙子服': equipment({
      level: 'S',
      description: '薄纱层层遮掩，却故意露出腰腹和腿根，隐隐能看到乳头；越是被注视，越能维持从容姿态。',
      stats: { 魅力加成: 18, 幸运加成: 8, 基础忍耐力成算: 8 },
      slot: '主装备',
    }),
    '物品系统.背包.月啸银狼内裤': equipment({
      level: 'S',
      description: '银狼纹路贴合臀胯，狼尾装饰在动作中不断摩擦，危险感与淫靡感同时增强。',
      stats: { 基础性斗力成算: 12, 基础忍耐力成算: 12, 闪避率加成: 5 },
      slot: '副装备',
    }),
    '物品系统.背包.玉兔绒尾': equipment({
      level: 'A',
      description: '柔软绒尾固定在后穴，尾根随着扭腰轻颤带动身体反应，越紧张越容易暴露。',
      stats: { 魅力加成: 10, 闪避率加成: 10, 基础忍耐力成算: -5 },
      slot: '饰品',
    }),
    '物品系统.背包.桂影铃铛项圈': equipment({
      level: 'A',
      description: '铃声会暴露呼吸和颤抖，佩戴者很难隐藏自己的状态，适合支配与被支配主题。',
      stats: { 魅力加成: 8, 幸运加成: 12, 基础忍耐力成算: -4 },
      slot: '饰品',
    }),
    '物品系统.背包.兔耳情趣发箍': equipment({
      level: 'A',
      description: '兔耳会随喘息和快感抖动，表情越是失控，外观越能刺激对手。',
      stats: { 魅力加成: 14, 暴击率加成: 6, 基础忍耐力成算: -5 },
      slot: '饰品',
    }),
    '物品系统.背包.广寒宫锁情腰链': equipment({
      level: 'S',
      description: '银链绕过腰腹与胯骨，扣环可以调紧；被逼入近身距离时，束缚感会转化成攻击欲。',
      stats: { 基础性斗力加成: 15, 基础性斗力成算: 8, 闪避率加成: -8 },
      slot: '特殊装备',
    }),
    '物品系统.背包.月华乳环': equipment({
      level: 'S',
      description: '月华材质贴合敏感部位，战斗中的衣料摩擦会持续放大刺激，让每次反击都带着明显欲望。',
      stats: { 魅力加成: 15, 暴击率加成: 10, 基础性斗力成算: 6, 基础忍耐力成算: -8 },
      slot: '饰品',
    }),
  },
  '0210': {
    '物品系统.背包.作弊者之证': {
      类型: '装备',
      等级: 'SS',
      描述: '作弊模式专属装备，全属性大幅提升',
      加成属性: {
        魅力加成: 999,
        幸运加成: 999,
        基础性斗力加成: 999,
        基础性斗力成算: 0,
        基础忍耐力加成: 999,
        基础忍耐力成算: 0,
        闪避率加成: 999,
        暴击率加成: 999,
      },
      部位: '特殊装备',
      数量: 1,
    },
  },
  '1011': {
    '物品系统._装备栏.主装备': equippedEquipment('草莓奶油洋伞', {
      level: 'S',
      description: '蕾丝花边的遮阳伞，伞尖是草莓形状，伞骨轻盈',
      stats: { 暴击率加成: 10 },
      slot: '主装备',
    }),
    '物品系统._装备栏.副装备': equippedEquipment('「草莓奶芙」层叠蕾丝蓬蓬裙', {
      level: 'S',
      description:
        '采用大量轻盈的多层欧根纱和丝缎编织而成的裙子，裙摆像盛开的花朵一样蓬起。腰间系有一个巨大的蝴蝶结，背后有类似小翅膀的装饰',
      stats: { 闪避率加成: 10 },
      slot: '副装备',
    }),
    '物品系统._装备栏.饰品1': equippedEquipment('摇晃的猫耳发箍', {
      level: 'A',
      description: '发箍上的猫耳朵会随着角色移动而摆动，增加动态的萌点',
      stats: { 魅力加成: 10 },
      slot: '饰品1',
    }),
    '物品系统._装备栏.饰品2': equippedEquipment('铃铛丝绒项圈', {
      level: 'A',
      description: '极细的丝绒带中心悬挂一颗镂空的银铃铛，走起路来有清脆的响声',
      stats: { 幸运加成: 10 },
      slot: '饰品2',
    }),
    '物品系统._装备栏.特殊装备': {
      名称: '灵魂伴侣·懒洋洋猫',
      等级: 'SS',
      描述: '一只趴在角色肩膀上的肥猫公仔，软塌塌地垂着四肢',
      加成属性: {
        魅力加成: 0,
        幸运加成: 0,
        基础性斗力加成: 0,
        基础性斗力成算: 0,
        基础忍耐力加成: 0,
        基础忍耐力成算: 0,
        闪避率加成: 0,
        暴击率加成: 0,
        最大快感加成: 50,
      },
    },
  },
};

const CHEAT_CODE_MESSAGES: Record<string, string> = {
  XDO1YEAR: '已获得：堕落修女的圣水瓶、六种战斗小蛋糕各2个、天海信用点 +8888、幸运抽奖券 +3。',
  SPONSORBLADE: '已获得赞助者专属SSS装备：笑里藏·刀',
  SPONSORSTAR: '已获得赞助者专属SSS装备：不陨之星',
  '0210': '',
  '1011': '草莓套装已自动装备到身上！',
  SNOW: '已获得：纯黑丝绒长围巾',
  PROTECT: '已获得：袖子过长的宽大卫衣',
  ENERGY: '已获得：荧光色运动护腕',
  SILENCE: '已获得：挂颈式头戴耳机',
  QUEEN: '已获得：精致的手工缎带\n天海信用点 +2000',
  UNKNOWN: '已获得：黑猫造型的小挎包',
  HOT: '已获得：五彩渐变美甲',
  LOVESICK: '已获得：藏在袖子里的美工刀',
  NERD: '已获得：厚重黑框眼镜',
  DEVIL: '已获得：小恶魔翅膀发夹',
  AIRHEAD: '已获得：草莓味棒棒糖',
  SUCCUBUS: '已获得：魅魔之尾',
  CHAOS: '已获得：不可名状触手',
  DOLL: '已获得：人偶专用保养油',
  BEAST: '已获得：兽耳发箍',
  CYBER: '已获得：机械手臂',
  PRINCESS: '已获得：蕾丝阳伞',
  DELINQUENT: '已获得：不良少年头巾',
  SHY: '已获得：遮脸刘海',
  MIDAUTUMN8888: '已获得：14种中秋月饼；天海信用点 +8888。月饼可在背包中使用并永久生效。',
  MOONRABBITGALA: '已获得：中秋月宫情趣装备套装，共10件。',
};

export function normalizeCheatCode(value: string): string {
  const code = String(value || '')
    .trim()
    .toUpperCase();
  return code === 'LOLI' || code === 'LOLICON' ? '1011' : code;
}

export function isKnownCheatCode(value: string): boolean {
  return Object.prototype.hasOwnProperty.call(CHEAT_CODE_UPDATES, normalizeCheatCode(value));
}

export async function redeemCheatCode(value: string): Promise<CheatCodeResult> {
  const code = normalizeCheatCode(value);
  if (!isKnownCheatCode(code)) {
    return { ok: false, code, title: '错误', message: '无效的代码', reason: 'invalid' };
  }

  const activatedCodes = getActivatedCheatCodes();
  if (activatedCodes.has(code)) {
    return {
      ok: false,
      code,
      title: '警告',
      message:
        code === 'SPONSORSTAR' || code === 'SPONSORBLADE'
          ? '这份赞助者谢礼已经领取过了！'
          : `作弊码 ${code} 已经激活过了，无法重复使用！`,
      reason: 'duplicate',
    };
  }

  const updates = { ...CHEAT_CODE_UPDATES[code] };
  let mvuData;
  try {
    mvuData = await getLatestMvuData();
  } catch (error) {
    console.error(`[性斗学园] 读取 MVU 数据失败（兑换码 ${code}）:`, error);
    return { ok: false, code, title: '错误', message: '兑换失败，请检查 MVU 变量', reason: 'failed' };
  }
  if (!mvuData?.stat_data) {
    return { ok: false, code, title: '错误', message: '当前没有可用的 MVU 数据', reason: 'unavailable' };
  }
  const goldReward = code === 'QUEEN' ? 2000 : code === 'MIDAUTUMN8888' || code === 'XDO1YEAR' ? 8888 : 0;
  if (code === 'XDO1YEAR') {
    const backpack = mvuData.stat_data?.物品系统?.背包 || {};
    for (const [path, item] of Object.entries(updates)) {
      if (!path.startsWith('物品系统.背包.')) continue;
      const name = path.slice('物品系统.背包.'.length);
      const existing = backpack[name];
      if (existing?.类型 === (item as any).类型) {
        updates[path] = { ...(item as object), 数量: (Number(existing.数量) || 0) + Number((item as any).数量) };
      }
    }
  }

  try {
    await grantMoneyWithUpdates(updates, goldReward, 'redemption');
    activatedCodes.add(code);
    saveActivatedCheatCodes(activatedCodes);
    return {
      ok: true,
      code,
      title:
        code === 'SPONSORSTAR' || code === 'SPONSORBLADE'
          ? '赞助者谢礼'
          : code === '0210'
            ? 'CHEAT MODE ACTIVATE'
            : code === '1011'
              ? '草莓套装激活'
              : '作弊码激活',
      message: CHEAT_CODE_MESSAGES[code] || '',
    };
  } catch (error) {
    console.error(`[性斗学园] 兑换码 ${code} 执行失败:`, error);
    return { ok: false, code, title: '错误', message: '兑换失败，请检查 MVU 变量', reason: 'failed' };
  }
}
