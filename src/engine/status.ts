// User-facing status label for the active session screen, by priority.
// Note: "On the beat" is the user-facing wording for the in-the-pocket state.
// The domain term stays "in the pocket" internally (see CONTEXT.md); "On the
// beat" avoids the "phone in pocket" misread and the "Pace locked" collision.
export function sessionStatusLabel(s: {
  isCalibrating: boolean;
  paceLocked: boolean;
  inThePocket: boolean;
}): string {
  if (s.isCalibrating) return 'Finding your pace';
  if (s.paceLocked) return 'Pace locked';
  if (s.inThePocket) return 'On the beat';
  return 'Shifting';
}
