export type LimiterOptions = {
  maxFailures: number;
  windowMs: number;
  lockMs: number;
};

type Entry = { failures: number[]; lockedUntil: number };

// Đếm số lần nhập sai mã theo người dùng; vượt ngưỡng thì tạm khóa (TC-05).
// Lưu trong bộ nhớ: đủ cho một instance; nhiều instance cần chuyển sang Redis.
export class AttemptLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly options: LimiterOptions) {}

  // Số mili giây còn bị khóa, 0 nếu không bị khóa
  lockedFor(key: string, now: number): number {
    const entry = this.entries.get(key);
    if (!entry) return 0;
    return Math.max(0, entry.lockedUntil - now);
  }

  recordFailure(key: string, now: number): void {
    const entry = this.entries.get(key) ?? { failures: [], lockedUntil: 0 };
    const recent = [
      ...entry.failures.filter((t) => now - t < this.options.windowMs),
      now,
    ];
    const isOverLimit = recent.length >= this.options.maxFailures;
    this.entries.set(key, {
      failures: isOverLimit ? [] : recent,
      lockedUntil: isOverLimit ? now + this.options.lockMs : entry.lockedUntil,
    });
  }

  reset(key: string): void {
    this.entries.delete(key);
  }
}
