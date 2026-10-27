import { fullbodyPortraitProfiles } from '../portrait-registry';

type CharacterAliasTarget = string | string[];

const CANONICAL_CHARACTER_NAMES = [
  '伊甸阿斯莫德',
  '白石响子',
  '弗洛拉梅斯梅尔',
  '布伦希尔德',
  '维多利亚戈德温',
  '艾丽卡施耐德',
  '雪莉克里姆希尔德',
  '白川千夏',
  '艾米丽威廉姆斯',
  '安娜科兹洛娃',
  '克劳迪娅威斯特',
  '中岛诗织',
  '黑塔小姐',
  '露娜拉克缇丝',
  '伊丽莎白夜羽',
  '樱岛麻衣',
  '潘多拉小姐',
  '阿米莉亚安斯华斯',
  '森莉花',
  '如月诗乃',
  '樱井结衣',
  '角楯花凛',
  '月城遥',
  '上杉亚衣',
  '天宫院抚子',
  '索亚伊万诺娃',
  '九条凛音',
  '赤城朱音',
  '蓝原结衣',
  '橘美玲',
  '克里奥佩特拉七世',
  '星野光',
  '望月静',
  '早坂蕾娜',
  '伊尼亚德瓦卢瓦',
  '小鸟游雏子',
  '猫宫宁宁',
  '犬饲真子',
  '娜塔莎斯迈尔',
  '铃木惠美',
  '山田花子',
  '佐藤幸子',
  '沐芯兰',
  '伊甸芙宁',
  '艾格妮丝',
  '绫濑川',
  '维纳斯',
  '索菲亚',
  '莉莉安',
  '加藤鹰',
  '佐藤健',
  '艾琳海德',
  '神崎凛',
  '爱丽丝温特',
  '莎拉斯通',
  '明日香',
  '赵婷婷',
  '李小云',
  '月下香',
  '蝶',
  '雪',
  '风',
  '田中勇',
  '李强',
  '安琪',
  '美咲绫',
  '零',
  '桃乃爱',
  '风音',
  '铃音',
  '凰天羽',
  '娜拉',
  '芙莲',
  '克莉丝汀',
  '伽拉娜',
  '露美',
  '墨柒',
  '缪斯',
  '响木天音',
  '维斯伊尔',
  '米莉',
  '梅朵',
  '玄霜',
  '青鸢',
  '云溪',
  '梅菲丝',
  '贝阿切丝特',
  '特蕾莎',
  '玛利亚',
  '赛莲',
  '夏洛特',
  '柳烟霞',
  '菲奥娜',
  '贝尔芬格',
  '淫蛇女妖',
  '淫虎娘',
  '女吊',
  '夜叉娘',
  '霜凝',
  '无常',
  '堕落人偶',
  '狼娘',
  '恶灵娘',
  '南瓜头娘',
  '希思',
  '阿曼达',
  '薇尔',
  '僵尸天羽',
  '阿娜温',
  '黑暗史莱姆',
  '石像鬼娘',
  '暗精灵娘',
  '八尺夫人',
  '克洛伊',
  '万魔之母',
  '鬼巫女椿',
  '鬼樱',
  '玉藻前',
  '灵樱',
  '猫又',
  '天狗',
  '络新妇',
  '雪女',
] as const;

const CHARACTER_NAME_ALIASES: Record<string, CharacterAliasTarget> = {
  阿斯莫德: '伊甸阿斯莫德',
  白石: '白石响子',
  响子: '白石响子',
  弗洛拉: '弗洛拉梅斯梅尔',
  梅斯梅尔: '弗洛拉梅斯梅尔',
  布伦: '布伦希尔德',
  女武神: '布伦希尔德',
  维多利亚: '维多利亚戈德温',
  戈德温: '维多利亚戈德温',
  艾丽卡: '艾丽卡施耐德',
  施耐德: '艾丽卡施耐德',
  雪莉: '雪莉克里姆希尔德',
  克里姆: '雪莉克里姆希尔德',
  克里姆希尔德: '雪莉克里姆希尔德',
  白川: '白川千夏',
  千夏: '白川千夏',
  艾米丽: '艾米丽威廉姆斯',
  威廉姆斯: '艾米丽威廉姆斯',
  安娜: '安娜科兹洛娃',
  科兹洛娃: '安娜科兹洛娃',
  克劳迪娅: '克劳迪娅威斯特',
  威斯特: '克劳迪娅威斯特',
  中岛: '中岛诗织',
  诗织: '中岛诗织',
  黑塔: '黑塔小姐',
  露娜: '露娜拉克缇丝',
  拉克缇丝: '露娜拉克缇丝',
  伊丽莎白: '伊丽莎白夜羽',
  夜羽: '伊丽莎白夜羽',
  樱岛: '樱岛麻衣',
  麻衣: '樱岛麻衣',
  潘多拉: '潘多拉小姐',
  阿米莉亚: '阿米莉亚安斯华斯',
  安斯华斯: '阿米莉亚安斯华斯',
  森: '森莉花',
  莉花: '森莉花',
  如月: '如月诗乃',
  诗乃: '如月诗乃',
  樱井: '樱井结衣',
  结衣: '樱井结衣',
  角楯: '角楯花凛',
  花凛: '角楯花凛',
  月城: '月城遥',
  遥: '月城遥',
  上杉: '上杉亚衣',
  亚衣: '上杉亚衣',
  天宫院: '天宫院抚子',
  抚子: '天宫院抚子',
  索亚: '索亚伊万诺娃',
  伊万诺娃: '索亚伊万诺娃',
  九条: '九条凛音',
  凛音: '九条凛音',
  赤城: '赤城朱音',
  朱音: '赤城朱音',
  蓝原: '蓝原结衣',
  橘: '橘美玲',
  美玲: '橘美玲',
  克里奥: '克里奥佩特拉七世',
  克里奥佩特拉: '克里奥佩特拉七世',
  佩特拉: '克里奥佩特拉七世',
  七世: '克里奥佩特拉七世',
  星野: '星野光',
  光: '星野光',
  望月: '望月静',
  静: '望月静',
  早坂: '早坂蕾娜',
  蕾娜: '早坂蕾娜',
  伊尼亚: '伊尼亚德瓦卢瓦',
  德瓦卢瓦: '伊尼亚德瓦卢瓦',
  小鸟游: '小鸟游雏子',
  雏子: '小鸟游雏子',
  猫宫: '猫宫宁宁',
  宁宁: '猫宫宁宁',
  犬饲: '犬饲真子',
  真子: '犬饲真子',
  娜塔莎: '娜塔莎斯迈尔',
  斯迈尔: '娜塔莎斯迈尔',
  铃木: '铃木惠美',
  惠美: '铃木惠美',
  山田: '山田花子',
  花子: '山田花子',
  茉莉: '沐芯兰',
  芙宁: '伊甸芙宁',
  蔷薇: '艾格妮丝',
  神崎: '神崎凛',
  莎拉: '莎拉斯通',
  斯通: '莎拉斯通',
  桃乃: '桃乃爱',
  天羽: '凰天羽',
  风音和铃音: ['风音', '铃音'],
  风音与铃音: ['风音', '铃音'],
  双子巫女: ['风音', '铃音'],
  无常姐妹: '无常',
  黑白无常: '无常',
  黑无常: '无常',
  白无常: '无常',
  无常_小黑: '无常',
  无常_小白: '无常',
  无常_双人: '无常',
  鬼童子: '夜叉娘',
  蛛娘: '络新妇',
};

const CANONICAL_CHARACTER_NAME_MAP = new Map(
  CANONICAL_CHARACTER_NAMES.map(name => [normalizeCharacterRegistryName(name), name]),
);
const CHARACTER_ALIAS_MAP = new Map(
  Object.entries(CHARACTER_NAME_ALIASES).map(
    ([alias, target]) => [normalizeCharacterRegistryName(alias), target] as const,
  ),
);
const PORTRAIT_CANONICAL_NAME_MAP = new Map(
  fullbodyPortraitProfiles.map(profile => [normalizeCharacterRegistryName(profile.displayName), profile.displayName]),
);
const PORTRAIT_ALIAS_MAP = createPortraitAliasMap();

export function normalizeCharacterRegistryName(name: unknown) {
  return String(name ?? '')
    .trim()
    .replace(/[{}·・‧•∙･．.\s\u3000_\-—]/g, '');
}

export function splitCharacterNameList(value: unknown) {
  const rawItems = Array.isArray(value) ? value : [value];
  return rawItems
    .flatMap(item => String(item ?? '').split(/[，,、|/；;]+/))
    .map(item => item.trim())
    .filter(Boolean);
}

export function resolveRegisteredCanonicalCharacterTargets(name: unknown): string[] {
  const normalizedName = normalizeCharacterRegistryName(name);
  if (normalizedName.length === 0) {
    return [];
  }

  const canonicalName =
    CANONICAL_CHARACTER_NAME_MAP.get(normalizedName) ?? PORTRAIT_CANONICAL_NAME_MAP.get(normalizedName);
  if (canonicalName !== undefined) {
    return [canonicalName];
  }

  const aliasTarget = CHARACTER_ALIAS_MAP.get(normalizedName);
  if (aliasTarget !== undefined) {
    return Array.isArray(aliasTarget) ? [...aliasTarget] : [aliasTarget];
  }

  const portraitAliasTarget = PORTRAIT_ALIAS_MAP.get(normalizedName);
  if (portraitAliasTarget !== undefined) {
    return [portraitAliasTarget];
  }

  return [];
}

export function resolveRegisteredCanonicalCharacterName(name: unknown) {
  const targets = resolveRegisteredCanonicalCharacterTargets(name);
  return targets.length === 1 ? targets[0] : null;
}

export function resolveCanonicalCharacterTargets(name: unknown): string[] {
  const registeredTargets = resolveRegisteredCanonicalCharacterTargets(name);
  if (registeredTargets.length > 0) {
    return registeredTargets;
  }

  const originalName = String(name ?? '').trim();
  return originalName.length > 0 ? [originalName] : [];
}

export function resolveCanonicalCharacterName(name: unknown) {
  return resolveCanonicalCharacterTargets(name)[0] ?? String(name ?? '').trim();
}

function createPortraitAliasMap() {
  const aliasTargets = new Map<string, Set<string>>();

  for (const profile of fullbodyPortraitProfiles) {
    for (const alias of profile.names) {
      const normalizedAlias = normalizeCharacterRegistryName(alias);
      if (normalizedAlias.length === 0) {
        continue;
      }

      const targets = aliasTargets.get(normalizedAlias) ?? new Set<string>();
      targets.add(profile.displayName);
      aliasTargets.set(normalizedAlias, targets);
    }
  }

  return new Map(
    Array.from(aliasTargets.entries())
      .filter(([, targets]) => targets.size === 1)
      .map(([alias, targets]) => [alias, Array.from(targets)[0]]),
  );
}
