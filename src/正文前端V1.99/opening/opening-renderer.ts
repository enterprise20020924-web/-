import { runWithSuppressedMessageMutation } from '../engine/renderer-host';
import { bindForkImageCache, getForkImagePreloader } from '../assets/image-preload-runtime';
import type { OpeningFrameElement } from './embedded-context';
import { createOpeningBridge } from './opening-context';
import { getOpeningDocument } from './opening-document';
import { OPENING_SLOT_SELECTOR } from './opening-slot';

type OpeningRendererState = {
  host: OpeningFrameElement;
  slot: HTMLElement;
  source: string;
  swipeId: number;
  bridge: ReturnType<typeof createOpeningBridge>;
  observer?: ResizeObserver;
  stopViewportSync?: () => void;
  resizeFrame?: number;
  unmount?: () => void;
};
const states = new Map<number, OpeningRendererState>();

export function destroyOpeningRenderer(messageId: number) {
  const state = states.get(messageId);
  if (!state) return;
  states.delete(messageId);
  state.observer?.disconnect();
  state.stopViewportSync?.();
  if (state.resizeFrame !== undefined) window.cancelAnimationFrame(state.resizeFrame);
  state.unmount?.();
  state.bridge.dispose();
  runWithSuppressedMessageMutation(state.slot, () => state.host.remove());
}

export function destroyAllOpeningRenderers() {
  [...states.keys()].forEach(destroyOpeningRenderer);
}

export function pruneOpeningRenderers(allowedMessageIds: Set<number>) {
  states.forEach((state, messageId) => {
    if (!allowedMessageIds.has(messageId) || !state.slot.isConnected) destroyOpeningRenderer(messageId);
  });
}

function observeOpeningHeight(state: OpeningRendererState, root: HTMLElement) {
  const chat = state.slot.closest<HTMLElement>('#chat');
  const hostWindow = state.host.ownerDocument.defaultView!;
  const viewport = hostWindow.visualViewport;
  const sync = () => {
    if (state.resizeFrame !== undefined) return;
    state.resizeFrame = window.requestAnimationFrame(() => {
      state.resizeFrame = undefined;
      if (!state.host.isConnected) return;
      // The iframe follows its content. Size the mobile tablet against the outer chat instead.
      const viewportHeight = viewport?.height ?? hostWindow.innerHeight;
      const availableHeight = Math.floor(Math.min(chat?.clientHeight || viewportHeight, viewportHeight));
      root.style.setProperty('--admission-chat-height', `${availableHeight}px`);
      const height = Math.ceil(Math.max(root.getBoundingClientRect().height, root.scrollHeight));
      if (height > 0 && state.host.style.height !== `${height}px`) state.host.style.height = `${height}px`;
    });
  };
  const FrameResizeObserver = (state.host.contentWindow! as Window & typeof globalThis).ResizeObserver;
  const observer = new FrameResizeObserver(sync);
  state.observer = observer;
  observer.observe(root);
  if (chat) observer.observe(chat);
  viewport?.addEventListener('resize', sync);
  state.stopViewportSync = () => viewport?.removeEventListener('resize', sync);
  sync();
}

export function renderOpeningMessage(messageId: number, mesText: HTMLElement, source: string, swipeId: number) {
  const slot = mesText.querySelector<HTMLElement>(OPENING_SLOT_SELECTOR);
  const existing = states.get(messageId);
  if (slot && existing?.slot === slot && existing.source === source && existing.swipeId === swipeId) return;
  destroyOpeningRenderer(messageId);
  if (!slot) return;

  const host = slot.ownerDocument.createElement('iframe') as OpeningFrameElement;
  host.id = `bp-opening-renderer-${messageId}`;
  host.title = '入学档案';
  host.setAttribute('script_id', getScriptId());
  host.style.cssText = 'display:block;width:100%;max-width:100%;height:720px;margin:0;border:0';
  const bridge = createOpeningBridge(messageId);
  const state: OpeningRendererState = { host, slot, source, swipeId, bridge };
  const failed = (error: unknown) => {
    if (states.get(messageId) === state) destroyOpeningRenderer(messageId);
    console.error('[入学档案] 内嵌开局加载失败', error);
  };
  host.__bpOpeningContext = {
    bindImageCache: target => bindForkImageCache(target, slot.ownerDocument.defaultView!),
    imagePreloader: getForkImagePreloader(slot.ownerDocument.defaultView!),
    initialize: bridge.initialize,
    ready: (root, unmount) => {
      if (states.get(messageId) !== state) {
        unmount();
        return;
      }
      state.unmount = unmount;
      observeOpeningHeight(state, root);
    },
    failed,
  };
  states.set(messageId, state);
  void getOpeningDocument()
    .then(html => {
      if (states.get(messageId) !== state || !slot.isConnected) return;
      host.srcdoc = html;
      runWithSuppressedMessageMutation(slot, () => slot.append(host));
    })
    .catch(failed);
}
