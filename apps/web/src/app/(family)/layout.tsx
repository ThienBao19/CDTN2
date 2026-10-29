import type { ReactNode } from "react";
import { FamilyAlerts } from "@/components/status-alarm";

// Khu vực người nhà: âm báo chuyển giai đoạn và chuông khi ca kết thúc
export default function FamilyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <FamilyAlerts />
    </>
  );
}
