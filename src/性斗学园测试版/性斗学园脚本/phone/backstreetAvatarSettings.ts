export type BackstreetAvatarMode = 'chibi' | 'normal';

export const DEFAULT_BACKSTREET_AVATAR_MODE: BackstreetAvatarMode = 'chibi';
export const BACKSTREET_CONTACT_AVATAR_STORAGE_KEY = 'fatria-backstreet-contact-avatar-modes-v1';

const NORMAL_AVATAR_FILE_NAME_OVERRIDES: Record<string, string> = {
  黑无常: '无常',
  无常_小黑: '无常',
  白无常: '无常',
  无常_小白: '无常',
  沐芯兰: '沐芯兰_1',
  克莉丝汀: '克莉丝汀_1',
  贝阿特丽切: '贝阿切丝特',
  青鸾: '青鸢',
};

const Q_AVATAR_NAMES = new Set([
  '上杉亚衣',
  '中岛诗织',
  '九条凛音',
  '云溪',
  '伊丽莎白夜羽',
  '伊尼亚德瓦卢瓦',
  '伊甸芙宁',
  '伊莎贝拉',
  '伽拉娜',
  '佐藤幸子',
  '僵尸天羽',
  '克劳迪娅威斯特',
  '克洛伊',
  '克莉丝汀_1',
  '八尺夫人',
  '凰天羽',
  '响木天音',
  '响木天音校服',
  '堕落铃音',
  '墨柒',
  '夏洛特',
  '天宫院抚子',
  '女主',
  '如月诗乃',
  '娜塔莎斯迈尔',
  '安娜科兹洛娃',
  '安洁莉卡',
  '安琪',
  '小鸟游雏子',
  '山田花子',
  '布伦希尔德',
  '弗洛拉梅斯梅尔',
  '早坂蕾娜',
  '明日香',
  '星野光',
  '月下香',
  '月城遥',
  '望月静',
  '李小云',
  '柳烟霞',
  '桃乃爱',
  '梅朵',
  '梅菲丝',
  '森莉花',
  '樱井结衣',
  '樱岛麻衣',
  '沐芯兰',
  '潘多拉小姐',
  '爱丽丝温特',
  '特蕾莎',
  '犬饲真子',
  '猫宫宁宁',
  '玄霜',
  '玛利亚',
  '玛德琳',
  '男主',
  '白川千夏',
  '白石响子',
  '神崎凛',
  '米莉',
  '索亚伊万诺娃',
  '索菲亚',
  '绫濑川',
  '维多利亚戈德温',
  '维斯伊尔',
  '缪斯',
  '美咲绫',
  '艾丽卡施耐德',
  '艾格妮丝',
  '艾琳海德',
  '阿米莉亚安斯华斯',
  '艾米丽威廉姆斯',
  '芙莲',
  '角楯花凛',
  '莉莉丝',
  '莉莉娜',
  '莉莉安',
  '莎拉斯通',
  '菲奥娜',
  '蓝原结衣',
  '薇丝佩菈',
  '薇尔',
  '蝶',
  '贝尔芬格',
  '贝阿切丝特',
  '赤城朱音',
  '赵婷婷',
  '铃木惠美',
  '铃音',
  '辣妹子阳菜',
  '阿黛尔',
  '雪',
  '雪莉克里姆希尔德',
  '零',
  '露娜拉克缇丝',
  '露美',
  '青鸢',
  '风',
  '风音',
  '鬼巫女椿',
  '鬼樱',
  '黑塔小姐',
  '黑崎晴雯',
]);

function normalizeName(name: string): string {
  return String(name || '').trim();
}

export function getAvatarResourceName(name: string): string {
  // 敌人库用下划线区分战斗阶段/形态，头像目录只按角色本名存放。
  return normalizeName(name).replace(/_[^_]+$/u, '');
}

export function normalizeBackstreetAvatarMode(value: unknown): BackstreetAvatarMode {
  return value === 'normal' ? 'normal' : 'chibi';
}

export function getNormalAvatarUrl(fullName: string): string {
  const resourceName = getAvatarResourceName(fullName);
  const avatarFileName = NORMAL_AVATAR_FILE_NAME_OVERRIDES[resourceName] || resourceName;

  return `https://img.vinsimage.org/性斗学园/头像/${encodeURIComponent(avatarFileName)}.png`;
}

export function getChibiAvatarName(fullName: string): string | null {
  const name = getAvatarResourceName(fullName);
  if (!name) return null;

  const candidates = [name, `${name}_1`, `${name}1`, name.replace(/\s+/g, '')];
  return candidates.find(candidate => Q_AVATAR_NAMES.has(candidate)) || null;
}

export function getChibiAvatarUrl(chibiName: string): string {
  return `https://img.vinsimage.org/性斗学园/Q版头像/${encodeURIComponent(chibiName)}.png`;
}

export function getDefaultPlayerAvatarUrl(gender: unknown): string {
  const avatarName = String(gender || '').trim() === '男' ? '男主' : '女主';
  return getChibiAvatarUrl(avatarName);
}

export function hasChibiAvatar(fullName: string): boolean {
  return Boolean(getChibiAvatarName(fullName));
}

export function loadContactAvatarModes(): Record<string, BackstreetAvatarMode> {
  try {
    const raw = window.localStorage?.getItem(BACKSTREET_CONTACT_AVATAR_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const modes: Record<string, BackstreetAvatarMode> = {};
    for (const [name, mode] of Object.entries(parsed || {})) {
      const normalizedName = normalizeName(name);
      if (normalizedName) {
        modes[normalizedName] = normalizeBackstreetAvatarMode(mode);
      }
    }
    return modes;
  } catch {
    return {};
  }
}

export function saveContactAvatarModes(modes: Record<string, BackstreetAvatarMode>): void {
  try {
    window.localStorage?.setItem(BACKSTREET_CONTACT_AVATAR_STORAGE_KEY, JSON.stringify(modes));
  } catch {
    // localStorage 不可用时保留当前运行态即可。
  }
}
