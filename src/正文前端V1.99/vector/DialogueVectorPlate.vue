<template>
  <svg
    class="bp-dv-plate"
    :class="[`is-${variant}`, { 'is-active': active }]"
    :viewBox="spec.viewBox"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient :id="`${uid}-bg`" x1="0" y1="0" x2="0.92" y2="1">
        <stop offset="0%" stop-color="var(--dv-bg-0, #0d227a)" />
        <stop offset="56%" stop-color="var(--dv-bg-1, #09185a)" />
        <stop offset="100%" stop-color="var(--dv-bg-2, #1436c8)" />
      </linearGradient>
      <linearGradient :id="`${uid}-sheen`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34" />
        <stop offset="52%" stop-color="#ffffff" stop-opacity="0.02" />
        <stop offset="100%" stop-color="#24e2f8" stop-opacity="0.18" />
      </linearGradient>
      <clipPath :id="`${uid}-clip`">
        <path :d="spec.body" />
      </clipPath>
    </defs>

    <!-- Crisp geometric offset depth shadow -->
    <path v-if="spec.shadow" class="bp-dv-shadow" :d="spec.shadow" />

    <!-- Main vector surface -->
    <path class="bp-dv-surface" :d="spec.body" :fill="`url(#${uid}-bg)`" />

    <!-- Clipped interior highlights, glass sheen & parallel slanted accent bar -->
    <g :clip-path="`url(#${uid}-clip)`">
      <path class="bp-dv-sheen" :d="spec.sheen" :fill="`url(#${uid}-sheen)`" />
      <path class="bp-dv-glint" :d="spec.glint" vector-effect="non-scaling-stroke" />
      <path v-if="spec.bar" class="bp-dv-bar" :d="spec.bar" />
      <path v-if="spec.notch" class="bp-dv-notch" :d="spec.notch" />
      <path v-if="spec.rail" class="bp-dv-rail" :d="spec.rail" vector-effect="non-scaling-stroke" />
    </g>

    <!-- Complete 4-sided non-scaling vector stroke -->
    <path
      class="bp-dv-rim"
      :d="spec.body"
      fill="none"
      vector-effect="non-scaling-stroke"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';

export type DialoguePlateVariant = 'speaker' | 'affiliation' | 'chip' | 'prev' | 'counter' | 'next' | 'restart';

const props = defineProps<{
  variant: DialoguePlateVariant;
  active?: boolean;
}>();

const uid = `bp-dv-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

interface PlateSpec {
  viewBox: string;
  body: string;
  shadow?: string;
  sheen: string;
  glint: string;
  bar?: string;
  notch?: string;
  rail?: string;
}

const SPECS: Record<DialoguePlateVariant, PlateSpec> = {
  speaker: {
    viewBox: '0 0 160 42',
    shadow: 'M13 4.8H160L152 42H5Z',
    body: 'M10 1.8H157.5L149.5 39.2H2Z',
    sheen: 'M106 1.8H134L126 39.2H98Z',
    glint: 'M13 3.2H154',
    bar: 'M10 1.8H16.5L8.5 39.2H2Z',
    notch: 'M10 1.8H16.5L13.9 14H7.4Z',
    rail: 'M16 37H124',
  },
  affiliation: {
    viewBox: '0 0 116 28',
    shadow: 'M5 4H116L110 28H0Z',
    body: 'M6 1.4H113.5L107.5 25.8H1Z',
    sheen: 'M66 1.4H88L82 25.8H60Z',
    glint: 'M8 2.8H109',
    bar: 'M108.5 1.4H113.5L107.5 25.8H102.5Z',
  },
  chip: {
    viewBox: '0 0 104 28',
    body: 'M8 1.4H102.5L96 26.6H1.5Z',
    sheen: 'M64 1.4H84L77.5 26.6H57.5Z',
    glint: 'M10 2.8H99',
    bar: 'M8 1.4H13.5L7 26.6H1.5Z',
  },
  prev: {
    viewBox: '0 0 112 34',
    shadow: 'M7.5 4H108L100.5 34H0Z',
    body: 'M10 1.5H110.5L103 31.5H2.5Z',
    sheen: 'M72 1.5H92L84.5 31.5H64.5Z',
    glint: 'M12 3H107',
    bar: 'M10 1.5H15.5L8 31.5H2.5Z',
    rail: 'M18 29.2H88',
  },
  counter: {
    viewBox: '0 0 92 34',
    body: 'M9 1.5H90.5L83 32.5H1.5Z',
    sheen: 'M56 1.5H74L66.5 32.5H48.5Z',
    glint: 'M11 3H87',
    notch: 'M11 3.5H26L24.8 6.8H9.8Z',
    rail: 'M15 30H75',
  },
  next: {
    viewBox: '0 0 112 34',
    shadow: 'M11.5 4H112L104.5 34H4Z',
    body: 'M9 1.5H109.5L102 31.5H1.5Z',
    sheen: 'M64 1.5H84L76.5 31.5H56.5Z',
    glint: 'M11 3H106',
    bar: 'M104 1.5H109.5L102 31.5H96.5Z',
    notch: 'M11.5 3.6H26L24.8 6.8H10.3Z',
    rail: 'M16 29.2H90',
  },
  restart: {
    viewBox: '0 0 112 34',
    shadow: 'M11.5 4H112L104.5 34H4Z',
    body: 'M9 1.5H109.5L102 31.5H1.5Z',
    sheen: 'M64 1.5H84L76.5 31.5H56.5Z',
    glint: 'M11 3H106',
    bar: 'M104 1.5H109.5L102 31.5H96.5Z',
    notch: 'M11.5 3.6H26L24.8 6.8H10.3Z',
    rail: 'M16 29.2H90',
  },
};

const spec = computed(() => SPECS[props.variant]);
</script>
