import { ARCHETYPES, canSelectArchetype } from '../constants';
import { Gender, type Archetype, type CharacterData } from '../types';

export type RegisteredIdentity = Archetype & { gender: Gender };

/** 校园身份数据库：统一索引现有身份、专属被动、永久加成与固定开局条件。 */
export const IDENTITY_DATABASE: Readonly<Record<string, RegisteredIdentity>> = Object.fromEntries(
  Object.entries(ARCHETYPES).flatMap(([gender, identities]) =>
    identities.map(identity => [identity.id, { ...identity, gender: gender as Gender }]),
  ),
);

export function getIdentityById(id: string | null | undefined): RegisteredIdentity | undefined {
  return id ? IDENTITY_DATABASE[id] : undefined;
}

export function getSelectedIdentity(data: Pick<CharacterData, 'name' | 'gender' | 'archetypeId'>) {
  const identity = getIdentityById(data.archetypeId);
  return identity && identity.gender === data.gender && canSelectArchetype(identity, data) ? identity : undefined;
}
