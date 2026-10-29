import { cookies } from "next/headers";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";
const AUTH_COOKIE = "pt_token";

const HOME_BY_ROLE: Record<string, string> = {
  FAMILY: "/theo-doi",
  STAFF: "/staff",
  ADMIN: "/admin",
};

// Trang chính theo vai trò nếu phiên còn hạn; null khi chưa đăng nhập hoặc phiên đã hết.
// Dùng khi mở lại app từ màn hình chính: không bắt người nhà nhập lại thông tin.
export async function sessionHome(): Promise<string | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${API_ORIGIN}/api/auth/me`, {
      headers: { cookie: `${AUTH_COOKIE}=${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const me = (await res.json()) as { role?: string };
    return (me.role && HOME_BY_ROLE[me.role]) || null;
  } catch {
    return null;
  }
}
