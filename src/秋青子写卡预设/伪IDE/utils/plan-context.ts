import planContextTemplate from '../../条目/🧭_计划模式上下文.txt?raw';
import type { AgentPlan } from '../stores/plan';
import { usePlanStore } from '../stores/plan';
import { useWorkshopStore } from '../stores/workshop';

const PLAN_INJECTION_ID = 'mingyue-plan-context-v2';
const QUESTION_LIKE_TODO_PATTERN = /确认|询问|提问|追问|问答|等待|收集|了解|判定|判断|选择|决定|明确|确定|核对|是否|需不需要|问用户|用户回答/;

function compact(text: string, limit: number) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > limit ? `${normalized.slice(0, limit - 1)}…` : normalized;
}

function isQuestionLikeTodo(todo: AgentPlan['todos'][number] | null) {
  if (!todo) return false;
  return QUESTION_LIKE_TODO_PATTERN.test(`${todo.title}\n${todo.detail}`);
}

function renderArtifactTree(plan: AgentPlan, maxChars: number) {
  const tree = plan.artifacts;
  if (!tree.artifacts.length && !tree.operations.length) {
    return ['artifact_working_tree: empty'];
  }

  const artifactLines = tree.artifacts.flatMap(artifact => [
    `- artifact ${artifact.id}: ${compact(artifact.title, 80)}`,
    `  target: ${artifact.targetPath}`,
    `  type: ${artifact.contentType} / risk: ${artifact.riskLevel}`,
    `  content_preview: ${compact(artifact.content, maxChars)}`,
  ]);
  const operationLines = tree.operations.map(operation =>
    `- ${operation.id}: ${operation.tool} ${operation.targetPath} | ${compact(operation.summary, 140)} | risk=${operation.riskLevel}`,
  );

  return [
    `artifact_working_tree_version: ${tree.version}`,
    `artifact_working_tree_summary: ${compact(tree.summary || '无摘要', 160)}`,
    'artifacts:',
    ...(artifactLines.length ? artifactLines : ['- none']),
    'write_operations:',
    ...(operationLines.length ? operationLines : ['- none']),
  ];
}

function renderPlan(plan: AgentPlan, maxPromptTodos: number, maxArtifactPreviewChars: number) {
  const planStore = usePlanStore();
  const activeTodo = plan.todos.find(todo => todo.id === plan.activeTodoId)
    ?? plan.todos.find(todo => todo.status !== 'done' && todo.status !== 'skipped')
    ?? null;
  const todos = plan.todos
    .filter(todo => todo.id === activeTodo?.id || todo.status !== 'done')
    .slice(0, maxPromptTodos)
    .map(todo => `- [${todo.status}] ${todo.id}${todo.id === activeTodo?.id ? ' (active)' : ''}: ${compact(todo.title, 80)}${todo.detail ? ` — ${compact(todo.detail, 120)}` : ''}`);
  const checkpoint = planStore.state.pendingCheckpoint;
  const continueIntent = planStore.state.continueIntent;
  const adjustmentIntent = planStore.state.adjustmentIntent;

  return [
    '<mingyue_plan_context_v2>',
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
    `active_todo: ${activeTodo ? `${activeTodo.id} — ${activeTodo.title} — ${activeTodo.status}` : '无'}`,
    isQuestionLikeTodo(activeTodo)
      ? 'active_todo_execution_hint: 当前 todo 看起来像确认/判断类节点，必须先给出暂定结论、判断依据、默认假设、候选方案和待确认清单，不能只提问或等待用户回答。'
      : '',
    'todos:',
    ...(todos.length ? todos : ['- 无待处理 todo']),
    '',
    'blockers:',
    ...(plan.blockers.length ? plan.blockers.map(item => `- ${compact(item, 120)}`) : ['- 无']),
    '',
    'write_boundary:',
    ...(plan.writeBoundary.length ? plan.writeBoundary.map(item => `- ${compact(item, 120)}`) : ['- 遵循当前任务写入边界。']),
    plan.promptNotes ? `\nprompt_notes: ${compact(plan.promptNotes, 260)}` : '',
    '',
    'pending_checkpoint:',
    checkpoint && checkpoint.planId === plan.id
      ? `- ${checkpoint.checkpointId} / ${checkpoint.status} / ${compact(checkpoint.summary, 180)}`
      : '- none',
    continueIntent && continueIntent.planId === plan.id
      ? `continue_intent: user_clicked_continue_from ${continueIntent.checkpointId}; apply已由前端完成，请进入当前 active_todo 的下一轮执行。`
      : '',
    adjustmentIntent && adjustmentIntent.planId === plan.id
      ? `adjustment_intent: user_adjusted_current_todo_from ${adjustmentIntent.checkpointId}; 不要应用上一条 pending update，请围绕原 active_todo 按用户意见修正：${compact(adjustmentIntent.userText, 360)}`
      : '',
    '',
    ...renderArtifactTree(plan, maxArtifactPreviewChars),
    '</mingyue_plan_context_v2>',
  ].filter(Boolean).join('\n');
}

export function injectCurrentPlanContext(dryRun = false) {
  if (dryRun) return false;
  const planStore = usePlanStore();
  const workshopStore = useWorkshopStore();
  const plan = planStore.activePlan;
  if (!planStore.state.settings.enabledModes.includes(workshopStore.mode as 'standard' | 'pro')) return false;
  if (!planStore.hasInjectablePlan || !plan) return false;

  injectPrompts([
    {
      id: PLAN_INJECTION_ID,
      position: 'in_chat',
      depth: 0,
      role: 'system',
      content: renderPlan(plan, planStore.state.settings.maxPromptTodos, planStore.state.settings.maxArtifactPreviewChars),
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
