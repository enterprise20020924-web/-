import {
  CHAT_ADMISSION_IDENTITY_VARIABLE_KEY,
  resolveAdmissionIdentity,
} from '../../性斗学园测试版/shared/admissionIdentity';
import { IDENTITY_DATABASE, getIdentityById } from '../../性斗学园测试版/开局/data/identityDatabase';
import { readAmamiState } from '../state/model';
import { hydrateAmamiState } from '../state/persistence';
import { readIdentityMechanismMeters } from './mechanisms';

export function resolvePlayerIdentityId(
  data: Record<string, any>,
  chatVariables: Record<string, unknown>,
): string | null {
  const rawIdentity = data.stat_data?.角色基础?.身份;
  const identityName = String((Array.isArray(rawIdentity) ? rawIdentity[0] : rawIdentity) ?? '').trim();
  if (identityName) {
    if (identityName === '魔法少女') return 'f_magic_girl';
    return (
      getIdentityById(identityName)?.id ??
      Object.values(IDENTITY_DATABASE).find(identity => identity.name === identityName)?.id ??
      ''
    );
  }
  const saved = readAmamiState(data)?.identity;
  if (saved) return saved.id;
  const legacy = resolveAdmissionIdentity(chatVariables);
  return legacy || Object.hasOwn(chatVariables, CHAT_ADMISSION_IDENTITY_VARIABLE_KEY) ? legacy : null;
}

/** 为旧楼层补入可见身份字段，只使用已保存的身份，不根据玩家姓名猜测。 */
export function syncPlayerIdentityVariable(data: Record<string, any>, chatVariables: Record<string, unknown>): boolean {
  const base = data.stat_data?.角色基础;
  if (!base) return false;
  const rawIdentity = Array.isArray(base.身份) ? base.身份[0] : base.身份;
  if (typeof rawIdentity === 'string' && rawIdentity.trim()) return false;
  const identityId = resolvePlayerIdentityId(data, chatVariables);
  if (identityId === null) return false;
  base.身份 = getIdentityById(identityId)?.name ?? '泛泛之辈';
  return true;
}

export function readPlayerIdentityId(messageId: number | 'latest', variableRevision = 0) {
  void variableRevision;
  const data = getVariables({ type: 'message', message_id: messageId });
  hydrateAmamiState(data, messageId);
  return resolvePlayerIdentityId(data, getVariables({ type: 'chat' }));
}

export function readPlayerIdentityMechanismMeters(messageId: number | 'latest', variableRevision = 0) {
  void variableRevision;
  const data = getVariables({ type: 'message', message_id: messageId });
  hydrateAmamiState(data, messageId);
  return readIdentityMechanismMeters(data, resolvePlayerIdentityId(data, getVariables({ type: 'chat' })) ?? '');
}
