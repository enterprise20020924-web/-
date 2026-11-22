<template>
  <svg viewBox="0 0 56 36" aria-hidden="true" :style="{ color: tone }">
    <path d="M9 2H56L46 34H0Z" fill="#060b42" />
    <path d="M26 2H56L46 34Z" fill="currentColor" opacity=".25" />
    <path
      v-if="kind === 'passive'"
      d="m27 6 16 10-5 14H18L13 16Zm0 6-8 6 3 8h11l3-8Z"
      fill="currentColor"
      fill-rule="evenodd"
    />
    <path v-else-if="kind === 'recovery'" d="M24 7h10l-3 9h10l-3 8H28l-2 7H16l3-7H9l3-8h9Z" fill="currentColor" />
    <path v-else-if="kind === 'support'" d="m12 25 13-13 8 8 8-10 5 5-13 16-8-8-8 8Z" fill="currentColor" />
    <path v-else-if="kind === 'debuff'" d="m11 11 8-6 8 9 9-7 9 12-7 7-8-8-10 8Z" fill="currentColor" />
    <g v-else-if="kind === 'mental'" fill="none" stroke="currentColor" stroke-width="3">
      <path d="M10 19Q27-1 44 19 27 39 10 19Z" />
      <circle cx="27" cy="19" r="6" />
    </g>
    <path v-else-if="kind === 'attack'" d="M41 4 24 17 36 18 11 33 20 20 9 20Z" fill="currentColor" />
    <path v-else d="m28 6 13 12-13 13-13-13Zm0 6-6 6 6 7 6-7Z" fill="currentColor" fill-rule="evenodd" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ type: string }>();
const kind = computed(() => {
  if (/被动/.test(props.type)) return 'passive';
  if (/回复|恢复|治疗/.test(props.type)) return 'recovery';
  if (/削弱|减益|控制/.test(props.type)) return 'debuff';
  if (/辅助|增益|强化/.test(props.type)) return 'support';
  if (/精神/.test(props.type)) return 'mental';
  if (/物理|攻击/.test(props.type)) return 'attack';
  return 'generic';
});
const tone = computed(
  () =>
    ({
      passive: '#a9a5ff',
      recovery: '#4df7e7',
      support: '#75cfff',
      debuff: '#d992ef',
      attack: '#ffcc55',
      mental: '#cda2ff',
      generic: '#75cfff',
    })[kind.value],
);
</script>
