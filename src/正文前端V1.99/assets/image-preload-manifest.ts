import { fullbodyPortraitProfiles } from '../portrait-registry';
import { fullbodyPortraitProfiles as battlePortraits } from '../../性斗（Battle Fuck）/combat/portrait-registry';
import { fullbodyPortraitProfiles as openingPortraits } from '../../性斗学园测试版/战斗界面P5R/portrait-registry';
import { campusSceneAssets } from '../map/campus-map-scenes';
import { campusCharacterHabits, getCampusCharacterAvatarUrls } from '../map/campus-character-encounters';
import { stageBackgrounds, resolveStageBackgroundUrls } from '../engine/stage-backgrounds';
import { resolveRelationshipAvatarUrl } from './relationship-avatar';
import { resolveEntrancePortrait } from '../battle/entrance-portraits';
import { konataCameo } from '../modules/cameo-profile';
import { getEnemyPortraitUrl } from '../../性斗学园测试版/战斗界面/constants';
import { ENEMY_DATABASE } from '../phone/terminal/战斗界面/enemyDatabase';
import { CG_CONFIGS } from '../phone/terminal/战斗界面/data/cgConfig';
import { CG_CONFIGS as battleCGs } from '../../性斗（Battle Fuck）/combat/data/cgConfig';
import { CURRENT_BOSS_DEFINITIONS } from '../phone/terminal/战斗界面/bossDefinitions';
import { CURRENT_BOSS_DEFINITIONS as battleBosses } from '../../性斗（Battle Fuck）/combat/bossDefinitions';
import {
  AVATAR_VARIATION_CONFIGS,
  AVATAR_VARIATION_KEYS,
  getAvatarVariationUrl,
} from '../phone/terminal/shared/avatarVariationStore';
import {
  getNormalAvatarUrl,
  getChibiAvatarName,
  getChibiAvatarUrl,
} from '../phone/terminal/性斗学园脚本/phone/backstreetAvatarSettings';
import type { ImageAssetGroup, PreloadImageAsset } from './image-preload-types';
import { preloadAssistantPortraitUrls } from './preload-assistant';
import { PHONE_LAUNCHER_PORTRAITS } from '../phone/terminal/shared/launcher-portraits';
import { admissionIdentityArt } from '../opening/admission-identity-art';
import { personalTalentPortraits } from './personal-talent-portraits';
import { bankArtworkUrl } from '../bank/loan';
import { gyaru24ArtworkUrl } from '../shop/artwork';
import { recruitmentArtworkUrl } from '../jobs/catalog';
import { trainingDisplayCharacter } from '../training/catalog';

/** Use the same registries and URL builders as the consumers, including fallback hosts. */
export function collectForkImageAssets(): PreloadImageAsset[] {
  const assets = new Map<string, PreloadImageAsset>();
  const add = (url: string | null | undefined, label: string, group: ImageAssetGroup) => {
    if (!url) return;
    const normalized = new URL(url).href;
    if (!assets.has(normalized)) assets.set(normalized, { url: normalized, label, group });
  };

  for (const url of preloadAssistantPortraitUrls) add(url, '阿洛娜 · 预载助手', 'portraits');
  for (const portrait of Object.values(PHONE_LAUNCHER_PORTRAITS)) {
    add(portrait.url, `${portrait.name} · 手机入口`, 'avatars');
  }
  add(bankArtworkUrl, '如月银行', 'scenes');
  add(gyaru24ArtworkUrl, '辣妹24', 'scenes');
  add(recruitmentArtworkUrl, '信息服务中心 · 招工启事', 'scenes');
  add(trainingDisplayCharacter.fullbodyUrl, `${trainingDisplayCharacter.name} · 特训看板娘`, 'portraits');
  for (const art of Object.values(admissionIdentityArt)) {
    add(art.fullbodyUrl, `${art.name} · 开局立绘`, 'portraits');
    add(art.qAvatarUrl, `${art.name} · Q版`, 'avatars');
    add(art.battleUrl, `${art.name} · 开局战斗插图`, 'portraits');
  }
  for (const art of Object.values(personalTalentPortraits)) {
    add(art.portraitUrl, `${art.name} · 个人天赋`, 'portraits');
    add(art.fallbackPortraitUrl, `${art.name} · 个人天赋备用`, 'portraits');
  }
  for (const profile of [...fullbodyPortraitProfiles, ...battlePortraits, ...openingPortraits]) {
    add(profile.portraitUrl, profile.displayName, 'portraits');
    add(resolveEntrancePortrait(profile.displayName), `${profile.displayName} · 战斗入口`, 'portraits');
    add(resolveRelationshipAvatarUrl(profile.displayName), `${profile.displayName} · Q版`, 'avatars');
  }
  add(konataCameo.portraitUrl, konataCameo.name, 'portraits');
  add(konataCameo.avatarUrl, `${konataCameo.name} · Q版`, 'avatars');
  for (const name of ['猫arc天音', '爱丽丝教师装']) {
    add(`https://raw.githubusercontent.com/enterprise20020924-web/-/main/llm1/全身立绘/${name}.png`, name, 'portraits');
  }
  for (const name of Object.keys(ENEMY_DATABASE)) {
    add(getEnemyPortraitUrl(name), `${name} · 入学立绘`, 'portraits');
    add(getNormalAvatarUrl(name), `${name} · 手机头像`, 'avatars');
    const chibi = getChibiAvatarName(name);
    if (chibi) add(getChibiAvatarUrl(chibi), `${name} · 手机Q版`, 'avatars');
  }
  for (const config of AVATAR_VARIATION_CONFIGS) {
    for (const key of AVATAR_VARIATION_KEYS) {
      add(getAvatarVariationUrl(config, key), `${config.characterName} · ${key}`, 'avatars');
    }
  }
  for (const person of campusCharacterHabits) {
    for (const url of getCampusCharacterAvatarUrls(person)) add(url, `${person.name} · 地图头像`, 'avatars');
  }
  for (const scene of Object.values(campusSceneAssets)) add(scene.url, scene.caption, 'scenes');
  for (const scene of stageBackgrounds) {
    for (const url of resolveStageBackgroundUrls(scene.name)) add(url, scene.name, 'scenes');
  }
  // Boss art may use phase-specific URLs which are absent from the neutral registry.
  const collectBossUrls = (value: unknown) => {
    if (typeof value === 'string' && /^https?:\/\/.+\.(?:png|jpe?g|webp|gif)(?:\?|$)/i.test(value)) {
      add(value, decodeURIComponent(value.split('/').pop()!), 'portraits');
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(collectBossUrls);
    }
  };
  collectBossUrls([CURRENT_BOSS_DEFINITIONS, battleBosses]);
  for (const config of [...CG_CONFIGS, ...battleCGs]) {
    for (const gender of ['male', 'female'] as const) {
      for (const result of ['victory', 'defeat'] as const) {
        for (const event of config[gender][result]) {
          for (const file of event.images) {
            add(
              `https://img.vinsimage.org/性斗学园/cg/${config.characterName}/${gender === 'male' ? '男u' : '女u'}/${result === 'victory' ? '战胜事件' : '战败事件'}/${file}`,
              `${config.characterName} · ${file}`,
              'cg',
            );
          }
        }
      }
    }
  }
  return [...assets.values()];
}
