import { normalizeCharacterDataName, resolveCharacterDataName } from '../character-name-runtime';
import { fullbodyPortraitProfiles } from '../portrait-registry';

// Opening cards use the original battle gallery; the actual battlefield keeps full-body standees.
const BATTLE_PORTRAIT_BASE = 'https://img.vinsimage.org/性斗学园/立绘/';
const OPENING_PORTRAIT_NAMES: Record<string, string> = {
  // The existing boss definition starts Eden asleep, before her second portrait is revealed.
  伊甸芙宁: '伊甸芙宁_1',
};

function findExactPortrait(name: string) {
  const normalized = normalizeCharacterDataName(name);
  if (!normalized) return undefined;
  const direct = fullbodyPortraitProfiles.find(profile =>
    profile.names.some(alias => normalizeCharacterDataName(alias) === normalized),
  );
  if (direct) return direct;

  const canonical = resolveCharacterDataName(name);
  if (!canonical) return undefined;
  return fullbodyPortraitProfiles.find(profile =>
    profile.names.some(alias => resolveCharacterDataName(alias) === canonical),
  );
}

/** Exact database aliases only: never borrow another character's portrait by prefix matching. */
export function resolveEntrancePortrait(name: string, fallback = ''): string {
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  const portrait = findExactPortrait(trimmed);
  const canonical = resolveCharacterDataName(trimmed) ?? portrait?.displayName;
  if (!canonical) return fallback;
  const fileName = OPENING_PORTRAIT_NAMES[canonical] ?? canonical;
  return `${BATTLE_PORTRAIT_BASE}${encodeURIComponent(fileName)}.png`;
}

/** A caller may supply the current player's custom portrait as the same-identity fallback. */
export function getEntranceFallbackPortrait(name: string, fallback = ''): string {
  return fallback || findExactPortrait(name)?.portraitUrl || '';
}
