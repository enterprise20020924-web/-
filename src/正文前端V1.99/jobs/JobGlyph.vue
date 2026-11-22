<template>
  <svg
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    stroke-width="1.65"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>

<script setup lang="ts">
import type { CampusJob } from './catalog';
defineProps<{ name: CampusJob['icon'] }>();
const paths = {
  gift: 'M4 12h24v6H4zM6 18v11h20V18M16 12v17M16 12C7 12 6 8 8 5c3-4 8 2 8 7Zm0 0c9 0 10-4 8-7-3-4-8 2-8 7Z',
  dress: 'm11 4 5 3 5-3 6 6-4 4-3-2 1 16H11l1-16-3 2-4-4 6-6ZM12 20h8M13 6c0 5 6 5 6 0',
  meal: 'M5 18a11 11 0 0 1 22 0H5Zm-2 4h26M7 27h18M16 4v3m-3-3h6M7 12l2-2',
  beach: 'M3 16a13 13 0 0 1 26 0H3Zm13-13c-6 4-7 8-7 13m7-13c6 4 7 8 7 13M16 16v9c0 5 7 5 7 0M3 29h10',
  book: 'M16 7C12 4 6 4 3 5v22c4-2 9-1 13 1 4-2 9-3 13-1V5c-3-1-9-1-13 2Zm0 0v21M7 11h5m-5 5h5m8-5h5m-5 5h5',
  onsen:
    'M5 20c-5 5 1 9 11 9s16-4 11-9M9 20c-3 3 1 5 7 5s10-2 7-5M9 16c-5-6 4-7 0-12m7 12c-5-6 4-7 0-12m7 12c-5-6 4-7 0-12',
};
</script>
