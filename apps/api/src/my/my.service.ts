import { Injectable, NotFoundException } from '@nestjs/common';
import { LinkStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { maskName } from './mask-name';

const FAMILY_SURGERY_SELECT = {
  id: true,
  title: true,
  scheduledAt: true,
  cancelledAt: true,
  updatedAt: true,
  patient: { select: { fullName: true } },
  room: { select: { name: true, location: true } },
  currentStatus: { select: { code: true, label: true, sortOrder: true } },
} satisfies Prisma.SurgerySelect;

// Màn hình tự làm mới liên tục: chỉ ghi một lần xem trong mỗi khoảng này
const VIEW_LOG_WINDOW_MS = 5 * 60 * 1000;

type FamilySurgery = Prisma.SurgeryGetPayload<{
  select: typeof FAMILY_SURGERY_SELECT;
}>;

// Chỉ các trường cần thiết cho người nhà, không có chẩn đoán (NFR-07)
function toFamilyView(linkId: string, s: FamilySurgery) {
  return {
    linkId,
    surgeryId: s.id,
    title: s.title,
    patientName: maskName(s.patient.fullName),
    room: s.room,
    scheduledAt: s.scheduledAt,
    isCancelled: s.cancelledAt !== null,
    currentStatus: s.currentStatus,
    updatedAt: s.updatedAt,
  };
}

@Injectable()
export class MyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async surgeries(user: AuthUser) {
    const links = await this.prisma.familyLink.findMany({
      where: { userId: user.id, status: LinkStatus.ACTIVE },
      orderBy: { linkedAt: 'desc' },
      select: { id: true, surgery: { select: FAMILY_SURGERY_SELECT } },
    });
    return links.map((l) => toFamilyView(l.id, l.surgery));
  }

  async surgery(user: AuthUser, surgeryId: string, ipAddress?: string) {
    const link = await this.prisma.familyLink.findFirst({
      where: { userId: user.id, surgeryId, status: LinkStatus.ACTIVE },
      select: { id: true, surgery: { select: FAMILY_SURGERY_SELECT } },
    });
    if (!link) throw new NotFoundException('Không tìm thấy ca phẫu thuật');

    const history = await this.prisma.statusHistory.findMany({
      where: { surgeryId },
      orderBy: { changedAt: 'asc' },
      select: {
        id: true,
        changedAt: true,
        status: { select: { code: true, label: true } },
      },
    });
    await this.logView(user.id, surgeryId, ipAddress);
    return { ...toFamilyView(link.id, link.surgery), history };
  }

  private async logView(userId: string, surgeryId: string, ipAddress?: string) {
    const recent = await this.prisma.auditLog.findFirst({
      where: {
        userId,
        action: 'VIEW',
        entityId: surgeryId,
        createdAt: { gte: new Date(Date.now() - VIEW_LOG_WINDOW_MS) },
      },
      select: { id: true },
    });
    if (recent) return;
    await this.audit.log({
      userId,
      action: 'VIEW',
      entityType: 'surgery',
      entityId: surgeryId,
      ipAddress,
    });
  }
}
