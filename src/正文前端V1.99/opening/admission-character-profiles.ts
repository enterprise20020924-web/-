import { getIdentityById } from '../../性斗学园测试版/开局/data/identityDatabase';
import type {
  AdmissionCharacterCard,
  AdmissionGender,
} from '../../性斗学园测试版/开局/utils/admissionCharacterSelection';
import { getIconClass } from '../../性斗学园测试版/开局/icon-helper';
import { getEnemyPortraitUrl } from '../../性斗学园测试版/战斗界面/constants';
import { resolveUserPortraitProfile } from '../portrait-registry';
import { admissionIdentityArt } from './admission-identity-art';
import { admissionIdentityQuotes } from './admission-identity-quotes';

const bonusLabels: Record<string, { name: string; percent?: boolean }> = {
  魅力加成: { name: '魅力' },
  幸运加成: { name: '幸运' },
  基础性斗力加成: { name: '基础性斗力' },
  基础性斗力成算: { name: '性斗力', percent: true },
  基础忍耐力加成: { name: '基础忍耐力' },
  基础忍耐力成算: { name: '忍耐力', percent: true },
  闪避率加成: { name: '闪避率', percent: true },
  暴击率加成: { name: '暴击率', percent: true },
};

export function describeAdmissionCard(card: AdmissionCharacterCard, gender: AdmissionGender) {
  const registeredIdentity = card.kind === 'identity' ? getIdentityById(card.archetypeId) : undefined;
  const identity = registeredIdentity?.gender === gender ? registeredIdentity : undefined;
  const identityArt = card.kind === 'identity' ? admissionIdentityArt[card.archetypeId] : undefined;
  const characterName =
    card.kind === 'identity' ? card.characterName || card.preset?.characterName || card.preset?.name || '' : '';
  const portrait = identityArt ? resolveUserPortraitProfile(identityArt.name) : null;
  const battleName = portrait?.displayName === '伊甸芙宁' ? '伊甸芙宁_1' : portrait?.displayName;
  return {
    name: card.kind === 'identity' ? (identityArt?.name ?? card.name) : '泛泛之辈',
    quote: admissionIdentityQuotes[card.kind === 'identity' ? card.archetypeId : 'custom'] ?? '',
    characterName: identityArt?.name ?? characterName,
    identityName: identity?.name ?? '自定义身份',
    description: identity?.description ?? '从一份空白档案开始，写下你的姓名、经历与校园身份。',
    icon: identity ? getIconClass(identity.icon) : 'fa-user-plus',
    fullbodyUrl: identityArt?.fullbodyUrl ?? portrait?.portraitUrl ?? '',
    battleUrl: identityArt?.battleUrl ?? (battleName ? getEnemyPortraitUrl(battleName) : ''),
    passiveName: identity?.passiveSkill.name ?? '',
    passiveDescription: identity?.passiveSkill.description ?? '',
    mechanismDescriptions: identity?.mechanisms?.map(mechanism => mechanism.description) ?? [],
    presetName: card.kind === 'identity' ? card.preset?.name : undefined,
    bonuses: [
      ...Object.entries(identity?.permanentState.bonus ?? {})
        .filter(([, value]) => value !== 0)
        .map(([key, value]) => ({
          key,
          label: bonusLabels[key].name,
          value: `${value > 0 ? '+' : ''}${value}${bonusLabels[key].percent ? '%' : ''}`,
        })),
      ...(identity?.fixedStart
        ? [
            { key: 'initial-level', label: '初始等级', value: `${identity.fixedStart.level} 级` },
            { key: 'initial-rank', label: '初始段位', value: `${identity.fixedStart.rank}-rank` },
            { key: 'initial-potential', label: '初始潜力', value: `${identity.fixedStart.potential}` },
          ]
        : []),
    ],
  };
}
