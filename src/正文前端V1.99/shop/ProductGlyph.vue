<template>
  <svg class="gyaru24-product-glyph" viewBox="0 0 100 100" aria-hidden="true">
    <ellipse cx="52" cy="84" rx="30" ry="5" fill="#3b82b5" opacity=".11" />
    <g v-if="kind === 'shirt'" stroke="#558bb5" stroke-width="2" stroke-linejoin="round">
      <path d="m34 20-21 15 12 18 10-7-4 37h39l-4-37 10 7 12-18-22-15-16 8Z" fill="#fff" />
      <path d="m34 20 16 8-9 15-12-19m37-4L50 28l10 15 12-19" fill="#b6def4" />
      <path d="m47 36-4 27 7 9 7-9-5-27Z" fill="#438bd7" />
      <path d="M33 74h35" />
    </g>
    <g v-else-if="kind === 'shield'" stroke="#548bb1" stroke-width="2.5" stroke-linejoin="round">
      <path d="M50 14 20 26v23c0 18 15 31 30 38 15-7 30-20 30-38V26Z" fill="#edf8ff" />
      <path d="M50 22 28 31v18c0 13 10 24 22 30 12-6 22-17 22-30V31Z" fill="#84cdf4" />
      <path d="m36 49 10 10 19-23" fill="none" stroke="#fff" stroke-width="6" />
    </g>
    <g v-else-if="kind === 'charm'" stroke="#bd9a44" stroke-width="2" stroke-linejoin="round">
      <path d="M39 25c-13-20 35-20 22 0" fill="none" stroke="#658eab" />
      <path d="m50 21 11 21 24 4-17 17 4 24-22-11-22 11 4-24-17-17 24-4Z" fill="#ffe584" />
      <path d="m50 35 7 16 17 1-13 12 4 16-15-9-15 9 4-16-13-12 17-1Z" fill="#fff5b3" stroke="none" />
    </g>
    <g v-else-if="kind === 'gem'" stroke="#8193c5" stroke-width="2" stroke-linejoin="round">
      <path d="m31 25 19-12 20 12 13 25-33 36L17 50Z" fill="#bfdafc" />
      <path d="m31 25 19 8 20-8-8 25H38Z" fill="#f5fcff" />
      <path d="m17 50 21 0 12 36 12-36h21M50 33V13" fill="none" />
      <path d="m50 36 8 17-8 25-8-25Z" fill="#a5b9f0" stroke="none" />
    </g>
    <g v-else-if="kind === 'box'" stroke="#629ac0" stroke-width="2" stroke-linejoin="round">
      <path d="m19 33 31-16 32 16v42L50 90 19 75Z" fill="#d0eaf9" />
      <path d="m19 33 31 17 32-17M50 50v40" fill="none" />
      <path d="m38 23 31 16v20l-12 6V45L27 28Z" fill="#fff8cb" stroke="none" />
    </g>
    <g v-else transform="rotate(-9 50 50)" stroke="#6095b9" stroke-width="2" stroke-linejoin="round">
      <path d="M39 26v14c0 8-16 12-16 24v10c0 8 10 12 27 12s27-4 27-12V64c0-12-16-16-16-24V26Z" fill="#f4fcff" />
      <path
        d="M27 62h46v11c0 7-11 9-23 9s-23-2-23-9Z"
        :fill="kind === 'cold' ? '#91caee' : kind === 'buff' ? '#c7b1ee' : '#a3e2d3'"
        stroke="none"
      />
      <rect x="35" y="16" width="30" height="14" rx="3" fill="#91bedf" />
      <path d="M40 20v6m6-6v6m7-6v6m6-6v6" stroke="#d7f0ff" />
      <rect x="35" y="53" width="30" height="22" rx="3" fill="#fff" />
      <path d="M50 57v14m-7-7h14" stroke="#55aad4" stroke-width="4" />
      <path d="M30 55v16" stroke="#fff" stroke-width="3" />
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StoreItem } from './types';
const props = defineProps<{ item: StoreItem }>();
const kind = computed(() => {
  if (props.item.shelf === 'permanent') return 'gem';
  if (props.item.category === 'equipment') {
    if (props.item.slot === '主装备') return 'shirt';
    if (props.item.slot === '饰品') return 'charm';
    return 'shield';
  }
  if (props.item.shelf === 'temp_buff') return 'buff';
  if (props.item.shelf === 'special_battle') return 'charm';
  if (props.item.effect?.pleasureReduce) return 'cold';
  return 'bottle';
});
</script>
