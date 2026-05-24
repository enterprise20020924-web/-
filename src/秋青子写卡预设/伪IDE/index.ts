/**
 * 秋青子写卡预设 - 明月秋青
 * 以独立 iframe 的形式挂载到酒馆主页，用于隔离界面样式。
 */
import { createScriptIdIframe, teleportStyle } from '@util/script';
import App from './App.vue';

$(() => {
  const pinia = createPinia();
  const parentDoc = window.parent.document;
  let app: ReturnType<typeof createApp> | null = null;
  let iframeEl: HTMLIFrameElement | null = null;
  let styleDestroy: (() => void) | null = null;

  function mountIde() {
    if (app) return;

    const iframe = document.createElement('iframe');
    const savedTheme = window.localStorage.getItem('qz-ide-theme');
    const initialBg = savedTheme === 'light' ? '#f7f7f2' : '#0a0e1a';
    iframe.setAttribute('script_id', getScriptId());
    iframe.setAttribute('frameborder', '0');
    iframe.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;border:none;background:${initialBg};`;

    iframe.addEventListener('load', () => {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      iframeDoc.documentElement.style.cssText = 'width:100%;height:100%;margin:0;overflow:hidden;';
      iframeDoc.body.style.cssText = 'width:100%;height:100%;margin:0;overflow:hidden;';

      const { destroy } = teleportStyle(iframeDoc.head);
      styleDestroy = destroy;

      app = createApp(App, {
        onExit: unmountIde,
      }).use(pinia);

      app.mount(iframeDoc.body);
    });

    parentDoc.body.appendChild(iframe);
    iframeEl = iframe;
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
