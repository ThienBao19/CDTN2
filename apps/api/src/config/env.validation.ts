const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'TRACKING_CODE_SECRET'];
const MIN_SECRET_LENGTH = 32;

// Kiểm tra biến môi trường bắt buộc ngay khi khởi động (fail fast)
export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Thiếu biến môi trường: ${missing.join(', ')}`);
  }
  for (const key of ['JWT_SECRET', 'TRACKING_CODE_SECRET']) {
    if (String(config[key]).length < MIN_SECRET_LENGTH) {
      throw new Error(`${key} phải dài ít nhất ${MIN_SECRET_LENGTH} ký tự`);
    }
  }
  return config;
}
