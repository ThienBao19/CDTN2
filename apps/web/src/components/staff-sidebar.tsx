"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const MENU_ITEMS = [
  { href: "/staff", label: "Ca phẫu thuật", icon: "▦" },
  { href: "/staff/ca-moi", label: "Tạo ca mới", icon: "＋" },
];

// Thanh điều hướng khu nhân viên y tế (cùng kiểu với AdminSidebar)
export function StaffSidebar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Tự đóng menu khi chuyển trang
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/staff") return pathname === "/staff" || pathname.startsWith("/staff/ca/");
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-full shrink-0 bg-[#166534] text-white lg:sticky lg:top-0 lg:h-screen lg:w-64">
      <div className="flex items-center justify-between border-b border-white/20 px-5 py-4 lg:block lg:px-6 lg:py-6">
        <div>
          <div className="text-xl font-bold">Nhân viên y tế</div>
          <p className="mt-1 text-sm text-green-100">Cập nhật tình trạng ca mổ</p>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          aria-controls="staff-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/30 text-2xl hover:bg-white/15 lg:hidden"
        >
          <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      <nav
        id="staff-navigation"
        aria-label="Điều hướng nhân viên"
        className={`${menuOpen ? "flex" : "hidden"} flex-col gap-2 p-3 lg:flex lg:p-4`}
      >
        {MENU_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active ? "bg-white text-[#166534]" : "text-green-50 hover:bg-white/15"
              }`}
            >
              <span aria-hidden="true" className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
