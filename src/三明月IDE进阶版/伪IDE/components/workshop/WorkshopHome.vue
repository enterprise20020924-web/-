<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import ChatPanel from '../chat/ChatPanel.vue';
import ActivityPanel from '../activity/ActivityPanel.vue';
import BabyWizard from './BabyWizard.vue';
import BabyAssistantPanel from './BabyAssistantPanel.vue';
import PlanModePanel from './PlanModePanel.vue';
import { useWorkshopStore, type TaskDefinition, type WorkshopMode } from '../../stores/workshop';
import { usePresetStore } from '../../stores/preset';
import { useChatStore } from '../../stores/chat';
import { useActivityStore } from '../../stores/activity';
import { applyWorkshopPlan, dryrunWorkshopPlan } from '../../utils/workshop-executor';
import { getBabyFieldGuide } from '../../utils/baby-assistant';

const props = defineProps<{
  currentCharName?: string | null;
  streamingContent?: string;
  isMobile?: boolean;
}>();

const emit = defineEmits<{
  openExpert: [];
  sendStart: [];
  sendFailed: [];
}>();

const workshopStore = useWorkshopStore();
const presetStore = usePresetStore();
const chatStore = useChatStore();
const activityStore = useActivityStore();

const modeOrder: WorkshopMode[] = ['baby', 'standard', 'pro'];
const isBabyMode = computed(() => workshopStore.mode === 'baby');
const showTargetInput = computed(() => !isBabyMode.value);

const targetGuide = getBabyFieldGuide('target.worldbook');
const notesGuide = getBabyFieldGuide('notes.freeform');

const babyTargetIsCharacter = computed(() => isBabyMode.value && workshopStore.selectedTask.category === '前端');
const babyTargetFieldId = computed(() => (babyTargetIsCharacter.value ? 'target.character' : 'target.worldbook'));
const targetInputLabel = computed(() => {
  if (!isBabyMode.value) return '目标角色或世界书';
  return babyTargetIsCharacter.value ? '目标角色名' : '目标世界书';
});
const targetInputPlaceholder = computed(() =>
  isBabyMode.value
    ? babyTargetIsCharacter.value
      ? getBabyFieldGuide('target.character').placeholder
      : targetGuide.placeholder
    : props.currentCharName || '例如：秋明月 / 秋明月世界书',
);
const notesInputLabel = computed(() => (isBabyMode.value ? '临时素材' : '用户补充素材'));
const notesInputPlaceholder = computed(() =>
  isBabyMode.value
    ? notesGuide.placeholder
    : '把用户手写的人设、世界观、变量需求或参考路径放在这里。调色盘类内容会保留原味，不让 AI 自查改写。',
);

const modeTone = computed(() => {
  switch (workshopStore.mode) {
    case 'baby':
      return '稳稳喂到嘴边';
    case 'standard':
      return '协作但有边界';
    case 'pro':
      return '明确指挥工具';
  }
});

const categoryCounts = computed(() => {
  return workshopStore.availableTasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.category] = (acc[task.category] ?? 0) + 1;
    return acc;
  }, {});
});

const writeRiskLabel = computed(() => {
  switch (workshopStore.selectedTask.category) {
    case 'MVU':
    case 'EJS':
    case '前端':
      return '代码类：必须通过模板和检查';
    case '世界书':
      return '配置类：必须 dryrun 后确认';
    default:
      return '文字类：保留作者主权';
  }
});

const activeArtifactId = ref('');
const activeArtifact = computed(
  () =>
    workshopStore.generatedArtifacts.find(artifact => artifact.id === activeArtifactId.value) ??
    workshopStore.generatedArtifacts[0] ??
    null,
);
const babyTaskIntros: Record<string, string> = {
  'character.base': '填写姓名、年龄、身份、关系和外貌这些安全基础信息。',
  'worldview.write': '先和秋青子聊清楚世界观，再把最终整理稿贴回工作台。',
  'character.palette': '贴上你手写的性格核心，秋青子只帮你整理格式。',
  'character.wardrobe_prompt': '写角色常穿什么、喜欢什么风格、讨厌什么风格。',
  'mvu.schema': '填写开局状态和变化要求，固定格式由前端自动补齐。',
  'ejs.stage_palette': '让不同阶段自动使用不同的手写人设。',
  'frontend.mvu_status_bar': '把已做好的 MVU 变量显示成聊天里的状态栏。',
  'frontend.beautify': '把正文或资料变成好看的小页面。',
};
const displayedTaskSummary = computed(() =>
  isBabyMode.value
    ? workshopStore.selectedTask.babySummary ?? babyTaskIntros[workshopStore.selectedTask.id] ?? workshopStore.selectedTask.summary
    : workshopStore.selectedTask.summary,
);
const displayedFirstAction = computed(() =>
  isBabyMode.value
    ? workshopStore.selectedTask.babyFirstAction ?? workshopStore.selectedTask.firstAction
    : workshopStore.selectedTask.firstAction,
);
const displayedOutputs = computed(() =>
  isBabyMode.value ? workshopStore.selectedTask.babyOutputs ?? workshopStore.selectedTask.outputs : workshopStore.selectedTask.outputs,
);
const babyHasGeneratedOutput = computed(() => isBabyMode.value && workshopStore.generatedArtifacts.length > 0);
const babyPreviewArtifact = computed(() =>
  isBabyMode.value
    ? workshopStore.generatedArtifacts.find(artifact => artifact.riskLevel === 'code' && artifact.content.includes('<!DOCTYPE html>')) ?? null
    : null,
);
const babyPreviewSrcdoc = computed(() => {
  if (!babyPreviewArtifact.value) return '';
  const raw = babyPreviewArtifact.value.content;
  const body = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/)?.[1] ?? raw;
  const scriptClose = '</' + 'script>';
  const mock = [
    '<script>',
    'window.getCurrentMessageId = function() { return 0; };',
    'window.getChatMessages = function() { return [{ message: "<story>这里是预览用的正文第一段。\\\\n\\\\n这里是第二段，用来检查排版会不会拥挤。</story>\\\\n<status_current_variables>好感度: 42\\\\n心情: 安静\\\\n阶段: 熟悉</status_current_variables>" }]; };',
    'window.$ = function(fn) { if (typeof fn === "function") { if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", fn); } else { fn(); } } };',
    scriptClose,
  ].join('');
  return body.replace('</head>', `${mock}</head>`);
});
const babyPlanTitle = computed(() => {
  if (babyHasGeneratedOutput.value) return '先检查，再写入';
  if (workshopStore.selectedTask.id === 'worldview.write') return '先聊天，再整理';
  return '先填表，再生成';
});
const babyPlanCopy = computed(() => {
  if (babyHasGeneratedOutput.value) {
    return '我已经把内容准备好了。先点检查，通过后再写入酒馆；路径和代码细节会由前端自己处理。';
  }
  if (workshopStore.selectedTask.id === 'worldview.write') {
    return '世界观可以先聊出来。右边问秋青子，聊到满意后把最终稿放回工作台整理。';
  }
  return '先按左侧任务和中间表单填写。遇到不会写的地方，直接问右边的秋青子。';
});

watch(
  () => workshopStore.generatedArtifacts.map(artifact => artifact.id).join('|'),
  () => {
    activeArtifactId.value = workshopStore.generatedArtifacts[0]?.id ?? '';
  },
);

async function activateSelectedTaskPrompt(showToast = false) {
  const activatedNames = await presetStore.activateWriteMode(workshopStore.selectedTaskPresetRefs);
  if (!showToast) return;

  if (activatedNames.length) {
    toastr.success(`已切换预设条目：${activatedNames.map(name => name.replace(/^[^\p{L}\p{N}]+/u, '').trim() || name).join('、')}`);
  } else {
    toastr.warning('没有找到对应的任务条目，已保留核心预设不变');
  }
}

async function selectMode(mode: WorkshopMode) {
  workshopStore.selectMode(mode);
  await activateSelectedTaskPrompt();
}

async function selectTask(taskId: string) {
  workshopStore.selectTask(taskId);
  await activateSelectedTaskPrompt(true);
}

function selectArtifact(id: string) {
  activeArtifactId.value = id;
}

function taskIntro(task: TaskDefinition) {
  return isBabyMode.value ? task.babySummary ?? babyTaskIntros[task.id] ?? task.summary : task.summary;
}

function markBabyField(fieldId: string, value = '') {
  if (!isBabyMode.value) return;
  workshopStore.setBabyField(fieldId, value);
}

function clearGeneratedOutput() {
  workshopStore.clearGeneratedOutput();
  toastr.info('已清空前端生成预览');
}

async function dryrunGeneratedPlan() {
  if (!workshopStore.generatedWritePlan.length) {
    toastr.warning('请先在宝宝辅食表单生成产物');
    return;
  }
  workshopStore.setExecutionState('dryrun', []);
  const records = await dryrunWorkshopPlan(workshopStore.generatedArtifacts, workshopStore.generatedWritePlan);
  const blocked = records.filter(record => record.status === 'blocked').length;
  workshopStore.setExecutionState(blocked ? 'failed' : 'ready', records);
  if (blocked) {
    toastr.error(`预检发现 ${blocked} 个阻塞点`);
  } else {
    toastr.success('预检通过，可以确认执行');
  }
}

async function applyGeneratedPlan() {
  if (!workshopStore.canApplyGeneratedPlan) {
    toastr.warning('请先通过 dryrun 预检');
    return;
  }
  workshopStore.setExecutionState('applying', workshopStore.executionRecords);
  const records = await applyWorkshopPlan(workshopStore.generatedArtifacts, workshopStore.generatedWritePlan);
  const failed = records.some(record => record.status === 'failed' || record.status === 'blocked');
  workshopStore.setExecutionState(failed ? 'failed' : 'applied', records);
  if (failed) {
    toastr.error('执行中断，请查看失败项');
  } else {
    toastr.success('写入计划执行完成');
  }
}

async function preparePrompt() {
  await activateSelectedTaskPrompt(true);
  chatStore.inputText = workshopStore.buildTaskPrompt(props.currentCharName);
  toastr.success('任务指令已放入聊天框');
}

async function sendPrompt() {
  await activateSelectedTaskPrompt(true);
  chatStore.inputText = workshopStore.buildTaskPrompt(props.currentCharName);
  emit('sendStart');
  const ok = await chatStore.sendMessage();
  if (!ok) {
    emit('sendFailed');
  }
}

async function draftPlan() {
  if (workshopStore.mode !== 'standard') return;
  await activateSelectedTaskPrompt(true);
  chatStore.inputText = workshopStore.buildPlanDraftPrompt(props.currentCharName);
  emit('sendStart');
  const ok = await chatStore.sendMessage();
  if (!ok) {
    emit('sendFailed');
  } else {
    toastr.info('等待秋青子返回 PlanDraft');
  }
}
</script>

<template>
  <div class="workshop-root" :class="{ mobile: isMobile }">
    <section class="workshop-command">
      <div class="workshop-command-main">
        <div class="workshop-kicker">明月秋青</div>
        <h1>{{ isBabyMode ? '宝宝辅食写卡页' : '三模式写卡工作台' }}</h1>
        <p v-if="!isBabyMode">
          预设负责判断和陪写，前端负责硬约束，LTC/WTC 负责读写酒馆。
        </p>
        <p v-else>
          按格子慢慢填，不懂就问右边的秋青子；检查和写入交给工具处理。
        </p>
      </div>

      <div class="workshop-status">
        <div>
          <span>当前角色</span>
          <strong>{{ currentCharName || '未选择' }}</strong>
        </div>
        <div>
          <span>当前模式</span>
          <strong>{{ workshopStore.activeMode.shortTitle }}</strong>
        </div>
        <div>
          <span>工具记录</span>
          <strong>{{ activityStore.operations.length }}</strong>
        </div>
      </div>
    </section>

    <div class="workshop-grid">
      <aside class="workshop-left">
        <section class="workshop-section">
          <div class="workshop-section-title">模式</div>
          <button
            v-for="mode in modeOrder"
            :key="mode"
            class="mode-row"
            :class="{ active: workshopStore.mode === mode }"
            @click="selectMode(mode)"
          >
            <span class="mode-dot" />
            <span>
              <strong>{{ workshopStore.modes.find(item => item.id === mode)?.shortTitle }}</strong>
              <small>{{ workshopStore.modes.find(item => item.id === mode)?.summary }}</small>
            </span>
          </button>
        </section>

        <section class="workshop-section task-list-section">
          <div class="workshop-section-title">任务</div>
          <button
            v-for="task in workshopStore.availableTasks"
            :key="task.id"
            class="task-row"
            :class="{ active: workshopStore.selectedTask.id === task.id }"
            @click="selectTask(task.id)"
          >
            <span class="task-category">{{ task.category }}</span>
            <strong>{{ task.title }}</strong>
            <small>{{ taskIntro(task) }}</small>
          </button>
        </section>
      </aside>

      <main class="workshop-main">
        <section class="task-brief">
          <div class="task-brief-head">
            <div>
              <div class="workshop-kicker">{{ workshopStore.selectedTask.category }} / {{ modeTone }}</div>
              <h2>{{ workshopStore.selectedTask.title }}</h2>
            </div>
            <button class="expert-link" @click="emit('openExpert')">
              <SvgIcons name="sidebar" :size="15" />
              专家工作区
            </button>
          </div>

          <p class="task-summary">{{ displayedTaskSummary }}</p>

          <div class="task-inputs">
            <label v-if="showTargetInput">
              <span>{{ targetInputLabel }}</span>
              <input
                v-model="workshopStore.draft.targetName"
                type="text"
                :placeholder="targetInputPlaceholder"
                @focus="markBabyField(babyTargetFieldId, workshopStore.draft.targetName)"
                @input="markBabyField(babyTargetFieldId, workshopStore.draft.targetName)"
              >
            </label>
            <label>
              <span>{{ notesInputLabel }}</span>
              <textarea
                v-model="workshopStore.draft.userNotes"
                rows="5"
                :placeholder="notesInputPlaceholder"
                @focus="markBabyField('notes.freeform', workshopStore.draft.userNotes)"
                @input="markBabyField('notes.freeform', workshopStore.draft.userNotes)"
              />
            </label>
          </div>

          <BabyWizard v-if="workshopStore.mode === 'baby'" />

          <PlanModePanel
            v-if="workshopStore.mode === 'standard'"
            :task="workshopStore.selectedTask"
            :target-name="workshopStore.draft.targetName || currentCharName || ''"
            :user-goal="workshopStore.draft.userNotes"
            :can-draft="Boolean(workshopStore.draft.userNotes.trim() || workshopStore.draft.targetName.trim() || currentCharName)"
            @draft="draftPlan"
          />

          <section v-if="activeArtifact && !isBabyMode" class="artifact-panel">
            <div class="artifact-head">
              <div>
                <div class="mini-title">前端生成预览</div>
                <h3>{{ workshopStore.generatedSummary }}</h3>
              </div>
              <button class="secondary-action compact" @click="clearGeneratedOutput">
                <SvgIcons name="trash" :size="13" />
                清空
              </button>
            </div>

            <div class="artifact-tabs">
              <button
                v-for="artifact in workshopStore.generatedArtifacts"
                :key="artifact.id"
                :class="{ active: activeArtifact?.id === artifact.id }"
                @click="selectArtifact(artifact.id)"
              >
                <span>{{ artifact.contentType }}</span>
                {{ artifact.title }}
              </button>
            </div>

            <div class="artifact-meta">
              <span>{{ activeArtifact.targetPath }}</span>
              <strong>{{ activeArtifact.riskLevel }}</strong>
            </div>
            <pre>{{ activeArtifact.content }}</pre>
          </section>

          <section v-if="babyHasGeneratedOutput" class="baby-result-panel">
            <div class="mini-title">已经整理好</div>
            <ul>
              <li v-for="artifact in workshopStore.generatedArtifacts" :key="artifact.id">
                <SvgIcons name="check" :size="13" />
                <span>{{ artifact.title }}</span>
              </li>
            </ul>
          </section>

          <section v-if="babyPreviewSrcdoc" class="baby-preview-panel">
            <div class="mini-title">页面预览</div>
            <iframe title="前端预览" :srcdoc="babyPreviewSrcdoc" />
          </section>

          <div v-if="!isBabyMode" class="task-columns">
            <section>
              <div class="mini-title">第一步</div>
              <p>{{ displayedFirstAction }}</p>
            </section>
            <section>
              <div class="mini-title">产物</div>
              <ul>
                <li v-for="output in displayedOutputs" :key="output">{{ output }}</li>
              </ul>
            </section>
          </div>

          <div v-if="!isBabyMode" class="knowledge-band">
            <div class="mini-title">知识引用</div>
            <div class="ref-list">
              <span v-for="ref in workshopStore.selectedTask.knowledgeRefs" :key="ref">{{ ref }}</span>
            </div>
          </div>

          <div v-if="!isBabyMode" class="guardrail-band">
            <div class="mini-title">硬边界</div>
            <ul>
              <li v-for="item in workshopStore.selectedTask.guardrails" :key="item">{{ item }}</li>
            </ul>
          </div>
        </section>

        <section v-if="!isBabyMode" class="plan-panel">
          <div class="plan-head">
            <div>
              <div class="workshop-kicker">写入计划预览</div>
              <h3>{{ writeRiskLabel }}</h3>
            </div>
            <span>{{ workshopStore.selectedTask.writePlan.length }} 步</span>
          </div>

          <ol>
            <li v-for="step in workshopStore.selectedTask.writePlan" :key="step">{{ step }}</li>
          </ol>

          <div v-if="workshopStore.generatedWritePlan.length" class="generated-plan">
            <div class="mini-title">宝宝辅食写入动作</div>
            <ul>
              <li v-for="operation in workshopStore.generatedWritePlan" :key="operation.id">
                <strong>{{ operation.tool }}</strong>
                <span>{{ operation.targetPath }}</span>
                <small>{{ operation.summary }}</small>
              </li>
            </ul>
          </div>

          <div v-if="workshopStore.generatedWritePlan.length" class="execution-actions">
            <button
              class="secondary-action"
              :disabled="workshopStore.executionPhase === 'dryrun' || workshopStore.executionPhase === 'applying'"
              @click="dryrunGeneratedPlan"
            >
              <SvgIcons name="search" :size="14" />
              {{ workshopStore.executionPhase === 'dryrun' ? '预检中' : 'Dryrun 预检' }}
            </button>
            <button
              class="primary-action"
              :disabled="!workshopStore.canApplyGeneratedPlan || workshopStore.executionPhase === 'applying'"
              @click="applyGeneratedPlan"
            >
              <SvgIcons name="check" :size="14" />
              {{ workshopStore.executionPhase === 'applying' ? '执行中' : '确认执行' }}
            </button>
          </div>

          <div v-if="workshopStore.executionRecords.length" class="execution-records">
            <div class="mini-title">执行检查</div>
            <ul>
              <li
                v-for="record in workshopStore.executionRecords"
                :key="record.id"
                :class="`status-${record.status}`"
              >
                <strong>{{ record.status }}</strong>
                <span>{{ record.title }}</span>
                <small>{{ record.targetPath || record.detail }}</small>
                <em v-if="record.targetPath">{{ record.detail }}</em>
              </li>
            </ul>
          </div>

          <div class="plan-actions">
            <button class="secondary-action" @click="preparePrompt">
              <SvgIcons name="edit" :size="14" />
              放入聊天框
            </button>
            <button class="primary-action" :disabled="chatStore.isSending" @click="sendPrompt">
              <SvgIcons name="send" :size="14" />
              {{ chatStore.isSending ? '发送中' : '发送给秋青子' }}
            </button>
          </div>
        </section>

        <section v-else class="plan-panel baby-plan-panel">
          <div class="plan-head">
            <div>
              <div class="workshop-kicker">下一步</div>
              <h3>{{ babyPlanTitle }}</h3>
            </div>
            <span>{{ babyHasGeneratedOutput ? `${workshopStore.generatedArtifacts.length} 项` : '待生成' }}</span>
          </div>

          <p class="baby-plan-copy">{{ babyPlanCopy }}</p>

          <ul v-if="babyHasGeneratedOutput" class="baby-ready-list">
            <li v-for="artifact in workshopStore.generatedArtifacts" :key="artifact.id">
              <SvgIcons name="check" :size="13" />
              <span>{{ artifact.title }}</span>
            </li>
          </ul>

          <div v-if="workshopStore.generatedWritePlan.length" class="execution-actions">
            <button
              class="secondary-action"
              :disabled="workshopStore.executionPhase === 'dryrun' || workshopStore.executionPhase === 'applying'"
              @click="dryrunGeneratedPlan"
            >
              <SvgIcons name="search" :size="14" />
              {{ workshopStore.executionPhase === 'dryrun' ? '检查中' : '先帮我检查' }}
            </button>
            <button
              class="primary-action"
              :disabled="!workshopStore.canApplyGeneratedPlan || workshopStore.executionPhase === 'applying'"
              @click="applyGeneratedPlan"
            >
              <SvgIcons name="check" :size="14" />
              {{ workshopStore.executionPhase === 'applying' ? '写入中' : '写入酒馆' }}
            </button>
          </div>

          <div v-if="workshopStore.executionRecords.length" class="execution-records baby-records">
            <div class="mini-title">检查结果</div>
            <ul>
              <li
                v-for="record in workshopStore.executionRecords"
                :key="record.id"
                :class="`status-${record.status}`"
              >
                <strong>{{ record.status }}</strong>
                <span>{{ record.title }}</span>
                <small>{{ record.status === 'blocked' || record.status === 'failed' ? '这一项需要先修一下' : '这一项可以继续' }}</small>
              </li>
            </ul>
          </div>

          <div class="plan-actions">
            <button class="secondary-action" @click="preparePrompt">
              <SvgIcons name="edit" :size="14" />
              放到聊天框
            </button>
            <button class="primary-action" :disabled="chatStore.isSending" @click="sendPrompt">
              <SvgIcons name="send" :size="14" />
              {{ chatStore.isSending ? '发送中' : '问秋青子下一步' }}
            </button>
          </div>
        </section>
      </main>

      <aside class="workshop-right" :class="{ 'baby-right': isBabyMode }">
        <BabyAssistantPanel
          v-if="isBabyMode"
          :current-char-name="currentCharName"
          @send-start="emit('sendStart')"
          @send-failed="emit('sendFailed')"
        />
        <div class="chat-wrap" :class="{ 'baby-chat-wrap': isBabyMode }">
          <ChatPanel
            :streaming-content="streamingContent"
            @send-start="emit('sendStart')"
            @send-failed="emit('sendFailed')"
          />
        </div>
        <div v-if="!isBabyMode" class="activity-wrap">
          <ActivityPanel />
        </div>
      </aside>
    </div>

    <section class="workshop-bottom">
      <div v-for="(count, category) in categoryCounts" :key="category">
        <span>{{ category }}</span>
        <strong>{{ count }}</strong>
      </div>
    </section>
  </div>
</template>

<style scoped>
.workshop-root {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  overflow: hidden;
  background: var(--ide-bg);
}

.workshop-command {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg2);
  flex-shrink: 0;
}

.workshop-command-main {
  flex: 1;
  min-width: 0;
}

.workshop-kicker,
.mini-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ide-dim-3);
  text-transform: uppercase;
}

.workshop-command h1,
.task-brief h2,
.plan-head h3 {
  margin: 3px 0 0;
  font-size: 20px;
  line-height: 1.2;
  color: var(--ide-text);
}

.workshop-command p,
.task-summary {
  margin: 7px 0 0;
  color: var(--ide-dim);
  line-height: 1.55;
}

.workshop-status {
  display: grid;
  grid-template-columns: repeat(3, minmax(90px, 1fr));
  gap: 8px;
  min-width: 340px;
}

.workshop-status div,
.workshop-section,
.task-brief,
.plan-panel,
.chat-wrap,
.activity-wrap,
.workshop-bottom div {
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg2);
}

.workshop-status div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  padding: 10px 12px;
}

.workshop-status span,
.workshop-bottom span {
  color: var(--ide-dim-3);
  font-size: 11px;
}

.workshop-status strong,
.workshop-bottom strong {
  color: var(--ide-text);
  font-size: 14px;
}

.workshop-grid {
  width: 100%;
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: clamp(210px, 12vw, 260px) minmax(620px, 1fr) clamp(360px, 24vw, 520px);
  gap: 14px;
}

.workshop-left,
.workshop-main,
.workshop-right {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workshop-section {
  min-height: 0;
  padding: 10px;
  overflow: hidden;
}

.task-list-section {
  flex: 1;
  overflow-y: auto;
}

.workshop-section-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--ide-dim-2);
}

.mode-row,
.task-row {
  width: 100%;
  display: flex;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ide-dim);
  cursor: pointer;
  text-align: left;
}

.mode-row {
  gap: 10px;
  align-items: flex-start;
  padding: 10px;
  border-radius: 8px;
}

.mode-row:hover,
.task-row:hover {
  background: var(--ide-hover);
  color: var(--ide-text);
}

.mode-row.active,
.task-row.active {
  border-color: var(--ide-accent-border);
  background: var(--ide-accent-soft);
  color: var(--ide-text);
}

.mode-dot {
  width: 9px;
  height: 9px;
  margin-top: 5px;
  border-radius: 999px;
  background: var(--ide-success-text);
  flex-shrink: 0;
}

.mode-row span:last-child,
.task-row {
  min-width: 0;
}

.mode-row strong,
.task-row strong {
  display: block;
  font-size: 13px;
  color: inherit;
}

.mode-row small,
.task-row small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ide-dim-2);
}

.task-row {
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border-radius: 8px;
}

.task-category {
  width: fit-content;
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--ide-info-text);
  background: var(--ide-info-soft);
  font-size: 11px;
  font-weight: 700;
}

.task-brief {
  min-height: 0;
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.task-brief-head,
.plan-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.expert-link,
.secondary-action,
.primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.expert-link,
.secondary-action {
  border: 1px solid var(--ide-border);
  background: var(--ide-surface);
  color: var(--ide-dim);
}

.expert-link:hover,
.secondary-action:hover {
  background: var(--ide-hover);
  color: var(--ide-text);
}

.expert-link {
  padding: 0 10px;
  flex-shrink: 0;
}

.task-inputs {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 16px;
}

.task-inputs label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: var(--ide-dim-2);
  font-size: 12px;
  font-weight: 700;
}

.task-inputs input,
.task-inputs textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--ide-input-border);
  border-radius: 7px;
  background: var(--ide-input-bg);
  color: var(--ide-text);
  padding: 10px 11px;
  font: inherit;
  line-height: 1.5;
  outline: none;
}

.task-inputs textarea {
  min-height: 116px;
  resize: vertical;
}

.task-inputs input:focus,
.task-inputs textarea:focus {
  border-color: var(--ide-accent-border-strong);
}

.artifact-panel {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--ide-accent-border);
  border-radius: 8px;
  background: var(--ide-accent-soft);
}

.artifact-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.artifact-head h3 {
  margin: 3px 0 0;
  color: var(--ide-text);
  font-size: 15px;
}

.secondary-action.compact {
  min-height: 28px;
  padding: 0 8px;
  font-size: 12px;
}

.artifact-tabs {
  display: flex;
  gap: 7px;
  margin-top: 10px;
  overflow-x: auto;
}

.artifact-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 9px;
  border: 1px solid var(--ide-border);
  border-radius: 6px;
  background: var(--ide-bg2);
  color: var(--ide-dim);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.artifact-tabs button.active {
  border-color: var(--ide-success-border-strong);
  color: var(--ide-text);
  background: var(--ide-success-soft);
}

.artifact-tabs span {
  color: var(--ide-info-text);
  text-transform: uppercase;
}

.artifact-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  color: var(--ide-dim-2);
  font-size: 12px;
}

.artifact-meta span {
  overflow-wrap: anywhere;
}

.artifact-meta strong {
  flex-shrink: 0;
  color: var(--ide-success-text);
}

.artifact-panel pre {
  max-height: 300px;
  margin: 9px 0 0;
  padding: 11px;
  overflow: auto;
  border: 1px solid var(--ide-border);
  border-radius: 7px;
  background: var(--ide-input-bg);
  color: var(--ide-text);
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.baby-result-panel {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--ide-success-border);
  border-radius: 8px;
  background: var(--ide-success-soft);
}

.baby-result-panel ul,
.baby-ready-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 9px 0 0;
  padding: 0;
  list-style: none;
}

.baby-result-panel li,
.baby-ready-list li {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: var(--ide-dim);
  font-size: 12px;
  line-height: 1.4;
}

.baby-result-panel svg,
.baby-ready-list svg {
  flex-shrink: 0;
  color: var(--ide-success-text);
}

.baby-preview-panel {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg2);
}

.baby-preview-panel iframe {
  display: block;
  width: 100%;
  min-height: 210px;
  margin-top: 9px;
  border: 1px solid var(--ide-border-soft);
  border-radius: 8px;
  background: #fff;
}

.task-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  margin-top: 14px;
}

.task-columns section,
.knowledge-band,
.guardrail-band {
  padding: 12px;
  border: 1px solid var(--ide-border-soft);
  border-radius: 8px;
  background: var(--ide-surface);
}

.task-columns p {
  margin: 6px 0 0;
  color: var(--ide-dim);
  line-height: 1.55;
}

.task-columns ul,
.guardrail-band ul,
.plan-panel ol {
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--ide-dim);
  line-height: 1.55;
}

.knowledge-band,
.guardrail-band {
  margin-top: 12px;
}

.ref-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 9px;
}

.ref-list span {
  max-width: 100%;
  padding: 5px 7px;
  border-radius: 5px;
  background: var(--ide-tag-bg);
  color: var(--ide-tag-text);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.plan-panel {
  padding: 14px;
  flex-shrink: 0;
}

.baby-plan-panel {
  border-color: var(--ide-success-border);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--ide-success-text) 7%, transparent), transparent 80%),
    var(--ide-bg2);
}

.baby-plan-copy {
  margin: 10px 0 0;
  color: var(--ide-dim);
  font-size: 13px;
  line-height: 1.55;
}

.plan-head h3 {
  font-size: 15px;
}

.plan-head > span {
  padding: 3px 8px;
  border-radius: 5px;
  color: var(--ide-success-text);
  background: var(--ide-success-soft);
  font-size: 12px;
  font-weight: 700;
}

.generated-plan {
  margin-top: 11px;
  padding: 10px;
  border: 1px solid var(--ide-border-soft);
  border-radius: 8px;
  background: var(--ide-surface);
}

.generated-plan ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.generated-plan li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 4px 8px;
  color: var(--ide-dim);
  font-size: 12px;
}

.generated-plan strong {
  color: var(--ide-info-text);
}

.generated-plan span {
  overflow-wrap: anywhere;
}

.generated-plan small {
  grid-column: 2;
  color: var(--ide-dim-2);
  line-height: 1.4;
}

.execution-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.execution-records {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid var(--ide-border-soft);
  border-radius: 8px;
  background: var(--ide-bg);
}

.execution-records ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.execution-records li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 3px 8px;
  padding: 7px 8px;
  border: 1px solid var(--ide-border-soft);
  border-radius: 7px;
  color: var(--ide-dim);
  background: var(--ide-surface);
  font-size: 12px;
}

.execution-records strong {
  color: var(--ide-info-text);
  text-transform: uppercase;
}

.execution-records span,
.execution-records small,
.execution-records em {
  overflow-wrap: anywhere;
}

.execution-records small,
.execution-records em {
  grid-column: 2;
  color: var(--ide-dim-2);
  font-style: normal;
  line-height: 1.4;
}

.baby-records small {
  grid-column: 2;
}

.execution-records .status-ok strong,
.execution-records .status-applied strong {
  color: var(--ide-success-text);
}

.execution-records .status-warning strong {
  color: var(--ide-warning-text);
}

.execution-records .status-blocked strong,
.execution-records .status-failed strong {
  color: var(--ide-danger-text);
}

.execution-records .status-skipped strong {
  color: var(--ide-dim-3);
}

.plan-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.primary-action {
  border: 1px solid var(--ide-success-border);
  background: var(--ide-success-soft);
  color: var(--ide-success-text);
}

.primary-action:hover:not(:disabled) {
  background: var(--ide-success-soft-strong);
}

.primary-action:disabled {
  opacity: 0.6;
  cursor: wait;
}

.workshop-right {
  min-width: 0;
}

.workshop-right.baby-right {
  gap: 10px;
}

.chat-wrap {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.baby-chat-wrap {
  min-height: 260px;
}

.activity-wrap {
  height: 180px;
  overflow: hidden;
}

.workshop-bottom {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  overflow-x: auto;
}

.workshop-bottom div {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 74px;
  padding: 7px 10px;
}

.workshop-root.mobile {
  overflow-y: auto;
}

@media (min-width: 1280px) {
  .task-inputs {
    grid-template-columns: minmax(220px, 0.4fr) minmax(0, 1fr);
    align-items: start;
  }

  .task-inputs textarea {
    min-height: 74px;
  }
}

@media (min-width: 1600px) {
  .workshop-root {
    padding: 16px 18px;
  }

  .workshop-grid {
    grid-template-columns: clamp(220px, 11vw, 250px) minmax(760px, 1fr) clamp(420px, 25vw, 560px);
  }

  .workshop-command {
    padding-inline: 18px;
  }
}

@media (max-width: 1279px) {
  .workshop-grid {
    grid-template-columns: 220px minmax(0, 1fr) 360px;
  }
}

.mobile .workshop-command,
.mobile .task-brief-head,
.mobile .plan-head,
.mobile .artifact-head {
  flex-direction: column;
}

.mobile .workshop-status,
.mobile .workshop-grid,
.mobile .task-columns,
.mobile .plan-actions,
.mobile .execution-actions {
  grid-template-columns: 1fr;
}

.mobile .workshop-status {
  min-width: 0;
}

.mobile .workshop-grid {
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.mobile .workshop-left,
.mobile .workshop-main,
.mobile .workshop-right,
.mobile .task-brief {
  overflow: visible;
}

.mobile .chat-wrap {
  min-height: 520px;
}

.mobile .baby-chat-wrap {
  min-height: 420px;
}
</style>
