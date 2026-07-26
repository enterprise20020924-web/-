<template>
  <div v-if="open" class="dialog-backdrop" role="presentation">
    <section class="continuation-dialog" role="dialog" aria-modal="true" aria-labelledby="continuation-title">
      <div class="dialog-head">
        <div>
          <span class="view-kicker">CONTINUATION LIMIT</span>
          <h2 id="continuation-title">自动续传已完成 5 次</h2>
          <p>内容仍未完整闭合。可以继续下一组 5 次，系统会携带全文并从断点续写。</p>
        </div>
      </div>

      <details class="continuation-preview">
        <summary>查看当前输出末尾</summary>
        <pre>{{ generatedTail }}</pre>
      </details>

      <div class="dialog-note">
        <strong>已经生成的内容不会丢失</strong>
        <span>停止后会停在当前阶段，可稍后重试；继续不会重写已经完成的前文。</span>
      </div>

      <div class="dialog-actions">
        <button class="ghost" @click="emit('stop')">停止当前阶段</button>
        <button class="primary" @click="emit('continue')">再继续 5 次</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean;
  generatedTail: string;
}>();

const emit = defineEmits<{
  continue: [];
  stop: [];
}>();
</script>
