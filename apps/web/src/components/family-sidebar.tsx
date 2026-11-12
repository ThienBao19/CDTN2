"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NotificationList } from "@/lib/types";
import { useEvents } from "@/lib/use-events";
import { usePolling } from "@/lib/use-polling";

const MENU_ITEMS = [
  { href: "/theo-doi", label: "Theo dõi", icon: "♡" },
  { href: "/thong-bao", label: "Thông báo", icon: "✉" },
  { href: "/cai-dat", label: "Cài đặt", icon: "⚙" },
];

// Thanh điều hướng người nhà, cùng tông xanh với khu quản trị.
// Số thông báo chưa đọc cập nhật realtime như FamilyNav cũ.
export function FamilySidebar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data, reload } = usePolling<NotificationList>("/my/notifications", 60_000);
  useEvents((e) => {
    if (e.type === "notification.created") void reload();
  });
  const unread = data?.unreadCount ?? 0;

  // Tự đóng menu khi chuyển trang.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <aside className="w-full shrink-0 bg-[#166534] text-white lg:min-h-screen lg:w-64">
      <div className="flex items-center justify-between border-b border-white/20 px-5 py-4 lg:block lg:px-6 lg:py-6">
        <div>
          <div className="text-xl font-bold">Theo dõi người thân</div>
          <p className="mt-1 text-sm text-green-100">Cổng thông tin người nhà</p>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          aria-controls="family-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/30 text-2xl hover:bg-white/15 lg:hidden"
        >
          <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
          {!menuOpen && unread > 0 && (
            <span className="absolute -top-2 -right-2 rounded-full bg-red-600 px-2 text-sm text-white">
              {unread}
            </span>
          )}
        </button>
      </div>

      <nav
        id="family-navigation"
        aria-label="Điều hướng người nhà"
        className={`${menuOpen ? "flex" : "hidden"} flex-col gap-2 p-3 lg:flex lg:p-4`}
      >
        {MENU_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
              className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 font-semibold transition ${
                active ? "bg-white text-[#166534]" : "text-green-50 hover:bg-white/15"
              }`}
            >
              <span aria-hidden="true" className="text-lg">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.href === "/thong-bao" && unread > 0 && (
                <span className="rounded-full bg-red-600 px-2 text-sm text-white">{unread}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
