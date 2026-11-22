import { admissionIdentityArt } from '../opening/admission-identity-art';
import { resolveUserPortraitProfile, type FullbodyPortraitProfile } from '../portrait-registry';

/** 身份素材按身份 ID 取用；素材里的角色名只用于定位文件，绝不替换玩家姓名。 */
export function resolveIdentityPortraitProfile(identityId: string): FullbodyPortraitProfile | null {
  const art = admissionIdentityArt[identityId];
  if (!art) return null;
  const profile = resolveUserPortraitProfile(art.name);
  return {
    fileName: profile?.fileName ?? decodeURIComponent(new URL(art.fullbodyUrl).pathname.split('/').at(-1)!),
    displayName: art.name,
    names: profile?.names ?? [art.name],
    portraitUrl: art.fullbodyUrl,
    qAvatarUrl: art.qAvatarUrl,
    affiliation: profile?.affiliation,
  };
}
