
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MENU_ITEMS = [
  { href: "/admin", label: "Tổng quan", icon: "▦" },
  { href: "/admin/tai-khoan", label: "Quản lý tài khoản", icon: "♙" },
  { href: "/admin/danh-muc", label: "Phòng & trạng thái", icon: "▤" },
  { href: "/admin/nhat-ky", label: "Nhật ký truy cập", icon: "◷" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Tự đóng menu khi chuyển trang.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <aside className="w-full shrink-0 bg-[#166534] text-white lg:min-h-screen lg:w-64">
      <div className="flex items-center justify-between border-b border-white/20 px-5 py-4 lg:block lg:px-6 lg:py-6">
        <div>
          <div className="text-xl font-bold">Hospital Admin</div>
          <p className="mt-1 text-sm text-green-100">
            Hệ thống quản lý bệnh viện
          </p>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          aria-controls="admin-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/30 text-2xl hover:bg-white/15 lg:hidden"
        >
          <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      <nav
        id="admin-navigation"
        aria-label="Điều hướng quản trị"
        className={`${
          menuOpen ? "flex" : "hidden"
        } flex-col gap-2 p-3 lg:flex lg:p-4`}
      >
        {MENU_ITEMS.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-white text-[#166534]"
                  : "text-green-50 hover:bg-white/15"
              }`}
            >
              <span aria-hidden="true" className="text-lg">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
