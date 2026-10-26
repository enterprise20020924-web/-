export type DeviceMode = 'desktop' | 'phone';
export type DeviceModePreference = 'auto' | DeviceMode;

export const DEVICE_MODE_STORAGE_KEY = 'bp-device-mode';

export interface DeviceSignals {
  preference?: DeviceModePreference;
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  userAgentDataMobile?: boolean;
  viewportWidth?: number;
  viewportHeight?: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio?: number;
  pointerCoarse: boolean;
  hoverNone: boolean;
  anyPointerFine: boolean;
}

const DEBUG_PHONE_VIEWPORT_WIDTH = 412;
const DEBUG_PHONE_VIEWPORT_HEIGHT = 914;
const DEBUG_PHONE_VIEWPORT_TOLERANCE = 2;
const COMPACT_PORTRAIT_MAX_LOGICAL_WIDTH = 720;
const COMPACT_PORTRAIT_MIN_HEIGHT_TO_WIDTH_RATIO = 5 / 3;

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    mobile?: boolean;
  };
};

function matchesDebugPhoneDimensions(width: number, height: number) {
  return (
    Math.abs(width - DEBUG_PHONE_VIEWPORT_WIDTH) <= DEBUG_PHONE_VIEWPORT_TOLERANCE &&
    Math.abs(height - DEBUG_PHONE_VIEWPORT_HEIGHT) <= DEBUG_PHONE_VIEWPORT_TOLERANCE
  );
}

function isDebugPhoneTarget(signals: DeviceSignals) {
  const viewportWidth = signals.viewportWidth ?? signals.screenWidth;
  const viewportHeight = signals.viewportHeight ?? signals.screenHeight;

  return (
    matchesDebugPhoneDimensions(viewportWidth, viewportHeight) ||
    matchesDebugPhoneDimensions(signals.screenWidth, signals.screenHeight)
  );
}

function matchesCompactPortraitDimensions(width: number, height: number) {
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > width &&
    width <= COMPACT_PORTRAIT_MAX_LOGICAL_WIDTH &&
    height / width >= COMPACT_PORTRAIT_MIN_HEIGHT_TO_WIDTH_RATIO
  );
}

function isCompactPortraitTarget(signals: DeviceSignals) {
  const viewportWidth = signals.viewportWidth ?? signals.screenWidth;
  const viewportHeight = signals.viewportHeight ?? signals.screenHeight;
  const dimensions: Array<[number, number]> = [
    [viewportWidth, viewportHeight],
    [signals.screenWidth, signals.screenHeight],
  ];

  if (dimensions.some(([width, height]) => matchesCompactPortraitDimensions(width, height))) {
    return true;
  }

  const devicePixelRatio = signals.devicePixelRatio ?? 1;
  const canNormalizePhysicalDimensions =
    Number.isFinite(devicePixelRatio) &&
    devicePixelRatio > 1 &&
    !signals.anyPointerFine &&
    (signals.maxTouchPoints > 0 || signals.pointerCoarse || signals.hoverNone);

  return (
    canNormalizePhysicalDimensions &&
    dimensions.some(([width, height]) =>
      matchesCompactPortraitDimensions(width / devicePixelRatio, height / devicePixelRatio),
    )
  );
}

export function detectDeviceMode(signals: DeviceSignals): DeviceMode {
  if (isDebugPhoneTarget(signals)) {
    return 'phone';
  }

  if (signals.preference === 'desktop' || signals.preference === 'phone') {
    return signals.preference;
  }

  const shortSide = Math.min(signals.screenWidth, signals.screenHeight);
  const isIPad =
    /iPad/i.test(signals.userAgent) ||
    (signals.platform === 'MacIntel' && signals.maxTouchPoints > 1 && shortSide > 600);
  const isAndroidTablet = /Android/i.test(signals.userAgent) && !/Mobile/i.test(signals.userAgent);

  if (isIPad || isAndroidTablet) {
    return 'desktop';
  }

  if (isCompactPortraitTarget(signals)) {
    return 'phone';
  }

  if (signals.userAgentDataMobile === true) {
    return 'phone';
  }

  if (/iPhone|iPod|Windows Phone|IEMobile|Opera Mini/i.test(signals.userAgent)) {
    return 'phone';
  }

  if (/Android/i.test(signals.userAgent) && /Mobile/i.test(signals.userAgent)) {
    return 'phone';
  }

  if (shortSide <= 600 && signals.pointerCoarse && signals.hoverNone && !signals.anyPointerFine) {
    return 'phone';
  }

  return 'desktop';
}

function readDeviceModePreference(targetWindow: Window): DeviceModePreference {
  try {
    const storedValue = targetWindow.localStorage.getItem(DEVICE_MODE_STORAGE_KEY);
    if (storedValue === 'desktop' || storedValue === 'phone') {
      return storedValue;
    }
  } catch {
    // Storage can be unavailable in restricted iframe contexts.
  }

  return 'auto';
}

export function resolveDeviceMode(targetWindow: Window = window): DeviceMode {
  const navigator = targetWindow.navigator as NavigatorWithUserAgentData;

  return detectDeviceMode({
    preference: readDeviceModePreference(targetWindow),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    userAgentDataMobile: navigator.userAgentData?.mobile,
    viewportWidth: targetWindow.innerWidth,
    viewportHeight: targetWindow.innerHeight,
    screenWidth: targetWindow.screen.width,
    screenHeight: targetWindow.screen.height,
    devicePixelRatio: targetWindow.devicePixelRatio,
    pointerCoarse: targetWindow.matchMedia('(pointer: coarse)').matches,
    hoverNone: targetWindow.matchMedia('(hover: none)').matches,
    anyPointerFine: targetWindow.matchMedia('(any-pointer: fine)').matches,
  });
}

export function resolveHostDeviceMode(scriptWindow: Window = window): DeviceMode {
  try {
    if (scriptWindow.parent !== scriptWindow) {
      return resolveDeviceMode(scriptWindow.parent);
    }
  } catch {
    // Fall back to the script iframe if the parent window is not accessible.
  }

  return resolveDeviceMode(scriptWindow);
}
