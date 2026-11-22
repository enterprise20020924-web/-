<template>
  <svg class="shittim-scene" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient :id="`${id}-depth`" x1="0" y1="0" x2="0.42" y2="1">
        <stop stop-color="#148ff1" />
        <stop offset=".35" stop-color="#0748db" />
        <stop offset=".72" stop-color="#1015a9" />
        <stop offset="1" stop-color="#060857" />
      </linearGradient>
      <linearGradient :id="`${id}-surface`" x1="0" y1="0" x2="1" y2=".2">
        <stop stop-color="#35f4ef" stop-opacity=".8" />
        <stop offset="1" stop-color="#2386ff" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path d="M0 0H1440V900H0Z" :fill="`url(#${id}-depth)`" />
    <g class="shittim-scene-water" :fill="`url(#${id}-surface)`">
      <path d="M-80 16 210 0 400 28 650 6 880 40 1180 0H1480L1320 49 1080 60 840 51 650 78 380 60 180 91-80 66Z" />
      <path
        d="M-90 110 80 100 188 122 374 90 536 113 745 102 903 126 1150 95 1440 117V151L1177 132 924 158 703 137 493 151 281 134 62 157-90 143Z"
        opacity=".65"
      />
      <path
        d="M-40 202 222 175 410 210 618 177 830 203 1120 171 1430 199 1480 229 1220 214 998 243 784 226 570 248 333 228 111 248-40 231Z"
        opacity=".35"
      />
    </g>
    <g fill="none" stroke="#37b3ff" opacity=".1">
      <path d="M730 155 470 900M850 140 800 900M960 120 1140 900M1060 90 1460 900" stroke-width="28" />
      <path d="M570 480H1440M530 585H1440M480 725H1440M0 870 1440 630" stroke-width="2" />
      <ellipse cx="900" cy="355" rx="180" ry="185" stroke-width="18" />
      <ellipse cx="900" cy="355" rx="155" ry="160" stroke-width="2" />
      <path d="M900 220V355L1005 405M740 355H1060M900 195V515" stroke-width="4" />
    </g>
    <path d="M1440 248 590 900H790L1440 396Z" fill="#063dd7" opacity=".6" />
    <path d="M1440 450 930 900H1440Z" fill="#0a0772" opacity=".38" />
    <path d="M0 835 1440 560V900H0Z" fill="#0b0d9a" opacity=".24" />
    <g class="shittim-scene-shards">
      <path d="m640 303 14-25 18 31-18 13Z" fill="#32e9ff" opacity=".6" />
      <path d="m1232 162 8-23 19 28-11 10Z" fill="#fa478e" opacity=".6" />
      <path d="m781 740 18-18-4 29-17 9Z" fill="#8658ff" />
      <path d="m109 725 12-25 16 29-12 7Z" fill="#24cbff" opacity=".55" />
      <path d="m1350 625 11-24 14 29-9 6Z" fill="#ff538e" opacity=".6" />
    </g>
    <path d="M0 899H1440" stroke="#57eafa" stroke-opacity=".7" stroke-width="2" />
  </svg>
</template>

<script setup lang="ts">
import { useId } from 'vue';
const id = `shittim-scene-${useId()}`;
</script>

<style scoped>
.shittim-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.shittim-scene-water {
  animation: shittim-water 14s ease-in-out infinite alternate;
}
.shittim-scene-shards {
  animation: shittim-drift 9s ease-in-out infinite alternate;
}
@keyframes shittim-water {
  to {
    transform: translate(34px, -8px);
  }
}
@keyframes shittim-drift {
  to {
    transform: translate(8px, -14px);
    opacity: 0.5;
  }
}
@media (prefers-reduced-motion: reduce) {
  .shittim-scene-water,
  .shittim-scene-shards {
    animation: none;
  }
}
</style>
