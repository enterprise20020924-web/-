<template>
  <div
    v-if="isFunctionPageOpen"
    ref="functionPageOverlay"
    class="bp-shittim-page"
    tabindex="-1"
    @keydown="handleFunctionPageKeydown"
  >
    <ShittimBattlePanel
      :present-contacts="presentRelationshipContacts"
      :contact-factions="contactFactions"
      :selected-contact="selectedRelationshipContact"
      :battle-pending="isStartingBattle"
      @close="emit('close-function')"
      @back="emit('close-contact')"
      @select="emit('open-contact', $event)"
      @start="emit('start-sex-battle')"
    />
  </div>

  <div
    v-if="isThinkingPageOpen"
    ref="thinkingPageOverlay"
    class="bp-function-page-overlay bp-thinking-page-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="bp-thinking-page-title"
    tabindex="-1"
    @click.self="emit('close-thinking')"
    @keydown="handleThinkingPageKeydown"
  >
    <section class="bp-function-page-card bp-thinking-page-card">
      <template v-for="corner in ['top-left', 'top-right', 'bottom-left', 'bottom-right']" :key="corner">
        <span class="bp-ba-frame-corner" :class="corner" aria-hidden="true"></span>
        <span class="bp-ba-frame-cross" :class="corner" aria-hidden="true"></span>
      </template>
      <button type="button" class="bp-function-page-close" aria-label="关闭思维链" @click="emit('close-thinking')">
        返回
      </button>
      <header class="bp-function-page-header">
        <div class="bp-function-page-heading">
          <p class="bp-function-page-kicker">Thinking Trace</p>
          <h3 id="bp-thinking-page-title" class="bp-function-page-title">
            思维链<span class="bp-title-decorator" aria-hidden="true"></span>
          </h3>
        </div>
      </header>
      <section class="bp-function-page-content bp-thinking-page-content" aria-live="polite">
        <div class="bp-thinking-page-head">
          <p class="bp-manual-battle-kicker">RAW THINK BLOCK <span class="bp-kicker-dots">....</span></p>
          <span :class="['bp-thinking-page-status', { 'is-empty': !hasThinkingContent }]">{{
            hasThinkingContent ? '已读取' : '未检出'
          }}</span>
        </div>
        <pre
          v-if="hasThinkingContent"
          class="bp-thinking-page-text"
          role="region"
          aria-label="思维链原始文本"
          tabindex="0"
          >{{ thinkingContent }}</pre
        >
        <p v-else class="bp-thinking-page-empty">当前楼层没有读取到 &lt;think&gt; / &lt;thinking&gt; 标签内容。</p>
      </section>
    </section>
  </div>

  <div
    v-if="portraitPreview !== null"
    ref="portraitPreviewOverlay"
    class="bp-portrait-preview-overlay"
    role="dialog"
    aria-modal="true"
    :aria-label="`${portraitPreview.label} 立绘预览`"
    tabindex="-1"
    @click.self="emit('close-portrait')"
    @keydown="handlePortraitPreviewKeydown"
  >
    <div class="bp-portrait-preview-card" tabindex="-1">
      <button type="button" class="bp-portrait-preview-close" aria-label="关闭立绘预览" @click="emit('close-portrait')">
        关闭</button
      ><img
        class="bp-portrait-preview-image"
        :src="portraitPreview.src"
        :alt="`${portraitPreview.label} 立绘预览`"
        decoding="sync"
        loading="eager"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import ShittimBattlePanel from '../../modules/ShittimBattlePanel.vue';
import type { ContactFaction, RelationshipContact } from '../../mobile/relationship-runtime';
import { focusOverlayAfterRender, trapFocusWithin } from '../overlay-focus';
import type { PortraitPreview } from '../types';

const props = defineProps<{
  isFunctionPageOpen: boolean;
  isThinkingPageOpen: boolean;
  thinkingContent: string;
  hasThinkingContent: boolean;
  presentRelationshipContacts: RelationshipContact[];
  contactFactions: ContactFaction[];
  selectedRelationshipContact: RelationshipContact | null;
  isStartingBattle: boolean;
  portraitPreview: PortraitPreview | null;
}>();
const emit = defineEmits<{
  'close-function': [];
  'close-thinking': [];
  'open-contact': [contact: RelationshipContact];
  'close-contact': [];
  'start-sex-battle': [];
  'close-portrait': [];
}>();
const functionPageOverlay = ref<HTMLElement | null>(null);
const thinkingPageOverlay = ref<HTMLElement | null>(null);
const portraitPreviewOverlay = ref<HTMLElement | null>(null);

watch(
  () => [props.isFunctionPageOpen, props.selectedRelationshipContact] as const,
  ([isOpen]) => {
    if (isOpen) focusOverlayAfterRender(() => functionPageOverlay.value);
  },
  { immediate: true },
);
watch(
  () => props.isThinkingPageOpen,
  isOpen => {
    if (isOpen) focusOverlayAfterRender(() => thinkingPageOverlay.value);
  },
  { immediate: true },
);
watch(
  () => props.portraitPreview,
  preview => {
    if (preview !== null) focusOverlayAfterRender(() => portraitPreviewOverlay.value);
  },
  { immediate: true },
);

function handleFunctionPageKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return;
  event.preventDefault();
  event.stopPropagation();
  if (props.selectedRelationshipContact === null) emit('close-function');
  else emit('close-contact');
}
function handleThinkingPageKeydown(event: KeyboardEvent) {
  trapFocusWithin(event, thinkingPageOverlay.value);
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    emit('close-thinking');
  }
}
function handlePortraitPreviewKeydown(event: KeyboardEvent) {
  trapFocusWithin(event, portraitPreviewOverlay.value);
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    emit('close-portrait');
  }
}
</script>

<style scoped>
.bp-shittim-page {
  position: absolute;
  inset: 0;
  z-index: 50;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  outline: none;
}
</style>
