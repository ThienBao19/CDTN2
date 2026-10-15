import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditEntry = {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
};

// Nhật ký truy cập (FR-11): chỉ thêm mới. Lỗi ghi log không làm hỏng request.
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({ data: entry });
    } catch (error) {
      this.logger.error(
        `Không ghi được audit log ${entry.action} ${entry.entityType}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
