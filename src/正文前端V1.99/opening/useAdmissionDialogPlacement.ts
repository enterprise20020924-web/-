import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue';

// An auto-height message iframe is taller than the visible chat viewport.
// Keep the dialog centered in the portion the player can actually see.
export function useAdmissionDialogPlacement(active: Ref<boolean>, enabled: () => boolean) {
  let dispose = () => {};
  watch(active, async visible => {
    dispose();
    if (!visible || !enabled()) return;
    await nextTick();
    const overlay = document.querySelector<HTMLElement>('[data-archive-dialog]');
    const card = overlay?.querySelector<HTMLElement>('.opening-modal-card');
    if (!overlay || !card) return;
    const hosts: Window[] = [window];
    for (let child = window; child.parent !== child && child.frameElement; child = child.parent) {
      hosts.push(child.parent);
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      let top = 0;
      let bottom = window.innerHeight;
      let origin = 0;
      let scale = 1;
      for (let i = 1; i < hosts.length; i++) {
        const child = hosts[i - 1];
        const host = hosts[i];
        const element = child.frameElement as HTMLElement;
        const bounds = element.getBoundingClientRect();
        const zoom = element.offsetHeight ? bounds.height / element.offsetHeight : 1;
        const offset = bounds.top + element.clientTop * zoom;
        origin = offset + origin * zoom;
        scale *= zoom;
        top = Math.max(0, offset + top * zoom);
        bottom = Math.min(host.innerHeight, offset + bottom * zoom);
        for (
          let parent = element.parentElement;
          parent && parent !== host.document.body;
          parent = parent.parentElement
        ) {
          if (!/^(auto|scroll|hidden|clip)$/.test(host.getComputedStyle(parent).overflowY)) continue;
          const rect = parent.getBoundingClientRect();
          top = Math.max(top, rect.top + parent.clientTop);
          bottom = Math.min(bottom, rect.top + parent.clientTop + parent.clientHeight);
        }
      }
      if (bottom <= top) return;
      const visibleTop = (top - origin) / scale;
      const visibleHeight = (bottom - top) / scale;
      const center = visibleTop + Math.max(visibleHeight / 2, card.offsetHeight / 2 + 16);
      overlay.style.setProperty('--archive-modal-shift', `${Math.round(center - window.innerHeight / 2)}px`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    for (const host of hosts) {
      host.addEventListener('scroll', schedule, { capture: true, passive: true });
      host.addEventListener('resize', schedule, { passive: true });
    }
    const observer = new ResizeObserver(schedule);
    observer.observe(card);
    update();
    dispose = () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      for (const host of hosts) {
        host.removeEventListener('scroll', schedule, true);
        host.removeEventListener('resize', schedule);
      }
      overlay.style.removeProperty('--archive-modal-shift');
    };
  });
  onBeforeUnmount(() => dispose());
}
