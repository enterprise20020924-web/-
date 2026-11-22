import type {
  BackstreetContact,
  BackstreetGroup,
  BackstreetMessage,
  BackstreetThreadData,
  PhoneMemoryHit,
  PhoneMemoryQuery,
  WorldbookEntry,
} from './types';
import { worldbookClient } from './worldbookClient';
import { clipText, formatTimestampedLines, makeId, normalizeName, safeString, uniqueStrings } from './text';
import { parseJsonBlock } from './xmlToolCall';

const META_ENTRY = '[PHONE_META]';
const GUIDE_ENTRY = '[BACKSTREET_GUIDE]';
const EJS_MEMORY_ENTRY = '[BACKSTREET_EJS_MEMORY]';
const LEGACY_EJS_INJECT_ENTRY = '@INJECT pos=1,role=system 后街正文记忆';
const GROUPS_CHAT_METADATA_KEY = 'fatria_backstreet_groups_v1';
const MAX_HEAD_MESSAGES = 80;

interface PhoneMetaData {
  contacts: Record<string, { name: string; lastMessage: string; lastTime: string; updatedAt: number }>;
  groups: Record<string, BackstreetGroup>;
  archiveCounters: Record<string, number>;
}

function getThreadEntryName(contact: string): string {
  return `[BACKSTREET_THREAD::${contact}::HEAD]`;
}

function getArchiveEntryName(contact: string, index: number): string {
  return `[BACKSTREET_ARCHIVE::${contact}::${String(index).padStart(4, '0')}]`;
}

function getGuideContent(): string {
  return `【后街说明】
后街是<user>手机中的私聊/群聊应用，用来记录<user>与各角色在正文之外发生的消息交流。
后街聊天属于真实发生过的私下交流，会影响角色对<user>的态度、承诺、秘密、暗号、约定和未完成事项。
这些内容默认不是公开信息；只有私聊双方知道，除非正文剧情明确让其他人得知。
后街聊天会按固定规则把原始私聊/群聊记录注入正文提示词，不进行摘要压缩，也不依赖关键词匹配。
后街记录中的日期与时间表示该消息发生时间，判断新旧信息时应参考这个时间。`;
}

function getEjsMemoryContent(): string {
  return `<%_
  let __fatriaBackstreetText = '';
  try {
    const __root = typeof globalThis !== 'undefined' ? globalThis : this;
    let __host = __root;
    if (typeof window !== 'undefined') {
      __host = window;
      try {
        if (window.parent && window.parent !== window) __host = window.parent;
      } catch (_) {}
    }
    const __fn =
      (__root && __root.__fatriaBackstreetMainInjection) ||
      (__host && __host.__fatriaBackstreetMainInjection) ||
      (typeof window !== 'undefined' && window.__fatriaBackstreetMainInjection);
    if (typeof __fn === 'function') {
      __fatriaBackstreetText = await __fn();
    }
  } catch (_) {
    __fatriaBackstreetText = '';
  }
_%><%- __fatriaBackstreetText _%>`;
}

function wrapJson(tag: string, value: unknown): string {
  return `<${tag}>\n${JSON.stringify(value, null, 2)}\n</${tag}>`;
}

function parseWrappedJson<T>(content: string, tag: string): T | null {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = safeString(content).match(pattern);
  return parseJsonBlock<T>(match?.[1] || content);
}

function createEmptyMeta(): PhoneMetaData {
  return { contacts: {}, groups: {}, archiveCounters: {} };
}

function normalizeMessage(value: Partial<BackstreetMessage>): BackstreetMessage | null {
  const text = safeString(value?.text);
  const imageRef = safeString(value?.imageRef);
  const imagePrompt = safeString(value?.imagePrompt);
  const imageError = safeString(value?.imageError);
  const kind: BackstreetMessage['kind'] =
    value?.kind === 'image' || imageRef || imagePrompt || imageError ? 'image' : 'text';
  if (!text && kind !== 'image') return null;
  if (kind === 'image' && !text && !imageRef && !imagePrompt && !imageError) return null;
  const sender: BackstreetMessage['sender'] =
    value?.sender === 'contact' || value?.sender === 'system' || value?.sender === 'user' ? value.sender : 'contact';
  const speaker = safeString(value?.speaker);
  const date = safeString(value?.date);
  const time = safeString(value?.time) || '--:--';
  return {
    id: safeString(value?.id) || `${sender}::${speaker}::${date}::${time}::${text}::${imageRef || imagePrompt}`,
    sender,
    kind,
    speaker: speaker || undefined,
    date: date || undefined,
    time,
    text,
    imageRef: imageRef || undefined,
    imagePrompt: imagePrompt || undefined,
    imageNegativePrompt: safeString(value?.imageNegativePrompt) || undefined,
    imageSource: value?.imageSource === 'novelai' || value?.imageSource === 'user' ? value.imageSource : undefined,
    imageHiddenFromPrompt: Boolean(value?.imageHiddenFromPrompt) || undefined,
    imageError: imageError || undefined,
    createdAt: Number(value?.createdAt || 0),
  };
}

function normalizeThread(contact: string, value: Partial<BackstreetThreadData> | null): BackstreetThreadData {
  const kind = value?.kind === 'group' ? 'group' : 'private';
  const members = Array.isArray(value?.members)
    ? uniqueStrings(value.members.map(member => safeString(member)).filter(Boolean))
    : [];
  const messages = Array.isArray(value?.messages)
    ? value.messages
        .map(message => normalizeMessage(message))
        .filter((message): message is BackstreetMessage => !!message)
    : [];
  return {
    contact,
    kind,
    groupName: kind === 'group' ? safeString(value?.groupName) : undefined,
    members,
    dissolved: kind === 'group' ? Boolean(value?.dissolved) : undefined,
    dissolvedAt: kind === 'group' ? Number(value?.dissolvedAt || 0) || undefined : undefined,
    updatedAt: Number(value?.updatedAt || Date.now()),
    messages,
  };
}

function parseThreadLikeEntry(entry: WorldbookEntry): BackstreetThreadData | null {
  const comment = safeString(entry.comment);
  const contact = comment.match(/BACKSTREET_(?:THREAD|ARCHIVE)::(.+?)::/)?.[1] || '';
  const content = safeString(entry.content);
  const parsed =
    parseWrappedJson<BackstreetThreadData>(content, 'backstreet_thread') ||
    parseWrappedJson<BackstreetThreadData>(content, 'backstreet_archive');
  if (!parsed && !contact) return null;
  return normalizeThread(safeString(parsed?.contact) || contact, parsed);
}

function mergeThreadParts(parts: BackstreetThreadData[]): BackstreetThreadData[] {
  const byContact = new Map<string, BackstreetThreadData>();

  for (const part of parts) {
    const contact = safeString(part.contact);
    if (!contact) continue;

    const existing = byContact.get(contact);
    if (!existing) {
      byContact.set(contact, { ...part, messages: [...part.messages] });
      continue;
    }

    const kind = existing.kind === 'group' || part.kind === 'group' ? 'group' : 'private';
    existing.kind = kind;
    existing.groupName = safeString(existing.groupName) || safeString(part.groupName);
    existing.members = uniqueStrings([...(existing.members || []), ...(part.members || [])]);
    existing.updatedAt = Math.max(Number(existing.updatedAt || 0), Number(part.updatedAt || 0));
    existing.messages.push(...part.messages);
  }

  return Array.from(byContact.values()).map(thread => {
    const byMessageId = new Map<string, BackstreetMessage>();
    for (const message of thread.messages) {
      const id =
        safeString(message.id) ||
        `${message.sender}::${message.speaker || ''}::${message.date || ''}::${message.time || ''}::${message.text}::${message.imageRef || message.imagePrompt || ''}`;
      byMessageId.set(id, message);
    }
    thread.messages = Array.from(byMessageId.values()).sort(
      (left, right) => Number(left.createdAt || 0) - Number(right.createdAt || 0),
    );
    return thread;
  });
}

function normalizeMeta(value: Partial<PhoneMetaData> | null): PhoneMetaData {
  const meta = createEmptyMeta();
  if (!value || typeof value !== 'object') return meta;

  if (value.contacts && typeof value.contacts === 'object') {
    for (const [id, contact] of Object.entries(value.contacts)) {
      const name = safeString(contact?.name) || safeString(id);
      if (!name) continue;
      meta.contacts[name] = {
        name,
        lastMessage: safeString(contact?.lastMessage),
        lastTime: safeString(contact?.lastTime),
        updatedAt: Number(contact?.updatedAt || 0),
      };
    }
  }

  if (value.groups && typeof value.groups === 'object') {
    for (const [id, group] of Object.entries(value.groups)) {
      const groupId = safeString(group?.id) || safeString(id);
      const name = safeString(group?.name);
      const members = normalizeStringArray(group?.members, 24);
      if (!groupId || !name || members.length === 0) continue;
      meta.groups[groupId] = {
        id: groupId,
        name,
        members,
        dissolved: Boolean(group?.dissolved),
        dissolvedAt: Number(group?.dissolvedAt || 0) || undefined,
        lastMessage: safeString(group?.lastMessage),
        lastTime: safeString(group?.lastTime),
        updatedAt: Number(group?.updatedAt || 0),
      };
    }
  }

  if (value.archiveCounters && typeof value.archiveCounters === 'object') {
    for (const [id, count] of Object.entries(value.archiveCounters)) {
      meta.archiveCounters[id] = Number(count || 0);
    }
  }

  return meta;
}

function normalizeStringArray(value: unknown, maxItems = 12): string[] {
  if (!Array.isArray(value)) return [];
  return uniqueStrings(value.map(item => safeString(item)).filter(Boolean)).slice(0, maxItems);
}

function applyGroupMetaToThread(thread: BackstreetThreadData, group?: BackstreetGroup | null): BackstreetThreadData {
  if (!group) return thread;
  const groupId = safeString(group.id) || thread.contact;
  const threadMembers = normalizeStringArray(thread.members, 24);
  const groupMembers = normalizeStringArray(group.members, 24);
  const updatedAt =
    thread.messages.length > 0
      ? Math.max(Number(thread.updatedAt || 0), Number(group.updatedAt || 0))
      : Number(group.updatedAt || thread.updatedAt || Date.now());

  return {
    ...thread,
    contact: groupId,
    kind: 'group',
    groupName: safeString(thread.groupName) || safeString(group.name) || '群聊',
    members: threadMembers.length > 0 ? threadMembers : groupMembers,
    dissolved: Boolean(thread.dissolved || group.dissolved),
    dissolvedAt: Number(thread.dissolvedAt || group.dissolvedAt || 0) || undefined,
    updatedAt,
  };
}

function formatMessageTimestamp(message: Partial<BackstreetMessage>): string {
  return uniqueStrings([message.date, message.time || '--:--']).join(' ') || '--:--';
}

function getMessageSpeaker(message: Partial<BackstreetMessage>, thread?: Partial<BackstreetThreadData> | null): string {
  if (message.sender === 'user') return '<user>';
  if (message.sender === 'system') return '系统';
  return safeString(message.speaker) || (thread?.kind === 'group' ? '群成员' : safeString(thread?.contact) || '对方');
}

function getMessageDisplayText(message: Partial<BackstreetMessage>): string {
  const text = safeString(message.text);
  if (message.kind !== 'image' && !message.imageRef && !message.imagePrompt && !message.imageError) return text;
  if (message.imageError) return `【图片生成失败】${text || message.imageError}`;
  if (message.imageSource === 'user') return `【图片】${text || '用户发送了一张图片'}`;
  return `【图片】${text || '后街插图'}`;
}

function formatMemoryMessageContentLine(message: BackstreetMessage, thread: BackstreetThreadData): string {
  return `${getMessageSpeaker(message, thread)}: ${getMessageDisplayText(message)}`;
}

function extractReadableArchiveFallback(rawContent: string): string {
  const stripped = safeString(rawContent)
    .replace(/<\/?backstreet_(?:thread|archive)[^>]*>/gi, '')
    .trim();
  const parsed = parseJsonBlock<Record<string, unknown>>(stripped);
  const messages = Array.isArray(parsed?.messages) ? parsed.messages : [];
  const normalizedMessages = messages
    .map(item => normalizeMessage((item || {}) as Partial<BackstreetMessage>))
    .filter((message): message is BackstreetMessage => !!message)
    .slice(-12);
  if (normalizedMessages.length > 0) {
    return formatTimestampedLines(
      normalizedMessages,
      message => formatMessageTimestamp(message),
      message => {
        const speaker = message.sender === 'user' ? '<user>' : message.sender === 'system' ? '系统' : '对方';
        return `${speaker}: ${getMessageDisplayText(message)}`;
      },
    );
  }

  const textMatches = [...stripped.matchAll(/"text"\s*:\s*"((?:\\.|[^"\\])*)"/g)]
    .map(match => {
      try {
        return JSON.parse(`"${match[1]}"`) as string;
      } catch {
        return match[1];
      }
    })
    .map(text => safeString(text))
    .filter(Boolean)
    .slice(-12);
  return textMatches.join('\n');
}

function formatMemoryHitContent(rawContent: string, contact: string, thread: BackstreetThreadData): string {
  if (thread.messages.length > 0) {
    return formatTimestampedLines(
      thread.messages.slice(-12),
      message => formatMessageTimestamp(message),
      message => formatMemoryMessageContentLine(message, thread),
    );
  }
  return (
    extractReadableArchiveFallback(rawContent) ||
    `过往后街记录存在，但无法解析为可读消息。${contact ? `联系人：${contact}` : ''}`
  );
}

function createGroupSystemMessage(text: string, date: string, time: string): BackstreetMessage {
  return {
    id: makeId('bst_group_event'),
    sender: 'system',
    speaker: '群通知',
    date: safeString(date) || undefined,
    time: safeString(time) || '--:--',
    text,
    createdAt: Date.now(),
  };
}

function scorePhoneEntry(entry: WorldbookEntry, query: PhoneMemoryQuery): number {
  const title = safeString(entry.comment);
  const content = safeString(entry.content);
  const joined = `${title}\n${content}`;
  if (!joined) return 0;

  let score = 0;
  for (const character of query.characters) {
    const normalizedCharacter = normalizeName(character);
    if (normalizeName(title).includes(normalizedCharacter)) score += 60;
    if (normalizeName(content).includes(normalizedCharacter)) score += 20;
  }
  for (const keyword of query.keywords) {
    if (keyword && normalizeName(joined).includes(normalizeName(keyword))) score += 10;
  }
  for (const location of query.locations) {
    if (location && normalizeName(joined).includes(normalizeName(location))) score += 8;
  }
  if (/BACKSTREET_ARCHIVE/.test(title)) score += 8;
  if (/BACKSTREET_THREAD/.test(title)) score += 4;
  return score;
}

function entryToMemoryHit(entry: WorldbookEntry, score: number): PhoneMemoryHit {
  const title = safeString(entry.comment) || '后街记忆';
  const rawContent = safeString(entry.content);
  const contact = title.match(/BACKSTREET_(?:THREAD|ARCHIVE)::(.+?)::/)?.[1];
  const thread =
    parseWrappedJson<BackstreetThreadData>(rawContent, 'backstreet_thread') ||
    parseWrappedJson<BackstreetThreadData>(rawContent, 'backstreet_archive');
  const normalizedThread = normalizeThread(contact || safeString(thread?.contact), thread);

  return {
    title,
    contact,
    source: '后街手机世界书',
    score,
    content: clipText(formatMemoryHitContent(rawContent, contact || '', normalizedThread), 900),
  };
}

export class BackstreetWorldbookStore {
  private cleanedGeneratedMemoryWorldbooks = new Set<string>();
  private storageReadyWorldbooks = new Set<string>();
  private storageReadyPromises = new Map<string, Promise<void>>();
  private readyWorldbooks = new Set<string>();
  private readyPromises = new Map<string, Promise<void>>();

  private get worldName(): string {
    return worldbookClient.getPhoneWorldbookName();
  }

  async ensureStorageReady(): Promise<void> {
    const worldName = this.worldName;
    if (!worldName) return;
    if (this.storageReadyWorldbooks.has(worldName)) {
      // 聊天元数据在酒馆启动早期可能尚未就绪；后续轻量调用补一次绑定。
      await worldbookClient.ensureCurrentChatWorldbookBinding(worldName);
      return;
    }

    const pending = this.storageReadyPromises.get(worldName);
    if (pending) return pending;

    const readyPromise = (async () => {
      await worldbookClient.ensureWorldbook(worldName);
      this.storageReadyWorldbooks.add(worldName);
    })();
    this.storageReadyPromises.set(worldName, readyPromise);
    try {
      await readyPromise;
    } finally {
      if (this.storageReadyPromises.get(worldName) === readyPromise) this.storageReadyPromises.delete(worldName);
    }
  }

  async ensureReady(): Promise<void> {
    const worldName = this.worldName;
    if (!worldName) return;
    if (this.readyWorldbooks.has(worldName)) {
      // A first load can happen before SillyTavern exposes chat metadata. Retry
      // the binding on later calls without rebuilding the worldbook.
      await worldbookClient.ensureCurrentChatWorldbookBinding(worldName);
      return;
    }

    const pending = this.readyPromises.get(worldName);
    if (pending) return pending;

    const readyPromise = (async () => {
      await this.ensureStorageReady();
      await this.ensureGuideEntry();
      await this.ensureEjsInjectionEntries();
      await this.cleanupGeneratedMemoryEntries();
      this.readyWorldbooks.add(worldName);
    })();
    this.readyPromises.set(worldName, readyPromise);
    try {
      await readyPromise;
    } finally {
      if (this.readyPromises.get(worldName) === readyPromise) this.readyPromises.delete(worldName);
    }
  }

  async ensureGuideEntry(): Promise<void> {
    const guideContent = getGuideContent();
    const existing = await worldbookClient.getEntry(this.worldName, GUIDE_ENTRY, { force: true }).catch(() => null);
    const shouldRefresh =
      !existing ||
      safeString(existing.content) !== guideContent ||
      existing.disable === true ||
      existing.disabled === true ||
      existing.constant !== true ||
      existing.position !== 4 ||
      existing.order !== 800;

    if (shouldRefresh) {
      await worldbookClient.upsertEntry(this.worldName, GUIDE_ENTRY, guideContent, {
        enabled: true,
        constant: true,
        selective: false,
        key: [],
        position: 4,
        role: 0,
        depth: 0,
        order: 800,
      });
      await worldbookClient.refreshWorldbookEditor(this.worldName);
    }
  }

  async ensureEjsInjectionEntries(): Promise<void> {
    await this.ensureEjsInjectionEntry(this.worldName);

    const chatWorldName = worldbookClient.getCurrentChatWorldbookName();
    if (!chatWorldName || chatWorldName === this.worldName) return;

    const isKnownChatWorldbook = await worldbookClient.isKnownWorldbookName(chatWorldName).catch(() => false);
    if (!isKnownChatWorldbook) {
      console.info(`[后街] 当前聊天世界书「${chatWorldName}」未在世界书列表中，跳过后街正文记忆注入条目写入。`);
      return;
    }

    const chatWorldbook = await worldbookClient.readWorldbook(chatWorldName, { allowMissing: true }).catch(() => null);
    if (!chatWorldbook) {
      console.info(`[后街] 当前聊天世界书「${chatWorldName}」不存在，跳过后街正文记忆注入条目写入。`);
      return;
    }
    await this.ensureEjsInjectionEntry(chatWorldName);
  }

  private async ensureEjsInjectionEntry(worldName: string): Promise<void> {
    const targetWorldName = safeString(worldName);
    if (!targetWorldName) return;

    const content = getEjsMemoryContent();
    const legacyDeleted = await worldbookClient
      .deleteEntry(targetWorldName, LEGACY_EJS_INJECT_ENTRY)
      .catch(() => false);

    const existing = await worldbookClient
      .getEntry(targetWorldName, EJS_MEMORY_ENTRY, { force: true })
      .catch(() => null);
    const shouldRefresh =
      legacyDeleted ||
      !existing ||
      safeString(existing.content) !== content ||
      existing.disable === true ||
      existing.disabled === true ||
      existing.constant !== true ||
      existing.position !== 4 ||
      existing.role !== 0 ||
      existing.depth !== 0 ||
      existing.order !== 801;

    if (shouldRefresh) {
      await worldbookClient.upsertEntry(targetWorldName, EJS_MEMORY_ENTRY, content, {
        enabled: true,
        constant: true,
        selective: false,
        key: [],
        position: 4,
        role: 0,
        depth: 0,
        order: 801,
      });
      await worldbookClient.refreshWorldbookEditor(targetWorldName);
    }
  }

  async hasAnyMemory(): Promise<boolean> {
    const entries = await worldbookClient.listEntries(this.worldName, { includeDisabled: true }).catch(() => []);
    return entries.some(entry => /^(\[BACKSTREET_|BACKSTREET_|\[PHONE_META\])/.test(safeString(entry.comment)));
  }

  async cleanupGeneratedMemoryEntries(): Promise<void> {
    const worldName = this.worldName;
    if (this.cleanedGeneratedMemoryWorldbooks.has(worldName)) return;
    this.cleanedGeneratedMemoryWorldbooks.add(worldName);

    const entries = await worldbookClient
      .listEntries(worldName, { includeDisabled: true, force: true })
      .catch(() => []);
    const generatedEntries = entries.filter(entry =>
      /\[?BACKSTREET_(?:MEMORY|BRIDGE)::/.test(safeString(entry.comment)),
    );
    for (const entry of generatedEntries) {
      const comment = safeString(entry.comment);
      if (comment) await worldbookClient.deleteEntry(worldName, comment).catch(() => false);
    }
    if (generatedEntries.length > 0) {
      await worldbookClient.refreshWorldbookEditor(worldName);
      console.info(
        `[后街] 已清理 ${generatedEntries.length} 条旧摘要/关键词桥接世界书条目，后续改用原始聊天固定注入。`,
      );
    }
  }

  async getMeta(): Promise<PhoneMetaData> {
    const entry = await worldbookClient.getEntry(this.worldName, META_ENTRY);
    const meta = normalizeMeta(parseWrappedJson<PhoneMetaData>(safeString(entry?.content), 'phone_meta'));
    const chatGroups = await worldbookClient
      .getChatMetadataValue<Record<string, BackstreetGroup>>(GROUPS_CHAT_METADATA_KEY)
      .catch(() => null);
    if (chatGroups && typeof chatGroups === 'object') {
      meta.groups = {
        ...normalizeMeta({ groups: chatGroups }).groups,
        ...meta.groups,
      };
    }
    return meta;
  }

  async saveMeta(meta: PhoneMetaData): Promise<void> {
    const normalized = normalizeMeta(meta);
    await worldbookClient.upsertStorageEntry(this.worldName, META_ENTRY, wrapJson('phone_meta', normalized));
    await worldbookClient.setChatMetadataValue(GROUPS_CHAT_METADATA_KEY, normalized.groups).catch(() => null);
  }

  async createGroup(name: string, members: string[]): Promise<BackstreetContact> {
    await this.ensureGuideEntry();
    const groupName = safeString(name);
    const groupMembers = normalizeStringArray(members, 24);
    if (!groupName) throw new Error('群聊名称不能为空');
    if (groupMembers.length < 2) throw new Error('至少选择 2 名群成员');

    const meta = await this.getMeta().catch(() => createEmptyMeta());
    const id = makeId('bst_group');
    const group: BackstreetGroup = {
      id,
      name: groupName,
      members: groupMembers,
      dissolved: false,
      lastMessage: '',
      lastTime: '',
      updatedAt: Date.now(),
    };
    meta.groups[id] = group;
    await this.saveMeta(meta);
    await this.saveThread({
      contact: id,
      kind: 'group',
      groupName,
      members: groupMembers,
      dissolved: false,
      updatedAt: group.updatedAt,
      messages: [],
    });
    await worldbookClient.refreshWorldbookEditor(this.worldName);
    return {
      id,
      name: groupName,
      lastMessage: '',
      lastTime: '',
      type: 'group',
      members: groupMembers,
    };
  }

  async addGroupMembers(contact: string, members: string[], date: string, time: string): Promise<BackstreetThreadData> {
    const thread = await this.getThread(contact, { force: true });
    if (thread.kind !== 'group') throw new Error('只能在群聊中拉入成员');
    if (thread.dissolved) throw new Error('群聊已解散，不能拉入成员');

    const currentMembers = normalizeStringArray(thread.members, 24);
    const requestedMembers = normalizeStringArray(members, 24);
    const nextMembers = uniqueStrings([...currentMembers, ...requestedMembers]).slice(0, 24);
    const addedMembers = nextMembers.filter(member => !currentMembers.includes(member));
    if (addedMembers.length === 0) return thread;

    thread.members = nextMembers;
    thread.updatedAt = Date.now();
    thread.messages.push(createGroupSystemMessage(`<user>将${addedMembers.join('、')}拉入群聊。`, date, time));
    await this.archiveIfNeeded(thread);
    await this.saveThread(thread);
    await this.updateMetaFromThread(thread);
    await worldbookClient.refreshWorldbookEditor(this.worldName);
    return this.getThread(contact, { force: true });
  }

  async removeGroupMember(contact: string, member: string, date: string, time: string): Promise<BackstreetThreadData> {
    const thread = await this.getThread(contact, { force: true });
    if (thread.kind !== 'group') throw new Error('只能在群聊中踢出成员');
    if (thread.dissolved) throw new Error('群聊已解散，不能踢出成员');

    const currentMembers = normalizeStringArray(thread.members, 24);
    const normalizedTarget = normalizeName(member);
    const removedMember = currentMembers.find(name => normalizeName(name) === normalizedTarget);
    if (!removedMember) return thread;
    if (currentMembers.length <= 1) throw new Error('至少保留 1 名群成员，若不再使用请解散群聊');

    thread.members = currentMembers.filter(name => name !== removedMember);
    thread.updatedAt = Date.now();
    thread.messages.push(createGroupSystemMessage(`<user>将${removedMember}移出群聊。`, date, time));
    await this.archiveIfNeeded(thread);
    await this.saveThread(thread);
    await this.updateMetaFromThread(thread);
    await worldbookClient.refreshWorldbookEditor(this.worldName);
    return this.getThread(contact, { force: true });
  }

  async dissolveGroup(contact: string, date: string, time: string): Promise<BackstreetThreadData> {
    const thread = await this.getThread(contact, { force: true });
    if (thread.kind !== 'group') throw new Error('只能解散群聊');
    if (thread.dissolved) return thread;

    thread.dissolved = true;
    thread.dissolvedAt = Date.now();
    thread.updatedAt = thread.dissolvedAt;
    thread.messages.push(createGroupSystemMessage(`<user>解散了群聊。`, date, time));
    await this.archiveIfNeeded(thread);
    await this.saveThread(thread);
    await this.removeGroupFromMeta(contact);
    await worldbookClient.refreshWorldbookEditor(this.worldName);
    return this.getThread(contact, { force: true });
  }

  async getThread(contact: string, options: { force?: boolean } = {}): Promise<BackstreetThreadData> {
    await this.ensureStorageReady();
    const entry = await worldbookClient.getEntry(this.worldName, getThreadEntryName(contact), options);
    const thread = normalizeThread(
      contact,
      parseWrappedJson<BackstreetThreadData>(safeString(entry?.content), 'backstreet_thread'),
    );
    const meta = await this.getMeta().catch(() => createEmptyMeta());
    return applyGroupMetaToThread(thread, meta.groups[contact]);
  }

  async listRawThreads(options: { force?: boolean } = {}): Promise<BackstreetThreadData[]> {
    await this.ensureGuideEntry();
    await this.cleanupGeneratedMemoryEntries();
    const entries = await worldbookClient
      .listEntries(this.worldName, { includeDisabled: true, force: options.force })
      .catch(() => []);
    const parts = entries
      .filter(entry => /\[?BACKSTREET_(?:THREAD|ARCHIVE)::/.test(safeString(entry.comment)))
      .map(parseThreadLikeEntry)
      .filter((thread): thread is BackstreetThreadData => !!thread);
    const meta = await this.getMeta().catch(() => createEmptyMeta());
    return mergeThreadParts(parts).map(thread => applyGroupMetaToThread(thread, meta.groups[thread.contact]));
  }

  async saveThread(thread: BackstreetThreadData): Promise<void> {
    await worldbookClient.upsertStorageEntry(
      this.worldName,
      getThreadEntryName(thread.contact),
      wrapJson('backstreet_thread', thread),
    );
  }

  async appendMessages(contact: string, messages: BackstreetMessage[]): Promise<BackstreetThreadData> {
    await this.ensureGuideEntry();
    await this.cleanupGeneratedMemoryEntries();
    const thread = await this.getThread(contact);
    if (thread.kind === 'group' && thread.dissolved && messages.some(message => message.sender !== 'system')) {
      throw new Error('群聊已解散，不能继续发送消息');
    }
    thread.messages.push(...messages);
    thread.updatedAt = Date.now();
    await this.archiveIfNeeded(thread);
    await this.saveThread(thread);
    await this.updateMetaFromThread(thread);
    await worldbookClient.refreshWorldbookEditor(this.worldName);
    return this.getThread(contact, { force: true });
  }

  async deleteMessage(contact: string, messageId: string): Promise<BackstreetThreadData> {
    const thread = await this.getThread(contact);
    const messageIndex = thread.messages.findIndex(message => message.id === messageId);
    if (messageIndex < 0) return thread;

    thread.messages = thread.messages.slice(0, messageIndex);
    thread.updatedAt = Date.now();
    await this.saveThread(thread);
    await this.updateMetaFromThread(thread);
    await worldbookClient.refreshWorldbookEditor(this.worldName);
    return thread;
  }

  async deleteMessagesAfter(contact: string, messageId: string): Promise<BackstreetThreadData> {
    const thread = await this.getThread(contact);
    const messageIndex = thread.messages.findIndex(message => message.id === messageId);
    if (messageIndex < 0) return thread;

    thread.messages = thread.messages.slice(0, messageIndex + 1);
    thread.updatedAt = Date.now();
    await this.saveThread(thread);
    await this.updateMetaFromThread(thread);
    await worldbookClient.refreshWorldbookEditor(this.worldName);
    return thread;
  }

  async replaceMessage(
    contact: string,
    messageId: string,
    nextMessage: BackstreetMessage,
  ): Promise<BackstreetThreadData> {
    const thread = await this.getThread(contact);
    const messageIndex = thread.messages.findIndex(message => message.id === messageId);
    if (messageIndex < 0) return thread;

    thread.messages[messageIndex] = normalizeMessage(nextMessage) || nextMessage;
    thread.updatedAt = Date.now();
    await this.saveThread(thread);
    await this.updateMetaFromThread(thread);
    await worldbookClient.refreshWorldbookEditor(this.worldName);
    return thread;
  }

  async listContacts(characterData: any): Promise<BackstreetContact[]> {
    await this.ensureStorageReady();
    const meta = await this.getMeta().catch(() => createEmptyMeta());
    const relationSystem = characterData?.关系系统 || {};
    const presentNames = Array.isArray(relationSystem?.在场人物) ? relationSystem.在场人物 : [];
    const relationNames = Object.entries(relationSystem)
      .filter(([name, value]) => {
        if (name === '在场人物' || !value || typeof value !== 'object') return false;
        const relation = value as { 好感度?: unknown; 关系类型?: unknown };
        const affection = Number(relation.好感度 || 0);
        const type = safeString(relation.关系类型);
        return affection > 0 || (!!type && type !== '陌生人');
      })
      .map(([name]) => name);
    const names = uniqueStrings([
      ...Object.values(meta.contacts).map(contact => contact.name),
      ...presentNames,
      ...relationNames,
    ]);

    const privateContacts = names.map(name => {
      const metaContact = meta.contacts[name];
      return {
        id: name,
        name,
        lastMessage: safeString(metaContact?.lastMessage),
        lastTime: safeString(metaContact?.lastTime),
        type: 'private' as const,
      };
    });
    const groups = Object.values(meta.groups || {})
      .filter(group => !group.dissolved)
      .sort((left, right) => Number(right.updatedAt || 0) - Number(left.updatedAt || 0))
      .map(group => ({
        id: group.id,
        name: group.name,
        lastMessage: safeString(group.lastMessage),
        lastTime: safeString(group.lastTime),
        type: 'group' as const,
        members: normalizeStringArray(group.members, 24),
        dissolved: Boolean(group.dissolved),
      }));

    return [...groups, ...privateContacts];
  }

  async searchMemory(query: PhoneMemoryQuery): Promise<PhoneMemoryHit[]> {
    const entries = await worldbookClient.listEntries(this.worldName, { includeDisabled: true }).catch(() => []);
    return entries
      .filter(entry => /\[?BACKSTREET_(?:THREAD|ARCHIVE)::/.test(safeString(entry.comment)))
      .map(entry => ({ entry, score: scorePhoneEntry(entry, query) }))
      .filter(item => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, query.limit)
      .map(item => entryToMemoryHit(item.entry, item.score));
  }

  async searchArchiveMemory(query: PhoneMemoryQuery): Promise<PhoneMemoryHit[]> {
    const entries = await worldbookClient.listEntries(this.worldName, { includeDisabled: true }).catch(() => []);
    return entries
      .filter(entry => /\[?BACKSTREET_ARCHIVE::/.test(safeString(entry.comment)))
      .map(entry => ({ entry, score: scorePhoneEntry(entry, query) }))
      .filter(item => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, query.limit)
      .map(item => entryToMemoryHit(item.entry, item.score));
  }

  private async archiveIfNeeded(thread: BackstreetThreadData): Promise<void> {
    if (thread.messages.length <= MAX_HEAD_MESSAGES) return;

    const meta = await this.getMeta().catch(() => createEmptyMeta());
    const overflowCount = thread.messages.length - MAX_HEAD_MESSAGES;
    const archivedMessages = thread.messages.splice(0, overflowCount);
    const nextIndex = (meta.archiveCounters[thread.contact] || 0) + 1;
    meta.archiveCounters[thread.contact] = nextIndex;

    await worldbookClient.upsertStorageEntry(
      this.worldName,
      getArchiveEntryName(thread.contact, nextIndex),
      wrapJson('backstreet_archive', {
        contact: thread.contact,
        kind: thread.kind,
        groupName: thread.groupName,
        members: thread.members,
        dissolved: thread.dissolved,
        dissolvedAt: thread.dissolvedAt,
        messages: archivedMessages,
      }),
    );
    await this.saveMeta(meta);
  }

  private async updateMetaFromThread(thread: BackstreetThreadData): Promise<void> {
    const meta = await this.getMeta().catch(() => createEmptyMeta());
    const last = thread.messages.at(-1);
    if (thread.kind === 'group') {
      const existing = meta.groups[thread.contact];
      meta.groups[thread.contact] = {
        id: thread.contact,
        name: safeString(thread.groupName) || safeString(existing?.name) || '群聊',
        members: normalizeStringArray(thread.members?.length ? thread.members : existing?.members, 24),
        dissolved: Boolean(thread.dissolved || existing?.dissolved),
        dissolvedAt: Number(thread.dissolvedAt || existing?.dissolvedAt || 0) || undefined,
        lastMessage: getMessageDisplayText(last || {}),
        lastTime: safeString(last?.time),
        updatedAt: thread.updatedAt,
      };
    } else {
      meta.contacts[thread.contact] = {
        name: thread.contact,
        lastMessage: getMessageDisplayText(last || {}),
        lastTime: safeString(last?.time),
        updatedAt: thread.updatedAt,
      };
    }
    await this.saveMeta(meta);
  }

  private async removeGroupFromMeta(contact: string): Promise<void> {
    const meta = await this.getMeta().catch(() => createEmptyMeta());
    delete meta.groups[contact];
    await this.saveMeta(meta);
  }
}

export const backstreetWorldbookStore = new BackstreetWorldbookStore();
