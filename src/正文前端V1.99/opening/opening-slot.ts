export const OPENING_SLOT_SELECTOR = '.custom-bp-opening-slot-v198, .bp-opening-slot-v198';

export function isOpeningMessageText(source: string) {
  return source.includes('【【】】');
}

export function mutationTouchesOpeningSlot(mutation: MutationRecord) {
  return [...mutation.addedNodes, ...mutation.removedNodes].some(
    node =>
      node.nodeType === Node.ELEMENT_NODE &&
      ((node as Element).matches(OPENING_SLOT_SELECTOR) ||
        (node as Element).querySelector(OPENING_SLOT_SELECTOR) !== null),
  );
}
