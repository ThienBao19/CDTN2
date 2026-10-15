import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LinkStatus, Role, TrackingCodeStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeCode } from '../tracking-codes/tracking-code.util';
import { TrackingCodesService } from '../tracking-codes/tracking-codes.service';
import { AttemptLimiter } from './attempt-limiter';

const MINUTE_MS = 60_000;
export const LINK_LIMITER_OPTIONS = {
  maxFailures: 5,
  windowMs: 15 * MINUTE_MS,
  lockMs: 15 * MINUTE_MS,
};
const ADMIN_LIST_LIMIT = 100;

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codes: TrackingCodesService,
    private readonly audit: AuditService,
    private readonly limiter: AttemptLimiter,
  ) {}

  private fail(userId: string, message: string): never {
    this.limiter.recordFailure(userId, Date.now());
    throw new BadRequestException(message);
  }

  // UC-02: liên kết người nhà với ca bằng mã/QR
  async link(
    user: AuthUser,
    input: string,
  ): Promise<{ id: string; surgeryId: string }> {
    const lockedMs = this.limiter.lockedFor(user.id, Date.now());
    if (lockedMs > 0) {
      const minutes = Math.ceil(lockedMs / MINUTE_MS);
      throw new HttpException(
        `Bạn đã nhập sai quá nhiều lần, vui lòng thử lại sau ${minutes} phút`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = normalizeCode(input);
    if (!code) this.fail(user.id, 'Mã theo dõi không đúng');
    const found = await this.prisma.trackingCode.findUnique({
      where: { codeHash: this.codes.hash(code) },
      include: { surgery: true },
    });
    if (!found) this.fail(user.id, 'Mã theo dõi không đúng');
    if (
      found.status !== TrackingCodeStatus.PENDING ||
      found.surgery.cancelledAt
    ) {
      this.fail(user.id, 'Mã theo dõi không còn hiệu lực');
    }
    if (found.expiresAt <= new Date()) {
      this.fail(user.id, 'Mã theo dõi đã hết hạn');
    }

    const existing = await this.prisma.familyLink.findUnique({
      where: {
        userId_surgeryId: { userId: user.id, surgeryId: found.surgeryId },
      },
    });
    if (existing?.status === LinkStatus.ACTIVE) {
      throw new ConflictException('Bạn đã theo dõi ca này');
    }

    const link = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.trackingCode.updateMany({
        where: { id: found.id, status: TrackingCodeStatus.PENDING },
        data: { status: TrackingCodeStatus.USED },
      });
      if (count === 0) {
        throw new BadRequestException('Mã theo dõi không còn hiệu lực');
      }
      return tx.familyLink.upsert({
        where: {
          userId_surgeryId: { userId: user.id, surgeryId: found.surgeryId },
        },
        create: {
          userId: user.id,
          surgeryId: found.surgeryId,
          codeId: found.id,
        },
        update: {
          codeId: found.id,
          status: LinkStatus.ACTIVE,
          linkedAt: new Date(),
          revokedAt: null,
        },
      });
    });

    this.limiter.reset(user.id);
    await this.audit.log({
      userId: user.id,
      action: 'LINK',
      entityType: 'surgery',
      entityId: link.surgeryId,
    });
    return { id: link.id, surgeryId: link.surgeryId };
  }

  list(user: AuthUser, surgeryId?: string) {
    const where =
      user.role === Role.FAMILY
        ? { userId: user.id, status: LinkStatus.ACTIVE }
        : { ...(surgeryId ? { surgeryId } : {}) };
    return this.prisma.familyLink.findMany({
      where,
      orderBy: { linkedAt: 'desc' },
      take: ADMIN_LIST_LIMIT,
      select: {
        id: true,
        surgeryId: true,
        status: true,
        linkedAt: true,
        revokedAt: true,
        user: { select: { id: true, fullName: true } },
      },
    });
  }

  // FR-13: người nhà tự hủy liên kết của mình, quản trị viên hủy bất kỳ
  async revoke(user: AuthUser, id: string): Promise<void> {
    const link = await this.prisma.familyLink.findUnique({ where: { id } });
    const isOwner = link?.userId === user.id;
    if (!link || (user.role === Role.FAMILY && !isOwner)) {
      throw new NotFoundException('Không tìm thấy liên kết');
    }
    if (link.status === LinkStatus.REVOKED) return;
    await this.prisma.familyLink.update({
      where: { id },
      data: { status: LinkStatus.REVOKED, revokedAt: new Date() },
    });
    await this.audit.log({
      userId: user.id,
      action: 'UNLINK',
      entityType: 'family_link',
      entityId: id,
    });
  }
}
