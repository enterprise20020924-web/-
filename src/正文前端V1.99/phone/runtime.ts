import { decodeGzipJson } from '../compressed-json';
import { PHONE_BUNDLE_GZIP } from './generated/phone-bundle';

interface PhoneApi {
  open(): void;
  close(): void;
  toggle(): void;
  dispose(): void;
}
interface PhoneModule {
  mountPhone(target: HTMLElement): PhoneApi;
}
const OWNER_KEY = '__bpSkylinkPhoneV198';

export function isPhoneGeneration() {
  return Boolean(
    (window as any).__fatriaBackstreetInternalGeneration || (window.parent as any).__fatriaBackstreetInternalGeneration,
  );
}

/** One floating phone for the whole frontend, independent of rendered message floors. */
export function installFloatingPhone(): () => void {
  const hostDocument = $('#chat')[0]?.ownerDocument ?? window.parent.document;
  const hostWindow = hostDocument.defaultView! as Window & Record<string, any>;
  hostWindow[OWNER_KEY]?.dispose();
  const container = hostDocument.createElement('div');
  container.dataset.bpSkylinkPhone = 'v198-fork';
  container.style.cssText =
    'position:fixed;inset:0;z-index:99999;pointer-events:none;margin:0;padding:0;overflow:visible;color-scheme:light';
  const shadow = container.attachShadow({ mode: 'open' });
  let api: PhoneApi | undefined;
  let stopped = false;
  let moduleUrl = '';
  let observer: MutationObserver | undefined;
  const legacySurfaces = new Map<HTMLElement, { display: string; priority: string }>();
  const bridgeStops: Array<() => void> = [];

  function suppressLegacyPhones() {
    for (const element of hostDocument.body.children) {
      const node = element as HTMLElement;
      if (node === container || node.dataset.bpSkylinkPhone || legacySurfaces.has(node)) continue;
      // Match only the original phone's explicit shell, not other floating tools.
      if (!node.hasAttribute('script_id') || !node.shadowRoot?.querySelector('.status-bar-shell')) continue;
      legacySurfaces.set(node, {
        display: node.style.getPropertyValue('display'),
        priority: node.style.getPropertyPriority('display'),
      });
      node.style.setProperty('display', 'none', 'important');
    }
    if (api) hostWindow.__statusBarState = (window as any).__statusBarState;
  }

  const owner = {
    open: () => api?.open(),
    dispose() {
      if (stopped) return;
      stopped = true;
      observer?.disconnect();
      bridgeStops.forEach(stop => stop());
      api?.dispose();
      api = undefined;
      container.remove();
      legacySurfaces.forEach((previous, node) => {
        if (previous.display) node.style.setProperty('display', previous.display, previous.priority);
        else node.style.removeProperty('display');
      });
      legacySurfaces.clear();
      if (moduleUrl) URL.revokeObjectURL(moduleUrl);
      if (hostWindow[OWNER_KEY] === owner) delete hostWindow[OWNER_KEY];
    },
  };
  hostWindow[OWNER_KEY] = owner;

  void (async () => {
    const payload = await decodeGzipJson<{ code: string; css: string }>(PHONE_BUNDLE_GZIP);
    await waitGlobalInitialized('Mvu');
    if (stopped) return;
    const style = hostDocument.createElement('style');
    style.textContent = payload.css;
    shadow.append(style);
    const iconLinks = [...hostDocument.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].filter(link =>
      /fontawesome|fortawesome|font-awesome/i.test(link.href),
    );
    if (iconLinks.length) iconLinks.forEach(link => shadow.append(link.cloneNode(true)));
    else {
      const link = hostDocument.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://testingcf.jsdelivr.net/npm/@fortawesome/fontawesome-free/css/all.min.css';
      shadow.append(link);
    }
    const mountPoint = hostDocument.createElement('div');
    shadow.append(mountPoint);
    hostDocument.body.append(container);
    moduleUrl = URL.createObjectURL(new Blob([payload.code], { type: 'text/javascript' }));
    const module = (await import(/* webpackIgnore: true */ moduleUrl)) as PhoneModule;
    if (stopped) return;
    api = module.mountPhone(mountPoint);
    suppressLegacyPhones();
    observer = new hostWindow.MutationObserver(suppressLegacyPhones);
    observer.observe(hostDocument.body, { childList: true });
    const onChatChanged = () => {
      api?.close();
      window.dispatchEvent(new CustomEvent('mvu-data-updated'));
    };
    const chatListener = eventOn(tavern_events.CHAT_CHANGED, onChatChanged);
    bridgeStops.push(() => chatListener.stop());
    console.info('[正文前端] SKYLINK 悬浮手机已接入');
  })().catch(error => {
    console.error('[正文前端] SKYLINK 手机加载失败', error);
    owner.dispose();
  });
  return owner.dispose;
}
