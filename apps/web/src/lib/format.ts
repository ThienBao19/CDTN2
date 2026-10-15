const TIME_ZONE = "Asia/Ho_Chi_Minh";

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD
export function todayVN(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

export function homeForRole(role: string): string {
  if (role === "FAMILY") return "/theo-doi";
  if (role === "ADMIN") return "/admin";
  return "/staff";
}
