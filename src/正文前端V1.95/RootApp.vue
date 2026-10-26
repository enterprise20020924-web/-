<template>
  <DesktopApp v-if="context.layout_mode === 'desktop'" :style="textSizeStyle" />
  <MobileApp v-else :style="textSizeStyle" />
</template>

<script setup lang="ts">
import { inject } from 'vue';
import DesktopApp from './App.vue';
import MobileApp from './mobile/MobileApp.vue';
import type { ContentRendererContext } from './types/content-renderer';
import { useNarrativeTextSize } from './modules/narrative-text-size';

const { textSizeStyle } = useNarrativeTextSize();

const context = inject<Pick<ContentRendererContext, 'layout_mode'>>('content_renderer_context');
if (context === undefined) {
  throw Error('[content-chat-renderer] missing content renderer context');
}
</script>
