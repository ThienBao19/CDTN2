import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../common/types/auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export type PublicUser = Pick<
  User,
  'id' | 'fullName' | 'email' | 'phone' | 'role'
>;

const INVALID_LOGIN = 'Sai email/số điện thoại hoặc mật khẩu';

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
}

export function normalizeIdentifier(identifier: string) {
  const value = identifier.trim().toLowerCase();
  return value.includes('@') ? { email: value } : { phone: value };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  private sign(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      ver: user.tokenVersion,
    };
    return this.jwt.signAsync(payload);
  }

  // Đăng ký công khai chỉ tạo tài khoản người nhà; nhân viên do quản trị tạo
  async register(dto: RegisterDto): Promise<PublicUser> {
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim();
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
      },
    });
    if (existing) {
      throw new ConflictException('Email hoặc số điện thoại đã được sử dụng');
    }
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        phone,
        passwordHash: await argon2.hash(dto.password),
        role: Role.FAMILY,
      },
    });
    return toPublicUser(user);
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
  ): Promise<{ user: PublicUser; token: string }> {
    const user = await this.prisma.user.findFirst({
      where: normalizeIdentifier(dto.identifier),
    });
    const isValid =
      user !== null && (await argon2.verify(user.passwordHash, dto.password));
    // NFR-10: ghi lại cả đăng nhập sai để phát hiện dò mật khẩu
    await this.audit.log({
      userId: user?.id,
      action: isValid ? 'LOGIN' : 'LOGIN_FAILED',
      entityType: 'user',
      entityId: user?.id,
      ipAddress,
    });
    if (!user || !isValid) throw new UnauthorizedException(INVALID_LOGIN);
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }
    return { user: toPublicUser(user), token: await this.sign(user) };
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    return toPublicUser(user);
  }

  // Đổi mật khẩu thu hồi mọi phiên cũ; trả token mới để phiên hiện tại tiếp tục
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    const isValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!isValid)
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await argon2.hash(dto.newPassword),
        tokenVersion: { increment: 1 },
      },
    });
    await this.audit.log({
      userId,
      action: 'CHANGE_PASSWORD',
      entityType: 'user',
      entityId: userId,
    });
    return this.sign(updated);
  }
}
