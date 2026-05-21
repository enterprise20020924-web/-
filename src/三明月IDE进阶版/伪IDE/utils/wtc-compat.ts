type WtcFileNode = {
  path: string;
  exists: boolean;
  kind: 'worldbook-entry';
  worldbookName: string;
  entryPath: string;
  entry?: WorldbookEntry;
};

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

function entryMatches(worldbookName: string, entryPath: string, entry: WorldbookEntry) {
  const entryWithComment = asEntryWithComment(entry);
  const comment = normalizeVirtualPath(`/Worldbooks/${worldbookName}/${entryWithComment.comment ?? ''}`);
  const name = normalizeVirtualPath(`/Worldbooks/${worldbookName}/${entry.name ?? ''}`);
  return comment === `/Worldbooks/${worldbookName}/${entryPath}` || name === `/Worldbooks/${worldbookName}/${entryPath}`;
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
  if (!parsed || !getWorldbookNames().includes(parsed.worldbookName)) return null;
  const worldbook = await getWorldbook(parsed.worldbookName);
  const entry = worldbook.find(item => entryMatches(parsed.worldbookName, parsed.entryPath, item));
  if (!entry) return null;
  return { path: parsed.normalized, exists: true, kind: 'worldbook-entry', worldbookName: parsed.worldbookName, entryPath: parsed.entryPath, entry };
}

export async function resolveWritableFileNode(path: string): Promise<WtcFileNode | null> {
  const parsed = parseWorldbookPath(path);
  if (!parsed || !getWorldbookNames().includes(parsed.worldbookName)) return null;
  const existing = await resolveFileNode(path);
  return existing ?? { path: parsed.normalized, exists: false, kind: 'worldbook-entry', worldbookName: parsed.worldbookName, entryPath: parsed.entryPath };
}

export function isAttributeNode(node: WtcFileNode | null): node is WtcFileNode {
  return node?.kind === 'worldbook-entry';
}

export function applyWorldbookPatch(entry: WorldbookEntry, attributes: Record<string, unknown>): WorldbookEntry {
  return _.merge({}, entry, attributes) as WorldbookEntry;
}

export async function writeAction(input: { file_path: string; content: string }) {
  const parsed = parseWorldbookPath(input.file_path);
  if (!parsed) throw new Error('当前只支持写入 /Worldbooks/<世界书>/<条目路径>。');
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
