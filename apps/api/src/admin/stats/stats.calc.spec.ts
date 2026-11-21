import {
  countByDay,
  median,
  percentile,
  pushSummary,
  resolveRange,
  stageDurations,
  toCsv,
  vnDate,
} from './stats.calc';

const at = (iso: string) => new Date(iso);

describe('stats.calc', () => {
  describe('resolveRange', () => {
    it('mặc định 30 ngày gần nhất theo giờ VN', () => {
      const r = resolveRange(undefined, undefined, at('2026-11-20T18:00:00Z'));
      if (typeof r === 'string') throw new Error(r);
      // 18:00Z ngày 20 = 01:00 ngày 21 giờ VN
      expect(r.to).toBe('2026-11-21');
      expect(r.from).toBe('2026-10-23');
      expect(r.gte.toISOString()).toBe('2026-10-22T17:00:00.000Z');
      expect(r.lte.toISOString()).toBe('2026-11-21T16:59:59.999Z');
    });
    it('từ chối khoảng ngược hoặc quá 366 ngày', () => {
      expect(typeof resolveRange('2026-11-10', '2026-11-01')).toBe('string');
      expect(typeof resolveRange('2025-01-01', '2026-11-01')).toBe('string');
      expect(typeof resolveRange('2026-11-01', '2026-11-01')).toBe('object');
    });
  });

  it('vnDate đổi sang ngày giờ VN', () => {
    expect(vnDate(at('2026-11-20T17:30:00Z'))).toBe('2026-11-21');
    expect(vnDate(at('2026-11-20T16:59:00Z'))).toBe('2026-11-20');
  });

  it('countByDay có đủ ngày trống và đếm ca hủy', () => {
    const rows = countByDay(
      [
        { scheduledAt: at('2026-11-01T01:00:00Z'), cancelledAt: null },
        {
          scheduledAt: at('2026-11-01T02:00:00Z'),
          cancelledAt: at('2026-11-01T03:00:00Z'),
        },
        { scheduledAt: at('2026-11-02T23:00:00Z'), cancelledAt: null }, // = 03/11 giờ VN
      ],
      '2026-11-01',
      '2026-11-03',
    );
    expect(rows).toEqual([
      { date: '2026-11-01', total: 2, cancelled: 1 },
      { date: '2026-11-02', total: 0, cancelled: 0 },
      { date: '2026-11-03', total: 1, cancelled: 0 },
    ]);
  });

  it('median / percentile', () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95)).toBe(10);
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 50)).toBe(5);
  });

  it('stageDurations tính thời gian ở mỗi trạng thái, bỏ trạng thái cuối', () => {
    const h = (id: number, iso: string) => ({
      statusId: id,
      changedAt: at(iso),
    });
    const stats = stageDurations(
      [
        [
          h(1, '2026-11-01T01:00:00Z'),
          h(2, '2026-11-01T01:30:00Z'),
          h(3, '2026-11-01T02:00:00Z'),
          h(5, '2026-11-01T04:00:00Z'),
        ],
        // thứ tự đầu vào lộn xộn vẫn được sắp theo thời gian
        [h(2, '2026-11-02T01:10:00Z'), h(1, '2026-11-02T01:00:00Z')],
      ],
      [1, 2, 3, 4, 5],
    );
    const by = Object.fromEntries(stats.map((s) => [s.statusId, s]));
    expect(by[1]).toMatchObject({
      samples: 2,
      avgMinutes: 20,
      medianMinutes: 20,
      minMinutes: 10,
      maxMinutes: 30,
    });
    expect(by[2]).toMatchObject({ samples: 1, avgMinutes: 30 });
    expect(by[3]).toMatchObject({ samples: 1, avgMinutes: 120 });
    expect(by[4]).toMatchObject({ samples: 0, avgMinutes: null });
    expect(by[5].samples).toBe(0);
  });

  it('pushSummary: tỉ lệ gửi bỏ qua SKIPPED, độ trễ và mục tiêu 5 giây', () => {
    const c = at('2026-11-01T01:00:00Z');
    const plus = (s: number) => new Date(c.getTime() + s * 1000);
    const s = pushSummary([
      { status: 'SENT', createdAt: c, sentAt: plus(1) },
      { status: 'SENT', createdAt: c, sentAt: plus(2) },
      { status: 'SENT', createdAt: c, sentAt: plus(9) },
      { status: 'FAILED', createdAt: c, sentAt: null },
      { status: 'SKIPPED', createdAt: c, sentAt: null },
      { status: 'PENDING', createdAt: c, sentAt: null },
    ]);
    expect(s).toMatchObject({
      total: 6,
      sent: 3,
      failed: 1,
      skipped: 1,
      pending: 1,
      deliveryRate: 75,
    });
    expect(s.latency).toMatchObject({
      samples: 3,
      avgSeconds: 4,
      p95Seconds: 9,
      withinTargetRate: 66.7,
    });
    expect(pushSummary([]).deliveryRate).toBeNull();
  });

  it('toCsv có BOM, escape dấu phẩy/ngoặc kép và chặn công thức', () => {
    const csv = toCsv([
      ['a,b', 'x"y', 3, null],
      ['=SUM(A1)', '-1', 5, undefined],
    ]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('"a,b","x""y",3,');
    expect(csv).toContain("'=SUM(A1),'-1,5,");
  });
});
