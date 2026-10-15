import { Role } from '@prisma/client';
import { AuthRequest } from '../types/auth-user';
import { throttleKey, VerifyToken } from './app-throttler.guard';

function req(partial: Partial<AuthRequest> & { body?: unknown }): AuthRequest {
  return {
    headers: {},
    cookies: {},
    ip: '10.0.0.1',
    path: '/api/x',
    ...partial,
  } as AuthRequest;
}

const verify: VerifyToken = (token) =>
  token.startsWith('valid-')
    ? { sub: token.slice(6), role: Role.FAMILY, ver: 0 }
    : null;

describe('throttleKey', () => {
  it('BUG-01: keys login attempts by account, ignoring the client IP', () => {
    const a = throttleKey(
      req({
        path: '/api/auth/login',
        ip: '1.1.1.1',
        body: { identifier: ' Staff@Example.com ' },
      }),
      verify,
    );
    const b = throttleKey(
      req({
        path: '/api/auth/login',
        ip: '2.2.2.2',
        body: { identifier: 'staff@example.com' },
      }),
      verify,
    );
    expect(a).toBe('login:staff@example.com');
    expect(b).toBe(a);
  });

  it('keys requests with a valid token by user, not by shared proxy IP', () => {
    expect(
      throttleKey(
        req({ headers: { authorization: 'Bearer valid-u1' } }),
        verify,
      ),
    ).toBe('user:u1');
    expect(
      throttleKey(
        req({ headers: { authorization: 'Bearer valid-u2' } }),
        verify,
      ),
    ).toBe('user:u2');
  });

  it('BUG-11: falls back to the IP for forged tokens so random tokens cannot bypass limits', () => {
    expect(
      throttleKey(
        req({ ip: '9.9.9.9', headers: { authorization: 'Bearer forged-1' } }),
        verify,
      ),
    ).toBe('ip:9.9.9.9');
    expect(
      throttleKey(
        req({ ip: '9.9.9.9', headers: { authorization: 'Bearer forged-2' } }),
        verify,
      ),
    ).toBe('ip:9.9.9.9');
  });

  it('uses the IP for anonymous requests', () => {
    expect(throttleKey(req({ ip: '9.9.9.9' }), verify)).toBe('ip:9.9.9.9');
  });
});
