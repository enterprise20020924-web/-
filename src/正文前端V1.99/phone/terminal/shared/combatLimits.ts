export const COMBAT_CLIMAX_LIMIT_MAX = 5;
export const COMBAT_CLIMAX_LIMIT_MIN = 1;

export function normalizeCombatClimaxLimit(value: unknown): number {
  const limit = Math.floor(Number(value) || 0);
  return Math.min(COMBAT_CLIMAX_LIMIT_MAX, Math.max(COMBAT_CLIMAX_LIMIT_MIN, limit));
}
