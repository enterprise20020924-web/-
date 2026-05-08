/**
 * LTC 桥接层
 * 当 LTC 写入 /Characters/ 路径时，脚本自动转写到角色卡 API
 * 当 LTC 写入 /Characters/<名>/FirstMessages/ 等路径时，映射到对应接口
 */

import type { LtcOperation } from './ltc-capture';

/** 检测 LTC 操作是否需要桥接到角色卡 API */
export function needsBridge(op: LtcOperation): boolean {
  const path = op.args.file_path || op.args.path || '';
  return typeof path === 'string' && path.startsWith('/Characters/');
}

/** 执行桥接：将 LTC 写入操作转写到角色卡 API */
export async function bridgeToCharacterApi(op: LtcOperation): Promise<boolean> {
  const path: string = op.args.file_path || op.args.path || '';
  if (!path.startsWith('/Characters/')) return false;

  const segments = path.split('/').filter(Boolean);
  /* segments: ['Characters', '<charName>', '<subPath>...'] */
  if (segments.length < 3) return false;

  const charName = segments[1];
  const subPath = segments.slice(2).join('/');

  try {
    if (op.tool === 'Write') {
      const content = op.args.content || '';
      return await writeToCharacter(charName, subPath, content);
    }
    if (op.tool === 'Edit') {
      const oldStr = op.args.old_string || '';
      const newStr = op.args.new_string || '';
      return await editCharacterField(charName, subPath, oldStr, newStr);
    }
  } catch (e) {
    console.error('[IDE Bridge] bridgeToCharacterApi failed:', e);
  }
  return false;
}

/** 写入角色卡字段 */
async function writeToCharacter(charName: string, subPath: string, content: string): Promise<boolean> {
  if (subPath === 'Description.md' || subPath === 'description') {
    await updateCharacterWith(charName, char => {
      char.description = content;
      return char;
    });
    return true;
  }

  if (subPath.startsWith('FirstMessages/') || subPath.startsWith('first-messages/')) {
    const parts = subPath.split('/');
    const idx = parseInt(parts[1]);
    if (isNaN(idx)) return false;
    await updateCharacterWith(charName, char => {
      if (!char.first_messages) char.first_messages = [];
      while (char.first_messages.length <= idx) char.first_messages.push('');
      char.first_messages[idx] = content;
      return char;
    });
    return true;
  }

  if (subPath.startsWith('Regex/') || subPath.startsWith('regex/')) {
    /* 正则写入需要解析 JSON */
    try {
      const regexData = JSON.parse(content);
      await updateCharacterWith(charName, char => {
        if (!char.extensions) char.extensions = { regex_scripts: [], tavern_helper: { scripts: [], variables: {} } };
        if (!char.extensions.regex_scripts) char.extensions.regex_scripts = [];
        const existing = char.extensions.regex_scripts.findIndex(r => r.script_name === regexData.script_name);
        if (existing >= 0) {
          char.extensions.regex_scripts[existing] = regexData;
        } else {
          char.extensions.regex_scripts.push(regexData);
        }
        return char;
      });
      return true;
    } catch {
      console.warn('[IDE Bridge] Invalid regex JSON');
    }
  }

  return false;
}

/** 编辑角色卡字段中的部分内容 */
async function editCharacterField(charName: string, subPath: string, oldStr: string, newStr: string): Promise<boolean> {
  if (subPath === 'Description.md' || subPath === 'description') {
    await updateCharacterWith(charName, char => {
      char.description = (char.description || '').replace(oldStr, newStr);
      return char;
    });
    return true;
  }

  if (subPath.startsWith('FirstMessages/') || subPath.startsWith('first-messages/')) {
    const parts = subPath.split('/');
    const idx = parseInt(parts[1]);
    if (isNaN(idx)) return false;
    await updateCharacterWith(charName, char => {
      if (char.first_messages?.[idx]) {
        char.first_messages[idx] = char.first_messages[idx].replace(oldStr, newStr);
      }
      return char;
    });
    return true;
  }

  return false;
}

/** 监听 LTC 写入操作并自动桥接 */
export function setupBridgeListener(onBridged: (op: LtcOperation) => void): () => void {
  /* 这个函数会在 store 中被调用，监听活动日志中的写入操作 */
  /* 具体逻辑由 activity store 的 watcher 驱动 */
  return () => {};
}
