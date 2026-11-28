import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  countByDay,
  DateRange,
  pushSummary,
  resolveRange,
  stageDurations,
  toCsv,
  vnDate,
} from './stats.calc';

const WORKFLOW = 'SURGERY';
const NO_ROOM = 'Chưa xếp phòng';

// Thống kê cho trang quản trị: chỉ đọc, không thay đổi CSDL
@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  range(from?: string, to?: string): DateRange {
    const r = resolveRange(from, to);
    if (typeof r === 'string') throw new BadRequestException(r);
    return r;
  }

  private statuses() {
    return this.prisma.statusDefinition.findMany({
      where: { workflow: WORKFLOW },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Số ca theo ngày, theo phòng, theo trạng thái hiện tại
  async surgeries(r: DateRange) {
    const where = { scheduledAt: { gte: r.gte, lte: r.lte } };
    const [rows, rooms, statuses] = await Promise.all([
      this.prisma.surgery.findMany({
        where,
        select: {
          scheduledAt: true,
          cancelledAt: true,
          roomId: true,
          currentStatusId: true,
        },
      }),
      this.prisma.room.findMany({ select: { id: true, name: true } }),
      this.statuses(),
    ]);
    const roomName = new Map(rooms.map((x) => [x.id, x.name]));

    const byRoomMap = new Map<
      string,
      { roomId: string | null; name: string; total: number; cancelled: number }
    >();
    for (const s of rows) {
      const key = s.roomId ?? '';
      const row = byRoomMap.get(key) ?? {
        roomId: s.roomId,
        name: s.roomId ? (roomName.get(s.roomId) ?? s.roomId) : NO_ROOM,
        total: 0,
        cancelled: 0,
      };
      row.total += 1;
      if (s.cancelledAt) row.cancelled += 1;
      byRoomMap.set(key, row);
    }

    const active = rows.filter((s) => !s.cancelledAt);
    const byStatus = statuses.map((st) => ({
      code: st.code,
      label: st.label,
      count: active.filter((s) => s.currentStatusId === st.id).length,
    }));
    const cancelled = rows.length - active.length;
    byStatus.push({ code: 'CANCELLED', label: 'Đã hủy', count: cancelled });

    return {
      from: r.from,
      to: r.to,
      total: rows.length,
      cancelled,
      completed: byStatus.find((s) => s.code === 'COMPLETED')?.count ?? 0,
      byDay: countByDay(rows, r.from, r.to),
      byRoom: [...byRoomMap.values()].sort((a, b) => b.total - a.total),
      byStatus,
    };
  }

  private async histories(r: DateRange) {
    return this.prisma.surgery.findMany({
      where: { scheduledAt: { gte: r.gte, lte: r.lte } },
      orderBy: { scheduledAt: 'asc' },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        cancelledAt: true,
        patient: { select: { patientCode: true } },
        room: { select: { name: true } },
        currentStatus: { select: { label: true } },
        history: {
          orderBy: { changedAt: 'asc' },
          select: { statusId: true, changedAt: true },
        },
      },
    });
  }

  // Thời gian trung bình ở từng giai đoạn, tính từ status_history
  async stageDurations(r: DateRange) {
    const [surgeries, statuses] = await Promise.all([
      this.histories(r),
      this.statuses(),
    ]);
    const stats = stageDurations(
      surgeries.map((s) => s.history),
      statuses.map((s) => s.id),
    );
    const last = statuses[statuses.length - 1]?.id;
    return {
      from: r.from,
      to: r.to,
      surgeries: surgeries.length,
      // Trạng thái cuối (hoàn tất) không có bước kế tiếp nên không tính thời gian
      items: statuses
        .filter((s) => s.id !== last)
        .map((st) => {
          const found = stats.find((x) => x.statusId === st.id)!;
          return {
            code: st.code,
            label: st.label,
            samples: found.samples,
            avgMinutes: found.avgMinutes,
            medianMinutes: found.medianMinutes,
            minMinutes: found.minMinutes,
            maxMinutes: found.maxMinutes,
          };
        }),
    };
  }

  // Tỉ lệ push gửi được từ bảng notifications (minh chứng NFR thông báo < 5 giây)
  async notifications(r: DateRange) {
    const rows = await this.prisma.notification.findMany({
      where: {
        channel: NotificationChannel.PUSH,
        createdAt: { gte: r.gte, lte: r.lte },
      },
      select: { status: true, createdAt: true, sentAt: true },
    });
    return { from: r.from, to: r.to, ...pushSummary(rows) };
  }

  // Xuất CSV: từng ca (kèm thời gian từng giai đoạn) hoặc số liệu tổng hợp
  async exportCsv(r: DateRange, type: 'surgeries' | 'summary') {
    if (type === 'summary') return this.summaryCsv(r);
    const [surgeries, statuses] = await Promise.all([
      this.histories(r),
      this.statuses(),
    ]);
    const stages = statuses.slice(0, -1);
    const header = [
      'Ngày',
      'Giờ dự kiến',
      'Mã bệnh nhân',
      'Ca phẫu thuật',
      'Phòng',
      'Trạng thái hiện tại',
      'Đã hủy',
      ...stages.map((s) => `${s.label} (phút)`),
    ];
    const rows = surgeries.map((s) => {
      const per = new Map<number, number>();
      for (let i = 0; i < s.history.length - 1; i++) {
        const mins =
          (s.history[i + 1].changedAt.getTime() -
            s.history[i].changedAt.getTime()) /
          60000;
        per.set(
          s.history[i].statusId,
          Math.round(((per.get(s.history[i].statusId) ?? 0) + mins) * 10) / 10,
        );
      }
      const local = new Date(s.scheduledAt.getTime() + 7 * 3600 * 1000);
      return [
        vnDate(s.scheduledAt),
        local.toISOString().slice(11, 16),
        s.patient.patientCode,
        s.title,
        s.room?.name ?? NO_ROOM,
        s.cancelledAt ? 'Đã hủy' : s.currentStatus.label,
        s.cancelledAt ? 'Có' : 'Không',
        ...stages.map((st) => per.get(st.id) ?? null),
      ];
    });
    return toCsv([header, ...rows]);
  }

  private async summaryCsv(r: DateRange) {
    const [sg, st, nt] = await Promise.all([
      this.surgeries(r),
      this.stageDurations(r),
      this.notifications(r),
    ]);
    const out: (string | number | null)[][] = [
      ['Thống kê ca phẫu thuật', `${r.from} đến ${r.to}`],
      [],
      ['Tổng số ca', sg.total],
      ['Đã hủy', sg.cancelled],
      ['Đã hoàn tất', sg.completed],
      [],
      ['Theo ngày', 'Số ca', 'Đã hủy'],
      ...sg.byDay.map((d) => [d.date, d.total, d.cancelled]),
      [],
      ['Theo phòng', 'Số ca', 'Đã hủy'],
      ...sg.byRoom.map((x) => [x.name, x.total, x.cancelled]),
      [],
      ['Theo trạng thái', 'Số ca'],
      ...sg.byStatus.map((x) => [x.label, x.count]),
      [],
      [
        'Giai đoạn',
        'Số mẫu',
        'TB (phút)',
        'Trung vị (phút)',
        'Ngắn nhất',
        'Dài nhất',
      ],
      ...st.items.map((x) => [
        x.label,
        x.samples,
        x.avgMinutes,
        x.medianMinutes,
        x.minMinutes,
        x.maxMinutes,
      ]),
      [],
      ['Thông báo đẩy', 'Số lượng'],
      ['Tổng', nt.total],
      ['Đã gửi (SENT)', nt.sent],
      ['Bỏ qua (SKIPPED)', nt.skipped],
      ['Lỗi (FAILED)', nt.failed],
      ['Đang chờ (PENDING)', nt.pending],
      ['Tỉ lệ gửi thành công (%)', nt.deliveryRate],
      ['Độ trễ TB (giây)', nt.latency.avgSeconds],
      ['Độ trễ p95 (giây)', nt.latency.p95Seconds],
      [
        `Tỉ lệ đến trong ${nt.latency.targetSeconds} giây (%)`,
        nt.latency.withinTargetRate,
      ],
    ];
    return toCsv(out);
  }
}
