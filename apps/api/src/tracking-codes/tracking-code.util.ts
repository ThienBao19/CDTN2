import { createHmac, randomInt } from 'node:crypto';

// Bỏ các ký tự dễ nhầm (0/O, 1/I/L) để người lớn tuổi nhập tay dễ hơn
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;
const GROUP = 4;

export function generateCode(): string {
  const chars = Array.from(
    { length: CODE_LENGTH },
    () => ALPHABET[randomInt(ALPHABET.length)],
  );
  return `${chars.slice(0, GROUP).join('')}-${chars.slice(GROUP).join('')}`;
}

// Chấp nhận chữ thường, khoảng trắng, có hoặc không có dấu gạch; trả null nếu sai dạng
export function normalizeCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[\s-]/g, '');
  if (raw.length !== CODE_LENGTH) return null;
  if ([...raw].some((c) => !ALPHABET.includes(c))) return null;
  return `${raw.slice(0, GROUP)}-${raw.slice(GROUP)}`;
}

export function hashCode(code: string, secret: string): string {
  return createHmac('sha256', secret).update(code).digest('hex');
}
