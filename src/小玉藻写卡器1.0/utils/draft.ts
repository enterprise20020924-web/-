import type { PersonaOnlyMode, RoleDraft } from '../types';
import type { BeginnerWorldMode, GenerationMode, WriterStep } from '../ui-types';

export interface WriterDraft {
  version: 2;
  savedAt: number;
  step: WriterStep;
  generationMode: GenerationMode;
  targetCharacterName: string;
  worldbookName: string;
  worldviewSeed: string;
  openingStyle: string;
  openingOutline: string;
  roles: RoleDraft[];
  avatarFile: File | null;
  personaSeed: string;
  personaMode: PersonaOnlyMode;
  beginnerConcept: string;
  beginnerRelationship: string;
  beginnerExperience: string;
  beginnerWorldMode: BeginnerWorldMode;
  beginnerWorldHint: string;
  fullWorkspaceMode: 'beginner' | 'editor';
}

const DATABASE_NAME = 'one-click-card-writer';
const DATABASE_VERSION = 1;
const STORE_NAME = 'drafts';
const ACTIVE_DRAFT_KEY = 'active';

function openDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.addEventListener('upgradeneeded', () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    });
    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error ?? new Error('无法打开写卡器草稿缓存')));
  });
}

function waitForTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', () => resolve());
    transaction.addEventListener('abort', () => reject(transaction.error ?? new Error('写卡器草稿缓存事务已中止')));
    transaction.addEventListener('error', () => reject(transaction.error ?? new Error('写卡器草稿缓存事务失败')));
  });
}

export async function saveWriterDraft(draft: WriterDraft): Promise<void> {
  const database = await openDraftDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(draft, ACTIVE_DRAFT_KEY);
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}

export async function loadWriterDraft(): Promise<WriterDraft | null> {
  const database = await openDraftDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(ACTIVE_DRAFT_KEY);
    const result = await new Promise<unknown>((resolve, reject) => {
      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error ?? new Error('读取写卡器草稿失败')));
    });
    await waitForTransaction(transaction);
    if (!result || typeof result !== 'object') return null;
    const draft = result as Partial<Omit<WriterDraft, 'version'>> & { version?: number };
    if (!Array.isArray(draft.roles)) return null;
    if (draft.version === 2) return draft as WriterDraft;
    if (draft.version !== 1) return null;

    const legacyStep = String(draft.step ?? 'setup');
    const legacyAvatar =
      draft.avatarFile instanceof File
        ? draft.avatarFile
        : draft.avatarFile instanceof Blob
          ? new File([draft.avatarFile], '已缓存卡面.png', { type: draft.avatarFile.type || 'image/png' })
          : null;
    return {
      version: 2,
      savedAt: typeof draft.savedAt === 'number' ? draft.savedAt : Date.now(),
      step: legacyStep === 'editor' || legacyStep === 'opening' ? legacyStep : 'setup',
      generationMode:
        draft.generationMode === 'stream' || draft.generationMode === 'fake-stream'
          ? draft.generationMode
          : 'nonstream',
      targetCharacterName: String(draft.targetCharacterName ?? ''),
      worldbookName: String(draft.worldbookName ?? ''),
      worldviewSeed: String(draft.worldviewSeed ?? ''),
      openingStyle: String(draft.openingStyle ?? ''),
      openingOutline: String(draft.openingOutline ?? ''),
      roles: draft.roles,
      avatarFile: legacyAvatar,
      personaSeed: '',
      personaMode: 'normal',
      beginnerConcept: '',
      beginnerRelationship: '',
      beginnerExperience: '',
      beginnerWorldMode: 'auto',
      beginnerWorldHint: '',
      fullWorkspaceMode: 'editor',
    };
  } finally {
    database.close();
  }
}

export async function clearWriterDraft(): Promise<void> {
  const database = await openDraftDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(ACTIVE_DRAFT_KEY);
    await waitForTransaction(transaction);
  } finally {
    database.close();
  }
}
