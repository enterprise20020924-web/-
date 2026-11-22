<template>
  <svg
    ref="surface"
    :class="['p5-bubble-svg', `is-${side}`, { 'has-tail': hasTail, 'is-active': active }]"
    :viewBox="`0 0 ${w} ${h}`"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <clipPath :id="`${uid}-clip`">
        <path :d="bubblePath" />
      </clipPath>
    </defs>

    <!-- Layer 1: Hard solid comic offset shadow (no muddy blur) -->
    <path
      v-if="bubblePath"
      class="p5-bub-shadow"
      :d="bubblePath"
      :transform="shadowTransform"
    />

    <!-- Layer 2: Main asymmetric polygon comic bubble with crisp mitered thick border -->
    <path
      v-if="bubblePath"
      class="p5-bub-body"
      :d="bubblePath"
      vector-effect="non-scaling-stroke"
    />

    <!-- Layer 3: Clipped internal diagonal comic slash & highlight accent -->
    <g v-if="bubblePath" :clip-path="`url(#${uid}-clip)`">
      <path class="p5-bub-sheen" :d="sheenPath" />
      <path class="p5-bub-slash" :d="slashPath" />
    </g>

    <!-- Layer 4: Inner crisp hairline edge for extra comic print craft -->
    <path
      v-if="innerRimPath"
      class="p5-bub-inner"
      :d="innerRimPath"
      fill="none"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<script setup lang="ts">
import { useElementSize } from '@vueuse/core';
import { computed, ref, useId } from 'vue';

const props = withDefaults(
  defineProps<{
    side?: 'left' | 'right' | 'center';
    hasTail?: boolean;
    active?: boolean;
  }>(),
  { side: 'left', hasTail: false, active: false },
);

const uid = `p5-bub-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
const surface = ref<SVGSVGElement | null>(null);
const { width, height } = useElementSize(surface);

const w = computed(() => Math.max(1, Math.round(width.value || 1)));
const h = computed(() => Math.max(1, Math.round(height.value || 1)));

const shadowTransform = computed(() =>
  props.side === 'right' ? 'translate(-6, 6)' : 'translate(6, 6)',
);

const bubblePath = computed(() => {
  const W = w.value;
  const H = h.value;
  if (W < 24 || H < 20) return '';

  const slant = Math.min(13, Math.max(6, Math.round(H * 0.14)));

  if (props.side === 'right') {
    // Player bubble: dynamic asymmetric polygon with 2-joint jagged comic tail pointing RIGHT
    const tlX = slant;
    const tlY = 1.5;
    const trX = W - 2;
    const trY = 4;
    const brX = W - 8;
    const brY = H - 2;
    const blX = 2;
    const blY = H - 5;

    if (!props.hasTail) {
      return `M ${tlX} ${tlY} L ${trX} ${trY} L ${brX} ${brY} L ${blX} ${blY} Z`;
    }

    const ty1 = Math.min(20, H * 0.3);
    const ty2 = Math.min(39, H * 0.62);
    const tail = [
      `L ${trX - 1} ${ty1}`,
      `L ${trX + 12} ${ty1 - 4}`,
      `L ${trX + 6} ${ty1 + 5}`,
      `L ${trX + 25} ${ty1 + 8}`,
      `L ${trX + 4} ${ty2 - 2}`,
      `L ${trX + 10} ${ty2 + 3}`,
      `L ${trX - 3} ${ty2 + 2}`,
    ].join(' ');
    return `M ${tlX} ${tlY} L ${trX} ${trY} ${tail} L ${brX} ${brY} L ${blX} ${blY} Z`;
  }

  if (props.side === 'center') {
    return `M ${slant} 2 L ${W - 2} 1 L ${W - slant} ${H - 2} L 2 ${H - 1} Z`;
  }

  // NPC bubble (left): dynamic asymmetric polygon with 2-joint jagged comic tail pointing LEFT
  const tlX = 2;
  const tlY = 4;
  const trX = W - slant;
  const trY = 1.5;
  const brX = W - 2;
  const brY = H - 5;
  const blX = 8;
  const blY = H - 2;

  if (!props.hasTail) {
    return `M ${tlX} ${tlY} L ${trX} ${trY} L ${brX} ${brY} L ${blX} ${blY} Z`;
  }

  const ty1 = Math.min(20, H * 0.3);
  const ty2 = Math.min(39, H * 0.62);
  const tail = [
    `L ${tlX + 3} ${ty2 + 2}`,
    `L ${tlX - 10} ${ty2 + 3}`,
    `L ${tlX - 4} ${ty2 - 2}`,
    `L ${tlX - 25} ${ty1 + 8}`,
    `L ${tlX - 6} ${ty1 + 5}`,
    `L ${tlX - 12} ${ty1 - 4}`,
    `L ${tlX + 1} ${ty1}`,
  ].join(' ');
  return `M ${tlX} ${tlY} L ${trX} ${trY} L ${brX} ${brY} L ${blX} ${blY} ${tail} Z`;
});

const sheenPath = computed(() => {
  const W = w.value;
  const H = h.value;
  const x1 = Math.round(W * 0.72);
  const x2 = Math.round(W * 0.84);
  const lean = Math.round(H * 0.28);
  return `M ${x1} 0 H ${x2} L ${x2 - lean} ${H} H ${x1 - lean} Z`;
});

const slashPath = computed(() => {
  const W = w.value;
  const H = h.value;
  if (props.side === 'right') {
    return `M 0 ${H - 24} L 24 ${H} H 0 Z`;
  }
  return `M ${W - 22} 0 H ${W} V 22 Z`;
});

const innerRimPath = computed(() => {
  const W = w.value;
  const H = h.value;
  if (W < 40 || H < 30) return '';
  if (props.side === 'right') {
    return `M 16 5.5 H ${W - 10}`;
  }
  return `M 10 5.5 H ${W - 16}`;
});
</script>

<style scoped>
.p5-bubble-svg {
  position: absolute;
  z-index: -1;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.p5-bub-shadow {
  fill: var(--p5-bub-shadow, rgba(22, 56, 232, 0.36));
  transition:
    transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    fill 160ms ease;
}

.p5-bub-body {
  fill: var(--p5-bub-fill, #08144a);
  stroke: var(--p5-bub-stroke, #ffffff);
  stroke-width: 3.2;
  stroke-linejoin: miter;
  stroke-miterlimit: 6;
  paint-order: stroke fill;
  transition:
    fill 160ms ease,
    stroke 160ms ease;
}

.p5-bub-sheen {
  fill: var(--p5-bub-sheen, rgba(255, 255, 255, 0.06));
}

.p5-bub-slash {
  fill: var(--p5-bub-accent, #f43252);
  opacity: 0.9;
  transition: fill 160ms ease;
}

.p5-bub-inner {
  stroke: var(--p5-bub-inner, rgba(36, 226, 248, 0.42));
  stroke-width: 1.2;
}
</style>
