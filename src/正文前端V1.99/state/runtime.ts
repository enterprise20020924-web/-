import { isEqual } from 'lodash';
import { AMAMI_STATE_KEY, getAmamiState, readAmamiState } from './model';
import { hydrateAmamiState, hydrateMessageAmamiState, inheritAmamiState } from './persistence';

const SHITTIM_CHEST_MESSAGE_ID = 2;

function grantShittimChest(data: Record<string, any>): boolean {
  const state = getAmamiState(data);
  if (state.什亭之匣 === true) return false;
  state.什亭之匣 = true;
  return true;
}

export function installAmamiStateRuntime(): () => void {
  // MVU 自动提交只保存自己的字段，不保存 _amamiState。记录真实提交，
  // 等其 stat_data 落盘后的渲染事件再补写同一楼层/同一 swipe 的脚本状态。
  // parseMessage 的临时计算不触发 BEFORE_MESSAGE_UPDATE，不产生存档写入。
  const pending: {
    variables: Mvu.MvuData;
    targets: { messageId: number; swipeId: number }[];
  }[] = [];
  const started = eventOn('mag_variable_update_started', (data: Mvu.MvuData) => {
    hydrateAmamiState(data);
  });
  const ended = eventOn('mag_variable_update_ended', (data: Mvu.MvuData, previous: Mvu.MvuData) => {
    inheritAmamiState(data, previous);
  });
  const writing = eventOn('mag_before_message_update', ({ variables, message_content }) => {
    hydrateAmamiState(variables);
    const targets = getChatMessages('0-{{lastMessageId}}', { include_swipes: true })
      .filter(message => message.swipes[message.swipe_id] === message_content)
      .map(message => ({ messageId: message.message_id, swipeId: message.swipe_id }));
    if (targets.length) pending.push({ variables, targets });
  });
  const rendered = (messageId: number) => {
    const message = getChatMessages(messageId, { include_swipes: true })[0];
    if (!message) return;
    const receivesShittimChest =
      messageId === SHITTIM_CHEST_MESSAGE_ID &&
      message.role === 'assistant' &&
      !message.is_hidden &&
      Boolean(message.swipes[message.swipe_id]?.trim());
    const data = message.swipes_data[message.swipe_id] ?? {};
    for (let i = pending.length - 1; i >= 0; i--) {
      const commit = pending[i];
      if (!commit.targets.some(target => target.messageId === messageId && target.swipeId === message.swipe_id))
        continue;
      if (!isEqual(data.stat_data, commit.variables.stat_data)) continue;
      if (receivesShittimChest) grantShittimChest(commit.variables);
      const state = readAmamiState(commit.variables);
      if (state) {
        updateVariablesWith(current => ({ ...current, [AMAMI_STATE_KEY]: structuredClone(state) }), {
          type: 'message',
          message_id: messageId,
        });
      }
      pending.splice(i, 1);
      return;
    }
    // 新楼层/新 swipe 第一次显示时，先继承上一个分支，避免流式生成期间的
    // 手机或维护脚本把尚未携带账本的人物状态当作旧存档。
    const hydrated = hydrateMessageAmamiState(data, messageId);
    const granted = receivesShittimChest && grantShittimChest(data);
    if (hydrated || granted) {
      updateVariablesWith(current => ({ ...current, [AMAMI_STATE_KEY]: data[AMAMI_STATE_KEY] }), {
        type: 'message',
        message_id: messageId,
      });
    }
  };
  const renderedListeners = [tavern_events.CHARACTER_MESSAGE_RENDERED, tavern_events.USER_MESSAGE_RENDERED].map(event =>
    eventMakeFirst(event, rendered),
  );
  const syncShittimChest = () => {
    if (getLastMessageId() >= SHITTIM_CHEST_MESSAGE_ID) rendered(SHITTIM_CHEST_MESSAGE_ID);
  };
  const chatChanged = eventOn(tavern_events.CHAT_CHANGED, () => {
    pending.length = 0;
    syncShittimChest();
  });
  syncShittimChest();
  return () => {
    started.stop();
    ended.stop();
    writing.stop();
    renderedListeners.forEach(listener => listener.stop());
    chatChanged.stop();
    pending.length = 0;
  };
}
