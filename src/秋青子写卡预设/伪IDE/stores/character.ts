export interface CharInfo {
  name: string;
  isCurrent: boolean;
}

export const useCharacterStore = defineStore('character', () => {
  const characters = ref<CharInfo[]>([]);
  const currentCharName = ref<string | null>(null);

  function refresh() {
    try {
      const names = getCharacterNames();
      const current = getCurrentCharacterName();
      currentCharName.value = current;
      characters.value = names.map(name => ({
        name,
        isCurrent: name === current,
      }));
    } catch (e) {
      console.warn('[IDE] character refresh failed:', e);
    }
  }

  async function createNewCharacter(name: string) {
    try {
      const success = await createCharacter(name);
      if (success) {
        refresh();
        toastr.success(`Character "${name}" created`);
      } else {
        toastr.error(`Failed to create "${name}" - may already exist`);
      }
      return success;
    } catch (e) {
      console.error('[IDE] createNewCharacter failed:', e);
      toastr.error(`Error creating character: ${e}`);
      return false;
    }
  }

  async function deleteChar(name: string) {
    try {
      const success = await deleteCharacter(name);
      if (success) {
        refresh();
        toastr.success(`Character "${name}" deleted`);
      }
      return success;
    } catch (e) {
      console.error('[IDE] deleteChar failed:', e);
      return false;
    }
  }

  async function exportChar(name: string) {
    try {
      const char = await getCharacter(name);
      const json = JSON.stringify(char, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 100);
    } catch (e) {
      console.error('[IDE] exportChar failed:', e);
    }
  }

  function triggerImport(): Promise<boolean> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.png,.json';
      input.style.display = 'none';

      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(false);
          return;
        }
        try {
          const blob = new Blob([await file.arrayBuffer()], { type: file.type });
          await importRawCharacter(file.name, blob);
          refresh();
          toastr.success(`Imported "${file.name}"`);
          resolve(true);
        } catch (e) {
          console.error('[IDE] importChar failed:', e);
          toastr.error(`Import failed: ${e}`);
          resolve(false);
        } finally {
          input.remove();
        }
      });

      input.addEventListener('cancel', () => {
        resolve(false);
        input.remove();
      });

      document.body.appendChild(input);
      input.click();
    });
  }

  return {
    characters,
    currentCharName,
    refresh,
    createNewCharacter,
    deleteChar,
    exportChar,
    triggerImport,
  };
});
