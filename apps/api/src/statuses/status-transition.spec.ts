import { evaluateTransition } from './status-transition';

describe('evaluateTransition', () => {
  it('accepts moving to the next status in order (TC-01)', () => {
    expect(
      evaluateTransition({ currentOrder: 2, targetOrder: 3, override: false }),
    ).toEqual({ ok: true, isOverride: false });
  });

  it('rejects skipping a step without override (TC-02)', () => {
    expect(
      evaluateTransition({ currentOrder: 1, targetOrder: 3, override: false }),
    ).toEqual({ ok: false, error: 'NOT_NEXT_STEP' });
  });

  it('rejects going backwards without override', () => {
    expect(
      evaluateTransition({ currentOrder: 3, targetOrder: 2, override: false }),
    ).toEqual({ ok: false, error: 'NOT_NEXT_STEP' });
  });

  it('rejects an override without a reason', () => {
    expect(
      evaluateTransition({
        currentOrder: 3,
        targetOrder: 1,
        override: true,
        reason: '   ',
      }),
    ).toEqual({ ok: false, error: 'REASON_REQUIRED' });
  });

  it('accepts an override with a reason and flags it', () => {
    expect(
      evaluateTransition({
        currentOrder: 3,
        targetOrder: 2,
        override: true,
        reason: 'Bấm nhầm',
      }),
    ).toEqual({ ok: true, isOverride: true });
  });

  it('rejects staying on the same status', () => {
    expect(
      evaluateTransition({ currentOrder: 2, targetOrder: 2, override: true }),
    ).toEqual({ ok: false, error: 'SAME_STATUS' });
  });
});
