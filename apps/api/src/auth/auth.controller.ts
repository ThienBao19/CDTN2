import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Put,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AUTH_COOKIE } from '../common/guards/jwt-auth.guard';
import { setSessionCookie } from './session-cookie';
import type { AuthUser } from '../common/types/auth-user';
import { sessionMaxAgeMs } from '../config/auth-config';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';

// Chống dò mật khẩu: mặc định 10 lần/phút cho mỗi tài khoản (test có thể nới qua env)
const LOGIN_LIMIT = {
  default: { limit: Number(process.env.LOGIN_RATE_LIMIT ?? 10), ttl: 60_000 },
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setSessionCookie(res: Response, token: string): void {
    setSessionCookie(
      res,
      this.config,
      token,
      sessionMaxAgeMs(this.config.get<string>('SESSION_HOURS')),
    );
  }

  // Đăng nhập nhân viên/quản trị. Token đặt trong cookie httpOnly; trả kèm trong body cho Postman
  @Public()
  @Throttle(LOGIN_LIMIT)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.auth.login(dto, ip);
    this.setSessionCookie(res, token);
    return { user, accessToken: token };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, { path: '/' });
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Put('password')
  @Roles(Role.STAFF, Role.ADMIN)
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.auth.changePassword(user.id, dto);
    this.setSessionCookie(res, token);
    return { accessToken: token };
  }
}
