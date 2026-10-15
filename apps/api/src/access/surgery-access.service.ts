import { Injectable, NotFoundException } from '@nestjs/common';
import { LinkStatus, Role } from '@prisma/client';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';

// Người nhà chỉ xem được ca có liên kết còn hiệu lực (BR-03, BR-05).
// Trả 404 thay vì 403 để không lộ việc ca có tồn tại hay không (TC-06).
@Injectable()
export class SurgeryAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async hasActiveLink(userId: string, surgeryId: string): Promise<boolean> {
    const link = await this.prisma.familyLink.findFirst({
      where: { userId, surgeryId, status: LinkStatus.ACTIVE },
      select: { id: true },
    });
    return link !== null;
  }

  async assertCanView(user: AuthUser, surgeryId: string): Promise<void> {
    if (user.role !== Role.FAMILY) return;
    if (!(await this.hasActiveLink(user.id, surgeryId))) {
      throw new NotFoundException('Không tìm thấy ca phẫu thuật');
    }
  }
}
