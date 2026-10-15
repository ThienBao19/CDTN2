import { Role } from '@prisma/client';
import { Request } from 'express';

export type AuthUser = {
  id: string;
  role: Role;
  fullName: string;
};

export type JwtPayload = {
  sub: string;
  role: Role;
  // Phiên bản token; lệch với CSDL nghĩa là phiên đã bị thu hồi
  ver: number;
};

export type AuthRequest = Request & { user?: AuthUser };
