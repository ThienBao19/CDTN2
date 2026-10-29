import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LinkStatus, Role, UserStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/types/auth-user';
import { AttemptLimiter } from '../links/attempt-limiter';
import { PrismaService } from '../prisma/prisma.service';
import { FamilyAccessDto } from './dto/family-access.dto';
import { normalizeName, normalizePhone } from './identity';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
// Phiên người nhà dài; guard còn chặn ngay khi không còn liên kết hiệu lực (ca kết thúc)
export const FAMILY_SESSION_MS = 7 * DAY_MS;
const NOT_MATCHED =
  'Thông tin chưa khớp với đăng ký của bệnh viện. Vui lòng kiểm tra lại hoặc hỏi nhân viên y tế.';

@Injectable()
export class FamilyAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly limiter: AttemptLimiter,
  ) {}

  // Khớp SĐT + họ tên người nhà + tên bệnh nhân với đăng ký của nhân viên → cấp phiên
  async access(dto: FamilyAccessDto, ipAddress?: string) {
    const phone = normalizePhone(dto.phone);
    const key = `family:${phone ?? dto.phone.trim()}`;
    const lockedMs = this.limiter.lockedFor(key, Date.now());
    if (lockedMs > 0) {
      const minutes = Math.ceil(lockedMs / MINUTE_MS);
      throw new HttpException(
        `Bạn đã nhập sai quá nhiều lần, vui lòng thử lại sau ${minutes} phút`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = phone
      ? await this.prisma.user.findUnique({
          where: { phone },
          include: {
            familyLinks: {
              where: { status: LinkStatus.ACTIVE },
              include: {
                surgery: {
                  include: { patient: { select: { fullName: true } } },
                },
              },
            },
          },
        })
      : null;
    const fullName = normalizeName(dto.fullName);
    const patientName = normalizeName(dto.patientName);
    const isMatched =
      user?.role === Role.FAMILY &&
      user.status === UserStatus.ACTIVE &&
      user.familyLinks.some(
        (l) =>
          normalizeName(l.contactName ?? user.fullName) === fullName &&
          normalizeName(l.surgery.patient.fullName) === patientName,
      );

    await this.audit.log({
      userId: user?.id,
      action: isMatched ? 'FAMILY_ACCESS' : 'FAMILY_ACCESS_FAILED',
      entityType: 'user',
      entityId: user?.id,
      ipAddress,
    });
    if (!user || !isMatched) {
      this.limiter.recordFailure(key, Date.now());
      throw new UnauthorizedException(NOT_MATCHED);
    }
    this.limiter.reset(key);
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      ver: user.tokenVersion,
    };
    const token = await this.jwt.signAsync(payload, {
      expiresIn: FAMILY_SESSION_MS / 1000,
    });
    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
      token,
    };
  }
}
