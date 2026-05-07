/**
 * LTC 操作捕获器
 * 从 AI 消息中解析 function calling 的工具调用，实时展示在 AI 活动日志面板
 */

export interface LtcOperation {
  id: string;
  timestamp: number;
  tool: string;
  args: Record<string, any>;
  status: 'pending' | 'success' | 'error';
  result?: string;
  messageId?: number;
}

/** 从 AI 消息文本中解析 LTC 工具调用 */
export function parseLtcOperations(messageText: string, messageId?: number): LtcOperation[] {
  const ops: LtcOperation[] = [];

  /* LTC 使用标准 function calling 格式, AI 消息中通常包含类似以下结构:
   * 工具调用会作为 JSON 块出现在消息中
   * 格式可能是: {"name":"Glob","arguments":{"pattern":"*","path":"/Worldbooks/"}}
   * 或以其他方式嵌入
   */

  /* 匹配常见的工具调用模式 */
  const toolCallPatterns = [
    /* 模式1: JSON 格式的工具调用 */
    /(?:Glob|Grep|Read|Write|Edit|Delete|CreateLorebook|GetAttribute|SetAttribute)\s*\(\s*([^)]*)\)/g,
    /* 模式2: 结构化的工具使用块 */
    /\b(Glob|Grep|Read|Write|Edit|Delete|CreateLorebook|GetAttribute|SetAttribute)\b[^(]*?\(([^)]*)\)/g,
  ];

  for (const pattern of toolCallPatterns) {
    let match;
    while ((match = pattern.exec(messageText)) !== null) {
      const toolName = match[0].match(/^(Glob|Grep|Read|Write|Edit|Delete|CreateLorebook|GetAttribute|SetAttribute)/)?.[1];
      if (!toolName) continue;

      const argsStr = match[1] || match[2] || '';
      let args: Record<string, any> = {};
      try {
        /* 尝试解析参数 */
        const cleaned = argsStr.trim();
        if (cleaned.startsWith('{')) {
          args = JSON.parse(cleaned);
        } else if (cleaned.startsWith('"')) {
          args = { path: JSON.parse(cleaned) };
        } else {
          args = { raw: cleaned };
        }
      } catch {
        args = { raw: argsStr.trim() };
      }

      ops.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        tool: toolName,
        args,
        status: 'success',
        messageId,
      });
    }
  }

  return ops;
}

/** 从聊天消息中提取最新的 LTC 操作 */
export function extractOpsFromLatestMessage(): LtcOperation[] {
  try {
    const lastId = getLastMessageId();
    if (lastId < 0) return [];
    const msgs = getChatMessages(lastId);
    if (!msgs?.length) return [];
    const msg = msgs[0];
    if (msg.role !== 'assistant') return [];
    return parseLtcOperations(msg.message, lastId);
  } catch {
    return [];
  }
}

/** 判断操作是否为写入类操作 */
export function isWriteOp(op: LtcOperation): boolean {
  return ['Write', 'Edit', 'Delete', 'SetAttribute', 'CreateLorebook'].includes(op.tool);
}

/** 获取操作的简短描述 */
export function getOpSummary(op: LtcOperation): string {
  const path = op.args.path || op.args.file_path || op.args.pattern || '';
  switch (op.tool) {
    case 'Glob': return `Glob ${op.args.pattern || '*'} in ${op.args.path || '/'}`;
    case 'Grep': return `Grep "${op.args.pattern}" in ${path}`;
    case 'Read': return `Read ${path}`;
    case 'Write': return `Write ${path}`;
    case 'Edit': return `Edit ${path}`;
    case 'Delete': return `Delete ${path}`;
    case 'CreateLorebook': return `Create ${op.args.lorebook_name || ''}`;
    case 'GetAttribute': return `GetAttr ${path}`;
    case 'SetAttribute': return `SetAttr ${path}`;
    default: return `${op.tool} ${path}`;
  }
}
