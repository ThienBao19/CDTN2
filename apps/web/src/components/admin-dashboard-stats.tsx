
"use client";

import { usePolling } from "@/lib/use-polling";

type AdminUser = {
  id: string;
  role: "ADMIN" | "STAFF" | "FAMILY";
  status: "ACTIVE" | "LOCKED";
};

export function AdminDashboardStats() {
  const { data: users } = usePolling<AdminUser[]>("/admin/users");

  const stats = [
    {
      label: "Tài khoản",
      value: users?.length,
      icon: "👥",
    },
    {
      label: "Đang hoạt động",
      value: users?.filter((user) => user.status === "ACTIVE").length,
      icon: "✅",
    },
    {
      label: "Nhân viên y tế",
      value: users?.filter((user) => user.role === "STAFF").length,
      icon: "🩺",
    },
    {
      label: "Quản trị viên",
      value: users?.filter((user) => user.role === "ADMIN").length,
      icon: "🛡️",
    },
  ];

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-[#14532d]">
        Thống kê tài khoản
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted">
                {stat.label}
              </span>
              <span aria-hidden="true" className="text-2xl">
                {stat.icon}
              </span>
            </div>

            <p className="text-3xl font-bold text-[#166534]">
              {stat.value ?? "—"}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">
        Thống kê dựa trên danh sách tài khoản API trả về
        (tối đa 200 tài khoản).
      </p>
    </section>
  );
}
