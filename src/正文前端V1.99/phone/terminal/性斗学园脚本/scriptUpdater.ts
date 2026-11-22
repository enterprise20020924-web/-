/** The integrated phone is distributed with the narrative fork, not the old numeric script. */
export const SCRIPT_VERSION = '1.99';
export const SCRIPT_UPDATE_EVENT = 'bp-skylink-phone-version';
export interface ScriptUpdateRelease {
  version: string;
  releaseTag?: string;
  changelog: string[];
}
export interface ScriptUpdateManifest {
  version: string;
  releaseTag: string;
  changelog?: string[];
  releases?: ScriptUpdateRelease[];
}
export interface ScriptUpdateState {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  isUsingMutableReference: boolean;
  status: 'idle' | 'checking' | 'available' | 'latest' | 'error';
  message: string;
  checkedAt?: number;
  manifest?: ScriptUpdateManifest;
}
const release: ScriptUpdateRelease = {
  version: SCRIPT_VERSION,
  changelog: ['SKYLINK 学园终端迁入正文前端，保留悬浮入口和可拖动手机窗口。', '沿用现有后街记录、手机偏好与本地图片。'],
};
export function getScriptUpdateState(): ScriptUpdateState {
  return {
    currentVersion: SCRIPT_VERSION,
    latestVersion: SCRIPT_VERSION,
    hasUpdate: false,
    isUsingMutableReference: false,
    status: 'latest',
    message: '此手机随正文前端一起更新。',
    manifest: { version: SCRIPT_VERSION, releaseTag: '', releases: [release] },
  };
}
export function getScriptUpdateReleases(manifest?: ScriptUpdateManifest) {
  return manifest?.releases ?? [release];
}
export async function checkScriptUpdate(_options?: unknown) {
  return getScriptUpdateState();
}
export function showScriptUpdateGuide(_manifest?: ScriptUpdateManifest) {
  toastr.info('请更新正文前端以获取新版手机。');
}
export async function applyScriptUpdate(_manifest: ScriptUpdateManifest) {
  return { updated: false, message: '此手机随正文前端一起更新。', releaseTag: '' };
}
