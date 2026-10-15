import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import {
  CHANGED_MESSAGE,
  NotificationsService,
  SCHEDULE_CHANGED_MESSAGE,
} from '../notifications/notifications.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { StatusesService } from '../statuses/statuses.service';
import { CreateSurgeryDto } from './dto/create-surgery.dto';
import { ListSurgeriesDto } from './dto/list-surgeries.dto';
import { UpdateSurgeryDto } from './dto/update-surgery.dto';
import {
  dayRange,
  SURGERY_INCLUDE,
  SurgeryWithRelations,
} from './surgery.include';

@Injectable()
export class SurgeriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statuses: StatusesService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // Tạo ca ở trạng thái đầu tiên và ghi bản lịch sử đầu tiên trong cùng giao dịch
  async create(
    dto: CreateSurgeryDto,
    user: AuthUser,
  ): Promise<SurgeryWithRelations> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) throw new NotFoundException('Không tìm thấy bệnh nhân');
    const first = await this.statuses.first();

    const surgery = await this.prisma.$transaction(async (tx) => {
      const created = await tx.surgery.create({
        data: {
          patientId: dto.patientId,
          roomId: dto.roomId,
          title: dto.title.trim(),
          scheduledAt: new Date(dto.scheduledAt),
          currentStatusId: first.id,
          createdById: user.id,
        },
        include: SURGERY_INCLUDE,
      });
      await tx.statusHistory.create({
        data: {
          surgeryId: created.id,
          statusId: first.id,
          updatedById: user.id,
          note: 'Tạo ca',
        },
      });
      return created;
    });

    await this.audit.log({
      userId: user.id,
      action: 'CREATE',
      entityType: 'surgery',
      entityId: surgery.id,
    });
    return surgery;
  }

  list(query: ListSurgeriesDto): Promise<SurgeryWithRelations[]> {
    const where: Prisma.SurgeryWhereInput = {
      ...(query.date ? { scheduledAt: dayRange(query.date) } : {}),
      ...(query.roomId ? { roomId: query.roomId } : {}),
      ...(query.status ? { currentStatus: { code: query.status } } : {}),
    };
    return this.prisma.surgery.findMany({
      where,
      include: SURGERY_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(id: string): Promise<SurgeryWithRelations> {
    const surgery = await this.prisma.surgery.findUnique({
      where: { id },
      include: SURGERY_INCLUDE,
    });
    if (!surgery) throw new NotFoundException('Không tìm thấy ca phẫu thuật');
    return surgery;
  }

  async update(
    id: string,
    dto: UpdateSurgeryDto,
    user: AuthUser,
  ): Promise<SurgeryWithRelations> {
    const current = await this.findOne(id);
    if (current.cancelledAt) {
      throw new ConflictException('Ca đã bị hủy, không thể sửa');
    }
    const surgery = await this.prisma.surgery.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        roomId: dto.roomId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
      include: SURGERY_INCLUDE,
    });
    await this.audit.log({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'surgery',
      entityId: id,
    });
    const isScheduleChanged =
      surgery.scheduledAt.getTime() !== current.scheduledAt.getTime() ||
      surgery.roomId !== current.roomId;
    if (isScheduleChanged) {
      await this.notifications.notifySurgery(id, SCHEDULE_CHANGED_MESSAGE);
    }
    return surgery;
  }

  async cancel(
    id: string,
    reason: string,
    user: AuthUser,
  ): Promise<SurgeryWithRelations> {
    const current = await this.findOne(id);
    if (current.cancelledAt) throw new ConflictException('Ca đã bị hủy');
    if (await this.statuses.isFinal(current.currentStatus)) {
      throw new ConflictException('Ca đã hoàn tất, không thể hủy');
    }
    const surgery = await this.prisma.surgery.update({
      where: { id },
      data: { cancelledAt: new Date(), cancelReason: reason.trim() },
      include: SURGERY_INCLUDE,
    });
    await this.audit.log({
      userId: user.id,
      action: 'CANCEL',
      entityType: 'surgery',
      entityId: id,
    });
    await this.notifications.notifySurgery(id, CHANGED_MESSAGE);
    return surgery;
  }
}
