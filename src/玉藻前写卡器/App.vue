<template>
  <main class="writer-shell">
    <header class="writer-header">
      <div>
        <p class="eyebrow">秋青子写卡预设适配器</p>
        <h1>一键角色卡写卡器</h1>
      </div>
      <button class="icon-button" title="关闭" @click="props.onExit">×</button>
    </header>

    <section v-if="step === 'setup'" class="setup-step">
      <div class="setup-card">
        <label class="field">
          <span>当前角色</span>
          <input v-model="currentCharacter" disabled />
        </label>

        <label class="field">
          <span>世界书名称</span>
          <input v-model="worldbookName" placeholder="不要带 emoji" />
        </label>

        <label class="field">
          <span>角色卡面</span>
          <input type="file" accept="image/*" @change="onAvatarChange" />
        </label>

        <div class="summary">
          <strong>第一步</strong>
          <span>确认世界书名称并绑定到当前角色，下一页填写世界观和角色模块。</span>
        </div>

        <button class="primary" :disabled="isBusy || !canEnterEditor" @click="enterEditor">
          {{ isBusy ? '绑定中...' : '下一步' }}
        </button>
      </div>
    </section>

    <section v-else-if="workStarted" class="work-screen">
      <div class="work-visual">
        <img :src="workingImageSrc" alt="" />
      </div>

      <div class="work-board">
        <div class="work-head">
          <div>
            <h2>生成进度</h2>
            <p>{{ currentWorkText }}</p>
          </div>
          <strong>{{ completedStageCount }}/{{ workStages.length }}</strong>
        </div>

        <div class="progress-track">
          <span :style="{ width: `${workPercent}%` }" />
        </div>

        <ol class="work-steps">
          <li v-for="stageItem in workStages" :key="stageItem.key" :class="['work-step', stageItem.status]">
            <span class="stage-dot">{{ stageMark(stageItem.status) }}</span>
            <div>
              <strong>{{ stageItem.title }}</strong>
              <p>{{ stageItem.error || stageItem.detail }}</p>
              <button
                v-if="canRerollStage(stageItem)"
                class="mini-action"
                :disabled="isBusy"
                @click="rerollStage(stageItem)"
              >
                重ROLL此阶段
              </button>
            </div>
          </li>
        </ol>

        <div class="work-actions">
          <button v-if="failedStageIndex !== null" class="primary" :disabled="isBusy" @click="retryFailedStage">
            重新开始此阶段
          </button>
          <button v-if="!isBusy" class="ghost" @click="returnEditor">返回编辑</button>
          <button v-if="!isBusy && failedStageIndex === null" class="ghost" @click="runWriter">重新生成全部</button>
        </div>

        <div v-if="previewText" class="preview work-preview">
          <strong>最近生成</strong>
          <pre>{{ previewText }}</pre>
        </div>
      </div>
    </section>

    <section v-else class="workspace">
      <aside class="setup-panel">
        <div class="summary">
          <strong>{{ worldbookName }}</strong>
          <span>{{ avatarFile ? `卡面：${avatarFile.name}` : '未选择卡面图片' }}</span>
          <span>将写入世界观、角色速览、角色详细条目、MVU、EJS、局部正则、变量结构脚本。</span>
        </div>

        <button class="ghost wide" :disabled="isBusy" @click="step = 'setup'">返回设置</button>

        <button class="primary" :disabled="isBusy || !canRun" @click="runWriter">
          {{ isBusy ? '生成中...' : '一键生成并写入' }}
        </button>
      </aside>

      <section class="editor-panel">
        <div class="section-head">
          <h2>世界观</h2>
        </div>
        <textarea
          v-model="worldviewSeed"
          class="world-textarea"
          placeholder="写你的世界观想法。可以很粗糙，AI 会按原预设结构合理化补全。"
        />

        <div class="guide-box">
          <strong>写卡参考</strong>
          <a href="https://discord.com/channels/1134557553011998840/1488344282585628843" target="_blank" rel="noreferrer">
            写正确的卡，入门教程
          </a>
          <a href="https://discord.com/channels/1134557553011998840/1457071148885086331" target="_blank" rel="noreferrer">
            如何写活人设，调色盘与进阶教程
          </a>
        </div>

        <div class="section-head roles-head">
          <h2>角色</h2>
          <button class="secondary" :disabled="isBusy" @click="addRole">新增角色</button>
        </div>

        <article v-for="(role, index) in roles" :key="role.id" class="role-card">
          <div class="role-title">
            <strong>{{ role.label }}</strong>
            <button v-if="roles.length > 1" class="ghost" :disabled="isBusy" @click="removeRole(index)">删除</button>
          </div>
          <label class="field compact">
            <span>角色名（可空）</span>
            <input v-model="role.name" placeholder="留空则由 AI 命名" />
          </label>
          <textarea
            v-model="role.seed"
            class="role-textarea"
            placeholder="用大白话写就行：
基础信息：身份、关系、外貌、经历、能力、禁忌、你想保留的点。
性格调色盘：底色、主色调、性格点缀、矛盾感、会怎样对人。
阶段特点：初识期、熟悉期、亲近期分别有什么变化。
不用写成正式文案，AI 会按预设知识合理化补全。"
          />
          <div class="asset-grid">
            <label class="field compact">
              <span>状态栏头像 URL（可空）</span>
              <input v-model="role.statusAvatarUrl" placeholder="建议 1:1 方图，主体居中" />
            </label>
            <label class="field compact">
              <span>状态栏背景 URL（可空）</span>
              <input v-model="role.statusBackgroundUrl" placeholder="建议横版壁纸，主体别贴边" />
            </label>
          </div>
          <p class="asset-tip">头像建议 1:1；横版背景建议 16:9、21:9 或更宽，关键人物放中间安全区。</p>
        </article>
      </section>

      <aside class="result-panel">
        <div class="section-head">
          <h2>进度</h2>
          <button class="ghost" :disabled="isBusy" @click="logs = []">清空</button>
        </div>
        <div class="log-list">
          <p v-for="log in logs" :key="log.id" :class="['log', log.level]">{{ log.text }}</p>
          <p v-if="logs.length === 0" class="empty">等待开始</p>
        </div>

        <div v-if="previewText" class="preview">
          <strong>最近生成</strong>
          <pre>{{ previewText }}</pre>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import workingImage from './玉藻前打尻.webp?url';
import type { RoleDraft, RoleResult, WriterArtifacts, WriterLog, WorldviewResult } from './types';
import {
  buildArtifacts,
  buildFixedMvuEntries,
  buildRoleEntries,
  buildRoleOverviewEntries,
  buildWorldviewEntries,
} from './utils/artifacts';
import { updateCurrentAvatar, installMvuRuntimeScript, installMvuSchemaScript } from './utils/character';
import { generateRole, generateWorldview } from './utils/generation';
import { installMvuRegexes } from './utils/regex';
import { clearWriterEntries, ensureWorldbookBound, replaceWriterEntries, upsertWriterEntries } from './utils/worldbook';

const props = defineProps<{ onExit: () => void }>();

type WorkStatus = 'pending' | 'running' | 'done' | 'error';

interface WorkStage {
  key: string;
  title: string;
  detail: string;
  status: WorkStatus;
  error?: string;
}

interface PipelineState {
  targetWorldbook: string;
  worldviewSeed: string;
  activeRoles: RoleDraft[];
  isMultiRole: boolean;
  roleResults: RoleResult[];
  retryAvoidTerms: Record<string, string[]>;
  worldview?: WorldviewResult;
  artifacts?: WriterArtifacts;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createRole(index: number): RoleDraft {
  return {
    id: newId('role'),
    label: `角色${index + 1}`,
    name: '',
    seed: '',
    statusAvatarUrl: '',
    statusBackgroundUrl: '',
  };
}

const currentCharacter = ref(getCurrentCharacterName() ?? '未打开角色卡');
const worldbookName = ref(currentCharacter.value === '未打开角色卡' ? '一键角色卡世界书' : `${currentCharacter.value}世界书`);
const worldviewSeed = ref('');
const roles = reactive<RoleDraft[]>([createRole(0)]);
const avatarFile = ref<File | null>(null);
const logs = ref<WriterLog[]>([]);
const previewText = ref('');
const isBusy = ref(false);
const step = ref<'setup' | 'editor'>('setup');
const workStarted = ref(false);
const workStages = ref<WorkStage[]>([]);
const failedStageIndex = ref<number | null>(null);
const pipelineState = ref<PipelineState | null>(null);
const workingImageSrc = workingImage;

const canEnterEditor = computed(() => {
  return currentCharacter.value !== '未打开角色卡' && worldbookName.value.trim().length > 0;
});

const canRun = computed(() => {
  return (
    currentCharacter.value !== '未打开角色卡' &&
    worldbookName.value.trim().length > 0 &&
    worldviewSeed.value.trim().length > 0 &&
    roles.some(role => role.seed.trim().length > 0)
  );
});

const completedStageCount = computed(() => workStages.value.filter(item => item.status === 'done').length);

const workPercent = computed(() => {
  if (workStages.value.length === 0) return 0;
  return Math.round((completedStageCount.value / workStages.value.length) * 100);
});

const currentWorkText = computed(() => {
  const errorStage = workStages.value.find(item => item.status === 'error');
  if (errorStage) return `${errorStage.title}失败`;
  const runningStage = workStages.value.find(item => item.status === 'running');
  if (runningStage) return runningStage.title;
  if (workStages.value.length > 0 && completedStageCount.value === workStages.value.length) return '全部完成';
  return '等待开始';
});

function pushLog(level: WriterLog['level'], text: string) {
  logs.value.unshift({ id: newId('log'), level, text });
}

function addRole() {
  roles.push(createRole(roles.length));
}

function removeRole(index: number) {
  roles.splice(index, 1);
  roles.forEach((role, roleIndex) => {
    role.label = `角色${roleIndex + 1}`;
  });
}

function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement;
  avatarFile.value = input.files?.[0] ?? null;
}

function stageMark(status: WorkStatus): string {
  if (status === 'done') return '✓';
  if (status === 'running') return '…';
  if (status === 'error') return '!';
  return '';
}

function findStageIndex(stageKey: string): number {
  return workStages.value.findIndex(item => item.key === stageKey);
}

function canRerollStage(stageItem: WorkStage): boolean {
  return stageItem.status === 'done' && /^generate-(?:worldview|role-\d+)$/u.test(stageItem.key);
}

function buildWorkStages(activeRoles: RoleDraft[], hasAvatar: boolean): WorkStage[] {
  return [
    { key: 'bind-worldbook', title: '绑定世界书', detail: '确认当前角色主世界书', status: 'pending' },
    { key: 'clear-old', title: '清理旧条目', detail: '只清理本写卡器生成过的条目', status: 'pending' },
    { key: 'generate-worldview', title: '生成世界观', detail: '调用内置世界观知识', status: 'pending' },
    { key: 'write-worldview', title: '写入世界观', detail: '写入世界书并设置顺序', status: 'pending' },
    ...activeRoles.flatMap((role, index) => [
      { key: `generate-role-${index}`, title: `生成${role.label}`, detail: '调用调色盘浓缩知识扩写角色', status: 'pending' as WorkStatus },
      { key: `write-role-${index}`, title: `写入${role.label}`, detail: '写入角色速览、基础、调色盘、二次解释、EJS', status: 'pending' as WorkStatus },
    ]),
    { key: 'write-mvu', title: '写入 MVU 条目', detail: '初始变量、变量列表、更新规则、输出格式', status: 'pending' },
    { key: 'install-runtime', title: '安装 MVU 脚本', detail: '写入角色脚本库并启用', status: 'pending' },
    { key: 'install-schema', title: '安装变量结构', detail: '按角色数量生成 ZOD 结构脚本', status: 'pending' },
    { key: 'install-regex', title: '导入局部正则', detail: '导入外部正则和状态栏占位正则', status: 'pending' },
    ...(hasAvatar ? [{ key: 'write-avatar', title: '写入卡面', detail: '把用户图片写成角色卡面', status: 'pending' as WorkStatus }] : []),
  ];
}

function updateStage(index: number, status: WorkStatus, error?: string) {
  workStages.value[index] = {
    ...workStages.value[index],
    status,
    error,
  };
}

function clearStagesFrom(index: number) {
  workStages.value = workStages.value.map((item, itemIndex) => {
    if (itemIndex < index) return item;
    return { ...item, status: 'pending', error: undefined };
  });
}

function requirePipelineState(): PipelineState {
  if (!pipelineState.value) throw new Error('工作状态丢失，请重新生成全部');
  return pipelineState.value;
}

function requireWorldview(state: PipelineState): WorldviewResult {
  if (!state.worldview) throw new Error('世界观尚未生成，请从世界观阶段重新开始');
  return state.worldview;
}

function getCompletedRoles(state: PipelineState): RoleResult[] {
  return state.roleResults.filter(Boolean);
}

function extractAvoidTerms(message: string): string[] {
  const exactTerms = Array.from(message.matchAll(/（([^）]+)）/gu))
    .map(match => match[1]?.trim())
    .filter(Boolean);
  if (exactTerms.length > 0) return exactTerms;
  if (/工程词|占位内容|模板词|工程占位词/u.test(message)) {
    return ['模板', '提示词', '工程词', '占位符', 'placeholder'];
  }
  return [];
}

function rememberRetryAvoidTerms(state: PipelineState, stageKey: string, message: string) {
  const terms = extractAvoidTerms(message);
  if (terms.length === 0) return;
  state.retryAvoidTerms[stageKey] = Array.from(new Set([...(state.retryAvoidTerms[stageKey] ?? []), ...terms]));
  pushLog('warning', `下次重试会提醒 AI 避开：${state.retryAvoidTerms[stageKey].join('、')}`);
}

function retryOptionsFor(state: PipelineState, stageKey: string) {
  return { avoidTerms: state.retryAvoidTerms[stageKey] ?? [] };
}

function clearRetryAvoidTerms(state: PipelineState, stageKey: string) {
  delete state.retryAvoidTerms[stageKey];
}

function ensureArtifacts(state: PipelineState): WriterArtifacts {
  if (!state.artifacts) {
    state.artifacts = buildArtifacts(requireWorldview(state), getCompletedRoles(state));
  }
  return state.artifacts;
}

function returnEditor() {
  workStarted.value = false;
  failedStageIndex.value = null;
  isBusy.value = false;
}

async function enterEditor() {
  if (!canEnterEditor.value || isBusy.value) return;
  isBusy.value = true;
  try {
    const targetWorldbook = worldbookName.value.trim();
    await ensureWorldbookBound(targetWorldbook);
    pushLog('success', `已绑定世界书：${targetWorldbook}`);
    step.value = 'editor';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    pushLog('error', message);
    toastr.error(message, '一键角色卡写卡器');
  } finally {
    isBusy.value = false;
  }
}

async function executeStage(stageKey: string) {
  const state = requirePipelineState();

  if (stageKey === 'bind-worldbook') {
    pushLog('info', `确认世界书：${state.targetWorldbook}`);
    await ensureWorldbookBound(state.targetWorldbook);
    return;
  }

  if (stageKey === 'clear-old') {
    await clearWriterEntries(state.targetWorldbook);
    return;
  }

  if (stageKey === 'generate-worldview') {
    state.roleResults = [];
    state.artifacts = undefined;
    const worldview = await generateWorldview(state.worldviewSeed, retryOptionsFor(state, stageKey));
    state.worldview = worldview;
    previewText.value = worldview.content;
    pushLog('success', '世界观生成完成');
    return;
  }

  if (stageKey === 'write-worldview') {
    await upsertWriterEntries(state.targetWorldbook, buildWorldviewEntries(requireWorldview(state)));
    return;
  }

  const generateRoleMatch = stageKey.match(/^generate-role-(\d+)$/);
  if (generateRoleMatch) {
    const roleIndex = Number(generateRoleMatch[1]);
    const role = state.activeRoles[roleIndex];
    if (!role) throw new Error(`未找到角色${roleIndex + 1}素材`);
    const result = await generateRole(role, requireWorldview(state).content, roleIndex, retryOptionsFor(state, stageKey));
    state.roleResults[roleIndex] = result;
    state.artifacts = undefined;
    previewText.value = result.basic;
    pushLog('success', `${result.name} 生成完成`);
    return;
  }

  const writeRoleMatch = stageKey.match(/^write-role-(\d+)$/);
  if (writeRoleMatch) {
    const roleIndex = Number(writeRoleMatch[1]);
    const result = state.roleResults[roleIndex];
    if (!result) throw new Error(`角色${roleIndex + 1}尚未生成，请先重新生成该角色`);
    await upsertWriterEntries(state.targetWorldbook, [
      ...buildRoleOverviewEntries(getCompletedRoles(state)),
      ...buildRoleEntries(result, roleIndex, state.isMultiRole),
    ]);
    return;
  }

  if (stageKey === 'write-mvu') {
    const roleResults = getCompletedRoles(state);
    if (roleResults.length === 0) throw new Error('至少需要一个已生成角色');
    await upsertWriterEntries(state.targetWorldbook, buildFixedMvuEntries(roleResults));
    return;
  }

  if (stageKey === 'install-runtime') {
    await installMvuRuntimeScript();
    return;
  }

  if (stageKey === 'install-schema') {
    await installMvuSchemaScript(ensureArtifacts(state).mvuSchemaScript);
    return;
  }

  if (stageKey === 'install-regex') {
    await installMvuRegexes(ensureArtifacts(state).statusRegexHtml);
    return;
  }

  if (stageKey === 'write-avatar') {
    await updateCurrentAvatar(avatarFile.value);
  }
}

async function runPipeline(startIndex = 0) {
  if (isBusy.value) return;
  isBusy.value = true;
  workStarted.value = true;
  failedStageIndex.value = null;

  if (startIndex === 0) {
    previewText.value = '';
    const activeRoles = roles
      .filter(role => role.seed.trim())
      .map(role => ({ ...role }));
    if (activeRoles.length === 0) {
      isBusy.value = false;
      throw new Error('至少需要填写一个角色素材');
    }

    pipelineState.value = {
      targetWorldbook: worldbookName.value.trim(),
      worldviewSeed: worldviewSeed.value.trim(),
      activeRoles,
      isMultiRole: activeRoles.length > 1,
      roleResults: [],
      retryAvoidTerms: {},
    };
    workStages.value = buildWorkStages(activeRoles, Boolean(avatarFile.value));
  } else {
    clearStagesFrom(startIndex);
  }

  try {
    for (let index = startIndex; index < workStages.value.length; index += 1) {
      const stageItem = workStages.value[index];
      updateStage(index, 'running');
      pushLog('info', stageItem.title);
      await executeStage(stageItem.key);
      clearRetryAvoidTerms(requirePipelineState(), stageItem.key);
      updateStage(index, 'done');
    }

    pushLog('success', '完整角色卡生成并写入完成');
    toastr.success('完整角色卡已生成并写入');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failedStageIndex.value = workStages.value.findIndex(item => item.status === 'running');
    if (failedStageIndex.value < 0) failedStageIndex.value = startIndex;
    updateStage(failedStageIndex.value, 'error', message);
    const failedStage = workStages.value[failedStageIndex.value];
    if (pipelineState.value && failedStage) rememberRetryAvoidTerms(pipelineState.value, failedStage.key, message);
    pushLog('error', message);
    toastr.error(message, '一键角色卡写卡器');
  } finally {
    isBusy.value = false;
  }
}

async function runWriter() {
  if (!canRun.value || isBusy.value) return;
  try {
    await runPipeline(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    pushLog('error', message);
    toastr.error(message, '一键角色卡写卡器');
  }
}

async function retryFailedStage() {
  if (failedStageIndex.value === null || isBusy.value) return;
  await runPipeline(failedStageIndex.value);
}

async function rerollRoleStage(roleIndex: number, stageIndex: number) {
  const state = requirePipelineState();
  const role = state.activeRoles[roleIndex];
  if (!role) throw new Error(`未找到角色${roleIndex + 1}素材`);

  isBusy.value = true;
  failedStageIndex.value = null;
  try {
    updateStage(stageIndex, 'running');
    pushLog('info', `重ROLL ${role.label}`);
    const stageKey = `generate-role-${roleIndex}`;
    const result = await generateRole(role, requireWorldview(state).content, roleIndex, retryOptionsFor(state, stageKey));
    state.roleResults[roleIndex] = result;
    state.artifacts = undefined;
    previewText.value = result.basic;

    const rolesReady = getCompletedRoles(state);
    const artifacts = buildArtifacts(requireWorldview(state), rolesReady);
    state.artifacts = artifacts;
    await replaceWriterEntries(state.targetWorldbook, artifacts.entries);
    await installMvuSchemaScript(artifacts.mvuSchemaScript);
    await installMvuRegexes(artifacts.statusRegexHtml);

    updateStage(stageIndex, 'done');
    clearRetryAvoidTerms(state, stageKey);
    const writeIndex = findStageIndex(`write-role-${roleIndex}`);
    if (writeIndex >= 0) updateStage(writeIndex, 'done');
    pushLog('success', `${result.name} 已重ROLL并刷新世界书/MVU/状态栏`);
    toastr.success(`${result.name} 已重ROLL`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failedStageIndex.value = stageIndex;
    updateStage(stageIndex, 'error', message);
    rememberRetryAvoidTerms(state, `generate-role-${roleIndex}`, message);
    pushLog('error', message);
    toastr.error(message, '一键角色卡写卡器');
  } finally {
    isBusy.value = false;
  }
}

async function rerollStage(stageItem: WorkStage) {
  if (isBusy.value) return;
  const stageIndex = findStageIndex(stageItem.key);
  if (stageIndex < 0) return;

  if (stageItem.key === 'generate-worldview') {
    await runPipeline(Math.max(1, stageIndex - 1));
    return;
  }

  const roleMatch = stageItem.key.match(/^generate-role-(\d+)$/u);
  if (roleMatch) {
    await rerollRoleStage(Number(roleMatch[1]), stageIndex);
  }
}
</script>

<style scoped>
.writer-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  background: #f2efe7;
  color: #222925;
  font-family: "Microsoft YaHei", system-ui, sans-serif;
}

.writer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: calc(14px + env(safe-area-inset-top, 0px)) calc(18px + env(safe-area-inset-right, 0px)) 14px
    calc(18px + env(safe-area-inset-left, 0px));
  border-bottom: 1px solid rgba(54, 68, 60, 0.14);
  background: #fbfaf6;
}

.eyebrow {
  margin: 0 0 3px;
  color: #65736b;
  font-size: 12px;
}

h1,
h2 {
  margin: 0;
  line-height: 1.25;
}

h1 {
  font-size: 22px;
}

h2 {
  font-size: 16px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(230px, 280px) minmax(420px, 1fr) minmax(260px, 340px);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  flex: 1;
}

.work-screen {
  display: grid;
  grid-template-columns: minmax(280px, 42%) minmax(360px, 1fr);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  flex: 1;
}

.work-visual {
  min-width: 0;
  min-height: 0;
  background: #191d1b;
}

.work-visual img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.work-board {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 18px;
}

.work-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.work-head p {
  margin: 5px 0 0;
  color: #65736b;
  font-size: 13px;
}

.work-head strong {
  color: #2f6f5e;
  font-size: 18px;
}

.progress-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(47, 111, 94, 0.12);
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2f6f5e;
  transition: width 0.25s ease;
}

.work-steps {
  display: grid;
  gap: 9px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.work-step {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  min-width: 0;
  border: 1px solid rgba(54, 68, 60, 0.13);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.58);
  padding: 10px;
}

.stage-dot {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(47, 111, 94, 0.1);
  color: #2f6f5e;
  font-weight: 700;
}

.work-step strong {
  display: block;
  color: #23302c;
  line-height: 1.35;
}

.work-step p {
  margin: 4px 0 0;
  color: #65736b;
  font-size: 13px;
  line-height: 1.45;
}

.work-step.running {
  border-color: rgba(47, 111, 94, 0.36);
  background: rgba(47, 111, 94, 0.08);
}

.work-step.done .stage-dot {
  background: #2f6f5e;
  color: #fff;
}

.work-step.error {
  border-color: rgba(161, 58, 53, 0.34);
  background: rgba(161, 58, 53, 0.08);
}

.work-step.error .stage-dot {
  background: #a13a35;
  color: #fff;
}

.work-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.work-actions .primary {
  width: auto;
  min-width: 150px;
  margin-top: 0;
  padding: 0 16px;
}

.work-preview {
  margin-top: 18px;
}

.setup-step {
  display: grid;
  place-items: center;
  min-height: 0;
  flex: 1;
  padding: 22px calc(22px + env(safe-area-inset-right, 0px)) calc(22px + env(safe-area-inset-bottom, 0px))
    calc(22px + env(safe-area-inset-left, 0px));
}

.setup-card {
  box-sizing: border-box;
  width: min(460px, 100%);
  border: 1px solid rgba(54, 68, 60, 0.14);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.64);
  padding: 18px;
}

.setup-panel,
.editor-panel,
.result-panel {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
}

.setup-panel,
.result-panel {
  background: rgba(255, 255, 255, 0.54);
}

.editor-panel {
  border-left: 1px solid rgba(54, 68, 60, 0.12);
  border-right: 1px solid rgba(54, 68, 60, 0.12);
}

.field {
  display: grid;
  gap: 6px;
  margin-bottom: 13px;
  color: #526158;
  font-size: 13px;
}

.field.compact {
  margin-bottom: 10px;
}

input,
textarea {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  border: 1px solid rgba(54, 68, 60, 0.18);
  border-radius: 7px;
  background: #fffefb;
  color: #222925;
  font: inherit;
  outline: none;
}

input {
  height: 34px;
  padding: 0 10px;
}

input:disabled {
  color: #7b837e;
  background: #ece9df;
}

textarea {
  resize: vertical;
  padding: 10px;
  line-height: 1.55;
}

input::placeholder,
textarea::placeholder {
  color: #8b948f;
  opacity: 1;
}

.world-textarea {
  min-height: 170px;
}

.role-textarea {
  min-height: 130px;
}

.section-head,
.role-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  gap: 10px;
  margin-bottom: 10px;
}

.roles-head {
  margin-top: 18px;
}

.guide-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-top: 12px;
  border: 1px solid rgba(54, 68, 60, 0.13);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.42);
  padding: 10px 11px;
  color: #65736b;
  font-size: 13px;
}

.guide-box strong {
  color: #23302c;
}

.guide-box a {
  color: #2f6f5e;
  text-decoration: none;
}

.guide-box a:hover {
  text-decoration: underline;
}

.role-card {
  border: 1px solid rgba(54, 68, 60, 0.13);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.48);
  padding: 12px;
  margin-bottom: 12px;
}

.asset-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.asset-tip {
  margin: 0;
  color: #7a827e;
  font-size: 12px;
  line-height: 1.45;
}

button {
  border: 0;
  border-radius: 7px;
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
}

button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.primary {
  width: 100%;
  height: 40px;
  margin-top: 14px;
  background: #2f6f5e;
  color: white;
  font-weight: 700;
}

.secondary,
.ghost,
.icon-button {
  background: rgba(47, 111, 94, 0.1);
  color: #2f6f5e;
}

.secondary,
.ghost {
  min-height: 30px;
  padding: 0 10px;
}

.mini-action {
  min-height: 28px;
  margin-top: 8px;
  padding: 0 9px;
  background: rgba(47, 111, 94, 0.1);
  color: #2f6f5e;
  font-size: 12px;
}

.icon-button {
  width: 34px;
  height: 34px;
  font-size: 22px;
}

.summary {
  display: grid;
  gap: 7px;
  border: 1px solid rgba(47, 111, 94, 0.14);
  border-radius: 8px;
  background: rgba(47, 111, 94, 0.06);
  padding: 11px;
  color: #51645c;
  font-size: 13px;
}

.summary strong {
  color: #23302c;
}

.wide {
  width: 100%;
  margin-top: 12px;
}

.log-list {
  display: grid;
  gap: 8px;
}

.log {
  margin: 0;
  border-radius: 7px;
  padding: 8px 9px;
  background: rgba(255, 255, 255, 0.72);
  color: #39443f;
  font-size: 13px;
  line-height: 1.45;
}

.log.success {
  color: #1f6b4f;
}

.log.warning {
  color: #9a6a19;
}

.log.error {
  color: #a13a35;
}

.empty {
  margin: 0;
  color: #8a918d;
  font-size: 13px;
}

.preview {
  margin-top: 16px;
}

.preview strong {
  display: block;
  margin-bottom: 8px;
}

pre {
  max-height: 320px;
  overflow: auto;
  margin: 0;
  border: 1px solid rgba(54, 68, 60, 0.13);
  border-radius: 8px;
  background: #fffefb;
  padding: 10px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 980px) {
  .writer-shell {
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .workspace {
    display: block;
    min-height: auto;
    overflow: visible;
    flex: 0 0 auto;
  }

  .work-screen {
    display: block;
    min-height: auto;
    overflow: visible;
    flex: 0 0 auto;
  }

  .work-visual {
    aspect-ratio: 16 / 10;
    min-height: auto;
  }

  .work-visual img {
    height: 100%;
  }

  .work-board {
    min-height: auto;
    overflow: visible;
    padding: 14px calc(14px + env(safe-area-inset-right, 0px)) calc(18px + env(safe-area-inset-bottom, 0px))
      calc(14px + env(safe-area-inset-left, 0px));
  }

  .setup-step {
    display: block;
    min-height: auto;
    flex: 0 0 auto;
    padding: 14px calc(14px + env(safe-area-inset-right, 0px)) calc(18px + env(safe-area-inset-bottom, 0px))
      calc(14px + env(safe-area-inset-left, 0px));
  }

  .setup-card {
    width: 100%;
  }

  .setup-panel,
  .editor-panel,
  .result-panel {
    border: 0;
    border-bottom: 1px solid rgba(54, 68, 60, 0.12);
    overflow: visible;
    padding: 14px calc(14px + env(safe-area-inset-right, 0px)) 14px
      calc(14px + env(safe-area-inset-left, 0px));
  }

  .result-panel {
    padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  }

  input,
  textarea {
    font-size: 16px;
  }

  .world-textarea {
    min-height: 145px;
  }

  .role-textarea {
    min-height: 120px;
  }

  pre {
    max-height: none;
    overflow: visible;
  }
}

@media (max-width: 520px) {
  .writer-header {
    gap: 12px;
  }

  h1 {
    font-size: 20px;
  }

  .section-head,
  .role-title {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .secondary,
  .ghost {
    min-height: 34px;
  }

  .work-head {
    align-items: flex-start;
  }

  .work-actions {
    display: grid;
  }

  .work-actions .primary,
  .work-actions .ghost {
    width: 100%;
  }

  .guide-box {
    display: grid;
  }

  .asset-grid {
    grid-template-columns: 1fr;
  }
}
</style>
