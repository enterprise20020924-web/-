export const CHAT_ARCHIVE_KEY = '明月秋青_聊天收纳';
export const TOKEN_WARNING_LIMIT = 60_000;

export interface ArchivedChatMessage {
  messageId: number;
  role: 'system' | 'assistant' | 'user';
  name: string;
  content: string;
}

export interface ChatArchiveBatch {
  id: string;
  createdAt: string;
  taskId: string;
  taskTitle: string;
  targetName: string;
  hiddenThrough: number;
  keptMessageId: number | null;
  messageCount: number;
  estimatedTokens: number;
  messages: ArchivedChatMessage[];
}

export interface ChatContextStats {
  lastMessageId: number;
  unhiddenCount: number;
  hiddenCount: number;
  estimatedTokens: number;
  archiveCount: number;
  canArchive: boolean;
}

function estimateTokens(text: string): number {
  const cjk = (text.match(/[\u3400-\u9fff]/g) ?? []).length;
  const nonCjk = Math.max(0, text.length - cjk);
  return Math.ceil(cjk * 1.15 + nonCjk / 4);
}

function allChatMessages() {
  const lastMessageId = getLastMessageId();
  if (lastMessageId < 0) return [];
  return getChatMessages(`0-${lastMessageId}`, { hide_state: 'all' });
}

function getArchiveBatches(): ChatArchiveBatch[] {
  const variables = getVariables({ type: 'chat' });
  const batches = variables[CHAT_ARCHIVE_KEY];
  return Array.isArray(batches) ? batches : [];
}

export function getChatContextStats(): ChatContextStats {
  const messages = allChatMessages();
  const unhidden = messages.filter(message => !message.is_hidden);
  const hidden = messages.length - unhidden.length;
  const lastMessageId = getLastMessageId();
  const estimated = unhidden.reduce((sum, message) => sum + estimateTokens(message.message || ''), 0);

  return {
    lastMessageId,
    unhiddenCount: unhidden.length,
    hiddenCount: hidden,
    estimatedTokens: estimated,
    archiveCount: getArchiveBatches().length,
    canArchive: unhidden.some(message => message.message_id < lastMessageId),
  };
}

export function getChatArchiveSummary(): string {
  const batches = getArchiveBatches();
  if (!batches.length) return '还没有收纳过旧聊天。';

  return [
    `已收纳 ${batches.length} 批旧聊天。`,
    ...batches.slice(-5).reverse().map(batch => {
      const time = new Date(batch.createdAt).toLocaleString();
      return `- ${time}｜${batch.taskTitle}｜${batch.messageCount} 层｜约 ${batch.estimatedTokens} token｜保留楼层 ${batch.keptMessageId ?? '无'}`;
    }),
    '',
    '收纳内容保存在当前聊天变量里，不会自动重新塞回上下文；需要回看时再查。',
  ].join('\n');
}

export async function archiveMessagesBeforeLatest(task: {
  id: string;
  title: string;
  targetName: string;
}): Promise<ChatArchiveBatch | null> {
  const lastMessageId = getLastMessageId();
  if (lastMessageId <= 0) return null;

  const messagesToHide = getChatMessages(`0-${lastMessageId - 1}`, { hide_state: 'all' })
    .filter(message => message.is_hidden !== true);
  if (!messagesToHide.length) return null;

  const batch: ChatArchiveBatch = {
    id: `archive-${Date.now()}`,
    createdAt: new Date().toISOString(),
    taskId: task.id,
    taskTitle: task.title,
    targetName: task.targetName,
    hiddenThrough: lastMessageId - 1,
    keptMessageId: lastMessageId,
    messageCount: messagesToHide.length,
    estimatedTokens: messagesToHide.reduce((sum, message) => sum + estimateTokens(message.message || ''), 0),
    messages: messagesToHide.map(message => ({
      messageId: message.message_id,
      role: message.role,
      name: message.name,
      content: message.message || '',
    })),
  };

  updateVariablesWith(variables => {
    const previous = Array.isArray(variables[CHAT_ARCHIVE_KEY]) ? variables[CHAT_ARCHIVE_KEY] : [];
    return {
      ...variables,
      [CHAT_ARCHIVE_KEY]: [...previous, batch],
    };
  }, { type: 'chat' });

  await setChatMessages(
    messagesToHide.map(message => ({ message_id: message.message_id, is_hidden: true })),
    { refresh: 'all' },
  );

  return batch;
}
