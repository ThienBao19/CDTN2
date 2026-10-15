import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuditService } from '../audit/audit.service';
import { PublicUser, toPublicUser } from '../auth/auth.service';
import { AuthUser } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const LIST_LIMIT = 200;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: ListUsersDto) {
    const q = query.q?.trim();
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    };
    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: LIST_LIMIT,
    });
    return users.map((u) => ({
      ...toPublicUser(u),
      status: u.status,
      createdAt: u.createdAt,
    }));
  }

  async create(dto: CreateUserDto, admin: AuthUser): Promise<PublicUser> {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email }, ...(dto.phone ? [{ phone: dto.phone }] : [])] },
    });
    if (exists)
      throw new ConflictException('Email hoặc số điện thoại đã được sử dụng');
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        phone: dto.phone,
        role: dto.role,
        passwordHash: await argon2.hash(dto.password),
      },
    });
    await this.audit.log({
      userId: admin.id,
      action: 'CREATE',
      entityType: 'user',
      entityId: user.id,
    });
    return toPublicUser(user);
  }

  async update(id: string, dto: UpdateUserDto, admin: AuthUser) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    const isSelf = id === admin.id;
    const isDemoting = dto.role !== undefined && dto.role !== Role.ADMIN;
    if (isSelf && (isDemoting || dto.status === UserStatus.LOCKED)) {
      throw new BadRequestException(
        'Không thể tự khóa hoặc tự hạ quyền tài khoản của mình',
      );
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName?.trim(),
        role: dto.role,
        status: dto.status,
        // Khóa hoặc đổi vai trò thì thu hồi các phiên đang mở
        ...(dto.status === UserStatus.LOCKED ||
        (dto.role !== undefined && dto.role !== user.role)
          ? { tokenVersion: { increment: 1 } }
          : {}),
      },
    });
    const action = dto.status === UserStatus.LOCKED ? 'LOCK' : 'UPDATE';
    await this.audit.log({
      userId: admin.id,
      action,
      entityType: 'user',
      entityId: id,
    });
    return { ...toPublicUser(updated), status: updated.status };
  }
}
