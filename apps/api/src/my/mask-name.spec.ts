import { maskName } from './mask-name';

describe('maskName', () => {
  it('keeps the given name and abbreviates the rest', () => {
    expect(maskName('Nguyễn Văn An')).toBe('N. V. An');
  });

  it('handles extra whitespace', () => {
    expect(maskName('  Trần   Thị  Bích  ')).toBe('T. T. Bích');
  });

  it('returns a single-word name unchanged', () => {
    expect(maskName('An')).toBe('An');
  });

  it('returns an empty string for blank input', () => {
    expect(maskName('   ')).toBe('');
  });
});
