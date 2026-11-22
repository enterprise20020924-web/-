import { Gender, type CharacterData, type UserProfile } from '../types';

type ProfileMeasurements = Pick<CharacterData, 'age' | 'height'>;
const profileReferencePattern = /<user(?:_age|_height)?>/gu;

export const USER_PROFILE_SECTIONS = [
  {
    key: 'basicInfo',
    title: '基础信息',
    hint: '只需要写你的OC需要模型长期记住的基础事实就好',
  },
  {
    key: 'lifeStructure',
    title: '生活结构',
    hint: '你的OC平时如何生活，TA的时间、人际关系交往、还有现实条件、资源是如何运作的',
  },
  {
    key: 'characterNature',
    title: '人物性情',
    hint: '从你的OC如何理解/看待事物、会做出什么样的选择等角度去写，不要堆砌性格形容词，写TA具体怎么想怎么做',
  },
  {
    key: 'sceneExpression',
    title: '场景表达',
    hint: '防抢话的不用看，抢话流也只需要想想有没有什么需要特意明确的场景反应——挑前三项还没办法表达出来的反应写',
  },
] as const;

export function hasInitializedUserProfile(data: Partial<CharacterData>, identityId: string): boolean {
  const profile = data.userProfile;
  return Boolean(
    profile &&
    (data.userProfilePresetId === identityId || USER_PROFILE_SECTIONS.some(section => profile[section.key].trim())),
  );
}

export function readUserProfile(data: Partial<CharacterData>): UserProfile {
  const legacyBackground = data.personality?.includes('[生活模拟模式开局场景]') ? '' : data.personality;
  return {
    basicInfo: data.userProfile?.basicInfo ?? [data.appearance, legacyBackground].filter(Boolean).join('\n\n'),
    lifeStructure: data.userProfile?.lifeStructure ?? '',
    characterNature:
      data.userProfile?.characterNature ?? (data.palettePersona?.trim() || data.palettePersonaOverview || ''),
    sceneExpression: data.userProfile?.sceneExpression ?? '',
  };
}

export function formatUserProfile(profile: UserProfile, name: string): string {
  if (!USER_PROFILE_SECTIONS.some(section => profile[section.key].trim())) return '';
  const prefix = name.trim() || 'user';
  return USER_PROFILE_SECTIONS.map(section => {
    const tag = `${prefix}_${section.title}`;
    return `<${tag}>\n${profile[section.key].trim()}\n</${tag}>`;
  }).join('\n');
}

export function parseUserProfile(content: string): UserProfile {
  const profile = readUserProfile({});
  for (const section of USER_PROFILE_SECTIONS) {
    const pattern = new RegExp(`<([^<>]+)_${section.title}>([\\s\\S]*?)<\\/\\1_${section.title}>`, 'u');
    profile[section.key] = content.match(pattern)?.[2]?.trim() ?? '';
  }
  return profile;
}

export function getUserInfoContent(data: CharacterData): string {
  if (data.palettePersona?.trim()) return personalizeUserInfo(data.palettePersona.trim(), data.name, data);
  const profile = readUserProfile(data);
  if (!USER_PROFILE_SECTIONS.some(section => profile[section.key].trim())) return '';
  const hasBreasts = data.configFeatures?.hasBreasts ?? data.gender === Gender.FEMALE;
  const hasPenis = data.configFeatures?.hasPenis ?? data.gender === Gender.MALE;
  let gender = '无性';
  if (hasBreasts && hasPenis) gender = '扶她';
  else if (hasPenis) gender = '男';
  else if (hasBreasts) gender = '女';
  return personalizeUserInfo(
    formatUserProfile(
      {
        ...profile,
        basicInfo: [`姓名：<user>`, `年龄：${data.age}`, `性别：${gender}`, '', profile.basicInfo].join('\n'),
      },
      data.name,
    ),
    data.name,
    data,
  );
}

function resolveProfileReference(token: string, name: string, measurements?: ProfileMeasurements): string {
  if (token === '<user>') return name.trim() || token;
  const value = token === '<user_age>' ? measurements?.age : measurements?.height;
  return value?.toString() ?? token;
}

export function personalizeUserInfo(content: string, name: string, measurements?: ProfileMeasurements): string {
  return content.replace(profileReferencePattern, token => resolveProfileReference(token, name, measurements));
}

export function updatePersonalizedUserInfo(
  template: string,
  editedText: string,
  name: string,
  measurements?: ProfileMeasurements,
): string {
  const displayedText = personalizeUserInfo(template, name, measurements);
  let prefixEnd = 0;
  while (
    prefixEnd < displayedText.length &&
    prefixEnd < editedText.length &&
    displayedText[prefixEnd] === editedText[prefixEnd]
  ) {
    prefixEnd++;
  }
  let previousEnd = displayedText.length;
  let editedEnd = editedText.length;
  while (
    previousEnd > prefixEnd &&
    editedEnd > prefixEnd &&
    displayedText[previousEnd - 1] === editedText[editedEnd - 1]
  ) {
    previousEnd--;
    editedEnd--;
  }

  const untouchedReferences: { start: number; length: number; token: string }[] = [];
  let renderedOffset = 0;
  for (const match of template.matchAll(profileReferencePattern)) {
    const token = match[0];
    const length = resolveProfileReference(token, name, measurements).length;
    const start = match.index + renderedOffset;
    const end = start + length;
    renderedOffset += length - token.length;
    if (end <= prefixEnd) untouchedReferences.push({ start, length, token });
    else if (start >= previousEnd) untouchedReferences.push({ start: start + editedEnd - previousEnd, length, token });
  }

  let updated = editedText;
  for (const { start, length, token } of untouchedReferences.reverse()) {
    updated = updated.slice(0, start) + token + updated.slice(start + length);
  }
  return updated;
}
