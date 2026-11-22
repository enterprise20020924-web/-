import { onBeforeUnmount, onMounted, type Ref } from 'vue';

// A content-height iframe cannot use CSS sticky against its host's scroll position.
export function useAdmissionRailFollow(railRef: Ref<HTMLElement | null>, slotRef: Ref<HTMLElement | null>) {
  let observer: ResizeObserver | undefined;
  let animationFrame = 0;
  let hosts: Window[] = [];
  let lastShift = '';

  const update = () => {
    animationFrame = 0;
    const rail = railRef.value;
    const slot = slotRef.value;
    if (!rail || !slot) return;

    if (!hosts.length || window.innerWidth <= 760) {
      delete rail.dataset.follow;
      rail.style.removeProperty('--sk-rail-shift');
      lastShift = '';
      return;
    }

    rail.dataset.follow = 'outer';
    let naturalTop = slot.getBoundingClientRect().top + rail.offsetTop;
    let visibleTop = 0;
    let visibleBottom = window.innerHeight;
    let scale = 1;
    let child: Window = window;

    for (const host of hosts) {
      const frame = child.frameElement as HTMLElement | null;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      const frameScale = frame.offsetHeight ? rect.height / frame.offsetHeight : 1;
      if (frameScale <= 0) return;
      const origin = rect.top + frame.clientTop * frameScale;
      naturalTop = origin + naturalTop * frameScale;
      visibleTop = Math.max(0, origin + visibleTop * frameScale);
      visibleBottom = Math.min(host.innerHeight, origin + visibleBottom * frameScale);
      scale *= frameScale;

      // Tavern may scroll a chat container instead of the host window.
      for (
        let ancestor = frame.parentElement;
        ancestor && ancestor !== host.document.body;
        ancestor = ancestor.parentElement
      ) {
        if (!/^(auto|scroll|hidden|clip)$/.test(host.getComputedStyle(ancestor).overflowY)) continue;
        const bounds = ancestor.getBoundingClientRect();
        const ancestorScale = ancestor.offsetHeight ? bounds.height / ancestor.offsetHeight : 1;
        const top = bounds.top + ancestor.clientTop * ancestorScale;
        visibleTop = Math.max(visibleTop, top);
        visibleBottom = Math.min(visibleBottom, top + ancestor.clientHeight * ancestorScale);
      }
      child = host;
    }

    const bottomMargin = parseFloat(getComputedStyle(rail).marginBottom) || 0;
    const maxShift = Math.max(0, slot.clientHeight - rail.offsetTop - rail.offsetHeight - bottomMargin);
    const availableHeight = Math.max(0, visibleBottom - visibleTop - 40);
    const oversized = Math.max(0, rail.offsetHeight * scale - availableHeight);
    const shift = Math.max(0, Math.min(maxShift, (visibleTop + 20 - oversized - naturalTop) / scale));
    const value = `${Math.round(shift)}px`;
    if (value !== lastShift) {
      rail.style.setProperty('--sk-rail-shift', value);
      lastShift = value;
    }
  };

  const schedule = () => {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(update);
  };

  onMounted(() => {
    let child: Window = window;
    while (child.parent !== child) {
      try {
        const host = child.parent;
        if (!child.frameElement || !host.document.documentElement) break;
        hosts.push(host);
        child = host;
      } catch {
        break;
      }
    }
    for (const host of [window, ...hosts]) {
      host.addEventListener('scroll', schedule, { capture: true, passive: true });
      host.addEventListener('resize', schedule, { passive: true });
    }
    observer = new ResizeObserver(schedule);
    if (slotRef.value) observer.observe(slotRef.value);
    if (railRef.value) observer.observe(railRef.value);
    schedule();
  });

  onBeforeUnmount(() => {
    for (const host of [window, ...hosts]) {
      host.removeEventListener('scroll', schedule, true);
      host.removeEventListener('resize', schedule);
    }
    observer?.disconnect();
    window.cancelAnimationFrame(animationFrame);
  });
}
