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

      const startId = Math.max(0, lastId - 49);
      const raw = getChatMessages(`${startId}-${lastId}`, { hide_state: 'all' })
        .filter(m => m.is_hidden !== true);
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

  async function sendMessage(): Promise<boolean> {
    const text = inputText.value.trim();
    if (!text || isSending.value) return false;

    isSending.value = true;
    try {
      await triggerSlash(`/send ${text}|/trigger`);
      inputText.value = '';
      setTimeout(refreshMessages, 500);
      return true;
    } catch (e) {
      console.error('[IDE] sendMessage failed:', e);
      return false;
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
