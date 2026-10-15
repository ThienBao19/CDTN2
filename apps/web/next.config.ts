import path from "node:path";
import type { NextConfig } from "next";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  transpilePackages: ["@pt/shared"],
  // Bản build gọn để chạy trong Docker (monorepo: truy vết file từ thư mục gốc)
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Proxy /api sang backend để cookie đăng nhập dùng chung origin với web
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
