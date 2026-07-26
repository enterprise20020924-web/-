import mvuRuntimeScriptRaw from '../assets/酒馆助手脚本-MVU.json?raw';

interface TavernHelperScriptButton {
  name: string;
  visible: boolean;
}

interface TavernHelperScriptNode {
  type: 'script';
  enabled: boolean;
  name: string;
  id: string;
  content: string;
  info: string;
  button: {
    enabled: boolean;
    buttons: TavernHelperScriptButton[];
  };
  data: Record<string, any>;
}

type TavernHelperScriptTreeNode = TavernHelperScriptNode | Record<string, any>;
type CharacterScriptTreeOption = { type: 'character' };

declare function updateScriptTreesWith(
  updater:
    | ((scriptTrees: TavernHelperScriptTreeNode[]) => TavernHelperScriptTreeNode[])
    | ((scriptTrees: TavernHelperScriptTreeNode[]) => Promise<TavernHelperScriptTreeNode[]>),
  option: CharacterScriptTreeOption,
): Promise<TavernHelperScriptTreeNode[]>;

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureCharacterExtensions(character: Character): void {
  character.extensions ??= { regex_scripts: [], tavern_helper: { scripts: [], variables: {} } };
  character.extensions.regex_scripts ??= [];
  character.extensions.tavern_helper ??= { scripts: [], variables: {} };
  character.extensions.tavern_helper.scripts ??= [];
  character.extensions.tavern_helper.variables ??= {};
}

export function isReservedCharacterName(characterName: string): boolean {
  return characterName.trim().replace(/\s+/gu, ' ').toLowerCase() === 'sillytavern system';
}

function normalizeCharacterName(characterName: string): string {
  const name = characterName.trim();
  if (!name) throw new Error('角色卡名称不能为空');
  if (name === 'current') throw new Error('角色卡名称不能是 current');
  if (isReservedCharacterName(name)) {
    throw new Error('SillyTavern System 是欢迎页的系统占位角色，请填写一个新的角色卡名称');
  }
  return name;
}

const alternateGreetingCompatibilityPlaceholder = '\u200B';
const characterOperationRetryLimit = 3;

function isAbortLikeError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error instanceof Error && error.name === 'AbortError') return true;
  const message = error instanceof Error ? error.message : String(error);
  return /(?:operation was aborted|request was aborted|\baborted\b)/iu.test(message);
}

function waitForCharacterRetry(attempt: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, 350 * attempt));
}

async function retryInterruptedCharacterOperation<T>(label: string, operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= characterOperationRetryLimit; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isAbortLikeError(error)) throw error;
      lastError = error;
      console.warn(`[一键角色卡写卡器] ${label}被中止，准备重试（${attempt}/${characterOperationRetryLimit}）`, error);
      if (attempt < characterOperationRetryLimit) await waitForCharacterRetry(attempt);
    }
  }

  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`${label}连续被本地酒馆中止，请确认页面没有刷新或断开后重试（原始错误：${detail}）`);
}

async function refreshCharacterList(): Promise<void> {
  await retryInterruptedCharacterOperation('刷新角色列表', () => SillyTavern.getCharacters());
}

async function createCompatibleCharacter(name: string): Promise<boolean> {
  let lastAbortError: unknown;

  for (let attempt = 1; attempt <= characterOperationRetryLimit; attempt += 1) {
    if (getCharacterNames().includes(name)) return true;

    try {
      return await createCharacter(name, { first_messages: ['', alternateGreetingCompatibilityPlaceholder] });
    } catch (error) {
      if (!isAbortLikeError(error)) throw error;
      lastAbortError = error;
      console.warn(
        `[一键角色卡写卡器] 创建角色卡被中止，正在确认服务器是否已经创建（${attempt}/${characterOperationRetryLimit}）`,
        error,
      );
      await waitForCharacterRetry(attempt);
      try {
        await refreshCharacterList();
      } catch (refreshError) {
        if (!isAbortLikeError(refreshError)) throw refreshError;
      }
      if (getCharacterNames().includes(name)) return true;
    }
  }

  const detail = lastAbortError instanceof Error ? lastAbortError.message : String(lastAbortError);
  throw new Error(`创建角色卡连续被本地酒馆中止，请确认页面没有刷新或断开后重试（原始错误：${detail}）`);
}

export async function ensureCharacterDataCompatible(characterName: string): Promise<void> {
  const name = normalizeCharacterName(characterName);
  let characterIndex = SillyTavern.characters.findIndex(character => character.name === name);
  if (characterIndex < 0) {
    await refreshCharacterList();
    characterIndex = SillyTavern.characters.findIndex(character => character.name === name);
  }
  if (characterIndex < 0) throw new Error(`角色卡不存在：${name}`);

  let rawCharacter = SillyTavern.characters[characterIndex] as SillyTavern.v1CharData & {
    shallow?: boolean;
    data?: Partial<SillyTavern.v2CharData>;
  };
  if (Array.isArray(rawCharacter.data?.alternate_greetings)) return;

  await retryInterruptedCharacterOperation('读取角色卡详情', () =>
    SillyTavern.unshallowCharacter(String(characterIndex)),
  );
  characterIndex = SillyTavern.characters.findIndex(character => character.name === name);
  if (characterIndex < 0) throw new Error(`读取详情后角色卡从列表中消失：${name}`);
  rawCharacter = SillyTavern.characters[characterIndex] as SillyTavern.v1CharData & {
    shallow?: boolean;
    data?: Partial<SillyTavern.v2CharData>;
  };
  rawCharacter.data ??= {};
  const currentGreetings = rawCharacter.data.alternate_greetings;
  if (Array.isArray(currentGreetings)) return;

  const normalizedGreetings = typeof currentGreetings === 'string' && currentGreetings.trim() ? [currentGreetings] : [];
  const persistedGreetings =
    normalizedGreetings.length > 0 ? normalizedGreetings : [alternateGreetingCompatibilityPlaceholder];
  rawCharacter.data.alternate_greetings = persistedGreetings;

  const firstMessage = rawCharacter.first_mes ?? rawCharacter.data.first_mes ?? '';
  await retryInterruptedCharacterOperation('补全角色卡兼容字段', () =>
    replaceCharacter(name, { first_messages: [firstMessage, ...persistedGreetings] }, { render: 'none' }),
  );

  const refreshedCharacter = SillyTavern.characters.find(character => character.name === name) as
    | (SillyTavern.v1CharData & { data?: Partial<SillyTavern.v2CharData> })
    | undefined;
  if (refreshedCharacter) {
    refreshedCharacter.data ??= {};
    if (!Array.isArray(refreshedCharacter.data.alternate_greetings)) {
      refreshedCharacter.data.alternate_greetings = persistedGreetings;
    }
  }
}

export async function ensureTargetCharacter(
  characterName: string,
  avatar: File | null,
): Promise<{ name: string; created: boolean }> {
  const name = normalizeCharacterName(characterName);
  const exists = getCharacterNames().includes(name);
  let created = false;

  if (!exists) {
    created = await createCompatibleCharacter(name);
    await ensureCharacterDataCompatible(name);
    if (!created) {
      try {
        await getCharacter(name);
      } catch {
        throw new Error(`创建角色卡失败：${name}`);
      }
    }
  } else {
    await ensureCharacterDataCompatible(name);
  }

  await updateTargetAvatar(name, avatar);
  return { name, created };
}

function normalizeScriptNode(
  input: Partial<TavernHelperScriptNode> & { name: string; content: string },
): TavernHelperScriptNode {
  return {
    type: input.type ?? 'script',
    enabled: true,
    name: input.name,
    id: input.id ?? randomId('qz-character-script'),
    content: input.content,
    info: input.info ?? '',
    button: {
      enabled: input.button?.enabled ?? true,
      buttons: input.button?.buttons ?? [],
    },
    data: input.data ?? {},
  };
}

function findScriptIndex(scripts: TavernHelperScriptTreeNode[], nextScript: TavernHelperScriptNode): number {
  return scripts.findIndex(script => {
    if (script.type !== 'script' && !script.name) return false;
    const name = String(script.name ?? script.scriptName ?? '');
    return script.id === nextScript.id || name.toLowerCase() === nextScript.name.toLowerCase();
  });
}

function upsertScript(
  scripts: TavernHelperScriptTreeNode[],
  nextScript: TavernHelperScriptNode,
): TavernHelperScriptTreeNode[] {
  const nextScripts = [...scripts];
  const existingIndex = findScriptIndex(nextScripts, nextScript);

  if (existingIndex >= 0) {
    nextScripts[existingIndex] = normalizeScriptNode({
      ...nextScripts[existingIndex],
      ...nextScript,
      name: nextScript.name,
      content: nextScript.content,
      enabled: true,
    });
  } else {
    nextScripts.push(nextScript);
  }

  return nextScripts;
}

async function upsertCharacterScript(characterName: string, nextScript: TavernHelperScriptNode): Promise<void> {
  const name = normalizeCharacterName(characterName);
  await ensureCharacterDataCompatible(name);
  await updateCharacterWith(name, character => {
    ensureCharacterExtensions(character);
    character.extensions.tavern_helper.scripts = upsertScript(character.extensions.tavern_helper.scripts, nextScript);
    return character;
  });

  if (getCurrentCharacterName() === name && typeof updateScriptTreesWith === 'function') {
    await updateScriptTreesWith(scriptTrees => upsertScript(scriptTrees, nextScript), { type: 'character' });
  }
}

export async function installMvuSchemaScript(characterName: string, content: string): Promise<void> {
  await upsertCharacterScript(
    characterName,
    normalizeScriptNode({
      name: '变量结构',
      id: randomId('qz-mvu-schema'),
      content,
      info: '自动生成的 MVU 变量结构脚本。',
      button: { enabled: true, buttons: [] },
      data: {},
    }),
  );
}

export async function installMvuRuntimeScript(characterName: string): Promise<void> {
  const runtimeScript = JSON.parse(mvuRuntimeScriptRaw) as Record<string, any>;
  await upsertCharacterScript(
    characterName,
    normalizeScriptNode({
      type: runtimeScript.type ?? 'script',
      name: String(runtimeScript.name ?? 'MVU'),
      id: runtimeScript.id ?? randomId('qz-mvu-runtime'),
      content: runtimeScript.content ?? '',
      info: runtimeScript.info ?? '',
      button: runtimeScript.button ?? { enabled: true, buttons: [] },
      data: runtimeScript.data ?? {},
    }),
  );
}

export async function updateTargetAvatar(characterName: string, file: File | null): Promise<void> {
  if (!file) return;
  const name = normalizeCharacterName(characterName);
  await ensureCharacterDataCompatible(name);
  const fileBuffer = await retryInterruptedCharacterOperation('读取角色卡封面图片', () => file.arrayBuffer());
  const avatar = new Blob([fileBuffer], { type: file.type || 'image/png' });
  await retryInterruptedCharacterOperation('写入角色卡封面', async () => {
    const character = await getCharacter(name);
    character.avatar = avatar;
    await replaceCharacter(name, character, { render: 'immediate' });
  });
}

export async function openTargetCharacterCard(characterName: string): Promise<void> {
  const name = normalizeCharacterName(characterName);
  let characterIndex = -1;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    characterIndex = SillyTavern.characters.findIndex(character => character.name === name);
    if (characterIndex >= 0) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (characterIndex < 0) throw new Error(`已完成写入，但无法在角色列表中找到：${name}`);
  await SillyTavern.selectCharacterById(characterIndex, { switchMenu: true });
}

export async function updateFirstMessage(characterName: string, message: string): Promise<void> {
  const name = normalizeCharacterName(characterName);
  const content = message.trim();
  if (!content) throw new Error('开场白不能为空');
  await ensureCharacterDataCompatible(name);
  await updateCharacterWith(name, character => {
    const firstMessages = character.first_messages ?? [];
    character.first_messages = [content, ...firstMessages.slice(1)];
    return character;
  });
}
