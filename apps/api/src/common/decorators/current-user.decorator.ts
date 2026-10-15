import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest, AuthUser } from '../types/auth-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    if (!req.user) {
      throw new Error('CurrentUser dùng trên endpoint chưa qua JwtAuthGuard');
    }
    return req.user;
  },
);
