<template>
  <div v-if="open" class="dialog-backdrop" role="presentation" @click.self="emit('close')">
    <section
      class="preflight-dialog create-character-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-character-title"
    >
      <div class="dialog-head">
        <div>
          <span class="view-kicker">NEW CHARACTER</span>
          <h2 id="create-character-title">创建一张空白角色卡</h2>
          <p>不需要先退出写卡器。创建完成后会自动打开这张卡，再继续一键生成。</p>
        </div>
        <button
          type="button"
          class="icon-button close-button"
          aria-label="关闭创建角色卡"
          :disabled="isBusy"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>

      <label class="field create-character-field">
        <span>角色卡名称</span>
        <input
          autofocus
          :value="name"
          maxlength="80"
          placeholder="例如：玉藻前"
          @input="onNameInput"
          @keydown.enter.prevent="requestConfirm"
        />
      </label>

      <p v-if="validationIssue" class="field-issue" role="alert">{{ validationIssue }}</p>

      <div class="dialog-note">
        <strong>这一步不会生成内容</strong>
        <span>只创建空白角色卡；世界书、人设和互动系统仍会在最终确认后写入。</span>
      </div>

      <div class="dialog-actions">
        <button type="button" class="ghost" :disabled="isBusy" @click="emit('close')">取消</button>
        <button type="button" class="primary" :disabled="isBusy || Boolean(validationIssue)" @click="requestConfirm">
          {{ isBusy ? '正在创建...' : '创建并打开角色卡' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isBusy: boolean;
  name: string;
  open: boolean;
  validationIssue: string;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
  'update:name': [value: string];
}>();

function requestConfirm() {
  if (props.isBusy || props.validationIssue) return;
  emit('confirm');
}

function onNameInput(event: Event) {
  emit('update:name', (event.target as HTMLInputElement).value);
}
</script>
