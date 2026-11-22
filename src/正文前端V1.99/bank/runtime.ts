import { klona } from 'klona';
import { countNarrativeFloors, settleBank } from './loan';
import { getLatestMvuData, replaceLatestMvuData, runLatestMvuTransaction } from '../phone/terminal/shared/mvuStore';

export function currentBankFloor() {
  return countNarrativeFloors(getChatMessages('0-{{lastMessageId}}'));
}

export async function updateBank(operation?: (data: Mvu.MvuData, floor: number) => void) {
  return runLatestMvuTransaction('如月银行', async () => {
    const source = await getLatestMvuData();
    if (!source?.stat_data) throw new Error('角色档案尚未就绪。');
    const data = klona(source);
    const floor = currentBankFloor();
    const changed = settleBank(data, floor, !operation);
    operation?.(data, floor);
    if (changed || operation) await replaceLatestMvuData(data);
    return { data, floor };
  });
}

export function installBankRuntime() {
  const settlement = eventOn('mag_before_message_update', ({ variables }: { variables: Mvu.MvuData }) => {
    settleBank(variables, currentBankFloor());
  });
  const prompt = injectPrompts([
    {
      id: 'amami-kisaragi-bank-v1',
      position: 'in_chat',
      depth: 0,
      role: 'system',
      should_scan: false,
      content:
        '如月银行的借款、还本付息由前端脚本结算天海信用点，AI 不得重复加减银行借还款金额，不得自行改写银行合同。年利率 2.8%，30 个 AI 正文楼层为一期，12 期为计息年；以签约时选定的分期或到期还清方式还款，按剩余本金计息，提前结清只支付已经过楼层的利息。没有补助或额外手续费。',
    },
  ]);
  return () => {
    settlement.stop();
    prompt.uninject();
  };
}
