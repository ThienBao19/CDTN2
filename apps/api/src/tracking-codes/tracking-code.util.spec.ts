import { generateCode, hashCode, normalizeCode } from './tracking-code.util';

describe('tracking-code.util', () => {
  it('generates codes in XXXX-XXXX format without ambiguous characters', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateCode();
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it('generates different codes on each call', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateCode()));
    expect(codes.size).toBe(100);
  });

  it('normalizes lowercase input with spaces and no dash', () => {
    expect(normalizeCode(' abcd efgh ')).toBe('ABCD-EFGH');
    expect(normalizeCode('abcdefgh')).toBe('ABCD-EFGH');
  });

  it('returns null for wrong length or invalid characters', () => {
    expect(normalizeCode('ABC-DEF')).toBeNull();
    expect(normalizeCode('ABCD-EFG0')).toBeNull();
  });

  it('hashes deterministically and depends on the secret', () => {
    expect(hashCode('ABCD-EFGH', 's1')).toBe(hashCode('ABCD-EFGH', 's1'));
    expect(hashCode('ABCD-EFGH', 's1')).not.toBe(hashCode('ABCD-EFGH', 's2'));
  });
});
