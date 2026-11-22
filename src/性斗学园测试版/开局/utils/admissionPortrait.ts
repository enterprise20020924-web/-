import { resolveFullbodyPortraitProfile } from '../../战斗界面P5R/portrait-registry';
import malePortrait from '../assets/character-cards/男主.png?url';
import amanePortrait from '../assets/character-cards/响木天音.png?url';
import morikaPortrait from '../assets/character-cards/森莉花.png?url';

const localPortraits = new Map([
  ['男主', malePortrait],
  ['老师', malePortrait],
  ['响木天音', amanePortrait],
  ['森莉花', morikaPortrait],
]);

export function resolveAdmissionPortrait(name: string): string | null {
  const normalizedName = name.trim();
  return localPortraits.get(normalizedName) ?? resolveFullbodyPortraitProfile(normalizedName)?.portraitUrl ?? null;
}
