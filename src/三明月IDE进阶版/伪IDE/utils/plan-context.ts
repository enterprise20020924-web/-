import planContextTemplate from '../../条目/🧭_计划模式上下文.txt?raw';
import type { AgentPlan } from '../stores/plan';
import { usePlanStore } from '../stores/plan';
import { useWorkshopStore } from '../stores/workshop';

const PLAN_INJECTION_ID = 'mingyue-plan-context-v1';

function compact(text: string, limit: number) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > limit ? `${normalized.slice(0, limit - 1)}…` : normalized;
}

function renderPlan(plan: AgentPlan, maxPromptTodos: number) {
  const activeTodo = plan.todos.find(todo => todo.id === plan.activeTodoId) ?? plan.todos.find(todo => todo.status !== 'done' && todo.status !== 'skipped') ?? null;
  const todos = plan.todos
    .filter(todo => todo.id === activeTodo?.id || todo.status !== 'done')
    .slice(0, maxPromptTodos)
    .map(todo => `- [${todo.status}] ${todo.id}${todo.id === activeTodo?.id ? ' (active)' : ''}: ${compact(todo.title, 80)}${todo.detail ? `｜${compact(todo.detail, 120)}` : ''}`);

  return [
    '<mingyue_plan_context>',
    planContextTemplate.trim(),
    '',
    `plan_id: ${plan.id}`,
    `status: ${plan.status}`,
    `title: ${compact(plan.title, 80)}`,
    `task: ${plan.taskTitle} (${plan.taskId})`,
    `target: ${compact(plan.targetName, 80)}`,
    `user_goal: ${compact(plan.userGoal, 220)}`,
    '',
    'success_criteria:',
    ...(plan.successCriteria.length ? plan.successCriteria.map(item => `- ${compact(item, 120)}`) : ['- 未列出，按用户目标判断。']),
    '',
    `active_todo: ${activeTodo ? `${activeTodo.id}｜${activeTodo.title}｜${activeTodo.status}` : '无'}`,
    'todos:',
    ...(todos.length ? todos : ['- 无待处理 todo']),
    '',
    'blockers:',
    ...(plan.blockers.length ? plan.blockers.map(item => `- ${compact(item, 120)}`) : ['- 无']),
    '',
    'write_boundary:',
    ...(plan.writeBoundary.length ? plan.writeBoundary.map(item => `- ${compact(item, 120)}`) : ['- 遵循当前任务写入边界。']),
    plan.promptNotes ? `\nprompt_notes: ${compact(plan.promptNotes, 260)}` : '',
    '</mingyue_plan_context>',
  ].filter(Boolean).join('\n');
}

export function injectCurrentPlanContext(dryRun = false) {
  if (dryRun) return false;
  const planStore = usePlanStore();
  const workshopStore = useWorkshopStore();
  const plan = planStore.activePlan;
  if (planStore.state.settings.standardOnly && workshopStore.mode !== 'standard') return false;
  if (!planStore.hasInjectablePlan || !plan) return false;

  injectPrompts([
    {
      id: PLAN_INJECTION_ID,
      position: 'in_chat',
      depth: 0,
      role: 'system',
      content: renderPlan(plan, planStore.state.settings.maxPromptTodos),
      should_scan: false,
    },
  ], { once: true });
  return true;
}

export function registerPlanContextInjection() {
  return eventOn(tavern_events.GENERATION_AFTER_COMMANDS, (_type, _option, dryRun) => {
    try {
      injectCurrentPlanContext(dryRun);
    } catch (error) {
      console.warn('[IDE] inject plan context failed:', error);
    }
  }).stop;
}
