<template>
  <DesktopApp
    v-if="context.layout_mode === 'desktop'"
    :style="[textSizeStyle, portraitSizeStyle]"
    :data-portrait-size="portraitSizePercent"
  />
  <MobileApp v-else :style="[textSizeStyle, portraitSizeStyle]" :data-portrait-size="portraitSizePercent" />
</template>

<script setup lang="ts">
import { inject, onMounted } from 'vue';
import { restoreInlineCombat } from './battle/inline-session';
import DesktopApp from './App.vue';
import MobileApp from './mobile/MobileApp.vue';
import type { ContentRendererContext } from './types/content-renderer';
import { useNarrativeTextSize } from './modules/narrative-text-size';
import { useNarrativePortraitSize } from './modules/narrative-portrait-size';

const { textSizeStyle } = useNarrativeTextSize();
const { portraitSizePercent, portraitSizeStyle } = useNarrativePortraitSize();

const context = inject<ContentRendererContext>('content_renderer_context');
if (context === undefined) {
  throw Error('[content-chat-renderer] missing content renderer context');
}
onMounted(() => {
  void restoreInlineCombat(context.message_id);
});
</script>
