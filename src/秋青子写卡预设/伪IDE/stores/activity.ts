import { extractOpsFromLatestMessage, getOpSummary, isWriteOp, type LtcOperation } from '../utils/ltc-capture';
import { bridgeToCharacterApi, needsBridge } from '../utils/ltc-bridge';

export const useActivityStore = defineStore('activity', () => {
  const operations = ref<LtcOperation[]>([]);
  const maxOps = 200;
  let lastProcessedMsgId = -1;
  /** 最后一个 Write 操作的路径（用于自动打开编辑区） */
  const lastWritePath = ref<string | null>(null);

  function addOperation(op: LtcOperation) {
    operations.value.unshift(op);
    if (operations.value.length > maxOps) {
      operations.value.length = maxOps;
    }
  }

  function addOperations(ops: LtcOperation[]) {
    for (const op of ops) {
      addOperation(op);
    }
  }

  function clear() {
    operations.value = [];
  }

  /** 从最新 AI 消息中提取并记录 LTC 操作 */
  async function captureFromLatestMessage() {
    const ops = extractOpsFromLatestMessage();
    if (!ops.length) return;

    /* 去重: 跳过已处理的消息 */
    const newOps = ops.filter(op => {
      if (op.messageId !== undefined && op.messageId <= lastProcessedMsgId) return false;
      return true;
    });
    if (!newOps.length) return;

    const maxMsgId = Math.max(...newOps.filter(o => o.messageId !== undefined).map(o => o.messageId!));
    if (maxMsgId > lastProcessedMsgId) lastProcessedMsgId = maxMsgId;

    addOperations(newOps);

    /* 对写入类操作执行桥接 */
    for (const op of newOps) {
      if (isWriteOp(op) && needsBridge(op)) {
        try {
          await bridgeToCharacterApi(op);
        } catch (e) {
          console.warn('[IDE] Bridge failed for op:', getOpSummary(op), e);
        }
      }
    }
  }

  const latestWriteOps = computed(() =>
    operations.value.filter(isWriteOp).slice(0, 20),
  );

  return {
    operations,
    latestWriteOps,
    lastWritePath,
    addOperation,
    addOperations,
    clear,
    captureFromLatestMessage,
  };
});
