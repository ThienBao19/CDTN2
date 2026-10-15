import { isCookieSecure, sessionHours, sessionMaxAgeMs } from './auth-config';

describe('auth-config', () => {
  it('uses 8 hours by default and for invalid values', () => {
    expect(sessionHours(undefined)).toBe(8);
    expect(sessionHours('abc')).toBe(8);
    expect(sessionHours('-1')).toBe(8);
  });

  it('keeps cookie max age in sync with the session length', () => {
    expect(sessionMaxAgeMs('2')).toBe(2 * 60 * 60 * 1000);
  });

  it('lets COOKIE_SECURE override the NODE_ENV default', () => {
    expect(isCookieSecure(undefined, 'production')).toBe(true);
    expect(isCookieSecure(undefined, 'development')).toBe(false);
    expect(isCookieSecure('false', 'production')).toBe(false);
    expect(isCookieSecure('true', 'development')).toBe(true);
  });
});
