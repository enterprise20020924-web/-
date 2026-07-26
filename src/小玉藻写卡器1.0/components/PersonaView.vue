<template>
  <section class="workspace persona-workspace">
    <section class="editor-panel persona-editor">
      <div class="section-head persona-heading">
        <div>
          <p class="panel-kicker">PERSONA LAB</p>
          <h2>只生成人设</h2>
          <p>把零散想法整理成可以直接复制的人设，不会修改当前角色卡。</p>
        </div>
      </div>

      <div class="persona-mode-switch" aria-label="人设生成模式">
        <button
          :class="['mode-option', { active: personaMode === 'normal' }]"
          :disabled="isBusy"
          @click="emit('update:personaMode', 'normal')"
        >
          普通调色盘
        </button>
        <button
          :class="['mode-option', { active: personaMode === 'multistage' }]"
          :disabled="isBusy"
          @click="emit('update:personaMode', 'multistage')"
        >
          多阶段调色盘
        </button>
      </div>

      <textarea
        :value="personaSeed"
        class="persona-textarea"
        placeholder="只填人设信息即可：
角色的底色、主色调、矛盾感、行为逻辑、关系触发、压力状态。
如果选择多阶段调色盘，可以补充初识期、熟悉期、亲近期分别会怎样变化。"
        @input="onPersonaInput"
      />

      <div class="persona-actions">
        <button class="ghost" :disabled="isBusy" @click="emit('back')">返回设置</button>
        <button class="primary" :disabled="isBusy || !canRunPersona" @click="emit('generate')">
          {{ isBusy ? '生成中...' : `生成${personaModeLabel}` }}
        </button>
      </div>
    </section>

    <aside class="result-panel">
      <div class="section-head">
        <h2>人设结果</h2>
        <div class="section-actions">
          <button v-if="personaResult" class="ghost" :disabled="isBusy" @click="emit('copy-result')">复制</button>
          <button class="ghost" :disabled="isBusy" @click="emit('clear')">清空</button>
        </div>
      </div>
      <div v-if="generationWarnings.length" class="warning-panel compact-warning">
        <strong>生成提醒</strong>
        <p v-for="(warning, index) in generationWarnings" :key="`${index}-${warning}`">{{ warning }}</p>
      </div>
      <div class="log-list">
        <p v-for="log in logs" :key="log.id" :class="['log', log.level]">{{ log.text }}</p>
        <p v-if="logs.length === 0" class="empty">等待开始</p>
      </div>

      <div v-if="personaResult" class="preview persona-result">
        <strong>{{ modeName(personaResult.mode) }}</strong>
        <pre>{{ personaResult.content }}</pre>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import type { PersonaOnlyMode, PersonaOnlyResult, WriterLog } from '../types';

defineProps<{
  personaMode: PersonaOnlyMode;
  personaSeed: string;
  personaModeLabel: string;
  personaResult: PersonaOnlyResult | null;
  generationWarnings: string[];
  logs: WriterLog[];
  isBusy: boolean;
  canRunPersona: boolean;
}>();

const emit = defineEmits<{
  'update:personaMode': [value: PersonaOnlyMode];
  'update:personaSeed': [value: string];
  back: [];
  generate: [];
  clear: [];
  'copy-result': [];
}>();

function onPersonaInput(event: Event) {
  emit('update:personaSeed', (event.target as HTMLTextAreaElement).value);
}

function modeName(mode: PersonaOnlyMode): string {
  return mode === 'normal' ? '普通调色盘' : '多阶段调色盘';
}
</script>
