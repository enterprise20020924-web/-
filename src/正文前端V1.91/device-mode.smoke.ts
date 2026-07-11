import { detectDeviceMode, resolveHostDeviceMode } from './device-mode.ts';
import type { DeviceSignals } from './device-mode.ts';

function assertEqual(actual: string, expected: string, name: string) {
  if (actual !== expected) {
    throw Error(`${name}: expected ${expected}, received ${actual}`);
  }
}

function createSignals(overrides: Partial<DeviceSignals> = {}): DeviceSignals {
  return {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0 Safari/537.36',
    platform: 'Win32',
    maxTouchPoints: 0,
    viewportWidth: 1920,
    viewportHeight: 1080,
    screenWidth: 1920,
    screenHeight: 1080,
    devicePixelRatio: 1,
    pointerCoarse: false,
    hoverNone: false,
    anyPointerFine: true,
    ...overrides,
  };
}

function createDeviceWindow(signals: DeviceSignals): Window {
  const preference = signals.preference === 'desktop' || signals.preference === 'phone' ? signals.preference : null;

  return {
    navigator: {
      userAgent: signals.userAgent,
      platform: signals.platform,
      maxTouchPoints: signals.maxTouchPoints,
      userAgentData: { mobile: signals.userAgentDataMobile },
    },
    localStorage: {
      getItem: () => preference,
    },
    innerWidth: signals.viewportWidth ?? signals.screenWidth,
    innerHeight: signals.viewportHeight ?? signals.screenHeight,
    screen: {
      width: signals.screenWidth,
      height: signals.screenHeight,
    },
    devicePixelRatio: signals.devicePixelRatio ?? 1,
    matchMedia: (query: string) =>
      ({
        matches:
          (query === '(pointer: coarse)' && signals.pointerCoarse) ||
          (query === '(hover: none)' && signals.hoverNone) ||
          (query === '(any-pointer: fine)' && signals.anyPointerFine),
      }) as MediaQueryList,
  } as unknown as Window;
}

const cases: Array<{ name: string; expected: 'desktop' | 'phone'; signals: DeviceSignals }> = [
  {
    name: '412x914 Chrome DevTools viewport overrides desktop preference',
    expected: 'phone',
    signals: createSignals({
      preference: 'desktop',
      viewportWidth: 412,
      viewportHeight: 914,
    }),
  },
  {
    name: '412x914 Chrome DevTools viewport accepts two-pixel rounding',
    expected: 'phone',
    signals: createSignals({
      preference: 'desktop',
      viewportWidth: 410,
      viewportHeight: 916,
    }),
  },
  {
    name: '412x914 Chrome DevTools screen overrides a wider layout viewport',
    expected: 'phone',
    signals: createSignals({
      preference: 'desktop',
      viewportWidth: 980,
      viewportHeight: 2174,
      screenWidth: 412,
      screenHeight: 914,
    }),
  },
  {
    name: '412x914 debug override does not match landscape',
    expected: 'desktop',
    signals: createSignals({
      viewportWidth: 914,
      viewportHeight: 412,
    }),
  },
  {
    name: 'unknown desktop-style UA uses compact portrait viewport fallback',
    expected: 'phone',
    signals: createSignals({
      viewportWidth: 390,
      viewportHeight: 700,
    }),
  },
  {
    name: 'unknown phone uses compact portrait screen when layout viewport is wide',
    expected: 'phone',
    signals: createSignals({
      viewportWidth: 980,
      viewportHeight: 1740,
      screenWidth: 430,
      screenHeight: 932,
    }),
  },
  {
    name: 'unknown phone normalizes physical pixel dimensions through DPR',
    expected: 'phone',
    signals: createSignals({
      viewportWidth: 1200,
      viewportHeight: 2670,
      screenWidth: 1200,
      screenHeight: 2670,
      devicePixelRatio: 3,
      maxTouchPoints: 5,
      pointerCoarse: true,
      hoverNone: true,
      anyPointerFine: false,
    }),
  },
  {
    name: '720 logical pixels wide tall portrait uses phone mode',
    expected: 'phone',
    signals: createSignals({
      viewportWidth: 720,
      viewportHeight: 1280,
      screenWidth: 720,
      screenHeight: 1280,
    }),
  },
  {
    name: 'compact portrait four-by-three window stays desktop',
    expected: 'desktop',
    signals: createSignals({
      viewportWidth: 540,
      viewportHeight: 720,
      screenWidth: 1920,
      screenHeight: 1080,
    }),
  },
  {
    name: 'portrait desktop monitor stays desktop',
    expected: 'desktop',
    signals: createSignals({
      viewportWidth: 1080,
      viewportHeight: 1920,
      screenWidth: 1080,
      screenHeight: 1920,
    }),
  },
  {
    name: 'high-DPI portrait desktop monitor is not DPR-normalized as a phone',
    expected: 'desktop',
    signals: createSignals({
      viewportWidth: 1080,
      viewportHeight: 1920,
      screenWidth: 1080,
      screenHeight: 1920,
      devicePixelRatio: 2,
      maxTouchPoints: 10,
      pointerCoarse: true,
      hoverNone: false,
      anyPointerFine: true,
    }),
  },
  {
    name: 'Xiaomi 15 through Chromium UA-CH',
    expected: 'phone',
    signals: createSignals({
      userAgent: 'Mozilla/5.0 (Linux; Android 15; 24129PN74C) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
      userAgentDataMobile: true,
      screenWidth: 393,
      screenHeight: 852,
      pointerCoarse: true,
      hoverNone: true,
      anyPointerFine: false,
    }),
  },
  {
    name: 'Android phone without UA-CH',
    expected: 'phone',
    signals: createSignals({
      userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
      screenWidth: 412,
      screenHeight: 915,
      pointerCoarse: true,
      hoverNone: true,
      anyPointerFine: false,
    }),
  },
  {
    name: 'iPhone',
    expected: 'phone',
    signals: createSignals({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
      screenWidth: 390,
      screenHeight: 844,
      pointerCoarse: true,
      hoverNone: true,
      anyPointerFine: false,
    }),
  },
  {
    name: 'iPadOS desktop user agent',
    expected: 'desktop',
    signals: createSignals({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      platform: 'MacIntel',
      maxTouchPoints: 5,
      screenWidth: 820,
      screenHeight: 1180,
      pointerCoarse: true,
      hoverNone: true,
      anyPointerFine: false,
    }),
  },
  {
    name: 'Android tablet',
    expected: 'desktop',
    signals: createSignals({
      userAgent: 'Mozilla/5.0 (Linux; Android 15; Tablet) AppleWebKit/537.36 Chrome/140.0 Safari/537.36',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
      screenWidth: 800,
      screenHeight: 1280,
      pointerCoarse: true,
      hoverNone: true,
      anyPointerFine: false,
    }),
  },
  {
    name: 'Surface touchscreen desktop',
    expected: 'desktop',
    signals: createSignals({
      maxTouchPoints: 10,
      screenWidth: 1368,
      screenHeight: 912,
      pointerCoarse: true,
      hoverNone: false,
      anyPointerFine: true,
    }),
  },
  {
    name: 'Desktop browser narrowed to phone viewport',
    expected: 'desktop',
    signals: createSignals(),
  },
  {
    name: 'Phone using desktop-style user agent',
    expected: 'phone',
    signals: createSignals({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
      screenWidth: 393,
      screenHeight: 852,
      pointerCoarse: true,
      hoverNone: true,
      anyPointerFine: false,
    }),
  },
  {
    name: 'Small phone using Macintosh desktop user agent',
    expected: 'phone',
    signals: createSignals({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Safari/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 5,
      screenWidth: 393,
      screenHeight: 852,
      pointerCoarse: true,
      hoverNone: true,
      anyPointerFine: false,
    }),
  },
  {
    name: 'Phone in landscape orientation',
    expected: 'phone',
    signals: createSignals({
      userAgent: 'Mozilla/5.0 (Linux; Android 15; 24129PN74C) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
      screenWidth: 852,
      screenHeight: 393,
      pointerCoarse: true,
      hoverNone: true,
      anyPointerFine: false,
    }),
  },
];

for (const testCase of cases) {
  assertEqual(detectDeviceMode(testCase.signals), testCase.expected, testCase.name);
}

assertEqual(detectDeviceMode(createSignals({ preference: 'phone' })), 'phone', 'forced phone preference');
assertEqual(
  detectDeviceMode(createSignals({ preference: 'desktop', userAgentDataMobile: true })),
  'desktop',
  'forced desktop preference',
);
assertEqual(
  detectDeviceMode(
    createSignals({
      preference: 'desktop',
      viewportWidth: 390,
      viewportHeight: 700,
    }),
  ),
  'desktop',
  'forced desktop preference overrides compact portrait fallback',
);

const visibleHostWindow = createDeviceWindow(
  createSignals({
    preference: 'desktop',
    viewportWidth: 412,
    viewportHeight: 914,
    screenWidth: 412,
    screenHeight: 914,
  }),
);
const backgroundScriptWindow = { parent: visibleHostWindow } as unknown as Window;
assertEqual(
  resolveHostDeviceMode(backgroundScriptWindow),
  'phone',
  'background script iframe uses the visible parent viewport',
);

const compactPortraitHostWindow = createDeviceWindow(
  createSignals({
    viewportWidth: 390,
    viewportHeight: 700,
  }),
);
const compactPortraitScriptWindow = { parent: compactPortraitHostWindow } as unknown as Window;
assertEqual(
  resolveHostDeviceMode(compactPortraitScriptWindow),
  'phone',
  'background script iframe uses compact portrait parent fallback',
);

console.log(`[device-mode] ${cases.length + 5} cases passed`);
