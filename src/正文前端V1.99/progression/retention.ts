import { planAmamiStateCleanup, type MessageSnapshots } from '../state/persistence';

export const planProgressionCleanup = planAmamiStateCleanup;

interface CleanupRuntime {
  characterKey: () => string | null;
  chatKey: () => string | null;
  readMessages: () => MessageSnapshots[];
  writeMessages: (updates: MessageSnapshots[]) => Promise<void>;
}

/** 实例绑定启用fork时的角色卡；切聊天可以继续，切到其他卡不清理。 */
export function createProgressionCleanup(runtime: CleanupRuntime) {
  const owner = runtime.characterKey();
  let running = false;
  return async () => {
    if (!owner || running || runtime.characterKey() !== owner) return 0;
    const chat = runtime.chatKey();
    if (!chat) return 0;
    const updates = planProgressionCleanup(runtime.readMessages());
    if (!updates.length || runtime.characterKey() !== owner || runtime.chatKey() !== chat) return 0;
    running = true;
    try {
      // 本轮只提交变量表字段，不提交正文、swipe内容或其他消息信息。
      await runtime.writeMessages(updates);
      return updates.length;
    } finally {
      running = false;
    }
  };
}

export function installProgressionCleanup(): () => void {
  const cleanup = createProgressionCleanup({
    characterKey: () => {
      if (SillyTavern.groupId) return null;
      return SillyTavern.characters[Number(SillyTavern.characterId)]?.avatar ?? null;
    },
    chatKey: () => SillyTavern.getCurrentChatId() || null,
    readMessages: () => getChatMessages('0-{{lastMessageId}}', { include_swipes: true }),
    writeMessages: updates => setChatMessages(updates, { refresh: 'none' }),
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  const schedule = () => {
    if (disposed) return;
    clearTimeout(timer);
    // MVU 的 MESSAGE_RECEIVED 清理先完成，再观察实际删掉了哪些字段。
    timer = setTimeout(() => {
      void cleanup().catch(error => console.error('[学园状态] 配套账本清理失败:', error));
    }, 300);
  };
  const events = new Set([
    tavern_events.MESSAGE_RECEIVED,
    tavern_events.MESSAGE_UPDATED,
    tavern_events.MESSAGE_DELETED,
    tavern_events.MESSAGE_SWIPED,
    tavern_events.CHAT_CHANGED,
    'chatLoaded',
    'mag_before_message_update',
    'mag_variable_update_ended',
  ]);
  const subscribe = eventOn as unknown as (event: string, callback: () => void) => { stop: () => void };
  const listeners = [...events].map(event => subscribe(event, schedule));
  schedule();
  return () => {
    disposed = true;
    clearTimeout(timer);
    listeners.forEach(listener => listener.stop());
  };
}
