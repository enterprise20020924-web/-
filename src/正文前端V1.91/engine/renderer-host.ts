import { createScriptIdIframe } from '@util/script';
import type { App as VueApp, Reactive } from 'vue';
import type { DeviceMode } from '../device-mode';
import type { ContentRendererContext } from '../types/content-renderer';
import { isDialogueMapRenderText } from './content-blocks';

export type RendererState = {
  app: VueApp;
  data: Reactive<ContentRendererContext>;
  host: HTMLIFrameElement;
  layoutMode: DeviceMode;
  mesText: HTMLElement;
  originalContentVisible: boolean;
  resizeObserver: ResizeObserver | null;
  resizeFrame: number | null;
  destroy: () => void;
};

const RENDERER_HOST_EXPANDED_HEIGHT = 'clamp(1220px, 88vw, 1480px)';
const RENDERER_HOST_MIN_EXPANDED_HEIGHT_PX = 1220;
const RENDERER_HOST_HEIGHT_PADDING_PX = 28;
const RENDERER_HOST_MINIMIZED_HEIGHT = 'clamp(220px, 20vw, 280px)';
const RENDERER_PHONE_HOST_INITIAL_HEIGHT_PX = 720;
const RENDERER_PHONE_HOST_MIN_EXPANDED_HEIGHT_PX = 320;
const RENDERER_PHONE_HOST_MIN_FALLBACK_HEIGHT_PX = 640;
const RENDERER_PHONE_HOST_MAX_FALLBACK_HEIGHT_PX = 960;
const RENDERER_PHONE_HOST_FALLBACK_ASPECT_RATIO = 16 / 9;
const RENDERER_PHONE_HOST_MINIMIZED_MIN_HEIGHT_PX = 218;
const RENDERER_PHONE_HOST_MINIMIZED_MAX_HEIGHT_PX = 286;
const RENDERER_HOST_EXPANDED_MARGIN = '0.75rem 0';
const RENDERER_HOST_MINIMIZED_MARGIN = '0.35rem 0 0.65rem';
const internallyMutatingMessages = new WeakSet<HTMLElement>();

export function createRendererHost(messageId: number, layoutMode: DeviceMode) {
  const $host = createScriptIdIframe()
    .attr('id', getRendererHostId(messageId))
    .css({
      border: 0,
      display: 'block',
      width: '100%',
      'max-width': '100%',
      height: layoutMode === 'phone' ? `${RENDERER_PHONE_HOST_INITIAL_HEIGHT_PX}px` : RENDERER_HOST_EXPANDED_HEIGHT,
      margin: RENDERER_HOST_EXPANDED_MARGIN,
    });

  setRendererHostInitialHeight($host[0], layoutMode);
  return $host;
}

export function getRendererHostId(messageId: number) {
  return `baipo-content-renderer-${messageId}`;
}

export function removeRendererHosts($messageElement: JQuery<HTMLElement>, messageId: number) {
  runWithSuppressedMessageMutation($messageElement[0], () => {
    $messageElement.find(`iframe#${getRendererHostId(messageId)}`).remove();
  });
}

export function removeFollowingBareDialogueMapNodes(host: HTMLElement) {
  runWithSuppressedMessageMutation(host, () => {
    let current = host.nextSibling;
    const pendingIgnorableNodes: Node[] = [];

    while (current !== null) {
      const next = current.nextSibling;

      if (isIgnorableAfterRendererNode(current)) {
        pendingIgnorableNodes.push(current);
        current = next;
        continue;
      }

      const isBareMap =
        (current.nodeType === Node.TEXT_NODE && isDialogueMapRenderText(current.textContent ?? '')) ||
        (current.nodeType === Node.ELEMENT_NODE && isDialogueMapRenderElement(current as Element));

      if (!isBareMap) {
        return;
      }

      pendingIgnorableNodes.forEach(node => node.remove());
      current.remove();
      return;
    }
  });
}

export function placeRendererHostBeforeMessageText(host: HTMLIFrameElement, mesText: HTMLElement) {
  runWithSuppressedMessageMutation(mesText, () => {
    const parent = mesText.parentElement;
    if (parent === null) {
      return;
    }

    if (host.parentElement !== parent || host.nextSibling !== mesText) {
      parent.insertBefore(host, mesText);
    }
  });
}

export function placeExistingRendererHosts(
  $messageElement: JQuery<HTMLElement>,
  messageId: number,
  mesText: HTMLElement,
) {
  $messageElement.find(`iframe#${getRendererHostId(messageId)}`).each((_index, node) => {
    placeRendererHostBeforeMessageText(node as HTMLIFrameElement, mesText);
  });
}

export function restoreHiddenContent(messageId: number, root: HTMLElement) {
  runWithSuppressedMessageMutation(root, () => {
    root.querySelectorAll<HTMLElement>(getHiddenContentSelector(messageId)).forEach(wrapper => {
      wrapper.replaceWith(...Array.from(wrapper.childNodes));
    });
  });
}

export function hasHiddenContentForRenderer(messageId: number, mesText: HTMLElement) {
  return mesText.querySelector(getHiddenContentSelector(messageId)) !== null;
}

export function setHiddenContentVisibleForRenderer(messageId: number, mesText: HTMLElement, visible: boolean) {
  runWithSuppressedMessageMutation(mesText, () => {
    mesText.querySelectorAll<HTMLElement>(getHiddenContentSelector(messageId)).forEach(wrapper => {
      wrapper.style.display = visible ? 'contents' : 'none';
    });
  });
}

export function setRendererHostMinimized(state: RendererState, minimized: boolean) {
  const { host, layoutMode } = state;
  host.style.margin = minimized ? RENDERER_HOST_MINIMIZED_MARGIN : RENDERER_HOST_EXPANDED_MARGIN;
  if (minimized) {
    host.style.height =
      layoutMode === 'phone' ? `${getRendererPhoneMinimizedHeight(host)}px` : RENDERER_HOST_MINIMIZED_HEIGHT;
    return;
  }

  syncRendererHostExpandedHeight(host, layoutMode);
}

export function scheduleRendererHostHeightSync(state: RendererState) {
  if (state.originalContentVisible || state.resizeFrame !== null) {
    return;
  }

  state.resizeFrame = window.requestAnimationFrame(() => {
    state.resizeFrame = null;
    if (!state.originalContentVisible && isNodeConnectedToItsDocument(state.host)) {
      syncRendererHostExpandedHeight(state.host, state.layoutMode);
    }
  });
}

export function installRendererHostAutoResize(state: RendererState) {
  state.resizeObserver?.disconnect();
  state.resizeObserver = null;

  const documentElement = state.host.contentDocument?.documentElement;
  const body = state.host.contentDocument?.body;
  const ResizeObserverCtor = state.host.contentWindow?.ResizeObserver ?? window.ResizeObserver;
  if (documentElement == null || body == null || ResizeObserverCtor === undefined) {
    syncRendererHostExpandedHeight(state.host, state.layoutMode);
    return;
  }

  const observer = new ResizeObserverCtor(() => scheduleRendererHostHeightSync(state));
  observer.observe(documentElement);
  observer.observe(body);
  state.resizeObserver = observer;
  syncRendererHostExpandedHeight(state.host, state.layoutMode);
  window.setTimeout(() => scheduleRendererHostHeightSync(state), 120);
  window.setTimeout(() => scheduleRendererHostHeightSync(state), 480);
}

export function hideDisplayedContentForRenderer(messageId: number, mesText: HTMLElement) {
  return runWithSuppressedMessageMutation(mesText, () => {
    restoreHiddenContent(messageId, mesText);

    const range = createOriginalContentHideRange(mesText);
    if (range === null) {
      return false;
    }

    const hiddenWrapper = mesText.ownerDocument.createElement('span');
    hiddenWrapper.dataset.baipoContentRendererHidden = String(messageId);
    hiddenWrapper.style.display = 'none';
    hiddenWrapper.append(range.extractContents());
    range.insertNode(hiddenWrapper);

    return true;
  });
}

export function isNodeConnectedToItsDocument(node: Node) {
  return node.ownerDocument.contains(node);
}

export function getMessageElementFromNode(node: Node): HTMLElement | null {
  return getElementFromNode(node)?.closest<HTMLElement>('.mes') ?? null;
}

export function getMessageIdFromElement(messageElement: Element | null) {
  return Number(messageElement?.getAttribute('mesid') ?? 'NaN');
}

export function isRenderableMessageElement(messageElement: Element | null): messageElement is HTMLElement {
  return messageElement?.matches(".mes[is_user='false'][is_system='false']") ?? false;
}

export function runWithSuppressedMessageMutation<T>(node: Node | undefined, action: () => T): T {
  const messageElement = node === undefined ? null : getMessageElementFromNode(node);
  if (messageElement !== null) {
    internallyMutatingMessages.add(messageElement);
  }

  try {
    return action();
  } finally {
    if (messageElement !== null) {
      setTimeout(() => internallyMutatingMessages.delete(messageElement), 0);
    }
  }
}

export function isInternalRendererMutation(mutation: MutationRecord) {
  const messageElement = getMessageElementFromNode(mutation.target);
  return messageElement !== null && internallyMutatingMessages.has(messageElement);
}

export function mutationTouchesMessageList(mutation: MutationRecord) {
  return [...mutation.addedNodes, ...mutation.removedNodes].some(node => {
    const element = getElementFromNode(node);
    return element?.matches('.mes') === true || element?.querySelector('.mes') !== null;
  });
}

function getHiddenContentSelector(messageId: number) {
  return `[data-baipo-content-renderer-hidden="${messageId}"]`;
}

function isDialogueMapRenderElement(element: Element) {
  if (!['p', 'div', 'pre', 'code'].includes(element.tagName.toLowerCase())) {
    return false;
  }

  return isDialogueMapRenderText(element.textContent ?? '');
}

function isIgnorableAfterRendererNode(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').trim().length === 0;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  const element = node as Element;
  if (element.tagName.toLowerCase() === 'br') {
    return true;
  }

  return ['p', 'div'].includes(element.tagName.toLowerCase()) && (element.textContent ?? '').trim().length === 0;
}

function clampNumber(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getRendererPhoneFallbackHeight(host: HTMLIFrameElement) {
  const measuredWidth = host.getBoundingClientRect().width;
  const referenceWidth = measuredWidth > 0 ? measuredWidth : 390;
  return clampNumber(
    Math.ceil(referenceWidth * RENDERER_PHONE_HOST_FALLBACK_ASPECT_RATIO + RENDERER_HOST_HEIGHT_PADDING_PX),
    RENDERER_PHONE_HOST_MIN_FALLBACK_HEIGHT_PX,
    RENDERER_PHONE_HOST_MAX_FALLBACK_HEIGHT_PX,
  );
}

function getRendererPhoneMinimizedHeight(host: HTMLIFrameElement) {
  const measuredWidth = host.getBoundingClientRect().width;
  const referenceWidth = measuredWidth > 0 ? measuredWidth : 390;
  return clampNumber(
    Math.ceil(referenceWidth * 0.58),
    RENDERER_PHONE_HOST_MINIMIZED_MIN_HEIGHT_PX,
    RENDERER_PHONE_HOST_MINIMIZED_MAX_HEIGHT_PX,
  );
}

function setRendererHostInitialHeight(host: HTMLIFrameElement, layoutMode: DeviceMode) {
  host.style.height =
    layoutMode === 'phone' ? `${getRendererPhoneFallbackHeight(host)}px` : RENDERER_HOST_EXPANDED_HEIGHT;
}

function measureRendererHostContentHeight(host: HTMLIFrameElement) {
  const body = host.contentDocument?.body;
  if (body == null) {
    return null;
  }

  const bodyTop = body.getBoundingClientRect().top;
  const childBottoms = Array.from(body.children).map(child => child.getBoundingClientRect().bottom - bodyTop);
  const measuredHeight = Math.max(0, ...childBottoms);
  return measuredHeight > 0 ? Math.ceil(measuredHeight) : body.scrollHeight;
}

function syncRendererHostExpandedHeight(host: HTMLIFrameElement, layoutMode: DeviceMode) {
  const measuredHeight = measureRendererHostContentHeight(host);
  const minimumExpandedHeight =
    layoutMode === 'phone' ? RENDERER_PHONE_HOST_MIN_EXPANDED_HEIGHT_PX : RENDERER_HOST_MIN_EXPANDED_HEIGHT_PX;
  const nextHeight =
    measuredHeight === null
      ? layoutMode === 'phone'
        ? `${getRendererPhoneFallbackHeight(host)}px`
        : RENDERER_HOST_EXPANDED_HEIGHT
      : `${Math.max(minimumExpandedHeight, measuredHeight + RENDERER_HOST_HEIGHT_PADDING_PX)}px`;
  host.style.height = nextHeight;
  host.style.margin = RENDERER_HOST_EXPANDED_MARGIN;
}

function createOriginalContentHideRange(root: HTMLElement) {
  if (root.childNodes.length === 0) {
    return null;
  }

  const range = root.ownerDocument.createRange();
  range.setStart(root, 0);
  range.setEnd(root, root.childNodes.length);
  return range.collapsed ? null : range;
}

function getElementFromNode(node: Node): Element | null {
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
}
