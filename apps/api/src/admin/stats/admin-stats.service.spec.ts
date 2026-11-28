import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminStatsService } from './admin-stats.service';

const STATUSES = [
  { id: 1, code: 'RECEIVED', label: 'Đã tiếp nhận', sortOrder: 1 },
  { id: 2, code: 'PREPARING', label: 'Đang chuẩn bị', sortOrder: 2 },
  { id: 3, code: 'IN_SURGERY', label: 'Đang phẫu thuật', sortOrder: 3 },
  { id: 4, code: 'RECOVERING', label: 'Đang hồi tỉnh', sortOrder: 4 },
  { id: 5, code: 'COMPLETED', label: 'Đã hoàn tất', sortOrder: 5 },
];
const t = (iso: string) => new Date(iso);

function makeService() {
  const prisma = {
    statusDefinition: { findMany: jest.fn().mockResolvedValue(STATUSES) },
    room: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'r1', name: 'Phòng mổ 1' },
        { id: 'r2', name: 'Phòng mổ 2' },
      ]),
    },
    surgery: { findMany: jest.fn() },
    notification: { findMany: jest.fn() },
  };
  return {
    prisma,
    service: new AdminStatsService(prisma as unknown as PrismaService),
  };
}

describe('AdminStatsService', () => {
  it('range báo lỗi 400 khi khoảng ngày sai', () => {
    const { service } = makeService();
    expect(() => service.range('2026-11-10', '2026-11-01')).toThrow(
      BadRequestException,
    );
  });

  it('surgeries: theo ngày, phòng, trạng thái; ca hủy tách riêng', async () => {
    const { prisma, service } = makeService();
    prisma.surgery.findMany.mockResolvedValue([
      {
        scheduledAt: t('2026-11-01T01:00:00Z'),
        cancelledAt: null,
        roomId: 'r1',
        currentStatusId: 5,
      },
      {
        scheduledAt: t('2026-11-01T02:00:00Z'),
        cancelledAt: null,
        roomId: 'r1',
        currentStatusId: 3,
      },
      {
        scheduledAt: t('2026-11-02T02:00:00Z'),
        cancelledAt: t('2026-11-02T03:00:00Z'),
        roomId: 'r2',
        currentStatusId: 1,
      },
      {
        scheduledAt: t('2026-11-02T04:00:00Z'),
        cancelledAt: null,
        roomId: null,
        currentStatusId: 1,
      },
    ]);
    const res = await service.surgeries(
      service.range('2026-11-01', '2026-11-02'),
    );
    expect(res).toMatchObject({ total: 4, cancelled: 1, completed: 1 });
    expect(res.byDay).toEqual([
      { date: '2026-11-01', total: 2, cancelled: 0 },
      { date: '2026-11-02', total: 2, cancelled: 1 },
    ]);
    expect(res.byRoom[0]).toMatchObject({ name: 'Phòng mổ 1', total: 2 });
    expect(res.byRoom.map((r) => r.name)).toContain('Chưa xếp phòng');
    const st = Object.fromEntries(res.byStatus.map((s) => [s.code, s.count]));
    expect(st).toEqual({
      RECEIVED: 1,
      PREPARING: 0,
      IN_SURGERY: 1,
      RECOVERING: 0,
      COMPLETED: 1,
      CANCELLED: 1,
    });
  });

  it('stageDurations bỏ trạng thái cuối, exportCsv có cột phút từng giai đoạn', async () => {
    const { prisma, service } = makeService();
    prisma.surgery.findMany.mockResolvedValue([
      {
        id: 's1',
        title: 'Mổ ruột thừa',
        scheduledAt: t('2026-11-01T01:00:00Z'),
        cancelledAt: null,
        patient: { patientCode: 'BN001' },
        room: { name: 'Phòng mổ 1' },
        currentStatus: { label: 'Đã hoàn tất' },
        history: [
          { statusId: 1, changedAt: t('2026-11-01T01:00:00Z') },
          { statusId: 2, changedAt: t('2026-11-01T01:20:00Z') },
          { statusId: 3, changedAt: t('2026-11-01T01:50:00Z') },
          { statusId: 4, changedAt: t('2026-11-01T03:20:00Z') },
          { statusId: 5, changedAt: t('2026-11-01T04:00:00Z') },
        ],
      },
    ]);
    const r = service.range('2026-11-01', '2026-11-01');
    const sd = await service.stageDurations(r);
    expect(sd.items.map((i) => [i.code, i.avgMinutes])).toEqual([
      ['RECEIVED', 20],
      ['PREPARING', 30],
      ['IN_SURGERY', 90],
      ['RECOVERING', 40],
    ]);
    const csv = await service.exportCsv(r, 'surgeries');
    const lines = csv.replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toContain('Đang phẫu thuật (phút)');
    expect(lines[1]).toBe(
      '2026-11-01,08:00,BN001,Mổ ruột thừa,Phòng mổ 1,Đã hoàn tất,Không,20,30,90,40',
    );
  });

  it('notifications chỉ lấy kênh PUSH trong khoảng ngày', async () => {
    const { prisma, service } = makeService();
    prisma.notification.findMany.mockResolvedValue([
      {
        status: 'SENT',
        createdAt: t('2026-11-01T01:00:00Z'),
        sentAt: t('2026-11-01T01:00:01Z'),
      },
      { status: 'SKIPPED', createdAt: t('2026-11-01T01:00:00Z'), sentAt: null },
    ]);
    const res = await service.notifications(
      service.range('2026-11-01', '2026-11-01'),
    );
    expect(res).toMatchObject({
      total: 2,
      sent: 1,
      skipped: 1,
      deliveryRate: 100,
    });
    const arg = (
      prisma.notification.findMany.mock.calls as [
        { where: { channel: string } },
      ][]
    )[0][0];
    expect(arg.where.channel).toBe('PUSH');
  });
});
