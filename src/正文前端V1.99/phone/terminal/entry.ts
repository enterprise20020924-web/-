// @no-production-source-map
import './shared/skylink.scss';
import './shared/skylink-phone.scss';
import './shared/skylink-pages.scss';
import './shared/skylink-contrast.scss';
import { createApp } from 'vue';
import StatusBarWrapper from './性斗学园脚本/components/StatusBarWrapper.vue';
import { installBackstreetMainPromptInjector } from './性斗学园脚本/phone/mainPromptInjector';

export function mountPhone(target: HTMLElement) {
  const app = createApp(StatusBarWrapper);
  const globalAny = window as any;
  const host = target.ownerDocument.defaultView as Window & { __statusBarState?: any };
  const previousHostState = host.__statusBarState;
  app.mount(target);
  const state = globalAny.__statusBarState;
  if (previousHostState?.isVisible?.value) state.open();
  const stopPromptBridge = installBackstreetMainPromptInjector();
  let disposed = false;
  return {
    open: () => state.open(),
    close: () => state.close(),
    toggle: () => state.toggle(),
    dispose() {
      if (disposed) return;
      disposed = true;
      stopPromptBridge();
      app.unmount();
      if (host.__statusBarState === state) host.__statusBarState = previousHostState;
      if (globalAny.__statusBarState === state) delete globalAny.__statusBarState;
    },
  };
}
