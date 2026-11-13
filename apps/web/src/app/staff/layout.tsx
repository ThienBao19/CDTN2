import type { CSSProperties, ReactNode } from "react";
import { StaffSidebar } from "@/components/staff-sidebar";

// Cùng bảng màu với khu quản trị và người nhà
const staffTheme = {
  "--background": "#f5faf7",
  "--foreground": "#1e293b",
  "--muted": "#64748b",
  "--primary": "#16a34a",
  "--surface": "#ffffff",
  "--border": "#dbe7df",
} as CSSProperties;

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <div style={staffTheme} className="min-h-screen bg-background text-foreground lg:flex">
      <StaffSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
