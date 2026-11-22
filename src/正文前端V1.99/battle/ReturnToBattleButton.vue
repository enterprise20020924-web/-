<template>
  <button class="bp-return-battle" type="button" title="返回本楼层的战斗" @click="emit('resume')">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m14.5 3 3 3L4 19l-1 2 2-1L18 6.5l3-3V3h-3l-3.5 3.5M3 3h3l15 16M9 6 6 9m9 6 4 4m-3-2 3-3M4 14l6 6" />
    </svg>
    <span>返回战斗</span>
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{ resume: [] }>();
</script>

<style scoped>
.bp-return-battle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55em;
  min-width: 0;
  padding: 0 0.8em;
  border: 1px solid #079bdb;
  border-radius: 4px 12px 4px 12px;
  background: linear-gradient(145deg, #26b8ed, #078aca);
  color: #fff;
  box-shadow:
    inset 0 1px 0 #ffffff70,
    0 2px 7px #159bd72b;
  font-family: inherit;
  font-size: var(--bp-battle-return-font-size, 14px);
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  pointer-events: auto;
  touch-action: manipulation;
  transition:
    background 160ms ease,
    box-shadow 160ms ease;
}
.bp-return-battle svg {
  flex: none;
  width: 1.2em;
  height: 1.2em;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.bp-return-battle:hover {
  background: linear-gradient(145deg, #3bc8f5, #079bdb);
  box-shadow:
    inset 0 1px 0 #ffffff90,
    0 2px 10px #159bd74d;
}
.bp-return-battle:active {
  background: #087fb9;
  box-shadow: inset 0 2px 4px #075d8640;
}
.bp-return-battle:focus-visible {
  outline: 2px solid #087fb9;
  outline-offset: 3px;
}
</style>
