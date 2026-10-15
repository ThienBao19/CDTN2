import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthRequest, JwtPayload } from '../types/auth-user';
import { extractToken } from './jwt-auth.guard';

const LOGIN_PATH = /\/auth\/login\/?$/;

export type VerifyToken = (token: string) => JwtPayload | null;

// Khóa đếm rate limit không phụ thuộc IP (sau proxy, IP có thể bị giả qua X-Forwarded-For):
// - đăng nhập: theo tài khoản bị thử -> chống dò mật khẩu dù đổi IP
// - token hợp lệ: theo người dùng -> nhiều người sau cùng một proxy không bị dồn chung
// - còn lại (kể cả token giả): theo IP, để không né được giới hạn bằng token ngẫu nhiên
export function throttleKey(req: AuthRequest, verify: VerifyToken): string {
  const body = req.body as { identifier?: unknown } | undefined;
  if (LOGIN_PATH.test(req.path) && typeof body?.identifier === 'string') {
    return `login:${body.identifier.trim().toLowerCase()}`;
  }
  const token = extractToken(req);
  const payload = token ? verify(token) : null;
  if (payload) return `user:${payload.sub}`;
  return `ip:${req.ip ?? 'unknown'}`;
}

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  private readonly jwt = new JwtService({ secret: process.env.JWT_SECRET });

  private readonly verify: VerifyToken = (token) => {
    try {
      return this.jwt.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  };

  protected getTracker(req: Record<string, unknown>): Promise<string> {
    return Promise.resolve(
      throttleKey(req as unknown as AuthRequest, this.verify),
    );
  }
}
