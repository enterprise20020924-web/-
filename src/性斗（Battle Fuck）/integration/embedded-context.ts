/** The standalone Tavern frontend keeps the normal helper globals; the narrative fork provides this context. */
export interface CombatHeaderState {
  playerName: string;
  enemyName: string;
  turn: number;
  phase: string;
  isBoss: boolean;
  motionReduced: boolean;
}

export interface CombatPageApi {
  ready: Promise<void>;
  refreshPlayer: () => Promise<void>;
  subscribeHeader: (listener: (state: CombatHeaderState) => void) => () => void;
  toggleMotion: () => void;
  setUiScale: (scale: 1 | 1.2) => void;
}

export interface EmbeddedCombatContext {
  bindImageCache?: (target: Window) => () => void;
  presentation?: 'inline';
  uiScale?: 1 | 1.2;
  /** Resolve true once the opening transition fully uncovers the arena; false cancels a disposed frame. */
  waitForEntrance?: () => Promise<boolean>;
  failed?: (error: unknown) => void;
  mounted?: (unmount: () => void) => void;
  initialize: () => Promise<Record<string, unknown>>;
  ready: (root: HTMLElement, unmount: () => void, api: CombatPageApi) => void;
}

export type CombatFrameElement = HTMLIFrameElement & { __crossDistanceContext?: EmbeddedCombatContext };

export function getEmbeddedCombatContext() {
  return (window.frameElement as CombatFrameElement | null)?.__crossDistanceContext;
}

export function setCombatUiScale(scale: 1 | 1.2) {
  document.documentElement.style.setProperty('--cross-distance-ui-scale', String(scale));
  document.documentElement.dataset.crossDistanceUiScale = String(scale);
}

export async function initializeEmbeddedCombatContext() {
  const context = getEmbeddedCombatContext();
  if (!context) return;
  if (context.presentation) document.documentElement.dataset.crossDistanceLayout = context.presentation;
  setCombatUiScale(context.uiScale ?? 1);
  try {
    Object.assign(globalThis, await context.initialize());
    context.bindImageCache?.(window);
  } catch (error) {
    context.failed?.(error);
    throw error;
  }
  return context;
}
