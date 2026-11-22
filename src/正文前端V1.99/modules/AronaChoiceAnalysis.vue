<template>
  <section class="bp-choice-analysis" aria-label="选项分析">
    <svg class="bp-choice-analysis-top" viewBox="24 24 1936 436" aria-hidden="true" focusable="false">
      <image :href="frameUrl" width="1984" height="686" />
    </svg>
    <div class="bp-choice-analysis-body">
      <svg
        class="bp-choice-analysis-middle"
        viewBox="24 460 1936 95"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <image :href="frameUrl" width="1984" height="686" />
      </svg>
      <p class="bp-choice-analysis-text">{{ text }}</p>
    </div>
    <svg class="bp-choice-analysis-bottom" viewBox="24 555 1936 107" aria-hidden="true" focusable="false">
      <image :href="frameUrl" width="1984" height="686" />
    </svg>
  </section>
</template>

<script setup lang="ts">
import { resolveFullbodyAssetUrl } from '../portrait-registry';

defineProps<{ text: string }>();
const frameUrl = resolveFullbodyAssetUrl('阿洛娜COT.png');
</script>

<style scoped>
.bp-choice-analysis {
  inline-size: 100%;
  margin: 0;
  isolation: isolate;
}
.bp-choice-analysis-top,
.bp-choice-analysis-bottom {
  display: block;
  inline-size: 100%;
  block-size: auto;
  overflow: hidden;
  pointer-events: none;
}
.bp-choice-analysis-top {
  aspect-ratio: 1936 / 436;
}
.bp-choice-analysis-bottom {
  aspect-ratio: 1936 / 107;
}
.bp-choice-analysis-body {
  position: relative;
  min-block-size: 64px;
  padding-inline: 4.5%;
}
.bp-choice-analysis-middle {
  position: absolute;
  z-index: -1;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  pointer-events: none;
}
.bp-choice-analysis-text {
  margin: 0;
  padding: 0;
  color: #163f61;
  font: inherit;
  font-size: calc(clamp(13px, 1.2cqi, 17px) * var(--bp-reading-scale, 1));
  line-height: 1.8;
  text-shadow: none;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>
