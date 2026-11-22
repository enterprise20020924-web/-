import { normalizeCharacterRegistryName, resolveRegisteredCanonicalCharacterName } from './character-name-registry';

/** 玩家姓名独立于 NPC 别名；只有玩家本名就是已登记全名时，才接受该人物的简称。 */
export function matchesUserIdentityName(speakerName: string, userName: string) {
  const normalizedSpeaker = normalizeCharacterRegistryName(speakerName);
  const normalizedUser = normalizeCharacterRegistryName(userName);
  if (normalizedSpeaker.length === 0 || normalizedUser.length === 0) return false;
  if (normalizedSpeaker === normalizedUser) return true;

  const registeredUser = resolveRegisteredCanonicalCharacterName(userName);
  return (
    registeredUser !== null &&
    normalizeCharacterRegistryName(registeredUser) === normalizedUser &&
    resolveRegisteredCanonicalCharacterName(speakerName) === registeredUser
  );
}
