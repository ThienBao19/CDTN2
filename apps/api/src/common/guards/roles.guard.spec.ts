import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function contextFor(role: Role | undefined): ExecutionContext {
  const user = role ? { id: 'u1', role, fullName: 'Test' } : undefined;
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  afterEach(() => jest.restoreAllMocks());

  it('allows any authenticated user when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contextFor(Role.FAMILY))).toBe(true);
  });

  it('allows a user whose role is listed', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.STAFF]);
    expect(guard.canActivate(contextFor(Role.STAFF))).toBe(true);
  });

  it('throws Forbidden for a role that is not listed (TC-07)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.STAFF]);
    expect(() => guard.canActivate(contextFor(Role.FAMILY))).toThrow(
      ForbiddenException,
    );
  });
});
