export interface FullbodyPortraitProfile {
  fileName: string;
  portraitUrl: string;
  displayName: string;
  names: string[];
  affiliation?: string;
}

const PORTRAIT_ASSET_BASE_URL = 'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/全身立绘/';

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

function resolvePortraitAssetBaseUrl() {
  const configuredBaseUrl = PORTRAIT_ASSET_BASE_URL.trim();
  if (configuredBaseUrl.length > 0) {
    return ensureTrailingSlash(configuredBaseUrl);
  }

  return './全身立绘/';
}

const fullbodyPortraitAssetBaseUrl = resolvePortraitAssetBaseUrl();

export function resolveFullbodyAssetUrl(fileName: string) {
  try {
    return new URL(fileName, fullbodyPortraitAssetBaseUrl).href;
  } catch {
    return `${fullbodyPortraitAssetBaseUrl}${encodeURIComponent(fileName)}`;
  }
}

const FULLBODY_PORTRAIT_META: Array<
  Omit<FullbodyPortraitProfile, 'portraitUrl' | 'displayName'> & { displayName?: string }
> = [
  {
    fileName: '响木天音_苍蓝星形态.png',
    displayName: '响木天音',
    names: ['响木天音_苍蓝星形态', '响木天音苍蓝星形态', '响木天音校服', '响木天音', '天音'],
    affiliation: '学生会',
  },
  { fileName: '小夜月静夜.png', names: ['小夜月静夜', '小夜月', '静夜'] },
  { fileName: '上杉亚衣.png', names: ['上杉亚衣', '上杉', '亚衣'], affiliation: '独立' },
  { fileName: '中岛诗织.png', names: ['中岛诗织', '中岛', '诗织'], affiliation: '研究会' },
  { fileName: '九条凛音.png', names: ['九条凛音', '九条', '凛音'], affiliation: '独立' },
  { fileName: '云溪.png', names: ['云溪'], affiliation: '玉台仙苑 (世界排名第一)' },
  { fileName: '伊丽莎白夜羽.png', names: ['伊丽莎白夜羽', '伊丽莎白', '夜羽'], affiliation: '地下联盟' },
  { fileName: '伊尼亚德瓦卢瓦.png', names: ['伊尼亚德瓦卢瓦', '伊尼亚', '德瓦卢瓦'], affiliation: '独立' },
  { fileName: '伊甸芙宁.png', names: ['伊甸芙宁', '伊甸', '芙宁'] },
  { fileName: '伊莎贝拉.png', names: ['伊莎贝拉'], affiliation: '瓦莱里乌斯皇家学院 (世界排名第三)' },
  { fileName: '伽拉娜.png', names: ['伽拉娜'], affiliation: '艺术社 雕塑部' },
  { fileName: '佐藤幸子.png', names: ['佐藤幸子', '佐藤', '幸子'], affiliation: '独立' },
  { fileName: '僵尸天羽.png', names: ['僵尸天羽'] },
  { fileName: '克劳迪娅威斯特.png', names: ['克劳迪娅威斯特', '克劳迪娅', '威斯特'], affiliation: '研究会' },
  { fileName: '克洛伊.png', names: ['克洛伊'] },
  { fileName: '克莉丝汀_1.png', names: ['克莉丝汀'], affiliation: '学生会' },
  { fileName: '八尺夫人.png', names: ['八尺夫人'] },
  { fileName: '凰天羽.png', names: ['凰天羽'], affiliation: '独立' },
  { fileName: '响木天音.png', names: ['响木天音'], affiliation: '学生会' },
  { fileName: '堕落铃音.png', names: ['堕落铃音', '铃音'], affiliation: '独立' },
  { fileName: '墨柒.png', names: ['墨柒'], affiliation: '艺术社 书法部' },
  {
    fileName: '夏洛特.png',
    names: ['夏洛特'],
    affiliation: '瓦莱里乌斯皇家学院 (世界排名第三) → 天海学园交换生(转学后)',
  },
  { fileName: '天宫院抚子.png', names: ['天宫院抚子', '天宫院', '抚子'], affiliation: '独立' },
  { fileName: '女主.png', names: ['女主'] },
  { fileName: '如月诗乃.png', names: ['如月诗乃', '如月', '诗乃'], affiliation: '学生服务中心' },
  { fileName: '娜塔莎斯迈尔.png', names: ['娜塔莎斯迈尔', '娜塔莎', '斯迈尔'], affiliation: '独立' },
  { fileName: '安娜.png', names: ['安娜', '安娜科兹洛娃', '科兹洛娃'], affiliation: '体育联盟 体操部' },
  {
    fileName: '安洁莉卡.png',
    names: ['安洁莉卡'],
    affiliation: '聖·塞拉芬娜修道院 (教会附属) → 天海学园交换生(若转学)',
  },
  { fileName: '安琪.png', names: ['安琪'], affiliation: '独立' },
  { fileName: '小鸟游雏子.png', names: ['小鸟游雏子', '小鸟游', '雏子'], affiliation: '独立' },
  { fileName: '山田花子.png', names: ['山田花子', '山田', '花子'], affiliation: '独立' },
  { fileName: '布伦希尔德.png', names: ['布伦希尔德', '布伦'], affiliation: '教师' },
  { fileName: '弗洛拉梅斯梅尔.png', names: ['弗洛拉梅斯梅尔', '弗洛拉', '梅斯梅尔'], affiliation: '教师' },
  { fileName: '早坂蕾娜.png', names: ['早坂蕾娜', '早坂', '蕾娜'], affiliation: '独立' },
  { fileName: '明日香.png', names: ['明日香'], affiliation: 'BF社 社长' },
  { fileName: '星野光.png', names: ['星野光', '星野', '光'], affiliation: '独立' },
  { fileName: '月下香.png', names: ['月下香'], affiliation: '研究会' },
  { fileName: '月城遥.png', names: ['月城遥', '月城', '遥'], affiliation: '独立' },
  {
    fileName: '望月静.png',
    names: ['望月静', '望月', '静'],
    affiliation: '一年级B班 / 图书委员会 / (暗地里) 望月极道会',
  },
  { fileName: '李小云.png', names: ['李小云'], affiliation: '体育联盟 武术部' },
  { fileName: '柳烟霞.png', names: ['柳烟霞'], affiliation: '玉台仙苑 (世界排名第一) → 天海学园交换生(转学后)' },
  { fileName: '桃乃爱.png', names: ['桃乃爱'], affiliation: '独立' },
  { fileName: '梅朵.png', names: ['梅朵'], affiliation: '广播社 社长 / 欲望竞技场专属解说员' },
  { fileName: '梅菲丝.png', names: ['梅菲丝'], affiliation: '基赫纳淫欲学院 (魔界第一学府)' },
  { fileName: '森莉花.png', names: ['森莉花', '森', '莉花'], affiliation: '研究会' },
  { fileName: '樱井结衣.png', names: ['樱井结衣', '樱井', '结衣'], affiliation: '学生服务中心' },
  { fileName: '樱岛麻衣.png', names: ['樱岛麻衣', '樱岛', '麻衣'], affiliation: '地下联盟' },
  { fileName: '沐芯兰.png', names: ['沐芯兰', '茉莉'], affiliation: '独立' },
  { fileName: '潘多拉小姐.png', names: ['潘多拉小姐', '潘多拉'], affiliation: '地下联盟' },
  { fileName: '爱丽丝.png', names: ['爱丽丝', '爱丽丝温特'], affiliation: '学生会' },
  { fileName: '特蕾莎.png', names: ['特蕾莎'], affiliation: '聖·塞拉芬娜修道院 (教会附属)' },
  { fileName: '犬饲真子.png', names: ['犬饲真子', '犬饲', '真子'], affiliation: '独立' },
  { fileName: '猫宫宁宁.png', names: ['猫宫宁宁', '猫宫', '宁宁'], affiliation: '独立' },
  { fileName: '玄霜.png', names: ['玄霜'], affiliation: '玉台仙苑 (世界排名第一)' },
  { fileName: '玛利亚.png', names: ['玛利亚'], affiliation: '聖·塞拉芬娜修道院 (教会附属)' },
  { fileName: '玛德琳.png', names: ['玛德琳'], affiliation: '瓦莱里乌斯皇家学院 (世界排名第三)' },
  { fileName: '男主_黑西装校服_普通学生.png', names: ['男主_黑西装校服_普通学生'] },
  { fileName: '白川千夏.png', names: ['白川千夏', '白川', '千夏'], affiliation: '女权协会 见习成员' },
  { fileName: '白石响子.png', names: ['白石响子', '白石', '响子'], affiliation: '独立' },
  { fileName: '神崎凛1.png', names: ['神崎凛'], affiliation: '学生会' },
  { fileName: '米莉.png', names: ['米莉'], affiliation: '体育联盟 啦啦队' },
  { fileName: '索亚伊万诺娃.png', names: ['索亚伊万诺娃', '索亚', '伊万诺娃'], affiliation: '独立' },
  { fileName: '索菲亚.png', names: ['索菲亚'], affiliation: '教师' },
  { fileName: '绫濑川.png', names: ['绫濑川'], affiliation: '教师' },
  { fileName: '维多利亚戈德温.png', names: ['维多利亚戈德温', '维多利亚', '戈德温'], affiliation: '女权协会 调教部长' },
  { fileName: '维斯伊尔.png', names: ['维斯伊尔'] },
  { fileName: '缪斯.png', names: ['缪斯'], affiliation: '艺术社 声乐部' },
  { fileName: '美咲绫.png', names: ['美咲绫'], affiliation: '独立' },
  { fileName: '艾丽卡施耐德.png', names: ['艾丽卡施耐德', '艾丽卡', '施耐德'], affiliation: '女权协会 精英成员' },
  { fileName: '艾格妮丝.png', names: ['艾格妮丝', '蔷薇'], affiliation: '独立' },
  { fileName: '艾琳海德.png', names: ['艾琳海德'], affiliation: '学生会' },
  { fileName: '艾米莉亚.png', names: ['阿米莉亚安斯华斯', '阿米莉亚', '安斯华斯'], affiliation: '服务中心' },
  {
    fileName: '艾米莉威廉姆斯.png',
    names: ['艾米莉威廉姆斯', '艾米丽威廉姆斯', '艾米丽', '威廉姆斯'],
    affiliation: 'BF社 实验组长',
  },
  { fileName: '芙莲.png', names: ['芙莲'] },
  { fileName: '花凛.png', names: ['花凛', '角楯花凛', '角楯'], affiliation: '独立' },
  { fileName: '莉莉丝.png', names: ['莉莉丝'], affiliation: '基赫纳淫欲学院 (魔界第一学府) → 天海学园交换生(若转学)' },
  { fileName: '莉莉娜.png', names: ['莉莉娜'], affiliation: '基赫纳淫欲学院 (魔界第一学府) → 天海学园交换生(若转学)' },
  { fileName: '莉莉安.png', names: ['莉莉安'], affiliation: '教师' },
  { fileName: '莎拉斯通.png', names: ['莎拉斯通'], affiliation: '女权协会 会长' },
  { fileName: '菲奥娜.png', names: ['菲奥娜'], affiliation: '瓦莱里乌斯皇家学院(世界排名第三)' },
  { fileName: '蓝原结衣.png', names: ['蓝原结衣', '蓝原', '结衣'], affiliation: '独立' },
  { fileName: '薇丝佩菈.png', names: ['薇丝佩菈'], affiliation: '独立' },
  { fileName: '薇尔.png', names: ['薇尔'] },
  { fileName: '蝶.png', names: ['蝶'], affiliation: '雌堕会 会长' },
  { fileName: '贝尔芬格.png', names: ['贝尔芬格'], affiliation: '基赫纳淫欲学院 (魔界第一学府)' },
  { fileName: '贝阿切丝特.png', names: ['贝阿切丝特'], affiliation: '聖·塞拉芬娜修道院 (教会附属)' },
  { fileName: '赤城朱音.png', names: ['赤城朱音', '赤城', '朱音'], affiliation: '体育联盟' },
  { fileName: '赵婷婷.png', names: ['赵婷婷'], affiliation: '体育联盟 游泳部' },
  { fileName: '铃木惠美.png', names: ['铃木惠美', '铃木', '惠美'], affiliation: '独立' },
  { fileName: '铃音.png', names: ['铃音'], affiliation: '独立' },
  { fileName: '阳菜.png', names: ['阳菜'], affiliation: '独立' },
  { fileName: '阿黛尔.png', names: ['阿黛尔'], affiliation: '瓦莱里乌斯皇家学院 (世界排名第三)' },
  { fileName: '雪莉克里姆希尔德.png', names: ['雪莉克里姆希尔德', '雪莉'], affiliation: '女权协会' },
  { fileName: '雪.png', names: ['雪'], affiliation: '雌堕会 改造师 (蝶的弟子)' },
  { fileName: '零.png', names: ['零'], affiliation: '独立' },
  { fileName: '露娜拉克缇丝.png', names: ['露娜拉克缇丝', '露娜', '拉克缇丝'], affiliation: '地下联盟' },
  { fileName: '露美.png', names: ['露美'], affiliation: '艺术社 摄影部' },
  { fileName: '青鸢.png', names: ['青鸢'], affiliation: '玉台仙苑 (世界排名第一)' },
  { fileName: '风.png', names: ['风'], affiliation: '雌堕会 核心成员' },
  { fileName: '风音.png', names: ['风音'], affiliation: '独立' },
  { fileName: '鬼巫女椿.png', names: ['鬼巫女椿'] },
  { fileName: '鬼樱.png', names: ['鬼樱'] },
  { fileName: '黑塔小姐.png', names: ['黑塔小姐', '黑塔'], affiliation: '研究会' },
  { fileName: '黑崎晴雯.png', names: ['黑崎晴雯'], affiliation: '学生会' },
];

const fullbodyPortraitFileNames = new Set(FULLBODY_PORTRAIT_META.map(profile => profile.fileName));

function normalizePortraitAlias(value: string) {
  return value.replace(/[{}·・•‧∙･．.\s]/g, '').trim();
}

function expandPortraitAliases(names: string[]) {
  const result: string[] = [];
  const seen = new Set<string>();

  function add(name: string) {
    const normalizedName = name.trim();
    if (normalizedName.length === 0 || seen.has(normalizedName)) {
      return;
    }

    seen.add(normalizedName);
    result.push(normalizedName);
  }

  names.forEach(add);

  for (const fullName of names) {
    const normalizedFullName = normalizePortraitAlias(fullName);
    if (normalizedFullName.length < 4) {
      continue;
    }

    for (const givenName of names) {
      const normalizedGivenName = normalizePortraitAlias(givenName);
      if (normalizedGivenName.length < 2 || normalizedGivenName.length >= normalizedFullName.length) {
        continue;
      }

      if (!normalizedFullName.startsWith(normalizedGivenName)) {
        continue;
      }

      const familyName = normalizedFullName.slice(normalizedGivenName.length);
      if (familyName.length >= 2) {
        add(`${givenName}·${familyName}`);
      }
    }
  }

  return result;
}

export const fullbodyPortraitProfiles: FullbodyPortraitProfile[] = FULLBODY_PORTRAIT_META.map(profile => ({
  ...profile,
  displayName: profile.displayName ?? resolveDefaultPortraitDisplayName(profile.names, profile.fileName),
  names: expandPortraitAliases(profile.names),
  portraitUrl: resolveFullbodyAssetUrl(profile.fileName),
}));

export function resolveFullbodyPortraitProfile(speakerName: string) {
  const normalizedSpeakerName = normalizePortraitAlias(speakerName);
  if (normalizedSpeakerName.length === 0) {
    return null;
  }

  return (
    fullbodyPortraitProfiles.find(profile =>
      profile.names.some(alias => {
        const normalizedAlias = normalizePortraitAlias(alias);
        return (
          normalizedSpeakerName === normalizedAlias ||
          (normalizedAlias.length >= 2 && normalizedSpeakerName.startsWith(normalizedAlias)) ||
          (normalizedSpeakerName.length >= 2 && normalizedAlias.startsWith(normalizedSpeakerName))
        );
      }),
    ) ?? null
  );
}

export function resolveFullbodyPortraitDisplayName(speakerName: string) {
  return resolveFullbodyPortraitProfile(speakerName)?.displayName ?? speakerName.trim();
}

export function getFullbodyPortraitUrl(fileName: string) {
  return fullbodyPortraitFileNames.has(fileName) ? resolveFullbodyAssetUrl(fileName) : null;
}

function resolveDefaultPortraitDisplayName(names: string[], fileName: string) {
  const candidates = names.map(name => name.trim()).filter(name => name.length > 0);
  if (candidates.length === 0) {
    return fileName.replace(/\.[^.]+$/, '');
  }

  return candidates.reduce((longest, candidate) =>
    normalizePortraitAlias(candidate).length > normalizePortraitAlias(longest).length ? candidate : longest,
  );
}
