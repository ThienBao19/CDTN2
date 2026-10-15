const DEFAULT_SESSION_HOURS = 8;
const HOUR_MS = 60 * 60 * 1000;

// Thời hạn phiên dùng chung cho JWT và cookie để không bị lệch nhau
export function sessionHours(value: string | undefined): number {
  const hours = Number(value);
  return Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_SESSION_HOURS;
}

export function sessionMaxAgeMs(value: string | undefined): number {
  return sessionHours(value) * HOUR_MS;
}

// Cookie Secure: mặc định bật khi production; tắt được để demo bằng http trong mạng LAN
export function isCookieSecure(
  value: string | undefined,
  nodeEnv: string | undefined,
): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return nodeEnv === 'production';
}
