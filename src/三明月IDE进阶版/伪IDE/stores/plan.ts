import type { TaskDefinition } from './workshop';

export const PLAN_STATE_KEY = '明月秋青_计划模式_v1';

export type PlanStatus = 'draft' | 'active' | 'paused' | 'ready_to_complete' | 'completed' | 'archived';
export type TodoStatus = 'todo' | 'doing' | 'blocked' | 'done' | 'skipped';

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
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  history: PlanHistoryEvent[];
}

export interface PlanDraft {
  schema: 'mingyue.plan_draft.v1';
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
  | { op: 'set_prompt_notes'; promptNotes: string };

export interface PlanUpdateProposal {
  schema: 'mingyue.plan_update.v1';
  planId: string;
  statusSuggestion: 'continue' | 'ready_to_complete' | 'pause' | 'blocked';
  summary: string;
  ops: PlanUpdateOperation[];
  questions: string[];
}

export interface PlanArchive {
  id: string;
  archivedAt: string;
  plan: AgentPlan;
}

export interface PlanModeState {
  enabled: boolean;
  activePlanId: string | null;
  plans: Record<string, AgentPlan>;
  pendingDraft: PlanDraft | null;
  pendingUpdate: PlanUpdateProposal | null;
  archives: PlanArchive[];
  settings: {
    injectEnabled: boolean;
    standardOnly: boolean;
    maxPromptTodos: number;
    maxArchives: number;
    maxHistoryEvents: number;
  };
}

export const defaultPlanSettings: PlanModeState['settings'] = {
  injectEnabled: true,
  standardOnly: true,
  maxPromptTodos: 7,
  maxArchives: 10,
  maxHistoryEvents: 20,
};

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultState(): PlanModeState {
  return {
    enabled: false,
    activePlanId: null,
    plans: {},
    pendingDraft: null,
    pendingUpdate: null,
    archives: [],
    settings: { ...defaultPlanSettings },
  };
}

function normalizeState(value: unknown): PlanModeState {
  if (!value || typeof value !== 'object') return defaultState();
  const raw = value as Partial<PlanModeState>;
  return {
    ...defaultState(),
    ...raw,
    plans: raw.plans && typeof raw.plans === 'object' ? raw.plans : {},
    archives: Array.isArray(raw.archives) ? raw.archives.slice(-defaultPlanSettings.maxArchives) : [],
    settings: { ...defaultPlanSettings, ...(raw.settings ?? {}) },
  };
}

function addHistory(plan: AgentPlan, type: string, summary: string, maxHistoryEvents: number) {
  plan.history = [
    ...plan.history,
    { id: uid('event'), at: nowIso(), type, summary },
  ].slice(-maxHistoryEvents);
  plan.updatedAt = nowIso();
}

export const usePlanStore = defineStore('plan', () => {
  const state = reactive<PlanModeState>(defaultState());

  const activePlan = computed(() => {
    if (!state.activePlanId) return null;
    const plan = state.plans[state.activePlanId];
    return plan && ['active', 'ready_to_complete'].includes(plan.status) ? plan : null;
  });
  const hasInjectablePlan = computed(() => Boolean(state.enabled && state.settings.injectEnabled && activePlan.value));

  function replaceState(nextState: PlanModeState) {
    Object.assign(state, normalizeState(nextState));
  }

  function loadFromChat() {
    try {
      const variables = getVariables({ type: 'chat' });
      replaceState(normalizeState(variables[PLAN_STATE_KEY]));
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

  function setPendingDraft(draft: PlanDraft | null) {
    state.pendingDraft = draft;
    if (draft) state.enabled = true;
    persist();
  }

  function setPendingUpdate(update: PlanUpdateProposal | null) {
    state.pendingUpdate = update;
    persist();
  }

  function adoptDraft(task: TaskDefinition, targetName: string) {
    if (!state.pendingDraft) return null;
    const draft = state.pendingDraft;
    const at = nowIso();
    const planId = uid('plan');
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
      todos: draft.todos.map((todo, index) => ({
        id: todo.id || `todo-${index + 1}`,
        title: todo.title,
        detail: todo.detail,
        required: todo.required,
        status: 'todo',
        evidence: '',
        createdAt: at,
        updatedAt: at,
      })),
      activeTodoId: draft.activeTodoId || draft.todos[0]?.id || null,
      blockers: draft.blockers,
      writeBoundary: draft.writeBoundary,
      promptNotes: '',
      createdAt: at,
      updatedAt: at,
      history: [{ id: uid('event'), at, type: 'adopt_draft', summary: '用户采用计划草稿' }],
    };
    state.plans[planId] = plan;
    state.activePlanId = planId;
    state.enabled = true;
    state.pendingDraft = null;
    state.pendingUpdate = null;
    persist();
    return plan;
  }

  function rejectDraft() {
    state.pendingDraft = null;
    persist();
  }

  function applyUpdate() {
    const update = state.pendingUpdate;
    if (!update) return false;
    const plan = state.plans[update.planId];
    if (!plan || plan.id !== state.activePlanId) return false;
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
          plan.todos.push({ ...operation.todo, status: 'todo', evidence: '', createdAt: at, updatedAt: at });
          break;
        case 'update_todo': {
          const todo = plan.todos.find(item => item.id === operation.todoId);
          if (todo) Object.assign(todo, { ...operation, id: todo.id, updatedAt: at });
          break;
        }
        case 'remove_todo':
          plan.todos = plan.todos.filter(todo => todo.id !== operation.todoId);
          if (plan.activeTodoId === operation.todoId) plan.activeTodoId = plan.todos[0]?.id ?? null;
          break;
        case 'set_active_todo':
          plan.activeTodoId = operation.todoId;
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
      }
    }

    if (update.statusSuggestion === 'ready_to_complete') plan.status = 'ready_to_complete';
    if (update.statusSuggestion === 'pause') plan.status = 'paused';
    if (update.statusSuggestion === 'blocked' && plan.activeTodoId) {
      const todo = plan.todos.find(item => item.id === plan.activeTodoId);
      if (todo) todo.status = 'blocked';
    }
    addHistory(plan, 'apply_update', update.summary, state.settings.maxHistoryEvents);
    state.pendingUpdate = null;
    persist();
    return true;
  }

  function rejectUpdate() {
    state.pendingUpdate = null;
    persist();
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
    const completedAt = nowIso();
    plan.status = 'completed';
    plan.completedAt = completedAt;
    addHistory(plan, 'complete', '用户确认计划完成', state.settings.maxHistoryEvents);
    state.archives = [...state.archives, { id: uid('archive'), archivedAt: completedAt, plan: JSON.parse(JSON.stringify(plan)) }]
      .slice(-state.settings.maxArchives);
    state.activePlanId = null;
    state.enabled = false;
    state.pendingDraft = null;
    state.pendingUpdate = null;
    persist();
    return true;
  }

  return {
    state,
    activePlan,
    hasInjectablePlan,
    loadFromChat,
    setPendingDraft,
    setPendingUpdate,
    adoptDraft,
    rejectDraft,
    applyUpdate,
    rejectUpdate,
    setTodoStatus,
    setActiveTodo,
    pausePlan,
    resumePlan,
    completePlan,
  };
});
