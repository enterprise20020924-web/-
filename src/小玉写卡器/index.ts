/**
 * 玉藻前写卡器
 * 以独立 iframe 覆盖酒馆页面，内部使用适配后的秋青子写卡预设生成完整角色卡。
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { teleportStyle } from '@util/script';
import App from './App.vue';

$(() => {
  const pinia = createPinia();
  const parentDoc = window.parent.document;
  let app: ReturnType<typeof createApp> | null = null;
  let iframeEl: HTMLIFrameElement | null = null;
  let styleDestroy: (() => void) | null = null;
  let viewportDestroy: (() => void) | null = null;

  function unmountWriter() {
    if (app) {
      app.unmount();
      app = null;
    }
    if (styleDestroy) {
      styleDestroy();
      styleDestroy = null;
    }
    if (viewportDestroy) {
      viewportDestroy();
      viewportDestroy = null;
    }
    if (iframeEl) {
      iframeEl.remove();
      iframeEl = null;
    }
  }

  function syncOverlayViewport(iframe: HTMLIFrameElement): () => void {
    const parentWindow = window.parent;
    const visualViewport = parentWindow.visualViewport;

    const applyViewport = () => {
      const width = visualViewport?.width ?? parentWindow.innerWidth;
      const height = visualViewport?.height ?? parentWindow.innerHeight;
      iframe.style.left = `${visualViewport?.offsetLeft ?? 0}px`;
      iframe.style.top = `${visualViewport?.offsetTop ?? 0}px`;
      iframe.style.width = `${width}px`;
      iframe.style.height = `${height}px`;
    };

    applyViewport();
    parentWindow.addEventListener('resize', applyViewport);
    visualViewport?.addEventListener('resize', applyViewport);
    visualViewport?.addEventListener('scroll', applyViewport);

    return () => {
      parentWindow.removeEventListener('resize', applyViewport);
      visualViewport?.removeEventListener('resize', applyViewport);
      visualViewport?.removeEventListener('scroll', applyViewport);
    };
  }

  function mountWriter() {
    if (app) return;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('script_id', getScriptId());
    iframe.setAttribute('frameborder', '0');
    iframe.style.cssText =
      'position:fixed;left:0;top:0;width:100%;height:100%;z-index:99999;border:0;background:#f4f1e8;';

    iframe.addEventListener('load', () => {
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      iframeDoc.documentElement.style.cssText =
        'width:100%;height:100%;margin:0;overflow:hidden;overscroll-behavior:contain;';
      iframeDoc.body.style.cssText = 'width:100%;height:100%;margin:0;overflow:hidden;overscroll-behavior:contain;';

      const { destroy } = teleportStyle(iframeDoc.head);
      styleDestroy = destroy;
      app = createApp(App, { onExit: unmountWriter }).use(pinia);
      app.mount(iframeDoc.body);
    });

    parentDoc.body.appendChild(iframe);
    iframeEl = iframe;
    viewportDestroy = syncOverlayViewport(iframe);
  }

  replaceScriptButtons([{ name: '玉藻前写卡器', visible: true }]);
  eventOn(getButtonEvent('玉藻前写卡器'), mountWriter);

  $(window).on('pagehide', unmountWriter);
});
