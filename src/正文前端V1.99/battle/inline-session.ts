import { computed, shallowReactive } from 'vue';
import { klona } from 'klona';
import { EXPERIENCE_STATE_KEY, settleExperience } from '../progression/experience';
import { ensureMoney, mergeMoneyChanges } from '../money/ledger';
import { AMAMI_STATE_KEY, getAmamiState } from '../state/model';
import { hydrateAmamiState } from '../state/persistence';
import {
  ATTRIBUTE_POINT_RULES,
  getAttributeGrowthState,
  type AllocatableAttribute,
  type GrowthAttribute,
} from '../progression/attribute-growth';
import type { CombatPageApi } from '../../性斗（Battle Fuck）/integration/embedded-context';

const EXTRA_KEY = 'bp_inline_battle_v198';
const PLAYER_KEYS = ['角色基础', '基础属性', '核心状态', '技能系统', '物品系统', '永久状态', '临时状态'];
const sessions = shallowReactive(new Map<number, InlineCombatSession>());
let combatNarrationDepth = 0;

export interface InlineCombatSession {
  id: string;
  sourceMessageId: number;
  variableMessageId: number;
  swipeId: number;
  enemyName: string;
  visible: boolean;
  opened: boolean;
  entrancePending: boolean;
  data: Mvu.MvuData;
  playerData: Record<string, unknown>;
  writing: number;
  playerRefreshPending: boolean;
  api?: CombatPageApi;
  dispose?: () => void;
}

function readPlayerData(data: Mvu.MvuData) {
  return klona(_.pick(data.stat_data, PLAYER_KEYS));
}

function makeSession(sourceMessageId: number, data: Mvu.MvuData, id: string, opened: boolean) {
  hydrateAmamiState(data, sourceMessageId);
  ensureMoney(data);
  return shallowReactive<InlineCombatSession>({
    id,
    sourceMessageId,
    variableMessageId: sourceMessageId,
    swipeId: SillyTavern.chat[sourceMessageId]?.swipe_id ?? 0,
    enemyName: data.stat_data.性斗系统.对手名称,
    visible: opened,
    opened,
    entrancePending: opened,
    data,
    playerData: readPlayerData(data),
    writing: 0,
    playerRefreshPending: false,
  });
}

export function useInlineCombat(messageId: number) {
  return computed(() => sessions.get(messageId));
}

export function attachInlineCombatView(session: InlineCombatSession, disposeFrame: () => void) {
  const playEntrance = session.entrancePending;
  session.entrancePending = false;
  session.dispose = disposeFrame;
  return {
    playEntrance,
    setApi(api: CombatPageApi | undefined) {
      if (session.dispose === disposeFrame) session.api = api;
    },
    detach() {
      if (session.dispose !== disposeFrame) return;
      session.dispose = undefined;
      session.api = undefined;
    },
  };
}

export async function startInlineCombat(sourceMessageId: number, selectedEnemyName?: string) {
  await waitGlobalInitialized('Mvu');
  const data = klona(Mvu.getMvuData({ type: 'message', message_id: sourceMessageId }));
  const enemyName = (selectedEnemyName ?? data.stat_data.性斗系统?.对手名称 ?? '').trim();
  if (!enemyName) throw new Error('当前楼层未指定对手，请从什亭之匣选择人物。');
  data.stat_data.性斗系统 = { ...data.stat_data.性斗系统, 对手名称: enemyName };

  const previous = sessions.get(sourceMessageId);
  const id = crypto.randomUUID();
  const message = getChatMessages(sourceMessageId)[0];
  // The launch choice belongs to message metadata, outside the variables MVU can reconstruct.
  await setChatMessages(
    [
      {
        message_id: sourceMessageId,
        extra: {
          ...message.extra,
          [EXTRA_KEY]: {
            id,
            swipeId: SillyTavern.chat[sourceMessageId]?.swipe_id ?? 0,
            config: klona(data.stat_data.性斗系统),
          },
        },
      },
    ],
    { refresh: 'none' },
  );
  previous?.dispose?.();
  sessions.set(sourceMessageId, makeSession(sourceMessageId, data, id, true));
  return enemyName;
}

export async function restoreInlineCombat(sourceMessageId: number) {
  if (sessions.has(sourceMessageId)) return;
  const record = getChatMessages(sourceMessageId)[0]?.extra?.[EXTRA_KEY];
  const swipeId = SillyTavern.chat[sourceMessageId]?.swipe_id ?? 0;
  if (!record?.config?.对手名称 || record.swipeId !== swipeId) return;
  await waitGlobalInitialized('Mvu');
  if (sessions.has(sourceMessageId)) return;
  const data = klona(Mvu.getMvuData({ type: 'message', message_id: sourceMessageId }));
  data.stat_data.性斗系统 = klona(record.config);
  sessions.set(sourceMessageId, makeSession(sourceMessageId, data, record.id, false));
}

export function showInlineCombat(messageId: number) {
  const session = sessions.get(messageId);
  if (!session) return;
  session.opened = true;
  session.visible = true;
}

export function hideInlineCombat(messageId: number) {
  const session = sessions.get(messageId);
  if (session) session.visible = false;
}

export function discardInlineCombat(messageId: number) {
  sessions.get(messageId)?.dispose?.();
  sessions.delete(messageId);
}

export function clearInlineCombats() {
  [...sessions.keys()].forEach(discardInlineCombat);
}

export function getInlineCombatMessageIds() {
  return [...sessions.values()].filter(session => session.opened).map(session => session.sourceMessageId);
}

/** Apply only changes produced by this battle; never replace the narrative floor's combat selection. */
function applyChangedFields(target: Record<string, any>, before: Record<string, any>, after: Record<string, any>) {
  let changed = false;
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (_.isEqual(before[key], after[key]) || _.isEqual(target[key], after[key])) continue;
    if (!(key in after)) {
      delete target[key];
    } else if (_.isPlainObject(before[key]) && _.isPlainObject(after[key])) {
      if (!_.isPlainObject(target[key])) target[key] = {};
      applyChangedFields(target[key], before[key], after[key]);
    } else {
      target[key] = klona(after[key]);
    }
    changed = true;
  }
  return changed;
}

export async function commitInlineCombatData(session: InlineCombatSession, next: Mvu.MvuData, previous = session.data) {
  hydrateAmamiState(next, session.variableMessageId);
  hydrateAmamiState(previous, session.variableMessageId);
  session.data = klona(next);
  const latest = klona(Mvu.getMvuData({ type: 'message', message_id: session.variableMessageId }));
  hydrateAmamiState(latest, session.variableMessageId);
  const externalPlayerChange = !_.isEqual(readPlayerData(latest), session.playerData);
  let changed = settleExperience(latest).changed;
  const beforeFields = klona(_.omit(previous.stat_data, ['性斗系统']));
  const afterFields = klona(_.omit(next.stat_data, ['性斗系统']));
  changed = mergeMoneyChanges(latest, next, previous) || changed;
  for (const path of ['物品系统._天海信用点', '物品系统.天海信用点', '物品系统._学园金币', '物品系统.学园金币']) {
    _.unset(beforeFields, path);
    _.unset(afterFields, path);
  }
  // 战斗可能已结算成长，而手机又在这期间加过点。按来源合并差额，不能用旧战斗面板覆盖新加点。
  const ledger = getAttributeGrowthState(latest);
  const beforeLedger = getAttributeGrowthState(previous);
  const afterLedger = getAttributeGrowthState(next);
  const rounded = (value: number) => Math.round(value * 100) / 100;
  for (const path of Object.keys(ATTRIBUTE_POINT_RULES) as AllocatableAttribute[]) {
    const rule = ATTRIBUTE_POINT_RULES[path];
    const beforeValue = Number(_.get(previous.stat_data, path, rule.initial));
    const afterValue = Number(_.get(next.stat_data, path, rule.initial));
    const currentValue = Number(_.get(latest.stat_data, path, rule.initial));
    const incomingGrowth =
      (afterLedger?.appliedGrowth[path as GrowthAttribute] ?? 0) -
      (beforeLedger?.appliedGrowth[path as GrowthAttribute] ?? 0);
    const incomingSpent = (afterLedger?.spentPoints[path] ?? 0) - (beforeLedger?.spentPoints[path] ?? 0);
    const delta = rounded(afterValue - beforeValue - incomingGrowth);
    const alreadyApplied = currentValue === afterValue && _.isEqual(ledger, afterLedger);
    if (!alreadyApplied && (delta || incomingSpent)) {
      _.set(latest.stat_data, path, rounded(currentValue + delta));
      if (ledger) ledger.spentPoints[path] += incomingSpent;
      changed = true;
    }
    _.unset(beforeFields, path);
    _.unset(afterFields, path);
  }
  const incomingAwards = (afterLedger?.awardedLevelPoints ?? 0) - (beforeLedger?.awardedLevelPoints ?? 0);
  const pendingAwards = ledger ? Math.max(0, (afterLedger?.awardedLevelPoints ?? 0) - ledger.awardedLevelPoints) : 0;
  const pointDelta = rounded(
    Number(next.stat_data.核心状态?.$属性点 ?? 0) -
      Number(previous.stat_data.核心状态?.$属性点 ?? 0) -
      incomingAwards +
      pendingAwards,
  );
  if (pointDelta) {
    latest.stat_data.核心状态.$属性点 = rounded(Number(latest.stat_data.核心状态.$属性点 ?? 0) + pointDelta);
    changed = true;
  }
  if (ledger && pendingAwards) {
    ledger.awardedLevelPoints += pendingAwards;
    changed = true;
  }
  _.unset(beforeFields, '核心状态.$属性点');
  _.unset(afterFields, '核心状态.$属性点');
  changed = applyChangedFields(latest.stat_data, beforeFields, afterFields) || changed;
  if (!_.isEqual(getAmamiState(next)[EXPERIENCE_STATE_KEY], getAmamiState(previous)[EXPERIENCE_STATE_KEY])) {
    getAmamiState(latest)[EXPERIENCE_STATE_KEY] = klona(getAmamiState(next)[EXPERIENCE_STATE_KEY]);
    changed = true;
  }
  changed = settleExperience(latest).changed || changed;
  session.data[AMAMI_STATE_KEY] = klona(getAmamiState(latest));
  session.playerData = readPlayerData(latest);
  copyPlayerDataIntoSession(session, session.playerData);
  if (externalPlayerChange) requestPlayerRefresh(session);
  if (!changed) return;
  session.writing += 1;
  try {
    await Mvu.replaceMvuData(latest, { type: 'message', message_id: session.variableMessageId });
  } finally {
    session.writing -= 1;
  }
}

export function refreshInlineCombatPlayers(messageId?: number) {
  sessions.forEach(session => {
    if (session.writing || (messageId !== undefined && messageId !== session.variableMessageId)) return;
    const latest = Mvu.getMvuData({ type: 'message', message_id: session.variableMessageId });
    hydrateAmamiState(latest, session.variableMessageId);
    ensureMoney(latest);
    const playerData = readPlayerData(latest);
    session.data[AMAMI_STATE_KEY] = klona(getAmamiState(latest));
    if (_.isEqual(playerData, session.playerData)) return;
    session.playerData = playerData;
    copyPlayerDataIntoSession(session, playerData);
    requestPlayerRefresh(session);
  });
}

function copyPlayerDataIntoSession(session: InlineCombatSession, playerData: Record<string, unknown>) {
  const data = klona(session.data);
  for (const key of PLAYER_KEYS) {
    if (key in playerData) data.stat_data[key] = klona(playerData[key]);
    else delete data.stat_data[key];
  }
  session.data = data;
}

export function requestPlayerRefresh(session: InlineCombatSession) {
  session.playerRefreshPending = session.api === undefined;
  void session.api?.refreshPlayer();
}

export function pruneInlineCombats() {
  sessions.forEach((session, messageId) => {
    const message = SillyTavern.chat[messageId];
    if (
      !message ||
      (message.swipe_id ?? 0) !== session.swipeId ||
      getChatMessages(messageId)[0]?.extra?.[EXTRA_KEY]?.id !== session.id
    ) {
      discardInlineCombat(messageId);
    }
  });
}

export async function generateCombatNarration(...args: Parameters<typeof generate>) {
  combatNarrationDepth += 1;
  try {
    return await generate(...args);
  } finally {
    combatNarrationDepth -= 1;
  }
}

export function isCombatNarrationInProgress() {
  return combatNarrationDepth > 0;
}
