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

type WtcCharacterRegexNode = {
  path: string;
  exists: boolean;
  kind: 'character-regex';
  characterName: string;
  regexName: string;
  regex?: RegexScript;
};

type RegexScript = Record<string, any>;
type WtcFileNode = WtcWorldbookNode | WtcCharacterScriptNode | WtcCharacterRegexNode;

type WorldbookEntryWithComment = WorldbookEntry & { comment?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

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

function resolveCharacterCardName(name: string): string | null {
  try {
    const current = getCurrentCharacterName();
    if (name === 'current') return current || null;
    if (current && name === current) return current;
    return getCharacterNames().includes(name) ? name : null;
  } catch {
    return null;
  }
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

function parseCharacterRegexPath(path: string) {
  const normalized = normalizeVirtualPath(path);
  if (!normalized) return null;
  const segments = normalized.split('/').filter(Boolean);
  if (segments[0] !== 'Characters' || !segments[1] || segments[2]?.toLowerCase() !== 'regex' || segments.length < 4) {
    return null;
  }

  const characterName = resolveCharacterCardName(segments[1]);
  const regexName = segments.slice(3).join('/');
  if (!characterName || !regexName) return null;

  return {
    normalized,
    characterName,
    regexName,
  };
}

function characterScriptApiAvailable(): boolean {
  return typeof getScriptTrees === 'function' && typeof updateScriptTreesWith === 'function';
}

function characterRegexApiAvailable(): boolean {
  return (
    typeof getCharacterNames === 'function'
    && typeof getCurrentCharacterName === 'function'
    && typeof getCharacter === 'function'
    && typeof updateCharacterWith === 'function'
  );
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

function makeRegexId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'regex';
  return `mingyue-regex-${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

function regexScriptName(script: RegexScript): string {
  return String(script.scriptName ?? script.script_name ?? '').trim();
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (trimmed === '[]') return [];
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith('"') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

function parseRegexFrontMatter(content: string): { meta: Record<string, unknown>; body: string } | null {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  if (lines[0]?.trim() !== '---') return null;
  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (endIndex < 0) return null;

  const meta: Record<string, unknown> = {};
  let activeObjectKey: string | null = null;
  for (const line of lines.slice(1, endIndex)) {
    if (!line.trim()) continue;
    if (/^\s/.test(line)) {
      if (!activeObjectKey || !isRecord(meta[activeObjectKey])) continue;
      const trimmed = line.trim();
      const separator = trimmed.indexOf(':');
      if (separator < 0) continue;
      (meta[activeObjectKey] as Record<string, unknown>)[trimmed.slice(0, separator).trim()] = parseScalar(trimmed.slice(separator + 1));
      continue;
    }

    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1);
    if (!rawValue.trim()) {
      meta[key] = {};
      activeObjectKey = key;
      continue;
    }
    meta[key] = parseScalar(rawValue);
    activeObjectKey = null;
  }

  return {
    meta,
    body: lines.slice(endIndex + 1).join('\n'),
  };
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function toRegexSource(value: unknown) {
  const source = isRecord(value) ? value : {};
  return {
    user_input: toBoolean(source.user_input, false),
    ai_output: toBoolean(source.ai_output, true),
    slash_command: toBoolean(source.slash_command, false),
    world_info: toBoolean(source.world_info, false),
  };
}

function toRegexDestination(value: unknown) {
  const destination = isRecord(value) ? value : {};
  return {
    display: toBoolean(destination.display, true),
    prompt: toBoolean(destination.prompt, false),
  };
}

type NormalizedRegexConfig = {
  id: string;
  scriptName: string;
  enabled: boolean;
  findRegex: string;
  replaceString: string;
  trimStrings: unknown;
  source: ReturnType<typeof toRegexSource>;
  destination: ReturnType<typeof toRegexDestination>;
  runOnEdit: boolean;
  substituteRegex: number;
  minDepth: unknown;
  maxDepth: unknown;
  placement: unknown[];
  markdownOnly: boolean;
  promptOnly: boolean;
};

function parseRegexConfig(regexName: string, content: string): NormalizedRegexConfig {
  let raw: RegexScript | null = null;
  try {
    raw = JSON.parse(content);
  } catch {
    const parsed = parseRegexFrontMatter(content);
    if (parsed) {
      raw = {
        ...parsed.meta,
        replace_string: parsed.body,
      };
    }
  }

  if (!raw) {
    throw new Error('正则内容需要是 JSON，或包含 --- front matter 的正则配置。');
  }

  const scriptName = String(raw.scriptName ?? raw.script_name ?? regexName).trim() || regexName;
  const findRegex = String(raw.findRegex ?? raw.find_regex ?? '').trim();
  if (!findRegex) {
    throw new Error('正则写入缺少 find_regex。');
  }

  const disabled = toBoolean(raw.disabled, !toBoolean(raw.enabled, true));
  const enabled = toBoolean(raw.enabled, !disabled);
  const replaceString = String(raw.replaceString ?? raw.replace_string ?? '');
  const trimStrings = raw.trimStrings ?? raw.trim_strings ?? [];
  const runOnEdit = toBoolean(raw.runOnEdit ?? raw.run_on_edit, true);
  const substituteRegex = Number(raw.substituteRegex ?? raw.substitute_regex ?? 0);
  const markdownOnly = toBoolean(raw.markdownOnly ?? raw.markdown_only, true);
  const promptOnly = toBoolean(raw.promptOnly ?? raw.prompt_only, false);
  const minDepth = raw.minDepth ?? raw.min_depth ?? null;
  const maxDepth = raw.maxDepth ?? raw.max_depth ?? null;
  const placement = toArray(raw.placement).length ? toArray(raw.placement) : [2];

  return {
    id: String(raw.id ?? makeRegexId(scriptName)),
    scriptName,
    enabled,
    findRegex,
    replaceString,
    trimStrings,
    source: toRegexSource(raw.source),
    destination: toRegexDestination(raw.destination),
    runOnEdit,
    substituteRegex,
    minDepth,
    maxDepth,
    placement,
    markdownOnly,
    promptOnly,
  };
}

function normalizeTrimStringsForCharacterRegex(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string' && value.trim()) return value.split('\n').map(item => item.trim()).filter(Boolean);
  return [];
}

function normalizeCharacterRegex(regexName: string, content: string): RegexScript {
  const config = parseRegexConfig(regexName, content);
  const trimStrings = normalizeTrimStringsForCharacterRegex(config.trimStrings);
  return {
    id: config.id,
    scriptName: config.scriptName,
    script_name: config.scriptName,
    findRegex: config.findRegex,
    find_regex: config.findRegex,
    replaceString: config.replaceString,
    replace_string: config.replaceString,
    trimStrings,
    trim_strings: trimStrings.join('\n'),
    source: config.source,
    destination: config.destination,
    placement: config.placement,
    disabled: !config.enabled,
    enabled: config.enabled,
    markdownOnly: config.markdownOnly,
    promptOnly: config.promptOnly,
    pluginOnly: false,
    runOnEdit: config.runOnEdit,
    run_on_edit: config.runOnEdit,
    substituteRegex: config.substituteRegex,
    minDepth: config.minDepth,
    min_depth: config.minDepth,
    maxDepth: config.maxDepth,
    max_depth: config.maxDepth,
  };
}

function findCharacterRegex(scripts: RegexScript[] | undefined, regexName: string): RegexScript | undefined {
  return scripts?.find(script => regexScriptName(script) === regexName);
}

function upsertCharacterRegex(scripts: RegexScript[] | undefined, regexName: string, content: string): RegexScript[] {
  const current = Array.isArray(scripts) ? scripts : [];
  const next = normalizeCharacterRegex(regexName, content);
  const kept = current.filter(script => !shouldReplaceCharacterRegex(script, next));
  return [...kept, next];
}

function shouldReplaceCharacterRegex(script: RegexScript, next: RegexScript): boolean {
  const name = regexScriptName(script);
  const nextName = regexScriptName(next);
  if (name && name === nextName) return true;

  const visibleName = String(script.scriptName ?? '').trim();
  if (visibleName) return false;

  const findRegex = String(script.findRegex ?? script.find_regex ?? '');
  const id = String(script.id ?? '');
  return findRegex.includes('StatusPlaceHolderImpl') || id.includes('mvu-status') || id.includes('regex-mvu-status');
}

async function getCharacterRegexScripts(characterName: string): Promise<RegexScript[]> {
  const character = await getCharacter(characterName);
  return character.extensions?.regex_scripts ?? [];
}

async function writeCharacterRegexExtension(characterName: string, regexName: string, content: string) {
  await updateCharacterWith(characterName, char => {
    if (!char.extensions) char.extensions = {};
    char.extensions.regex_scripts = upsertCharacterRegex(char.extensions.regex_scripts, regexName, content);
    return char;
  });
}

export function validateWriteContentForPath(path: string, content: string): void {
  const regexPath = parseCharacterRegexPath(path);
  if (regexPath) parseRegexConfig(regexPath.regexName, content);
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
  if (scriptPath && currentCharacterScriptTargetAvailable(scriptPath.characterName)) {
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

  const regexPath = parseCharacterRegexPath(path);
  if (!regexPath || !characterRegexApiAvailable()) return null;
  try {
    const regex = findCharacterRegex(await getCharacterRegexScripts(regexPath.characterName), regexPath.regexName);
    if (!regex) return null;
    return {
      path: regexPath.normalized,
      exists: true,
      kind: 'character-regex',
      characterName: regexPath.characterName,
      regexName: regexPath.regexName,
      regex,
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
  if (scriptPath && currentCharacterScriptTargetAvailable(scriptPath.characterName)) {
    const existing = await resolveFileNode(path);
    return existing ?? {
      path: scriptPath.normalized,
      exists: false,
      kind: 'character-script',
      characterName: scriptPath.characterName,
      scriptName: scriptPath.scriptName,
    };
  }

  const regexPath = parseCharacterRegexPath(path);
  if (!regexPath || !characterRegexApiAvailable()) return null;
  const existing = await resolveFileNode(path);
  return existing ?? {
    path: regexPath.normalized,
    exists: false,
    kind: 'character-regex',
    characterName: regexPath.characterName,
    regexName: regexPath.regexName,
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

  const regexPath = parseCharacterRegexPath(input.file_path);
  if (regexPath) {
    if (!characterRegexApiAvailable()) {
      throw new Error('当前没有打开角色卡，或角色卡正则接口不可用。');
    }
    await writeCharacterRegexExtension(regexPath.characterName, regexPath.regexName, input.content);
    return { file_path: regexPath.normalized, regex: regexPath.regexName, writer: 'character-extension' };
  }

  const scriptPath = parseCharacterScriptPath(input.file_path);
  if (!scriptPath) throw new Error('当前只支持写入 /Worldbooks/<世界书>/<条目路径>、/Characters/<角色>/Scripts/<脚本名> 或 /Characters/<角色>/Regex/<正则名>。');
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
