import { klona } from 'klona';
import { cloneDeep, get, set } from 'lodash';

type VariableScope = { type: 'chat' } | { type: 'message'; message_id: 'latest' | number };

type Target = {
  name: string;
  corruptionPath: string[];
  sameClanTraitPath: string[];
  affairPath?: string[];
};

type ScriptState = {
  lock_trait_name: string;
  toast_on_adjust: boolean;
  poll_ms: number;
};

const SCRIPT_SCOPE = { type: 'script', script_id: getScriptId() } as const;

const StateSchema = z
  .object({
    lock_trait_name: z
      .string()
      .transform(v => v.trim() || '同族化完成')
      .prefault('同族化完成'),
    toast_on_adjust: z.boolean().prefault(false),
    poll_ms: z.coerce
      .number()
      .transform(v => _.clamp(Math.floor(v) || 1500, 500, 10_000))
      .prefault(1500),
  })
  .prefault({});

let state = StateSchema.parse(getVariables(SCRIPT_SCOPE));
let timer: number | null = null;

function saveState() {
  replaceVariables(klona(state), SCRIPT_SCOPE);
}

function clampCorruption(val: unknown) {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return 0;
  return _.clamp(Math.floor(n), 0, 100);
}

function collectTargets(statData: Record<string, unknown>) {
  const targets: Target[] = [];
  const traitName = state.lock_trait_name;

  if (_.has(statData, '绿帽王状态.堕落度')) {
    const name = String(get(statData, '绿帽王状态.姓名', '玩家')) || '玩家';
    targets.push({
      name,
      corruptionPath: ['绿帽王状态', '堕落度'],
      sameClanTraitPath: ['绿帽王状态', '永久特性', traitName],
    });
  }

  const conquered = get(statData, '被征服者状态', {});
  if (_.isObject(conquered)) {
    Object.entries(conquered as Record<string, unknown>).forEach(([key, value]) => {
      if (!_.isObject(value)) return;
      if (!_.has(value, '堕落度')) return;
      const name = String(get(value, '姓名', key)).trim() || key;
      targets.push({
        name,
        corruptionPath: ['被征服者状态', key, '堕落度'],
        sameClanTraitPath: ['被征服者状态', key, '永久特性', traitName],
        affairPath: ['被征服者状态', key, '出轨次数'],
      });
    });
  }

  return targets;
}

function applyRules(statData: Record<string, unknown>) {
  const next = cloneDeep(statData);
  const targets = collectTargets(next);
  const logs: string[] = [];

  targets.forEach(target => {
    const current = clampCorruption(get(next, target.corruptionPath));
    const sameClanDone = get(next, target.sameClanTraitPath) === true;
    const isConquered = target.corruptionPath[0] === '被征服者状态';

    // 被征服者额外规则：出轨次数 < 1 时，堕落度上限49
    let limited = current;
    if (isConquered && target.affairPath) {
      const affairCount = Number(get(next, target.affairPath) ?? 0);
      if (!Number.isFinite(affairCount) || affairCount < 1) {
        limited = Math.min(limited, 49);
      }
    }

    // 被征服者额外规则：若拥有永久特性-灵魂绑定，且玩家堕落度 <= 49，则该被征服者堕落度永久锁定为0
    if (isConquered) {
      const userCorruption = clampCorruption(get(next, ['绿帽王状态', '堕落度']));
      const soulBound = get(next, ['被征服者状态', target.corruptionPath[1], '永久特性', '灵魂绑定']) === true;
      if (soulBound && userCorruption <= 49) {
        limited = 0;
      }
    }

    // 同族化完成判定：有则锁100，无则上限99
    // 但若触发“灵魂绑定+玩家堕落度<=49”，则被征服者必须锁定为0
    if (!(isConquered && limited === 0)) {
      limited = sameClanDone ? 100 : Math.min(limited, 99);
    }

    if (limited !== current) {
      set(next, target.corruptionPath, limited);
      logs.push(`${target.name}: ${current} -> ${limited}`);
    }
  });

  return { next, changed: logs.length > 0, logs };
}

function processScope(scope: VariableScope) {
  const variables = getVariables(scope);
  if (!variables || !_.isObject(variables)) return false;

  const statData = get(variables, 'stat_data');
  if (!statData || !_.isObject(statData)) return false;

  const statDataCopy = cloneDeep(statData as Record<string, unknown>);
  const { next, changed, logs } = applyRules(statDataCopy);
  if (!changed) return false;

  const nextVariables = cloneDeep(variables);
  set(nextVariables, 'stat_data', next);
  replaceVariables(nextVariables, scope);

  if (state.toast_on_adjust) {
    toastr.info(`已执行数值约束：${logs.join(' | ')}`);
  }

  return true;
}

function tick() {
  try {
    const changedInChat = processScope({ type: 'chat' });
    const changedInMessage = processScope({ type: 'message', message_id: 'latest' });

    if (changedInChat || changedInMessage) {
      saveState();
    }
  } catch (error) {
    console.error('[数值控制脚本] 执行失败', error);
  }
}

$(() => {
  state = StateSchema.parse(getVariables(SCRIPT_SCOPE));
  saveState();

  tick();
  timer = window.setInterval(tick, state.poll_ms);
  toastr.success('数值控制脚本已启动（同族化完成=>100，否则<=99）');
});

$(window).on('pagehide', () => {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
});
