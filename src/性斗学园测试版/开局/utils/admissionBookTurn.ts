import { computed, onBeforeUnmount, ref, type Ref } from 'vue';

interface BookTurnOptions {
  element: Ref<HTMLElement | null>;
  pageIndex: Readonly<Ref<number>>;
  pageCount: Readonly<Ref<number>>;
  reducedMotion: () => boolean;
  commit: (direction: number) => void;
}

interface PointerStart {
  id: number;
  x: number;
  y: number;
  time: number;
  width: number;
}

export function useAdmissionBookTurn(options: BookTurnOptions) {
  const direction = ref(0);
  const progress = ref(0);
  const dragging = ref(false);
  const settling = ref(false);
  const turning = computed(() => direction.value !== 0);
  let pointer: PointerStart | null = null;
  let animation = 0;
  let suppressClickUntil = 0;

  const bookStyle = computed(() => ({
    '--sk-book-angle': `${-180 * (direction.value > 0 ? progress.value : 1 - progress.value)}deg`,
    '--sk-book-shade': Math.sin(progress.value * Math.PI) * 0.22,
    '--sk-book-fade': direction.value > 0 ? 1 - progress.value : progress.value,
  }));

  function canTurn(offset: number) {
    const next = options.pageIndex.value + offset;
    return next >= 0 && next < options.pageCount.value;
  }

  function releasePointer() {
    const element = options.element.value;
    const id = pointer?.id;
    pointer = null;
    dragging.value = false;
    if (id !== undefined && element?.hasPointerCapture(id)) element.releasePointerCapture(id);
  }

  function reset() {
    cancelAnimationFrame(animation);
    animation = 0;
    releasePointer();
    direction.value = 0;
    progress.value = 0;
    settling.value = false;
  }

  function settle(complete: boolean) {
    releasePointer();
    settling.value = true;
    const from = progress.value;
    const to = complete ? 1 : 0;
    const start = performance.now();
    const reduced = options.reducedMotion() || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? 0 : 260 + Math.abs(to - from) * 180;
    const finish = () => {
      if (complete) options.commit(direction.value);
      direction.value = 0;
      progress.value = 0;
      settling.value = false;
      animation = 0;
    };
    if (!duration) return finish();
    const tick = (now: number) => {
      const time = Math.min(1, (now - start) / duration);
      progress.value = from + (to - from) * (1 - Math.pow(1 - time, 3));
      if (time < 1) animation = requestAnimationFrame(tick);
      else finish();
    };
    animation = requestAnimationFrame(tick);
  }

  function turn(offset: number) {
    if (turning.value || settling.value || !canTurn(offset)) return;
    direction.value = offset;
    progress.value = 0;
    settle(true);
  }

  function onPointerDown(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0 || turning.value || settling.value) return;
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      width: options.element.value?.clientWidth || 1,
    };
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId || settling.value) return;
    const distance = event.clientX - pointer.x;
    const vertical = event.clientY - pointer.y;
    if (!dragging.value) {
      if (Math.abs(vertical) > 10 && Math.abs(vertical) > Math.abs(distance)) {
        pointer = null;
        return;
      }
      if (Math.abs(distance) < 7 || Math.abs(distance) <= Math.abs(vertical)) return;
      dragging.value = true;
      options.element.value?.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    suppressClickUntil = performance.now() + 400;
    const offset = distance < 0 ? 1 : -1;
    direction.value = canTurn(offset) ? offset : 0;
    progress.value = direction.value ? Math.min(1, Math.abs(distance) / Math.min(620, pointer.width * 0.7)) : 0;
  }

  function onPointerUp(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (!dragging.value || !turning.value) return releasePointer();
    const speed = Math.abs(event.clientX - pointer.x) / Math.max(1, performance.now() - pointer.time);
    const complete = progress.value >= 0.32 || (progress.value >= 0.08 && speed > 0.55);
    suppressClickUntil = performance.now() + 400;
    settle(complete);
  }

  function onPointerCancel(event: PointerEvent) {
    if (pointer?.id !== event.pointerId) return;
    if (turning.value) settle(false);
    else releasePointer();
  }

  function onClickCapture(event: MouseEvent) {
    if (turning.value || performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onBeforeUnmount(reset);
  return {
    direction,
    progress,
    dragging,
    turning,
    bookStyle,
    turn,
    reset,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClickCapture,
  };
}
