import { nextTick } from 'vue';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function captureFocusedElement() {
  return document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

export function focusOverlayAfterRender(target: () => HTMLElement | null) {
  void nextTick(() => target()?.focus());
}

export function restoreFocus(target: HTMLElement | null) {
  void nextTick(() => {
    window.setTimeout(() => {
      if (target?.isConnected) {
        target.focus({ preventScroll: true });
      }
    }, 0);
  });
}

export function trapFocusWithin(event: KeyboardEvent, container: HTMLElement | null) {
  if (event.key !== 'Tab' || container === null) {
    return;
  }

  const focusable = [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(element => {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable.at(-1) ?? first;
  const activeElement = container.ownerDocument.activeElement;
  if (event.shiftKey && activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
