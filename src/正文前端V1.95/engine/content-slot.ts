export const NARRATIVE_SLOT_SELECTOR = '.bp-narrative-slot-v194';
export const NARRATIVE_END_SELECTOR = '.bp-narrative-end-v194';

export function getNarrativeSlot(root: HTMLElement) {
  return root.querySelector<HTMLElement>(NARRATIVE_SLOT_SELECTOR);
}

/** Display-only regex provides explicit boundaries; no text search or tag guessing. */
export function createNarrativeSourceRange(root: HTMLElement) {
  const slot = getNarrativeSlot(root);
  if (slot === null) return null;
  const end = [...root.querySelectorAll(NARRATIVE_END_SELECTOR)].find(
    element => slot.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
  if (end === undefined) return null;
  const range = root.ownerDocument.createRange();
  range.setStartAfter(slot);
  range.setEndBefore(end);
  return range;
}

export function mutationTouchesNarrativeSlot(mutation: MutationRecord) {
  const selector = `${NARRATIVE_SLOT_SELECTOR}, ${NARRATIVE_END_SELECTOR}`;
  return [...mutation.addedNodes, ...mutation.removedNodes].some(
    node =>
      node.nodeType === Node.ELEMENT_NODE &&
      ((node as Element).matches(selector) || (node as Element).querySelector(selector) !== null),
  );
}
