import {
  AMAMI_STATE_KEY,
  STATE_BRANCHES,
  migrateAmamiState,
  readAmamiState,
  getAmamiState,
  type AmamiState,
  type StateChange,
  type StateDelta,
} from './model';

type Data = Record<string, any>;
type Envelope = Omit<AmamiState, 'delta'>;
const object = (value: any) => value !== null && typeof value === 'object' && !Array.isArray(value);
function diff(before: any, after: any, path: string[] = []): StateChange[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (after === undefined) return [{ path, remove: true }];
  if (object(before) && object(after))
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap(key =>
      diff(before[key], after[key], [...path, key]),
    );
  if (Array.isArray(before) && Array.isArray(after) && before.length === after.length)
    return after.flatMap((value, index) => diff(before[index], value, [...path, String(index)]));
  return [{ path, value: structuredClone(after) }];
}

function applyDelta(base: Envelope, delta: StateDelta): Envelope {
  const result = structuredClone(base);
  for (const change of delta.changes) {
    let target: Data = result;
    for (const key of change.path.slice(0, -1)) target = target[key] ??= {};
    const key = change.path.at(-1)!;
    if (change.remove) delete target[key];
    else target[key] = structuredClone(change.value);
  }
  return result;
}

/** 调用方已将旧格式搬入统一树；完整快照为准，差量只继承前楼的选中分支。 */
function readEnvelope(data: Data, previous: Envelope): Envelope {
  const state: AmamiState | undefined = data[AMAMI_STATE_KEY];
  if (!state) return structuredClone(previous);
  const { delta, ...full } = state;
  const result = delta ? { ...applyDelta(previous, delta), ...structuredClone(full) } : structuredClone(full);
  if (result.progressionPruned === 1) {
    if (!state.experience) delete result.experience;
    if (!state.attributeGrowth) delete result.attributeGrowth;
  }
  return result;
}

export function restoreAmamiStateFromMessages(data: Data, messages: { data: Data; message_id: number }[]): boolean {
  const migrated = migrateAmamiState(data);
  const delta = readAmamiState(data)?.delta;
  if (!delta) return migrated;
  let envelope: Envelope = { version: 1 };
  for (const message of messages) {
    if (message.message_id >= delta.messageId) break;
    const source = { ...message.data };
    if (source[AMAMI_STATE_KEY]) source[AMAMI_STATE_KEY] = structuredClone(source[AMAMI_STATE_KEY]);
    migrateAmamiState(source);
    envelope = readEnvelope(source, envelope);
  }
  // 使用传入的目标 swipe，不能用聊天当前选中的另一条回复覆盖它。
  data[AMAMI_STATE_KEY] = readEnvelope(data, envelope);
  return true;
}

export function hydrateAmamiState(data: Data, messageId: number | 'latest' = 'latest'): boolean {
  if (!data) return false;
  const migrated = migrateAmamiState(data);
  const delta = readAmamiState(data)?.delta;
  if (!delta) return migrated;
  const end = String(delta.messageId ?? (messageId === 'latest' ? '{{lastMessageId}}' : messageId));
  return restoreAmamiStateFromMessages(data, getChatMessages('0-' + end));
}

/** MVU 生成新楼时，各模块共用同一继承入口；已有分支不被旧楼覆盖。 */
export function inheritAmamiState(data: Data, previous?: Data): boolean {
  let changed = hydrateAmamiState(data);
  if (!previous) return changed;
  hydrateAmamiState(previous);
  const source = readAmamiState(previous);
  if (!source) return changed;
  const state = getAmamiState(data);
  for (const branch of STATE_BRANCHES) {
    if (state.progressionPruned && (branch === 'experience' || branch === 'attributeGrowth')) continue;
    if (state[branch] !== undefined || source[branch] === undefined) continue;
    Object.assign(state, { [branch]: structuredClone(source[branch]) });
    changed = true;
  }
  if (source.progressionPruned && !state.experience && !state.attributeGrowth && !state.progressionPruned) {
    state.progressionPruned = 1;
    changed = true;
  }
  return changed;
}

/** 读取指定楼层时补齐缺失的脚本状态，只沿之前楼层的选中 swipe 继承。 */
export function hydrateMessageAmamiState(data: Data, messageId: number | 'latest' = 'latest'): boolean {
  let changed = hydrateAmamiState(data, messageId);
  const state = readAmamiState(data);
  if (state?.experience && state.attributeGrowth) return changed;
  if (typeof getChatMessages !== 'function') return changed;
  const target = getChatMessages(messageId === 'latest' ? -1 : messageId)[0];
  if (!target || target.message_id === 0) return changed;
  const messages = getChatMessages('0-' + (target.message_id - 1));
  for (let i = messages.length - 1; i >= 0; i--) {
    const source = structuredClone(messages[i].data);
    restoreAmamiStateFromMessages(source, messages);
    changed = inheritAmamiState(data, source) || changed;
    if (readAmamiState(source)?.experience) break;
  }
  return changed;
}

export type MessageSnapshots = { message_id: number; swipes_data: Data[]; swipe_id?: number };
/** 只跟随 MVU 已发生的清理，账本与身份状态统一压成差量；0楼与快照保留完整数据。 */
export function planAmamiStateCleanup(messages: MessageSnapshots[]): MessageSnapshots[] {
  let previous: Envelope = { version: 1 };
  const updates: MessageSnapshots[] = [];
  for (const message of messages) {
    let changed = false;
    const normalized = message.swipes_data.map(data => {
      const result = { ...data };
      // 迁移可能补入分支，不能修改读到的原始快照。
      if (result[AMAMI_STATE_KEY]) result[AMAMI_STATE_KEY] = structuredClone(result[AMAMI_STATE_KEY]);
      const migrated = migrateAmamiState(result);
      return { data: result, migrated };
    });
    const envelopes = normalized.map(({ data }) => readEnvelope(data, previous));
    const swipes_data = normalized.map(({ data, migrated }, index) => {
      if (
        data[AMAMI_STATE_KEY] &&
        message.message_id !== 0 &&
        data.snapshot !== true &&
        !Object.hasOwn(data, 'stat_data')
      ) {
        data[AMAMI_STATE_KEY] = {
          version: 1,
          delta: { messageId: message.message_id, changes: diff(previous, envelopes[index]) },
        } satisfies AmamiState;
      }
      if (
        !migrated &&
        JSON.stringify(data[AMAMI_STATE_KEY]) === JSON.stringify(message.swipes_data[index]?.[AMAMI_STATE_KEY])
      )
        return message.swipes_data[index];
      changed = true;
      return data;
    });
    previous = envelopes[message.swipe_id ?? 0] ?? previous;
    if (changed) updates.push({ message_id: message.message_id, swipes_data });
  }
  return updates;
}
