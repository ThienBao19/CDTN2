import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { APP_NAME, APP_SHORT_NAME, BRAND_GREEN } from "@/lib/brand";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: "Người nhà theo dõi tình trạng ca phẫu thuật ngay trên điện thoại",
  applicationName: APP_NAME,
  appleWebApp: { title: APP_SHORT_NAME, capable: true },
};

export const viewport: Viewport = {
  themeColor: BRAND_GREEN,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${beVietnam.variable} antialiased`}>{children}</body>
    </html>
  );
}
