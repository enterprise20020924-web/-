<template>
  <button
    type="button"
    class="amami-map-quick-tab amami-map-bank-tab"
    :class="{
      'amami-map-shop-tab': kind === 'shop',
      'amami-map-jobs-tab': kind === 'jobs',
      'amami-map-training-tab': kind === 'training',
    }"
    :aria-label="label"
    :title="label"
    @click="$emit('open')"
  >
    <span class="amami-map-bank-portrait" aria-hidden="true"><img :src="artwork" alt="" draggable="false" /></span>
    <svg class="amami-map-bank-frame" viewBox="0 0 248 64" preserveAspectRatio="none" aria-hidden="true">
      <path d="M1 1h161l-24 62H1Z" fill="#f8fcff" />
      <path d="M151 1h9l-24 62h-9Zm16 0h3l-24 62h-3Z" fill="#67d7f5" />
      <path d="M1 1h23l-7 5H5v45H1Z" fill="#39c6ee" />
      <path d="M1 1h236l10 10v43l-9 9H1Z" fill="none" stroke="#fff" stroke-width="2" />
      <path d="M8 59h75m6 0h11" stroke="#b9d9e9" />
    </svg>
    <span class="amami-map-bank-copy">
      <span class="amami-map-bank-title"
        ><MapIcon :name="shortcutIcons[kind]" /><strong>{{ label }}</strong></span
      >
      <small>{{ caption }}</small>
    </span>
    <MapIcon class="amami-map-bank-arrow" name="chevron" />
  </button>
</template>

<script setup lang="ts">
import MapIcon from './MapIcon.vue';
const shortcutIcons = { bank: 'bank', shop: 'shop', jobs: 'work', training: 'battle' } as const;
defineProps<{ kind: 'bank' | 'shop' | 'jobs' | 'training'; label: string; caption: string; artwork: string }>();
defineEmits<{ open: [] }>();
</script>
