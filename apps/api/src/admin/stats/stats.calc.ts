// Hàm tính thống kê thuần (không truy cập CSDL) để dễ kiểm thử đơn vị

export const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_RANGE_DAYS = 366;
export const DEFAULT_RANGE_DAYS = 30;

export type DateRange = { from: string; to: string; gte: Date; lte: Date };

// Ngày (YYYY-MM-DD) theo giờ Việt Nam của một thời điểm
export function vnDate(d: Date): string {
  return new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const t = Date.parse(`${date}T00:00:00Z`) + days * DAY_MS;
  return new Date(t).toISOString().slice(0, 10);
}

// Chuẩn hóa khoảng ngày: mặc định 30 ngày gần nhất; trả lỗi (chuỗi) nếu không hợp lệ
export function resolveRange(
  from: string | undefined,
  to: string | undefined,
  now: Date = new Date(),
): DateRange | string {
  const end = to ?? vnDate(now);
  const start = from ?? addDays(end, -(DEFAULT_RANGE_DAYS - 1));
  const gte = new Date(`${start}T00:00:00+07:00`);
  const endStart = new Date(`${end}T00:00:00+07:00`);
  if (Number.isNaN(gte.getTime()) || Number.isNaN(endStart.getTime())) {
    return 'Ngày không hợp lệ';
  }
  if (gte > endStart) return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc';
  const days = Math.round((endStart.getTime() - gte.getTime()) / DAY_MS) + 1;
  if (days > MAX_RANGE_DAYS) {
    return `Khoảng thời gian tối đa ${MAX_RANGE_DAYS} ngày`;
  }
  return {
    from: start,
    to: end,
    gte,
    lte: new Date(endStart.getTime() + DAY_MS - 1),
  };
}

// Danh sách mọi ngày trong khoảng (để biểu đồ có cả ngày không có ca)
export function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

export type DayCount = { date: string; total: number; cancelled: number };

export function countByDay(
  surgeries: { scheduledAt: Date; cancelledAt: Date | null }[],
  from: string,
  to: string,
): DayCount[] {
  const map = new Map(
    eachDay(from, to).map((d) => [d, { date: d, total: 0, cancelled: 0 }]),
  );
  for (const s of surgeries) {
    const row = map.get(vnDate(s.scheduledAt));
    if (!row) continue;
    row.total += 1;
    if (s.cancelledAt) row.cancelled += 1;
  }
  return [...map.values()];
}

export type HistoryPoint = { statusId: number; changedAt: Date };
export type StageStat = {
  statusId: number;
  samples: number;
  avgMinutes: number | null;
  medianMinutes: number | null;
  minMinutes: number | null;
  maxMinutes: number | null;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1);
  return s[Math.max(0, idx)];
}

// Thời gian ở mỗi trạng thái = thời điểm chuyển sang trạng thái kế tiếp − thời điểm vào trạng thái.
// Trạng thái cuối của mỗi ca (chưa có bước kế tiếp) không được tính.
export function stageDurations(
  histories: HistoryPoint[][],
  statusIds: number[],
): StageStat[] {
  const buckets = new Map<number, number[]>(statusIds.map((id) => [id, []]));
  for (const list of histories) {
    const sorted = [...list].sort(
      (a, b) => a.changedAt.getTime() - b.changedAt.getTime(),
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const cur = sorted[i];
      const minutes =
        (sorted[i + 1].changedAt.getTime() - cur.changedAt.getTime()) / 60000;
      if (minutes < 0) continue;
      const bucket = buckets.get(cur.statusId);
      if (bucket) bucket.push(minutes);
    }
  }
  return statusIds.map((statusId) => {
    const v = buckets.get(statusId) ?? [];
    const sum = v.reduce((a, b) => a + b, 0);
    const med = median(v);
    return {
      statusId,
      samples: v.length,
      avgMinutes: v.length ? round1(sum / v.length) : null,
      medianMinutes: med === null ? null : round1(med),
      minMinutes: v.length ? round1(Math.min(...v)) : null,
      maxMinutes: v.length ? round1(Math.max(...v)) : null,
    };
  });
}

export type PushStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
export const PUSH_TARGET_SECONDS = 5; // NFR: thông báo đến người nhà dưới 5 giây

export function pushSummary(
  rows: { status: PushStatus; createdAt: Date; sentAt: Date | null }[],
) {
  const count = (s: PushStatus) => rows.filter((r) => r.status === s).length;
  const sent = count('SENT');
  const failed = count('FAILED');
  const latencies = rows
    .filter((r) => r.status === 'SENT' && r.sentAt)
    .map((r) => (r.sentAt!.getTime() - r.createdAt.getTime()) / 1000)
    .filter((s) => s >= 0);
  const within = latencies.filter((s) => s <= PUSH_TARGET_SECONDS).length;
  const p95 = percentile(latencies, 95);
  return {
    total: rows.length,
    sent,
    skipped: count('SKIPPED'),
    failed,
    pending: count('PENDING'),
    // Tỉ lệ gửi thành công trong số lần thực sự gửi (bỏ qua SKIPPED, PENDING)
    deliveryRate: sent + failed ? round1((sent / (sent + failed)) * 100) : null,
    latency: {
      samples: latencies.length,
      avgSeconds: latencies.length
        ? Math.round(
            (latencies.reduce((a, b) => a + b, 0) / latencies.length) * 100,
          ) / 100
        : null,
      p95Seconds: p95 === null ? null : Math.round(p95 * 100) / 100,
      targetSeconds: PUSH_TARGET_SECONDS,
      withinTargetRate: latencies.length
        ? round1((within / latencies.length) * 100)
        : null,
    },
  };
}

// CSV có BOM UTF-8 để Excel mở đúng tiếng Việt
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return '';
    let s = String(v);
    // Chặn chèn công thức khi mở bằng Excel (CSV injection)
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}
