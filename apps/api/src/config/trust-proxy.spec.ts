import { parseTrustProxy } from './trust-proxy';

describe('parseTrustProxy', () => {
  it('defaults to trusting exactly one proxy hop', () => {
    expect(parseTrustProxy(undefined)).toBe(1);
    expect(parseTrustProxy('  ')).toBe(1);
  });

  it('parses hop counts and booleans', () => {
    expect(parseTrustProxy('2')).toBe(2);
    expect(parseTrustProxy('false')).toBe(false);
    expect(parseTrustProxy('true')).toBe(true);
  });

  it('passes through subnet names for express', () => {
    expect(parseTrustProxy('loopback, uniquelocal')).toBe(
      'loopback, uniquelocal',
    );
  });
});
