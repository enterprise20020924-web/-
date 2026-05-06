export interface ChatMsg {
  messageId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  name?: string;
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMsg[]>([]);
  const inputText = ref('');
  const isSending = ref(false);

  function refreshMessages() {
    try {
      const lastId = getLastMessageId();
      if (lastId < 0) {
        messages.value = [];
        return;
      }
      /* 获取最近 50 条消息，使用 range 字符串格式 */
      const startId = Math.max(0, lastId - 49);
      const raw = getChatMessages(`${startId}-${lastId}`);
      if (!raw?.length) {
        messages.value = [];
        return;
      }
      messages.value = raw.map(m => ({
        messageId: m.message_id,
        role: m.role,
        content: m.message || '',
        name: m.name,
      }));
    } catch (e) {
      console.warn('[IDE] refreshMessages failed:', e);
    }
  }

  async function sendMessage() {
    const text = inputText.value.trim();
    if (!text || isSending.value) return;
    isSending.value = true;
    try {
      await triggerSlash(`/send ${text}|/trigger`);
      inputText.value = '';
      /* 延迟后刷新消息 */
      setTimeout(refreshMessages, 500);
    } catch (e) {
      console.error('[IDE] sendMessage failed:', e);
    } finally {
      isSending.value = false;
    }
  }

  return {
    messages,
    inputText,
    isSending,
    refreshMessages,
    sendMessage,
  };
});
