import { Injectable, NotFoundException } from '@nestjs/common';
import { LinkStatus, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';

const LIST_LIMIT = 100;

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(user: AuthUser, surgeryId?: string) {
    const where =
      user.role === Role.FAMILY
        ? { userId: user.id, status: LinkStatus.ACTIVE }
        : { ...(surgeryId ? { surgeryId } : {}) };
    return this.prisma.familyLink.findMany({
      where,
      orderBy: { linkedAt: 'desc' },
      take: LIST_LIMIT,
      select: {
        id: true,
        surgeryId: true,
        contactName: true,
        status: true,
        linkedAt: true,
        revokedAt: true,
        user: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }

  // FR-13: người nhà tự ngừng theo dõi; nhân viên/quản trị gỡ người nhà khỏi ca
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
