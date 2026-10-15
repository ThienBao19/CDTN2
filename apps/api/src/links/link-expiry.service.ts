import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { LinkStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StatusesService } from '../statuses/statuses.service';

const HOUR_MS = 60 * 60 * 1000;
export const LINK_RETENTION_HOURS = 24;
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

// Mục 7: liên kết hết hiệu lực sau khi ca kết thúc (hoàn tất hoặc bị hủy).
// Giữ thêm 24 giờ để người nhà kịp xem kết quả rồi tự thu hồi.
@Injectable()
export class LinkExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LinkExpiryService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly statuses: StatusesService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.safeSweep(), SWEEP_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.timer);
  }

  private async safeSweep(): Promise<void> {
    try {
      const count = await this.expireFinishedLinks(new Date());
      if (count > 0)
        this.logger.log(`Đã thu hồi ${count} liên kết của ca đã kết thúc`);
    } catch (error) {
      this.logger.error(
        'Lỗi thu hồi liên kết',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async expireFinishedLinks(now: Date): Promise<number> {
    const cutoff = new Date(now.getTime() - LINK_RETENTION_HOURS * HOUR_MS);
    const statuses = await this.statuses.list();
    const finalStatus = statuses[statuses.length - 1];
    const { count } = await this.prisma.familyLink.updateMany({
      where: {
        status: LinkStatus.ACTIVE,
        surgery: {
          OR: [
            { cancelledAt: { lte: cutoff } },
            ...(finalStatus
              ? [
                  {
                    currentStatusId: finalStatus.id,
                    updatedAt: { lte: cutoff },
                  },
                ]
              : []),
          ],
        },
      },
      data: { status: LinkStatus.REVOKED, revokedAt: now },
    });
    return count;
  }
}
