// Express "trust proxy": số tầng proxy đứng trước API.
// Mặc định 1 = chỉ tin proxy /api của Next.js, lấy IP thật ở cuối X-Forwarded-For;
// header giả do người dùng tự thêm (nằm phía trước) bị bỏ qua.
export function parseTrustProxy(
  value: string | undefined,
): boolean | number | string {
  if (value === undefined || value.trim() === '') return 1;
  if (value === 'false') return false;
  if (value === 'true') return true;
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : value;
}
