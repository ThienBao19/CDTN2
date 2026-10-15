"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NotificationList } from "@/lib/types";
import { useEvents } from "@/lib/use-events";
import { usePolling } from "@/lib/use-polling";

const LINKS = [
  { href: "/theo-doi", label: "Theo dõi" },
  { href: "/thong-bao", label: "Thông báo" },
  { href: "/cai-dat", label: "Cài đặt" },
];

// Thanh điều hướng người nhà; số thông báo chưa đọc cập nhật realtime
export function FamilyNav() {
  const pathname = usePathname();
  const { data, reload } = usePolling<NotificationList>("/my/notifications", 60_000);
  useEvents((e) => {
    if (e.type === "notification.created") void reload();
  });
  const unread = data?.unreadCount ?? 0;

  return (
    <nav className="grid grid-cols-3 gap-2">
      {LINKS.map((l) => {
        const isActive = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`relative min-h-12 rounded-xl border px-2 py-3 text-center font-medium ${
              isActive ? "border-primary bg-primary text-white" : "border-border bg-surface"
            }`}
          >
            {l.label}
            {l.href === "/thong-bao" && unread > 0 && (
              <span className="absolute -top-2 -right-1 rounded-full bg-red-600 px-2 text-sm text-white">
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
