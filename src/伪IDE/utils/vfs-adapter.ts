/**
 * 虚拟文件系统适配器
 * 将世界书、角色卡、预设条目统一为虚拟文件系统
 */
import { type VfsNode, buildTree } from './path-utils';

export interface VfsFileContent {
  path: string;
  content: string;
  source: 'worldbook' | 'character' | 'preset';
  readonly: boolean;
  meta?: Record<string, any>;
}

/** 获取所有世界书的虚拟路径列表 */
async function getWorldbookPaths(): Promise<{ path: string; source: 'worldbook'; meta?: Record<string, any> }[]> {
  const paths: { path: string; source: 'worldbook'; meta?: Record<string, any> }[] = [];
  try {
    const worldbooks = getWorldbookNames();
    for (const wbName of worldbooks) {
      let entries: WorldbookEntry[] = [];
      try {
        entries = await getWorldbook(wbName);
      } catch { /* 世界书可能为空 */ }
      /* 即使是空世界书也添加文件夹占位 */
      if (!entries || entries.length === 0) {
        paths.push({
          path: `/世界书/${wbName}/.空世界书`,
          source: 'worldbook',
          meta: { worldbook: wbName, entryName: '.空世界书', isEmpty: true },
        });
        continue;
      }
      for (const entry of entries) {
        const entryName = entry.name || entry.uid?.toString() || 'unnamed';
        paths.push({
          path: `/世界书/${wbName}/${entryName}`,
          source: 'worldbook',
          meta: {
            worldbook: wbName,
            entryName,
            uid: entry.uid,
            /* 保存完整的条目属性供属性编辑面板使用 */
            wbEntry: {
              enabled: entry.enabled,
              strategy: entry.strategy,
              position: entry.position,
              probability: entry.probability,
              recursion: entry.recursion,
              effect: entry.effect,
            },
          },
        });
      }
    }
  } catch (e) {
    console.warn('[IDE] getWorldbookPaths failed:', e);
  }
  return paths;
}

/** 获取所有角色卡的虚拟路径列表 */
async function getCharacterPaths(): Promise<{ path: string; source: 'character'; meta?: Record<string, any> }[]> {
  const paths: { path: string; source: 'character'; meta?: Record<string, any> }[] = [];
  try {
    const names = getCharacterNames();
    for (const name of names) {
      paths.push({ path: `/角色卡/${name}/描述`, source: 'character', meta: { charName: name, field: 'description' } });
      try {
        const char = await getCharacter(name);
        if (char.first_messages) {
          char.first_messages.forEach((_, i) => {
            paths.push({ path: `/角色卡/${name}/开场白/${i}`, source: 'character', meta: { charName: name, field: 'first_message', index: i } });
          });
        }
        if (char.extensions?.regex_scripts?.length) {
          char.extensions.regex_scripts.forEach((r, i) => {
            paths.push({ path: `/角色卡/${name}/正则/${r.script_name || i}`, source: 'character', meta: { charName: name, field: 'regex', index: i } });
          });
        }
      } catch {
        /* character detail fetch failed, skip sub-paths */
      }
    }
  } catch (e) {
    console.warn('[IDE] getCharacterPaths failed:', e);
  }
  return paths;
}

/** 获取预设条目的虚拟路径列表 */
function getPresetPaths(): { path: string; source: 'preset'; meta?: Record<string, any> }[] {
  const paths: { path: string; source: 'preset'; meta?: Record<string, any> }[] = [];
  try {
    const preset = getPreset('in_use');
    for (const p of preset.prompts) {
      if (!isPresetNormalPrompt(p) && !isPresetSystemPrompt(p)) continue;
      const category = p.name.includes('MVU') || p.name.includes('EJS') ? 'MVU条目' : '一般条目';
      paths.push({
        path: `/预设/${category}/${p.name}`,
        source: 'preset',
        meta: { promptName: p.name, enabled: p.enabled, role: p.role },
      });
    }
  } catch (e) {
    console.warn('[IDE] getPresetPaths failed:', e);
  }
  return paths;
}

/** 构建完整的虚拟文件树 */
export async function buildFullTree(): Promise<VfsNode[]> {
  const [wbPaths, charPaths] = await Promise.all([
    getWorldbookPaths(),
    getCharacterPaths(),
  ]);
  const presetPaths = getPresetPaths();
  const allPaths = [...charPaths, ...wbPaths, ...presetPaths];
  return buildTree(allPaths);
}

/** 读取虚拟文件内容 */
export async function readVfsFile(path: string, source: VfsNode['source'], meta?: Record<string, any>): Promise<VfsFileContent | null> {
  try {
    if (source === 'worldbook' && meta?.worldbook && meta?.entryName) {
      const entries = await getWorldbook(meta.worldbook);
      const entry = entries?.find(e => (e.name || e.uid?.toString()) === meta.entryName);
      if (entry) {
        return {
          path,
          content: entry.content || '',
          source: 'worldbook',
          readonly: false,
          meta,
        };
      }
    }

    if (source === 'character' && meta?.charName) {
      const char = await getCharacter(meta.charName);
      if (meta.field === 'description') {
        return { path, content: char.description || '', source: 'character', readonly: false, meta };
      }
      if (meta.field === 'first_message' && meta.index !== undefined) {
        return { path, content: char.first_messages?.[meta.index] || '', source: 'character', readonly: false, meta };
      }
      if (meta.field === 'regex' && meta.index !== undefined) {
        const regex = char.extensions?.regex_scripts?.[meta.index];
        return { path, content: regex ? JSON.stringify(regex, null, 2) : '', source: 'character', readonly: false, meta };
      }
    }

    if (source === 'preset' && meta?.promptName) {
      const preset = getPreset('in_use');
      const prompt = preset.prompts.find(p => p.name === meta.promptName);
      if (prompt && 'content' in prompt) {
        return { path, content: prompt.content || '', source: 'preset', readonly: false, meta };
      }
    }
  } catch (e) {
    console.error('[IDE] readVfsFile failed:', e);
  }
  return null;
}

/** 写入虚拟文件内容 */
export async function writeVfsFile(path: string, content: string, source: VfsNode['source'], meta?: Record<string, any>): Promise<boolean> {
  try {
    if (source === 'character' && meta?.charName) {
      if (meta.field === 'description') {
        await updateCharacterWith(meta.charName, char => {
          char.description = content;
          return char;
        });
        return true;
      }
      if (meta.field === 'first_message' && meta.index !== undefined) {
        await updateCharacterWith(meta.charName, char => {
          if (!char.first_messages) char.first_messages = [];
          char.first_messages[meta.index] = content;
          return char;
        });
        return true;
      }
    }

    if (source === 'preset' && meta?.promptName) {
      await updatePresetWith('in_use', preset => {
        const p = preset.prompts.find(p =>
          (isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && p.name === meta.promptName,
        );
        if (p && 'content' in p) p.content = content;
        return preset;
      });
      return true;
    }

    /* 世界书条目写入 */
    if (source === 'worldbook' && meta?.worldbook && meta?.uid !== undefined) {
      await updateWorldbookWith(meta.worldbook, entries => {
        const entry = entries.find(e => e.uid === meta.uid);
        if (entry) entry.content = content;
        return entries;
      });
      return true;
    }
  } catch (e) {
    console.error('[IDE] writeVfsFile failed:', e);
  }
  return false;
}
