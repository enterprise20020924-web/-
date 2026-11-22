<template>
  <svg
    class="amami-map-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name]" />
  </svg>
</template>

<script setup lang="ts">
const paths = {
  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  target: 'M12 2v4m0 12v4M2 12h4m12 0h4M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
  labels: 'M4 4h10l7 7-10 10-7-7V4Zm4 3v.01',
  minus: 'M5 12h14',
  plus: 'M5 12h14m-7-7v14',
  fit: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  close: 'm6 6 12 12M6 18 18 6',
  search: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM16 16l5 5',
  back: 'm10 5-7 7 7 7M3 12h18',
  chevron: 'm9 5 7 7-7 7',
  check: 'm5 12 4 4 10-10',
  bookmark: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  bank: 'm3 9 9-6 9 6H3Zm2 3v6m5-6v6m4-6v6m5-6v6M3 21h18',
  shop: 'M4 9v12h16V9M3 9l2-6h14l2 6M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 21v-7h6v7',
  work: 'M8 6V3h8v3M3 7h18v14H3V7Zm0 6c5 3 13 3 18 0M10 13h4v4h-4v-4Z',
  battle:
    'm4 3 5 1 13 13-5 5L4 9 3 4l1-1Zm3 4 11 11m-4 3 7-7M4 21l4-4m-5 2 2 2m12-17 4-1-1 4-4 4M11 16l-4 4-3 1 1-3 3-4',
  basket: 'M3 9h18l-2 12H5L3 9Zm4 0 5-7 5 7M9 13v4m6-4v4',
  shuffle: 'M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 3-2 5-5m2-2c2-3 3-5 5-5h3m-4-4 4 4-4 4',
} as const;
defineProps<{ name: keyof typeof paths }>();
</script>
