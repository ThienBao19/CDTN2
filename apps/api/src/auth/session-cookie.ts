import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AUTH_COOKIE } from '../common/guards/jwt-auth.guard';
import { isCookieSecure } from '../config/auth-config';

// Đặt cookie phiên httpOnly dùng chung cho nhân viên và người nhà
export function setSessionCookie(
  res: Response,
  config: ConfigService,
  token: string,
  maxAgeMs: number,
): void {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    // Lax: cookie vẫn được gửi khi mở app từ màn hình chính hoặc bấm vào thông báo;
    // vẫn chặn POST từ trang khác (chống CSRF)
    sameSite: 'lax',
    secure: isCookieSecure(
      config.get<string>('COOKIE_SECURE'),
      config.get<string>('NODE_ENV'),
    ),
    maxAge: maxAgeMs,
    path: '/',
  });
}
