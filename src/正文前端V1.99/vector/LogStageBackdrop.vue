<template>
  <svg
    class="p5-sns-backdrop"
    viewBox="0 0 1200 720"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <pattern :id="`${uid}-halftone`" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-16)">
        <circle cx="4" cy="4" r="1.4" fill="var(--p5-dot-color, rgba(9, 22, 74, 0.08))" />
      </pattern>
      <linearGradient :id="`${uid}-sweep`" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="var(--p5-sweep-0, rgba(22, 62, 232, 0.09))" />
        <stop offset="60%" stop-color="var(--p5-sweep-1, rgba(36, 226, 248, 0.05))" />
        <stop offset="100%" stop-color="var(--p5-sweep-2, rgba(9, 22, 74, 0))" />
      </linearGradient>
      <linearGradient :id="`${uid}-spine-grad`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--p5-spine-top, rgba(9, 22, 74, 0.06))" />
        <stop offset="22%" stop-color="var(--p5-spine-mid, rgba(9, 22, 74, 0.16))" />
        <stop offset="78%" stop-color="var(--p5-spine-mid, rgba(9, 22, 74, 0.16))" />
        <stop offset="100%" stop-color="var(--p5-spine-top, rgba(9, 22, 74, 0.06))" />
      </linearGradient>
      <clipPath :id="`${uid}-dot-zone`">
        <path d="M840 0H1200V460L980 720H680L1010 260Z" />
      </clipPath>
    </defs>

    <!-- Large architectural tonal facets (same-hue depth, zero noisy color blocks) -->
    <path d="M0 0H390L170 720H0Z" fill="var(--p5-plane-a, rgba(9, 22, 74, 0.045))" />
    <path d="M960 0H1200V720H790Z" fill="var(--p5-plane-b, rgba(9, 22, 74, 0.06))" />
    <path d="M290 0H660L420 720H90Z" :fill="`url(#${uid}-sweep)`" />

    <!-- Subtle comic halftone texture confined to one sweeping diagonal plane -->
    <rect width="1200" height="720" :fill="`url(#${uid}-halftone)`" :clip-path="`url(#${uid}-dot-zone)`" />

    <!-- Restrained P5R jagged center-spine silhouette stitching the bubbles -->
    <g class="p5-sns-spine">
      <path
        d="M594 -20 634 136 566 274 642 430 572 578 626 740H598L546 578 614 430 540 274 606 136 566 -20Z"
        :fill="`url(#${uid}-spine-grad)`"
      />
      <path
        d="M594 -20 634 136 566 274 642 430 572 578 626 740"
        fill="none"
        stroke="var(--p5-spine-line, rgba(36, 226, 248, 0.42))"
        stroke-width="1.5"
        vector-effect="non-scaling-stroke"
      />
    </g>

    <!-- Two razor-thin editorial speed-lines on outer edges -->
    <path
      d="M118 0 0 218"
      fill="none"
      stroke="var(--p5-hairline-a, rgba(36, 226, 248, 0.55))"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
    />
    <path
      d="M134 0 0 246"
      fill="none"
      stroke="var(--p5-hairline-b, rgba(244, 50, 82, 0.45))"
      stroke-width="1"
      vector-effect="non-scaling-stroke"
    />
    <path
      d="M1200 450 1044 720"
      fill="none"
      stroke="var(--p5-hairline-a, rgba(36, 226, 248, 0.5))"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
    />
    <path
      d="M1200 422 1026 720"
      fill="none"
      stroke="var(--p5-hairline-b, rgba(244, 50, 82, 0.4))"
      stroke-width="1"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
const uid = `p5-bg-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
</script>

<style scoped>
.p5-sns-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}
</style>
