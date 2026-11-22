import { BuffType, DamageSource, SkillType, type SkillData } from './types';

type SkillRarity = NonNullable<SkillData['rarity']>;
type BuffList = SkillData['buffs'];

interface ExorcismGroupOptions {
  baseTags?: string[];
  power?: number;
  source?: DamageSource;
}

interface ExorcismSkillSpec {
  name: string;
  tags?: string[];
  type?: SkillType;
  source?: DamageSource;
  coefficient?: number;
  baseValue?: number;
  staminaCost?: number;
  cooldown?: number;
  accuracy?: number;
  critModifier?: number;
  hitCount?: number;
  rarity?: SkillRarity;
  icon?: string;
  buffs?: BuffList;
}

interface ExorcismSkillGroup {
  skillIds: string[];
  skills: SkillData[];
}

const SOURCE_LABELS: Record<DamageSource, string> = {
  [DamageSource.SEX_POWER]: '性斗力',
  [DamageSource.CHARM]: '魅力',
  [DamageSource.LUCK]: '幸运',
  [DamageSource.FIXED]: '固定值',
  [DamageSource.TARGET_PLEASURE]: '目标快感',
};

function uniqueTags(tags: string[]): string[] {
  return [...new Set(tags.filter(Boolean))];
}

function spec(name: string, tags: string[] = [], overrides: Partial<ExorcismSkillSpec> = {}): ExorcismSkillSpec {
  return { name, tags, ...overrides };
}

function inferTags(name: string): string[] {
  const tags: string[] = [];
  if (/洗脑|记忆|低语|ASMR|催眠|改写|告解|皈依/.test(name)) tags.push('brainwash', 'mental');
  if (/魅惑|诱惑|吻|舌|气味|发情|吐息|甜蜜|毒舌/.test(name)) tags.push('charm');
  if (/花|藤|种子|花粉|植物/.test(name)) tags.push('plant');
  if (/花粉/.test(name)) tags.push('pollen');
  if (/寄生|种子|卵|孕|子宫|胎|茧|同化|注入|植入|改造/.test(name)) tags.push('parasite', 'assimilation');
  if (/雪|霜|冰|寒/.test(name)) tags.push('cold', 'snow');
  if (/阳气|吸阳|汲取/.test(name)) tags.push('yangDrain');
  if (/丝|蛛|茧|缠丝/.test(name)) tags.push('silk', 'cocoon');
  if (/羽|翼|天狗|孵化|蛋/.test(name)) tags.push('feather', 'hatching');
  if (/巢|蛋中/.test(name)) tags.push('nest');
  if (/石化|凝视/.test(name)) tags.push('stoneGaze');
  if (/石|石重|石像/.test(name)) tags.push('stone');
  if (/粘液|史莱姆|吞噬|灌肠|尿道|包裹/.test(name)) tags.push('slime', 'engulf');
  if (/腐蚀|黑暗|堕落|暗|魔化|淫纹/.test(name)) tags.push('corruption', 'dark');
  if (/核心/.test(name)) tags.push('core');
  if (/烙印|纹章|血族|契约|诅咒|刻印/.test(name)) tags.push('mark', 'curse', 'domination');
  if (/支配|压制|命令|所有物/.test(name)) tags.push('domination');
  if (/圣|净化|祈祷|神圣|神恩|赎罪|贞洁|圣母|神杖/.test(name)) tags.push('holy', 'purification', 'ritual');
  if (/狐|九尾|狐火/.test(name)) tags.push('foxFire');
  if (/母|哺乳|乳|怀抱|胎内|子宫|母性/.test(name)) tags.push('mother');
  if (/符|封印|贴符/.test(name)) tags.push('forbiddenTalisman');
  if (/猫|肉垫|死库水/.test(name)) tags.push('cat');
  if (/仪式|审判|终审|终极|终局|回归|永冻|重生/.test(name)) tags.push('ritual');
  return tags;
}

function inferType(name: string, index: number, total: number): SkillType {
  if (index === total - 1 || /终极|同化|回归|永冻|重生|皈依|终审|审判|圣光受孕/.test(name)) {
    return SkillType.ULTIMATE;
  }
  if (/束缚|缠绕|拘束|禁闭|锁|棺|结界|石化|定身|包裹|吞噬|压制/.test(name)) {
    return SkillType.CONTROL;
  }
  if (/洗脑|记忆|魅惑|低语|ASMR|催眠|羞辱|祝福|宣言|劝降|契约|烙印|改写|告解/.test(name)) {
    return SkillType.MENTAL;
  }
  if (/吻|舌|乳|气息|吐息|花粉|母性|血乳|哺育|诱惑/.test(name)) {
    return SkillType.CHARM;
  }
  return SkillType.PHYSICAL;
}

function inferSource(type: SkillType, name: string, fallback?: DamageSource): DamageSource {
  if (fallback) return fallback;
  if (type === SkillType.MENTAL || type === SkillType.CHARM || /魅惑|洗脑|催眠|祝福|低语|吻|乳|气息/.test(name)) {
    return DamageSource.CHARM;
  }
  if (/审判|终审|命运/.test(name)) return DamageSource.LUCK;
  return DamageSource.SEX_POWER;
}

function inferIcon(name: string, type: SkillType): string {
  if (/足|踩|踏|踢/.test(name)) return 'Footprints';
  if (/吻|舌|口/.test(name)) return 'Heart';
  if (/乳|母|哺/.test(name)) return 'Milk';
  if (/血|吸血/.test(name)) return 'Droplets';
  if (/冰|雪|寒|霜/.test(name)) return 'Snowflake';
  if (/花|藤|种子|植物/.test(name)) return 'Flower2';
  if (/丝|蛛|缠|束|锁|棺/.test(name)) return 'Link';
  if (/石|凝视/.test(name)) return 'Mountain';
  if (/羽|翼|天狗/.test(name)) return 'Feather';
  if (/猫|肉垫/.test(name)) return 'Cat';
  if (/狐|九尾|狐火/.test(name)) return 'Flame';
  if (/洗脑|记忆|低语|ASMR|催眠|精神/.test(name)) return 'Brain';
  if (type === SkillType.ULTIMATE) return 'Sparkles';
  if (type === SkillType.CONTROL) return 'Shield';
  if (type === SkillType.CHARM) return 'Heart';
  return 'Sword';
}

function inferBuffs(name: string, type: SkillType): BuffList {
  const buffs: BuffList = [];
  if (/束缚|缠绕|拘束|禁闭|锁|棺|定身|包裹|吞噬|石化|压制/.test(name)) {
    buffs.push({
      type: BuffType.BIND,
      value: 1,
      isPercent: false,
      duration: /终极|同化|回归|永冻/.test(name) ? 3 : 1,
      stackable: false,
    });
  }
  if (/洗脑|魅惑|催情|花粉|发情|毒舌|气味|低语|ASMR|吻|乳|舌|同化|寄生|卵|种子/.test(name)) {
    buffs.push({
      type: BuffType.SENSITIVE,
      value: /终极|同化|回归|永冻/.test(name) ? 35 : 18,
      isPercent: true,
      duration: 2,
      stackable: false,
    });
  }
  if (/羞辱|咆哮|威压|支配|审判|恐怖|堕落/.test(name)) {
    buffs.push({ type: BuffType.ATK_DOWN, value: 15, isPercent: true, duration: 2, stackable: false });
  }
  if (/冰|雪|寒|霜|粘液|石化|烟雾|气息/.test(name)) {
    buffs.push({ type: BuffType.DODGE_DOWN, value: 15, isPercent: true, duration: 2, stackable: false });
  }
  if (/祝福|强化|召唤|契约|血之契约|母性改造/.test(name) && type !== SkillType.ULTIMATE) {
    buffs.push({ type: BuffType.ATK_UP, value: 18, isPercent: true, duration: 3, stackable: false });
  }
  return buffs;
}

function inferHitCount(name: string): number {
  if (/九重|群狼|双重|双足|多段|全身/.test(name)) return 3;
  if (/双|连|轮流|姐妹|组合|前后|铃铛/.test(name)) return 2;
  return 1;
}

function inferRarity(index: number, total: number, type: SkillType): SkillRarity {
  if (type === SkillType.ULTIMATE) return 'SS';
  if (index >= total - 2) return 'S';
  if (index >= Math.floor(total / 2)) return 'A';
  return 'B';
}

function describeBuffs(buffs: BuffList): string {
  const parts = buffs.map(buff => {
    if (buff.type === BuffType.BIND) return `束缚${buff.duration}回合`;
    if (buff.type === BuffType.SENSITIVE) return `敏感+${buff.value}%`;
    if (buff.type === BuffType.ATK_DOWN) return `性斗力-${buff.value}%`;
    if (buff.type === BuffType.DODGE_DOWN) return `闪避-${buff.value}%`;
    if (buff.type === BuffType.ATK_UP) return `自身性斗力+${buff.value}%`;
    return '';
  });
  return parts.filter(Boolean).join('，');
}

function createExorcismSkill(
  prefix: string,
  index: number,
  total: number,
  skill: ExorcismSkillSpec,
  options: ExorcismGroupOptions = {},
): SkillData {
  const type = skill.type ?? inferType(skill.name, index, total);
  const source = skill.source ?? inferSource(type, skill.name, options.source);
  const tags = uniqueTags([...(options.baseTags ?? []), ...inferTags(skill.name), ...(skill.tags ?? [])]);
  const power = options.power ?? 1;
  const coefficient =
    skill.coefficient ?? Number((power * (0.95 + index * 0.12 + (type === SkillType.ULTIMATE ? 0.9 : 0))).toFixed(2));
  const buffs = skill.buffs ?? inferBuffs(skill.name, type);
  const buffSummary = describeBuffs(buffs);
  const effectDescription = `造成${Math.round(coefficient * 100)}%${SOURCE_LABELS[source]}伤害${buffSummary ? `，${buffSummary}` : ''}`;

  return {
    id: `${prefix}_${index + 1}`,
    name: skill.name,
    description: `【驱魔】${skill.name}。${tags.length > 0 ? `机制标签：${tags.join('、')}。` : ''}`,
    effectDescription,
    icon: skill.icon ?? inferIcon(skill.name, type),
    type,
    rarity: skill.rarity ?? inferRarity(index, total, type),
    staminaCost: skill.staminaCost ?? Math.round(14 + power * 4 + index * 2 + (type === SkillType.ULTIMATE ? 12 : 0)),
    cooldown: skill.cooldown ?? Math.min(8, 2 + Math.floor(index / 3) + (type === SkillType.ULTIMATE ? 3 : 0)),
    castTime: 0,
    damageFormula: [{ source, coefficient, baseValue: skill.baseValue ?? Math.round(6 + power * 5 + index) }],
    accuracy: skill.accuracy ?? Math.max(78, 92 - Math.floor(index / 2)),
    critModifier: skill.critModifier ?? (type === SkillType.ULTIMATE ? 30 : 10 + index * 2),
    buffs,
    canBeReflected: false,
    hitCount: skill.hitCount ?? inferHitCount(skill.name),
    tags,
  };
}

function createExorcismGroup(
  prefix: string,
  specs: ExorcismSkillSpec[],
  options: ExorcismGroupOptions = {},
): ExorcismSkillGroup {
  const skills = specs.map((skill, index) => createExorcismSkill(prefix, index, specs.length, skill, options));
  return { skillIds: skills.map(skill => skill.id), skills };
}

const EXORCISM_GROUPS: Record<string, ExorcismSkillGroup> = {
  淫蛇女妖: createExorcismGroup(
    '驱魔_淫蛇女妖',
    ['蛇躯缠绕', '蛇信挑逗', '尾端榨取', '麝香吐息', '鳞甲摩擦', '绞杀高潮'].map(name => spec(name)),
    { baseTags: ['snake'], power: 0.9 },
  ),
  淫虎娘: createExorcismGroup(
    '驱魔_淫虎娘',
    ['猎杀扑击', '虎爪撕裂', '野兽磨蹭', '撕咬标记', '尾缠锁固', '发情嘶吼'].map(name => spec(name)),
    { baseTags: ['beast', 'mark'], power: 0.95 },
  ),
  女吊: createExorcismGroup(
    '驱魔_女吊',
    ['天井潜伏', '舌缚绞杀', '舌尖侵入', '发丝捆绑', '倒吊凌辱', '湿语催眠'].map(name => spec(name)),
    { baseTags: ['ambush', 'bind'], power: 0.9 },
  ),
  夜叉娘: createExorcismGroup(
    '驱魔_夜叉娘',
    ['铁锤震地', '蛮力横扫', '第三眼·妖气冲击', '铁头冲撞', '锤柄压制', '战鬼咆哮'].map(name => spec(name)),
    { baseTags: ['oni', 'brute'], power: 1 },
  ),
  恶灵娘: createExorcismGroup(
    '驱魔_恶灵娘',
    [
      '灵体穿透',
      '冰吻榨取',
      '幽灵乳房',
      '新娘的素股',
      '附身手淫',
      '亡灵气息',
      '精魂吸取',
      '子宫附身',
      '永恒的新娘',
    ].map(name => spec(name)),
    { baseTags: ['ghost', 'bride'], power: 1.05 },
  ),
  南瓜头娘: createExorcismGroup(
    '驱魔_南瓜头娘',
    [
      '笑脸·催情花粉',
      '怒脸·淫火灼烧',
      '哭脸·高潮尖叫',
      '南瓜触手',
      '南瓜乳交',
      '扫帚骑乘',
      '糖果陷阱',
      '南瓜子植入',
      '万圣节新娘',
    ].map(name => spec(name)),
    { baseTags: ['pumpkin', 'pollen'], power: 1.05 },
  ),
  堕落人偶: createExorcismGroup(
    '驱魔_堕落人偶',
    [
      '丝线缠绕',
      '关节扭曲压制',
      '瓷唇之吻',
      '人偶手淫',
      '空洞乳交',
      '机械素股',
      '瓷质道具',
      '内部改造',
      '永恒的收藏',
    ].map(name => spec(name)),
    { baseTags: ['doll', 'control'], power: 1.05 },
  ),
  狼娘: createExorcismGroup(
    '驱魔_狼娘',
    ['发情气息', '群狼扑压', '野兽舔舐', '骑乘交配', '尾巴责', '撕咬标记', '结精注入', '子宫标记', '狼群的新娘'].map(
      name => spec(name),
    ),
    { baseTags: ['wolf', 'mark', 'beast'], power: 1.1 },
  ),
  阿娜温: createExorcismGroup(
    '驱魔_阿娜温',
    ['甜蜜诱惑', '藤蔓缠绕', '藤蔓插入', '花蜜灌注', '花朵吞噬', '乳蕾哺育', '花粉洗脑', '种子注入', '植物化同化'].map(
      name => spec(name),
    ),
    { baseTags: ['plant', 'pollen', 'parasite'], power: 1.35 },
  ),
  暗精灵娘: createExorcismGroup(
    '驱魔_暗精灵娘',
    ['魅惑低语', 'ASMR耳舔', '精灵足交', '魔纹手套手交', '精灵素股', '精灵之吻', '堕落的祝福'].map(name => spec(name)),
    { baseTags: ['darkElf', 'charm', 'illusion'], power: 1.3, source: DamageSource.CHARM },
  ),
  石像鬼娘: createExorcismGroup(
    '驱魔_石像鬼娘',
    ['石化伪装', '尾巴淫液注入', '尾巴插入', '淫石粘液涂抹', '蜜穴榨取', '石重压制', '石化凝视'].map(name =>
      spec(name),
    ),
    { baseTags: ['stone', 'corruption'], power: 1.35 },
  ),
  黑暗史莱姆: createExorcismGroup(
    '驱魔_黑暗史莱姆',
    [
      '粘液触手',
      '半吞噬·下半身包裹',
      '粘液口交',
      '粘液乳交',
      '全身吞噬',
      '核心摩擦',
      '粘液灌肠',
      '尿道侵入',
      '同化吸收',
    ].map(name => spec(name)),
    { baseTags: ['slime', 'engulf', 'corrosion'], power: 1.4 },
  ),
  雪女: createExorcismGroup(
    '驱魔_雪女',
    [
      '霜雾笼罩',
      '冰棱束缚',
      '寒息吐息',
      '冰冷舌吻·夺息',
      '阳气汲取·怀抱',
      '阳气汲取·交合',
      '冰乳交·寒凝',
      '冰母乳哺育',
      '霜足抚慰',
      '雪之新娘·永冻',
    ].map(name => spec(name)),
    { baseTags: ['cold', 'snow', 'yangDrain'], power: 1.45 },
  ),
  猫又: createExorcismGroup(
    '驱魔_猫又',
    [
      '猫眼魅惑',
      '分身幻术',
      '死库水气味标记',
      '气味洗脑',
      '发情气息',
      '双尾变形',
      '尾巴肉棒同化注入',
      '淫猫轻咬足交',
      '肉垫踩踏',
      '猫娘妹妹化·死库水茧',
    ].map(name => spec(name)),
    { baseTags: ['cat', 'charm', 'assimilation'], power: 1.45 },
  ),
  天狗: createExorcismGroup(
    '驱魔_天狗',
    [
      '疾风突袭',
      '傲慢踩踏',
      '羽交·暗翼孵化',
      '羽毛玩弄',
      '羽扇煽情',
      '傲慢羞辱',
      '母亲宣言',
      '高傲足踏',
      '羽足双重',
      '天狗娘女儿化·蛋中重生',
    ].map(name => spec(name)),
    { baseTags: ['feather', 'hatching', 'nest'], power: 1.45 },
  ),
  霜凝: createExorcismGroup(
    '驱魔_霜凝',
    [
      '寒冰凝固',
      '冰足踏',
      '吸魂轻咬足交',
      '僵乳洗脑',
      '母性舌吻洗脑',
      '淫符洗脑',
      '尸香拘束',
      '僵化拥抱',
      '死穴榨魂',
      '淫舌后穴开放',
      '冥府之吻',
    ].map(name => spec(name)),
    { baseTags: ['cold', 'zombie', 'brainwash'], power: 1.5 },
  ),
  无常_小黑: createExorcismGroup(
    '驱魔_无常_小黑',
    ['铁链缚魂', '黑足碾压', '铃铛足踢', '黑棒贯穿'].map(name => spec(name)),
    { baseTags: ['wuchang', 'black', 'domination'], power: 1.45 },
  ),
  无常_小白: createExorcismGroup(
    '驱魔_无常_小白',
    ['勾魂摄魄', '冷舌侵入', '催情吐息', '白袜绞杀'].map(name => spec(name)),
    { baseTags: ['wuchang', 'white', 'charm'], power: 1.45 },
  ),
  无常_双人: createExorcismGroup(
    '驱魔_无常_双人',
    ['阴阳碾磨', '生死簿点名', '阴司终审·双足封棺'].map(name => spec(name)),
    { baseTags: ['wuchang', 'dual', 'ritual'], power: 1.65 },
  ),
  僵尸天羽: createExorcismGroup(
    '驱魔_僵尸天羽',
    [
      '尸步生莲',
      '霜足洗面',
      '尸寒前列腺狙击',
      '逆噬阳气',
      '封印腐蚀',
      '尸香缠丝',
      '僵化定身',
      '尸寒龙抬头',
      '欢喜尸指',
      '淫足榨取',
      '贴符洗脑',
      '屁穴吸阳',
      '僵毒之咬',
    ].map(name => spec(name)),
    { baseTags: ['zombie', 'cold', 'forbiddenTalisman'], power: 1.55 },
  ),
  阿曼达_一阶段: createExorcismGroup(
    '驱魔_阿曼达_一阶段',
    ['告解引导', '圣水洗礼', '祈祷束缚', '赎罪之鞭', '贞洁之锁', '禁闭告解'].map(name => spec(name)),
    { baseTags: ['ritual', 'holy', 'brainwash'], power: 1.55, source: DamageSource.CHARM },
  ),
  阿曼达_二阶段: createExorcismGroup(
    '驱魔_阿曼达_二阶段',
    [
      '慈母的拥抱',
      '赦免之乳',
      '温柔抚触',
      '信仰植入',
      '记忆改写',
      '绝对皈依',
      '圣职者的祝福',
      '赎罪的代价',
      '姐妹的誓约',
      '圣母的责罚',
    ].map(name => spec(name)),
    { baseTags: ['brainwash', 'ritual', 'mother'], power: 1.75, source: DamageSource.CHARM },
  ),
  希思_一阶段: createExorcismGroup(
    '驱魔_希思_一阶段',
    ['尾缠压制', '尾巴榨取', '吸血足交', '强制丰乳吸奶', '乳头责', '淫语恶堕_初级', '淫棺拘束榨取'].map(name =>
      spec(name),
    ),
    { baseTags: ['vampire', 'mark', 'domination'], power: 1.55 },
  ),
  希思_二阶段: createExorcismGroup(
    '驱魔_希思_二阶段',
    [
      '尾巴前内腺狙击',
      '尾巴子宫叩击',
      '淫纹刻印_前内腺版',
      '淫纹刻印_子宫版',
      '淫语恶堕_同化洗脑',
      '记忆改写',
      '睾丸吸血',
    ].map(name => spec(name)),
    { baseTags: ['vampire', 'curse', 'mark', 'domination'], power: 1.75 },
  ),
  希思_三阶段: createExorcismGroup(
    '驱魔_希思_三阶段',
    ['强制射精诅咒', '姐妹契约', '强制发情诅咒'].map(name => spec(name)),
    { baseTags: ['vampire', 'curse', 'assimilation', 'domination'], power: 1.95 },
  ),
  薇尔: createExorcismGroup(
    '驱魔_薇尔',
    [
      '血乳喷射',
      '强制哺乳',
      '血乳浴',
      '颈吻榨取',
      '血之契约',
      '眷属召唤',
      '血丝足踏',
      '铃铛足交',
      '足尖吸血',
      '腋窝陷阱',
      '双臂缠绕',
      '精血榨取',
      '血族烙印·雄',
      '姐妹之吻',
      '血族烙印·雌',
    ].map(name => spec(name)),
    { baseTags: ['vampire', 'blood', 'mark'], power: 1.65 },
  ),
  鬼巫女椿_一阶段: createExorcismGroup(
    '驱魔_鬼巫女椿_一阶段',
    [
      '母性哺乳·堕落乳汁',
      '鬼巫洗脑·记忆侵蚀',
      '屁穴开发·母亲的手指',
      '淫臀压制·母亲的重量',
      '妻之器·扶她显现',
      '种付·母亲的精华',
      '母女劝降',
    ].map(name => spec(name)),
    { baseTags: ['oni', 'mother', 'brainwash'], power: 1.55 },
  ),
  鬼巫女椿_二阶段: createExorcismGroup(
    '驱魔_鬼巫女椿_二阶段',
    [
      '狐尾肉棒·九重贯穿',
      '尾巴乳首开发',
      '淫狐荷尔蒙洗脑',
      '狐火催情',
      '九尾精华注入',
      '狐妻形态强化',
      '终极种付·母与狐的祝福',
    ].map(name => spec(name)),
    { baseTags: ['foxFire', 'corruption', 'seed'], power: 1.8 },
  ),
  鬼樱: createExorcismGroup(
    '驱魔_鬼樱',
    [
      '逆净化',
      '堕落结界',
      '淫纹刻印',
      '淫鬼洗脑榨取',
      '堕落足踏',
      '侵蚀足袋焖绝',
      '鬼之金蹴',
      '鬼角假阳具插入',
      '腋下支配手交',
      '淫舌入耳支配',
      '堕落淫臀洗脑',
      '堕落淫语吐息',
      '血脉共鸣',
      '姐妹邀请',
    ].map(name => spec(name)),
    { baseTags: ['corruption', 'oni', 'brainwash'], power: 1.65 },
  ),
  鬼樱_铃音连锁: createExorcismGroup(
    '驱魔_鬼樱_铃音连锁',
    ['双子足臭焖绝', '双重假阳具插入', '双重堕落ASMR乳首开发', '姐妹子宫献祭'].map(name => spec(name)),
    { baseTags: ['corruption', 'twins', 'brainwash'], power: 1.85 },
  ),
  克洛伊_魔化面: createExorcismGroup(
    '驱魔_克洛伊_魔化面',
    [
      '堕落六翼·淫靡包裹',
      '缩小玩具·口袋肉便器',
      '强制寸止·欲望的拷问',
      '神穴榨取·贪婪的吞噬',
      '堕落羽交·黑翼撸管',
      '堕落乳交·肉山窒息',
      '乳首互磨·堕落感染',
      '堕落种付·烙印归属',
    ].map(name => spec(name)),
    { baseTags: ['corruption', 'dark'], power: 1.7 },
  ),
  克洛伊_神化面: createExorcismGroup(
    '驱魔_克洛伊_神化面',
    [
      '圣翼拥抱·神恩降临',
      '神圣贞操·禁欲试炼',
      '圣洁素股·肉身祈祷',
      '神羽净化·全身洗礼',
      '圣乳洗礼·神恩哺育',
      '神杖净化·肉身圣礼',
      '献身祭礼·圣淫供奉',
      '终极救赎·圣光受孕',
    ].map(name => spec(name)),
    { baseTags: ['holy', 'purification', 'ritual'], power: 1.7, source: DamageSource.CHARM },
  ),
  八尺夫人_慈母: createExorcismGroup(
    '驱魔_八尺夫人_慈母',
    [
      '母亲的呼唤',
      '温柔拥抱·巨乳窒息',
      '母乳哺育·甘甜催眠',
      '长舌深吻·体格差侵入',
      '母腋熏香·安抚催眠',
      '母手爱抚·巨掌手交',
      '洋服宝宝·温柔版',
      '巨臀压制·臀肉摇篮',
    ].map(name => spec(name)),
    { baseTags: ['mother', 'domination'], power: 1.65 },
  ),
  八尺夫人_真母: createExorcismGroup(
    '驱魔_八尺夫人_真母',
    [
      '强制哺乳·乳首灌注',
      '淫穴做脸·阴部压制',
      '后庭开发·母之管教',
      '子宫研磨·母之调教',
      '强制泌乳·母之改造',
      '淫舌马眼责·母之精榨',
      '洋服宝宝·强制版',
      '胎内回归·永恒孕育',
    ].map(name => spec(name)),
    { baseTags: ['mother', 'assimilation', 'domination'], power: 1.9 },
  ),
  玉藻前_一阶段: createExorcismGroup(
    '驱魔_玉藻前_一阶段',
    ['小狐狸足戏', '真空小嘴吸吸', '尺寸羞辱', '单尾缠茎榨取', '雌小鬼骑乘嘲讽', '妻之器展示', '小狐狸手冲榨取'].map(
      name => spec(name),
    ),
    { baseTags: ['fox', 'tease'], power: 1.45 },
  ),
  玉藻前_二阶段: createExorcismGroup(
    '驱魔_玉藻前_二阶段',
    [
      '女王足踏压制',
      '九尾真空深喉',
      '尺寸碾压对比',
      '强制扶她化改造',
      '九尾乳交碾压',
      '乳首互磨支配',
      '魔力子宫改造',
      '终极种付·九尾孕化冲刺',
    ].map(name => spec(name)),
    { baseTags: ['foxFire', 'seed', 'domination'], power: 1.85 },
  ),
  灵樱: createExorcismGroup(
    '驱魔_灵樱',
    ['甜蜜毒舌', '堕落魅惑', '逆净化之触', '花蕾播种', '堕落丝袜', '记忆侵蚀', '姐妹召唤'].map(name => spec(name)),
    { baseTags: ['corruption', 'sakura', 'brainwash'], power: 1.55 },
  ),
  万魔之母_一阶段: createExorcismGroup(
    '驱魔_万魔之母_一阶段',
    ['反差萌诱惑', '纯真羞辱', '稚嫩足交', '稚气毒龙', '童颜口交', '脐带缠绕', '子宫邀请'].map(name => spec(name)),
    { baseTags: ['mother', 'demon'], power: 1.75 },
  ),
  万魔之母_二阶段: createExorcismGroup(
    '驱魔_万魔之母_二阶段',
    ['扶她双重侵犯', '初孕压制', '淫鞭抽打', '发育乳交', '青涩骑乘', '母性迷雾', '茧化容器'].map(name => spec(name)),
    { baseTags: ['mother', 'demon', 'cocoon'], power: 1.95 },
  ),
  万魔之母_三阶段: createExorcismGroup(
    '驱魔_万魔之母_三阶段',
    ['圣母哺乳手交', '孕肚研磨', '腋下支配', '终极容纳', '脐带寄生', '母性改造', '胎内回归·终极'].map(name =>
      spec(name),
    ),
    { baseTags: ['mother', 'demon', 'ritual', 'assimilation'], power: 2.15 },
  ),
};

function pool(groupName: string): string[] {
  return EXORCISM_GROUPS[groupName]?.skillIds ?? [];
}

function combinedPool(...groupNames: string[]): string[] {
  return groupNames.flatMap(groupName => pool(groupName));
}

const gargoyleAmbushSkill = createExorcismSkill(
  'gargoyle',
  0,
  1,
  spec('石像鬼伏击', ['stone', 'ambush'], {
    type: SkillType.CONTROL,
    coefficient: 1.35,
    buffs: [{ type: BuffType.BIND, value: 1, isPercent: false, duration: 1, stackable: false }],
  }),
  { baseTags: ['stone', 'corruption'], power: 1.35 },
);

gargoyleAmbushSkill.id = 'gargoyle_ambush';

const motherDemonFinalUltimate: SkillData = {
  ...EXORCISM_GROUPS.万魔之母_三阶段.skills[6],
  id: 'mother_demon_final_ultimate',
  name: '胎内回归·终极',
  tags: uniqueTags([...(EXORCISM_GROUPS.万魔之母_三阶段.skills[6].tags ?? []), 'final', 'ritual']),
};

export const EXORCISM_ENEMY_SKILLS: Record<string, SkillData> = {
  ...Object.fromEntries(Object.values(EXORCISM_GROUPS).flatMap(group => group.skills.map(skill => [skill.id, skill]))),
  gargoyle_ambush: gargoyleAmbushSkill,
  mother_demon_final_ultimate: motherDemonFinalUltimate,
};

export const EXORCISM_ENEMY_SKILL_MAP: Record<string, string[]> = {
  淫蛇女妖: pool('淫蛇女妖'),
  淫虎娘: pool('淫虎娘'),
  女吊: pool('女吊'),
  夜叉娘: pool('夜叉娘'),
  鬼童子: pool('夜叉娘'),
  恶灵娘: pool('恶灵娘'),
  南瓜头娘: pool('南瓜头娘'),
  堕落人偶: pool('堕落人偶'),
  狼娘: pool('狼娘'),

  阿娜温: pool('阿娜温'),
  anawen_plant: pool('阿娜温'),
  暗精灵娘: pool('暗精灵娘'),
  dark_elf_charm: pool('暗精灵娘'),
  石像鬼娘: ['gargoyle_ambush', ...pool('石像鬼娘')],
  gargoyle: ['gargoyle_ambush', ...pool('石像鬼娘')],
  黑暗史莱姆: pool('黑暗史莱姆'),
  黑暗史莱姆娘: pool('黑暗史莱姆'),
  dark_slime: pool('黑暗史莱姆'),
  雪女: pool('雪女'),
  yuki_onna: pool('雪女'),
  猫又: pool('猫又'),
  nekomata: pool('猫又'),
  天狗: pool('天狗'),
  天狗娘: pool('天狗'),
  tengu: pool('天狗'),
  霜凝: pool('霜凝'),
  shuangning: pool('霜凝'),
  僵尸天羽: pool('僵尸天羽'),
  zombie_tianyu: pool('僵尸天羽'),

  无常_小黑: pool('无常_小黑'),
  黑无常: pool('无常_小黑'),
  wuchang_black: pool('无常_小黑'),
  无常_小白: pool('无常_小白'),
  白无常: pool('无常_小白'),
  wuchang_white: pool('无常_小白'),
  无常_双人: pool('无常_双人'),
  无常: pool('无常_小黑'),
  黑白无常: pool('无常_小黑'),
  无常姐妹: pool('无常_小黑'),
  wuchang_dual: pool('无常_双人'),

  阿曼达: pool('阿曼达_一阶段'),
  阿曼达_一阶段: pool('阿曼达_一阶段'),
  Amanda: pool('阿曼达_一阶段'),
  amanda_nun: pool('阿曼达_一阶段'),
  阿曼达_二阶段: combinedPool('阿曼达_一阶段', '阿曼达_二阶段'),
  amanda_awakened: combinedPool('阿曼达_一阶段', '阿曼达_二阶段'),

  希思: pool('希思_一阶段'),
  Heath: pool('希思_一阶段'),
  希思_一阶段: pool('希思_一阶段'),
  heath_mark: pool('希思_一阶段'),
  希思_二阶段: combinedPool('希思_一阶段', '希思_二阶段'),
  heath_curse: combinedPool('希思_一阶段', '希思_二阶段'),
  希思_三阶段: combinedPool('希思_一阶段', '希思_二阶段', '希思_三阶段'),
  heath_assimilation: combinedPool('希思_一阶段', '希思_二阶段', '希思_三阶段'),

  薇尔: pool('薇尔'),
  veil: pool('薇尔'),

  鬼巫女椿: pool('鬼巫女椿_一阶段'),
  椿: pool('鬼巫女椿_一阶段'),
  鬼巫女椿_一阶段: pool('鬼巫女椿_一阶段'),
  tsubaki_oni_miko: pool('鬼巫女椿_一阶段'),
  鬼巫女椿_二阶段: pool('鬼巫女椿_二阶段'),
  tsubaki_fox_wife: pool('鬼巫女椿_二阶段'),
  鬼樱: pool('鬼樱'),
  oni_sakura_single: pool('鬼樱'),
  鬼樱_铃音连锁: combinedPool('鬼樱', '鬼樱_铃音连锁'),
  oni_sakura_twins: combinedPool('鬼樱', '鬼樱_铃音连锁'),
  灵樱: pool('灵樱'),
  spirit_sakura: pool('灵樱'),

  克洛伊: pool('克洛伊_魔化面'),
  Chloe: pool('克洛伊_魔化面'),
  克洛伊_魔化面: pool('克洛伊_魔化面'),
  chloe_demonic: pool('克洛伊_魔化面'),
  克洛伊_神化面: pool('克洛伊_神化面'),
  chloe_sacred: pool('克洛伊_神化面'),

  八尺夫人: pool('八尺夫人_慈母'),
  八尺大人: pool('八尺夫人_慈母'),
  八尺夫人_慈母: pool('八尺夫人_慈母'),
  hachishaku_mother: pool('八尺夫人_慈母'),
  八尺夫人_真母: pool('八尺夫人_真母'),
  hachishaku_true_mother: pool('八尺夫人_真母'),

  玉藻前: pool('玉藻前_一阶段'),
  玉藻: pool('玉藻前_一阶段'),
  Tamamo: pool('玉藻前_一阶段'),
  玉藻前_一阶段: pool('玉藻前_一阶段'),
  tamamo_phase1: pool('玉藻前_一阶段'),
  玉藻前_二阶段: pool('玉藻前_二阶段'),
  tamamo_phase2: pool('玉藻前_二阶段'),

  万魔之母: pool('万魔之母_一阶段'),
  万魔母: pool('万魔之母_一阶段'),
  万魔之母_一阶段: pool('万魔之母_一阶段'),
  mother_demon_child: pool('万魔之母_一阶段'),
  万魔之母_二阶段: pool('万魔之母_二阶段'),
  mother_demon_girl: pool('万魔之母_二阶段'),
  万魔之母_三阶段: [...pool('万魔之母_三阶段'), 'mother_demon_final_ultimate'],
  mother_demon_mature: [...pool('万魔之母_三阶段'), 'mother_demon_final_ultimate'],
};

export const EXORCISM_EXISTING_SKILL_TAGS: Record<string, string[]> = {
  络新妇_1: ['silk', 'cocoon'],
  络新妇_2: ['silk'],
  络新妇_3: ['silk', 'cocoon'],
  络新妇_4: ['silk'],
  络新妇_5: ['brainwash', 'charm'],
  络新妇_6: ['parasite', 'assimilation'],
  络新妇_7: ['brainwash', 'charm'],
  络新妇_8: ['silk'],
  络新妇_9: ['parasite', 'control'],
  络新妇_10: ['silk', 'cocoon', 'parasite', 'brainwash', 'assimilation', 'ritual'],
};
