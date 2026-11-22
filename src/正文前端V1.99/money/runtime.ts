import { settleMoney } from './ledger';
import { hydrateAmamiState } from '../state/persistence';

export function installMoneyRuntime(): () => void {
  const started = eventOn('mag_variable_update_started', (data: Mvu.MvuData) => {
    hydrateAmamiState(data);
    settleMoney(data);
  });
  const ended = eventOn('mag_variable_update_ended', (data: Mvu.MvuData, previous: Mvu.MvuData) => {
    hydrateAmamiState(previous);
    settleMoney(data, previous);
  });
  // 兼容仍使用旧字段名的角色卡 ZOD：它不能把新余额字段删掉或写回旧名称。
  const validated = eventMakeLast('mag_variable_update_ended_for_zod', (data: Mvu.MvuData, previous: Mvu.MvuData) => {
    settleMoney(data, previous);
  });
  const writing = eventOn('mag_before_message_update', ({ variables }: { variables: Mvu.MvuData }) => {
    hydrateAmamiState(variables);
    settleMoney(variables);
  });
  let disposed = false;
  void waitGlobalInitialized('Mvu').then(async () => {
    if (disposed) return;
    const data = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
    if (!data?.stat_data) return;
    const restored = hydrateAmamiState(data);
    if (settleMoney(data) || restored) await Mvu.replaceMvuData(data, { type: 'message', message_id: 'latest' });
  });
  return () => {
    disposed = true;
    started.stop();
    ended.stop();
    validated.stop();
    writing.stop();
  };
}
