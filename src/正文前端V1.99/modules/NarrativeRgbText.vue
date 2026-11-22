<template>
  <span class="bp-rgb-text">
    <template v-for="(part, index) in parts" :key="index">
      <span
        v-if="part.name"
        class="bp-rgb-name"
        :data-rgb-name="part.name"
        :style="{ color: rgbNameColors(part.name)[dark ? 1 : 0] }"
        >{{ part.text }}</span
      ><template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { rgbNameColors, splitRgbDisplayParts } from '../engine/rgb-names';
import type { RgbNameSpan } from '../engine/rgb-names';

const props = withDefaults(defineProps<{ text: string; rgbSpans?: RgbNameSpan[]; dark?: boolean }>(), { dark: false });
const parts = computed(() => splitRgbDisplayParts(props.text, props.rgbSpans));
</script>

<style scoped>
.bp-rgb-text {
  font: inherit;
  color: inherit;
}
.bp-rgb-name {
  font-weight: 700;
}
</style>
