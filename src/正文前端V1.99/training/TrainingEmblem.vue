<template>
  <svg class="amami-training-emblem" viewBox="0 0 100 100" aria-hidden="true">
    <path d="m50 2 12 27 29-7-17 27 17 29-29-7-12 27-12-27-29 7 17-29L9 22l29 7Z" class="amami-training-emblem-star" />
    <path d="m50 14 10 25 26 10-26 11-10 26-11-26-25-11 25-10Z" class="amami-training-emblem-core" />
    <path
      v-if="kind === 'sword'"
      d="m50 17 7 15-3 29 12 6-5 5-9-4v12h-4V68l-9 4-5-5 12-6-3-29Z"
      class="amami-training-emblem-mark"
    />
    <path
      v-else-if="kind === 'shield'"
      d="m50 23 19 8-3 25c-2 10-9 17-16 22-7-5-14-12-16-22l-3-25 19-8Zm0 9v34m-11-22h22"
      class="amami-training-emblem-mark is-shield"
    />
    <path
      v-else
      d="m50 24 7 19 20 7-20 7-7 20-7-20-20-7 20-7Zm0-9v-5m0 80v-5M15 50h-5m80 0h-5"
      class="amami-training-emblem-mark"
    />
  </svg>
</template>

<script setup lang="ts">
import type { TrainingEmblem } from './catalog';
defineProps<{ kind: TrainingEmblem }>();
</script>
