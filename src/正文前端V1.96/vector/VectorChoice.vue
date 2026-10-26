<template>
  <span class="bpv-choice-art" aria-hidden="true">
    <svg viewBox="0 0 1000 180" preserveAspectRatio="none" fill="none">
      <path d="M24 3h938l35 34v120l-21 20H23L3 155V24Z" fill="#f8fcff" stroke="#a9d2ed" stroke-width="2" />
      <path d="M184 10h770l34 30v108l-20 20H180Z" fill="#e8f6ff" opacity=".6" />
      <path d="M11 60V27l17-16h110m799 0h16l35 34v26M11 121v30l17 17h110" stroke="#329fe5" stroke-width="3" />
      <path d="M190 146h658m70 0h39M199 26h167" stroke="#c8e2f3" />
      <path d="m956 85 9 6-9 6" stroke="#269de7" stroke-width="3" />
      <circle cx="91" cy="94" r="64" fill="#e3f4ff" />
      <circle cx="91" cy="94" r="72" stroke="#c6e6f8" stroke-dasharray="7 8" />
    </svg>
    <VectorAssistant :variant="variant" />
  </span>
</template>
<script setup lang="ts">
import VectorAssistant from './VectorAssistant.vue';
withDefaults(defineProps<{ variant?: 'blue' | 'silver' }>(), { variant: 'blue' });
</script>
<style>
.bpv-choice-art {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
}
.bpv-choice-art > svg:first-child {
  width: 100%;
  height: 100%;
}
.bpv-choice-art > .bpv-assistant {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 115%;
  width: 21%;
}
</style>
