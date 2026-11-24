
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LinkStatus, Prisma, Role } from '@prisma/client';
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

const MINUTE_MS = 60_000;

const OVERDUE_NOTIFICATION_MESSAGE =
  'Giai đoạn hiện tại đang kéo dài hơn dự kiến. ' +
  'Nhân viên y tế sẽ cập nhật thông tin khi có thay đổi. ' +
  'Mong quý khách thông cảm.';

// Thông tin thời gian dự kiến của giai đoạn hiện tại.
type SurgeryTiming = {
  stageStartedAt: Date | null;
  effectiveExpectedMinutes: number | null;
  expectedFinishAt: Date | null;
  isOverdue: boolean;
  overdueMinutes: number;
};

// Trạng thái thông báo quá giờ của giai đoạn hiện tại.
type OverdueNotificationState = {
  overdueNotificationSent: boolean;
  overdueNotificationRecipientCount: number;
  overdueNotificationPendingCount: number;
  overdueNotificationTotalRecipients: number;
};

type SurgeryWithTiming = SurgeryWithRelations & SurgeryTiming;

type SurgeryWithDetails =
  SurgeryWithTiming & OverdueNotificationState;

@Injectable()
export class SurgeriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly statuses: StatusesService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  // Xác định trạng thái cuối từ danh mục đang hoạt động.
  private async getFinalSortOrder(): Promise<number | null> {
    const statuses = await this.statuses.list();

    return statuses.length > 0
      ? Math.max(...statuses.map((status) => status.sortOrder))
      : null;
  }

  // Lấy lịch sử của lần vào giai đoạn hiện tại.
  private getCurrentStageHistory(surgery: SurgeryWithRelations) {
    const latestHistory = surgery.history[0];

    if (
      !latestHistory ||
      latestHistory.statusId !== surgery.currentStatusId
    ) {
      return null;
    }

    return latestHistory;
  }

  // Tính thời gian dự kiến và cảnh báo quá giờ.
  private calculateTiming(
    surgery: SurgeryWithRelations,
    finalSortOrder: number | null,
    now: number,
  ): SurgeryTiming {
    const emptyTiming: SurgeryTiming = {
      stageStartedAt: null,
      effectiveExpectedMinutes: null,
      expectedFinishAt: null,
      isOverdue: false,
      overdueMinutes: 0,
    };

    // Không cảnh báo ca đã hủy hoặc đã hoàn tất.
    if (
      surgery.cancelledAt ||
      finalSortOrder === null ||
      surgery.currentStatus.sortOrder >= finalSortOrder
    ) {
      return emptyTiming;
    }

    const latestHistory = this.getCurrentStageHistory(surgery);

    if (!latestHistory) {
      return emptyTiming;
    }

    const stageStartedAt = latestHistory.changedAt;

    // Ưu tiên thời gian riêng của Staff.
    // Nếu không có thì dùng mặc định của Admin.
    const effectiveExpectedMinutes =
      surgery.expectedMinutes ??
      surgery.currentStatus.expectedMinutes ??
      null;

    // Chưa thiết lập thời gian dự kiến.
    if (
      effectiveExpectedMinutes === null ||
      !Number.isSafeInteger(effectiveExpectedMinutes) ||
      effectiveExpectedMinutes <= 0
    ) {
      return {
        ...emptyTiming,
        stageStartedAt,
      };
    }

    const expectedFinishAt = new Date(
      stageStartedAt.getTime() +
        effectiveExpectedMinutes * MINUTE_MS,
    );

    if (!Number.isFinite(expectedFinishAt.getTime())) {
      return {
        ...emptyTiming,
        stageStartedAt,
      };
    }

    const overdueMs = now - expectedFinishAt.getTime();

    const isOverdue = overdueMs > 0;

    const overdueMinutes = isOverdue
      ? Math.floor(overdueMs / MINUTE_MS)
      : 0;

    return {
      stageStartedAt,
      effectiveExpectedMinutes,
      expectedFinishAt,
      isOverdue,
      overdueMinutes,
    };
  }

  // Kiểm tra thông báo quá giờ đã được tạo cho những
  // người nhà đang có liên kết ACTIVE hay chưa.
  private async getOverdueNotificationState(
    surgery: SurgeryWithRelations,
  ): Promise<OverdueNotificationState> {
    const emptyState: OverdueNotificationState = {
      overdueNotificationSent: false,
      overdueNotificationRecipientCount: 0,
      overdueNotificationPendingCount: 0,
      overdueNotificationTotalRecipients: 0,
    };

    const latestHistory = this.getCurrentStageHistory(surgery);

    if (!latestHistory || surgery.cancelledAt) {
      return emptyState;
    }

    const links = await this.prisma.familyLink.findMany({
      where: {
        surgeryId: surgery.id,
        status: LinkStatus.ACTIVE,
      },
      select: {
        userId: true,
      },
    });

    if (links.length === 0) {
      return emptyState;
    }

    const userIds = links.map((link) => link.userId);

    const recipientCount = await this.prisma.notification.count({
      where: {
        surgeryId: surgery.id,
        overdueStageHistoryId: latestHistory.id,
        userId: {
          in: userIds,
        },
      },
    });

    const totalRecipients = userIds.length;

    const pendingCount = Math.max(
      0,
      totalRecipients - recipientCount,
    );

    return {
      overdueNotificationSent:
        totalRecipients > 0 && pendingCount === 0,
      overdueNotificationRecipientCount: recipientCount,
      overdueNotificationPendingCount: pendingCount,
      overdueNotificationTotalRecipients: totalRecipients,
    };
  }

  // Đọc dữ liệu gốc của ca phẫu thuật.
  private async findSurgery(
    id: string,
  ): Promise<SurgeryWithRelations> {
    const surgery = await this.prisma.surgery.findUnique({
      where: { id },
      include: SURGERY_INCLUDE,
    });

    if (!surgery) {
      throw new NotFoundException(
        'Không tìm thấy ca phẫu thuật',
      );
    }

    return surgery;
  }

  // Tạo ca ở trạng thái đầu tiên và ghi bản lịch sử đầu tiên
  // trong cùng giao dịch.
  async create(
    dto: CreateSurgeryDto,
    user: AuthUser,
  ): Promise<SurgeryWithRelations> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy bệnh nhân');
    }

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

      // Đọc lại sau khi đã tạo lịch sử đầu tiên.
      return tx.surgery.findUniqueOrThrow({
        where: { id: created.id },
        include: SURGERY_INCLUDE,
      });
    });

    await this.audit.log({
      userId: user.id,
      action: 'CREATE',
      entityType: 'surgery',
      entityId: surgery.id,
    });

    return surgery;
  }

  // Danh sách ca phẫu thuật kèm thông tin quá giờ.
  async list(
    query: ListSurgeriesDto,
  ): Promise<SurgeryWithTiming[]> {
    const where: Prisma.SurgeryWhereInput = {
      ...(query.date ? { scheduledAt: dayRange(query.date) } : {}),
      ...(query.roomId ? { roomId: query.roomId } : {}),
      ...(query.status
        ? { currentStatus: { code: query.status } }
        : {}),
    };

    const [surgeries, finalSortOrder] = await Promise.all([
      this.prisma.surgery.findMany({
        where,
        include: SURGERY_INCLUDE,
        orderBy: { scheduledAt: 'asc' },
      }),
      this.getFinalSortOrder(),
    ]);

    // Sử dụng cùng một thời điểm để tính cho tất cả ca.
    const now = Date.now();

    return surgeries.map((surgery) => ({
      ...surgery,
      ...this.calculateTiming(
        surgery,
        finalSortOrder,
        now,
      ),
    }));
  }

  // Chi tiết ca phẫu thuật kèm thông tin thời gian dự kiến
  // và trạng thái gửi thông báo quá giờ.
  async findOne(id: string): Promise<SurgeryWithDetails> {
    const surgery = await this.findSurgery(id);

    const [finalSortOrder, notificationState] =
      await Promise.all([
        this.getFinalSortOrder(),
        this.getOverdueNotificationState(surgery),
      ]);

    return {
      ...surgery,
      ...this.calculateTiming(
        surgery,
        finalSortOrder,
        Date.now(),
      ),
      ...notificationState,
    };
  }

  // Nhân viên chủ động gửi thông báo khi ca quá giờ.
  // Không tự động gửi và không thay đổi trạng thái ca.
  async sendOverdueNotification(
    id: string,
    user: AuthUser,
  ): Promise<{
    success: boolean;
    recipientCount: number;
    message: string;
  }> {
    // Chỉ nhân viên y tế được phép gửi thông báo.
    if (user.role !== Role.STAFF) {
      throw new ForbiddenException(
        'Chỉ nhân viên y tế được gửi thông báo quá giờ',
      );
    }

    const surgery = await this.findSurgery(id);

    if (surgery.cancelledAt) {
      throw new ConflictException(
        'Ca đã bị hủy, không thể gửi thông báo quá giờ',
      );
    }

    const finalSortOrder = await this.getFinalSortOrder();

    if (finalSortOrder === null) {
      throw new ConflictException(
        'Chưa cấu hình danh mục trạng thái',
      );
    }

    if (surgery.currentStatus.sortOrder >= finalSortOrder) {
      throw new ConflictException(
        'Ca đã hoàn tất, không thể gửi thông báo quá giờ',
      );
    }

    // Kiểm tra lại thời gian tại Backend.
    const timing = this.calculateTiming(
      surgery,
      finalSortOrder,
      Date.now(),
    );

    if (!timing.expectedFinishAt) {
      throw new ConflictException(
        'Giai đoạn hiện tại chưa có thời gian hoàn thành dự kiến hợp lệ',
      );
    }

    if (!timing.isOverdue) {
      throw new ConflictException(
        'Ca chưa vượt quá thời gian dự kiến',
      );
    }

    // ID lịch sử đại diện cho lần vào giai đoạn hiện tại.
    const latestHistory = this.getCurrentStageHistory(surgery);

    if (!latestHistory) {
      throw new ConflictException(
        'Không tìm thấy lịch sử của giai đoạn hiện tại',
      );
    }

    const notificationState =
      await this.getOverdueNotificationState(surgery);

    if (
      notificationState.overdueNotificationTotalRecipients === 0
    ) {
      throw new ConflictException(
        'Ca phẫu thuật chưa có người nhà được theo dõi',
      );
    }

    if (notificationState.overdueNotificationSent) {
      throw new ConflictException(
        'Thông báo quá giờ của giai đoạn này đã được gửi cho người nhà',
      );
    }

    // Kiểm tra lại dữ liệu ca trước khi tạo thông báo.
    const current = await this.findSurgery(id);

    const currentHistory =
      this.getCurrentStageHistory(current);

    const currentFinalSortOrder =
      await this.getFinalSortOrder();

    const currentTiming = this.calculateTiming(
      current,
      currentFinalSortOrder,
      Date.now(),
    );

    if (
      current.cancelledAt ||
      !currentHistory ||
      currentHistory.id !== latestHistory.id ||
      !currentTiming.isOverdue
    ) {
      throw new ConflictException(
        'Thông tin ca phẫu thuật đã thay đổi, vui lòng tải lại và kiểm tra',
      );
    }

    // Chỉ tạo thông báo cho người nhà có liên kết ACTIVE
    // và chưa nhận thông báo quá giờ trong lần vào giai đoạn này.
    // Ràng buộc UNIQUE ở database chống gửi trùng đồng thời.
    const notifications = await this.notifications.notifySurgery(
      id,
      OVERDUE_NOTIFICATION_MESSAGE,
      'info',
      latestHistory.id,
    );

    if (notifications.length === 0) {
      const latestNotificationState =
        await this.getOverdueNotificationState(current);

      if (
        latestNotificationState.overdueNotificationTotalRecipients === 0
      ) {
        throw new ConflictException(
          'Ca phẫu thuật chưa có người nhà được theo dõi',
        );
      }

      throw new ConflictException(
        'Không có thông báo mới được tạo, vui lòng tải lại thông tin ca phẫu thuật',
      );
    }

    // Chỉ ghi nhật ký khi có thông báo mới được tạo.
    await this.audit.log({
      userId: user.id,
      action: 'SEND_OVERDUE_NOTIFICATION',
      entityType: 'surgery',
      entityId: id,
    });

    return {
      success: true,
      recipientCount: notifications.length,
      message: 'Đã tạo thông báo cho người nhà',
    };
  }

  async update(
    id: string,
    dto: UpdateSurgeryDto,
    user: AuthUser,
  ): Promise<SurgeryWithRelations> {
    const current = await this.findSurgery(id);

    if (current.cancelledAt) {
      throw new ConflictException('Ca đã bị hủy, không thể sửa');
    }

    // Không cho chỉnh sửa ca đã hoàn tất.
    if (await this.statuses.isFinal(current.currentStatus)) {
      throw new ConflictException(
        'Ca đã hoàn tất, không thể chỉnh sửa',
      );
    }

    const surgery = await this.prisma.surgery.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        roomId: dto.roomId,
        scheduledAt: dto.scheduledAt
          ? new Date(dto.scheduledAt)
          : undefined,

        // undefined: giữ nguyên.
        // null: sử dụng thời gian mặc định của Admin.
        // Số nguyên dương: thời gian riêng của ca (phút).
        expectedMinutes: dto.expectedMinutes,
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
      surgery.scheduledAt.getTime() !==
        current.scheduledAt.getTime() ||
      surgery.roomId !== current.roomId;

    if (isScheduleChanged) {
      await this.notifications.notifySurgery(
        id,
        SCHEDULE_CHANGED_MESSAGE,
      );
    }

    return surgery;
  }

  async cancel(
    id: string,
    reason: string,
    user: AuthUser,
  ): Promise<SurgeryWithRelations> {
    const current = await this.findSurgery(id);

    if (current.cancelledAt) {
      throw new ConflictException('Ca đã bị hủy');
    }

    if (await this.statuses.isFinal(current.currentStatus)) {
      throw new ConflictException(
        'Ca đã hoàn tất, không thể hủy',
      );
    }

    const surgery = await this.prisma.surgery.update({
      where: { id },
      data: {
        cancelledAt: new Date(),
        cancelReason: reason.trim(),
      },
      include: SURGERY_INCLUDE,
    });

    await this.audit.log({
      userId: user.id,
      action: 'CANCEL',
      entityType: 'surgery',
      entityId: id,
    });

    await this.notifications.notifySurgery(
      id,
      CHANGED_MESSAGE,
    );

    return surgery;
  }
}
