// Quy tắc chuyển trạng thái (BR-01, UC-03) — hàm thuần để dễ kiểm thử.
export type TransitionInput = {
  currentOrder: number;
  targetOrder: number;
  override: boolean;
  reason?: string;
};

export type TransitionResult =
  | { ok: true; isOverride: boolean }
  | { ok: false; error: 'SAME_STATUS' | 'NOT_NEXT_STEP' | 'REASON_REQUIRED' };

export function evaluateTransition(input: TransitionInput): TransitionResult {
  const { currentOrder, targetOrder, override, reason } = input;
  if (targetOrder === currentOrder) return { ok: false, error: 'SAME_STATUS' };
  if (targetOrder === currentOrder + 1) return { ok: true, isOverride: false };
  if (!override) return { ok: false, error: 'NOT_NEXT_STEP' };
  if (!reason?.trim()) return { ok: false, error: 'REASON_REQUIRED' };
  return { ok: true, isOverride: true };
}
