import { fullbodyPortraitProfiles, resolveFullbodyAssetUrl, resolveFullbodyPortraitProfile, type FullbodyPortraitProfile } from '../portrait-registry';

const GALLERY_CDN_URL = 'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/';
const GALLERY_RAW_URL = 'https://raw.githubusercontent.com/enterprise20020924-web/-/main/llm1/';
export const MEILING_Q_AVATAR_FILE = '橘美玲Q版.png';
export const KANZAKI_RIN_Q_AVATAR_FILE = '神崎凛Q版.png';
export const UESUGI_AI_Q_AVATAR_FILE = '上杉亚衣Q版.png';
const Q_AVATAR_DIRECTORIES: Record<string, string[]> = {
  [MEILING_Q_AVATAR_FILE]: ['全身立绘', 'Q版'],
  [KANZAKI_RIN_Q_AVATAR_FILE]: ['全身立绘'],
  [UESUGI_AI_Q_AVATAR_FILE]: ['全身立绘'],
};
const Q_AVATAR_FILE_OVERRIDES: Record<string, string> = {
  '响木天音_苍蓝星形态.png': '响木天音.png',
  '响木天音校服.png': '响木天音.png',
  '橘美玲4K.png': MEILING_Q_AVATAR_FILE,
  '神崎凛4K.png': KANZAKI_RIN_Q_AVATAR_FILE,
  '上杉亚衣4K.png': UESUGI_AI_Q_AVATAR_FILE,
};

export function getQAvatarAssetUrls(fileName: string): [string, string] {
  const directory = Q_AVATAR_DIRECTORIES[fileName] ?? ['Q版'];
  const path = [...directory, fileName].map(encodeURIComponent).join('/');
  return [`${GALLERY_CDN_URL}${path}`, `${GALLERY_RAW_URL}${path}`];
}

export function resolveRelationshipAvatarUrl(name: string) {
  return getRelationshipAvatarUrl(resolveFullbodyPortraitProfile(name));
}

export function getRelationshipAvatarUrl(profile: FullbodyPortraitProfile | null) {
  if (profile === null) return null;
  if (profile.qAvatarUrl) return profile.qAvatarUrl;
  if (!fullbodyPortraitProfiles.some(registered => registered.fileName === profile.fileName)) return null;
  if (profile.fileName === '阿洛娜4K.png') return resolveFullbodyAssetUrl('阿洛娜Q版.png');
  const fileName = Q_AVATAR_FILE_OVERRIDES[profile.fileName] ?? profile.fileName;
  return getQAvatarAssetUrls(fileName)[0];
}
