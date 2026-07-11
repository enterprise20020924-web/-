import { stripDialogueMapBlocks } from './dialogue-map';
import type { ChoiceOption, ParallelEvent } from '../types/content-renderer';
const COT_BLOCK_PATTERNS = [
  /<konatan_planning~(?:\s+[^>]*)?>[\s\S]*?<\/konatan_planning~>/gi,
  /<(thinking|think|redacted_reasoning|fox_think|fox_thinking)\b[^>]*>[\s\S]*?<\/\1>/gi,
  /<think\b[^>]*>[\s\S]*?<\/redacted_reasoning>/gi,
  /<redacted_reasoning\b[^>]*>[\s\S]*?<\/think>/gi,
];
const COT_OPEN_TAG_PATTERN = /<(?:thinking|think|redacted_reasoning|fox_think|fox_thinking)\b[^>]*>/i;
const COT_CLOSE_TAG_PATTERN = /<\/(?:thinking|think|redacted_reasoning|fox_think|fox_thinking)>/i;
const CONTENT_OPEN_TAG_PATTERN = /<(?:content|maintext)\b[^>]*>/i;

function findOrphanedLeadingCotBlock(message: string) {
  const closeMatch = COT_CLOSE_TAG_PATTERN.exec(message);
  if (closeMatch === null) {
    return null;
  }

  const head = message.slice(0, closeMatch.index);
  if (head.trim().length === 0 || COT_OPEN_TAG_PATTERN.test(head)) {
    return null;
  }

  const contentMatch = CONTENT_OPEN_TAG_PATTERN.exec(message);
  if (contentMatch !== null && contentMatch.index < closeMatch.index) {
    return null;
  }

  return {
    start: 0,
    end: closeMatch.index + closeMatch[0].length,
    content: head,
  };
}

export function stripCotBlocksForStructure(message: string) {
  let result = message;
  const orphanedLeadingCotBlock = findOrphanedLeadingCotBlock(result);
  if (orphanedLeadingCotBlock !== null) {
    result = result.slice(orphanedLeadingCotBlock.end);
  }

  let previous = '';

  while (result !== previous) {
    previous = result;
    for (const pattern of COT_BLOCK_PATTERNS) {
      pattern.lastIndex = 0;
      result = result.replace(pattern, '');
    }
  }

  return result;
}

function getCotBlockRanges(message: string) {
  const ranges: Array<{ start: number; end: number }> = [];
  const orphanedLeadingCotBlock = findOrphanedLeadingCotBlock(message);
  if (orphanedLeadingCotBlock !== null) {
    ranges.push({ start: orphanedLeadingCotBlock.start, end: orphanedLeadingCotBlock.end });
  }

  for (const pattern of COT_BLOCK_PATTERNS) {
    pattern.lastIndex = 0;
    let match = pattern.exec(message);
    while (match !== null) {
      ranges.push({ start: match.index, end: match.index + match[0].length });
      match = pattern.exec(message);
    }
  }

  return ranges.sort((left, right) => left.start - right.start);
}

function isOffsetInsideRanges(offset: number, ranges: Array<{ start: number; end: number }>) {
  return ranges.some(range => offset >= range.start && offset < range.end);
}

function findJsonArrayEnd(value: string, start: number) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return null;
}

function findBareDialogueMapRangeOutsideCot(message: string, cotRanges: Array<{ start: number; end: number }>) {
  const contentClosePattern = /<\/(?:content|maintext)>/gi;
  let closeMatch: RegExpExecArray | null = null;
  let nextMatch = contentClosePattern.exec(message);
  while (nextMatch !== null) {
    if (!isOffsetInsideRanges(nextMatch.index, cotRanges)) {
      closeMatch = nextMatch;
    }
    nextMatch = contentClosePattern.exec(message);
  }

  if (closeMatch === null) {
    return null;
  }

  const contentEnd = closeMatch.index + closeMatch[0].length;
  const tail = message.slice(contentEnd);
  const whitespaceMatch = tail.match(/^\s*/);
  const jsonStartInTail = whitespaceMatch?.[0].length ?? 0;
  if (tail[jsonStartInTail] !== '[') {
    return null;
  }

  const jsonEndInTail = findJsonArrayEnd(tail, jsonStartInTail);
  if (jsonEndInTail === null) {
    return null;
  }

  const payload = tail.slice(jsonStartInTail, jsonEndInTail + 1);
  if (!/"i"\s*:/.test(payload) || !/"anchor"\s*:/.test(payload)) {
    return null;
  }

  return {
    start: contentEnd + jsonStartInTail,
    end: contentEnd + jsonEndInTail + 1,
  };
}

export function removeDialogueMapOutsideCot(message: string) {
  const cotRanges = getCotBlockRanges(message);
  const removalRanges: Array<{ start: number; end: number }> = [];
  const dialogueMapPattern = /<dialogue_map\b[^>]*>[\s\S]*?<\/dialogue_map>/gi;
  let match = dialogueMapPattern.exec(message);
  while (match !== null) {
    if (!isOffsetInsideRanges(match.index, cotRanges)) {
      removalRanges.push({ start: match.index, end: match.index + match[0].length });
    }
    match = dialogueMapPattern.exec(message);
  }

  const bareMapRange = findBareDialogueMapRangeOutsideCot(message, cotRanges);
  if (bareMapRange !== null) {
    removalRanges.push(bareMapRange);
  }

  return removalRanges
    .sort((left, right) => right.start - left.start)
    .reduce((result, range) => `${result.slice(0, range.start)}${result.slice(range.end)}`, message)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractContent(message: string) {
  const source = stripCotBlocksForStructure(message);
  const openMatch = source.match(/<(content|maintext)\b[^>]*>/i);
  if (openMatch === null || openMatch.index === undefined) {
    return null;
  }

  const tagName = openMatch[1];
  const contentStart = openMatch.index + openMatch[0].length;
  const tail = source.slice(contentStart);
  const closePattern = new RegExp(`</${tagName}>`, 'i');
  const closeMatch = tail.match(closePattern);

  if (closeMatch === null || closeMatch.index === undefined) {
    return tail;
  }

  return tail.slice(0, closeMatch.index);
}

export function getMessageDialogueMapSourceText(message: string) {
  const cleanedMessage = stripDialogueMapBlocks(message);
  return stripHiddenBlocks(extractContent(cleanedMessage) ?? cleanedMessage);
}

const HIDDEN_CONTENT_BLOCK_TAGS = new Set([
  'analysis',
  'choice',
  'draft',
  'fox_think',
  'fox_thinking',
  'generate_image',
  'image',
  'image_prompt',
  'img',
  'jsonpatch',
  'nai',
  'novelai',
  'option',
  'parallel',
  'prompt',
  'prompts',
  'reasoning',
  'redacted_reasoning',
  'scratchpad',
  'sd',
  'stable_diffusion',
  'style',
  'sum',
  'think',
  'thinking',
  'updatevariable',
]);

function stripKnownControlTagBlocks(text: string) {
  let result = text;
  let previous = '';
  const pairedTagPattern = /<([A-Za-z][\w:-]*)(?:\s+[^>]*)?>[\s\S]*?<\/\1>/gi;

  while (result !== previous) {
    previous = result;
    result = result.replace(pairedTagPattern, (match, tagName: string) =>
      HIDDEN_CONTENT_BLOCK_TAGS.has(tagName.toLowerCase()) ? '' : match,
    );
  }

  return result;
}

function stripAngleControlTags(text: string) {
  const withoutKnownBlocks = stripKnownControlTagBlocks(
    stripCotBlocksForStructure(text.replace(/<!--[\s\S]*?-->/g, '')),
  );

  return withoutKnownBlocks
    .replace(/<![^>\n]*>/g, '')
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[A-Za-z][\w:-]*(?:\s+[^<>]*)?\s*\/?>/g, '');
}

export function stripHiddenBlocks(text: string) {
  return stripAngleControlTags(
    stripDialogueMapBlocks(text).replace(
      /(?:^|\n)[^\n]*(?:画图提示词|绘图提示词|文生图提示词|图像提示词|image prompt)[^\n]*(?=\n\s*<image\b)/gi,
      '\n',
    ),
  )
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<choice>[\s\S]*?<\/choice>/gi, '')
    .replace(/<option>[\s\S]*?<\/option>/gi, '')
    .replace(/<sum>[\s\S]*?<\/sum>/gi, '')
    .replace(/^\s*<[^>\n]+>\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanThinkingBlockText(text: string) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[A-Za-z][\w:-]*(?:\s+[^<>]*)?\s*\/?>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractThinkingContent(message: string) {
  const source = stripDialogueMapBlocks(message);
  const blocks: string[] = [];
  const seen = new Set<string>();
  const patterns = [
    /<(thinking|think|redacted_reasoning|fox_think|fox_thinking)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    /<konatan_planning~(?:\s+[^>]*)?>([\s\S]*?)<\/konatan_planning~>/gi,
    /<think\b[^>]*>([\s\S]*?)<\/redacted_reasoning>/gi,
    /<redacted_reasoning\b[^>]*>([\s\S]*?)<\/think>/gi,
  ];

  const pushBlock = (value: string) => {
    const cleaned = cleanThinkingBlockText(value);
    if (cleaned.length === 0 || seen.has(cleaned)) {
      return;
    }

    seen.add(cleaned);
    blocks.push(cleaned);
  };

  const orphanedLeadingCotBlock = findOrphanedLeadingCotBlock(source);
  if (orphanedLeadingCotBlock !== null) {
    pushBlock(orphanedLeadingCotBlock.content);
  }

  for (const pattern of patterns) {
    let match = pattern.exec(source);
    while (match !== null) {
      pushBlock(match[2] ?? match[1] ?? '');
      match = pattern.exec(source);
    }
  }

  return blocks.join('\n\n---\n\n');
}

function cleanParallelEventText(text: string) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[A-Za-z][\w:-]*(?:\s+[^<>]*)?\s*\/?>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseParallelEvents(content: string): ParallelEvent[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .reduce<ParallelEvent[]>((events, line) => {
      const match = line.match(/^\[([^|[\]]+)\s*\|\s*(.+)\]$/);
      if (match === null) {
        return events;
      }

      const character = cleanParallelEventText(match[1] ?? '');
      const description = cleanParallelEventText(match[2] ?? '');
      if (character.length === 0 || description.length === 0) {
        return events;
      }

      events.push({ character, description });
      return events;
    }, []);
}

export function extractParallelEvents(message: string): ParallelEvent[] {
  const source = stripDialogueMapBlocks(message);
  const blocks = Array.from(source.matchAll(/<parallel\b[^>]*>([\s\S]*?)<\/parallel>/gi));
  if (blocks.length === 0) {
    return [];
  }

  return parseParallelEvents((blocks.at(-1)?.[1] ?? '').trim());
}

function cleanChoiceOptionText(text: string) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[A-Za-z][\w:-]*(?:\s+[^<>]*)?\s*\/?>/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeChoiceOptionLabel(label: string | undefined, index: number) {
  const fallback = String.fromCharCode(65 + index);
  if (label === undefined) {
    return fallback;
  }

  const normalizedLabel = label.trim().toUpperCase();
  if (/^[A-Z]$/.test(normalizedLabel)) {
    return normalizedLabel;
  }

  const numericLabel = Number(normalizedLabel);
  if (Number.isInteger(numericLabel) && numericLabel >= 1 && numericLabel <= 26) {
    return String.fromCharCode(64 + numericLabel);
  }

  return fallback;
}

function parseChoiceOptions(content: string): ChoiceOption[] {
  const cleanedContent = cleanChoiceOptionText(
    content
      .replace(/<option_analysis\b[^>]*>[\s\S]*?<\/option_analysis>/gi, '')
      .replace(/<choice_analysis\b[^>]*>[\s\S]*?<\/choice_analysis>/gi, ''),
  );

  const options: ChoiceOption[] = [];
  let activeOption: ChoiceOption | null = null;

  for (const rawLine of cleanedContent.split('\n')) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }

    const bracketMatch = line.match(
      /^\[?\s*([A-Za-z]|(?:[1-9]|1\d|2[0-6]))\s*(?:[.。:：、)|]|[-–—]\s*)\s*(.+?)\s*\]?$/,
    );
    const plainMatch = line.match(/^(?:[-*]\s*)?([A-Za-z]|(?:[1-9]|1\d|2[0-6]))\s*[.。:：、)]\s*(.+)$/);
    const match = bracketMatch ?? plainMatch;

    if (match !== null) {
      activeOption = {
        label: normalizeChoiceOptionLabel(match[1], options.length),
        text: cleanChoiceOptionText(match[2] ?? ''),
      };
      if (activeOption.text.length > 0) {
        options.push(activeOption);
      }
      continue;
    }

    if (activeOption !== null) {
      activeOption.text = `${activeOption.text}\n${line}`.trim();
      continue;
    }

    options.push({
      label: normalizeChoiceOptionLabel(undefined, options.length),
      text: line,
    });
  }

  return options.filter(option => option.text.length > 0);
}

export function extractChoiceOptions(message: string): ChoiceOption[] {
  const source = stripDialogueMapBlocks(message);
  const choiceBlocks = Array.from(source.matchAll(/<choice\b[^>]*>([\s\S]*?)<\/choice>/gi));
  const optionBlocks = Array.from(source.matchAll(/<option\b[^>]*>([\s\S]*?)<\/option>/gi));
  const preferredBlocks = choiceBlocks.length > 0 ? choiceBlocks : optionBlocks;
  if (preferredBlocks.length === 0) {
    return [];
  }

  return parseChoiceOptions((preferredBlocks.at(-1)?.[1] ?? '').trim());
}

export function extractJsonPatchBlocks(message: string) {
  return Array.from(message.matchAll(/<JSONPatch\b[^>]*>([\s\S]*?)<\/JSONPatch>/gi))
    .map(match => (match[1] ?? '').trim())
    .filter(block => block.length > 0);
}

function isBareDialogueMapText(text: string) {
  return /^\s*\[\s*\{\s*"i"[\s\S]*?\]\s*$/.test(text);
}

function isTaggedDialogueMapText(text: string) {
  return /^\s*<dialogue_map\b[^>]*>[\s\S]*?<\/dialogue_map>\s*$/.test(text);
}

export function isDialogueMapRenderText(text: string) {
  return isBareDialogueMapText(text) || isTaggedDialogueMapText(text);
}
