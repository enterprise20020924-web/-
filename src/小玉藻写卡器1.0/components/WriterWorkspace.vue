<template>
  <section class="workspace writer-workspace">
    <aside class="setup-panel writer-command-panel">
      <div class="completion-block">
        <div class="completion-ring" :style="{ '--completion': `${completionPercent * 3.6}deg` }">
          <span>{{ completionPercent }}%</span>
        </div>
        <div>
          <strong>工程完成度</strong>
          <small>{{ roles.length }} 个角色模块</small>
        </div>
      </div>

      <div class="summary compact-summary">
        <span class="summary-label">目标世界书</span>
        <strong>{{ worldbookName }}</strong>
        <span>{{ avatarFileName ? `卡面：${avatarFileName}` : '未选择卡面图片' }}</span>
      </div>

      <div class="manifest-mini-list">
        <span><i />世界观与角色速览</span>
        <span><i />角色调色盘与二次解释</span>
        <span><i />MVU、EJS 与局部正则</span>
      </div>

      <div class="command-actions">
        <button class="primary wide" :disabled="isBusy || !canRun" @click="emit('request-run')">
          {{ isBusy ? '正在准备...' : '继续设置开场白' }}
        </button>
        <button class="ghost wide" :disabled="isBusy" @click="emit('back')">返回项目设置</button>
      </div>

      <p v-if="draftStatus" class="draft-status command-draft-status">{{ draftStatus }}</p>
    </aside>

    <section class="editor-panel writer-editor-panel">
      <div class="editor-toolbar">
        <div>
          <span class="view-kicker">CONTENT EDITOR</span>
          <h2>写卡素材</h2>
        </div>
        <button class="secondary" :disabled="isBusy" @click="emit('add-role')">新增角色</button>
      </div>

      <section class="editor-section worldview-section">
        <div class="section-head">
          <div>
            <span class="section-number">01</span>
            <div>
              <h3>世界观素材</h3>
              <p>只需提供核心设定，AI 会按内置预设结构补全。</p>
            </div>
          </div>
          <small>{{ worldviewSeed.trim().length }} 字</small>
        </div>
        <textarea
          :value="worldviewSeed"
          class="world-textarea"
          placeholder="写下时代、地点、社会规则、力量体系、主要矛盾和你想保留的特殊设定。"
          @input="onWorldviewInput"
        />

        <details class="guide-box">
          <summary>查看写卡参考</summary>
          <div>
            <a
              href="https://discord.com/channels/1134557553011998840/1488344282585628843"
              target="_blank"
              rel="noreferrer"
            >
              写正确的卡，入门教程
            </a>
            <a
              href="https://discord.com/channels/1134557553011998840/1457071148885086331"
              target="_blank"
              rel="noreferrer"
            >
              如何写活人设，调色盘与进阶教程
            </a>
          </div>
        </details>
      </section>

      <section class="editor-section roles-section">
        <div class="section-head roles-head">
          <div>
            <span class="section-number">02</span>
            <div>
              <h3>角色模块</h3>
              <p>角色会按照这里的顺序逐一生成并写入。</p>
            </div>
          </div>
          <span class="role-count-badge">{{ roles.length }} 个角色</span>
        </div>

        <RoleDraftCard
          v-for="(role, index) in roles"
          :key="role.id"
          :role="role"
          :index="index"
          :total="roles.length"
          :is-busy="isBusy"
          @update="(roleIndex, patch) => emit('update-role', roleIndex, patch)"
          @remove="roleIndex => emit('remove-role', roleIndex)"
          @move="(roleIndex, direction) => emit('move-role', roleIndex, direction)"
          @duplicate="roleIndex => emit('duplicate-role', roleIndex)"
        />
      </section>
    </section>

    <aside class="result-panel inspector-panel">
      <div class="inspector-section validation-section">
        <div class="section-head compact-head">
          <h3>执行检查</h3>
          <span :class="['check-state', { ready: validationIssues.length === 0 }]">
            {{ validationIssues.length === 0 ? '可以继续' : `${validationIssues.length} 项待处理` }}
          </span>
        </div>
        <ul v-if="validationIssues.length" class="validation-list">
          <li v-for="issue in validationIssues" :key="issue">{{ issue }}</li>
        </ul>
        <p v-else class="validation-ready">写卡素材已准备完成，下一步设置第一幕。</p>
      </div>

      <div class="inspector-section log-section">
        <div class="section-head compact-head">
          <h3>活动日志</h3>
          <button class="ghost compact-button" :disabled="isBusy" @click="emit('clear-logs')">清空</button>
        </div>
        <div v-if="generationWarnings.length" class="warning-panel compact-warning">
          <strong>生成提醒</strong>
          <p v-for="(warning, index) in generationWarnings" :key="`${index}-${warning}`">{{ warning }}</p>
        </div>
        <div class="log-list">
          <p v-for="log in logs" :key="log.id" :class="['log', log.level]">{{ log.text }}</p>
          <p v-if="logs.length === 0" class="empty">尚未执行生成任务</p>
        </div>
      </div>

      <div v-if="previewText" class="preview inspector-preview">
        <div class="preview-head">
          <strong>最近生成</strong>
          <button class="ghost mini-copy" @click="emit('copy-preview')">复制</button>
        </div>
        <pre>{{ previewText }}</pre>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import RoleDraftCard from './RoleDraftCard.vue';
import type { RoleDraft, WriterLog } from '../types';

defineProps<{
  worldbookName: string;
  avatarFileName: string;
  worldviewSeed: string;
  roles: RoleDraft[];
  logs: WriterLog[];
  generationWarnings: string[];
  previewText: string;
  isBusy: boolean;
  canRun: boolean;
  validationIssues: string[];
  completionPercent: number;
  draftStatus: string;
}>();

const emit = defineEmits<{
  'update:worldviewSeed': [value: string];
  'add-role': [];
  'remove-role': [index: number];
  'move-role': [index: number, direction: -1 | 1];
  'duplicate-role': [index: number];
  'update-role': [index: number, patch: Partial<RoleDraft>];
  back: [];
  'request-run': [];
  'clear-logs': [];
  'copy-preview': [];
}>();

function onWorldviewInput(event: Event) {
  emit('update:worldviewSeed', (event.target as HTMLTextAreaElement).value);
}
</script>
