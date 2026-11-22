<template>
  <Teleport v-if="target" :to="target">
    <div
      class="bp-standalone-panel-content"
      :class="context.layout_mode === 'desktop' ? 'ContentChatRenderer bp-vector-ui' : 'bpm-mobile-stack'"
      :style="[desktopAssetCssVariables, textSizeStyle]"
    >
      <AronaChoiceAnalysis v-if="kind === 'choices' && context.choice_analysis" :text="context.choice_analysis" />
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { getCurrentInstance, inject, onBeforeUnmount, onMounted, shallowRef } from 'vue';
import { desktopAssetCssVariables } from '../desktop/asset-metadata';
import { runWithSuppressedMessageMutation } from '../engine/renderer-host';
import type { ContentRendererContext } from '../types/content-renderer';
import { useNarrativeTextSize } from './narrative-text-size';
import AronaChoiceAnalysis from './AronaChoiceAnalysis.vue';

const props = defineProps<{ kind: 'choices' | 'variables' }>();
const context = inject<ContentRendererContext>('content_renderer_context')!;
const instance = getCurrentInstance()!;
const { textSizeStyle } = useNarrativeTextSize();
const target = shallowRef<ShadowRoot | null>(null);
let host: HTMLElement | undefined;
const hiddenElements: Array<{ element: HTMLElement; display: string; priority: string }> = [];

function findRawElements(root: HTMLElement) {
  const selector =
    props.kind === 'choices'
      ? 'choice, option, w2p, option_analysis, choice_analysis, w2p_analysis'
      : 'updatevariable, jsonpatch';
  const outsideNarrative = (element: HTMLElement) => !element.closest('[data-baipo-content-renderer-hidden]');
  const tagged = [...root.querySelectorAll<HTMLElement>(selector)].filter(outsideNarrative);
  // Some message formatters unwrap custom tags; locate their remaining text blocks.
  const normalize = (text: string) => text.replace(/\s+/g, '');
  const needles =
    props.kind === 'choices'
      ? [
          ...context.choice_options.map(option => normalize(option.text)),
          ...(context.choice_analysis ?? '')
            .split('\n')
            .map(line => normalize(line.replace(/^\s*[-*+]\s+/, '')))
            .filter(Boolean),
        ]
      : context.json_patch_blocks.map(normalize);
  const matches = [...root.querySelectorAll<HTMLElement>('p, pre, code, li, ul, ol')].filter(
    element =>
      outsideNarrative(element) &&
      !element.querySelector('iframe') &&
      needles.some(needle => needle.length > 0 && normalize(element.textContent ?? '').includes(needle)),
  );
  const originals = [...new Set([...tagged, ...matches])];
  return originals.filter(element => !originals.some(other => other !== element && other.contains(element)));
}

function destroyPanel() {
  target.value = null;
  hiddenElements.splice(0).forEach(({ element, display, priority }) => {
    element.style.setProperty('display', display, priority);
  });
  if (host) {
    const previous = host;
    runWithSuppressedMessageMutation(previous, () => previous.remove());
    host = undefined;
  }
}

function hideOriginalElement(element: HTMLElement) {
  hiddenElements.push({
    element,
    display: element.style.getPropertyValue('display'),
    priority: element.style.getPropertyPriority('display'),
  });
  element.style.setProperty('display', 'none', 'important');
}

onMounted(() => {
  try {
    const sourceDocument = (instance.vnode.el as Node).ownerDocument!;
    const narrativeFrame = sourceDocument.defaultView?.frameElement as HTMLElement | null;
    const root = narrativeFrame?.closest<HTMLElement>('.mes_text');
    if (!root) return;
    const originals = findRawElements(root);
    host = root.ownerDocument.createElement('div');
    host.dataset.bpDetachedPanel = props.kind;
    host.dataset.bpLayout = context.layout_mode;
    host.setAttribute('script_id', getScriptId());
    host.style.cssText = 'display:block;width:100%;margin:0';
    const shadow = host.attachShadow({ mode: 'open' });
    sourceDocument.querySelectorAll('head style').forEach(style => {
      const copy = style.cloneNode(true) as HTMLStyleElement;
      copy.textContent = (copy.textContent ?? '').replace(/:root\b/g, ':host');
      shadow.append(copy);
    });
    const layout = root.ownerDocument.createElement('style');
    layout.textContent = `
      :host{display:block;container:bp-host / inline-size}
      .ContentChatRenderer.bp-standalone-panel-content,
      .bpm-mobile-stack.bp-standalone-panel-content{padding:0;gap:0}
      .ContentChatRenderer.bp-standalone-panel-content > section,
      .bpm-mobile-stack.bp-standalone-panel-content > section{margin-block:0}
    `;
    shadow.append(layout);
    runWithSuppressedMessageMutation(root, () => {
      if (originals[0]) {
        let anchor = originals[0];
        while (anchor.parentElement && anchor.parentElement !== root) anchor = anchor.parentElement;
        anchor.before(host!);
      } else {
        const choices = props.kind === 'variables' ? root.querySelector('[data-bp-detached-panel="choices"]') : null;
        const anchor =
          choices ?? root.querySelector('.custom-bp-narrative-end-v194, .bp-narrative-end-v194') ?? narrativeFrame!;
        anchor.after(host!);
      }
      originals.forEach(hideOriginalElement);
      for (const paragraph of root.querySelectorAll<HTMLElement>(':scope > p')) {
        if (
          root.ownerDocument.defaultView!.getComputedStyle(paragraph).display !== 'none' &&
          !paragraph.querySelector(
            'iframe, [data-bp-detached-panel], img, svg, video, audio, button, input, textarea',
          ) &&
          !paragraph.innerText.trim()
        ) {
          hideOriginalElement(paragraph);
        }
      }
    });
    target.value = shadow;
  } catch (error) {
    destroyPanel();
    console.error('[standalone-support-panel] mount failed', error);
  }
});
onBeforeUnmount(destroyPanel);
</script>
