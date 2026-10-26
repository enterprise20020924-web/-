import { computed, onScopeDispose, ref, watch, type Ref } from 'vue';

interface MapCameraOptions {
  viewport: Ref<HTMLElement | null>;
  reducedMotion: Ref<boolean>;
  getSafeInset: () => number;
}

interface MapBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CameraPosition {
  zoom: number;
  x: number;
  y: number;
}

export interface MapCameraSnapshot {
  readonly zoom: number;
  readonly pan: Readonly<{ x: number; y: number }>;
  readonly viewportSize: Readonly<{ width: number; height: number }>;
  readonly baseSize: Readonly<{ width: number; height: number }>;
  readonly safeInset: number;
  readonly overviewZoom: number;
}

const ARTWORK_WIDTH = 1672;
const ARTWORK_HEIGHT = 941;
const CAMERA_DURATION = 380;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** A single interruptible camera keeps the raster, SVG hit areas and labels together. */
export function useMapCamera({ viewport, reducedMotion, getSafeInset }: MapCameraOptions) {
  const zoom = ref(1);
  const pan = ref({ x: 0, y: 0 });
  const viewportSize = ref({ width: 1, height: 1 });
  const moving = ref(false);
  let animationFrame: number | null = null;
  let animationWindow: Window | null = null;
  let animationTarget: CameraPosition | null = null;
  let disposed = false;

  const safeInset = computed(() => {
    const inset = getSafeInset();
    return clamp(Number.isFinite(inset) ? inset : 0, 0, Math.max(0, viewportSize.value.width - 1));
  });
  const safeWidth = computed(() => Math.max(1, viewportSize.value.width - safeInset.value));
  const baseSize = computed(() => {
    const ratio = Math.min(viewportSize.value.width / ARTWORK_WIDTH, viewportSize.value.height / ARTWORK_HEIGHT);
    return { width: ARTWORK_WIDTH * ratio, height: ARTWORK_HEIGHT * ratio };
  });
  const overviewZoom = computed(() =>
    Math.min(1, safeWidth.value / baseSize.value.width, viewportSize.value.height / baseSize.value.height),
  );
  const boardStyle = computed(() => {
    const width = baseSize.value.width * zoom.value;
    const height = baseSize.value.height * zoom.value;
    return {
      width: `${width}px`,
      height: `${height}px`,
      left: `${(viewportSize.value.width - width) / 2 + pan.value.x}px`,
      top: `${(viewportSize.value.height - height) / 2 + pan.value.y}px`,
    };
  });

  function constrain(position: CameraPosition): CameraPosition {
    const value = clamp(position.zoom, overviewZoom.value, overviewZoom.value * 4);
    // A little sea may enter the frame while panning, but the island cannot be lost.
    const maxX = Math.max(0, (baseSize.value.width * value - safeWidth.value) / 2) + safeWidth.value * 0.18;
    const maxY =
      Math.max(0, (baseSize.value.height * value - viewportSize.value.height) / 2) + viewportSize.value.height * 0.18;
    const centerX = -safeInset.value / 2;
    return {
      zoom: value,
      x: clamp(position.x, centerX - maxX, centerX + maxX),
      y: clamp(position.y, -maxY, maxY),
    };
  }

  function apply(position: CameraPosition) {
    zoom.value = position.zoom;
    pan.value = { x: position.x, y: position.y };
  }

  function cancel() {
    if (animationFrame !== null) animationWindow?.cancelAnimationFrame(animationFrame);
    animationFrame = null;
    animationWindow = null;
    animationTarget = null;
    moving.value = false;
  }

  function travelTo(position: CameraPosition, animated: boolean, exact = false) {
    if (disposed) return;
    cancel();
    const target = exact ? position : constrain(position);
    const from = { zoom: zoom.value, x: pan.value.x, y: pan.value.y };
    const view = viewport.value?.ownerDocument.defaultView;
    if (
      !animated ||
      reducedMotion.value ||
      !view ||
      (Math.abs(target.zoom - from.zoom) < 0.0001 && Math.abs(target.x - from.x) + Math.abs(target.y - from.y) < 0.1)
    ) {
      apply(target);
      return;
    }

    animationWindow = view;
    animationTarget = target;
    moving.value = true;
    const startedAt = view.performance.now();
    const step = (now: number) => {
      const progress = clamp((now - startedAt) / CAMERA_DURATION, 0, 1);
      const eased = 1 - (1 - progress) ** 5;
      apply({
        zoom: from.zoom + (target.zoom - from.zoom) * eased,
        x: from.x + (target.x - from.x) * eased,
        y: from.y + (target.y - from.y) * eased,
      });
      if (progress < 1) animationFrame = view.requestAnimationFrame(step);
      else {
        apply(target);
        cancel();
      }
    };
    animationFrame = view.requestAnimationFrame(step);
  }

  function clampPan() {
    cancel();
    apply(constrain({ zoom: zoom.value, ...pan.value }));
  }

  function resize() {
    // The dialog entrance scales its visual rect. Read layout dimensions so the
    // first camera position does not retain that temporary scale after entry.
    const width = viewport.value?.clientWidth ?? 0;
    const height = viewport.value?.clientHeight ?? 0;
    if (width <= 0 || height <= 0) return;
    if (Math.abs(width - viewportSize.value.width) < 0.25 && Math.abs(height - viewportSize.value.height) < 0.25)
      return;
    cancel();
    viewportSize.value = { width, height };
    apply(constrain({ zoom: zoom.value, ...pan.value }));
  }

  function resetView(animated = true) {
    travelTo({ zoom: overviewZoom.value, x: -safeInset.value / 2, y: 0 }, animated);
  }

  function captureView(): MapCameraSnapshot {
    return {
      zoom: zoom.value,
      pan: { ...pan.value },
      viewportSize: { ...viewportSize.value },
      baseSize: { ...baseSize.value },
      safeInset: safeInset.value,
      overviewZoom: overviewZoom.value,
    };
  }

  function restoreView(snapshot: MapCameraSnapshot, animated = true) {
    if (
      ![
        snapshot.zoom,
        snapshot.pan.x,
        snapshot.pan.y,
        snapshot.viewportSize.width,
        snapshot.viewportSize.height,
        snapshot.baseSize.width,
        snapshot.baseSize.height,
        snapshot.safeInset,
        snapshot.overviewZoom,
      ].every(Number.isFinite) ||
      snapshot.zoom <= 0 ||
      snapshot.viewportSize.width <= 0 ||
      snapshot.viewportSize.height <= 0 ||
      snapshot.baseSize.width <= 0 ||
      snapshot.baseSize.height <= 0 ||
      snapshot.overviewZoom <= 0
    )
      return;

    const sameFrame =
      Math.abs(snapshot.viewportSize.width - viewportSize.value.width) < 0.25 &&
      Math.abs(snapshot.viewportSize.height - viewportSize.value.height) < 0.25 &&
      Math.abs(snapshot.baseSize.width - baseSize.value.width) < 0.25 &&
      Math.abs(snapshot.baseSize.height - baseSize.value.height) < 0.25 &&
      Math.abs(snapshot.safeInset - safeInset.value) < 0.25;
    if (sameFrame) {
      // An interrupted camera may be between the old and new safe-area limits.
      // Preserve the actual captured view instead of introducing a return jump.
      travelTo({ zoom: snapshot.zoom, ...snapshot.pan }, animated, true);
      return;
    }

    const previousScale = (snapshot.baseSize.width * snapshot.zoom) / ARTWORK_WIDTH;
    const centerX = ARTWORK_WIDTH / 2 + (-snapshot.safeInset / 2 - snapshot.pan.x) / previousScale;
    const centerY = ARTWORK_HEIGHT / 2 - snapshot.pan.y / previousScale;
    const value = clamp(
      (snapshot.zoom / snapshot.overviewZoom) * overviewZoom.value,
      overviewZoom.value,
      overviewZoom.value * 4,
    );
    const scale = (baseSize.value.width * value) / ARTWORK_WIDTH;
    // Keep the same artwork point in the new unobscured center, with the same
    // magnification relative to its overview rather than the old pixel size.
    travelTo(
      {
        zoom: value,
        x: -safeInset.value / 2 + (ARTWORK_WIDTH / 2 - centerX) * scale,
        y: (ARTWORK_HEIGHT / 2 - centerY) * scale,
      },
      animated,
    );
  }

  function zoomAt(next: number, clientX?: number, clientY?: number, animated = true) {
    if (!Number.isFinite(next)) return;
    const value = clamp(next, overviewZoom.value, overviewZoom.value * 4);
    const ratio = value / zoom.value;
    const rect = viewport.value?.getBoundingClientRect();
    const x = clientX !== undefined && rect ? clientX - rect.left - viewportSize.value.width / 2 : -safeInset.value / 2;
    const y = clientY !== undefined && rect ? clientY - rect.top - viewportSize.value.height / 2 : 0;
    travelTo({ zoom: value, x: x - (x - pan.value.x) * ratio, y: y - (y - pan.value.y) * ratio }, animated);
  }

  function focusBounds(bounds: MapBounds, animated = true) {
    if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) return;
    if (bounds.width <= 0 || bounds.height <= 0) return;
    const scale = baseSize.value.width / ARTWORK_WIDTH;
    // Keep automatic focus within the artwork's native resolution. Manual zoom
    // can go further, but selecting a small region should not magnify soft pixels.
    const focusLimit = Math.max(overviewZoom.value, Math.min(overviewZoom.value * 4, 1 / scale));
    const value = clamp(
      Math.min(
        (safeWidth.value * 0.86) / (bounds.width * scale),
        (viewportSize.value.height * 0.86) / (bounds.height * scale),
      ),
      overviewZoom.value,
      focusLimit,
    );
    travelTo(
      {
        zoom: value,
        x: -safeInset.value / 2 + (ARTWORK_WIDTH / 2 - bounds.x - bounds.width / 2) * scale * value,
        y: (ARTWORK_HEIGHT / 2 - bounds.y - bounds.height / 2) * scale * value,
      },
      animated,
    );
  }

  function moveBy(dx: number, dy: number) {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    travelTo({ zoom: zoom.value, x: pan.value.x + dx, y: pan.value.y + dy }, false);
  }

  const stopMotionWatch = watch(reducedMotion, value => {
    if (!value || !animationTarget) return;
    const target = animationTarget;
    cancel();
    apply(target);
  });

  function dispose() {
    disposed = true;
    cancel();
    stopMotionWatch();
  }
  onScopeDispose(dispose);

  return {
    zoom,
    pan,
    viewportSize,
    baseSize,
    boardStyle,
    overviewZoom,
    moving,
    resize,
    resetView,
    captureView,
    restoreView,
    zoomAt,
    focusBounds,
    moveBy,
    clampPan,
    cancel,
    dispose,
  };
}
