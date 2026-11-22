import { createApp, h } from 'vue';
import App from '../../性斗学园测试版/开局/app.vue';
import AdmissionCharacterStage from './AdmissionCharacterStage.vue';
import AdmissionReloadScenery from './AdmissionReloadScenery.vue';
import AdmissionReloadDial from './AdmissionReloadDial.vue';
import AdmissionReloadWelcome from './AdmissionReloadWelcome.vue';
import AdmissionReloadBrand from './AdmissionReloadBrand.vue';
import AdmissionTabletShell from './AdmissionTabletShell.vue';
import AdmissionImagePreload from './AdmissionImagePreload.vue';
import type { ImagePreloadController } from '../assets/image-preload-types';
import '../../性斗学园测试版/开局/tailwind.css';
import '../../性斗学园测试版/开局/index.scss';
import '../../性斗学园测试版/shared/skylink.scss';
import '../../性斗学园测试版/shared/skylink-opening.scss';
import '../../性斗学园测试版/shared/skylink-admission.scss';
import '../../性斗学园测试版/shared/skylink-dossier.scss';
import './admission-archive.scss';
import './admission-characters.scss';
import './admission-select.scss';
import './admission-reload.scss';
import './admission-reload-forms.scss';
import './admission-reload-select.scss';
export function mountOpeningPage(imagePreloader: ImagePreloadController) {
  const root = document.getElementById('app')!;
  const app = createApp({
    render: () =>
      h(AdmissionTabletShell, null, {
        default: () =>
          h(
            App,
            { archiveTheme: true, class: 'is-reload-theme' },
            {
              'opening-scenery': () => h(AdmissionReloadScenery),
              'header-brand': () => h(AdmissionReloadBrand),
              'header-visual': (props: { current: number; total: number }) => h(AdmissionReloadDial, props),
              'welcome-visual': () => h(AdmissionReloadWelcome),
              'sidebar-assistant': () => h(AdmissionImagePreload, { controller: imagePreloader }),
              'character-selection': (props: Record<string, unknown>) => h(AdmissionCharacterStage, props),
            },
          ),
      }),
  });
  app.mount(root);
  // Start once when the opening becomes visible; subsequent mounts retain pauses and progress.
  if (imagePreloader.snapshot().status === 'idle') void imagePreloader.start();
  let mounted = true;
  const unmount = () => {
    if (!mounted) return;
    mounted = false;
    window.removeEventListener('pagehide', unmount);
    app.unmount();
  };
  window.addEventListener('pagehide', unmount, { once: true });
  return { root, unmount };
}
