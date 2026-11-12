import type { CSSProperties, ReactNode } from "react";
import { FamilySidebar } from "@/components/family-sidebar";
import { FamilyAlerts } from "@/components/status-alarm";

// Cùng bảng màu với khu quản trị (app/admin/layout.tsx)
const familyTheme = {
  "--background": "#f5faf7",
  "--foreground": "#1e293b",
  "--muted": "#64748b",
  "--primary": "#16a34a",
  "--surface": "#ffffff",
  "--border": "#dbe7df",
} as CSSProperties;

// Khu vực người nhà: âm báo chuyển giai đoạn và chuông khi ca kết thúc
export default function FamilyLayout({ children }: { children: ReactNode }) {
  return (
    <div style={familyTheme} className="min-h-screen bg-background text-foreground lg:flex">
      <FamilySidebar />
      <div className="min-w-0 flex-1">{children}</div>
      <FamilyAlerts />
    </div>
  );
}
