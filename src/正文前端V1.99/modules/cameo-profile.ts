import { TUCAO_SPEAKER } from '../engine/tucao-cameo';
import type { NarrativeChatAvatarCandidate } from '../engine/narrative-chat';
import { resolveFullbodyAssetUrl } from '../portrait-registry';

export const konataCameo = {
  name: TUCAO_SPEAKER,
  avatarUrl: new URL('泉此方Q版.png', 'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/Q版/').href,
  portraitUrl: resolveFullbodyAssetUrl('泉此方.png'),
};

export function resolveCameoAvatarCandidates(): NarrativeChatAvatarCandidate[] {
  return [
    { url: konataCameo.portraitUrl, kind: 'portrait' },
    { url: konataCameo.avatarUrl, kind: 'avatar' },
  ];
}
