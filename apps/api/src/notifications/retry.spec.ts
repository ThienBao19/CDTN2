import { withRetry } from './retry';

describe('withRetry', () => {
  const noSleep = jest.fn(() => Promise.resolve());

  beforeEach(() => noSleep.mockClear());

  it('returns immediately when the first attempt succeeds', async () => {
    const task = jest.fn(() => Promise.resolve('ok'));
    const out = await withRetry(task, (r) => r !== 'ok', [10, 20], noSleep);
    expect(out).toEqual({ result: 'ok', attempts: 1 });
    expect(noSleep).not.toHaveBeenCalled();
  });

  it('retries with the given delays until success', async () => {
    const task = jest
      .fn<Promise<string>, [number]>()
      .mockResolvedValueOnce('fail')
      .mockResolvedValueOnce('ok');
    const out = await withRetry(task, (r) => r !== 'ok', [10, 20], noSleep);
    expect(out).toEqual({ result: 'ok', attempts: 2 });
    expect(noSleep).toHaveBeenCalledWith(10);
  });

  it('stops after the delays run out', async () => {
    const task = jest.fn(() => Promise.resolve('fail'));
    const out = await withRetry(task, () => true, [10, 20], noSleep);
    expect(out.attempts).toBe(3);
    expect(noSleep.mock.calls).toEqual([[10], [20]]);
  });
});
