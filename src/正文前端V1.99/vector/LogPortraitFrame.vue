<template>
  <!-- Background irregular P5R trapezoid frame (sits behind pop-out head/shoulders) -->
  <svg
    v-if="layer === 'back'"
    class="p5-portrait-back"
    :class="{ 'is-mirrored': mirrored }"
    viewBox="0 0 200 176"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Hard offset comic drop-shadow -->
    <path class="p5-pf-shadow" d="M12 43 170 61 200 155 58 180Z" />
    <!-- Outer bold black/deep-ink irregular trapezoid -->
    <path class="p5-pf-ink" d="M5 36 164 54 195 148 52 174Z" />
    <!-- Crisp pure-white inner frame collar -->
    <path class="p5-pf-white" d="M21 48 154 64 180 141 61 161Z" />
    <!-- Vivid solid sky-blue / rose color backdrop -->
    <path class="p5-pf-fill" d="M30 56 147 70 171 136 68 153Z" />
  </svg>

  <!-- Foreground bottom collar (seals character's lower shoulder edge cleanly behind white+black rim while head bursts out top) -->
  <svg
    v-else
    class="p5-portrait-front"
    :class="{ 'is-mirrored': mirrored }"
    viewBox="0 0 200 176"
    preserveAspectRatio="none"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Inner white bottom rim overlapping character's lower cut -->
    <path class="p5-pf-white" d="M64 152 172 135 181 141 60 162Z" />
    <!-- Outer thick black bottom rim sealing the lower edge cleanly -->
    <path class="p5-pf-ink" d="M60 162 181 141 195 148 52 174Z" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    layer?: 'back' | 'front';
    mirrored?: boolean;
  }>(),
  { layer: 'back', mirrored: false },
);
</script>

<style scoped>
.p5-portrait-back,
.p5-portrait-front {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.p5-portrait-back {
  z-index: 0;
}
.p5-portrait-front {
  z-index: 3;
}
.p5-portrait-back.is-mirrored,
.p5-portrait-front.is-mirrored {
  transform: scaleX(-1);
}
.p5-pf-shadow {
  fill: var(--p5-port-shadow, rgba(6, 13, 44, 0.22));
  transition: fill 150ms ease;
}
.p5-pf-ink {
  fill: var(--p5-port-ink, #040712);
}
.p5-pf-white {
  fill: #ffffff;
}
.p5-pf-fill {
  fill: var(--p5-port-fill, #70c8fb);
  transition: fill 150ms ease;
}
</style>
