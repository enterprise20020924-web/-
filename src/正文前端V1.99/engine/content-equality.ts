import type { DialogueMapEntry } from '../types/narrative';
import type { ChoiceOption, ParallelEvent } from '../types/content-renderer';

export function areDialogueMapsEqual(left: DialogueMapEntry[], right: DialogueMapEntry[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => {
    const nextEntry = right[index];
    return (
      nextEntry !== undefined &&
      entry.i === nextEntry.i &&
      entry.p === nextEntry.p &&
      entry.line_start === nextEntry.line_start &&
      entry.line_end === nextEntry.line_end &&
      entry.anchor === nextEntry.anchor &&
      entry.speaker === nextEntry.speaker &&
      entry.focus === nextEntry.focus &&
      entry.kind === nextEntry.kind
    );
  });
}

export function areParallelEventsEqual(left: ParallelEvent[], right: ParallelEvent[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => {
    const nextEntry = right[index];
    return (
      nextEntry !== undefined && entry.character === nextEntry.character && entry.description === nextEntry.description
    );
  });
}

export function areChoiceOptionsEqual(left: ChoiceOption[], right: ChoiceOption[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => {
    const nextEntry = right[index];
    return nextEntry !== undefined && entry.label === nextEntry.label && entry.text === nextEntry.text;
  });
}

export function areStringArraysEqual(left: string[], right: string[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => entry === right[index]);
}
