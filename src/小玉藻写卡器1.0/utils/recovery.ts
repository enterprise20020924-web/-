export interface WriterRecoverySnapshot {
  character: Character;
  characterName: string;
  characterRegexes: TavernRegex[];
  characterScripts: ScriptTree[];
  createdAt: string;
  previousBindings: CharWorldbooks;
  worldbookEntries: WorldbookEntry[];
  worldbookExisted: boolean;
  worldbookName: string;
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function createWriterRecoverySnapshot(
  worldbookName: string,
  characterName: string,
): Promise<WriterRecoverySnapshot> {
  const name = worldbookName.trim();
  if (!name) throw new Error('无法创建恢复点：世界书名称为空');
  const targetCharacter = characterName.trim();
  if (!targetCharacter) throw new Error('无法创建恢复点：角色卡名称为空');

  const worldbookExisted = getWorldbookNames().includes(name);
  const [character, worldbookEntries] = await Promise.all([
    getCharacter(targetCharacter),
    worldbookExisted ? getWorldbook(name) : Promise.resolve([] as WorldbookEntry[]),
  ]);
  const isCurrentCharacter = getCurrentCharacterName() === targetCharacter;
  const characterScripts = isCurrentCharacter
    ? getScriptTrees({ type: 'character' })
    : ((character.extensions?.tavern_helper?.scripts ?? []) as ScriptTree[]);
  const characterRegexes = (character.extensions?.regex_scripts ?? []) as TavernRegex[];

  return cloneValue({
    character,
    characterName: targetCharacter,
    characterRegexes,
    characterScripts,
    createdAt: new Date().toISOString(),
    previousBindings: getCharWorldbookNames(isCurrentCharacter ? 'current' : targetCharacter),
    worldbookEntries,
    worldbookExisted,
    worldbookName: name,
  });
}

export async function restoreWriterRecoverySnapshot(snapshot: WriterRecoverySnapshot): Promise<void> {
  const safeSnapshot = cloneValue(snapshot);
  const targetCharacter = safeSnapshot.characterName;
  const isCurrentCharacter = getCurrentCharacterName() === targetCharacter;

  await updateCharacterWith(targetCharacter, () => safeSnapshot.character);
  if (isCurrentCharacter) {
    replaceScriptTrees(safeSnapshot.characterScripts, { type: 'character' });
    await replaceTavernRegexes(safeSnapshot.characterRegexes, { type: 'character', name: 'current' });
  }

  await rebindCharWorldbooks(isCurrentCharacter ? 'current' : targetCharacter, safeSnapshot.previousBindings);
  if (safeSnapshot.worldbookExisted) {
    await replaceWorldbook(safeSnapshot.worldbookName, safeSnapshot.worldbookEntries, { render: 'immediate' });
  } else if (getWorldbookNames().includes(safeSnapshot.worldbookName)) {
    await deleteWorldbook(safeSnapshot.worldbookName);
  }
  await rebindCharWorldbooks(isCurrentCharacter ? 'current' : targetCharacter, safeSnapshot.previousBindings);
}
