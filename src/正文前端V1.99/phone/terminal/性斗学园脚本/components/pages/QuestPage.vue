<template>
  <div class="quest-page">
    <SkylinkModuleHeader
      code="05"
      label="MISSION CONTROL"
      title="行动任务台"
      description="每一个目标，都是新的可能。"
      icon="fas fa-crosshairs"
    />
    <!-- 主线任务 -->
    <div class="quest-section" v-if="mainQuest && mainQuest.名称">
      <div class="section-header">
        <i class="fas fa-star"></i>
        <span>主线任务</span>
      </div>
      <div class="quest-card main">
        <div class="quest-badge">MAIN</div>
        <div class="quest-content">
          <div class="quest-title">{{ mainQuest.名称 }}</div>
          <div class="quest-desc">{{ mainQuest.描述 || '暂无描述' }}</div>

          <div class="quest-meta">
            <div class="meta-item status" :class="getStatusClass(mainQuest.状态)">
              <i class="fas" :class="getStatusIcon(mainQuest.状态)"></i>
              {{ mainQuest.状态 || '进行中' }}
            </div>
            <div class="meta-item deadline" v-if="mainQuest.期限 && mainQuest.期限 !== '无'">
              <i class="fas fa-clock"></i>
              {{ mainQuest.期限 }}
            </div>
          </div>

          <div class="quest-reward" v-if="formatTaskReward(mainQuest)">
            <i class="fas fa-gift"></i>
            <span>{{ formatTaskReward(mainQuest) }}</span>
          </div>

          <div class="quest-objectives" v-if="mainQuest.目标 && Object.keys(mainQuest.目标).length > 0">
            <div class="objectives-title">任务目标</div>
            <div class="objective-list">
              <div class="objective-item" v-for="(value, key) in mainQuest.目标" :key="key">
                <i class="fas" :class="getObjectiveIcon(value)"></i>
                <span class="obj-key">{{ key }}</span>
                <span class="obj-value">{{ formatObjectiveValue(value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 支线任务 -->
    <div v-for="section in questSections" :key="section.id" class="quest-section">
      <div class="section-header">
        <i class="fas fa-list-check"></i>
        <span>{{ section.label }}</span>
        <span class="quest-count">{{ section.quests.length }}</span>
      </div>
      <div class="quest-list">
        <div
          class="quest-card side"
          v-for="quest in section.quests"
          :key="quest.key"
          :class="{ completed: quest.状态 === '已完成' }"
        >
          <div class="quest-type-badge" :class="getTypeBadgeClass(quest.类型)">
            {{ quest.类型 || '日常' }}
          </div>
          <div class="quest-content">
            <div class="quest-title">{{ quest.name }}</div>
            <div class="quest-desc">{{ quest.描述 || '暂无描述' }}</div>

            <div class="quest-footer">
              <div class="meta-item status" :class="getStatusClass(quest.状态)">
                <i class="fas" :class="getStatusIcon(quest.状态)"></i>
                {{ quest.状态 || '进行中' }}
              </div>
              <div class="quest-reward small" v-if="formatTaskReward(quest)">
                <i class="fas fa-gift"></i>
                {{ formatTaskReward(quest) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 已完成任务记录 -->
    <div class="quest-section" v-if="completedQuests.length > 0">
      <div class="section-header collapsible" @click="showCompleted = !showCompleted">
        <i class="fas fa-check-double"></i>
        <span>已完成</span>
        <span class="quest-count">{{ completedQuests.length }}</span>
        <i class="fas fa-chevron-down toggle-icon" :class="{ rotated: showCompleted }"></i>
      </div>
      <div class="completed-list" v-if="showCompleted">
        <div class="completed-item" v-for="(quest, index) in completedQuests" :key="index">
          <i class="fas fa-check-circle"></i>
          <span>{{ quest }}</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="!hasQuests">
      <div class="empty-icon">
        <i class="fas fa-scroll"></i>
      </div>
      <p class="empty-title">暂无任务</p>
      <p class="empty-desc">探索学园获取新任务</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkylinkModuleHeader from '../../../shared/SkylinkModuleHeader.vue';
import { computed, ref } from 'vue';
import { collectMoneyTasks, formatTaskReward } from '../../../../../money/tasks';

const props = defineProps<{
  characterData: any;
}>();

const showCompleted = ref(false);

const tasks = computed(() => collectMoneyTasks(props.characterData));
const mainQuest = computed(
  () => tasks.value.find(task => task.group === 'main' && task.kind === 'fixedTasks')?.value ?? {},
);
const questSections = computed(() =>
  [
    {
      id: 'free',
      label: '自由任务',
      quests: tasks.value
        .filter(task => task.kind === 'freeTasks')
        .map(task => ({ ...task.value, name: task.name, key: task.key })),
    },
    {
      id: 'side',
      label: '支线任务',
      quests: tasks.value
        .filter(task => task.kind === 'fixedTasks' && task.group !== 'main')
        .map(task => ({ ...task.value, name: task.name, key: task.key })),
    },
  ].filter(section => section.quests.length),
);

const completedQuests = computed(() => {
  return props.characterData.任务系统?.已完成记录 || [];
});

const hasQuests = computed(() => {
  return (mainQuest.value && mainQuest.value.名称) || questSections.value.length > 0;
});

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    进行中: 'active',
    已完成: 'completed',
    已失败: 'failed',
    已放弃: 'abandoned',
  };
  return map[status] || 'active';
}

function getStatusIcon(status: string): string {
  const map: Record<string, string> = {
    进行中: 'fa-spinner fa-pulse',
    已完成: 'fa-check',
    已失败: 'fa-times',
    已放弃: 'fa-ban',
  };
  return map[status] || 'fa-spinner fa-pulse';
}

function getTypeBadgeClass(type: string): string {
  const map: Record<string, string> = {
    日常: 'type-daily',
    特殊: 'type-special',
    限时: 'type-timed',
    隐藏: 'type-hidden',
  };
  return map[type] || 'type-daily';
}

function getObjectiveIcon(value: any): string {
  if (typeof value === 'boolean') {
    return value ? 'fa-check-circle completed' : 'fa-circle pending';
  }
  if (typeof value === 'string' && value.includes('/')) {
    const [current, total] = value.split('/').map(Number);
    return current >= total ? 'fa-check-circle completed' : 'fa-circle pending';
  }
  return 'fa-circle pending';
}

function formatObjectiveValue(value: any): string {
  if (typeof value === 'boolean') {
    return value ? '✓' : '○';
  }
  return String(value);
}
</script>

<style scoped lang="scss">
.quest-page {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}

.quest-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sk-ink);
  margin-bottom: 12px;

  i:first-child {
    color: var(--sk-violet);
  }

  .quest-count {
    margin-left: auto;
    padding: 2px 8px;
    background: var(--sk-soft);
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    color: var(--sk-muted);
  }

  &.collapsible {
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: var(--sk-ink);
    }
  }

  .toggle-icon {
    transition: transform 0.2s;
    color: var(--sk-muted);

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.quest-card {
  position: relative;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 12px;
  overflow: hidden;

  &.main {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.1));
    border-color: rgba(102, 126, 234, 0.3);
  }

  &.side {
    background: var(--sk-soft);

    &.completed {
      opacity: 0.6;
    }
  }
}

.quest-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 3px 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 6px;
  font-size: 9px;
  font-weight: 700;
  color: var(--sk-ink);
  letter-spacing: 1px;
}

.quest-type-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;

  &.type-daily {
    background: rgba(96, 165, 250, 0.2);
    color: var(--sk-blue);
  }

  &.type-special {
    background: rgba(167, 139, 250, 0.2);
    color: var(--sk-violet);
  }

  &.type-timed {
    background: rgba(251, 191, 36, 0.2);
    color: var(--sk-warning);
  }

  &.type-hidden {
    background: rgba(248, 113, 113, 0.2);
    color: var(--sk-danger);
  }
}

.quest-content {
  padding-right: 60px;
}

.quest-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--sk-ink);
  margin-bottom: 8px;
}

.quest-desc {
  font-size: 12px;
  color: var(--sk-muted);
  line-height: 1.5;
  margin-bottom: 12px;
}

.quest-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;

  &.status {
    &.active {
      background: rgba(52, 211, 153, 0.15);
      color: var(--sk-success);
    }

    &.completed {
      background: rgba(96, 165, 250, 0.15);
      color: var(--sk-blue);
    }

    &.failed {
      background: rgba(248, 113, 113, 0.15);
      color: var(--sk-danger);
    }

    &.abandoned {
      background: rgba(156, 163, 175, 0.15);
      color: var(--sk-muted);
    }
  }

  &.deadline {
    background: rgba(251, 191, 36, 0.15);
    color: var(--sk-warning);
  }
}

.quest-reward {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 10px;
  font-size: 12px;
  color: var(--sk-warning);
  margin-bottom: 12px;

  i {
    color: var(--sk-warning);
  }

  &.small {
    padding: 4px 10px;
    font-size: 11px;
    background: transparent;
    margin-bottom: 0;
  }
}

.quest-objectives {
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.objectives-title {
  font-size: 11px;
  color: var(--sk-muted);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.objective-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.objective-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;

  i {
    font-size: 12px;

    &.completed {
      color: var(--sk-success);
    }

    &.pending {
      color: var(--sk-muted);
    }
  }

  .obj-key {
    color: var(--sk-ink);
  }

  .obj-value {
    margin-left: auto;
    color: var(--sk-muted);
    font-family: 'JetBrains Mono', monospace;
  }
}

.quest-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quest-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.completed-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.completed-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--sk-soft);
  border-radius: 10px;
  font-size: 12px;
  color: var(--sk-muted);

  i {
    color: var(--sk-success);
    font-size: 14px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  .empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--sk-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;

    i {
      font-size: 32px;
      color: var(--sk-muted);
    }
  }

  .empty-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--sk-muted);
    margin-bottom: 6px;
  }

  .empty-desc {
    font-size: 13px;
    color: var(--sk-muted);
  }
}
</style>
