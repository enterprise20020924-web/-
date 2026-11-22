export type BossDefinitionStatus = 'ready' | 'draft' | 'blocked';

export type BossMechanicKind =
  | 'phaseTransition'
  | 'skillPool'
  | 'environmentAura'
  | 'assimilationProgress'
  | 'judgementChallenge'
  | 'protectRitual'
  | 'personaSwitch'
  | 'multiActor'
  | 'reviveRule'
  | 'companionWakeup'
  | 'relationshipShortcut'
  | 'genderVariant'
  | 'forcedUltimate'
  | 'skillTagModifier'
  | 'lossCounter'
  | 'turnLimit'
  | 'specialRule';

export type BossTriggerType =
  | 'battleStart'
  | 'turnStart'
  | 'turnEnd'
  | 'phaseEnter'
  | 'hpPercentAtOrBelow'
  | 'pleasurePercentAtOrAbove'
  | 'turnAtLeast'
  | 'damageTakenPercentStep'
  | 'skillTagUsed'
  | 'skillTagHit'
  | 'playerDialogue'
  | 'playerGenderIs'
  | 'companionPresent'
  | 'companionMissing'
  | 'relationshipAtLeast'
  | 'lossCountAtLeast'
  | 'climaxCountAtLeast'
  | 'judgementFailed'
  | 'progressAtLeast'
  | 'actorDefeated'
  | 'allActorsDefeated'
  | 'flagSet'
  | 'manual';

export type BossSkillActor = 'player' | 'enemy' | 'any';

export type BossActionType =
  | 'setPhase'
  | 'setSkillPool'
  | 'addProgress'
  | 'setProgress'
  | 'resetPleasure'
  | 'resetCombatResources'
  | 'setFlag'
  | 'queueDialogue'
  | 'log'
  | 'applyStatus'
  | 'startJudgement'
  | 'startRitual'
  | 'triggerBadEnd'
  | 'skipBattle'
  | 'forceSkill'
  | 'modifySkillTag'
  | 'addCounter'
  | 'setCounter'
  | 'markActorState'
  | 'reviveActor'
  | 'cancelAction'
  | 'stun'
  | 'none';

export type BossActorState = 'active' | 'downed' | 'defeated' | 'purified';
export type BossResourceResetTarget = 'player' | 'enemy' | 'both';

export interface BossMechanicTrigger {
  type: BossTriggerType;
  phase?: number;
  threshold?: number;
  everyPercent?: number;
  turn?: number;
  stateKey?: string;
  flag?: string;
  skillTags?: string[];
  dialogueIncludes?: string[];
  gender?: string;
  companion?: string;
  relationshipTarget?: string;
  relationshipMin?: number;
  lossCounterKey?: string;
  climaxCounterKey?: string;
  counterKey?: string;
  actorId?: string;
  actorIds?: string[];
  skillActor?: BossSkillActor;
  requiresFlag?: string;
  blockedByFlag?: string;
}

export interface BossMechanicAction {
  type: BossActionType;
  phase?: number;
  skillPoolKey?: string;
  stateKey?: string;
  value?: number | boolean | string;
  amount?: number;
  flag?: string;
  message?: string;
  statusName?: string;
  duration?: number;
  judgementKey?: string;
  difficultyModifier?: number;
  requiredSuccesses?: number;
  ritualKey?: string;
  requiredTurns?: number;
  skillId?: string;
  skillTags?: string[];
  multiplier?: number;
  actorId?: string;
  counterKey?: string;
  actorState?: BossActorState;
  resourceTarget?: BossResourceResetTarget;
  resetPleasure?: boolean;
  resetClimaxCount?: boolean;
}

export interface BossMechanicDefinition {
  id: string;
  kind: BossMechanicKind;
  label: string;
  description: string;
  triggers: BossMechanicTrigger[];
  actions: BossMechanicAction[];
  match?: 'any' | 'all';
  reusable?: boolean;
  once?: boolean;
  notes?: string;
}

export interface BossPhaseDefinition {
  phase: number;
  displayName: string;
  dataKey?: string;
  skillPoolKey?: string;
  skillTags?: string[];
  statMultiplier?: number;
  climaxLimit?: number;
  entryMechanicIds?: string[];
}

export interface BossTaskHooks {
  questName?: string;
  objectiveKeys?: string[];
  companionNames?: string[];
  completionRecord?: string;
}

export interface DeclarativeBossDefinition {
  id: string;
  sourceEntry: string;
  displayName: string;
  aliases: string[];
  category: 'exorcism' | 'main' | 'event';
  status: BossDefinitionStatus;
  phases: BossPhaseDefinition[];
  mechanics: BossMechanicDefinition[];
  taskHooks?: BossTaskHooks;
  blockedReason?: string;
}

export interface BossMechanicRuntime {
  bossId: string;
  currentPhase: number;
  turn: number;
  progress: Record<string, number>;
  flags: Record<string, boolean>;
  counters: Record<string, number>;
  lossCounters: Record<string, number>;
  actorStates: Record<string, BossActorState>;
  skillPoolKey?: string;
  lastDamageStep: number;
  triggeredMechanicIds: Record<string, boolean>;
}

export interface BossMechanicContext {
  event: BossTriggerType;
  currentPhase: number;
  turn: number;
  hpPercent?: number;
  pleasurePercent?: number;
  damageTakenPercent?: number;
  skillTags?: string[];
  skillActor?: BossSkillActor;
  playerDialogue?: string;
  playerGender?: string;
  companions?: string[];
  relationships?: Record<string, number>;
  progress?: Record<string, number>;
  flags?: Record<string, boolean>;
  counters?: Record<string, number>;
  lossCounters?: Record<string, number>;
  climaxCounters?: Record<string, number>;
  judgementFailures?: Record<string, number>;
  actorStates?: Record<string, BossActorState>;
}

export interface BossMechanicEvaluation {
  bossId: string;
  matchedMechanicIds: string[];
  actions: BossMechanicAction[];
}

function hasAnyTag(actualTags: string[] | undefined, expectedTags: string[] | undefined): boolean {
  if (!expectedTags || expectedTags.length === 0) return true;
  if (!actualTags || actualTags.length === 0) return false;
  return expectedTags.some(tag => actualTags.includes(tag));
}

function includesAnyText(source: string | undefined, needles: string[] | undefined): boolean {
  if (!needles || needles.length === 0) return true;
  if (!source) return false;
  return needles.some(needle => source.includes(needle));
}

function matchesSkillActor(expectedActor: BossSkillActor | undefined, actualActor: BossSkillActor | undefined): boolean {
  if (!expectedActor || expectedActor === 'any') return true;
  return expectedActor === actualActor;
}

function readNumberRecordValue(
  contextRecord: Record<string, number> | undefined,
  runtimeRecord: Record<string, number>,
  key: string | undefined,
): number {
  if (!key) return 0;
  return Number(contextRecord?.[key] ?? runtimeRecord[key] ?? 0) || 0;
}

function readBooleanRecordValue(
  contextRecord: Record<string, boolean> | undefined,
  runtimeRecord: Record<string, boolean>,
  key: string | undefined,
): boolean {
  if (!key) return false;
  return Boolean(contextRecord?.[key] ?? runtimeRecord[key] ?? false);
}

export function createBossMechanicRuntime(definition: DeclarativeBossDefinition): BossMechanicRuntime {
  return {
    bossId: definition.id,
    currentPhase: definition.phases[0]?.phase ?? 1,
    turn: 1,
    progress: {},
    flags: {},
    counters: {},
    lossCounters: {},
    actorStates: {},
    skillPoolKey: definition.phases[0]?.skillPoolKey,
    lastDamageStep: 0,
    triggeredMechanicIds: {},
  };
}

export function getBossPhase(definition: DeclarativeBossDefinition, phase: number): BossPhaseDefinition | undefined {
  return definition.phases.find(item => item.phase === phase);
}

export function getBossMechanicsByKind(
  definition: DeclarativeBossDefinition,
  kind: BossMechanicKind,
): BossMechanicDefinition[] {
  return definition.mechanics.filter(mechanic => mechanic.kind === kind);
}

export function matchesBossTrigger(
  trigger: BossMechanicTrigger,
  runtime: BossMechanicRuntime,
  context: BossMechanicContext,
): boolean {
  if (trigger.type !== context.event) return false;
  if (trigger.phase !== undefined && trigger.phase !== context.currentPhase) return false;
  if (trigger.requiresFlag && !readBooleanRecordValue(context.flags, runtime.flags, trigger.requiresFlag)) return false;
  if (trigger.blockedByFlag && readBooleanRecordValue(context.flags, runtime.flags, trigger.blockedByFlag))
    return false;

  switch (trigger.type) {
    case 'battleStart':
    case 'turnStart':
    case 'turnEnd':
    case 'phaseEnter':
    case 'manual':
      return true;
    case 'hpPercentAtOrBelow':
      return (context.hpPercent ?? 100) <= (trigger.threshold ?? 0);
    case 'pleasurePercentAtOrAbove':
      return (context.pleasurePercent ?? 0) >= (trigger.threshold ?? 100);
    case 'turnAtLeast':
      return context.turn >= (trigger.turn ?? 1);
    case 'damageTakenPercentStep': {
      const everyPercent = Math.max(1, trigger.everyPercent ?? 20);
      const currentStep = Math.floor((context.damageTakenPercent ?? 0) / everyPercent);
      return currentStep > runtime.lastDamageStep;
    }
    case 'skillTagUsed':
    case 'skillTagHit':
      return matchesSkillActor(trigger.skillActor, context.skillActor) && hasAnyTag(context.skillTags, trigger.skillTags);
    case 'playerDialogue':
      return includesAnyText(context.playerDialogue, trigger.dialogueIncludes);
    case 'playerGenderIs':
      return Boolean(trigger.gender && context.playerGender === trigger.gender);
    case 'companionPresent':
      return Boolean(trigger.companion && context.companions?.includes(trigger.companion));
    case 'companionMissing':
      return Boolean(trigger.companion && !context.companions?.includes(trigger.companion));
    case 'relationshipAtLeast': {
      const target = trigger.relationshipTarget;
      if (!target) return false;
      return (context.relationships?.[target] ?? 0) >= (trigger.relationshipMin ?? 0);
    }
    case 'lossCountAtLeast': {
      const value = readNumberRecordValue(context.lossCounters, runtime.lossCounters, trigger.lossCounterKey);
      return value >= (trigger.threshold ?? 1);
    }
    case 'climaxCountAtLeast': {
      const key = trigger.climaxCounterKey ?? trigger.actorId ?? trigger.stateKey;
      const value = readNumberRecordValue(context.climaxCounters, runtime.counters, key);
      return value >= (trigger.threshold ?? 1);
    }
    case 'judgementFailed': {
      const key = trigger.counterKey ?? trigger.stateKey;
      const value = readNumberRecordValue(context.judgementFailures, runtime.counters, key);
      return value >= (trigger.threshold ?? 1);
    }
    case 'progressAtLeast': {
      const value = readNumberRecordValue(context.progress, runtime.progress, trigger.stateKey);
      return value >= (trigger.threshold ?? 100);
    }
    case 'actorDefeated': {
      if (!trigger.actorId) return false;
      const state = context.actorStates?.[trigger.actorId] ?? runtime.actorStates[trigger.actorId];
      return state === 'downed' || state === 'defeated' || state === 'purified';
    }
    case 'allActorsDefeated': {
      if (!trigger.actorIds || trigger.actorIds.length === 0) return false;
      return trigger.actorIds.every(actorId => {
        const state = context.actorStates?.[actorId] ?? runtime.actorStates[actorId];
        return state === 'downed' || state === 'defeated' || state === 'purified';
      });
    }
    case 'flagSet':
      return readBooleanRecordValue(context.flags, runtime.flags, trigger.flag);
    default:
      return false;
  }
}

function matchesBossCondition(
  trigger: BossMechanicTrigger,
  runtime: BossMechanicRuntime,
  context: BossMechanicContext,
): boolean {
  return matchesBossTrigger(trigger, runtime, { ...context, event: trigger.type });
}

export function evaluateBossMechanics(
  definition: DeclarativeBossDefinition,
  runtime: BossMechanicRuntime,
  context: BossMechanicContext,
): BossMechanicEvaluation {
  const normalizedContext: BossMechanicContext = {
    ...context,
    currentPhase: context.currentPhase || runtime.currentPhase,
    turn: context.turn || runtime.turn,
  };
  const matchedMechanicIds: string[] = [];
  const actions: BossMechanicAction[] = [];

  for (const mechanic of definition.mechanics) {
    if (mechanic.once && runtime.triggeredMechanicIds[mechanic.id]) continue;
    const hasEventTrigger = mechanic.triggers.some(trigger => matchesBossTrigger(trigger, runtime, normalizedContext));
    const matched =
      mechanic.triggers.length > 0 &&
      (mechanic.match === 'all'
        ? hasEventTrigger &&
          mechanic.triggers.every(trigger => matchesBossCondition(trigger, runtime, normalizedContext))
        : hasEventTrigger);
    if (!matched) continue;
    matchedMechanicIds.push(mechanic.id);
    actions.push(...mechanic.actions);
  }

  return {
    bossId: definition.id,
    matchedMechanicIds,
    actions,
  };
}

export function applyBossMechanicRuntimeAction(runtime: BossMechanicRuntime, action: BossMechanicAction): void {
  if (action.type === 'setPhase' && typeof action.phase === 'number') {
    runtime.currentPhase = action.phase;
    return;
  }

  if (action.type === 'setSkillPool' && action.skillPoolKey) {
    runtime.skillPoolKey = action.skillPoolKey;
    return;
  }

  if (action.type === 'addProgress' && action.stateKey) {
    runtime.progress[action.stateKey] = (runtime.progress[action.stateKey] || 0) + (action.amount || 0);
    return;
  }

  if (action.type === 'setProgress' && action.stateKey) {
    runtime.progress[action.stateKey] = Number(action.value) || 0;
    return;
  }

  if (action.type === 'setFlag' && action.flag) {
    runtime.flags[action.flag] = Boolean(action.value ?? true);
    return;
  }

  if (action.type === 'addCounter' && action.counterKey) {
    runtime.counters[action.counterKey] = (runtime.counters[action.counterKey] || 0) + (action.amount || 0);
    return;
  }

  if (action.type === 'setCounter' && action.counterKey) {
    runtime.counters[action.counterKey] = Number(action.value) || 0;
    return;
  }

  if (action.type === 'markActorState' && action.actorId && action.actorState) {
    runtime.actorStates[action.actorId] = action.actorState;
  }
}

export function applyBossMechanicEvaluation(runtime: BossMechanicRuntime, evaluation: BossMechanicEvaluation): void {
  evaluation.matchedMechanicIds.forEach(mechanicId => {
    runtime.triggeredMechanicIds[mechanicId] = true;
  });
  evaluation.actions.forEach(action => applyBossMechanicRuntimeAction(runtime, action));
}
