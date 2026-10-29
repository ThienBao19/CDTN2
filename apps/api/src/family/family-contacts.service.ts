import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { LinkStatus, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { StatusesService } from '../statuses/statuses.service';
import { SurgeriesService } from '../surgeries/surgeries.service';
import { AddFamilyContactDto } from './dto/add-family-contact.dto';
import { normalizePhone } from './identity';

@Injectable()
export class FamilyContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly surgeries: SurgeriesService,
    private readonly statuses: StatusesService,
    private readonly audit: AuditService,
  ) {}

  // Nhân viên đăng ký người nhà được theo dõi ca (thay cho cấp mã/QR)
  async add(surgeryId: string, dto: AddFamilyContactDto, staff: AuthUser) {
    const phone = normalizePhone(dto.phone);
    if (!phone)
      throw new BadRequestException('Số điện thoại gồm 10 số, bắt đầu bằng 0');
    const surgery = await this.surgeries.findOne(surgeryId);
    if (surgery.cancelledAt) throw new ConflictException('Ca đã bị hủy');
    if (await this.statuses.isFinal(surgery.currentStatus)) {
      throw new ConflictException(
        'Ca đã kết thúc, không thể đăng ký thêm người nhà',
      );
    }
    const contactName = dto.fullName.trim().replace(/\s+/g, ' ');

    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing && existing.role !== Role.FAMILY) {
      throw new ConflictException(
        'Số điện thoại này thuộc tài khoản nhân viên',
      );
    }
    const user =
      existing ??
      (await this.prisma.user.create({
        data: { fullName: contactName, phone, role: Role.FAMILY },
      }));

    const link = await this.prisma.familyLink.upsert({
      where: { userId_surgeryId: { userId: user.id, surgeryId } },
      create: { userId: user.id, surgeryId, contactName, addedById: staff.id },
      update: {
        contactName,
        addedById: staff.id,
        status: LinkStatus.ACTIVE,
        linkedAt: new Date(),
        revokedAt: null,
      },
    });
    await this.audit.log({
      userId: staff.id,
      action: 'ADD_FAMILY',
      entityType: 'family_link',
      entityId: link.id,
    });
    return {
      id: link.id,
      phone,
      fullName: contactName,
      status: link.status,
      linkedAt: link.linkedAt,
    };
  }

  async list(surgeryId: string) {
    await this.surgeries.findOne(surgeryId);
    const links = await this.prisma.familyLink.findMany({
      where: { surgeryId },
      orderBy: { linkedAt: 'desc' },
      include: {
        user: { select: { phone: true, fullName: true } },
        addedBy: { select: { fullName: true } },
      },
    });
    return links.map((l) => ({
      id: l.id,
      phone: l.user.phone,
      fullName: l.contactName ?? l.user.fullName,
      status: l.status,
      linkedAt: l.linkedAt,
      addedBy: l.addedBy?.fullName ?? null,
    }));
  }
}
