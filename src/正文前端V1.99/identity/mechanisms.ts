import { getIdentityById } from '../../性斗学园测试版/开局/data/identityDatabase';
import { getAmamiState, readAmamiState } from '../state/model';
import {
  normalizeCharacterRegistryName,
  resolveRegisteredCanonicalCharacterName,
} from '../engine/character-name-registry';
import { matchesUserIdentityName } from '../engine/user-identity';

export interface IdentityMechanismState {
  id: string;
}

type Data = { stat_data?: Record<string, any>; [key: string]: any };
const unwrap = (value: any) => (Array.isArray(value) ? value[0] : value);

/** 只保存身份 ID；羁绊值直接从 MVU 的当前好感度派生。 */
export function initializeIdentityState(data: Data, identityId: string) {
  getAmamiState(data).identity = { id: identityId };
  if (data.stat_data) {
    (data.stat_data.角色基础 ??= {}).身份 = getIdentityById(identityId)?.name ?? '泛泛之辈';
  }
}

/** 每次读取按当前关系表计算；升降、回退和 swipe 自然跟随 MVU，不维护另一份账本。 */
export function readIdentityMechanismMeters(data: Data, identityId = readAmamiState(data)?.identity?.id ?? '') {
  const relationships = unwrap(data.stat_data?.关系系统) ?? {};
  const playerName = String(unwrap(data.stat_data?.角色基础?._姓名 ?? data.stat_data?.角色基础?.姓名) ?? '').trim();
  return (getIdentityById(identityId)?.mechanisms ?? []).map(rule => {
    const qualified = new Set<string>();
    for (const [name, rawRelationship] of Object.entries(relationships)) {
      if (name === '在场人物' || ['{{user}}', '你', '我'].includes(name) || matchesUserIdentityName(name, playerName))
        continue;
      const affection = Number(unwrap(unwrap(rawRelationship)?.好感度));
      if (!Number.isFinite(affection) || affection < rule.threshold) continue;
      const character = normalizeCharacterRegistryName(resolveRegisteredCanonicalCharacterName(name) ?? name);
      if (character) qualified.add(character);
    }
    return {
      id: rule.id,
      name: rule.name,
      max: rule.max,
      description: rule.description,
      value: Math.min(rule.max, qualified.size * rule.gain),
    };
  });
}
