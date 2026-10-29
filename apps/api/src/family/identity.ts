// So khớp thông tin người nhà nhập với thông tin nhân viên đã đăng ký.
// Người lớn tuổi hay gõ không dấu, sai hoa thường, thừa khoảng trắng: đều chấp nhận.
export function normalizeName(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Chuẩn hóa số điện thoại Việt Nam về dạng 0xxxxxxxxx; trả null nếu không hợp lệ
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s.\-()]/g, '').replace(/^\+?84/, '0');
  return /^0\d{9}$/.test(digits) ? digits : null;
}
