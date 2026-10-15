import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthRequest, JwtPayload } from '../types/auth-user';

export const AUTH_COOKIE = 'pt_token';

// Header Authorization (client chủ động gửi) được ưu tiên hơn cookie do trình duyệt tự đính kèm
export function extractToken(req: AuthRequest): string | undefined {
  const [type, value] = req.headers.authorization?.split(' ') ?? [];
  if (type === 'Bearer' && value) return value;
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[AUTH_COOKIE];
}

// Guard toàn cục: mọi API đều cần đăng nhập trừ khi gắn @Public().
// Đọc lại user từ CSDL để tài khoản bị khóa/đổi vai trò có hiệu lực ngay.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    const token = extractToken(req);
    if (!token) throw new UnauthorizedException('Vui lòng đăng nhập');

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        fullName: true,
        status: true,
        tokenVersion: true,
      },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không còn hiệu lực');
    }
    if (user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException(
        'Phiên đăng nhập đã bị thu hồi, vui lòng đăng nhập lại',
      );
    }
    req.user = { id: user.id, role: user.role, fullName: user.fullName };
    return true;
  }
}
