import { activateUserPersona } from './userPersonaActivation';

export const CHAT_USER_INFO_VARIABLE_KEY = '性斗学园当前聊天用户信息';
export const CHAT_USER_PERSONA_NAME_VARIABLE_KEY = '性斗学园当前聊天用户人设名称';
export const XUEDOU_WORLDBOOK_NAME = '性斗学园';
export const USER_WORLDBOOK_ENTRY_NAME = 'user';
export const FALLBACK_SYNCED_USER_PERSONA_NAME = '性斗学园当前聊天用户';

const CHAT_VARIABLE_OPTION: VariableOption = { type: 'chat' };

function readVariables(option: VariableOption): Record<string, any> {
  try {
    const globalAny = window as any;
    if (typeof globalAny.getVariables === 'function') {
      return globalAny.getVariables(option) || {};
    }
  } catch (error) {
    console.warn('[性斗学园] 读取变量失败:', option, error);
  }

  return {};
}

function writeChatVariables(variables: Record<string, string>): boolean {
  try {
    const globalAny = window as any;
    if (typeof globalAny.insertOrAssignVariables === 'function') {
      globalAny.insertOrAssignVariables(variables, CHAT_VARIABLE_OPTION);
      return true;
    }
  } catch (error) {
    console.warn('[性斗学园] 写入聊天变量失败:', error);
  }

  return false;
}

function deleteChatVariable(variableKey: string): boolean {
  try {
    const globalAny = window as any;

    if (typeof globalAny.deleteVariable === 'function') {
      globalAny.deleteVariable(variableKey, CHAT_VARIABLE_OPTION);
      return true;
    }

    if (typeof globalAny.updateVariablesWith === 'function') {
      globalAny.updateVariablesWith((variables: Record<string, any>) => {
        delete variables[variableKey];
        return variables;
      }, CHAT_VARIABLE_OPTION);
      return true;
    }

    if (typeof globalAny.replaceVariables === 'function') {
      const variables = readVariables(CHAT_VARIABLE_OPTION);
      delete variables[variableKey];
      globalAny.replaceVariables(variables, CHAT_VARIABLE_OPTION);
      return true;
    }

    if (typeof globalAny.insertOrAssignVariables === 'function') {
      globalAny.insertOrAssignVariables({ [variableKey]: '' }, CHAT_VARIABLE_OPTION);
      return true;
    }
  } catch (error) {
    console.warn('[性斗学园] 清空聊天变量失败:', variableKey, error);
  }

  return false;
}

function getGlobalApi(name: string): unknown {
  const globalAny = window as any;
  return globalAny[name] || globalAny.TavernHelper?.[name];
}

type PersonaApi = {
  getPersonaNames: typeof getPersonaNames;
  getPersona: typeof getPersona;
  createPersona: typeof createPersona;
  updatePersonaWith: typeof updatePersonaWith;
};

function getPersonaApi(): PersonaApi | null {
  const getPersonaNamesApi = getGlobalApi('getPersonaNames');
  const getPersonaApi = getGlobalApi('getPersona');
  const createPersonaApi = getGlobalApi('createPersona');
  const updatePersonaWithApi = getGlobalApi('updatePersonaWith');

  if (
    typeof getPersonaNamesApi !== 'function' ||
    typeof getPersonaApi !== 'function' ||
    typeof createPersonaApi !== 'function' ||
    typeof updatePersonaWithApi !== 'function'
  ) {
    return null;
  }

  return {
    getPersonaNames: getPersonaNamesApi as typeof getPersonaNames,
    getPersona: getPersonaApi as typeof getPersona,
    createPersona: createPersonaApi as typeof createPersona,
    updatePersonaWith: updatePersonaWithApi as typeof updatePersonaWith,
  };
}

function normalizeUserPersonaName(name: string): string {
  const normalizedName = String(name || '').trim();
  if (!normalizedName || normalizedName.toLowerCase() === 'current' || normalizedName.startsWith('xuedou-player-')) {
    return '';
  }

  return normalizedName;
}

export function getCurrentChatUserInfo(): string {
  const value = readVariables(CHAT_VARIABLE_OPTION)[CHAT_USER_INFO_VARIABLE_KEY];
  return typeof value === 'string' ? value.trim() : '';
}

export function getCurrentChatUserPersonaName(): string {
  const value = readVariables(CHAT_VARIABLE_OPTION)[CHAT_USER_PERSONA_NAME_VARIABLE_KEY];
  return typeof value === 'string' ? normalizeUserPersonaName(value) : '';
}

export function saveCurrentChatUserInfo(userInfo: string, personaName = ''): boolean {
  const content = String(userInfo || '').trim();
  if (!content) {
    return false;
  }

  return writeChatVariables({
    [CHAT_USER_INFO_VARIABLE_KEY]: content,
    [CHAT_USER_PERSONA_NAME_VARIABLE_KEY]: normalizeUserPersonaName(personaName),
  });
}

export function clearCurrentChatUserPersonaName(): boolean {
  return deleteChatVariable(CHAT_USER_PERSONA_NAME_VARIABLE_KEY);
}

export function clearCurrentChatUserInfo(): boolean {
  const infoCleared = deleteChatVariable(CHAT_USER_INFO_VARIABLE_KEY);
  const personaNameCleared = deleteChatVariable(CHAT_USER_PERSONA_NAME_VARIABLE_KEY);
  return infoCleared || personaNameCleared;
}

async function setUserInfoWorldbookContent(
  userInfo: string,
  logPrefix = '[性斗学园]',
  allowEmpty = false,
): Promise<boolean> {
  const content = String(userInfo || '').trim();
  if (!allowEmpty && !content) {
    return false;
  }

  const globalAny = window as any;
  let worldbookUpdated = false;
  let userEntryUid: number | null = null;
  const actionText = content ? '更新' : '清空';

  try {
    if (typeof updateWorldbookWith === 'function') {
      let updatedByName = false;
      await updateWorldbookWith(
        XUEDOU_WORLDBOOK_NAME,
        (worldbook: any[]) => {
          const entry = worldbook.find((e: any) => e?.name === USER_WORLDBOOK_ENTRY_NAME);
          if (!entry) {
            return worldbook;
          }

          entry.content = content;
          const parsedUid = Number(entry.uid);
          if (Number.isFinite(parsedUid)) {
            userEntryUid = parsedUid;
          }
          updatedByName = true;
          return worldbook;
        },
        { render: 'immediate' },
      );

      if (updatedByName) {
        worldbookUpdated = true;
        console.info(`${logPrefix} 世界书 name=user 已通过 updateWorldbookWith ${actionText}`);
      }
    }

    if (typeof getWorldbook === 'function' && typeof replaceWorldbook === 'function') {
      const worldbook = await getWorldbook(XUEDOU_WORLDBOOK_NAME);
      const entry = worldbook.find((e: any) => e?.name === USER_WORLDBOOK_ENTRY_NAME);
      if (entry) {
        entry.content = content;
        const parsedUid = Number(entry.uid);
        if (Number.isFinite(parsedUid)) {
          userEntryUid = parsedUid;
        }
        await replaceWorldbook(XUEDOU_WORLDBOOK_NAME, worldbook, { render: 'immediate' });
        worldbookUpdated = true;
        console.info(`${logPrefix} 世界书 name=user 已直接${actionText}`);
      }
    }
  } catch (error) {
    console.warn(`${logPrefix} 直接访问世界书失败:`, error);
  }

  if (!worldbookUpdated && content) {
    if ((userEntryUid === null || !Number.isFinite(userEntryUid)) && typeof getWorldbook === 'function') {
      try {
        const worldbook = await getWorldbook(XUEDOU_WORLDBOOK_NAME);
        const entry = worldbook.find((e: any) => e?.name === USER_WORLDBOOK_ENTRY_NAME);
        const parsedUid = Number(entry?.uid);
        if (Number.isFinite(parsedUid)) {
          userEntryUid = parsedUid;
        }
      } catch (error) {
        console.warn(`${logPrefix} 获取 name=user 条目 uid 失败:`, error);
      }
    }

    if (userEntryUid === null || !Number.isFinite(userEntryUid)) {
      console.warn(`${logPrefix} 未找到世界书 name=user 条目，无法通过 slash 更新`);
    } else {
      const command = `/setentryfield file=${XUEDOU_WORLDBOOK_NAME} uid=${userEntryUid} field=content ${content}`;

      try {
        if (typeof triggerSlash === 'function') {
          await triggerSlash(command);
          worldbookUpdated = true;
          console.info(`${logPrefix} 已通过 triggerSlash 更新世界书 name=user`);
        }
      } catch (error) {
        console.warn(`${logPrefix} triggerSlash 执行失败:`, error);
      }

      if (!worldbookUpdated) {
        const executors = [
          () => globalAny.SillyTavern?.executeSlashCommand?.(command),
          () => globalAny.executeSlashCommand?.(command),
          () => globalAny.SillyTavern?.processSlashCommand?.(command),
          () => globalAny.parent?.SillyTavern?.executeSlashCommand?.(command),
          () => globalAny.parent?.executeSlashCommand?.(command),
        ];

        for (const executor of executors) {
          try {
            const result = await executor();
            if (result !== undefined && result !== false) {
              worldbookUpdated = true;
              console.info(`${logPrefix} 已通过 slash 命令执行器更新世界书 name=user`);
              break;
            }
          } catch {
            continue;
          }
        }
      }
    }
  }

  if (!worldbookUpdated) {
    console.warn(`${logPrefix} 无法自动${actionText}世界书 name=user`);
  }

  return worldbookUpdated;
}

function cleanupExtractedPersonaName(value: string): string {
  return normalizeUserPersonaName(
    String(value || '')
      .replace(/<\/?[^>]+>/g, '')
      .replace(/\s+(年龄|性别|身高|模式|难度)[:：].*$/u, '')
      .replace(/[，,；;。].*$/u, '')
      .trim(),
  );
}

export function extractUserPersonaNameFromUserInfo(userInfo: string): string {
  const content = String(userInfo || '');
  const namePatterns = [/(?:^|\n)\s*姓名\s*[:：]\s*([^\n\r<]+)/u, /(?:^|\n)\s*名字\s*[:：]\s*([^\n\r<]+)/u];

  for (const pattern of namePatterns) {
    const matchedName = cleanupExtractedPersonaName(pattern.exec(content)?.[1] || '');
    if (matchedName) {
      return matchedName;
    }
  }

  return '';
}

function resolveUserPersonaNameForSync(userInfo: string, personaName = ''): string {
  return (
    normalizeUserPersonaName(personaName) ||
    getCurrentChatUserPersonaName() ||
    extractUserPersonaNameFromUserInfo(userInfo) ||
    FALLBACK_SYNCED_USER_PERSONA_NAME
  );
}

function normalizePersonaDescription(value: string): string {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .trim();
}

async function writePersonaDescription(api: PersonaApi, personaName: string, description: string): Promise<void> {
  await api.updatePersonaWith(
    personaName,
    persona => ({
      ...persona,
      name: personaName,
      title: personaName,
      description,
    }),
    { render: 'immediate' },
  );
}

export async function writeUserInfoToPersona(
  userInfo: string,
  personaName = '',
  logPrefix = '[性斗学园]',
): Promise<boolean> {
  const content = String(userInfo || '').trim();
  if (!content) {
    return false;
  }

  const api = getPersonaApi();
  if (!api) {
    console.warn(`${logPrefix} 当前酒馆助手没有暴露用户人设管理接口，无法同步当前聊天用户信息`);
    return false;
  }

  const resolvedPersonaName = resolveUserPersonaNameForSync(content, personaName);
  const matchCount = api
    .getPersonaNames()
    .filter(item => normalizeUserPersonaName(item) === resolvedPersonaName).length;

  if (matchCount > 1) {
    console.warn(`${logPrefix} 酒馆中存在多个名为「${resolvedPersonaName}」的用户人设，无法安全自动覆盖`);
    return false;
  }

  const personaPayload = {
    name: resolvedPersonaName,
    title: resolvedPersonaName,
    description: content,
  };

  try {
    if (matchCount === 0) {
      const created = await api.createPersona(resolvedPersonaName, personaPayload, { render: 'none' });
      if (!created) {
        console.warn(`${logPrefix} 创建用户人设「${resolvedPersonaName}」失败`);
        return false;
      }
    }

    await writePersonaDescription(api, resolvedPersonaName, content);

    const savedPersona = api.getPersona(resolvedPersonaName);
    const expectedDescription = normalizePersonaDescription(content);
    const savedDescription = normalizePersonaDescription(savedPersona?.description || '');
    if (savedDescription !== expectedDescription) {
      console.warn(
        `${logPrefix} 用户人设「${resolvedPersonaName}」写入后读回校验失败：酒馆保存的 description 长度 ${savedDescription.length}，本次应写入 ${expectedDescription.length}`,
      );
      return false;
    }

    const activated = await activateUserPersona(resolvedPersonaName);
    if (!activated) {
      console.warn(`${logPrefix} 用户人设「${resolvedPersonaName}」已写入，但自动启用失败`);
      return false;
    }

    saveCurrentChatUserInfo(content, resolvedPersonaName);
    console.info(`${logPrefix} 当前聊天用户信息已同步到酒馆用户人设「${resolvedPersonaName}」并启用`);
    return true;
  } catch (error) {
    console.warn(`${logPrefix} 同步当前聊天用户信息到酒馆用户人设失败:`, error);
    return false;
  }
}

export async function writeUserInfoToWorldbook(userInfo: string, logPrefix = '[性斗学园]'): Promise<boolean> {
  return setUserInfoWorldbookContent(userInfo, logPrefix, false);
}

export async function clearUserInfoWorldbook(logPrefix = '[性斗学园]'): Promise<boolean> {
  return setUserInfoWorldbookContent('', logPrefix, true);
}

export async function syncCurrentChatUserInfoToWorldbook(logPrefix = '[性斗学园]'): Promise<boolean> {
  const userInfo = getCurrentChatUserInfo();
  if (!userInfo) {
    console.info(`${logPrefix} 当前聊天没有保存用户信息，跳过同步世界书 user 条目`);
    return false;
  }

  return writeUserInfoToWorldbook(userInfo, logPrefix);
}

export async function syncCurrentChatUserInfoToPersona(logPrefix = '[性斗学园]'): Promise<boolean> {
  const userInfo = getCurrentChatUserInfo();
  if (!userInfo) {
    console.info(`${logPrefix} 当前聊天没有保存用户信息，跳过同步酒馆用户人设`);
    await clearUserInfoWorldbook(logPrefix);
    return false;
  }

  const personaSynced = await writeUserInfoToPersona(userInfo, getCurrentChatUserPersonaName(), logPrefix);
  if (!personaSynced) {
    return false;
  }

  const worldbookCleared = await clearUserInfoWorldbook(logPrefix);
  if (!worldbookCleared) {
    console.warn(`${logPrefix} 当前聊天用户人设已启用，但世界书 user 条目清空失败`);
  }

  return true;
}
