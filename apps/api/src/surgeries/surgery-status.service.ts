import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { evaluateTransition } from '../statuses/status-transition';
import { StatusesService } from '../statuses/statuses.service';
import { ChangeStatusDto } from './dto/change-status.dto';
import { SURGERY_INCLUDE, SurgeryWithRelations } from './surgery.include';
import { SurgeriesService } from './surgeries.service';

const TRANSITION_ERRORS = {
  SAME_STATUS: 'Ca đã ở trạng thái này',
  NOT_NEXT_STEP: 'Chỉ được chuyển sang trạng thái kế tiếp',
  REASON_REQUIRED: 'Quay lui hoặc bỏ bước cần nhập lý do',
} as const;

@Injectable()
export class SurgeryStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly surgeries: SurgeriesService,
    private readonly statuses: StatusesService,
    private readonly audit: AuditService,
  ) {}

  // UC-03: kiểm tra thứ tự, lưu trạng thái + lịch sử trong một giao dịch
  async change(
    surgeryId: string,
    dto: ChangeStatusDto,
    user: AuthUser,
  ): Promise<SurgeryWithRelations> {
    const surgery = await this.surgeries.findOne(surgeryId);
    if (surgery.cancelledAt) throw new ConflictException('Ca đã bị hủy');

    const target = await this.statuses.findByCode(dto.statusCode);
    const result = evaluateTransition({
      currentOrder: surgery.currentStatus.sortOrder,
      targetOrder: target.sortOrder,
      override: dto.override ?? false,
      reason: dto.note,
    });
    if (!result.ok) {
      const message = TRANSITION_ERRORS[result.error];
      throw new BadRequestException(message);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Chỉ cập nhật nếu trạng thái chưa bị người khác đổi trong lúc đó
      const { count } = await tx.surgery.updateMany({
        where: { id: surgeryId, currentStatusId: surgery.currentStatusId },
        data: { currentStatusId: target.id },
      });
      if (count === 0) {
        throw new ConflictException(
          'Trạng thái vừa được người khác cập nhật, vui lòng tải lại',
        );
      }
      await tx.statusHistory.create({
        data: {
          surgeryId,
          statusId: target.id,
          updatedById: user.id,
          note: dto.note?.trim() || null,
          isOverride: result.isOverride,
        },
      });
      return tx.surgery.findUniqueOrThrow({
        where: { id: surgeryId },
        include: SURGERY_INCLUDE,
      });
    });

    await this.audit.log({
      userId: user.id,
      action: result.isOverride ? 'STATUS_OVERRIDE' : 'STATUS_CHANGE',
      entityType: 'surgery',
      entityId: surgeryId,
    });
    // Sprint 2: phát sự kiện để gửi push cho người nhà đã liên kết (FR-09)
    return updated;
  }

  history(surgeryId: string) {
    return this.prisma.statusHistory.findMany({
      where: { surgeryId },
      orderBy: { changedAt: 'asc' },
      include: {
        status: true,
        updatedBy: { select: { id: true, fullName: true } },
      },
    });
  }
}
