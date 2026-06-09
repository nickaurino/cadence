// Feature tour = four independent, one-time coachmarks (see ADR 0005). Each is
// gated on (its own trigger) AND (not yet seen); only one shows at a time. This
// module holds the pure gating logic so it's testable without React.

export type CoachmarkId = 'onTheBeat' | 'paceShift' | 'paceLock' | 'holdToEnd';

export const COACHMARK_IDS: CoachmarkId[] = [
  'onTheBeat',
  'paceShift',
  'paceLock',
  'holdToEnd',
];

export type SeenMap = Record<CoachmarkId, boolean>;

function mapOf(value: boolean): SeenMap {
  return COACHMARK_IDS.reduce((acc, id) => ((acc[id] = value), acc), {} as SeenMap);
}

export function allUnseen(): SeenMap {
  return mapOf(false);
}

export function allSeenMap(): SeenMap {
  return mapOf(true);
}

// New map with `id` marked seen; input is not mutated.
export function withSeen(seen: SeenMap, id: CoachmarkId): SeenMap {
  return { ...seen, [id]: true };
}

// A coachmark shows only if it's unseen and nothing else is currently showing.
export function shouldShow(
  seen: SeenMap,
  current: CoachmarkId | null,
  id: CoachmarkId
): boolean {
  return current === null && !seen[id];
}

export function allSeen(seen: SeenMap): boolean {
  return COACHMARK_IDS.every((id) => seen[id]);
}
