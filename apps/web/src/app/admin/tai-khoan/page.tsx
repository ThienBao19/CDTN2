"use client";

import { useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import { AppHeader } from "@/components/app-header";
import { ErrorText } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Role } from "@/lib/types";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";
import { CreateUserForm } from "./create-user-form";

type AdminUser = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: Role;
  status: "ACTIVE" | "LOCKED";
};

const ROLE_LABELS: Record<Role, string> = {
  FAMILY: "Người nhà",
  STAFF: "Nhân viên y tế",
  ADMIN: "Quản trị viên",
};

// Quản lý tài khoản: tạo, khóa/mở khóa, đổi vai trò (mục 12.3)
export default function AccountsPage() {
  const me = useMe();
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const { data: users, reload } = usePolling<AdminUser[]>(`/admin/users${role ? `?role=${role}` : ""}`);

  async function update(id: string, body: Partial<Pick<AdminUser, "role" | "status">>) {
    setError("");
    try {
      await api.patch(`/admin/users/${id}`, body);
      void reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không cập nhật được");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <AppHeader title="Quản lý tài khoản" user={me} />
      <AdminNav />
      <CreateUserForm onCreated={() => void reload()} />
      <div className="flex items-center gap-3">
        <span className="font-medium">Lọc vai trò</span>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="min-h-12 rounded-xl border border-border bg-surface px-3">
          <option value="">Tất cả</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2">Họ tên</th>
              <th>Liên hệ</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-border">
                <td className="py-2">{u.fullName}</td>
                <td className="text-muted">{u.email ?? u.phone}</td>
                <td>
                  {u.role === "FAMILY" ? (
                    ROLE_LABELS.FAMILY
                  ) : (
                    <select
                      value={u.role}
                      disabled={u.id === me?.id}
                      onChange={(e) => void update(u.id, { role: e.target.value as Role })}
                      className="rounded-lg border border-border bg-surface px-2 py-1"
                    >
                      <option value="STAFF">{ROLE_LABELS.STAFF}</option>
                      <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                    </select>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    disabled={u.id === me?.id}
                    onClick={() => void update(u.id, { status: u.status === "ACTIVE" ? "LOCKED" : "ACTIVE" })}
                    className={`rounded-lg px-3 py-1 disabled:opacity-40 ${u.status === "ACTIVE" ? "border border-border" : "bg-red-600 text-white"}`}
                  >
                    {u.status === "ACTIVE" ? "Đang hoạt động · Khóa" : "Đã khóa · Mở khóa"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
