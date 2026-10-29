import { normalizeName, normalizePhone } from './identity';

describe('normalizeName', () => {
  it('ignores Vietnamese diacritics, case and extra spaces', () => {
    expect(normalizeName('  Nguyễn   Văn AN ')).toBe(
      normalizeName('nguyen van an'),
    );
  });

  it('treats đ as d', () => {
    expect(normalizeName('Đỗ Thị Đào')).toBe('do thi dao');
  });

  it('still distinguishes different names', () => {
    expect(normalizeName('Nguyễn Văn An')).not.toBe(
      normalizeName('Nguyễn Văn Anh'),
    );
  });
});

describe('normalizePhone', () => {
  it('accepts common Vietnamese formats', () => {
    expect(normalizePhone('0901 234 567')).toBe('0901234567');
    expect(normalizePhone('+84 901.234.567')).toBe('0901234567');
    expect(normalizePhone('84901234567')).toBe('0901234567');
  });

  it('rejects invalid numbers', () => {
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone('090123456a')).toBeNull();
  });
});
