import { type Character, type CombatLogEntry, type Item } from './types';
import {
  clearStoredPlayerAvatar,
  getStoredPlayerAvatarSyncUrl,
  resolveStoredPlayerAvatar,
  saveStoredPlayerAvatar,
  saveStoredPlayerAvatarBlob,
} from '../shared/localPreferences';

// R2 立绘基础路径
const R2_PORTRAIT_BASE_URL = 'https://img.vinsimage.org/性斗学园/立绘';

// 随机图片 URL（降级使用）
const RANDOM_IMAGE_URLS = [
  'https://picsum.photos/400/600?random=1',
  'https://picsum.photos/400/600?random=2',
  'https://picsum.photos/400/600?random=3',
  'https://picsum.photos/400/600?random=4',
  'https://picsum.photos/400/600?random=5',
];

/**
 * 根据敌人全名生成立绘 URL
 * @param fullName 敌人的完整名称
 * @returns 立绘 URL
 */
export function getEnemyPortraitUrl(fullName: string): string {
  if (!fullName) {
    return getRandomImageUrl();
  }
  // URL 编码处理中文字符
  const encodedName = encodeURIComponent(fullName);
  return `${R2_PORTRAIT_BASE_URL}/${encodedName}.png`;
}

/**
 * 获取随机图片 URL
 * @returns 随机图片 URL
 */
export function getRandomImageUrl(): string {
  const index = Math.floor(Math.random() * RANDOM_IMAGE_URLS.length);
  return RANDOM_IMAGE_URLS[index];
}

/**
 * 获取玩家自定义头像（同步偏好 URL）
 * @returns 玩家头像 URL 或 null
 */
export function getPlayerCustomAvatar(): string | null {
  return getStoredPlayerAvatarSyncUrl();
}

export async function resolvePlayerCustomAvatar(): Promise<string | null> {
  return resolveStoredPlayerAvatar();
}

/**
 * 保存玩家自定义头像 URL 到本地偏好
 * @param avatarUrl 头像 URL
 */
export function savePlayerCustomAvatar(avatarUrl: string): void {
  saveStoredPlayerAvatar(avatarUrl);
  console.info('[战斗界面] 玩家自定义头像已保存');
}

export async function savePlayerCustomAvatarBlob(blob: Blob): Promise<string> {
  const objectUrl = await saveStoredPlayerAvatarBlob(blob);
  console.info('[战斗界面] 玩家自定义头像已保存');
  return objectUrl;
}

/**
 * 清除玩家自定义头像
 */
export function clearPlayerCustomAvatar(): void {
  clearStoredPlayerAvatar();
  console.info('[战斗界面] 玩家自定义头像已清除');
}

// 创建日志辅助函数
const createLog = (msg: string, source: string, type: CombatLogEntry['type'] = 'info'): CombatLogEntry => ({
  id: Math.random().toString(36).substr(2, 9),
  turn: 0,
  message: msg,
  source,
  type,
});

// --- 玩家物品 ---
export const PLAYER_ITEMS: Item[] = [
  {
    id: 'i1',
    name: '强走饮料',
    description: '恢复 30 点耐力。',
    quantity: 3,
    staminaRestore: 30,
    effect: (user: Character, _target: Character) => {
      user.stats.currentEndurance = Math.min(user.stats.maxEndurance, user.stats.currentEndurance + 30);
      return createLog(`${user.name} 喝下 [强走饮料]，耐力恢复了。`, 'player', 'heal');
    },
  },
  {
    id: 'i2',
    name: '抑制剂',
    description: '减少 20 点当前快感。',
    quantity: 2,
    pleasureReduce: 20,
    effect: (user: Character, _target: Character) => {
      user.stats.currentPleasure = Math.max(0, user.stats.currentPleasure - 20);
      return createLog(`${user.name} 注射了 [抑制剂]，身体稍微冷却下来。`, 'player', 'heal');
    },
  },
];

// --- 创建默认角色数据 ---
export function createDefaultPlayer(): Character {
  // 优先使用自定义头像，否则使用随机图片
  const customAvatar = getPlayerCustomAvatar();
  const avatarUrl = customAvatar || getRandomImageUrl();

  return {
    id: 'player',
    name: '学园偶像',
    avatarUrl,
    isPlayer: true,
    statusEffects: [],
    items: PLAYER_ITEMS.map(i => ({ ...i })),
    skills: [],
    stats: {
      maxEndurance: 100,
      currentEndurance: 100,
      maxPleasure: 100,
      currentPleasure: 0,
      climaxCount: 0,
      maxClimaxCount: 3,
      sexPower: 25,
      baseEndurance: 15,
      evasion: 10,
      dodgeProfileEvasion: 10,
      crit: 5,
      charm: 30,
      luck: 15,
      level: 1,
    },
  };
}

export function createDefaultEnemy(): Character {
  return {
    id: 'enemy',
    name: '风纪委员长',
    avatarUrl: getRandomImageUrl(),
    isPlayer: false,
    statusEffects: [],
    items: [],
    skills: [],
    stats: {
      maxEndurance: 150,
      currentEndurance: 150,
      maxPleasure: 100,
      currentPleasure: 0,
      climaxCount: 0,
      maxClimaxCount: 3,
      sexPower: 20,
      baseEndurance: 20,
      evasion: 5,
      dodgeProfileEvasion: 5,
      crit: 10,
      charm: 10,
      luck: 5,
      level: 1,
    },
  };
}

// --- 高潮文本 ---
export const CLIMAX_TEXTS = [
  (name: string) => `${name} 身体弓起，眼神失焦，无法抑制地颤抖着...`,
  (name: string) => `剧烈的快感如潮水般淹没了 ${name} 的理智...`,
  (name: string) => `${name} 发出了甜美的悲鸣，身体彻底瘫软下来...`,
];
