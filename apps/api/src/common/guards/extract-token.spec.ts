import { AuthRequest } from '../types/auth-user';
import { AUTH_COOKIE, extractToken } from './jwt-auth.guard';

function req(authorization?: string, cookie?: string): AuthRequest {
  return {
    headers: authorization ? { authorization } : {},
    cookies: cookie ? { [AUTH_COOKIE]: cookie } : {},
  } as unknown as AuthRequest;
}

describe('extractToken', () => {
  it('BUG-09: prefers an explicit Bearer header over the session cookie', () => {
    expect(extractToken(req('Bearer staff-token', 'family-cookie'))).toBe(
      'staff-token',
    );
  });

  it('falls back to the cookie when there is no Bearer header', () => {
    expect(extractToken(req(undefined, 'family-cookie'))).toBe('family-cookie');
    expect(extractToken(req('Basic abc', 'family-cookie'))).toBe(
      'family-cookie',
    );
  });

  it('returns undefined without credentials', () => {
    expect(extractToken(req())).toBeUndefined();
  });
});
