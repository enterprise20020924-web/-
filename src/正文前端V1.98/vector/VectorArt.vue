<template>
  <svg
    class="bpv-art"
    :class="`is-${kind}`"
    :viewBox="viewBox"
    fill="none"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient :id="`${uid}-metal`" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#ffffff" />
        <stop offset=".5" stop-color="#fcfeff" />
        <stop offset=".9" stop-color="#eef9ff" />
        <stop offset="1" stop-color="#ffffff" />
      </linearGradient>
      <linearGradient :id="`${uid}-blue`" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#4cd6ff" />
        <stop offset=".55" stop-color="#16adf0" />
        <stop offset="1" stop-color="#008cdf" />
      </linearGradient>
      <linearGradient :id="`${uid}-glass`" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#ffffff" stop-opacity=".99" />
        <stop offset="1" stop-color="#eef8ff" stop-opacity=".92" />
      </linearGradient>
      <pattern :id="`${uid}-grid`" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M24 0H0v24" stroke="#6abcf0" stroke-opacity=".14" />
      </pattern>
    </defs>

    <VectorStageFrame v-if="kind === 'frame'" :uid="uid" />

    <g v-else-if="kind === 'dock' || kind === 'trace'">
      <g v-if="kind === 'dock'">
        <path
          data-chest-contour
          :d="stageChestPath()"
          fill="#f8fdff"
          stroke="#9ce7ff"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path
          :d="stageChestPath(3.5)"
          :fill="`url(#${uid}-blue)`"
          stroke="#27c8ff"
          stroke-width="1.2"
          stroke-linejoin="round"
        />
        <path :d="stageChestPath(6.5)" stroke="#c4f6ff" stroke-width="1.2" stroke-linejoin="round" />
      </g>
      <g v-else>
        <path d="M2 35 55 3v234L2 270Z" :fill="`url(#${uid}-glass)`" stroke="#47b9ff" stroke-width="2" />
        <path d="M7 38 51 11v223L7 261Z" stroke="#d8f3ff" stroke-width="1.5" />
      </g>
    </g>

    <g v-else-if="kind === 'dialogue'">
      <path
        d="M20 9h300l16-9h391l17 9h435l20 20v170l-20 20H20L1 200V29Z"
        :fill="`url(#${uid}-glass)`"
        stroke="#9bceea"
        stroke-width="2"
      />
      <path d="M21 15h298m426 0h432l16 17v163l-19 18H24l-17-17V33Z" stroke="white" stroke-width="2" />
      <path d="M1 54v92m1198-92v92" stroke="#1fb9f1" stroke-width="4" />
      <path d="M33 192h140m854 0h140" stroke="#cfdfec" />
      <path d="m1159 30 8-8m4 8 8-8m-8 165 8-8" stroke="#69b9e8" stroke-width="2" />
      <path
        class="bpv-circuit-flow"
        d="M22 13h295m430 0h423"
        stroke="#64d4f4"
        stroke-width="2"
        stroke-dasharray="15 230"
      />
    </g>

    <g v-else>
      <path
        d="M26 3h1122l49 49v618l-30 27H28L3 672V28Z"
        :fill="`url(#${uid}-metal)`"
        stroke="#9acbea"
        stroke-width="2"
      />
      <path d="M30 12h1113l45 45v609l-25 23H32l-21-21V32Z" stroke="white" stroke-width="4" />
      <path v-if="panelGuides" d="M35 107h1130M35 613h1130" stroke="#c7e1f2" />
      <path
        d="M16 132V37l21-21h150m826 0h126l45 45v71M16 571v90l22 22h151m822 0h146l27-24v-88"
        stroke="#218fd5"
        stroke-width="3"
      />
      <path d="M758 20h344l52 48v105H758Z" :fill="`url(#${uid}-grid)`" opacity=".8" />
      <g v-if="panelGuides" stroke="#6eb7e4" stroke-width="2">
        <path d="M49 83h14m-7-7v14M1137 83h14m-7-7v14M49 640h14m-7-7v14M1137 640h14m-7-7v14" />
      </g>
      <path
        class="bpv-circuit-flow"
        d="M206 17h456m350 666H750M16 155v275"
        stroke="#36c4ee"
        stroke-width="3"
        stroke-dasharray="25 190"
      />
      <text x="870" y="667" fill="#7ba5c0" font-size="9" font-family="Consolas, monospace" letter-spacing="3">
        SHITTIM / VECTOR SYSTEM
      </text>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';
import VectorStageFrame from './VectorStageFrame.vue';
import { stageChestPath, stageLayouts } from './stage-layout';
const props = withDefaults(
  defineProps<{ kind?: 'frame' | 'dock' | 'trace' | 'dialogue' | 'panel'; panelGuides?: boolean }>(),
  { kind: 'frame', panelGuides: true },
);
const uid = useId();
const chestRect = stageLayouts.wide.chest;
const viewBox = computed(() =>
  props.kind === 'frame'
    ? '0 0 1600 1000'
    : props.kind === 'dock'
      ? `${chestRect.x} ${chestRect.y} ${chestRect.width} ${chestRect.height}`
      : props.kind === 'trace'
        ? '0 0 58 272'
        : props.kind === 'dialogue'
          ? '0 0 1200 220'
          : '0 0 1200 700',
);
</script>

<style>
.bpv-art {
  display: block;
  overflow: visible;
  pointer-events: none;
}
.bpv-frame-compact {
  display: none;
}
.bpv-header-plates {
  filter: drop-shadow(0 2px 3px #63c5fa26);
}
@container bp-host (max-width: 560px) {
  .bpv-frame-wide {
    display: none;
  }
  .bpv-frame-compact {
    display: inline;
  }
}
.bpv-circuit-flow {
  animation: bpv-circuit 12s linear infinite;
}
.bpv-signal-bars {
  animation: bpv-spark 3.8s ease-in-out infinite;
}
@keyframes bpv-circuit {
  to {
    stroke-dashoffset: -368;
  }
}
</style>
