import type { TaskDefinition, WorkshopArtifact, WorkshopWriteOperation } from './workshop';

export const PLAN_STATE_KEY = '明月秋青_计划模式_v2';

export type PlanStatus = 'active' | 'paused' | 'blocked' | 'ready_to_complete' | 'completed';
export type TodoStatus = 'todo' | 'doing' | 'blocked' | 'done' | 'skipped';
export type CheckpointStatus = 'ready_for_user' | 'blocked' | 'needs_adjustment' | 'ready_to_complete';

export interface PlanTodo {
  id: string;
  title: string;
  detail: string;
  status: TodoStatus;
  required: boolean;
  evidence: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanHistoryEvent {
  id: string;
  at: string;
  type: string;
  summary: string;
}

export interface PlanArtifactWorkingTree {
  version: number;
  summary: string;
  updatedAt: string;
  artifacts: WorkshopArtifact[];
  previousArtifacts: WorkshopArtifact[];
  operations: WorkshopWriteOperation[];
}

export interface AgentPlan {
  id: string;
  status: PlanStatus;
  title: string;
  taskId: string;
  taskTitle: string;
  targetName: string;
  userGoal: string;
  successCriteria: string[];
  assumptions: string[];
  todos: PlanTodo[];
  activeTodoId: string | null;
  blockers: string[];
  writeBoundary: string[];
  promptNotes: string;
  artifacts: PlanArtifactWorkingTree;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  history: PlanHistoryEvent[];
}

export interface PlanDraft {
  schema: 'mingyue.plan_draft.v2';
  title: string;
  userGoal: string;
  successCriteria: string[];
  assumptions: string[];
  todos: Array<Pick<PlanTodo, 'id' | 'title' | 'detail' | 'required'>>;
  activeTodoId: string | null;
  blockers: string[];
  writeBoundary: string[];
  questions: string[];
  confidence: 'enough' | 'needs_input';
}

export type PlanUpdateOperation =
  | { op: 'set_todo_status'; todoId: string; status: TodoStatus; evidence?: string }
  | { op: 'add_todo'; todo: Pick<PlanTodo, 'id' | 'title' | 'detail' | 'required'> }
  | { op: 'update_todo'; todoId: string; title?: string; detail?: string; required?: boolean; evidence?: string }
  | { op: 'remove_todo'; todoId: string }
  | { op: 'set_active_todo'; todoId: string | null }
  | { op: 'add_blocker'; blocker: string }
  | { op: 'remove_blocker'; blocker: string }
  | { op: 'set_prompt_notes'; promptNotes: string }
  | { op: 'set_plan_status'; status: PlanStatus };

export interface PlanCheckpoint {
  schema: 'mingyue.plan_checkpoint.v2';
  checkpointId: string;
  planId: string;
  todoId: string | null;
  status: CheckpointStatus;
  summary: string;
  continueHint: string;
  adjustmentHint: string;
  artifactVersionRefs: string[];
  blockers: string[];
  questions: string[];
}

export interface PlanUpdateProposal {
  schema: 'mingyue.plan_update.v2';
  planId: string;
  checkpointId: string;
  statusSuggestion: 'continue' | 'needs_adjustment' | 'ready_to_complete' | 'pause' | 'blocked';
  summary: string;
  ops: PlanUpdateOperation[];
  questions: string[];
}

export interface PlanArtifactDelta {
  schema: 'mingyue.plan_artifact_delta.v2';
  planId: string | null;
  summary: string;
  artifacts: WorkshopArtifact[];
  operations: WorkshopWriteOperation[];
}

export interface PlanContinueIntent {
  kind: 'continue';
  planId: string;
  checkpointId: string;
  todoId: string | null;
  at: string;
}

export interface PlanAdjustmentIntent {
  kind: 'adjust';
  planId: string;
  checkpointId: string;
  todoId: string | null;
  userText: string;
  at: string;
}

export interface PlanModeState {
  enabled: boolean;
  activePlanId: string | null;
  plans: Record<string, AgentPlan>;
  pendingDraft: PlanDraft | null;
  pendingCheckpoint: PlanCheckpoint | null;
  pendingUpdate: PlanUpdateProposal | null;
  protocolBlocker: string | null;
  continueIntent: PlanContinueIntent | null;
  adjustmentIntent: PlanAdjustmentIntent | null;
  settings: {
    injectEnabled: boolean;
    enabledModes: Array<'standard' | 'pro'>;
    maxPromptTodos: number;
    maxHistoryEvents: number;
    maxArtifactPreviewChars: number;
  };
}

export const defaultPlanSettings: PlanModeState['settings'] = {
  injectEnabled: true,
  enabledModes: ['standard', 'pro'],
  maxPromptTodos: 7,
  maxHistoryEvents: 20,
  maxArtifactPreviewChars: 1800,
};

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyWorkingTree(): PlanArtifactWorkingTree {
  return {
    version: 0,
    summary: '',
    updatedAt: '',
    artifacts: [],
    previousArtifacts: [],
    operations: [],
  };
}

function defaultState(): PlanModeState {
  return {
    enabled: false,
    activePlanId: null,
    plans: {},
    pendingDraft: null,
    pendingCheckpoint: null,
    pendingUpdate: null,
    protocolBlocker: null,
    continueIntent: null,
    adjustmentIntent: null,
    settings: { ...defaultPlanSettings },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function normalizeWorkingTree(value: unknown): PlanArtifactWorkingTree {
  if (!isRecord(value)) return emptyWorkingTree();
  return {
    version: typeof value.version === 'number' ? value.version : 0,
    summary: typeof value.summary === 'string' ? value.summary : '',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : '',
    artifacts: Array.isArray(value.artifacts) ? value.artifacts as WorkshopArtifact[] : [],
    previousArtifacts: Array.isArray(value.previousArtifacts) ? value.previousArtifacts as WorkshopArtifact[] : [],
    operations: Array.isArray(value.operations) ? value.operations as WorkshopWriteOperation[] : [],
  };
}

function normalizePlan(value: unknown): AgentPlan | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  const todos = Array.isArray(value.todos) ? value.todos as PlanTodo[] : [];
  if (!todos.length) return null;
  const status = typeof value.status === 'string' ? value.status as PlanStatus : 'active';
  return {
    id: value.id,
    status,
    title: typeof value.title === 'string' ? value.title : '未命名计划',
    taskId: typeof value.taskId === 'string' ? value.taskId : '',
    taskTitle: typeof value.taskTitle === 'string' ? value.taskTitle : '',
    targetName: typeof value.targetName === 'string' ? value.targetName : '',
    userGoal: typeof value.userGoal === 'string' ? value.userGoal : '',
    successCriteria: Array.isArray(value.successCriteria) ? value.successCriteria.filter((item): item is string => typeof item === 'string') : [],
    assumptions: Array.isArray(value.assumptions) ? value.assumptions.filter((item): item is string => typeof item === 'string') : [],
    todos,
    activeTodoId: typeof value.activeTodoId === 'string' || value.activeTodoId === null ? value.activeTodoId : todos[0]?.id ?? null,
    blockers: Array.isArray(value.blockers) ? value.blockers.filter((item): item is string => typeof item === 'string') : [],
    writeBoundary: Array.isArray(value.writeBoundary) ? value.writeBoundary.filter((item): item is string => typeof item === 'string') : [],
    promptNotes: typeof value.promptNotes === 'string' ? value.promptNotes : '',
    artifacts: normalizeWorkingTree(value.artifacts),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : nowIso(),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : nowIso(),
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : undefined,
    history: Array.isArray(value.history) ? value.history as PlanHistoryEvent[] : [],
  };
}

function normalizeState(value: unknown): PlanModeState {
  if (!isRecord(value)) return defaultState();
  const plans = Object.fromEntries(
    Object.entries(isRecord(value.plans) ? value.plans : {})
      .flatMap(([id, rawPlan]) => {
        const plan = normalizePlan(rawPlan);
        return plan ? [[id, plan]] : [];
      }),
  );
  const activePlanId = typeof value.activePlanId === 'string' && plans[value.activePlanId] ? value.activePlanId : null;
  const settings = {
    ...defaultPlanSettings,
    ...(isRecord(value.settings) ? value.settings : {}),
  } as PlanModeState['settings'];
  if (!Array.isArray(settings.enabledModes)) settings.enabledModes = [...defaultPlanSettings.enabledModes];

  return {
    enabled: Boolean(value.enabled && (activePlanId || value.pendingDraft)),
    activePlanId,
    plans,
    pendingDraft: isRecord(value.pendingDraft) ? value.pendingDraft as PlanDraft : null,
    pendingCheckpoint: activePlanId && isRecord(value.pendingCheckpoint) && value.pendingCheckpoint.planId === activePlanId
      ? value.pendingCheckpoint as PlanCheckpoint
      : null,
    pendingUpdate: activePlanId && isRecord(value.pendingUpdate) && value.pendingUpdate.planId === activePlanId
      ? value.pendingUpdate as PlanUpdateProposal
      : null,
    protocolBlocker: typeof value.protocolBlocker === 'string' ? value.protocolBlocker : null,
    continueIntent: activePlanId && isRecord(value.continueIntent) && value.continueIntent.planId === activePlanId
      ? value.continueIntent as PlanContinueIntent
      : null,
    adjustmentIntent: activePlanId && isRecord(value.adjustmentIntent) && value.adjustmentIntent.planId === activePlanId
      ? value.adjustmentIntent as PlanAdjustmentIntent
      : null,
    settings,
  };
}

function addHistory(plan: AgentPlan, type: string, summary: string, maxHistoryEvents: number) {
  plan.history = [
    ...plan.history,
    { id: uid('event'), at: nowIso(), type, summary },
  ].slice(-maxHistoryEvents);
  plan.updatedAt = nowIso();
}

function nextDraftTodoId(draft: PlanDraft) {
  const used = new Set(draft.todos.map(todo => todo.id));
  let index = draft.todos.length + 1;
  let id = `todo-${index}`;
  while (used.has(id)) {
    index += 1;
    id = `todo-${index}`;
  }
  return id;
}

export const usePlanStore = defineStore('plan', () => {
  const state = reactive<PlanModeState>(defaultState());

  const activePlan = computed(() => {
    if (!state.activePlanId) return null;
    const plan = state.plans[state.activePlanId];
    return plan && ['active', 'blocked', 'ready_to_complete'].includes(plan.status) ? plan : null;
  });

  const activeTodo = computed(() => {
    const plan = activePlan.value;
    if (!plan) return null;
    return plan.todos.find(todo => todo.id === plan.activeTodoId)
      ?? plan.todos.find(todo => !['done', 'skipped'].includes(todo.status))
      ?? null;
  });

  const hasInjectablePlan = computed(() => Boolean(state.enabled && state.settings.injectEnabled && activePlan.value));
  const hasContinuableCheckpoint = computed(() => {
    return Boolean(
      activePlan.value
      && state.pendingCheckpoint
      && state.pendingUpdate
      && state.pendingCheckpoint.planId === activePlan.value.id
      && state.pendingUpdate.planId === activePlan.value.id
      && state.pendingUpdate.checkpointId === state.pendingCheckpoint.checkpointId
      && state.pendingCheckpoint.status !== 'blocked',
    );
  });

  function replaceState(nextState: PlanModeState) {
    Object.assign(state, normalizeState(nextState));
  }

  function loadFromChat() {
    try {
      const variables = getVariables({ type: 'chat' });
      replaceState(normalizeState(variables[PLAN_STATE_KEY]));
      if (ensurePendingUpdateOps()) persist();
    } catch (error) {
      console.warn('[IDE] load plan state failed:', error);
      replaceState(defaultState());
    }
  }

  function persist() {
    updateVariablesWith(variables => ({
      ...variables,
      [PLAN_STATE_KEY]: JSON.parse(JSON.stringify(state)),
    }), { type: 'chat' });
  }

  function clearPersistedState() {
    updateVariablesWith(variables => {
      const nextVariables = { ...variables };
      delete nextVariables[PLAN_STATE_KEY];
      return nextVariables;
    }, { type: 'chat' });
  }

  function clearTransientIntents() {
    state.continueIntent = null;
    state.adjustmentIntent = null;
  }

  function setPendingDraft(draft: PlanDraft | null) {
    state.pendingDraft = draft;
    state.protocolBlocker = null;
    if (draft) state.enabled = true;
    persist();
  }

  function setProtocolBlocker(reason: string | null) {
    state.protocolBlocker = reason;
    if (reason) {
      state.pendingCheckpoint = null;
      state.pendingUpdate = null;
    }
    persist();
  }

  function setCheckpointPair(checkpoint: PlanCheckpoint | null, update: PlanUpdateProposal | null) {
    const plan = activePlan.value;
    if (!checkpoint || !update || !plan) {
      setProtocolBlocker('缺少有效 Checkpoint 或 PlanUpdate，已暂停继续入口。');
      return false;
    }
    if (
      checkpoint.planId !== plan.id
      || update.planId !== plan.id
      || checkpoint.checkpointId !== update.checkpointId
    ) {
      setProtocolBlocker('Checkpoint 与 PlanUpdate 不属于同一个当前计划，已忽略。');
      return false;
    }

    const updateOps = Array.isArray(update.ops) ? update.ops : [];
    const normalizedUpdate = updateOps.length > 0
      ? { ...update, ops: updateOps }
      : createFallbackUpdateForCheckpoint(checkpoint, update);

    if (!normalizedUpdate) {
      setProtocolBlocker('PlanUpdate 没有可应用操作，且无法根据 Checkpoint 自动补全；继续入口已暂停。');
      return false;
    }

    state.pendingCheckpoint = checkpoint;
    state.pendingUpdate = normalizedUpdate;
    state.pendingDraft = null;
    state.protocolBlocker = checkpoint.status === 'blocked'
      ? checkpoint.blockers[0] ?? checkpoint.summary ?? '当前节点声明为阻塞。'
      : null;
    clearTransientIntents();
    persist();
    return true;
  }

  function setPendingUpdate(update: PlanUpdateProposal | null) {
    if (!update) {
      state.pendingUpdate = null;
      persist();
      return true;
    }
    if (!state.pendingCheckpoint || state.pendingCheckpoint.checkpointId !== update.checkpointId) {
      setProtocolBlocker('收到 PlanUpdate，但缺少同 checkpoint 的 PlanCheckpoint。');
      return false;
    }
    return setCheckpointPair(state.pendingCheckpoint, update);
  }

  function createFallbackUpdateForCheckpoint(checkpoint: PlanCheckpoint, sourceUpdate: PlanUpdateProposal | null = null): PlanUpdateProposal | null {
    const plan = activePlan.value;
    if (!plan || checkpoint.planId !== plan.id) return null;

    const sourceTodoId = plan.activeTodoId ?? checkpoint.todoId;
    const sourceTodoExists = Boolean(sourceTodoId && plan.todos.some(todo => todo.id === sourceTodoId));
    const sourceIndex = sourceTodoId
      ? plan.todos.findIndex(todo => todo.id === sourceTodoId)
      : -1;
    const checkpointTodo = checkpoint.todoId
      ? plan.todos.find(todo => todo.id === checkpoint.todoId)
      : null;
    const nextTodo = checkpointTodo
      && checkpointTodo.id !== sourceTodoId
      && !['done', 'skipped'].includes(checkpointTodo.status)
      ? checkpointTodo
      : plan.todos.find((todo, index) => {
        if (todo.status === 'done' || todo.status === 'skipped') return false;
        return sourceIndex < 0 ? todo.id !== sourceTodoId : index > sourceIndex;
      });
    const ops: PlanUpdateOperation[] = [];
    const checkpointSuggestion: PlanUpdateProposal['statusSuggestion'] | null = checkpoint.status === 'needs_adjustment'
      ? 'needs_adjustment'
      : checkpoint.status === 'ready_to_complete'
        ? 'ready_to_complete'
        : checkpoint.status === 'blocked'
          ? 'blocked'
          : null;
    const statusSuggestion = checkpointSuggestion ?? sourceUpdate?.statusSuggestion ?? 'continue';

    if (sourceTodoId && sourceTodoExists) {
      const status: TodoStatus = statusSuggestion === 'needs_adjustment' || statusSuggestion === 'pause'
        ? 'doing'
        : statusSuggestion === 'blocked'
          ? 'blocked'
          : 'done';
      ops.push({
        op: 'set_todo_status',
        todoId: sourceTodoId,
        status,
        evidence: checkpoint.summary,
      });
    }

    const retainedTodoId = sourceTodoExists ? sourceTodoId : plan.activeTodoId;
    if (statusSuggestion === 'needs_adjustment') {
      ops.push({ op: 'set_active_todo', todoId: retainedTodoId ?? null });
    } else if (statusSuggestion === 'pause') {
      ops.push({ op: 'set_plan_status', status: 'paused' });
      ops.push({ op: 'set_active_todo', todoId: retainedTodoId ?? null });
    } else if (statusSuggestion === 'blocked') {
      ops.push({ op: 'set_plan_status', status: 'blocked' });
      checkpoint.blockers.forEach(blocker => ops.push({ op: 'add_blocker', blocker }));
      ops.push({ op: 'set_active_todo', todoId: retainedTodoId ?? null });
    } else if (statusSuggestion === 'ready_to_complete') {
      ops.push({ op: 'set_plan_status', status: 'ready_to_complete' });
      ops.push({ op: 'set_active_todo', todoId: null });
    } else if (nextTodo) {
      ops.push({ op: 'set_active_todo', todoId: nextTodo.id });
    } else {
      ops.push({ op: 'set_plan_status', status: 'ready_to_complete' });
      ops.push({ op: 'set_active_todo', todoId: null });
    }

    return {
      schema: 'mingyue.plan_update.v2',
      planId: plan.id,
      checkpointId: checkpoint.checkpointId,
      statusSuggestion,
      summary: sourceUpdate?.summary
        ? `${sourceUpdate.summary}（已自动补全可应用操作）`
        : `前端根据 Checkpoint 自动补全状态更新：${checkpoint.summary}`,
      ops,
      questions: Array.isArray(sourceUpdate?.questions) && sourceUpdate.questions.length ? sourceUpdate.questions : checkpoint.questions,
    };
  }

  function ensurePendingUpdateOps() {
    if (!state.pendingCheckpoint || !state.pendingUpdate) return false;
    if (Array.isArray(state.pendingUpdate.ops) && state.pendingUpdate.ops.length > 0) return false;
    if (
      state.pendingCheckpoint.planId !== state.pendingUpdate.planId
      || state.pendingCheckpoint.checkpointId !== state.pendingUpdate.checkpointId
    ) return false;
    const normalizedUpdate = createFallbackUpdateForCheckpoint(state.pendingCheckpoint, state.pendingUpdate);
    if (!normalizedUpdate) return false;
    state.pendingUpdate = normalizedUpdate;
    return true;
  }

  function setCheckpointWithFallbackUpdate(checkpoint: PlanCheckpoint) {
    const fallbackUpdate = createFallbackUpdateForCheckpoint(checkpoint);
    if (!fallbackUpdate) {
      setProtocolBlocker('收到 PlanCheckpoint，但无法自动补全 PlanUpdate；继续入口已暂停。');
      return false;
    }
    return setCheckpointPair(checkpoint, fallbackUpdate);
  }

  function adoptDraft(task: TaskDefinition, targetName: string) {
    if (!state.pendingDraft) return null;
    const draft = state.pendingDraft;
    const at = nowIso();
    const planId = uid('plan');
    const normalizedTodos = draft.todos.map((todo, index) => ({
      id: todo.id || `todo-${index + 1}`,
      title: todo.title,
      detail: todo.detail,
      required: todo.required,
      status: index === 0 ? 'doing' as TodoStatus : 'todo' as TodoStatus,
      evidence: '',
      createdAt: at,
      updatedAt: at,
    }));
    const plan: AgentPlan = {
      id: planId,
      status: 'active',
      title: draft.title,
      taskId: task.id,
      taskTitle: task.title,
      targetName,
      userGoal: draft.userGoal,
      successCriteria: draft.successCriteria,
      assumptions: draft.assumptions,
      todos: normalizedTodos,
      activeTodoId: draft.activeTodoId || normalizedTodos[0]?.id || null,
      blockers: draft.blockers,
      writeBoundary: draft.writeBoundary,
      promptNotes: '',
      artifacts: emptyWorkingTree(),
      createdAt: at,
      updatedAt: at,
      history: [{ id: uid('event'), at, type: 'adopt_draft', summary: '用户确认启用计划草稿' }],
    };
    state.plans[planId] = plan;
    state.activePlanId = planId;
    state.enabled = true;
    state.pendingDraft = null;
    state.pendingCheckpoint = null;
    state.pendingUpdate = null;
    state.protocolBlocker = null;
    clearTransientIntents();
    persist();
    return plan;
  }

  function rejectDraft() {
    state.pendingDraft = null;
    persist();
  }

  function addDraftTodo(title: string, detail = '') {
    const draft = state.pendingDraft;
    const cleanTitle = title.trim();
    if (!draft || !cleanTitle) return null;
    const todo = {
      id: nextDraftTodoId(draft),
      title: cleanTitle,
      detail: detail.trim(),
      required: true,
    };
    draft.todos.push(todo);
    if (!draft.activeTodoId) draft.activeTodoId = todo.id;
    persist();
    return todo;
  }

  function updateDraftTodo(todoId: string, patch: Partial<Pick<PlanTodo, 'title' | 'detail' | 'required'>>) {
    const draft = state.pendingDraft;
    const todo = draft?.todos.find(item => item.id === todoId);
    if (!draft || !todo) return false;
    if (patch.title !== undefined) {
      const title = patch.title.trim();
      if (!title) return false;
      todo.title = title;
    }
    if (patch.detail !== undefined) todo.detail = patch.detail.trim();
    if (patch.required !== undefined) todo.required = patch.required;
    persist();
    return true;
  }

  function removeDraftTodo(todoId: string) {
    const draft = state.pendingDraft;
    if (!draft || draft.todos.length <= 1) return false;
    if (!draft.todos.some(item => item.id === todoId)) return false;
    draft.todos = draft.todos.filter(item => item.id !== todoId);
    if (draft.activeTodoId === todoId) draft.activeTodoId = draft.todos[0]?.id ?? null;
    persist();
    return true;
  }

  function applyUpdate() {
    if (ensurePendingUpdateOps()) persist();
    const update = state.pendingUpdate;
    if (!update) return false;
    const plan = state.plans[update.planId];
    if (!plan || plan.id !== state.activePlanId) return false;
    if (!Array.isArray(update.ops) || update.ops.length === 0) {
      setProtocolBlocker('PlanUpdate 没有可应用操作，且无法根据 Checkpoint 自动补全；继续入口已暂停。');
      return false;
    }
    const at = nowIso();

    for (const operation of update.ops) {
      switch (operation.op) {
        case 'set_todo_status': {
          const todo = plan.todos.find(item => item.id === operation.todoId);
          if (todo) {
            todo.status = operation.status;
            todo.evidence = operation.evidence ?? todo.evidence;
            todo.updatedAt = at;
          }
          break;
        }
        case 'add_todo':
          if (!plan.todos.some(todo => todo.id === operation.todo.id)) {
            plan.todos.push({ ...operation.todo, status: 'todo', evidence: '', createdAt: at, updatedAt: at });
          }
          break;
        case 'update_todo': {
          const todo = plan.todos.find(item => item.id === operation.todoId);
          if (todo) {
            if (operation.title !== undefined) todo.title = operation.title;
            if (operation.detail !== undefined) todo.detail = operation.detail;
            if (operation.required !== undefined) todo.required = operation.required;
            if (operation.evidence !== undefined) todo.evidence = operation.evidence;
            todo.updatedAt = at;
          }
          break;
        }
        case 'remove_todo':
          plan.todos = plan.todos.filter(todo => todo.id !== operation.todoId);
          if (plan.activeTodoId === operation.todoId) plan.activeTodoId = plan.todos[0]?.id ?? null;
          break;
        case 'set_active_todo':
          if (operation.todoId === null || plan.todos.some(todo => todo.id === operation.todoId)) {
            plan.activeTodoId = operation.todoId;
            const next = plan.todos.find(todo => todo.id === operation.todoId);
            if (next && next.status === 'todo') next.status = 'doing';
          }
          break;
        case 'add_blocker':
          if (operation.blocker && !plan.blockers.includes(operation.blocker)) plan.blockers.push(operation.blocker);
          break;
        case 'remove_blocker':
          plan.blockers = plan.blockers.filter(blocker => blocker !== operation.blocker);
          break;
        case 'set_prompt_notes':
          plan.promptNotes = operation.promptNotes;
          break;
        case 'set_plan_status':
          plan.status = operation.status;
          break;
      }
    }

    if (update.statusSuggestion === 'ready_to_complete') plan.status = 'ready_to_complete';
    if (update.statusSuggestion === 'pause') plan.status = 'paused';
    if (update.statusSuggestion === 'blocked') plan.status = 'blocked';
    if (update.statusSuggestion === 'needs_adjustment' && plan.status !== 'blocked') plan.status = 'active';
    if (update.statusSuggestion === 'continue' && plan.status === 'blocked') plan.status = 'active';

    const active = plan.todos.find(todo => todo.id === plan.activeTodoId);
    if (active && ['done', 'skipped'].includes(active.status)) {
      const next = plan.todos.find(todo => !['done', 'skipped'].includes(todo.status));
      plan.activeTodoId = next?.id ?? active.id;
      if (next && next.status === 'todo') next.status = 'doing';
    }
    if (plan.todos.filter(todo => todo.required).every(todo => ['done', 'skipped'].includes(todo.status))) {
      plan.status = 'ready_to_complete';
    }

    addHistory(plan, 'apply_checkpoint_update', update.summary, state.settings.maxHistoryEvents);
    state.pendingCheckpoint = null;
    state.pendingUpdate = null;
    state.protocolBlocker = null;
    persist();
    return true;
  }

  function rejectUpdate() {
    state.pendingCheckpoint = null;
    state.pendingUpdate = null;
    state.protocolBlocker = null;
    clearTransientIntents();
    persist();
  }

  function applyArtifactDelta(delta: PlanArtifactDelta) {
    const plan = activePlan.value;
    if (!plan) return null;
    if (delta.planId && delta.planId !== plan.id) return null;
    plan.artifacts = {
      version: plan.artifacts.version + 1,
      summary: delta.summary,
      updatedAt: nowIso(),
      previousArtifacts: plan.artifacts.artifacts.map(artifact => ({ ...artifact })),
      artifacts: delta.artifacts,
      operations: delta.operations,
    };
    addHistory(plan, 'artifact_delta', delta.summary, state.settings.maxHistoryEvents);
    persist();
    return plan.artifacts;
  }

  function markUserAdjustment(userText: string) {
    const checkpoint = state.pendingCheckpoint;
    const plan = activePlan.value;
    if (!checkpoint || !plan || !userText.trim()) return false;
    state.adjustmentIntent = {
      kind: 'adjust',
      planId: plan.id,
      checkpointId: checkpoint.checkpointId,
      todoId: checkpoint.todoId,
      userText: userText.trim(),
      at: nowIso(),
    };
    state.continueIntent = null;
    persist();
    return true;
  }

  async function continueFromCheckpoint() {
    if (!hasContinuableCheckpoint.value || !state.pendingCheckpoint || !state.pendingUpdate) return false;
    const checkpoint = state.pendingCheckpoint;
    const statusSuggestion = state.pendingUpdate.statusSuggestion;
    const planId = checkpoint.planId;
    const todoId = checkpoint.todoId;
    const checkpointId = checkpoint.checkpointId;
    if (!applyUpdate()) return false;
    if (statusSuggestion === 'pause' || statusSuggestion === 'blocked' || statusSuggestion === 'ready_to_complete') {
      state.continueIntent = null;
      state.adjustmentIntent = null;
      persist();
      return true;
    }
    state.continueIntent = {
      kind: 'continue',
      planId,
      checkpointId,
      todoId,
      at: nowIso(),
    };
    state.adjustmentIntent = null;
    persist();
    await triggerSlash('/trigger');
    return true;
  }

  function setTodoStatus(todoId: string, status: TodoStatus) {
    const plan = activePlan.value;
    const todo = plan?.todos.find(item => item.id === todoId);
    if (!plan || !todo) return;
    todo.status = status;
    todo.updatedAt = nowIso();
    addHistory(plan, 'manual_todo', `用户将「${todo.title}」标记为 ${status}`, state.settings.maxHistoryEvents);
    persist();
  }

  function setActiveTodo(todoId: string | null) {
    const plan = activePlan.value;
    if (!plan) return;
    plan.activeTodoId = todoId;
    addHistory(plan, 'manual_active', '用户调整当前 todo', state.settings.maxHistoryEvents);
    persist();
  }

  function nextTodoId(plan: AgentPlan) {
    const used = new Set(plan.todos.map(todo => todo.id));
    let index = plan.todos.length + 1;
    let id = `todo-${index}`;
    while (used.has(id)) {
      index += 1;
      id = `todo-${index}`;
    }
    return id;
  }

  function addTodo(title: string, detail = '') {
    const plan = activePlan.value;
    const cleanTitle = title.trim();
    if (!plan || !cleanTitle) return null;
    const at = nowIso();
    const todo: PlanTodo = {
      id: nextTodoId(plan),
      title: cleanTitle,
      detail: detail.trim(),
      required: true,
      status: 'todo',
      evidence: '',
      createdAt: at,
      updatedAt: at,
    };
    plan.todos.push(todo);
    if (!plan.activeTodoId) plan.activeTodoId = todo.id;
    addHistory(plan, 'manual_add_todo', `用户新增 todo「${todo.title}」`, state.settings.maxHistoryEvents);
    persist();
    return todo;
  }

  function updateTodo(todoId: string, patch: Partial<Pick<PlanTodo, 'title' | 'detail' | 'required' | 'evidence'>>) {
    const plan = activePlan.value;
    const todo = plan?.todos.find(item => item.id === todoId);
    if (!plan || !todo) return false;
    if (patch.title !== undefined) {
      const title = patch.title.trim();
      if (!title) return false;
      todo.title = title;
    }
    if (patch.detail !== undefined) todo.detail = patch.detail.trim();
    if (patch.required !== undefined) todo.required = patch.required;
    if (patch.evidence !== undefined) todo.evidence = patch.evidence.trim();
    todo.updatedAt = nowIso();
    addHistory(plan, 'manual_edit_todo', `用户编辑 todo「${todo.title}」`, state.settings.maxHistoryEvents);
    persist();
    return true;
  }

  function removeTodo(todoId: string) {
    const plan = activePlan.value;
    if (!plan || plan.todos.length <= 1) return false;
    const todo = plan.todos.find(item => item.id === todoId);
    if (!todo) return false;
    plan.todos = plan.todos.filter(item => item.id !== todoId);
    if (plan.activeTodoId === todoId) {
      plan.activeTodoId = plan.todos.find(item => !['done', 'skipped'].includes(item.status))?.id ?? plan.todos[0]?.id ?? null;
    }
    addHistory(plan, 'manual_remove_todo', `用户删除 todo「${todo.title}」`, state.settings.maxHistoryEvents);
    persist();
    return true;
  }

  function pausePlan() {
    const plan = activePlan.value;
    if (!plan) return;
    plan.status = 'paused';
    addHistory(plan, 'pause', '用户暂停计划', state.settings.maxHistoryEvents);
    persist();
  }

  function resumePlan(planId = state.activePlanId) {
    if (!planId) return;
    const plan = state.plans[planId];
    if (!plan) return;
    plan.status = 'active';
    state.activePlanId = planId;
    state.enabled = true;
    addHistory(plan, 'resume', '用户恢复计划', state.settings.maxHistoryEvents);
    persist();
  }

  function completePlan() {
    const plan = activePlan.value;
    if (!plan) return false;
    plan.status = 'completed';
    plan.completedAt = nowIso();
    addHistory(plan, 'complete', '用户确认计划完成', state.settings.maxHistoryEvents);
    replaceState(defaultState());
    clearPersistedState();
    return true;
  }

  return {
    state,
    activePlan,
    activeTodo,
    hasInjectablePlan,
    hasContinuableCheckpoint,
    loadFromChat,
    setPendingDraft,
    setPendingUpdate,
    setCheckpointPair,
    setCheckpointWithFallbackUpdate,
    setProtocolBlocker,
    adoptDraft,
    rejectDraft,
    addDraftTodo,
    updateDraftTodo,
    removeDraftTodo,
    applyUpdate,
    rejectUpdate,
    applyArtifactDelta,
    markUserAdjustment,
    continueFromCheckpoint,
    setTodoStatus,
    setActiveTodo,
    addTodo,
    updateTodo,
    removeTodo,
    pausePlan,
    resumePlan,
    completePlan,
  };
});
