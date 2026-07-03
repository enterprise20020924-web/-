import { writerEntryMarker } from './artifacts';

export async function ensureWorldbookBound(worldbookName: string): Promise<void> {
  const name = worldbookName.trim();
  if (!name) throw new Error('世界书名称不能为空');
  if (!getWorldbookNames().includes(name)) {
    await createWorldbook(name, []);
  }
  const current = getCharWorldbookNames('current');
  await rebindCharWorldbooks('current', {
    primary: name,
    additional: current.additional.filter(item => item !== name),
  });
}

export async function clearWriterEntries(worldbookName: string): Promise<void> {
  const marker = writerEntryMarker();
  await updateWorldbookWith(
    worldbookName,
    worldbook => worldbook.filter(entry => entry.extra?.source !== marker),
    { render: 'debounced' },
  );
}

export async function upsertWriterEntries(
  worldbookName: string,
  entries: PartialDeep<WorldbookEntry>[],
): Promise<void> {
  const marker = writerEntryMarker();
  const names = new Set(entries.map(entry => String(entry.name)));
  await updateWorldbookWith(
    worldbookName,
    worldbook => worldbook.filter(entry => entry.extra?.source !== marker || !names.has(entry.name)),
    { render: 'debounced' },
  );
  await createWorldbookEntries(worldbookName, entries, { render: 'immediate' });
}

export async function replaceWriterEntries(
  worldbookName: string,
  entries: PartialDeep<WorldbookEntry>[],
): Promise<void> {
  await clearWriterEntries(worldbookName);
  await upsertWriterEntries(worldbookName, entries);
}
