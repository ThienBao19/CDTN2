
import { Injectable, NotFoundException } from '@nestjs/common';
import { LinkStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { StatusesService } from '../statuses/statuses.service';
import { maskName } from './mask-name';

const FAMILY_SURGERY_SELECT = {
  id: true,
  title: true,
  scheduledAt: true,
  cancelledAt: true,
  updatedAt: true,
  expectedMinutes: true,
  patient: { select: { fullName: true } },
  room: { select: { name: true, location: true } },
  currentStatus: {
    select: {
      id: true,
      code: true,
      label: true,
      sortOrder: true,
      expectedMinutes: true,
    },
  },
  // Thời điểm đổi trạng thái gần nhất (mục 12.1),
  // không phải lúc sửa tên/giờ ca.
  history: {
    orderBy: { changedAt: 'desc' },
    take: 1,
    select: {
      changedAt: true,
      statusId: true,
    },
  },
} satisfies Prisma.SurgerySelect;

// Màn hình tự làm mới liên tục:
// chỉ ghi một lần xem trong mỗi khoảng này.
const VIEW_LOG_WINDOW_MS = 5 * 60 * 1000;

type FamilySurgery = Prisma.SurgeryGetPayload<{
  select: typeof FAMILY_SURGERY_SELECT;
}>;

// Tính thời điểm hoàn thành dự kiến của giai đoạn hiện tại.
function calculateExpectedFinishAt(
  s: FamilySurgery,
  finalStatusId: number | null,
): Date | null {
  // Không hiển thị dự kiến cho ca đã hủy hoặc hoàn tất.
  if (
    s.cancelledAt !== null ||
    finalStatusId === null ||
    s.currentStatus.id === finalStatusId
  ) {
    return null;
  }

  // Ưu tiên thời gian riêng của Staff,
  // nếu không có thì sử dụng mặc định của Admin.
  const expectedMinutes =
    s.expectedMinutes ?? s.currentStatus.expectedMinutes;

  if (
    expectedMinutes === null ||
    !Number.isInteger(expectedMinutes) ||
    expectedMinutes <= 0
  ) {
    return null;
  }

  const latestHistory = s.history[0];

  // Phải có lịch sử tương ứng với trạng thái hiện tại.
  if (
    !latestHistory ||
    latestHistory.statusId !== s.currentStatus.id
  ) {
    return null;
  }

  const expectedFinishAt = new Date(
    latestHistory.changedAt.getTime() +
      expectedMinutes * 60 * 1000,
  );

  return Number.isFinite(expectedFinishAt.getTime())
    ? expectedFinishAt
    : null;
}

// Chỉ các trường cần thiết cho người nhà,
// không có chẩn đoán (NFR-07).
function toFamilyView(
  linkId: string,
  s: FamilySurgery,
  finalStatusId: number | null,
) {
  return {
    linkId,
    surgeryId: s.id,
    title: s.title,
    patientName: maskName(s.patient.fullName),
    room: s.room,
    scheduledAt: s.scheduledAt,
    isCancelled: s.cancelledAt !== null,
    currentStatus: {
      code: s.currentStatus.code,
      label: s.currentStatus.label,
      sortOrder: s.currentStatus.sortOrder,
    },
    updatedAt: s.history[0]?.changedAt ?? s.updatedAt,
    expectedFinishAt: calculateExpectedFinishAt(
      s,
      finalStatusId,
    ),
  };
}

@Injectable()
export class MyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly statuses: StatusesService,
  ) {}

  // Xác định trạng thái cuối cùng của quy trình phẫu thuật.
  private async getFinalStatusId(): Promise<number | null> {
    const statuses = await this.statuses.list();

    return statuses[statuses.length - 1]?.id ?? null;
  }

  async surgeries(user: AuthUser) {
    const links = await this.prisma.familyLink.findMany({
      where: {
        userId: user.id,
        status: LinkStatus.ACTIVE,
      },
      orderBy: { linkedAt: 'desc' },
      select: {
        id: true,
        surgery: { select: FAMILY_SURGERY_SELECT },
      },
    });

    const finalStatusId = await this.getFinalStatusId();

    return links.map((l) =>
      toFamilyView(l.id, l.surgery, finalStatusId),
    );
  }

  async surgery(
    user: AuthUser,
    surgeryId: string,
    ipAddress?: string,
  ) {
    const link = await this.prisma.familyLink.findFirst({
      where: {
        userId: user.id,
        surgeryId,
        status: LinkStatus.ACTIVE,
      },
      select: {
        id: true,
        surgery: { select: FAMILY_SURGERY_SELECT },
      },
    });

    if (!link) {
      throw new NotFoundException(
        'Không tìm thấy ca phẫu thuật',
      );
    }

    const history =
      await this.prisma.statusHistory.findMany({
        where: { surgeryId },
        orderBy: { changedAt: 'asc' },
        select: {
          id: true,
          changedAt: true,
          status: {
            select: {
              code: true,
              label: true,
            },
          },
        },
      });

    const finalStatusId = await this.getFinalStatusId();

    await this.logView(user.id, surgeryId, ipAddress);

    return {
      ...toFamilyView(
        link.id,
        link.surgery,
        finalStatusId,
      ),
      history,
    };
  }

  private async logView(
    userId: string,
    surgeryId: string,
    ipAddress?: string,
  ) {
    const recent = await this.prisma.auditLog.findFirst({
      where: {
        userId,
        action: 'VIEW',
        entityId: surgeryId,
        createdAt: {
          gte: new Date(
            Date.now() - VIEW_LOG_WINDOW_MS,
          ),
        },
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
