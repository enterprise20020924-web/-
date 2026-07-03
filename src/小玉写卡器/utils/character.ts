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

function normalizeScriptNode(input: Partial<TavernHelperScriptNode> & { name: string; content: string }): TavernHelperScriptNode {
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

function upsertScript(scripts: TavernHelperScriptTreeNode[], nextScript: TavernHelperScriptNode): TavernHelperScriptTreeNode[] {
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

async function upsertCurrentCharacterScript(nextScript: TavernHelperScriptNode): Promise<void> {
  await updateCharacterWith('current', character => {
    ensureCharacterExtensions(character);
    character.extensions.tavern_helper.scripts = upsertScript(character.extensions.tavern_helper.scripts, nextScript);
    return character;
  });

  if (typeof updateScriptTreesWith === 'function') {
    await updateScriptTreesWith(scriptTrees => upsertScript(scriptTrees, nextScript), { type: 'character' });
  }
}

export async function installMvuSchemaScript(content: string): Promise<void> {
  await upsertCurrentCharacterScript(
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

export async function installMvuRuntimeScript(): Promise<void> {
  const runtimeScript = JSON.parse(mvuRuntimeScriptRaw) as Record<string, any>;
  await upsertCurrentCharacterScript(
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

export async function updateCurrentAvatar(file: File | null): Promise<void> {
  if (!file) return;
  await updateCharacterWith('current', character => {
    character.avatar = file;
    return character;
  });
}
