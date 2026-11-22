<template>
  <div class="sk-orbit" aria-hidden="true">
    <svg viewBox="0 0 240 240" fill="none">
      <g class="sk-orbit-outer">
        <circle cx="120" cy="120" r="107" stroke="currentColor" stroke-opacity=".18" />
        <circle cx="120" cy="120" r="99" stroke="currentColor" stroke-width="2" stroke-dasharray="64 12 8 80" />
        <path d="M120 4v18m116 98h-18M120 236v-18M4 120h18" stroke="currentColor" stroke-width="2" />
      </g>
      <g class="sk-orbit-inner">
        <circle cx="120" cy="120" r="78" stroke="currentColor" stroke-opacity=".4" stroke-dasharray="2 7" />
        <path d="M44 98a79 79 0 0 1 98-54m54 98a79 79 0 0 1-98 54" stroke="currentColor" stroke-width="4" />
      </g>
      <circle class="sk-orbit-satellite" cx="120" cy="21" r="5" fill="currentColor" />
    </svg>
    <div class="sk-orbit-school-mark"><AmamiMark /></div>
    <span class="sk-orbit-cross sk-orbit-cross-a">+</span>
    <span class="sk-orbit-cross sk-orbit-cross-b">+</span>
  </div>
</template>

<script setup lang="ts">
import AmamiMark from '../../../vector/AmamiMark.vue';
</script>

<style scoped>
.sk-orbit-school-mark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 64%;
  aspect-ratio: 3620 / 2188;
  transform: translate(-50%, -50%);
}
</style>
