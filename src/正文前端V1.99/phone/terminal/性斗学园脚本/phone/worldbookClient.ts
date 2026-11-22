import type { WorldbookData, WorldbookEntry } from './types';
import { safeStorageSegment, safeString } from './text';

const WORLD_INFO_GET_ENDPOINT = '/api/worldinfo/get';
const WORLD_INFO_EDIT_ENDPOINT = '/api/worldinfo/edit';
const CHAT_LOREBOOK_METADATA_KEY = 'world_info';
const PHONE_WORLD_PREFIX = '后街-';
const WORLDBOOK_WRITE_QUEUE_KEY = '__fatriaWorldbookWriteQueues';

interface UpsertEntryOptions {
  enabled?: boolean;
  constant?: boolean;
  selective?: boolean;
  key?: string[];
  keysecondary?: string[];
  position?: number;
  role?: number;
  depth?: number;
  order?: number;
  useProbability?: boolean;
  probability?: number;
  excludeRecursion?: boolean;
  preventRecursion?: boolean;
  addMemo?: boolean;
}

let cachedCsrfToken = '';
let cachedCsrfTokenAt = 0;

function getHostWindow(): any {
  const current = window as any;
  try {
    if (current.parent && current.parent !== current && current.parent.document) return current.parent;
  } catch {
    // Cross-frame access can fail in stricter contexts; stay in the current frame.
  }
  return current;
}

function getHostDocument(): Document {
  return getHostWindow().document || document;
}

function isTruthyFlag(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') return ['true', '1', 'yes', 'on', 'enabled'].includes(value.trim().toLowerCase());
  return false;
}

async function getCsrfToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedCsrfToken && now - cachedCsrfTokenAt < 60000) return cachedCsrfToken;

  try {
    const response = await fetch(`/csrf-token?_=${now}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!response.ok) return '';
    const data = (await response.json().catch(() => null)) as { token?: string } | null;
    cachedCsrfToken = safeString(data?.token);
    cachedCsrfTokenAt = now;
    return cachedCsrfToken;
  } catch {
    return '';
  }
}

async function getJsonHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const globalAny = getHostWindow();

  if (!forceRefresh && typeof globalAny.getRequestHeaders === 'function') {
    try {
      Object.assign(headers, globalAny.getRequestHeaders() || {});
    } catch {
      // Use the CSRF endpoint fallback below.
    }
  }

  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  if (!headers['X-CSRF-Token'] && !headers['x-csrf-token']) {
    const token = await getCsrfToken(forceRefresh);
    if (token) headers['X-CSRF-Token'] = token;
  }
  return headers;
}

function isCsrfError(status: number, text: string): boolean {
  return [400, 401, 403].includes(status) && /csrf|forbidden|invalid token/i.test(text);
}

async function postJson<T>(url: string, body: Record<string, unknown>, forceRefresh = false): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: await getJsonHeaders(forceRefresh),
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    if (!forceRefresh && isCsrfError(response.status, text)) {
      cachedCsrfToken = '';
      cachedCsrfTokenAt = 0;
      return postJson<T>(url, body, true);
    }
    throw new Error(`世界书接口失败 ${response.status}${text ? `: ${text.slice(0, 160)}` : ''}`);
  }

  return response.json() as Promise<T>;
}

function importRuntimeModule(path: string): Promise<any> {
  const hostWindow = getHostWindow();
  const FunctionCtor = hostWindow.Function || Function;
  const dynamicImport = new FunctionCtor('path', 'return import(path);') as (path: string) => Promise<any>;
  return dynamicImport(path);
}

function normalizeWorldbookData(data: unknown): WorldbookData | null {
  if (!data) return null;
  if (Array.isArray(data)) return { entries: data as WorldbookEntry[] };
  if (typeof data !== 'object') return null;

  const source = data as Record<string, any>;
  if (source.entries) return source as WorldbookData;
  if (source.data?.entries) return source.data as WorldbookData;
  if (source.worldInfo?.entries) return source.worldInfo as WorldbookData;
  if (source.worldInfoData?.entries) return source.worldInfoData as WorldbookData;
  if (source.world_info?.entries) return source.world_info as WorldbookData;
  return source as WorldbookData;
}

function cloneWorldbookData(data: WorldbookData): WorldbookData {
  return JSON.parse(JSON.stringify(data)) as WorldbookData;
}

function stripChatFileExtension(value: string): string {
  return safeString(value).replace(/\.(?:jsonl?|js)$/i, '');
}

export function isWorldbookEntryEnabled(entry: WorldbookEntry): boolean {
  if (!entry || typeof entry !== 'object') return false;
  return !isTruthyFlag(entry.disable) && !isTruthyFlag(entry.disabled);
}

export function getEntriesArray(data: WorldbookData | null): WorldbookEntry[] {
  const entries = data?.entries;
  if (Array.isArray(entries)) return entries;
  if (entries && typeof entries === 'object') return Object.values(entries);
  return [];
}

function replaceEntries(data: WorldbookData, entries: WorldbookEntry[]): WorldbookData {
  if (Array.isArray(data.entries)) {
    data.entries = entries;
    return data;
  }

  const nextEntries: Record<string, WorldbookEntry> = {};
  entries.forEach((entry, index) => {
    const uid = safeString(entry.uid || index);
    nextEntries[uid || String(index)] = entry;
  });
  data.entries = nextEntries;
  return data;
}

function getNextUid(entries: WorldbookEntry[]): number {
  const maxUid = entries.reduce((max, entry) => {
    const uid = Number(entry.uid);
    return Number.isFinite(uid) ? Math.max(max, uid) : max;
  }, -1);
  return maxUid + 1;
}

function normalizeEntryOptions(
  comment: string,
  value: boolean | UpsertEntryOptions = false,
): Required<UpsertEntryOptions> {
  const options = typeof value === 'boolean' ? { enabled: value } : value;
  const enabled = options.enabled ?? false;
  return {
    enabled,
    constant: options.constant ?? enabled,
    selective: options.selective ?? false,
    key: options.key ?? [comment],
    keysecondary: options.keysecondary ?? [],
    position: options.position ?? 0,
    role: options.role ?? 0,
    depth: options.depth ?? 4,
    order: options.order ?? 100,
    useProbability: options.useProbability ?? true,
    probability: options.probability ?? 100,
    excludeRecursion: options.excludeRecursion ?? true,
    preventRecursion: options.preventRecursion ?? true,
    addMemo: options.addMemo ?? true,
  };
}

function applyEntryOptions(entry: WorldbookEntry, options: Required<UpsertEntryOptions>): void {
  entry.disable = !options.enabled;
  entry.constant = options.constant;
  entry.selective = options.selective;
  entry.key = options.key;
  entry.keysecondary = options.keysecondary;
  entry.position = options.position;
  entry.role = options.role;
  entry.depth = options.depth;
  entry.order = options.order;
  entry.useProbability = options.useProbability;
  entry.probability = options.probability;
  entry.excludeRecursion = options.excludeRecursion;
  entry.preventRecursion = options.preventRecursion;
  entry.addMemo = options.addMemo;
}

function createEntry(comment: string, content: string, optionsValue: boolean | UpsertEntryOptions): WorldbookEntry {
  const options = normalizeEntryOptions(comment, optionsValue);
  return {
    uid: 0,
    displayIndex: 0,
    comment,
    disable: !options.enabled,
    constant: options.constant,
    selective: options.selective,
    key: options.key,
    keysecondary: options.keysecondary,
    selectiveLogic: 0,
    position: options.position,
    role: options.role,
    depth: options.depth,
    order: options.order,
    content,
    useProbability: options.useProbability,
    probability: options.probability,
    excludeRecursion: options.excludeRecursion,
    preventRecursion: options.preventRecursion,
    addMemo: options.addMemo,
  };
}

function applyStorageEntry(entry: WorldbookEntry, content: string): void {
  entry.content = content;
  entry.disable = true;
  entry.key = [];
  delete entry.disabled;
  delete entry.constant;
  delete entry.selective;
  delete entry.keysecondary;
  delete entry.selectiveLogic;
  delete entry.position;
  delete entry.role;
  delete entry.depth;
  delete entry.order;
  delete entry.useProbability;
  delete entry.probability;
  delete entry.excludeRecursion;
  delete entry.preventRecursion;
  delete entry.addMemo;
}

function createStorageEntry(comment: string, content: string): WorldbookEntry {
  return {
    uid: 0,
    displayIndex: 0,
    comment,
    disable: true,
    key: [],
    content,
  };
}

function isWorldbookWriteQueueMap(value: unknown): value is Map<string, Promise<void>> {
  const map = value as Partial<Map<string, Promise<void>>> | null;
  return !!map && typeof map.get === 'function' && typeof map.set === 'function' && typeof map.delete === 'function';
}

function getWorldbookWriteQueues(): Map<string, Promise<void>> {
  const hostWindow = getHostWindow() as Record<string, unknown>;
  const queues = hostWindow[WORLDBOOK_WRITE_QUEUE_KEY];
  if (isWorldbookWriteQueueMap(queues)) return queues;

  const nextQueues = new Map<string, Promise<void>>();
  hostWindow[WORLDBOOK_WRITE_QUEUE_KEY] = nextQueues;
  return nextQueues;
}

export class WorldbookClient {
  private cache = new Map<string, { data: WorldbookData; at: number }>();
  private boundChatWorldbooks = new Set<string>();
  private ensurePromises = new Map<string, Promise<WorldbookData>>();
  private scriptModulePromise: Promise<any> | null = null;
  private worldInfoModulePromise: Promise<any> | null = null;
  private lastChatKey = '';

  private async enqueueWorldbookWrite<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const queues = getWorldbookWriteQueues();
    const previous = queues.get(name) || Promise.resolve();
    const task = previous.catch(() => undefined).then(operation);
    const completed = task.then(
      () => undefined,
      () => undefined,
    );
    queues.set(name, completed);

    try {
      return await task;
    } finally {
      if (queues.get(name) === completed) queues.delete(name);
    }
  }

  getPhoneWorldbookName(): string {
    const chatKey = safeStorageSegment(this.getChatKey());
    return chatKey ? `后街-${chatKey}` : '';
  }

  getCurrentChatWorldbookName(): string {
    const globalAny = getHostWindow();
    const helper = globalAny.getChatWorldbookName || (globalThis as any).getChatWorldbookName;
    if (typeof helper === 'function') {
      try {
        const helperName = safeString(helper('current'));
        if (helperName) return helperName;
      } catch {
        // Fall back to SillyTavern metadata below.
      }
    }

    const context = this.getContext();
    return safeString(
      context?.chatMetadata?.[CHAT_LOREBOOK_METADATA_KEY] ||
        (globalAny.chat_metadata && globalAny.chat_metadata[CHAT_LOREBOOK_METADATA_KEY]),
    );
  }

  getContext(): any {
    const globalAny = getHostWindow();
    if (typeof globalAny.SillyTavern?.getContext === 'function') return globalAny.SillyTavern.getContext();
    if (typeof (globalThis as any).SillyTavern?.getContext === 'function')
      return (globalThis as any).SillyTavern.getContext();
    return null;
  }

  private getChatKey(context = this.getContext()): string {
    const globalAny = getHostWindow();
    const rawKey =
      safeString(globalAny.SillyTavern?.getCurrentChatId?.()) ||
      safeString((globalThis as any).SillyTavern?.getCurrentChatId?.()) ||
      safeString(context?.chatId) ||
      safeString(context?.chatMetadata?.file_name) ||
      safeString(context?.chat?.[0]?.send_date);
    const chatKey = stripChatFileExtension(rawKey);
    if (this.lastChatKey && this.lastChatKey !== chatKey) {
      this.cache.clear();
      this.boundChatWorldbooks.clear();
    }
    this.lastChatKey = chatKey;
    return chatKey;
  }

  private getLegacyPhoneWorldbookName(context = this.getContext()): string {
    const rawKey =
      safeString(context?.chatMetadata?.file_name) ||
      safeString(context?.chatId) ||
      safeString(context?.chat?.[0]?.send_date);
    if (!rawKey) return '';
    const safeRawKey = safeStorageSegment(rawKey || '默认聊天');
    const safeChatKey = safeStorageSegment(this.getChatKey(context));
    if (!safeChatKey) return '';
    return safeRawKey && safeRawKey !== safeChatKey ? `${PHONE_WORLD_PREFIX}${safeRawKey}` : '';
  }

  private async loadScriptModule(): Promise<any> {
    if (!this.scriptModulePromise) {
      this.scriptModulePromise = importRuntimeModule('/script.js').catch(() => null);
    }
    return this.scriptModulePromise;
  }

  private async loadWorldInfoModule(): Promise<any> {
    if (!this.worldInfoModulePromise) {
      this.worldInfoModulePromise = importRuntimeModule('/scripts/world-info.js').catch(() => null);
    }
    return this.worldInfoModulePromise;
  }

  async refreshWorldbookEditor(name: string): Promise<void> {
    const worldName = safeString(name);
    if (!worldName) return;

    this.cache.delete(worldName);
    const globalAny = getHostWindow();
    const context = this.getContext();
    const worldInfoModule = await this.loadWorldInfoModule();

    await Promise.resolve(context?.updateWorldInfoList?.()).catch(() => null);
    await Promise.resolve(worldInfoModule?.updateWorldInfoList?.()).catch(() => null);

    const reloadEditor = (): boolean => {
      if (typeof context?.reloadWorldInfoEditor === 'function') {
        context.reloadWorldInfoEditor(worldName, true);
        return true;
      }
      if (typeof worldInfoModule?.reloadEditor === 'function') {
        worldInfoModule.reloadEditor(worldName, true);
        return true;
      }
      if (typeof globalAny.reloadEditor === 'function') {
        globalAny.reloadEditor(worldName, true);
        return true;
      }
      if (typeof globalAny.reloadEditorDebounced === 'function') {
        globalAny.reloadEditorDebounced(worldName, true);
        return true;
      }
      return false;
    };

    try {
      if (reloadEditor()) {
        window.setTimeout(() => {
          try {
            reloadEditor();
          } catch {
            // Best-effort delayed refresh for the currently open editor.
          }
        }, 80);
      }
    } catch {
      // The server save has already succeeded; editor refresh is best-effort.
    }
  }

  private async getKnownWorldbookState(name: string): Promise<boolean | null> {
    const worldName = safeString(name);
    if (!worldName) return false;

    const globalAny = getHostWindow();
    const hostDocument = getHostDocument();
    const context = this.getContext();
    const worldInfoModule = await this.loadWorldInfoModule();

    const updateWorldInfoList = context?.updateWorldInfoList || worldInfoModule?.updateWorldInfoList;
    await Promise.resolve(updateWorldInfoList?.()).catch(() => null);

    const nameLists = [globalAny.world_names, globalAny.worldNames, worldInfoModule?.world_names].filter(Array.isArray);
    if (nameLists.some(list => list.includes(worldName))) return true;

    const editor = hostDocument.querySelector<HTMLSelectElement>('#world_editor_select');
    if (editor && Array.from(editor.options).some(option => option.text === worldName || option.value === worldName)) {
      return true;
    }

    // A populated list is authoritative. A null result means the host has not
    // exposed a worldbook index yet, so callers may use their legacy fallback.
    return nameLists.length > 0 || !!editor ? false : null;
  }

  async isKnownWorldbookName(name: string): Promise<boolean> {
    const state = await this.getKnownWorldbookState(name);
    return state !== false;
  }

  private async registerWorldbookName(name: string): Promise<void> {
    const worldName = safeString(name);
    if (!worldName) return;

    const globalAny = getHostWindow();
    const hostDocument = getHostDocument();
    const worldInfoModule = await this.loadWorldInfoModule();
    const nameLists = [globalAny.world_names, globalAny.worldNames, worldInfoModule?.world_names].filter(Array.isArray);
    for (const list of nameLists) {
      if (!list.includes(worldName)) list.push(worldName);
    }

    const editor = hostDocument.querySelector<HTMLSelectElement>('#world_editor_select');
    if (editor && !Array.from(editor.options).some(option => option.text === worldName || option.value === worldName)) {
      const option = hostDocument.createElement('option');
      const knownNames = nameLists.find(list => list.includes(worldName));
      const knownIndex = knownNames ? knownNames.indexOf(worldName) : -1;
      option.value = String(knownIndex >= 0 ? knownIndex : editor.options.length);
      option.innerText = worldName;
      editor.append(option);
    }
  }

  private async saveChatMetadata(context: any): Promise<void> {
    const globalAny = getHostWindow();
    const scriptModule = await this.loadScriptModule();

    if (typeof scriptModule?.saveMetadata === 'function') {
      await scriptModule.saveMetadata();
      return;
    }
    if (typeof context?.saveMetadata === 'function') {
      await context.saveMetadata();
      return;
    }
    if (typeof globalAny.saveChatDebounced === 'function') {
      globalAny.saveChatDebounced();
      return;
    }
    if (typeof context?.saveChatDebounced === 'function') {
      context.saveChatDebounced();
      return;
    }
    if (typeof context?.saveChat === 'function') {
      await context.saveChat();
    }
  }

  private setChatLorebookButtonState(enabled: boolean): void {
    const method = enabled ? 'add' : 'remove';
    getHostDocument()
      .querySelectorAll('.chat_lorebook_button')
      .forEach(element => element.classList[method]('world_set'));
  }

  async ensureCurrentChatWorldbookBinding(name: string): Promise<void> {
    await this.bindWorldbookToCurrentChat(name);
  }

  private async bindWorldbookToCurrentChat(name: string): Promise<void> {
    const worldName = safeString(name);
    if (!worldName.startsWith(PHONE_WORLD_PREFIX)) return;

    const context = this.getContext();
    const chatMetadata = context?.chatMetadata;
    if (!chatMetadata || typeof chatMetadata !== 'object') return;

    const chatKey = this.getChatKey(context);
    const currentWorldName = chatKey ? `${PHONE_WORLD_PREFIX}${safeStorageSegment(chatKey)}` : '';
    if (!currentWorldName || worldName !== currentWorldName) return;

    const scriptModule = await this.loadScriptModule();
    const metadataTargets = [chatMetadata, scriptModule?.chat_metadata, getHostWindow().chat_metadata].filter(
      target => target && typeof target === 'object',
    );
    const existing = safeString(chatMetadata[CHAT_LOREBOOK_METADATA_KEY]);
    const bindKey = `${chatKey}::${worldName}::${existing}`;
    const alreadyBound = this.boundChatWorldbooks.has(bindKey);
    this.boundChatWorldbooks.add(bindKey);

    await this.registerWorldbookName(worldName);

    if (existing === worldName) {
      this.setChatLorebookButtonState(true);
      if (!alreadyBound) await this.saveChatMetadata(context).catch(() => null);
      return;
    }

    if (existing && !existing.startsWith(PHONE_WORLD_PREFIX)) {
      console.info(`[后街] 当前聊天已绑定聊天世界书「${existing}」，保留原绑定，未自动覆盖为「${worldName}」。`);
      return;
    }

    for (const metadata of metadataTargets) {
      metadata[CHAT_LOREBOOK_METADATA_KEY] = worldName;
    }
    this.setChatLorebookButtonState(true);
    await this.saveChatMetadata(context);
    console.info(`[后街] 已将聊天世界书「${worldName}」绑定到当前聊天。`);
  }

  async getChatMetadataValue<T = unknown>(key: string): Promise<T | null> {
    const context = this.getContext();
    if (context?.chatMetadata && typeof context.chatMetadata === 'object') {
      const value = context.chatMetadata[key];
      return value == null ? null : (value as T);
    }

    const scriptModule = await this.loadScriptModule();
    const value = scriptModule?.chat_metadata?.[key] ?? getHostWindow().chat_metadata?.[key];
    return value == null ? null : (value as T);
  }

  async setChatMetadataValue(key: string, value: unknown): Promise<void> {
    const context = this.getContext();
    const chatMetadata = context?.chatMetadata;
    if (!chatMetadata || typeof chatMetadata !== 'object') return;

    const scriptModule = await this.loadScriptModule();
    const metadataTargets = [chatMetadata, scriptModule?.chat_metadata, getHostWindow().chat_metadata].filter(
      target => target && typeof target === 'object',
    );
    for (const metadata of metadataTargets) {
      metadata[key] = value;
    }
    await this.saveChatMetadata(context);
  }

  async readWorldbook(
    name: string,
    options: { force?: boolean; allowMissing?: boolean } = {},
  ): Promise<WorldbookData | null> {
    const worldName = safeString(name);
    if (!worldName) return null;

    const cached = this.cache.get(worldName);
    if (!options.force && cached && Date.now() - cached.at < 5000) return cloneWorldbookData(cached.data);

    // SillyTavern returns a 200/empty placeholder for a missing file, while
    // logging an error on the server. Check the worldbook index first so a
    // normal optional read does not produce misleading backend errors.
    const knownState = await this.getKnownWorldbookState(worldName).catch(() => null);
    if (knownState === false) {
      this.cache.delete(worldName);
      if (options.allowMissing) return null;
      throw new Error(`未找到世界书：${worldName}`);
    }

    try {
      const data = normalizeWorldbookData(await postJson<unknown>(WORLD_INFO_GET_ENDPOINT, { name: worldName }));
      if (data) {
        this.cache.set(worldName, { data, at: Date.now() });
        return cloneWorldbookData(data);
      }
      if (options.allowMissing) {
        this.cache.delete(worldName);
        return null;
      }
      throw new Error(`未找到世界书：${worldName}`);
    } catch (error) {
      if (options.allowMissing) {
        this.cache.delete(worldName);
        return null;
      }
      throw error;
    }
  }

  async ensureWorldbook(name: string): Promise<WorldbookData> {
    const worldName = safeString(name);
    if (!worldName) return { entries: {} };

    const pending = this.ensurePromises.get(worldName);
    if (pending) return cloneWorldbookData(await pending);

    const ensurePromise = this.enqueueWorldbookWrite(worldName, () => this.ensureWorldbookInternal(worldName));
    this.ensurePromises.set(worldName, ensurePromise);
    try {
      return cloneWorldbookData(await ensurePromise);
    } finally {
      if (this.ensurePromises.get(worldName) === ensurePromise) this.ensurePromises.delete(worldName);
    }
  }

  private async ensureWorldbookInternal(name: string): Promise<WorldbookData> {
    const existing = await this.readWorldbook(name, { allowMissing: true, force: true });
    if (existing) {
      await this.bindWorldbookToCurrentChat(name).catch(error => console.warn('[后街] 自动绑定聊天世界书失败:', error));
      return existing;
    }

    const legacyName = this.getLegacyPhoneWorldbookName();
    const legacy =
      name === this.getPhoneWorldbookName() && legacyName
        ? await this.readWorldbook(legacyName, { allowMissing: true, force: true })
        : null;
    if (legacy) {
      await this.saveWorldbookRaw(name, legacy);
      await this.bindWorldbookToCurrentChat(name).catch(error => console.warn('[后街] 自动绑定聊天世界书失败:', error));
      console.info(`[后街] 已将旧聊天世界书「${legacyName}」迁移为「${name}」。`);
      const migrated = await this.readWorldbook(name, { force: true });
      if (!migrated) throw new Error(`迁移后无法读取世界书：${name}`);
      return migrated;
    }

    const created: WorldbookData = { entries: {} };
    await this.saveWorldbookRaw(name, created);
    const verified = await this.readWorldbook(name, { force: true });
    if (!verified) throw new Error(`创建后无法读取世界书：${name}`);
    return verified;
  }

  private async saveWorldbookRaw(name: string, data: WorldbookData): Promise<void> {
    const worldName = safeString(name);
    await postJson<unknown>(WORLD_INFO_EDIT_ENDPOINT, { name: worldName, data });
    this.cache.set(worldName, { data, at: Date.now() });
    await this.registerWorldbookName(worldName);
    await this.bindWorldbookToCurrentChat(worldName).catch(error =>
      console.warn('[后街] 自动绑定聊天世界书失败:', error),
    );
  }

  private async mutateWorldbook<T>(
    name: string,
    mutation: (data: WorldbookData) => T,
    verify: (data: WorldbookData, result: T) => boolean,
    description: string,
  ): Promise<T> {
    const worldName = safeString(name);
    if (!worldName) throw new Error('世界书名称不能为空');

    return this.enqueueWorldbookWrite(worldName, async () => {
      const data = await this.ensureWorldbookInternal(worldName);
      const result = mutation(data);
      await this.saveWorldbookRaw(worldName, data);

      const verified = await this.readWorldbook(worldName, { force: true });
      if (!verified || !verify(verified, result)) {
        this.cache.delete(worldName);
        throw new Error(`世界书写入校验失败：${worldName}（${description}）`);
      }
      return result;
    });
  }

  async upsertStorageEntry(name: string, comment: string, content: string): Promise<void> {
    await this.mutateWorldbook(
      name,
      data => {
        const entries = getEntriesArray(data);
        const existing = entries.find(entry => safeString(entry.comment) === comment);

        if (existing) {
          applyStorageEntry(existing, content);
        } else {
          const entry = createStorageEntry(comment, content);
          entry.uid = getNextUid(entries);
          entry.displayIndex = entries.length;
          entries.push(entry);
        }

        replaceEntries(data, entries);
      },
      data => {
        const entry = getEntriesArray(data).find(item => safeString(item.comment) === comment);
        return entry?.content === content && entry.disable === true;
      },
      `写入存储条目 ${comment}`,
    );
  }

  async deleteEntry(name: string, comment: string): Promise<boolean> {
    return this.mutateWorldbook(
      name,
      data => {
        const entries = getEntriesArray(data);
        const nextEntries = entries.filter(entry => safeString(entry.comment) !== comment);
        const deleted = nextEntries.length !== entries.length;
        replaceEntries(data, nextEntries);
        return deleted;
      },
      data => !getEntriesArray(data).some(entry => safeString(entry.comment) === comment),
      `删除条目 ${comment}`,
    );
  }

  async upsertEntry(
    name: string,
    comment: string,
    content: string,
    enabledOrOptions: boolean | UpsertEntryOptions = false,
  ): Promise<void> {
    const options = normalizeEntryOptions(comment, enabledOrOptions);

    await this.mutateWorldbook(
      name,
      data => {
        const entries = getEntriesArray(data);
        const existing = entries.find(entry => safeString(entry.comment) === comment);

        if (existing) {
          existing.content = content;
          applyEntryOptions(existing, options);
        } else {
          const entry = createEntry(comment, content, enabledOrOptions);
          entry.uid = getNextUid(entries);
          entry.displayIndex = entries.length;
          entries.push(entry);
        }

        replaceEntries(data, entries);
      },
      data => {
        const entry = getEntriesArray(data).find(item => safeString(item.comment) === comment);
        return (
          entry?.content === content &&
          entry.disable === !options.enabled &&
          entry.constant === options.constant &&
          entry.selective === options.selective &&
          JSON.stringify(entry.key || []) === JSON.stringify(options.key) &&
          JSON.stringify(entry.keysecondary || []) === JSON.stringify(options.keysecondary) &&
          entry.position === options.position &&
          entry.role === options.role &&
          entry.depth === options.depth &&
          entry.order === options.order &&
          entry.useProbability === options.useProbability &&
          entry.probability === options.probability &&
          entry.excludeRecursion === options.excludeRecursion &&
          entry.preventRecursion === options.preventRecursion &&
          entry.addMemo === options.addMemo
        );
      },
      `写入条目 ${comment}`,
    );
  }

  async getEntry(name: string, comment: string, options: { force?: boolean } = {}): Promise<WorldbookEntry | null> {
    const data = await this.readWorldbook(name, { allowMissing: true, force: options.force });
    return getEntriesArray(data).find(entry => safeString(entry.comment) === comment) || null;
  }

  async listEntries(
    name: string,
    options: { includeDisabled?: boolean; force?: boolean } = {},
  ): Promise<WorldbookEntry[]> {
    const data = await this.readWorldbook(name, { allowMissing: true, force: options.force });
    return getEntriesArray(data).filter(entry => options.includeDisabled || isWorldbookEntryEnabled(entry));
  }
}

export const worldbookClient = new WorldbookClient();
