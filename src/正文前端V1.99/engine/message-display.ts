import { addScriptDisplaySlots } from './narrative-display-rule';
import { runWithSuppressedMessageMutation } from './renderer-host';

type DisplayState = {
  root: HTMLElement;
  marker: Comment;
  source: string;
  swipeId: number;
};
const displays = new Map<number, DisplayState>();

/** A comment survives our own iframe/range edits, but not a fresh Tavern message render. */
function ownsDisplay(state: DisplayState) {
  return state.marker.parentNode === state.root;
}

export function prepareScriptMessageDisplay(messageId: number, root: HTMLElement, source: string, swipeId: number) {
  const previous = displays.get(messageId);
  if (previous?.root === root && previous.source === source && previous.swipeId === swipeId && ownsDisplay(previous))
    return;

  const displaySource = addScriptDisplaySlots(source);
  if (displaySource === source) {
    displays.delete(messageId);
    if (previous?.root === root && ownsDisplay(previous)) {
      const html = formatAsDisplayedMessage(source, { message_id: messageId });
      runWithSuppressedMessageMutation(root, () => {
        root.innerHTML = html;
      });
    }
    return;
  }

  // Consume our markers before other display regexes. Formatting the copy retains
  // Markdown, macros and unrelated before/after content in their original order.
  const html = formatAsDisplayedMessage(displaySource, { message_id: messageId });
  const marker = root.ownerDocument.createComment('bp-script-display-v198');
  runWithSuppressedMessageMutation(root, () => {
    root.innerHTML = html;
    root.prepend(marker);
  });
  displays.set(messageId, { root, marker, source, swipeId });
}

export function releaseScriptMessageDisplay(messageId: number, restore = true) {
  const state = displays.get(messageId);
  displays.delete(messageId);
  if (!state || !restore || !state.root.isConnected || !ownsDisplay(state)) return;
  const html = formatAsDisplayedMessage(state.source, { message_id: messageId });
  runWithSuppressedMessageMutation(state.root, () => {
    state.root.innerHTML = html;
  });
}

export function clearScriptMessageDisplays(restore = false) {
  [...displays.keys()].forEach(messageId => releaseScriptMessageDisplay(messageId, restore));
}

export function pruneScriptMessageDisplays(allowedMessageIds: Set<number>) {
  displays.forEach((state, messageId) => {
    if (!allowedMessageIds.has(messageId) || !state.root.isConnected) releaseScriptMessageDisplay(messageId);
  });
}
