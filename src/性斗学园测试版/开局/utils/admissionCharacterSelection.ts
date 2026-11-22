import type { PlayerPresetSummary } from '../../shared/playerPresetStore';
import { getAvailableArchetypes, MAGIC_GIRL_ARCHETYPE_ID, MAGIC_GIRL_DEFAULT_NAME } from '../constants';
import { Gender, INITIAL_CHARACTER_DATA, type CharacterData } from '../types';
import { applyIdentityStartingAttributes } from './identityStartingAttributes';
import { hasInitializedUserProfile } from './userProfile';

export type AdmissionGender = Gender.MALE | Gender.FEMALE;

export type AdmissionCharacterCard =
  | { kind: 'custom'; key: string; position: number }
  | {
      kind: 'identity';
      key: string;
      position: number;
      archetypeId: string;
      name: string;
      characterName?: string;
      preset?: PlayerPresetSummary;
    }
  | { kind: 'empty'; key: string; position: number };

export interface AdmissionIdentityChoice {
  gender: AdmissionGender;
  archetypeId: string;
  presetName?: string;
  characterName?: string;
}

export function createAdmissionCharacterDeck(
  presets: PlayerPresetSummary[],
  gender: AdmissionGender,
): AdmissionCharacterCard[] {
  const cards: AdmissionCharacterCard[] = [{ kind: 'custom', key: 'custom', position: 1 }];
  const availablePresets = filterAdmissionPresets(presets, gender);
  const isShizuyaPreset = (preset: PlayerPresetSummary) =>
    preset.archetypeId === MAGIC_GIRL_ARCHETYPE_ID ||
    (!preset.archetypeId && (preset.characterName || preset.name) === MAGIC_GIRL_DEFAULT_NAME);
  const legacyPresets = availablePresets.filter(preset => !preset.archetypeId && !isShizuyaPreset(preset));
  if (gender === Gender.FEMALE) {
    cards.push({
      kind: 'identity',
      key: MAGIC_GIRL_ARCHETYPE_ID,
      position: 2,
      archetypeId: MAGIC_GIRL_ARCHETYPE_ID,
      name: MAGIC_GIRL_DEFAULT_NAME,
      characterName: MAGIC_GIRL_DEFAULT_NAME,
      preset: availablePresets.find(isShizuyaPreset),
    });
  }
  getAvailableArchetypes({ name: '', gender }).forEach(archetype => {
    if (archetype.id === MAGIC_GIRL_ARCHETYPE_ID) return;
    cards.push({
      kind: 'identity',
      key: archetype.id,
      position: cards.length + 1,
      archetypeId: archetype.id,
      name: archetype.name,
      preset: availablePresets.find(preset => preset.archetypeId === archetype.id) ?? legacyPresets.shift(),
    });
  });
  if (gender === Gender.FEMALE) {
    // 先完成旧预设与身份的对应，再调整展示位置，避免换位后串用预设。
    const featured = new Map(
      ['custom', MAGIC_GIRL_ARCHETYPE_ID, 'f_gyaru', 'f_chuuni', 'f_bimbo', 'f_mesugaki'].map((key, index) => [
        key,
        index,
      ]),
    );
    cards.sort((left, right) => (featured.get(left.key) ?? cards.length) - (featured.get(right.key) ?? cards.length));
    cards.forEach((card, index) => {
      card.position = index + 1;
    });
  }
  return cards;
}

export function getAdmissionCharacterPage(cards: AdmissionCharacterCard[], requestedPage: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(cards.length / pageSize));
  const index = Math.max(0, Math.min(requestedPage, pageCount - 1));
  const visibleCards = cards.slice(index * pageSize, (index + 1) * pageSize);
  // Keep the final row complete without adding selectable or persisted records.
  while (visibleCards.length < pageSize) {
    const position = index * pageSize + visibleCards.length + 1;
    visibleCards.push({ kind: 'empty', key: `padding:${position}`, position });
  }
  return { index, pageCount, cards: visibleCards };
}

export function filterAdmissionPresets(presets: PlayerPresetSummary[], gender: AdmissionGender) {
  return presets.filter(preset => {
    const presetGender = preset.gender ?? INITIAL_CHARACTER_DATA.gender;
    return presetGender === gender || presetGender === Gender.OTHER;
  });
}

export function cloneAdmissionCharacter(data: CharacterData): CharacterData {
  return JSON.parse(JSON.stringify(data)) as CharacterData;
}

export function createCustomAdmissionCharacter(gender: AdmissionGender): CharacterData {
  return {
    ...cloneAdmissionCharacter(INITIAL_CHARACTER_DATA),
    gender,
    configFeatures: {
      hasBreasts: gender === Gender.FEMALE,
      hasPenis: gender === Gender.MALE,
    },
  };
}

export function createAdmissionIdentityCharacter(
  choice: AdmissionIdentityChoice,
  source?: CharacterData,
): CharacterData {
  const data = source ? cloneAdmissionCharacter(source) : createCustomAdmissionCharacter(choice.gender);
  const identity = getAvailableArchetypes({ name: data.name, gender: choice.gender }).find(
    archetype => archetype.id === choice.archetypeId,
  );
  const profile =
    source && hasInitializedUserProfile(source, choice.archetypeId) ? source.userProfile : identity?.userProfile;
  return applyIdentityStartingAttributes(
    {
      ...data,
      userProfile: profile ? { ...profile } : data.userProfile,
      userProfilePresetId: identity?.userProfile ? choice.archetypeId : undefined,
      name: source
        ? data.name
        : choice.archetypeId === MAGIC_GIRL_ARCHETYPE_ID
          ? (choice.characterName ?? MAGIC_GIRL_DEFAULT_NAME)
          : (choice.characterName ?? identity?.defaultName ?? data.name),
      age: source?.age ?? identity?.defaultAge ?? data.age,
      height: source?.height ?? identity?.defaultHeight ?? data.height,
      gender: choice.gender,
      archetypeId: choice.archetypeId,
      configFeatures: {
        hasBreasts: choice.gender === Gender.FEMALE,
        hasPenis: choice.gender === Gender.MALE,
      },
    },
    source,
  );
}
