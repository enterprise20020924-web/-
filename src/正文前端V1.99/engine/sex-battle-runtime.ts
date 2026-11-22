import { startInlineCombat } from '../battle/inline-session';

/** 沿用来源楼层已确定的性斗配置；启动流程不读取行动选项或在场人物。 */
export async function startConfiguredSexBattle(sourceMessageId: number) {
  return startInlineCombat(sourceMessageId);
}

/** 联系人手动发起只替换点选人物，保留该楼层的其他性斗规则。 */
export async function startManualSexBattle(sourceMessageId: number, enemyName: string) {
  return startInlineCombat(sourceMessageId, enemyName);
}
