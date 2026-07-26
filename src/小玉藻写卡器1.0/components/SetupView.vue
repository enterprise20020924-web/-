<template>
  <section class="app-view setup-dashboard">
    <div class="view-heading compact-view-heading">
      <div>
        <span class="view-kicker">NEW PROJECT</span>
        <h2>配置写卡工程</h2>
        <p>确认要写入的角色，然后选择一键生成、高级编辑或只整理人设。</p>
      </div>
    </div>

    <div class="setup-dashboard-grid">
      <section class="tool-panel project-config-panel">
        <div class="tool-panel-head">
          <div>
            <span class="panel-index">01</span>
            <div>
              <h3>项目环境</h3>
              <p>写入目标与角色卡面</p>
            </div>
          </div>
          <span :class="['panel-state', { ready: canEnterEditor, warning: !canEnterEditor }]">
            {{ !hasCurrentCharacter ? '需要角色卡' : canEnterEditor ? '已连接' : '需要检查' }}
          </span>
        </div>

        <div v-if="!hasCurrentCharacter" class="empty-character-callout">
          <span class="empty-character-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6M19 5v6M16 8h6" />
            </svg>
          </span>
          <div>
            <strong>还没有目标角色卡</strong>
            <p>可以直接创建一张空白卡，写卡器会自动打开它，不必先退出。</p>
          </div>
          <button type="button" class="secondary" :disabled="isBusy" @click="emit('create-character')">
            创建空白角色卡
          </button>
        </div>

        <div class="config-form-grid">
          <label class="field">
            <span>当前角色</span>
            <span class="field-with-icon readonly-field">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" />
              </svg>
              <input :value="currentCharacter" disabled />
            </span>
          </label>

          <label class="field">
            <span>世界书名称</span>
            <span class="field-with-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z" />
                <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z" />
              </svg>
              <input :value="worldbookName" placeholder="不要带 emoji" @input="onWorldbookInput" />
            </span>
          </label>
        </div>

        <label class="field upload-field compact-upload-field">
          <span>角色卡面</span>
          <span class="upload-control">
            <input type="file" accept="image/*" @change="event => emit('avatar-change', event)" />
            <span class="upload-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
                <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
              </svg>
            </span>
            <span class="upload-copy">
              <strong>{{ avatarFile ? avatarFile.name : '选择角色卡面' }}</strong>
              <small>{{ avatarFile ? '生成完成后写入当前角色' : 'PNG、JPG、WEBP，可暂时留空' }}</small>
            </span>
            <span class="upload-action">浏览文件</span>
          </span>
        </label>

        <div class="connection-mode-card">
          <div class="connection-mode-head">
            <div>
              <strong>生成连接</strong>
              <small>{{ currentApiSource || '正在读取 API' }} · {{ currentModelName || '正在读取模型' }}</small>
            </div>
            <span><i class="status-light" />{{ currentConnectionStatus || '状态未知' }}</span>
          </div>
          <div class="connection-mode-switch" role="group" aria-label="生成连接模式">
            <button
              type="button"
              :class="{ active: generationMode === 'nonstream' }"
              :disabled="isBusy"
              @click="emit('update:generationMode', 'nonstream')"
            >
              稳定完整
            </button>
            <button
              type="button"
              :class="{ active: generationMode === 'stream' }"
              :disabled="isBusy"
              @click="emit('update:generationMode', 'stream')"
            >
              流式保活
            </button>
            <button
              type="button"
              :class="{ active: generationMode === 'fake-stream' }"
              :disabled="isBusy"
              @click="emit('update:generationMode', 'fake-stream')"
            >
              截断续传
            </button>
          </div>
          <p>{{ generationModeHint }}</p>
          <button
            v-if="draftStatus"
            type="button"
            class="ghost compact-button clear-draft-button"
            :disabled="isBusy"
            @click="emit('clear-draft')"
          >
            清空当前草稿
          </button>
        </div>

        <p v-if="entryIssue && hasCurrentCharacter" class="field-issue" role="alert">{{ entryIssue }}</p>
        <p v-else-if="draftStatus" class="draft-status" aria-live="polite">{{ draftStatus }}</p>
      </section>

      <section class="tool-panel workflow-selector-panel">
        <div class="tool-panel-head">
          <div>
            <span class="panel-index">02</span>
            <div>
              <h3>选择工作流</h3>
              <p>第一次使用建议选择一键生成</p>
            </div>
          </div>
        </div>

        <div class="workflow-list">
          <button
            class="workflow-option primary-workflow"
            :disabled="isBusy || !canEnterEditor"
            @click="emit('enter-beginner')"
          >
            <span class="workflow-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 4h14v16H5z" />
                <path d="M8 8h8M8 12h8M8 16h5" />
              </svg>
            </span>
            <span class="workflow-copy">
              <strong>一键生成完整角色卡</strong>
              <small>回答三个简单问题，其余内容由玉藻自动完成</small>
              <span class="workflow-tags"><i>新手推荐</i><i>自动恢复点</i></span>
            </span>
            <span class="workflow-enter">{{ isBusy ? '处理中' : '进入' }} <b>→</b></span>
          </button>

          <button
            class="workflow-option advanced-workflow"
            :disabled="isBusy || !canEnterEditor"
            @click="emit('enter-editor')"
          >
            <span class="workflow-icon advanced-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
              </svg>
            </span>
            <span class="workflow-copy">
              <strong>高级编辑模式</strong>
              <small>详细编辑世界观、多角色、状态栏素材和全部模块</small>
              <span class="workflow-tags"><i>完整控制</i><i>支持多角色</i></span>
            </span>
            <span class="workflow-enter">打开 <b>→</b></span>
          </button>

          <button class="workflow-option" :disabled="isBusy" @click="emit('open-persona')">
            <span class="workflow-icon secondary-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 3h6m-5 0v5l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 17l-5-9V3" />
                <path d="M7.5 15h9" />
              </svg>
            </span>
            <span class="workflow-copy">
              <strong>只生成人设</strong>
              <small>整理普通或多阶段调色盘，不修改角色卡</small>
              <span class="workflow-tags"><i>轻量生成</i><i>快速复制</i></span>
            </span>
            <span class="workflow-enter">打开 <b>→</b></span>
          </button>
        </div>
      </section>

      <section class="tool-panel pipeline-overview-panel">
        <div class="tool-panel-head compact-panel-head">
          <div>
            <span class="panel-index">03</span>
            <div>
              <h3>完整写卡流程</h3>
              <p>每个阶段完成后立即写入，可在失败位置继续</p>
            </div>
          </div>
          <span class="panel-state">自动执行</span>
        </div>
        <ol class="pipeline-map">
          <li><span>1</span><strong>保存当前版本</strong><small>随时可以恢复</small></li>
          <li><span>2</span><strong>构建故事世界</strong><small>补全背景和规则</small></li>
          <li><span>3</span><strong>完成角色人设</strong><small>身份、性格与关系变化</small></li>
          <li><span>4</span><strong>编写故事第一幕</strong><small>文风、大纲与接话钩子</small></li>
          <li><span>5</span><strong>安装互动能力</strong><small>变量、状态和显示系统</small></li>
          <li><span>6</span><strong>完成并开始聊天</strong><small>检查后即可使用</small></li>
        </ol>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GenerationMode } from '../ui-types';

const props = defineProps<{
  currentCharacter: string;
  hasCurrentCharacter: boolean;
  worldbookName: string;
  avatarFile: File | null;
  isBusy: boolean;
  canEnterEditor: boolean;
  draftStatus: string;
  entryIssue: string;
  generationMode: GenerationMode;
  currentModelName: string;
  currentApiSource: string;
  currentConnectionStatus: string;
}>();

const emit = defineEmits<{
  'update:worldbookName': [value: string];
  'update:generationMode': [value: GenerationMode];
  'avatar-change': [event: Event];
  'create-character': [];
  'clear-draft': [];
  'enter-beginner': [];
  'enter-editor': [];
  'open-persona': [];
}>();

const generationModeHint = computed(() => {
  if (props.generationMode === 'stream') return '原生流式返回，适合需要持续连接保活的接口；截断后停在当前阶段。';
  if (props.generationMode === 'fake-stream') return '保留已收到内容，检测标签未闭合时从断点自动续写，每组最多 5 次。';
  return '等待模型一次性完整返回，默认推荐，操作最简单。';
});

function onWorldbookInput(event: Event) {
  emit('update:worldbookName', (event.target as HTMLInputElement).value);
}
</script>
