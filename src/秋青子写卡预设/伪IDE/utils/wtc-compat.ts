type WtcWorldbookNode = {
  path: string;
  exists: boolean;
  kind: 'worldbook-entry';
  worldbookName: string;
  entryPath: string;
  entry?: WorldbookEntry;
};

type WtcCharacterScriptNode = {
  path: string;
  exists: boolean;
  kind: 'character-script';
  characterName: string;
  scriptName: string;
  script?: Script;
};

type WtcFileNode = WtcWorldbookNode | WtcCharacterScriptNode;

type WorldbookEntryWithComment = WorldbookEntry & { comment?: string };

function asEntryWithComment(entry: WorldbookEntry): WorldbookEntryWithComment {
  return entry as WorldbookEntryWithComment;
}

export function normalizeVirtualPath(path: string): string | null {
  const normalized = path.replace(/\\/g, '/').replace(/\/+/g, '/').trim();
  if (!normalized.startsWith('/')) return null;
  const segments = normalized.split('/').filter(Boolean);
  if (!['Worldbooks', 'Characters', 'Presets', 'Schemas'].includes(segments[0] ?? '')) return null;
  return `/${segments.join('/')}`;
}

function parseWorldbookPath(path: string) {
  const normalized = normalizeVirtualPath(path);
  if (!normalized) return null;
  const segments = normalized.split('/').filter(Boolean);
  if (segments[0] !== 'Worldbooks' || !segments[1] || segments.length < 3) return null;
  return {
    normalized,
    worldbookName: segments[1],
    entryPath: segments.slice(2).join('/'),
  };
}

function resolveCharacterPathName(name: string): LiteralUnion<'current', string> | null {
  const current = getCurrentCharacterName();
  if (name === 'current') return current ? 'current' : null;
  if (current && name === current) return 'current';
  return name;
}

function parseCharacterScriptPath(path: string) {
  const normalized = normalizeVirtualPath(path);
  if (!normalized) return null;
  const segments = normalized.split('/').filter(Boolean);
  if (segments[0] !== 'Characters' || !segments[1] || segments[2]?.toLowerCase() !== 'scripts' || segments.length < 4) {
    return null;
  }

  const characterName = resolveCharacterPathName(segments[1]);
  const scriptName = segments.slice(3).join('/');
  if (!characterName || !scriptName) return null;

  return {
    normalized,
    characterName,
    scriptName,
  };
}

function characterScriptApiAvailable(): boolean {
  return typeof getScriptTrees === 'function' && typeof updateScriptTreesWith === 'function';
}

function currentCharacterScriptTargetAvailable(name: string): boolean {
  try {
    const current = getCurrentCharacterName();
    return characterScriptApiAvailable() && name === 'current' && Boolean(current);
  } catch {
    return false;
  }
}

function entryMatches(worldbookName: string, entryPath: string, entry: WorldbookEntry) {
  const entryWithComment = asEntryWithComment(entry);
  const comment = normalizeVirtualPath(`/Worldbooks/${worldbookName}/${entryWithComment.comment ?? ''}`);
  const name = normalizeVirtualPath(`/Worldbooks/${worldbookName}/${entry.name ?? ''}`);
  return comment === `/Worldbooks/${worldbookName}/${entryPath}` || name === `/Worldbooks/${worldbookName}/${entryPath}`;
}

function getCurrentCharacterScriptTrees(): ScriptTree[] {
  return getScriptTrees({ type: 'character' });
}

function someCharacterScript(trees: ScriptTree[], predicate: (script: Script) => boolean): boolean {
  return trees.some(item => {
    if (item.type === 'script') return predicate(item);
    if (item.type === 'folder') return item.scripts.some(predicate);
    return false;
  });
}

function findCharacterScript(trees: ScriptTree[], scriptName: string): Script | undefined {
  for (const item of trees) {
    if (item.type === 'script' && item.name === scriptName) return item;
    if (item.type === 'folder') {
      const found = item.scripts.find(script => script.name === scriptName);
      if (found) return found;
    }
  }
  return undefined;
}

function makeScriptId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'script';
  return `mingyue-${slug}-${Date.now().toString(36)}`;
}

function defaultCharacterScript(name: string, content: string): Script {
  return {
    type: 'script',
    enabled: true,
    name,
    id: makeScriptId(name),
    content,
    info: '由三明月 IDE 写入',
    button: {
      enabled: false,
      buttons: [],
    },
    data: {},
  };
}

function upsertCharacterScript(trees: ScriptTree[], scriptName: string, content: string): ScriptTree[] {
  let updated = false;
  const nextTrees = trees.map(item => {
    if (item.type === 'script' && item.name === scriptName) {
      updated = true;
      return { ...item, enabled: true, content };
    }
    if (item.type === 'folder') {
      let folderUpdated = false;
      const scripts = item.scripts.map(script => {
        if (script.name !== scriptName) return script;
        updated = true;
        folderUpdated = true;
        return { ...script, enabled: true, content };
      });
      return folderUpdated ? { ...item, scripts } : item;
    }
    return item;
  });

  return updated ? nextTrees : [...nextTrees, defaultCharacterScript(scriptName, content)];
}

function defaultEntry(name: string, content: string): Partial<WorldbookEntry> & { comment?: string } {
  return {
    name,
    comment: name,
    enabled: true,
    strategy: {
      type: 'constant',
      keys: [],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'before_character_definition',
      role: 'system',
      depth: 0,
      order: 100,
    },
    content,
    probability: 100,
    recursion: {
      prevent_incoming: false,
      prevent_outgoing: false,
      delay_until: null,
    },
    effect: {
      sticky: null,
      cooldown: null,
      delay: null,
    },
  };
}

export async function createLorebookAction(input: { lorebook_name: string }) {
  const name = input.lorebook_name.trim();
  if (!name) throw new Error('世界书名称不能为空。');
  if (getWorldbookNames().includes(name)) {
    return { lorebook_name: name, created: false };
  }
  await createWorldbook(name, []);
  return { lorebook_name: name, created: true };
}

export async function resolveFileNode(path: string): Promise<WtcFileNode | null> {
  const parsed = parseWorldbookPath(path);
  if (parsed) {
    if (!getWorldbookNames().includes(parsed.worldbookName)) return null;
    const worldbook = await getWorldbook(parsed.worldbookName);
    const entry = worldbook.find(item => entryMatches(parsed.worldbookName, parsed.entryPath, item));
    if (!entry) return null;
    return { path: parsed.normalized, exists: true, kind: 'worldbook-entry', worldbookName: parsed.worldbookName, entryPath: parsed.entryPath, entry };
  }

  const scriptPath = parseCharacterScriptPath(path);
  if (!scriptPath || !currentCharacterScriptTargetAvailable(scriptPath.characterName)) return null;
  try {
    const script = findCharacterScript(getCurrentCharacterScriptTrees(), scriptPath.scriptName);
    if (!script) return null;
    return {
      path: scriptPath.normalized,
      exists: true,
      kind: 'character-script',
      characterName: scriptPath.characterName,
      scriptName: scriptPath.scriptName,
      script,
    };
  } catch {
    return null;
  }
}

export async function resolveWritableFileNode(path: string): Promise<WtcFileNode | null> {
  const parsed = parseWorldbookPath(path);
  if (parsed) {
    if (!getWorldbookNames().includes(parsed.worldbookName)) return null;
    const existing = await resolveFileNode(path);
    return existing ?? { path: parsed.normalized, exists: false, kind: 'worldbook-entry', worldbookName: parsed.worldbookName, entryPath: parsed.entryPath };
  }

  const scriptPath = parseCharacterScriptPath(path);
  if (!scriptPath || !currentCharacterScriptTargetAvailable(scriptPath.characterName)) return null;
  const existing = await resolveFileNode(path);
  return existing ?? {
    path: scriptPath.normalized,
    exists: false,
    kind: 'character-script',
    characterName: scriptPath.characterName,
    scriptName: scriptPath.scriptName,
  };
}

export async function hasCharacterScriptContent(path: string, contentNeedle: string): Promise<boolean> {
  const scriptPath = parseCharacterScriptPath(path);
  if (!scriptPath || !contentNeedle || !currentCharacterScriptTargetAvailable(scriptPath.characterName)) return false;
  return someCharacterScript(getCurrentCharacterScriptTrees(), script => script.content.includes(contentNeedle));
}

export function isAttributeNode(node: WtcFileNode | null): node is WtcWorldbookNode {
  return node?.kind === 'worldbook-entry';
}

export function applyWorldbookPatch(entry: WorldbookEntry, attributes: Record<string, unknown>): WorldbookEntry {
  return _.merge({}, entry, attributes) as WorldbookEntry;
}

export async function writeAction(input: { file_path: string; content: string }) {
  const parsed = parseWorldbookPath(input.file_path);
  if (parsed) {
    if (!getWorldbookNames().includes(parsed.worldbookName)) {
      await createWorldbook(parsed.worldbookName, []);
    }

    let written: WorldbookEntry | undefined;
    await updateWorldbookWith(parsed.worldbookName, worldbook => {
      const index = worldbook.findIndex(entry => entryMatches(parsed.worldbookName, parsed.entryPath, entry));
      if (index >= 0) {
        return worldbook.map((entry, entryIndex) => {
          if (entryIndex !== index) return entry;
          written = { ...entry, content: input.content };
          return written;
        });
      }

      return [...worldbook, defaultEntry(parsed.entryPath, input.content)];
    });

    return { file_path: parsed.normalized, entry: written ?? parsed.entryPath };
  }

  const scriptPath = parseCharacterScriptPath(input.file_path);
  if (!scriptPath) throw new Error('当前只支持写入 /Worldbooks/<世界书>/<条目路径> 或 /Characters/<角色>/Scripts/<脚本名>。');
  if (!currentCharacterScriptTargetAvailable(scriptPath.characterName)) {
    throw new Error('当前没有打开角色卡，或酒馆助手角色脚本库接口不可用。');
  }

  await updateScriptTreesWith(
    trees => upsertCharacterScript(trees, scriptPath.scriptName, input.content),
    { type: 'character' },
  );

  return { file_path: scriptPath.normalized, script: scriptPath.scriptName };
}

export async function setAttributeAction(input: { file_path: string; attributes?: Record<string, unknown> }) {
  const parsed = parseWorldbookPath(input.file_path);
  if (!parsed) throw new Error('当前只支持设置 /Worldbooks/<世界书>/<条目路径> 属性。');
  if (!input.attributes) throw new Error('缺少 attributes。');

  let updated: WorldbookEntry | undefined;
  await updateWorldbookWith(parsed.worldbookName, worldbook => {
    const matches = worldbook.filter(entry => entryMatches(parsed.worldbookName, parsed.entryPath, entry));
    if (matches.length !== 1) return worldbook;
    const targetUid = matches[0].uid;
    return worldbook.map(entry => {
      if (entry.uid !== targetUid) return entry;
      updated = applyWorldbookPatch(entry, input.attributes!);
      return updated;
    });
  });

  if (!updated) throw new Error('没有找到唯一匹配的世界书条目。');
  return { file_path: parsed.normalized, attributes: updated };
}
