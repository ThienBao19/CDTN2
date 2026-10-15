import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, TrackingCodeStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { StatusesService } from '../statuses/statuses.service';
import { SurgeriesService } from '../surgeries/surgeries.service';
import { generateCode, hashCode } from './tracking-code.util';

const DEFAULT_TTL_HOURS = 24;
const HOUR_MS = 60 * 60 * 1000;
const MAX_INSERT_RETRIES = 3;

export type IssuedCode = {
  id: string;
  surgeryId: string;
  code: string;
  expiresAt: Date;
};

export type CodeView = {
  id: string;
  status: TrackingCodeStatus | 'EXPIRED';
  expiresAt: Date;
  createdAt: Date;
  createdBy: string;
};

export function effectiveStatus(
  status: TrackingCodeStatus,
  expiresAt: Date,
  now: Date,
): CodeView['status'] {
  return status === TrackingCodeStatus.PENDING && expiresAt <= now
    ? 'EXPIRED'
    : status;
}

@Injectable()
export class TrackingCodesService {
  private readonly secret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly surgeries: SurgeriesService,
    private readonly statuses: StatusesService,
    private readonly audit: AuditService,
    config: ConfigService,
  ) {
    this.secret = config.getOrThrow<string>('TRACKING_CODE_SECRET');
  }

  hash(code: string): string {
    return hashCode(code, this.secret);
  }

  // UC-01: mã gốc chỉ trả về một lần, CSDL chỉ giữ bản băm
  async issue(
    surgeryId: string,
    ttlHours: number | undefined,
    user: AuthUser,
  ): Promise<IssuedCode> {
    const surgery = await this.surgeries.findOne(surgeryId);
    if (surgery.cancelledAt) throw new ConflictException('Ca đã bị hủy');
    if (await this.statuses.isFinal(surgery.currentStatus)) {
      throw new ConflictException('Ca đã kết thúc, không thể tạo mã mới');
    }
    const expiresAt = new Date(
      Date.now() + (ttlHours ?? DEFAULT_TTL_HOURS) * HOUR_MS,
    );

    for (let attempt = 1; attempt <= MAX_INSERT_RETRIES; attempt += 1) {
      const code = generateCode();
      try {
        const saved = await this.prisma.trackingCode.create({
          data: {
            surgeryId,
            codeHash: this.hash(code),
            expiresAt,
            createdById: user.id,
          },
        });
        await this.audit.log({
          userId: user.id,
          action: 'ISSUE_CODE',
          entityType: 'tracking_code',
          entityId: saved.id,
        });
        return { id: saved.id, surgeryId, code, expiresAt };
      } catch (error) {
        const isDuplicate =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002';
        if (!isDuplicate || attempt === MAX_INSERT_RETRIES) throw error;
      }
    }
    throw new ConflictException('Không tạo được mã, vui lòng thử lại');
  }

  async listForSurgery(surgeryId: string): Promise<CodeView[]> {
    await this.surgeries.findOne(surgeryId);
    const codes = await this.prisma.trackingCode.findMany({
      where: { surgeryId },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { fullName: true } } },
    });
    const now = new Date();
    return codes.map((c) => ({
      id: c.id,
      status: effectiveStatus(c.status, c.expiresAt, now),
      expiresAt: c.expiresAt,
      createdAt: c.createdAt,
      createdBy: c.createdBy.fullName,
    }));
  }

  async revoke(id: string, user: AuthUser): Promise<void> {
    const code = await this.prisma.trackingCode.findUnique({ where: { id } });
    if (!code) throw new NotFoundException('Không tìm thấy mã theo dõi');
    if (code.status !== TrackingCodeStatus.PENDING) {
      throw new ConflictException(
        'Mã đã được sử dụng hoặc đã thu hồi; hãy hủy liên kết nếu cần',
      );
    }
    await this.prisma.trackingCode.update({
      where: { id },
      data: { status: TrackingCodeStatus.REVOKED, revokedAt: new Date() },
    });
    await this.audit.log({
      userId: user.id,
      action: 'REVOKE_CODE',
      entityType: 'tracking_code',
      entityId: id,
    });
  }
}
