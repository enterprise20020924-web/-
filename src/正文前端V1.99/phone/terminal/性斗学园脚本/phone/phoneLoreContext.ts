import { getEntriesArray, worldbookClient } from './worldbookClient';
import { clipText, normalizeName, safeString, uniqueStrings } from './text';

interface NormalizedLoreEntry {
  title: string;
  content: string;
  worldName: string;
  order: number;
}

interface BuildPhoneLoreContextOptions {
  contact: string;
  characterData: any;
}

const SOURCE_WORLDBOOK_FALLBACKS = ['性斗学园', '性斗学院'];
const STATIC_ENTRY_SPECS = [
  { label: 'user', names: ['user', '用户'] },
  { label: '核心世界观', names: ['核心世界观'] },
  { label: '战斗系统', names: ['战斗系统'] },
  { label: '地图', names: ['地图'] },
  { label: '势力列表', names: ['势力列表'] },
  { label: '人物列表', names: ['人物列表'] },
];

function getGlobalAny(): any {
  return window as any;
}

function getWorldbookNamesFromHelper(): string[] {
  const globalAny = getGlobalAny();
  const fn = globalAny.getWorldbookNames || (globalThis as any).getWorldbookNames;
  if (typeof fn !== 'function') return [];
  try {
    return Array.isArray(fn()) ? fn().map(safeString).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getCandidateWorldbookNames(): string[] {
  const helperNames = getWorldbookNamesFromHelper();
  const preferred = helperNames.filter(name => SOURCE_WORLDBOOK_FALLBACKS.includes(name));
  const related = helperNames.filter(name => /性斗学[园院]/.test(name) && !name.startsWith('后街-'));
  return uniqueStrings([...preferred, ...related, ...SOURCE_WORLDBOOK_FALLBACKS]);
}

function readEntryTitle(entry: Record<string, unknown>): string {
  return safeString(entry.comment || entry.name || entry.title || entry.identifier);
}

function readEntryContent(entry: Record<string, unknown>): string {
  return safeString(entry.content || entry.prompt || entry.text);
}

function readEntryOrder(entry: Record<string, unknown>): number {
  const raw = Number(entry.order ?? entry.position ?? entry.displayIndex ?? 0);
  return Number.isFinite(raw) ? raw : 0;
}

function normalizeEntries(source: unknown, worldName: string): NormalizedLoreEntry[] {
  const rawEntries = Array.isArray(source) ? source : getEntriesArray(source as any);
  return rawEntries
    .map(entry => {
      const record = (entry || {}) as Record<string, unknown>;
      return {
        title: readEntryTitle(record),
        content: readEntryContent(record),
        worldName,
        order: readEntryOrder(record),
      };
    })
    .filter(entry => !!entry.title && !!entry.content);
}

async function readWorldbookEntries(name: string): Promise<NormalizedLoreEntry[]> {
  const globalAny = getGlobalAny();
  const helperGetWorldbook = globalAny.getWorldbook || (globalThis as any).getWorldbook;
  if (typeof helperGetWorldbook === 'function') {
    try {
      return normalizeEntries(await helperGetWorldbook(name), name);
    } catch {
      // Fall back to the HTTP worldbook client below.
    }
  }

  const data = await worldbookClient.readWorldbook(name, { allowMissing: true }).catch(() => null);
  return normalizeEntries(data, name);
}

function findEntry(entries: NormalizedLoreEntry[], names: string[]): NormalizedLoreEntry | null {
  const normalizedNames = names.map(normalizeName);
  return (
    entries.find(entry => normalizedNames.includes(normalizeName(entry.title))) ||
    entries.find(entry => normalizedNames.some(name => normalizeName(entry.title).includes(name))) ||
    null
  );
}

function splitLocationTokens(value: string): string[] {
  return uniqueStrings(
    safeString(value)
      .split(/[·・、，,/:：|｜\s()[\]（）【】]+/g)
      .map(token => token.trim())
      .filter(token => token.length >= 2),
  );
}

function scoreLocationEntry(entry: NormalizedLoreEntry, characterData: any, reservedTitles: Set<string>): number {
  const title = normalizeName(entry.title);
  if (!title || reservedTitles.has(title)) return 0;

  const locationName = safeString(characterData?.位置系统?.地点名称);
  const coord = safeString(characterData?.位置系统?.坐标);
  const locationTokens = splitLocationTokens(locationName).sort((left, right) => right.length - left.length);
  const normalizedLocation = normalizeName(locationName);
  const normalizedContent = normalizeName(entry.content);
  const normalizedCoord = normalizeName(coord);

  let score = 0;
  if (normalizedLocation && title === normalizedLocation) score += 120;
  if (normalizedLocation && title.includes(normalizedLocation)) score += 80;
  if (normalizedLocation && normalizedContent.includes(normalizedLocation)) score += 18;
  for (const token of locationTokens) {
    const normalizedToken = normalizeName(token);
    if (!normalizedToken) continue;
    if (title.includes(normalizedToken)) score += Math.min(70, 24 + normalizedToken.length * 4);
    if (normalizedContent.includes(normalizedToken)) score += 8;
  }
  if (normalizedCoord && title.includes(normalizedCoord)) score += 45;
  if (normalizedCoord && normalizedContent.includes(normalizedCoord)) score += 18;
  if (/区域|地点|神社|甬道|宿舍|体育馆|教室|回廊|墓道|妖域/.test(entry.title)) score += 10;
  return score;
}

async function renderTemplateContent(content: string, characterData: any): Promise<string> {
  const raw = safeString(content);
  if (!raw) return '';

  const fallback = raw.replace(/\{\{\s*format_message_variable::stat_data\s*\}\}/g, () =>
    JSON.stringify(characterData || {}, null, 2),
  );

  if (!/[<{]\{?|<%/.test(raw)) return fallback;

  const globalAny = getGlobalAny();
  const ejs = globalAny.EjsTemplate || (globalThis as any).EjsTemplate;
  const evalTemplate = ejs?.evalTemplate || ejs?.evaltemplate;
  if (typeof evalTemplate !== 'function') return fallback;

  try {
    const context =
      typeof ejs.prepareContext === 'function'
        ? await ejs.prepareContext({ stat_data: characterData, characterData })
        : { stat_data: characterData, characterData };
    return safeString(await evalTemplate.call(ejs, raw, context)) || fallback;
  } catch (error) {
    console.warn('[后街] 世界书模板渲染失败，已使用原始内容:', error);
    return fallback;
  }
}

function formatEntry(entry: NormalizedLoreEntry, content: string): string {
  return `- ${entry.title}\n【${entry.title}】\n${content}`;
}

export class PhoneLoreContextBuilder {
  private cachedEntries: { at: number; entries: NormalizedLoreEntry[] } | null = null;

  private async getSourceEntries(): Promise<NormalizedLoreEntry[]> {
    if (this.cachedEntries && Date.now() - this.cachedEntries.at < 10000) {
      return this.cachedEntries.entries;
    }

    const grouped = await Promise.all(
      getCandidateWorldbookNames().map(async name => readWorldbookEntries(name).catch(() => [])),
    );
    const entries = grouped.flat();
    this.cachedEntries = { at: Date.now(), entries };
    return entries;
  }

  async build(options: BuildPhoneLoreContextOptions): Promise<string> {
    const entries = await this.getSourceEntries();
    const selected: NormalizedLoreEntry[] = [];
    const reservedTitles = new Set<string>();

    for (const spec of STATIC_ENTRY_SPECS) {
      const entry = findEntry(entries, spec.names);
      if (!entry) continue;
      selected.push(entry);
      reservedTitles.add(normalizeName(entry.title));
    }

    const contactEntry = findEntry(entries, [options.contact]);
    if (contactEntry && !reservedTitles.has(normalizeName(contactEntry.title))) {
      selected.push(contactEntry);
      reservedTitles.add(normalizeName(contactEntry.title));
    }

    const locationEntries = entries
      .map(entry => ({ entry, score: scoreLocationEntry(entry, options.characterData, reservedTitles) }))
      .filter(item => item.score > 0)
      .sort((left, right) => right.score - left.score || left.entry.order - right.entry.order)
      .slice(0, 2)
      .map(item => item.entry);

    for (const entry of locationEntries) {
      if (reservedTitles.has(normalizeName(entry.title))) continue;
      selected.push(entry);
      reservedTitles.add(normalizeName(entry.title));
    }

    const rendered = await Promise.all(
      selected.map(async entry => {
        const content = await renderTemplateContent(entry.content, options.characterData);
        return content ? formatEntry(entry, clipText(content, 12000)) : '';
      }),
    );

    const body = rendered.filter(Boolean).join('\n\n');
    return body ? `【后街白名单世界书】\n${body}` : '【后街白名单世界书】暂无可用条目';
  }
}

export const phoneLoreContextBuilder = new PhoneLoreContextBuilder();
