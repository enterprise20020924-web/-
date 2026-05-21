<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import type { TaskDefinition } from '../../stores/workshop';
import { usePlanStore, type TodoStatus } from '../../stores/plan';

const props = defineProps<{
  task: TaskDefinition;
  targetName: string;
  userGoal: string;
  canDraft: boolean;
}>();

const emit = defineEmits<{ draft: [] }>();

const planStore = usePlanStore();

const statusLabels: Record<TodoStatus, string> = {
  todo: '待办',
  doing: '进行中',
  blocked: '阻塞',
  done: '完成',
  skipped: '跳过',
};

const activePlan = computed(() => planStore.activePlan);

function adoptDraft() {
  const plan = planStore.adoptDraft(props.task, props.targetName || '未命名目标');
  if (plan) toastr.success('计划已激活，会进入后续每次生成');
}

function completePlan() {
  if (!confirm('确认完成并归档当前计划吗？完成后将停止注入计划上下文。')) return;
  if (planStore.completePlan()) toastr.success('计划已完成并归档');
}

function applyUpdate() {
  if (planStore.applyUpdate()) {
    toastr.success('已应用计划更新');
  } else {
    toastr.warning('计划更新与当前 active plan 不匹配，已忽略');
    planStore.rejectUpdate();
  }
}
</script>

<template>
  <section class="plan-mode-panel">
    <div class="plan-mode-head">
      <div>
        <div class="workshop-kicker">计划模式</div>
        <h3>标准模式 To-do</h3>
      </div>
      <button class="secondary-action compact" :disabled="!canDraft" @click="emit('draft')">
        <SvgIcons name="edit" :size="13" />
        草拟计划
      </button>
    </div>

    <p class="plan-mode-copy">
      先让秋青子输出 PlanDraft，采用后会把 active plan 注入 `/send`、`/trigger`、`/continue`。
    </p>

    <div v-if="planStore.state.pendingDraft" class="plan-card pending">
      <div class="plan-card-title">
        <strong>{{ planStore.state.pendingDraft.title }}</strong>
        <span>{{ planStore.state.pendingDraft.confidence === 'needs_input' ? '需补充' : '可采用' }}</span>
      </div>
      <p>{{ planStore.state.pendingDraft.userGoal }}</p>
      <ul>
        <li v-for="todo in planStore.state.pendingDraft.todos" :key="todo.id">{{ todo.title }}</li>
      </ul>
      <div class="plan-actions compact-actions">
        <button class="secondary-action" @click="planStore.rejectDraft()">拒绝草稿</button>
        <button class="primary-action" @click="adoptDraft">采用草稿</button>
      </div>
    </div>

    <div v-if="activePlan" class="plan-card active-plan-card">
      <div class="plan-card-title">
        <strong>{{ activePlan.title }}</strong>
        <span>{{ activePlan.status }}</span>
      </div>
      <p>{{ activePlan.userGoal }}</p>
      <div class="todo-list">
        <label v-for="todo in activePlan.todos" :key="todo.id" class="todo-row" :class="`status-${todo.status}`">
          <input type="radio" name="active-plan-todo" :checked="activePlan.activeTodoId === todo.id" @change="planStore.setActiveTodo(todo.id)" />
          <span class="todo-main">
            <strong>{{ todo.title }}</strong>
            <small>{{ todo.detail || '无补充说明' }}</small>
          </span>
          <select :value="todo.status" @change="planStore.setTodoStatus(todo.id, ($event.target as HTMLSelectElement).value as TodoStatus)">
            <option v-for="(label, status) in statusLabels" :key="status" :value="status">{{ label }}</option>
          </select>
        </label>
      </div>
      <div v-if="activePlan.blockers.length" class="blocker-box">
        <strong>阻塞</strong>
        <span>{{ activePlan.blockers.join('；') }}</span>
      </div>
      <div class="plan-actions compact-actions">
        <button class="secondary-action" @click="planStore.pausePlan()">暂停</button>
        <button v-if="activePlan.status === 'ready_to_complete'" class="primary-action" @click="completePlan">确认完成计划</button>
      </div>
    </div>

    <div v-else-if="planStore.state.activePlanId && planStore.state.plans[planStore.state.activePlanId]" class="plan-card">
      <div class="plan-card-title">
        <strong>{{ planStore.state.plans[planStore.state.activePlanId].title }}</strong>
        <span>{{ planStore.state.plans[planStore.state.activePlanId].status }}</span>
      </div>
      <button class="secondary-action compact" @click="planStore.resumePlan()">恢复计划</button>
    </div>

    <div v-if="planStore.state.pendingUpdate" class="plan-card pending">
      <div class="plan-card-title">
        <strong>AI 更新建议</strong>
        <span>{{ planStore.state.pendingUpdate.statusSuggestion }}</span>
      </div>
      <p>{{ planStore.state.pendingUpdate.summary }}</p>
      <ul>
        <li v-for="(op, index) in planStore.state.pendingUpdate.ops" :key="index">{{ op.op }}</li>
      </ul>
      <div class="plan-actions compact-actions">
        <button class="secondary-action" @click="planStore.rejectUpdate()">拒绝更新</button>
        <button class="primary-action" @click="applyUpdate">应用更新</button>
      </div>
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
.todo-main small,
.plan-empty {
  margin: 0;
  color: var(--ide-dim-2);
  font-size: 12px;
  line-height: 1.6;
}

.plan-card {
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

.plan-card ul {
  margin: 0;
  padding-left: 18px;
  color: var(--ide-dim-2);
  font-size: 12px;
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

.todo-row select {
  max-width: 78px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg2);
  color: var(--ide-text);
  font-size: 12px;
}

.blocker-box {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-radius: 10px;
  background: var(--ide-warning-soft);
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
