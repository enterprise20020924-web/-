import { klona } from 'klona';

/** 沿用来源楼层已确定的性斗配置；启动流程不读取行动选项或在场人物。 */
export async function startConfiguredSexBattle(sourceMessageId: number) {
  const data = await readBattleSourceData(sourceMessageId);
  return createFightMessage(sourceMessageId, data);
}

/** 联系人手动发起只替换点选人物，保留该楼层的其他性斗规则。 */
export async function startManualSexBattle(sourceMessageId: number, enemyName: string) {
  const data = await readBattleSourceData(sourceMessageId);
  data.stat_data.性斗系统.对手名称 = enemyName;
  return createFightMessage(sourceMessageId, data);
}

async function readBattleSourceData(sourceMessageId: number) {
  await waitGlobalInitialized('Mvu');
  return klona(Mvu.getMvuData({ type: 'message', message_id: sourceMessageId }));
}

async function createFightMessage(sourceMessageId: number, data: Mvu.MvuData) {
  const sourceMessage = getChatMessages(sourceMessageId)[0];
  const enemyName: string = data.stat_data.性斗系统.对手名称;

  // 在创建战斗楼层时一并写入变量，避免先改写原正文或最新楼层的存档。
  await createChatMessages([
    {
      role: 'assistant',
      name: sourceMessage.name,
      message: '<fight>',
      data,
    },
  ]);

  return enemyName;
}
