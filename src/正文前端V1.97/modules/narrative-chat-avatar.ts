import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { NarrativeChatAvatarCandidate, NarrativeChatAvatarKind } from '../engine/narrative-chat';

export const CHAT_AVATAR_STYLE_KEY = 'amami-chat-avatar-style:v1';
const changeEvent = 'amami-chat-avatar-style-change';

export function normalizeChatAvatarStyle(value: unknown): NarrativeChatAvatarKind {
  return value === 'avatar' ? 'avatar' : 'portrait';
}

export function chooseChatAvatar(
  candidates: NarrativeChatAvatarCandidate[],
  preferred: NarrativeChatAvatarKind,
  failedUrls: ReadonlySet<string>,
): NarrativeChatAvatarCandidate | null {
  const available = candidates.filter(candidate => !failedUrls.has(candidate.url));
  return available.find(candidate => candidate.kind === preferred) ?? available[0] ?? null;
}

export function useChatAvatarStyle() {
  let storage: Storage | null = null;
  try {
    storage = window.localStorage;
  } catch {
    // Avatar switching remains available in storage-restricted embeds.
  }
  function readStyle() {
    try {
      return normalizeChatAvatarStyle(storage?.getItem(CHAT_AVATAR_STYLE_KEY));
    } catch {
      return 'portrait' as const;
    }
  }
  const avatarStyle = ref<NarrativeChatAvatarKind>(readStyle());
  function setAvatarStyle(style: NarrativeChatAvatarKind) {
    avatarStyle.value = style;
    try {
      storage?.setItem(CHAT_AVATAR_STYLE_KEY, style);
    } catch {
      // Keep the selected style for this mounted view even when saving is blocked.
    }
    window.dispatchEvent(new CustomEvent(changeEvent, { detail: style }));
  }
  function handleStyleChange(event: Event) {
    avatarStyle.value = normalizeChatAvatarStyle((event as CustomEvent<unknown>).detail);
  }
  function handleStorage(event: StorageEvent) {
    if (event.storageArea === storage && (event.key === CHAT_AVATAR_STYLE_KEY || event.key === null)) {
      avatarStyle.value = normalizeChatAvatarStyle(event.newValue);
    }
  }
  onMounted(() => {
    window.addEventListener(changeEvent, handleStyleChange);
    window.addEventListener('storage', handleStorage);
  });
  onBeforeUnmount(() => {
    window.removeEventListener(changeEvent, handleStyleChange);
    window.removeEventListener('storage', handleStorage);
  });
  return { avatarStyle, setAvatarStyle };
}
