import _ from 'lodash';
import {
  BaseAttributes,
  BonusStats,
  DerivedCombatStats,
  calculateDerivedCombatStats,
  createEmptyBonusStats,
  mergeBonusStats,
  normalizeBonusStats,
} from './combatMath';
import { calculateBonusFromStatusList, StatusList } from './statusEngine';
import {
  applyDifficultyCoefficient,
  applyLevelScaling,
  EnemyBaseData,
  getEnemyBaseDataByName,
  normalizeEnemyName,
  resolveEnemyName,
} from '../战斗界面/enemyDatabase';
import { CURRENT_BOSS_DEFINITIONS } from '../战斗界面/bossDefinitions';
import { normalizeCombatClimaxLimit } from './combatLimits';
import { getXiaoyeyueLightDarkDynamicBonusCorrection } from './xiaoyeyueMagicGirl';
import { applyTraitModifiersToEnemyBase } from '../战斗界面/traitSystem';

const FALLBACK_ENEMY_BASE_DATA: EnemyBaseData = {
  对手等级: 1,
  对手魅力: 10,
  对手幸运: 5,
  对手闪避率: 5,
  对手暴击率: 10,
  对手耐力: 150,
  对手最大耐力: 150,
  对手快感: 0,
  对手最大快感: 100,
  对手高潮次数: 0,
  对手性斗力: 20,
  对手忍耐力: 20,
};

const FIXED_BOSS_PHASE_DATA_KEYS = new Set(
  CURRENT_BOSS_DEFINITIONS.flatMap(definition =>
    definition.phases.map(phase => normalizeEnemyName(phase.dataKey || '')),
  ),
);

export interface CombatResources {
  stamina: number;
  maxStamina: number;
  pleasure: number;
  maxPleasure: number;
  climax: number;
  maxClimax: number;
}

export interface CombatantSnapshot {
  side: 'player' | 'enemy';
  name: string;
  level: number;
  resources: CombatResources;
  stats: DerivedCombatStats;
  statuses: StatusList;
}

export interface EnemySnapshotContext {
  traitIds?: string[];
  npcLevel?: number;
  effectiveLevelOverride?: number;
}

function readNumber(data: any, path: string, fallback: number): number {
  const value = Number(_.get(data, path, fallback));
  return Number.isFinite(value) ? value : fallback;
}

function readString(data: any, path: string, fallback = ''): string {
  const value = _.get(data, path, fallback);
  return typeof value === 'string' ? value : fallback;
}

function getFirstTalentBonus(statData: any): BonusStats {
  const talents = _.get(statData, '技能系统.$天赋', {});
  if (!talents || typeof talents !== 'object') {
    return createEmptyBonusStats();
  }

  const firstTalent = Object.values(talents)[0] as any;
  return normalizeBonusStats(firstTalent?.天赋效果);
}

export function calculateEquipmentBonus(statData: any): BonusStats {
  const slots = _.get(statData, '物品系统._装备栏', {});
  if (!slots || typeof slots !== 'object') {
    return createEmptyBonusStats();
  }

  const slotBonuses = Object.values(slots)
    .map((item: any) => normalizeBonusStats(item?.加成属性))
    .filter(bonus => Object.values(bonus).some(value => value !== 0));

  return mergeBonusStats(...slotBonuses);
}

export function getPermanentBonus(statData: any): BonusStats {
  const permanentStatusList = _.get(statData, '永久状态.状态列表', {}) as StatusList;
  return mergeBonusStats(
    calculateBonusFromStatusList(permanentStatusList),
    getXiaoyeyueLightDarkDynamicBonusCorrection(statData, permanentStatusList),
  );
}

export function getTemporaryBonus(statData: any): BonusStats {
  return calculateBonusFromStatusList(_.get(statData, '临时状态.状态列表', {}) as StatusList);
}

function getPlayerBaseAttributes(statData: any): BaseAttributes {
  return {
    charm: readNumber(statData, '基础属性._魅力', 10),
    luck: readNumber(statData, '基础属性._幸运', 10),
    evasion: readNumber(statData, '基础属性._闪避率', 0),
    crit: readNumber(statData, '基础属性._暴击率', 0),
  };
}

export function getPlayerBonusSources(statData: any): BonusStats[] {
  return [
    normalizeBonusStats({
      基础性斗力加成: readNumber(statData, '基础属性._性斗力加成', 0),
      基础性斗力成算: readNumber(statData, '基础属性._性斗力成算', 0),
      基础忍耐力加成: readNumber(statData, '基础属性._忍耐力加成', 0),
      基础忍耐力成算: readNumber(statData, '基础属性._忍耐力成算', 0),
    }),
    getTemporaryBonus(statData),
    getPermanentBonus(statData),
    calculateEquipmentBonus(statData),
    getFirstTalentBonus(statData),
  ];
}

export function getPlayerDerivedStats(statData: any): DerivedCombatStats {
  const statusList = _.get(statData, '临时状态.状态列表', {}) as StatusList;

  return calculateDerivedCombatStats({
    level: readNumber(statData, '角色基础._等级', 1),
    potential: readNumber(statData, '核心状态._潜力', 5),
    baseAttributes: getPlayerBaseAttributes(statData),
    bonusSources: getPlayerBonusSources(statData),
    postOrgasm: '贤者时间' in statusList,
    exhausted: '虚脱' in statusList,
  });
}

export function getPlayerSnapshot(statData: any, fallbackName = '玩家'): CombatantSnapshot {
  const maxClimax = normalizeCombatClimaxLimit(readNumber(statData, '性斗系统.胜负规则.高潮次数上限', 1));

  return {
    side: 'player',
    name: readString(statData, '角色基础._姓名', fallbackName) || fallbackName,
    level: readNumber(statData, '角色基础._等级', 1),
    resources: {
      stamina: readNumber(statData, '核心状态.$耐力', 100),
      maxStamina: readNumber(statData, '核心状态.$最大耐力', 100),
      pleasure: readNumber(statData, '核心状态.$快感', 0),
      maxPleasure: readNumber(statData, '核心状态.$最大快感', 100),
      climax: 0,
      maxClimax,
    },
    stats: getPlayerDerivedStats(statData),
    statuses: (_.get(statData, '临时状态.状态列表', {}) || {}) as StatusList,
  };
}

export function getResolvedEnemyName(statData: any): string {
  const rawName = readString(statData, '性斗系统.对手名称', '');
  return rawName ? resolveEnemyName(rawName) : '';
}

export function getResolvedEnemyBaseData(statData: any, context: EnemySnapshotContext = {}): EnemyBaseData | null {
  const enemyName = getResolvedEnemyName(statData);
  if (!enemyName) {
    return null;
  }

  const databaseData = getEnemyBaseDataByName(enemyName);
  const baseData = databaseData ?? FALLBACK_ENEMY_BASE_DATA;
  if (FIXED_BOSS_PHASE_DATA_KEYS.has(normalizeEnemyName(enemyName))) {
    return context.traitIds?.length
      ? (applyTraitModifiersToEnemyBase(baseData as any, context.traitIds) as EnemyBaseData)
      : baseData;
  }

  const userLevel = readNumber(statData, '角色基础._等级', 1);
  const difficulty = readString(statData, '角色基础.难度', '普通');
  const npcLevel = Math.max(20, Math.min(80, Math.round(context.npcLevel ?? userLevel + 8)));
  const scaled = databaseData ? applyLevelScaling(baseData, userLevel) : applyLevelScaling(baseData, npcLevel + 8);
  const resolved = applyDifficultyCoefficient(scaled, difficulty);
  return context.traitIds?.length
    ? (applyTraitModifiersToEnemyBase(resolved as any, context.traitIds) as EnemyBaseData)
    : resolved;
}

export function getEnemyDerivedStats(
  statData: any,
  runtimeStatuses: StatusList = {},
  context: EnemySnapshotContext = {},
): DerivedCombatStats | null {
  const enemyData = getResolvedEnemyBaseData(statData, context);
  if (!enemyData) {
    return null;
  }

  const statusBonus = calculateEnemyStatusBonus(runtimeStatuses);

  return calculateDerivedCombatStats({
    level: 0,
    potential: 0,
    baseAttributes: {
      charm: enemyData.对手魅力,
      luck: enemyData.对手幸运,
      evasion: enemyData.对手闪避率,
      crit: enemyData.对手暴击率,
    },
    bonusSources: [
      {
        ...statusBonus,
        基础性斗力加成: enemyData.对手性斗力 + statusBonus.基础性斗力加成,
        基础忍耐力加成: enemyData.对手忍耐力 + statusBonus.基础忍耐力加成,
      },
    ],
  });
}

export function calculateEnemyStatusBonus(runtimeStatuses: StatusList = {}): BonusStats {
  return calculateBonusFromStatusList(runtimeStatuses);
}

export function getEnemySnapshot(
  statData: any,
  runtimeStatuses: StatusList = {},
  context: EnemySnapshotContext = {},
): CombatantSnapshot | null {
  const enemyData = getResolvedEnemyBaseData(statData, context);
  const stats = getEnemyDerivedStats(statData, runtimeStatuses, context);
  if (!enemyData || !stats) {
    return null;
  }

  const maxClimax = normalizeCombatClimaxLimit(readNumber(statData, '性斗系统.胜负规则.高潮次数上限', 1));

  return {
    side: 'enemy',
    name: getResolvedEnemyName(statData),
    level: enemyData.对手等级,
    resources: {
      stamina: enemyData.对手最大耐力,
      maxStamina: enemyData.对手最大耐力,
      pleasure: 0,
      maxPleasure: enemyData.对手最大快感,
      climax: 0,
      maxClimax,
    },
    stats,
    statuses: runtimeStatuses,
  };
}
