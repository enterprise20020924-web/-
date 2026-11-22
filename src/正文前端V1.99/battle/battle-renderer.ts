import type { CombatFrameElement } from '../../性斗（Battle Fuck）/integration/embedded-context';
import { runWithSuppressedMessageMutation } from '../engine/renderer-host';
import { bindForkImageCache } from '../assets/image-preload-runtime';
import { createCombatGlobals } from './combat-context';
import { getBattleDocument } from './battle-document';

const SLOT_SELECTOR = '.custom-bp-fight-slot-v198, .bp-fight-slot-v198';
const states = new Map<number, BattleRendererState>();

type BattleRendererState = {
  host: CombatFrameElement;
  slot: HTMLElement;
  source: string;
  swipeId: number;
  observer?: ResizeObserver;
  resizeFrame?: number;
  unmount?: () => void;
};

export function destroyBattleRenderer(messageId: number) {
  const state = states.get(messageId);
  if (!state) return;
  states.delete(messageId);
  state.observer?.disconnect();
  if (state.resizeFrame !== undefined) window.cancelAnimationFrame(state.resizeFrame);
  state.unmount?.();
  runWithSuppressedMessageMutation(state.slot, () => state.host.remove());
}

export function destroyAllBattleRenderers() {
  [...states.keys()].forEach(destroyBattleRenderer);
}

export function pruneBattleRenderers(allowedMessageIds: Set<number>) {
  states.forEach((state, messageId) => {
    if (!allowedMessageIds.has(messageId) || !state.slot.isConnected) destroyBattleRenderer(messageId);
  });
}

export function mutationTouchesBattleSlot(mutation: MutationRecord) {
  return [...mutation.addedNodes, ...mutation.removedNodes].some(
    node =>
      node.nodeType === Node.ELEMENT_NODE &&
      ((node as Element).matches(SLOT_SELECTOR) || (node as Element).querySelector(SLOT_SELECTOR) !== null),
  );
}

function observeBattleHeight(state: BattleRendererState, root: HTMLElement) {
  const sync = () => {
    if (state.resizeFrame !== undefined) return;
    state.resizeFrame = window.requestAnimationFrame(() => {
      state.resizeFrame = undefined;
      if (!state.host.isConnected) return;
      const height = Math.ceil(Math.max(root.getBoundingClientRect().height, root.scrollHeight));
      if (height > 0) state.host.style.height = `${height}px`;
    });
  };
  const FrameResizeObserver = (state.host.contentWindow! as Window & typeof globalThis).ResizeObserver;
  const observer = new FrameResizeObserver(sync);
  state.observer = observer;
  observer.observe(root);
  sync();
}

export function renderBattleMessage(messageId: number, mesText: HTMLElement, source: string, swipeId: number) {
  const slot = mesText.querySelector<HTMLElement>(SLOT_SELECTOR);
  const existing = states.get(messageId);
  if (slot && existing?.slot === slot && existing.source === source && existing.swipeId === swipeId) return;
  destroyBattleRenderer(messageId);
  if (!slot) return;

  const host = slot.ownerDocument.createElement('iframe') as CombatFrameElement;
  host.id = `cross-distance-renderer-${messageId}`;
  host.title = '性斗（Battle Fuck）';
  host.setAttribute('script_id', getScriptId());
  host.style.cssText = 'display:block;width:100%;max-width:100%;height:640px;margin:0.75rem 0;border:0';
  const state: BattleRendererState = { host, slot, source, swipeId };
  host.__crossDistanceContext = {
    bindImageCache: target => bindForkImageCache(target),
    initialize: () => createCombatGlobals(messageId),
    ready: (root, unmount) => {
      if (states.get(messageId) !== state) {
        unmount();
        return;
      }
      state.unmount = unmount;
      observeBattleHeight(state, root);
    },
  };
  states.set(messageId, state);

  void getBattleDocument()
    .then(html => {
      if (states.get(messageId) !== state || !slot.isConnected) return;
      host.srcdoc = html;
      runWithSuppressedMessageMutation(slot, () => slot.append(host));
    })
    .catch(error => {
      if (states.get(messageId) === state) destroyBattleRenderer(messageId);
      console.error('[性斗（Battle Fuck）] 内嵌页面加载失败', error);
    });
}
