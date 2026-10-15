"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/tai-khoan", label: "Tài khoản" },
  { href: "/admin/danh-muc", label: "Phòng & trạng thái" },
  { href: "/admin/nhat-ky", label: "Nhật ký truy cập" },
  { href: "/staff", label: "Ca phẫu thuật" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-xl border px-4 py-2 font-medium ${
            pathname === l.href ? "border-primary bg-primary text-white" : "border-border bg-surface"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
