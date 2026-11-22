import { decodeGzipJson } from '../compressed-json';
import { MAINTENANCE_BUNDLE_GZIP } from './generated/maintenance-bundle';

export const MAINTENANCE_SCRIPT_ID = 'amami-experience-maintenance-v1';
export const MAINTENANCE_MARKER = '// AMAMI_EXPERIENCE_MAINTENANCE';

export function isAcademyMaintenanceScript(script: Pick<Script, 'id' | 'content'>): boolean {
  if (script.id === MAINTENANCE_SCRIPT_ID || script.content.startsWith(MAINTENANCE_MARKER)) return true;
  const content = script.content.replace(/https?:\/\/[^'"\s]+/g, url => {
    try {
      return decodeURIComponent(url);
    } catch {
      return url;
    }
  });
  return (
    /\/性斗学园(?:正式版|测试版)?\/性斗学园脚本\/index\.js/.test(content) ||
    (content.includes('性斗学园数值计算脚本已启动') && /满级经验转(?:金币|天海信用点)/.test(content))
  );
}

/** 原位替换本体维护脚本，保留恢复/CG/退魔逻辑；新版维护程序随 fork 一起发布。 */
export async function installExperienceMaintenance(): Promise<void> {
  const payload = await decodeGzipJson<{ code: string; hash: string }>(MAINTENANCE_BUNDLE_GZIP);
  const content = `${MAINTENANCE_MARKER} ${payload.hash}\n${payload.code}`;
  let foundEnabled = false;
  for (const type of ['character', 'global', 'preset'] as const) {
    const trees = getScriptTrees({ type });
    const scripts = trees.flatMap(tree => (tree.type === 'folder' ? tree.scripts : [tree]));
    const matches = scripts.filter(isAcademyMaintenanceScript);
    if (!matches.length) continue;
    foundEnabled ||= trees.some(
      tree =>
        tree.enabled &&
        (tree.type === 'folder'
          ? tree.scripts.some(script => script.enabled && isAcademyMaintenanceScript(script))
          : isAcademyMaintenanceScript(tree)),
    );
    if (matches.every(script => script.content === content)) continue;
    updateScriptTreesWith(
      current =>
        current.map(tree => {
          const upgrade = (script: Script): Script =>
            isAcademyMaintenanceScript(script)
              ? { ...script, content, info: '由正文前端 V1.99 管理：累计经验升级、回复恢复、CG、50级退魔。' }
              : script;
          return tree.type === 'folder' ? { ...tree, scripts: tree.scripts.map(upgrade) } : upgrade(tree);
        }),
      { type },
    );
  }
  if (!foundEnabled) {
    updateScriptTreesWith(
      trees => [
        ...trees.filter(tree => tree.id !== MAINTENANCE_SCRIPT_ID),
        {
          type: 'script',
          id: MAINTENANCE_SCRIPT_ID,
          name: '天海学园 · 成长与状态结算',
          enabled: true,
          content,
          info: '随 V1.99 更新。按累计经验确定等级，段位独立。',
          button: { enabled: false, buttons: [] },
          data: {},
        },
      ],
      { type: 'character' },
    );
  }
}
