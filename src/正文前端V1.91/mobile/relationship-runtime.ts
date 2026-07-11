import { characterBattleStats } from '../character-stats';
import type { CharacterBattleStats } from '../character-stats';
import { fullbodyPortraitProfiles } from '../portrait-registry';
import type { FullbodyPortraitProfile } from '../portrait-registry';

export interface RelationshipContact {
  name: string;
  affection: number;
  relationType: string;
  faction: string;
  avatarUrl: string | null;
}

export interface RelationshipSystemView {
  presentNames: string[];
  contacts: RelationshipContact[];
}

export interface ContactFaction {
  name: string;
  contacts: RelationshipContact[];
}

type MvuMessageOption = { type: 'message'; message_id: number | 'latest' };
type TavernToastKind = 'info' | 'success' | 'warning' | 'error';

interface TavernToastApi {
  info?: (message: string, title?: string) => void;
  success?: (message: string, title?: string) => void;
  warning?: (message: string, title?: string) => void;
  error?: (message: string, title?: string) => void;
}

interface TavernQueryResult {
  length: number;
  [index: number]: { focus?: () => void } | undefined;
  val?: (value: string) => unknown;
  trigger?: (eventName: string) => unknown;
  prop?: (propertyName: string) => unknown;
}

type TavernQuery = (selector: string) => TavernQueryResult;

type TavernVariableGlobal = typeof globalThis & {
  Mvu?: {
    getMvuData?: (option: MvuMessageOption) => unknown;
    replaceMvuData?: (data: unknown, option: MvuMessageOption) => unknown | Promise<unknown>;
  };
  waitGlobalInitialized?: (name: string) => unknown | Promise<unknown>;
  getVariables?: (option: MvuMessageOption) => unknown;
  executeSlashCommand?: (command: string) => unknown | Promise<unknown>;
  chat?: Record<string, unknown>;
  character?: Record<string, unknown>;
  toastr?: TavernToastApi;
  $?: TavernQuery;
  jQuery?: TavernQuery;
};

const Q_AVATAR_ASSET_BASE_URL = 'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/Q版/';
const Q_AVATAR_FILE_OVERRIDES: Record<string, string> = {
  '响木天音校服.png': '响木天音.png',
};
const TAVERN_INPUT_SELECTORS = [
  '#send_textarea',
  'textarea[name="send_textarea"]',
  '.send_textarea',
  'textarea[placeholder*="Message"]',
  'textarea[placeholder*="消息"]',
  '.chat-input textarea',
  '#chat-input textarea',
];
const TAVERN_SEND_BUTTON_SELECTORS = [
  '#send_but',
  'button[type="submit"]',
  '.send-button',
  'button.send',
  '[data-send-button]',
  'button[aria-label*="Send"]',
  'button[aria-label*="发送"]',
];
const SEX_BATTLE_DEFAULT_TYPE = '决斗';
const COMBAT_MVU_SOURCE_SCAN_LIMIT = 12;

export function readRelationshipSystemView(messageId: number, variableRevision = 0): RelationshipSystemView {
  void variableRevision;

  for (const snapshot of readVariableSnapshots(messageId)) {
    const relationshipSystem =
      asRecord(readPath(snapshot, ['stat_data', '关系系统'])) ?? asRecord(readPath(snapshot, ['关系系统']));
    if (relationshipSystem === null) {
      continue;
    }

    const presentNames = normalizeRelationshipNameList(relationshipSystem['在场人物']);
    const contacts: RelationshipContact[] = [];

    for (const [name, value] of Object.entries(relationshipSystem)) {
      if (name === '在场人物') {
        continue;
      }

      const source = asRecord(unwrapMvuValue(value));
      if (source !== null) {
        contacts.push(createRelationshipContact(name, source));
      }
    }

    if (presentNames.length > 0 || contacts.length > 0) {
      return { presentNames, contacts };
    }
  }

  return { presentNames: [], contacts: [] };
}

export function createRelationshipContact(name: string, source: Record<string, unknown> | null): RelationshipContact {
  return {
    name,
    affection: normalizeRelationshipNumber(source?.['好感度']),
    relationType: normalizeRelationshipText(source?.['关系类型']) || '陌生人',
    faction: resolveRelationshipFaction(name, source),
    avatarUrl: resolveRelationshipAvatarUrl(name),
  };
}

export function findRelationshipContact(name: string, contacts: RelationshipContact[]) {
  return contacts.find(contact => isSameRelationshipName(contact.name, name)) ?? null;
}

export function groupContactsByFaction(contacts: RelationshipContact[]): ContactFaction[] {
  const groups = new Map<string, RelationshipContact[]>();

  for (const contact of contacts) {
    const faction = contact.faction || '未分组';
    groups.set(faction, [...(groups.get(faction) ?? []), contact]);
  }

  return Array.from(groups.entries())
    .map(([name, factionContacts]) => ({
      name,
      contacts: [...factionContacts].sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN')),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN'));
}

export function resolveRelationshipProfile(name: string): FullbodyPortraitProfile | null {
  return (
    fullbodyPortraitProfiles.find(profile =>
      profile.names.some(alias => matchesRelationshipName(name, alias) || matchesRelationshipName(alias, name)),
    ) ?? null
  );
}

export function resolveRelationshipBattleStats(
  name: string,
  profile: FullbodyPortraitProfile | null,
): CharacterBattleStats | null {
  const candidates = uniqueNonEmpty([name, profile?.fileName.replace(/\.[^.]+$/, ''), ...(profile?.names ?? [])]);

  return (
    characterBattleStats.find(stats =>
      candidates.some(
        candidate => matchesRelationshipName(stats.name, candidate) || matchesRelationshipName(candidate, stats.name),
      ),
    ) ?? null
  );
}

export async function startRelationshipSexBattle(
  enemyName: string,
  sourceMessageId: number,
  fallbackCharacterName: string,
) {
  await writeLatestCombatEnemyName(enemyName, sourceMessageId);
  return sendFightMessageAsCharacter(fallbackCharacterName);
}

export function showTavernNotice(message: string, title: string, kind: TavernToastKind) {
  for (const runtime of getTavernRuntimeCandidates()) {
    const notify = runtime.toastr?.[kind];
    if (typeof notify === 'function') {
      notify.call(runtime.toastr, message, title);
      return;
    }
  }

  if (typeof window !== 'undefined') {
    window.alert(`${title}\n${message}`);
  }
}

export function writeTextToTavernInput(text: string) {
  const normalizedText = text.trim();
  if (normalizedText.length === 0) {
    return false;
  }

  return getTavernRuntimeCandidates().some(runtime => writeTextToTavernRuntimeInput(runtime, normalizedText));
}

function resolveRelationshipFaction(name: string, source: Record<string, unknown> | null) {
  const explicitFaction = uniqueNonEmpty([
    normalizeRelationshipText(source?.['阵营']),
    normalizeRelationshipText(source?.['所属阵营']),
    normalizeRelationshipText(source?.['所属势力']),
    normalizeRelationshipText(source?.['势力']),
    normalizeRelationshipText(source?.['所属']),
  ])[0];
  if (explicitFaction !== undefined) {
    return explicitFaction;
  }

  return resolveRelationshipProfile(name)?.affiliation?.trim() || '未分组';
}

function resolveRelationshipAvatarUrl(name: string) {
  const profile = resolveRelationshipProfile(name);
  if (profile === null) {
    return null;
  }

  return resolveQAvatarAssetUrl(Q_AVATAR_FILE_OVERRIDES[profile.fileName] ?? profile.fileName);
}

function resolveQAvatarAssetUrl(fileName: string) {
  try {
    return new URL(fileName, Q_AVATAR_ASSET_BASE_URL).href;
  } catch {
    return `${Q_AVATAR_ASSET_BASE_URL}${encodeURIComponent(fileName)}`;
  }
}

function normalizeRelationshipNameList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueNonEmpty(value.map(item => normalizeRelationshipText(item)));
}

function normalizeRelationshipText(value: unknown) {
  return String(unwrapMvuValue(value) ?? '').trim();
}

function normalizeRelationshipNumber(value: unknown) {
  const numericValue = Number(unwrapMvuValue(value) ?? 0);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(numericValue)));
}

function isSameRelationshipName(left: string, right: string) {
  return matchesRelationshipName(left, right) || matchesRelationshipName(right, left);
}

function matchesRelationshipName(speakerName: string, alias: string) {
  const normalizedSpeakerName = normalizeCharacterLookupText(speakerName);
  const normalizedAlias = normalizeCharacterLookupText(alias);
  if (normalizedSpeakerName.length === 0 || normalizedAlias.length === 0) {
    return false;
  }

  return (
    normalizedSpeakerName === normalizedAlias ||
    (normalizedAlias.length >= 2 && normalizedSpeakerName.startsWith(normalizedAlias))
  );
}

function normalizeCharacterLookupText(value: string) {
  return value
    .replace(/[{}·・•‧∙･．.]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase();
}

function readVariableSnapshots(messageId: number) {
  return [
    readMvuData(messageId),
    readVariables(messageId),
    readMvuData('latest'),
    readVariables('latest'),
    readMvuData(0),
    readVariables(0),
  ];
}

function readMvuData(messageId: number | 'latest') {
  for (const runtime of getTavernRuntimeCandidates()) {
    try {
      const value = runtime.Mvu?.getMvuData?.({ type: 'message', message_id: messageId });
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch {
      // The parent frame may expose MVU even when the renderer frame does not.
    }
  }

  return null;
}

function readVariables(messageId: number | 'latest') {
  for (const runtime of getTavernRuntimeCandidates()) {
    try {
      const value = runtime.getVariables?.({ type: 'message', message_id: messageId });
      if (value !== null && value !== undefined) {
        return value;
      }
    } catch {
      // Continue through runtime candidates.
    }
  }

  return null;
}

function getTavernRuntimeCandidates() {
  const candidates: TavernVariableGlobal[] = [globalThis as TavernVariableGlobal];
  try {
    if (typeof window !== 'undefined' && window.parent !== window) {
      candidates.push(window.parent as unknown as TavernVariableGlobal);
    }
  } catch {
    // Cross-frame access can be blocked in standalone previews.
  }

  return candidates.filter((candidate, index) => candidates.indexOf(candidate) === index);
}

function buildCombatMvuSourceOptions(sourceMessageId: number) {
  const options: MvuMessageOption[] = [
    { type: 'message', message_id: sourceMessageId },
    { type: 'message', message_id: 'latest' },
  ];
  const seen = new Set(options.map(option => String(option.message_id)));

  for (
    let messageId = sourceMessageId - 1;
    messageId >= Math.max(0, sourceMessageId - COMBAT_MVU_SOURCE_SCAN_LIMIT);
    messageId -= 1
  ) {
    const key = String(messageId);
    if (!seen.has(key)) {
      seen.add(key);
      options.push({ type: 'message', message_id: messageId });
    }
  }

  return options;
}

function findCombatSourceStatData(runtime: TavernVariableGlobal, sourceMessageId: number) {
  if (typeof runtime.Mvu?.getMvuData !== 'function') {
    return null;
  }

  for (const option of buildCombatMvuSourceOptions(sourceMessageId)) {
    try {
      const mvuData = runtime.Mvu.getMvuData(option);
      const statData = asRecord(asRecord(unwrapMvuValue(mvuData))?.stat_data);
      if (hasCombatPlayerState(statData)) {
        return statData;
      }
    } catch {
      // Deleted or rerolled floors may fail to read; keep scanning.
    }
  }

  return null;
}

function hasCombatPlayerState(statData: Record<string, unknown> | null) {
  if (statData === null) {
    return false;
  }

  return (
    readPath(statData, ['核心状态', '$最大耐力']) !== undefined ||
    readPath(statData, ['核心状态', '$耐力']) !== undefined ||
    readPath(statData, ['基础属性', '_魅力']) !== undefined ||
    asRecord(readPath(statData, ['技能系统', '主动技能'])) !== null
  );
}

function ensureCombatConfig(statData: Record<string, unknown>, enemyName: string) {
  setRecordPath(statData, ['性斗系统', '对手名称'], enemyName);

  if (String(readPath(statData, ['性斗系统', '性斗类型']) ?? '').trim().length === 0) {
    setRecordPath(statData, ['性斗系统', '性斗类型'], SEX_BATTLE_DEFAULT_TYPE);
  }

  const climaxLimit = toFiniteNumber(readPath(statData, ['性斗系统', '胜负规则', '高潮次数上限']));
  if (climaxLimit === null || climaxLimit < 1) {
    setRecordPath(statData, ['性斗系统', '胜负规则', '高潮次数上限'], 1);
  }

  if (readPath(statData, ['性斗系统', '胜负规则', '允许认输']) === undefined) {
    setRecordPath(statData, ['性斗系统', '胜负规则', '允许认输'], true);
  }
}

async function writeLatestCombatEnemyName(enemyName: string, sourceMessageId: number) {
  const latestMessageOption: MvuMessageOption = { type: 'message', message_id: 'latest' };

  for (const runtime of getTavernRuntimeCandidates()) {
    try {
      if (typeof runtime.waitGlobalInitialized === 'function') {
        await runtime.waitGlobalInitialized('Mvu');
      }
    } catch {
      // Continue with direct MVU probing.
    }

    if (typeof runtime.Mvu?.getMvuData !== 'function' || typeof runtime.Mvu.replaceMvuData !== 'function') {
      continue;
    }

    let mvuData = runtime.Mvu.getMvuData(latestMessageOption);
    let mvuRecord = asRecord(unwrapMvuValue(mvuData));
    if (mvuRecord === null) {
      mvuData = { stat_data: {}, display_data: {}, delta_data: {} };
      mvuRecord = asRecord(mvuData);
    }

    if (mvuRecord === null) {
      continue;
    }

    const sourceStatData = findCombatSourceStatData(runtime, sourceMessageId);
    if (sourceStatData !== null) {
      mvuRecord.stat_data = cloneValue(sourceStatData);
    }

    let statData = asRecord(mvuRecord.stat_data);
    if (statData === null) {
      mvuRecord.stat_data = {};
      statData = asRecord(mvuRecord.stat_data);
    }

    if (statData === null) {
      continue;
    }

    ensureCombatConfig(statData, enemyName);
    await runtime.Mvu.replaceMvuData(mvuData, latestMessageOption);
    return;
  }

  throw Error('MVU replaceMvuData is unavailable');
}

async function sendFightMessageAsCharacter(fallbackCharacterName: string) {
  const runtime = getTavernRuntimeCandidates().find(
    candidate =>
      typeof candidate.executeSlashCommand === 'function' ||
      typeof candidate.$ === 'function' ||
      typeof candidate.jQuery === 'function' ||
      typeof candidate.document?.querySelector === 'function',
  );
  if (runtime === undefined) {
    return false;
  }

  const character = readCurrentCharacterInfo(runtime, fallbackCharacterName);
  const command = [
    `/sendas name="${escapeSlashCommandValue(character.name)}"`,
    character.avatar.length > 0 ? `avatar="${escapeSlashCommandValue(character.avatar)}"` : '',
    '<fight>',
  ]
    .filter(part => part.length > 0)
    .join(' ');

  if (typeof runtime.executeSlashCommand === 'function') {
    await runtime.executeSlashCommand(command);
    return true;
  }

  return sendCommandThroughInput(runtime, command);
}

function readCurrentCharacterInfo(runtime: TavernVariableGlobal, fallbackCharacterName: string) {
  const chat = asRecord(runtime.chat);
  const characterList = Array.isArray(chat?.characters) ? chat.characters : [];
  const firstCharacter = asRecord(characterList[0]);
  const chatCharacter = asRecord(chat?.character);
  const globalCharacter = asRecord(runtime.character);
  const lastMessage = Array.isArray(chat?.messages) ? asRecord(chat.messages[chat.messages.length - 1]) : null;
  const fallbackMessageName =
    lastMessage !== null && lastMessage.is_user !== true ? String(lastMessage.name ?? '').trim() : '';

  return {
    name:
      String(firstCharacter?.name ?? firstCharacter?.title ?? '').trim() ||
      String(chatCharacter?.name ?? chatCharacter?.title ?? '').trim() ||
      String(globalCharacter?.name ?? globalCharacter?.title ?? '').trim() ||
      fallbackMessageName ||
      fallbackCharacterName,
    avatar:
      String(firstCharacter?.avatar ?? '').trim() ||
      String(chatCharacter?.avatar ?? '').trim() ||
      String(globalCharacter?.avatar ?? '').trim() ||
      String(lastMessage?.avatar ?? '').trim(),
  };
}

function sendCommandThroughInput(runtime: TavernVariableGlobal, command: string) {
  if (!writeTextToTavernRuntimeInput(runtime, command)) {
    return false;
  }

  const query =
    typeof runtime.$ === 'function' ? runtime.$ : typeof runtime.jQuery === 'function' ? runtime.jQuery : null;
  if (query !== null) {
    setTimeout(() => {
      for (const selector of TAVERN_SEND_BUTTON_SELECTORS) {
        const sendButton = query(selector);
        if (sendButton.length > 0 && sendButton.prop?.('disabled') !== true) {
          sendButton.trigger?.('click');
          return;
        }
      }
    }, 50);
    return true;
  }

  const documentRef = runtime.document ?? (typeof document === 'undefined' ? null : document);
  if (documentRef === null) {
    return false;
  }

  setTimeout(() => {
    const sendButton = TAVERN_SEND_BUTTON_SELECTORS.map(selector => documentRef.querySelector(selector)).find(
      element => element !== null && element.tagName === 'BUTTON' && !(element as HTMLButtonElement).disabled,
    ) as HTMLButtonElement | undefined;
    sendButton?.click();
  }, 50);
  return true;
}

function writeTextToTavernRuntimeInput(runtime: TavernVariableGlobal, text: string) {
  const query =
    typeof runtime.$ === 'function' ? runtime.$ : typeof runtime.jQuery === 'function' ? runtime.jQuery : null;
  if (query !== null) {
    for (const selector of TAVERN_INPUT_SELECTORS) {
      const input = query(selector);
      if (input.length > 0) {
        input.val?.(text);
        input.trigger?.('input');
        input.trigger?.('change');
        input.trigger?.('focus');
        input[0]?.focus?.();
        return true;
      }
    }
  }

  const documentRef = runtime.document ?? (typeof document === 'undefined' ? null : document);
  if (documentRef === null) {
    return false;
  }

  const input = TAVERN_INPUT_SELECTORS.map(selector => documentRef.querySelector(selector)).find(
    element => element !== null && (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT'),
  ) as HTMLTextAreaElement | HTMLInputElement | undefined;
  if (input === undefined) {
    return false;
  }

  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.focus();
  input.setSelectionRange?.(input.value.length, input.value.length);
  return true;
}

function setRecordPath(target: Record<string, unknown>, path: string[], value: unknown) {
  let current = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    const next = asRecord(current[key]);
    if (next === null) {
      current[key] = {};
      current = current[key] as Record<string, unknown>;
    } else {
      current = next;
    }
  }

  current[path[path.length - 1]] = value;
}

function readPath(source: unknown, path: string[]) {
  let current = source;

  for (const key of path) {
    const record = asRecord(unwrapMvuValue(current));
    if (record === null || !(key in record)) {
      return undefined;
    }

    current = record[key];
  }

  return unwrapMvuValue(current);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function unwrapMvuValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

function toFiniteNumber(value: unknown) {
  const unwrapped = unwrapMvuValue(value);
  if (typeof unwrapped === 'number' && Number.isFinite(unwrapped)) {
    return unwrapped;
  }

  if (typeof unwrapped === 'string' && unwrapped.trim().length > 0) {
    const parsed = Number(unwrapped);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function cloneValue<T>(value: T): T {
  if (value === undefined) {
    return value;
  }

  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function escapeSlashCommandValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(value => value?.trim() ?? '').filter(value => value.length > 0)));
}
