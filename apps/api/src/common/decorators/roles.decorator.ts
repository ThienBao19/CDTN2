import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Giới hạn endpoint cho các vai trò được liệt kê (ma trận quyền mục 3.1)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
