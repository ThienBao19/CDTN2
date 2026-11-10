
import type { CSSProperties, ReactNode } from "react";
import { AdminSidebar } from "@/components/admin-sidebar";

const adminTheme = {
  "--background": "#f5faf7",
  "--foreground": "#1e293b",
  "--muted": "#64748b",
  "--primary": "#16a34a",
  "--surface": "#ffffff",
  "--border": "#dbe7df",
} as CSSProperties;

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div
      style={adminTheme}
      className="min-h-screen bg-background text-foreground lg:flex"
    >
      <AdminSidebar />

      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  );
}
