/**
 * 秋青子写卡预设 - 明月秋青
 * 以独立 iframe 的形式挂载到酒馆主页，用于隔离界面样式。
 */
import { teleportStyle } from '@util/script';
import App from './App.vue';

$(() => {
  const pinia = createPinia();
  const parentDoc = window.parent.document;
  let app: ReturnType<typeof createApp> | null = null;
  let iframeEl: HTMLIFrameElement | null = null;
  let previewHostEl: HTMLDivElement | null = null;
  let styleDestroy: (() => void) | null = null;
  const isPreviewHost = Boolean((window as any).__mingyuePreview);

  function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  function renderMountFailure(host: HTMLElement, error: unknown, notes: string[] = []) {
    host.style.cssText += ';display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;';
    host.innerHTML = '';
    const panel = host.ownerDocument.createElement('div');
    panel.style.cssText = [
      'max-width:720px',
      'padding:18px 20px',
      'border:1px solid rgba(248,113,113,0.35)',
      'border-radius:14px',
      'background:rgba(15,23,42,0.92)',
      'color:#fee2e2',
      'font:14px/1.6 system-ui,sans-serif',
      'box-shadow:0 18px 50px rgba(0,0,0,0.35)',
      'white-space:pre-wrap',
    ].join(';');
    panel.textContent = [
      '明月秋青挂载失败',
      errorMessage(error),
      ...notes,
    ].filter(Boolean).join('\n');
    host.appendChild(panel);
  }

  function mountAppIntoHost(host: HTMLElement, shouldTeleportStyle = host.ownerDocument !== document) {
    if (app) return true;

    let nextApp: ReturnType<typeof createApp> | null = null;
    let nextStyleDestroy: (() => void) | null = null;
    const mountNotes: string[] = [];

    try {
      if (shouldTeleportStyle && host.ownerDocument.head) {
        const { destroy } = teleportStyle(host.ownerDocument.head);
        nextStyleDestroy = destroy;
        styleDestroy = destroy;
      }

      nextApp = createApp(App, {
        onExit: unmountIde,
      }).use(pinia);
      nextApp.config.errorHandler = error => {
        mountNotes.push(`Vue error: ${errorMessage(error)}`);
      };
      nextApp.config.warnHandler = warning => {
        mountNotes.push(`Vue warning: ${warning}`);
      };

      nextApp.mount(host);

      if (!host.querySelector('.ide-root')) {
        throw new Error(`Vue mount completed but .ide-root was not rendered.${mountNotes.length ? `\n${mountNotes.join('\n')}` : ''}`);
      }

      app = nextApp;
      return true;
    } catch (error) {
      console.error('[IDE] mountAppIntoHost failed:', error);
      renderMountFailure(host, error, mountNotes);
      nextApp?.unmount();
      nextStyleDestroy?.();
      if (styleDestroy === nextStyleDestroy) {
        styleDestroy = null;
      }
      return false;
    }
  }

  function mountAppIntoIframe(iframe: HTMLIFrameElement) {
    if (app) return true;

    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc?.body || !iframeDoc.head) return false;

    iframeDoc.documentElement.style.cssText = 'width:100%;height:100%;margin:0;overflow:hidden;';
    iframeDoc.body.style.cssText = 'width:100%;height:100%;margin:0;overflow:hidden;';

    const host = iframeDoc.createElement('div');
    host.setAttribute('data-mingyue-iframe-host', '');
    host.style.cssText = 'width:100%;height:100%;margin:0;overflow:hidden;';
    iframeDoc.body.replaceChildren(host);

    return mountAppIntoHost(host, true);
  }

  function mountAppIntoParentHost(initialBg: string) {
    if (app || previewHostEl) return;

    if (iframeEl) {
      iframeEl.remove();
      iframeEl = null;
    }

    const host = parentDoc.createElement('div');
    host.setAttribute('script_id', getScriptId());
    host.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;background:${initialBg};`;
    parentDoc.body.appendChild(host);
    previewHostEl = host;
    if (!mountAppIntoHost(host, true)) {
      previewHostEl = host;
    }
  }

  function mountIde() {
    if (app) return;

    if (isPreviewHost) {
      const savedTheme = window.localStorage.getItem('qz-ide-theme');
      const initialBg = savedTheme === 'light' ? '#f7f7f2' : '#0a0e1a';
      const host = parentDoc.createElement('div');
      host.setAttribute('script_id', getScriptId());
      host.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;background:${initialBg};`;
      parentDoc.body.appendChild(host);
      previewHostEl = host;
      mountAppIntoHost(host);
      return;
    }

    const savedTheme = window.localStorage.getItem('qz-ide-theme');
    const initialBg = savedTheme === 'light' ? '#f7f7f2' : '#0a0e1a';

    const iframe = parentDoc.createElement('iframe');
    iframe.setAttribute('script_id', getScriptId());
    iframe.setAttribute('frameborder', '0');
    iframe.srcdoc = '<!doctype html><html><head></head><body></body></html>';
    iframe.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;border:none;background:${initialBg};`;

    let iframeLoadHandled = false;
    const mountLoadedIframe = () => {
      if (iframeLoadHandled || app || iframeEl !== iframe) return;
      iframeLoadHandled = true;
      if (!mountAppIntoIframe(iframe)) {
        mountAppIntoParentHost(initialBg);
      }
    };

    iframe.addEventListener('load', mountLoadedIframe, { once: true });

    parentDoc.body.appendChild(iframe);
    iframeEl = iframe;

    window.setTimeout(mountLoadedIframe, 1000);
  }

  function unmountIde() {
    if (app) {
      app.unmount();
      app = null;
    }

    if (styleDestroy) {
      styleDestroy();
      styleDestroy = null;
    }

    if (iframeEl) {
      iframeEl.remove();
      iframeEl = null;
    }

    if (previewHostEl) {
      previewHostEl.remove();
      previewHostEl = null;
    }
  }

  replaceScriptButtons([
    { name: '打开明月秋青', visible: true },
  ]);

  eventOn(getButtonEvent('打开明月秋青'), () => {
    mountIde();
  });

  $(window).on('pagehide', () => {
    unmountIde();
  });
});
