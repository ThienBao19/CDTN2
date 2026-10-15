import { Injectable, Logger } from '@nestjs/common';
import { DeliveryStatus, LinkStatus, Notification } from '@prisma/client';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import { PushProvider, PushResult } from '../push/push-provider';
import { realSleep, Sleep, withRetry } from './retry';

export const NOTIFICATION_TITLE = 'Cập nhật ca phẫu thuật';
export const SCHEDULE_CHANGED_MESSAGE =
  'Lịch phẫu thuật có thay đổi, vui lòng mở ứng dụng để xem.';
export const CHANGED_MESSAGE =
  'Ca phẫu thuật có thay đổi, vui lòng mở ứng dụng để xem.';
const RETRY_DELAYS_MS = [1000, 3000];

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private sleep: Sleep = realSleep;

  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushProvider,
    private readonly events: EventsService,
  ) {}

  // Cho phép test thay hàm chờ để không phải đợi thật
  useSleep(sleep: Sleep): void {
    this.sleep = sleep;
  }

  // BR-05: chỉ gửi cho người nhà có liên kết còn hiệu lực.
  // Nội dung không có tên hay thông tin y tế (mục 7: thông báo kín đáo).
  async notifySurgery(
    surgeryId: string,
    content: string,
  ): Promise<Notification[]> {
    this.events.emit({ type: 'surgery.updated', surgeryId });
    const links = await this.prisma.familyLink.findMany({
      where: { surgeryId, status: LinkStatus.ACTIVE },
      select: { userId: true },
    });
    if (links.length === 0) return [];

    const created = await this.prisma.notification.createManyAndReturn({
      data: links.map((l) => ({ userId: l.userId, surgeryId, content })),
    });
    created.forEach((n) =>
      this.events.emit({
        type: 'notification.created',
        userId: n.userId,
        surgeryId,
      }),
    );
    // Gửi push nền để không làm chậm thao tác của nhân viên
    void Promise.all(created.map((n) => this.deliver(n))).catch(
      (error: unknown) =>
        this.logger.error(
          'Lỗi gửi thông báo',
          error instanceof Error ? error.stack : error,
        ),
    );
    return created;
  }

  async deliver(notification: Notification): Promise<DeliveryStatus> {
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId: notification.userId },
      select: { token: true },
    });
    if (!this.push.isEnabled() || devices.length === 0) {
      return this.finish(notification.id, DeliveryStatus.SKIPPED, 0, null);
    }

    const message = {
      title: NOTIFICATION_TITLE,
      body: notification.content,
      data: {
        surgeryId: notification.surgeryId,
        url: `/theo-doi/${notification.surgeryId}`,
      },
    };
    let tokens = devices.map((d) => d.token);
    const { result, attempts } = await withRetry<PushResult>(
      async () => {
        const res = await this.safeSend(tokens, message);
        await this.removeInvalid(res.invalidTokens);
        tokens = tokens.filter((t) => !res.invalidTokens.includes(t));
        return res;
      },
      (res) =>
        res.successCount === 0 && res.errors.length > 0 && tokens.length > 0,
      RETRY_DELAYS_MS,
      this.sleep,
    );
    const isSent = result.successCount > 0;
    return this.finish(
      notification.id,
      isSent ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
      attempts,
      isSent ? null : result.errors.join(', ') || 'Không còn thiết bị hợp lệ',
    );
  }

  private async safeSend(
    tokens: string[],
    message: Parameters<PushProvider['send']>[1],
  ) {
    try {
      return await this.push.send(tokens, message);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return { successCount: 0, invalidTokens: [], errors: [reason] };
    }
  }

  private async removeInvalid(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.prisma.deviceToken.deleteMany({
      where: { token: { in: tokens } },
    });
  }

  private async finish(
    id: string,
    status: DeliveryStatus,
    attempts: number,
    lastError: string | null,
  ): Promise<DeliveryStatus> {
    await this.prisma.notification.update({
      where: { id },
      data: {
        status,
        attempts,
        lastError,
        sentAt: status === DeliveryStatus.SENT ? new Date() : null,
      },
    });
    return status;
  }
}
