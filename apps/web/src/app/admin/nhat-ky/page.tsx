"use client";

import { useState } from "react";
import { AdminNav } from "@/components/admin-nav";
import { AppHeader } from "@/components/app-header";
import { Button, ErrorText } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";

type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  ipAddress: string | null;
  user: { fullName: string; role: string } | null;
};
type AuditPage = { items: AuditItem[]; total: number; page: number; pageSize: number };
type UserOption = { id: string; fullName: string };

const PAGE_SIZE = 25;
const ACTION_LABELS: Record<string, string> = {
  VIEW: "Xem ca",
  CREATE: "Tạo",
  UPDATE: "Sửa",
  CANCEL: "Hủy ca",
  STATUS_CHANGE: "Đổi trạng thái",
  STATUS_OVERRIDE: "Điều chỉnh trạng thái",
  ISSUE_CODE: "Cấp mã",
  REVOKE_CODE: "Thu hồi mã",
  LINK: "Liên kết",
  UNLINK: "Hủy liên kết",
  LOCK: "Khóa tài khoản",
};
const SELECT = "min-h-12 rounded-xl border border-border bg-surface px-3";

// Nhật ký truy cập (FR-11): lọc theo người dùng, thời gian, hành động
export default function AuditPage() {
  const me = useMe();
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const { data: users } = usePolling<UserOption[]>("/admin/users");

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    ...(userId ? { userId } : {}),
    ...(action ? { action } : {}),
    ...(from ? { from: new Date(`${from}T00:00:00+07:00`).toISOString() } : {}),
    ...(to ? { to: new Date(`${to}T23:59:59+07:00`).toISOString() } : {}),
  });
  const { data, error } = usePolling<AuditPage>(`/admin/audit-logs?${params}`);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const onFilter = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <AppHeader title="Nhật ký truy cập" user={me} />
      <AdminNav />
      <div className="flex flex-wrap items-end gap-3">
        <select value={userId} onChange={(e) => onFilter(setUserId)(e.target.value)} className={SELECT} aria-label="Người dùng">
          <option value="">Mọi người dùng</option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>{u.fullName}</option>
          ))}
        </select>
        <select value={action} onChange={(e) => onFilter(setAction)(e.target.value)} className={SELECT} aria-label="Hành động">
          <option value="">Mọi hành động</option>
          {Object.entries(ACTION_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => onFilter(setFrom)(e.target.value)} className={SELECT} aria-label="Từ ngày" />
        <input type="date" value={to} onChange={(e) => onFilter(setTo)(e.target.value)} className={SELECT} aria-label="Đến ngày" />
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2">Thời điểm</th>
              <th>Người dùng</th>
              <th>Hành động</th>
              <th>Đối tượng</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((i) => (
              <tr key={i.id} className="border-b border-border">
                <td className="py-2">{formatDateTime(i.createdAt)}</td>
                <td>{i.user?.fullName ?? "—"}</td>
                <td>{ACTION_LABELS[i.action] ?? i.action}</td>
                <td className="font-mono text-xs">{i.entityType} {i.entityId?.slice(0, 8)}</td>
                <td className="text-muted">{i.ipAddress ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trang trước</Button>
        <span className="text-muted">Trang {page}/{totalPages} · {data?.total ?? 0} bản ghi</span>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Trang sau</Button>
      </div>
    </main>
  );
}
