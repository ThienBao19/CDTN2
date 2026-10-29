import { NextResponse, type NextRequest } from "next/server";
import { loginPathFor } from "@/lib/format";

const AUTH_COOKIE = "pt_token";

// Chuyển về trang đăng nhập nếu chưa có phiên; quyền thật sự do API kiểm tra
export function middleware(req: NextRequest) {
  if (req.cookies.has(AUTH_COOKIE)) return NextResponse.next();
  const url = req.nextUrl.clone();
  // Người nhà vào lại bằng thông tin ở /nguoi-nha; nhân viên đăng nhập ở /dang-nhap
  url.pathname = loginPathFor(req.nextUrl.pathname);
  url.search =
    url.pathname === "/dang-nhap"
      ? `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`
      : "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/theo-doi/:path*",
    "/thong-bao",
    "/cai-dat",
    "/staff/:path*",
    "/admin/:path*",
  ],
};
