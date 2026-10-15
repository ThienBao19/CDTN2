import { AttemptLimiter } from './attempt-limiter';

const MINUTE = 60_000;

describe('AttemptLimiter', () => {
  const options = { maxFailures: 3, windowMs: 10 * MINUTE, lockMs: 5 * MINUTE };

  it('is not locked before reaching the failure limit', () => {
    const limiter = new AttemptLimiter(options);
    limiter.recordFailure('u1', 0);
    limiter.recordFailure('u1', 1000);
    expect(limiter.lockedFor('u1', 2000)).toBe(0);
  });

  it('locks after too many failures within the window (TC-05)', () => {
    const limiter = new AttemptLimiter(options);
    [0, 1000, 2000].forEach((t) => limiter.recordFailure('u1', t));
    expect(limiter.lockedFor('u1', 3000)).toBe(5 * MINUTE - 1000);
  });

  it('unlocks after the lock period ends', () => {
    const limiter = new AttemptLimiter(options);
    [0, 1000, 2000].forEach((t) => limiter.recordFailure('u1', t));
    expect(limiter.lockedFor('u1', 2000 + 5 * MINUTE)).toBe(0);
  });

  it('ignores failures older than the window', () => {
    const limiter = new AttemptLimiter(options);
    limiter.recordFailure('u1', 0);
    limiter.recordFailure('u1', 1000);
    limiter.recordFailure('u1', 11 * MINUTE);
    expect(limiter.lockedFor('u1', 11 * MINUTE)).toBe(0);
  });

  it('tracks users independently and resets on success', () => {
    const limiter = new AttemptLimiter(options);
    [0, 1, 2].forEach((t) => limiter.recordFailure('u1', t));
    expect(limiter.lockedFor('u2', 3)).toBe(0);
    limiter.reset('u1');
    expect(limiter.lockedFor('u1', 3)).toBe(0);
  });
});
