export type Sleep = (ms: number) => Promise<void>;

export const realSleep: Sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Thử lại có giới hạn với độ trễ tăng dần (mục 11.1: lỗi gửi được thử lại)
export async function withRetry<T>(
  task: (attempt: number) => Promise<T>,
  shouldRetry: (result: T) => boolean,
  delaysMs: number[],
  sleep: Sleep = realSleep,
): Promise<{ result: T; attempts: number }> {
  let attempt = 1;
  let result = await task(attempt);
  while (shouldRetry(result) && attempt <= delaysMs.length) {
    await sleep(delaysMs[attempt - 1]);
    attempt += 1;
    result = await task(attempt);
  }
  return { result, attempts: attempt };
}
