<template>
  <div v-if="open" class="dialog-backdrop" role="presentation" @click.self="emit('close')">
    <section class="preflight-dialog restore-dialog" role="dialog" aria-modal="true" aria-labelledby="restore-title">
      <div class="dialog-head">
        <div>
          <span class="view-kicker">RESTORE POINT</span>
          <h2 id="restore-title">恢复生成前版本？</h2>
          <p>这会撤销本次一键生成写入的内容，但不会删除你填写的草稿。</p>
        </div>
        <button class="icon-button close-button" aria-label="关闭恢复确认" :disabled="isBusy" @click="emit('close')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>

      <div class="write-manifest restore-manifest">
        <h3>将恢复以下内容</h3>
        <ul>
          <li>生成前的世界书内容与绑定关系</li>
          <li>生成前的角色卡字段与卡面</li>
          <li>生成前的后台互动脚本与状态栏规则</li>
        </ul>
      </div>

      <div class="dialog-note">
        <strong>恢复点时间</strong>
        <span>{{ createdAtLabel }}</span>
      </div>

      <div class="dialog-actions">
        <button class="ghost" :disabled="isBusy" @click="emit('close')">保留当前版本</button>
        <button class="primary restore-confirm-button" :disabled="isBusy" @click="emit('confirm')">
          {{ isBusy ? '正在恢复...' : '确认恢复生成前版本' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  createdAtLabel: string;
  isBusy: boolean;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [];
}>();
</script>
