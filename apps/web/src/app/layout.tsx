import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Theo dõi bệnh nhân",
  description: "Người nhà theo dõi tình trạng ca phẫu thuật ngay trên điện thoại",
  applicationName: "Theo dõi bệnh nhân",
};

export const viewport: Viewport = {
  themeColor: "#0f6cbd",
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
