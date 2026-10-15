import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "pt_token";

// Chuyển về trang đăng nhập nếu chưa có phiên; quyền thật sự do API kiểm tra
export function middleware(req: NextRequest) {
  if (req.cookies.has(AUTH_COOKIE)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/dang-nhap";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/theo-doi/:path*",
    "/thong-bao",
    "/cai-dat",
    "/lien-ket",
    "/staff/:path*",
    "/admin/:path*",
  ],
};
