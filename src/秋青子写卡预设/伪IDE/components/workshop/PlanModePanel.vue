<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import type { TaskDefinition } from '../../stores/workshop';
import {
  usePlanStore,
  type PlanDraft,
  type PlanStatus,
  type PlanUpdateOperation,
  type PlanUpdateProposal,
  type TodoStatus,
} from '../../stores/plan';

const props = defineProps<{
  task: TaskDefinition;
  targetName: string;
  userGoal: string;
  canDraft: boolean;
}>();

const emit = defineEmits<{
  draft: [];
  openWritePanel: [];
}>();

const planStore = usePlanStore();
const isContinuing = ref(false);
const isStartingPlan = ref(false);

const statusLabels: Record<TodoStatus, string> = {
  todo: '待办',
  doing: '进行中',
  blocked: '阻塞',
  done: '完成',
  skipped: '跳过',
};

const checkpointStatusLabels = {
  ready_for_user: '待用户确认',
  blocked: '阻塞',
  needs_adjustment: '需调整',
  ready_to_complete: '可写入确认',
};

const planStatusLabels: Record<PlanStatus, string> = {
  active: '执行中',
  paused: '已暂停',
  blocked: '阻塞',
  ready_to_complete: '待写入确认',
  completed: '已完成',
};

const statusSuggestionLabels: Record<PlanUpdateProposal['statusSuggestion'], string> = {
  continue: '接受并推进',
  needs_adjustment: '继续迭代',
  ready_to_complete: '建议写入确认',
  pause: '建议暂停',
  blocked: '标记阻塞',
};

const continueActionLabels: Record<PlanUpdateProposal['statusSuggestion'], string> = {
  continue: '接受并进入下一步',
  needs_adjustment: '继续迭代当前节点',
  ready_to_complete: '接受并进入写入确认',
  pause: '应用并暂停',
  blocked: '应用阻塞状态',
};

const activePlan = computed(() => planStore.activePlan);
const activeArtifactTree = computed(() => activePlan.value?.artifacts ?? null);
const pendingUpdate = computed(() => planStore.state.pendingUpdate);
const pendingUpdateImpact = computed(() => pendingUpdate.value?.ops.map(describePlanOperation) ?? []);
const checkpointActionLabel = computed(() => {
  if (isContinuing.value) return '处理中';
  const suggestion = pendingUpdate.value?.statusSuggestion;
  return suggestion ? continueActionLabels[suggestion] : '应用并继续';
});
const recentPlanHistory = computed(() => activePlan.value?.history.slice(-5).reverse() ?? []);
type DraftTodo = PlanDraft['todos'][number];
const editingTodoId = ref<string | null>(null);
const editTitle = ref('');
const editDetail = ref('');
const isAddingTodo = ref(false);
const newTodoTitle = ref('');
const newTodoDetail = ref('');

async function adoptDraft() {
  if (isStartingPlan.value) return;
  isStartingPlan.value = true;
  try {
    const plan = planStore.adoptDraft(props.task, props.targetName || '未命名目标');
    if (!plan) return;
    cancelEditTodo();
    cancelAddTodo();
    await triggerSlash('/trigger');
    toastr.success('计划已激活，并已开始执行第一步');
  } catch (error) {
    toastr.error(`启动计划失败：${error}`);
  } finally {
    isStartingPlan.value = false;
  }
}

function completePlan() {
  if (!confirm('确认完成当前计划吗？完成后会停止注入计划上下文。')) return;
  if (planStore.completePlan()) toastr.success('计划已完成，已停止注入');
}

function rejectDraft() {
  cancelEditTodo();
  cancelAddTodo();
  planStore.rejectDraft();
}

async function continuePlan() {
  if (isContinuing.value) return;
  isContinuing.value = true;
  try {
    const suggestion = pendingUpdate.value?.statusSuggestion;
    const ok = await planStore.continueFromCheckpoint();
    if (ok) {
      const message = suggestion === 'pause' || suggestion === 'blocked'
        ? '已应用检查点更新，计划已暂停继续'
        : suggestion === 'ready_to_complete'
          ? '已进入写入确认，请在写入计划区 Dryrun / 确认执行'
          : '已应用检查点更新，并触发下一步';
      toastr.success(message);
      if (suggestion === 'ready_to_complete') emit('openWritePanel');
    } else {
      toastr.warning('缺少有效 Checkpoint + PlanUpdate，不能继续');
    }
  } catch (error) {
    toastr.error(`继续失败：${error}`);
  } finally {
    isContinuing.value = false;
  }
}

function todoLabel(todoId: string | null | undefined) {
  if (todoId === null) return '无当前节点';
  if (!todoId) return '未知节点';
  const todo = activePlan.value?.todos.find(item => item.id === todoId);
  return todo ? `「${todo.title}」` : todoId;
}

function describePlanOperation(operation: PlanUpdateOperation) {
  switch (operation.op) {
    case 'set_todo_status':
      return `${todoLabel(operation.todoId)} -> ${statusLabels[operation.status]}`;
    case 'set_active_todo':
      return `当前节点 -> ${todoLabel(operation.todoId)}`;
    case 'add_todo':
      return `新增 todo「${operation.todo.title}」`;
    case 'update_todo': {
      const fields = [
        operation.title !== undefined ? '标题' : '',
        operation.detail !== undefined ? '详情' : '',
        operation.required !== undefined ? '必选状态' : '',
        operation.evidence !== undefined ? '证据' : '',
      ].filter(Boolean);
      return `更新 ${todoLabel(operation.todoId)}：${fields.join('、') || '内容'}`;
    }
    case 'remove_todo':
      return `移除 ${todoLabel(operation.todoId)}`;
    case 'add_blocker':
      return `新增阻塞：${operation.blocker}`;
    case 'remove_blocker':
      return `移除阻塞：${operation.blocker}`;
    case 'set_prompt_notes':
      return '更新计划提示备注';
    case 'set_plan_status':
      return `计划状态 -> ${planStatusLabels[operation.status]}`;
    default:
      return '未知计划操作';
  }
}

function formatHistoryTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function beginEditTodo(todo: DraftTodo) {
  editingTodoId.value = todo.id;
  editTitle.value = todo.title;
  editDetail.value = todo.detail;
}

function cancelEditTodo() {
  editingTodoId.value = null;
  editTitle.value = '';
  editDetail.value = '';
}

function saveEditTodo() {
  if (!editingTodoId.value) return;
  const ok = planStore.updateDraftTodo(editingTodoId.value, {
    title: editTitle.value,
    detail: editDetail.value,
  });
  if (!ok) {
    toastr.warning('todo 标题不能为空');
    return;
  }
  cancelEditTodo();
  toastr.success('todo 已更新');
}

function removeTodo(todoId = editingTodoId.value) {
  if (!todoId) return;
  if (!confirm('确认删除这条 todo 吗？')) return;
  if (!planStore.removeDraftTodo(todoId)) {
    toastr.warning('至少需要保留一条 todo');
    return;
  }
  cancelEditTodo();
  toastr.success('todo 已删除');
}

function beginAddTodo() {
  cancelEditTodo();
  isAddingTodo.value = true;
  newTodoTitle.value = '';
  newTodoDetail.value = '';
}

function cancelAddTodo() {
  isAddingTodo.value = false;
  newTodoTitle.value = '';
  newTodoDetail.value = '';
}

function saveNewTodo() {
  const todo = planStore.addDraftTodo(newTodoTitle.value, newTodoDetail.value);
  if (!todo) {
    toastr.warning('todo 标题不能为空');
    return;
  }
  cancelAddTodo();
  toastr.success('todo 已新增');
}
</script>

<template>
  <section class="plan-mode-panel">
    <div class="plan-mode-head">
      <div>
        <div class="workshop-kicker">计划模式 v2</div>
        <h3>节点确认式 To-do</h3>
      </div>
      <button class="secondary-action compact" :disabled="!canDraft" @click="emit('draft')">
        <SvgIcons name="edit" :size="13" />
        草拟计划
      </button>
    </div>

    <p class="plan-mode-copy">
      采用计划后不会再创建伪 user 消息。每个节点由 assistant 输出 Checkpoint + PlanUpdate 暂存，用户点继续时才应用并用 /trigger 进入下一步；也可以直接输入调整意见重做当前节点。
    </p>

    <div v-if="planStore.state.pendingDraft" class="plan-card pending">
      <div class="plan-card-title">
        <strong>{{ planStore.state.pendingDraft.title }}</strong>
        <span>{{ planStore.state.pendingDraft.confidence === 'needs_input' ? '需补充' : '可采用' }}</span>
      </div>
      <p>{{ planStore.state.pendingDraft.userGoal }}</p>
      <div class="todo-list">
        <div v-for="todo in planStore.state.pendingDraft.todos" :key="todo.id" class="todo-row">
          <form v-if="editingTodoId === todo.id" class="todo-edit-form" @submit.prevent="saveEditTodo">
            <div class="todo-edit-fields">
              <input v-model="editTitle" type="text" placeholder="todo 标题" />
              <textarea v-model="editDetail" rows="2" placeholder="todo 详情" />
            </div>
            <div class="todo-edit-actions">
              <button class="primary-action compact" type="submit">保存</button>
              <button class="secondary-action compact" type="button" @click="cancelEditTodo">取消</button>
              <button class="secondary-action compact danger-action" type="button" @click="removeTodo(todo.id)">删除</button>
            </div>
          </form>
          <template v-else>
            <span class="todo-main" @dblclick="beginEditTodo(todo)">
              <strong>{{ todo.title }}</strong>
              <small>{{ todo.detail || '无补充说明' }}</small>
            </span>
            <div class="todo-controls">
              <button class="secondary-action compact" type="button" @click="beginEditTodo(todo)">编辑</button>
            </div>
          </template>
        </div>
      </div>
      <form v-if="isAddingTodo" class="todo-add-form" @submit.prevent="saveNewTodo">
        <div class="todo-edit-fields">
          <input v-model="newTodoTitle" type="text" placeholder="新增 todo 标题" />
          <textarea v-model="newTodoDetail" rows="2" placeholder="新增 todo 详情" />
        </div>
        <div class="todo-edit-actions">
          <button class="primary-action compact" type="submit">添加</button>
          <button class="secondary-action compact" type="button" @click="cancelAddTodo">取消</button>
        </div>
      </form>
      <div class="plan-actions compact-actions">
        <button class="secondary-action" @click="rejectDraft">拒绝草稿</button>
        <button class="secondary-action" type="button" @click="beginAddTodo">新增 todo</button>
        <button class="primary-action" :disabled="isStartingPlan" @click="adoptDraft">
          {{ isStartingPlan ? '启动中' : '确认计划' }}
        </button>
      </div>
    </div>

    <div v-if="activePlan" class="plan-card active-plan-card">
      <div class="plan-card-title">
        <strong>{{ activePlan.title }}</strong>
        <span>{{ activePlan.status }}</span>
      </div>
      <p>{{ activePlan.userGoal }}</p>
      <div class="todo-list">
        <div v-for="todo in activePlan.todos" :key="todo.id" class="todo-row" :class="`status-${todo.status}`">
          <input type="radio" name="active-plan-todo" :checked="activePlan.activeTodoId === todo.id" @change="planStore.setActiveTodo(todo.id)" />
          <span class="todo-main">
            <strong>{{ todo.title }}</strong>
            <small>{{ todo.detail || '无补充说明' }}</small>
          </span>
          <div class="todo-controls">
            <select :value="todo.status" @change="planStore.setTodoStatus(todo.id, ($event.target as HTMLSelectElement).value as TodoStatus)">
              <option v-for="(label, status) in statusLabels" :key="status" :value="status">{{ label }}</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="planStore.state.pendingCheckpoint" class="checkpoint-box" :class="`status-${planStore.state.pendingCheckpoint.status}`">
        <div class="plan-card-title">
          <strong>节点检查点</strong>
          <span>{{ checkpointStatusLabels[planStore.state.pendingCheckpoint.status] }}</span>
        </div>
        <p>{{ planStore.state.pendingCheckpoint.summary }}</p>
        <small>{{ planStore.state.pendingCheckpoint.continueHint }}；{{ planStore.state.pendingCheckpoint.adjustmentHint }}</small>
        <div v-if="pendingUpdate" class="update-preview-box">
          <div class="update-preview-head">
            <strong>待应用 PlanUpdate</strong>
            <span>{{ statusSuggestionLabels[pendingUpdate.statusSuggestion] }}</span>
          </div>
          <p>{{ pendingUpdate.summary }}</p>
          <ul v-if="pendingUpdateImpact.length" class="update-impact-list">
            <li v-for="impact in pendingUpdateImpact" :key="impact">{{ impact }}</li>
          </ul>
          <div v-if="pendingUpdate.questions.length" class="update-question-list">
            <strong>待确认</strong>
            <span>{{ pendingUpdate.questions.join(' / ') }}</span>
          </div>
        </div>
        <div class="plan-actions compact-actions">
          <button class="secondary-action" @click="planStore.rejectUpdate()">不应用，继续修改</button>
          <button
            class="primary-action"
            :disabled="!planStore.hasContinuableCheckpoint || isContinuing"
            @click="continuePlan"
          >
            {{ checkpointActionLabel }}
          </button>
        </div>
      </div>

      <div v-if="planStore.state.protocolBlocker" class="blocker-box">
        <strong>当前阻塞</strong>
        <span>{{ planStore.state.protocolBlocker }}</span>
      </div>

      <div v-if="activeArtifactTree && (activeArtifactTree.artifacts.length || activeArtifactTree.operations.length)" class="artifact-tree-box">
        <div class="plan-card-title">
          <strong>产物工作区</strong>
          <span>v{{ activeArtifactTree.version }}</span>
        </div>
        <p>{{ activeArtifactTree.summary || '暂无摘要' }}</p>
        <small>{{ activeArtifactTree.artifacts.length }} 个产物 / {{ activeArtifactTree.operations.length }} 条写入动作，diff 默认比较上一版本。</small>
      </div>

      <div v-if="recentPlanHistory.length" class="plan-history-box">
        <div class="plan-card-title">
          <strong>计划时间线</strong>
          <span>最近 {{ recentPlanHistory.length }} 条</span>
        </div>
        <div class="plan-history-list">
          <div v-for="event in recentPlanHistory" :key="event.id" class="plan-history-row">
            <span>{{ formatHistoryTime(event.at) }}</span>
            <strong>{{ event.summary }}</strong>
          </div>
        </div>
      </div>

      <div class="plan-mode-copy">
        最新 assistant 消息没有有效 Checkpoint + PlanUpdate 时，继续入口会保持关闭，避免盲目推进。
      </div>
      <div class="plan-actions compact-actions">
        <button class="secondary-action" @click="planStore.pausePlan()">暂停</button>
        <button v-if="activePlan.status === 'ready_to_complete'" class="primary-action" @click="emit('openWritePanel')">进入写入确认</button>
        <button v-if="activePlan.status === 'ready_to_complete'" class="secondary-action" @click="completePlan">完成并清理计划</button>
      </div>
    </div>

    <div v-else-if="planStore.state.activePlanId && planStore.state.plans[planStore.state.activePlanId]" class="plan-card">
      <div class="plan-card-title">
        <strong>{{ planStore.state.plans[planStore.state.activePlanId].title }}</strong>
        <span>{{ planStore.state.plans[planStore.state.activePlanId].status }}</span>
      </div>
      <button class="secondary-action compact" @click="planStore.resumePlan()">恢复计划</button>
    </div>

    <div v-if="!activePlan && !planStore.state.pendingDraft" class="plan-empty">
      <SvgIcons name="bot" :size="16" />
      <span>{{ userGoal ? '可以开始草拟计划。' : '输入目标后可草拟计划。' }}</span>
    </div>
  </section>
</template>

<style scoped lang="scss">
.plan-mode-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--ide-border);
  border-radius: 14px;
  background: var(--ide-surface);
}

.plan-mode-head,
.plan-card-title,
.todo-row,
.compact-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.plan-mode-head,
.plan-card-title {
  justify-content: space-between;
}

.plan-mode-head h3,
.plan-card-title strong {
  margin: 0;
  color: var(--ide-text);
}

.plan-card-title span {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--ide-tag-bg);
  color: var(--ide-tag-text);
  font-size: 11px;
}

.plan-mode-copy,
.plan-card p,
.checkpoint-box small,
.artifact-tree-box small,
.todo-main small,
.plan-empty {
  margin: 0;
  color: var(--ide-dim-2);
  font-size: 12px;
  line-height: 1.6;
}

.plan-card,
.checkpoint-box,
.artifact-tree-box,
.plan-history-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--ide-border);
  border-radius: 12px;
  background: var(--ide-bg2);
}

.plan-card.pending {
  border-color: var(--ide-accent-soft);
}

.checkpoint-box {
  border-color: var(--ide-success-border);
  background: var(--ide-success-soft);
}

.checkpoint-box.status-blocked,
.blocker-box {
  border-color: var(--ide-warning-border);
  background: var(--ide-warning-soft);
}

.artifact-tree-box {
  border-color: var(--ide-info-text);
  background: var(--ide-info-soft);
}

.update-preview-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--ide-success-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--ide-bg2) 72%, transparent);
}

.update-preview-head,
.update-question-list,
.plan-history-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-preview-head {
  justify-content: space-between;
}

.update-preview-head strong,
.update-question-list strong,
.plan-history-row strong {
  color: var(--ide-text);
  font-size: 12px;
}

.update-preview-head span,
.plan-history-row span {
  color: var(--ide-dim-2);
  font-size: 11px;
}

.update-impact-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding-left: 18px;
  color: var(--ide-text);
  font-size: 12px;
  line-height: 1.5;
}

.update-question-list {
  align-items: flex-start;
  color: var(--ide-dim-2);
  font-size: 12px;
  line-height: 1.5;
}

.plan-history-box {
  border-style: dashed;
}

.plan-history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plan-history-row {
  align-items: flex-start;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 8px;
  background: var(--ide-bg);
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.todo-row {
  padding: 8px;
  border-radius: 10px;
  background: var(--ide-bg);
  align-items: flex-start;
}

.todo-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.todo-main strong {
  color: var(--ide-text);
  font-size: 12px;
}

.todo-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.todo-controls select {
  max-width: 78px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg2);
  color: var(--ide-text);
  font-size: 12px;
}

.todo-edit-form,
.todo-add-form {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 8px;
}

.todo-add-form {
  padding: 8px;
  border: 1px dashed var(--ide-border);
  border-radius: 10px;
  background: var(--ide-bg);
}

.todo-edit-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.todo-edit-fields input,
.todo-edit-fields textarea {
  width: 100%;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg2);
  color: var(--ide-text);
  font: inherit;
  font-size: 12px;
}

.todo-edit-fields input {
  padding: 7px 9px;
}

.todo-edit-fields textarea {
  resize: vertical;
  padding: 8px 9px;
}

.todo-edit-actions {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.danger-action {
  color: var(--ide-warning-text);
}

.blocker-box {
  display: flex;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--ide-warning-border);
  border-radius: 10px;
  color: var(--ide-warning-text);
  font-size: 12px;
}

.compact {
  padding: 6px 10px;
  font-size: 12px;
}

.compact-actions {
  justify-content: flex-end;
}

.plan-empty {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
