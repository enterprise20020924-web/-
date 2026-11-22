export const CHAT_ADMISSION_IDENTITY_VARIABLE_KEY = '性斗学园当前聊天身份';

/** Identity belongs to this chat, independently of the player's editable name. */
export function resolveAdmissionIdentity(variables: Record<string, unknown>): string {
  if (Object.hasOwn(variables, CHAT_ADMISSION_IDENTITY_VARIABLE_KEY)) {
    const identity = variables[CHAT_ADMISSION_IDENTITY_VARIABLE_KEY];
    return typeof identity === 'string' ? identity : '';
  }
  // Existing admissions already saved their selected identity in the user-info block.
  const info = variables['性斗学园当前聊天用户信息'];
  const name = typeof info === 'string' ? info.match(/【校园身份】\s*类型[：:][ \t]*([^\r\n]+)/)?.[1].trim() : '';
  return name === '黑皮辣妹' ? 'f_gyaru' : name === '魔法少女' || name === '魔装影姬' ? 'f_magic_girl' : '';
}
