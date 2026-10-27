import { characterBattleStats } from '../character-stats.compact';
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
}

type TavernQuery = (selector: string) => TavernQueryResult;

type TavernVariableGlobal = typeof globalThis & {
  toastr?: TavernToastApi;
  $?: TavernQuery;
  jQuery?: TavernQuery;
};

const Q_AVATAR_ASSET_BASE_URL = 'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/Q版/';
const Q_AVATAR_FILE_OVERRIDES: Record<string, string> = {
  '响木天音_苍蓝星形态.png': '响木天音.png',
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

export function readRelationshipSystemView(messageId: number, variableRevision = 0): RelationshipSystemView {
  void variableRevision;

  const snapshot = getVariables({ type: 'message', message_id: messageId });
  const relationshipSystem = asRecord(readPath(snapshot, ['stat_data', '关系系统']));
  if (relationshipSystem === null) {
    return { presentNames: [], contacts: [] };
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

  return { presentNames, contacts };
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

/** Restore focus only after the map's modal and its inert background have been removed. */
export function focusTavernInput() {
  for (const runtime of getTavernRuntimeCandidates()) {
    const documentRef = runtime.document;
    if (!documentRef) continue;
    const input = TAVERN_INPUT_SELECTORS.map(selector => documentRef.querySelector(selector)).find(
      element => element?.tagName === 'TEXTAREA' || element?.tagName === 'INPUT',
    ) as HTMLTextAreaElement | HTMLInputElement | undefined;
    if (!input) continue;
    input.focus();
    input.setSelectionRange?.(input.value.length, input.value.length);
    return true;
  }
  return false;
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

export function resolveRelationshipAvatarUrl(name: string) {
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

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(value => value?.trim() ?? '').filter(value => value.length > 0)));
}
