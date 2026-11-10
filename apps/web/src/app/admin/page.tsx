
"use client";

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { AdminDashboardStats } from "@/components/admin-dashboard-stats";
import { useMe } from "@/lib/use-me";

const sections = [
  {
    title: "Quản lý tài khoản",
    description: "Quản lý nhân viên y tế, quản trị viên và phân quyền.",
    href: "/admin/tai-khoan",
    icon: "👥",
  },
  {
    title: "Phòng & trạng thái",
    description: "Quản lý phòng mổ, khu hồi sức và trạng thái phẫu thuật.",
    href: "/admin/danh-muc",
    icon: "🏥",
  },
  {
    title: "Nhật ký truy cập",
    description: "Theo dõi các hoạt động và lịch sử truy cập hệ thống.",
    href: "/admin/nhat-ky",
    icon: "📋",
  },
];

export default function AdminHome() {
  const me = useMe();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 lg:px-10">
      <AppHeader title="Tổng quan hệ thống" user={me} />

      <div>
        <p className="mb-2 font-semibold text-[#16a34a]">
          BẢNG ĐIỀU KHIỂN
        </p>
        <p className="mt-2 text-muted">
          Chào mừng đến với hệ thống quản trị bệnh viện.
        </p>
      </div>

      <AdminDashboardStats />

      <section>
        <h2 className="mb-4 text-xl font-bold">
          Quản lý hệ thống
        </h2>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-2xl border border-border bg-surface p-6 transition hover:border-[#16a34a] hover:shadow-lg"
            >
              <div className="mb-4 text-4xl">{section.icon}</div>

              <h3 className="text-lg font-bold text-[#166534]">
                {section.title}
              </h3>

              <p className="mt-2 text-sm text-muted">
                {section.description}
              </p>

              <div className="mt-6 font-semibold text-[#16a34a] group-hover:underline">
                Truy cập →
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-6">
        <h2 className="text-lg font-bold text-[#166534]">
          Trung tâm quản trị
        </h2>
        <p className="mt-2 text-sm text-[#475569]">
          Sử dụng thanh điều hướng bên trái để quản lý tài khoản,
          phòng và trạng thái phẫu thuật, hoặc xem nhật ký truy cập.
        </p>
      </section>
    </main>
  );
}
