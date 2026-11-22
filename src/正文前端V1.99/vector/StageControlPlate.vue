<template>
  <svg
    class="bp-stage-ctrl-plate"
    :class="{ 'is-active': active, 'is-primary': variant === 'primary' }"
    viewBox="0 0 100 44"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient :id="`${uid}-surf`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--bp-ctrl-bg-top, #ffffff)" />
        <stop offset="56%" stop-color="var(--bp-ctrl-bg-mid, #f4fbff)" />
        <stop offset="100%" stop-color="var(--bp-ctrl-bg-bot, #e2f4ff)" />
      </linearGradient>
      <linearGradient :id="`${uid}-sheen`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
        <stop offset="48%" stop-color="#ffffff" stop-opacity="0" />
        <stop offset="100%" stop-color="#24e2f8" stop-opacity="0.16" />
      </linearGradient>
      <clipPath :id="`${uid}-clip`">
        <path :d="innerPath" />
      </clipPath>
    </defs>

    <!-- Outer crisp bezel with complete four-sided slanted stroke -->
    <path
      class="bp-stage-ctrl-rim"
      :d="outerPath"
      vector-effect="non-scaling-stroke"
      stroke-linejoin="round"
    />

    <!-- Inner surface fill -->
    <path
      class="bp-stage-ctrl-surface"
      :d="innerPath"
      :fill="`url(#${uid}-surf)`"
    />

    <!-- Subtle P3R diagonal glass sheen clipped strictly inside the inner bevel -->
    <g :clip-path="`url(#${uid}-clip)`">
      <path class="bp-stage-ctrl-sheen" d="M68 0H84L72 44H56Z" :fill="`url(#${uid}-sheen)`" />
      <path class="bp-stage-ctrl-top-glint" d="M11 3.5H95" vector-effect="non-scaling-stroke" />
    </g>

    <!-- Left-top precision status notch -->
    <path class="bp-stage-ctrl-notch" d="M10.5 3.5H20L18.2 7.5H9.4Z" />

    <!-- Bottom cyan/cobalt accent rail echoing StageMapButton -->
    <path
      class="bp-stage-ctrl-accent"
      d="M22 40.5H78"
      vector-effect="non-scaling-stroke"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
  active?: boolean;
  variant?: 'primary' | 'default';
}>();

const uid = `bp-ctrl-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
// Slanted parallelogram with crisp 4-sided vector perimeter (lean matches VectorStageFrame).
const outerPath = 'M9.5 1.5H97.5L90.5 42.5H2.5Z';
const innerPath = 'M11 3H95.8L89.2 41H4.2Z';
</script>
