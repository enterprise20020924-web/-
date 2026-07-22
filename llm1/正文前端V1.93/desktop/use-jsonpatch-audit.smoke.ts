import { computed } from 'vue';
import { parseJsonPatchPanel } from './panel-runtime.ts';
import { useJsonPatchAudit } from './use-jsonpatch-audit.ts';

function assertEqual(actual: unknown, expected: unknown, name: string) {
  if (actual !== expected) {
    throw Error(`${name}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

async function main() {
  const previousMvuData = {
    stat_data: {
      角色基础: { 经验值: 5 },
      核心状态: { 堕落度: 20 },
      关系系统: { 在场人物: ['响子'], 响子: { 好感度: 10, 屈服度: 5 } },
    },
  };
  const currentMvuData = JSON.parse(JSON.stringify(previousMvuData)) as typeof previousMvuData;
  let replaceCount = 0;

  const runtime = globalThis as typeof globalThis & {
    Mvu?: {
      getMvuData: (option: { message_id: number | 'latest' }) => unknown;
      replaceMvuData: (data: unknown) => Promise<void>;
    };
  };
  runtime.Mvu = {
    getMvuData: option => (option.message_id === 4 ? previousMvuData : currentMvuData),
    replaceMvuData: async () => {
      replaceCount += 1;
    },
  };

  const panel = parseJsonPatchPanel(
    JSON.stringify([
      { op: 'delta', path: '/经验', value: 10 },
      { op: 'replace', path: '/堕落', value: 140 },
      { op: 'replace', path: '/关系系统/响子/屈服度', value: -130 },
      { op: 'replace', path: '/关系系统/响子/誓约', value: '支配型' },
    ]),
  );
  const context = {
    message_id: 5,
    variable_revision: 0,
    set_variable_refresh_needed: () => undefined,
  };
  const audit = useJsonPatchAudit(
    context,
    computed(() => panel),
  );

  try {
    await audit.handleJsonPatchAuditClick();

    const statData = currentMvuData.stat_data as Record<string, any>;
    const relationship = statData.关系系统.白石响子 as Record<string, unknown>;
    const auditPaths = audit.jsonPatchAudit.value.items.map(item => item.path);

    assertEqual(replaceCount, 1, 'audit writes calibrated MVU once');
    assertEqual(statData.角色基础.经验值, 15, 'root experience alias applies delta');
    assertEqual(statData.核心状态.堕落度, 100, 'root corruption alias clamps');
    assertEqual('响子' in statData.关系系统, false, 'contact alias key is removed');
    assertEqual(relationship.支配度, -100, 'legacy submission path becomes bounded dominance');
    assertEqual(relationship.誓约, '支配型', 'pledge path is writable');
    assertEqual(statData.关系系统.在场人物[0], '白石响子', 'present contact name is canonical');
    assertEqual(auditPaths.includes('角色基础.经验值'), true, 'experience audit path is canonical');
    assertEqual(auditPaths.includes('核心状态.堕落度'), true, 'corruption audit path is canonical');
    assertEqual(auditPaths.includes('关系系统.白石响子.支配度'), true, 'dominance audit path is canonical');
    assertEqual(audit.jsonPatchAudit.value.status, 'done', 'audit completes');

    console.log('[use-jsonpatch-audit] 11 cases passed');
  } finally {
    delete runtime.Mvu;
  }
}

void main();
