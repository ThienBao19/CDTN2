"use client";

import Link from "next/link";
import { useState } from "react";
import { SURGERY_STATUSES } from "@pt/shared";
import { AppHeader } from "@/components/app-header";
import { StatusBadge } from "@/components/status-badge";
import { ErrorText } from "@/components/ui";
import { formatTime, todayVN } from "@/lib/format";
import type { Room, Surgery } from "@/lib/types";
import { useEvents } from "@/lib/use-events";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";

const REFRESH_MS = 30_000;
const SELECT_CLASS = "min-h-12 w-full rounded-xl border border-border bg-surface px-3";

// Danh sách ca, lọc theo ngày, phòng, trạng thái (mục 12.2)
export default function StaffSurgeriesPage() {
  const user = useMe();
  const [date, setDate] = useState(todayVN());
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("");
  const { data: rooms } = usePolling<Room[]>("/rooms");

  const params = new URLSearchParams({
    ...(date ? { date } : {}),
    ...(roomId ? { roomId } : {}),
    ...(status ? { status } : {}),
  });
  const { data: surgeries, error, reload } = usePolling<Surgery[]>(`/surgeries?${params}`, REFRESH_MS);
  useEvents(() => void reload());

  const list = surgeries ?? [];
  const stats = [
    { label: "Tổng số ca", value: list.length },
    { label: "Đang phẫu thuật", value: list.filter((s) => !s.cancelledAt && s.currentStatus.code === "IN_SURGERY").length },
    { label: "Đã hoàn tất", value: list.filter((s) => !s.cancelledAt && s.currentStatus.code === "COMPLETED").length },
    { label: "Đã hủy", value: list.filter((s) => s.cancelledAt).length },
  ];
  const hasFilter = roomId !== "" || status !== "" || date !== todayVN();

  function resetFilters() {
    setDate(todayVN());
    setRoomId("");
    setStatus("");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 lg:px-10">
      <AppHeader title="Ca phẫu thuật" user={user} />

      {/* Thống kê nhanh theo bộ lọc hiện tại */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">{item.label}</p>
            <p className="mt-1 text-3xl font-bold">{surgeries ? item.value : "–"}</p>
          </div>
        ))}
      </section>

      {/* Bộ lọc */}
      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Ngày</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={SELECT_CLASS} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Phòng</span>
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className={SELECT_CLASS}>
            <option value="">Tất cả</option>
            {rooms?.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Trạng thái</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT_CLASS}>
            <option value="">Tất cả</option>
            {SURGERY_STATUSES.map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          {hasFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-12 flex-1 rounded-xl border border-border px-4 font-semibold hover:border-primary lg:flex-none"
            >
              Bỏ lọc
            </button>
          )}
          <Link
            href="/staff/ca-moi"
            className="flex min-h-12 flex-1 items-center justify-center whitespace-nowrap rounded-xl bg-primary px-5 font-semibold text-white hover:opacity-90 lg:flex-none"
          >
            + Tạo ca mới
          </Link>
        </div>
      </section>

      <ErrorText>{error}</ErrorText>

      {!surgeries && !error && <p className="text-muted">Đang tải danh sách ca…</p>}

      {surgeries?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-4xl" aria-hidden="true">🗓️</p>
          <p className="mt-2 font-semibold">Không có ca nào phù hợp</p>
          <p className="text-sm text-muted">Thử đổi ngày hoặc bỏ bớt bộ lọc.</p>
        </div>
      )}

      {list.length > 0 && (
        <>
          {/* Desktop: dạng bảng */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface md:block">
            <table className="w-full text-left">
              <thead className="whitespace-nowrap bg-background text-sm text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Giờ</th>
                  <th className="px-4 py-3 font-medium">Bệnh nhân</th>
                  <th className="px-4 py-3 font-medium">Ca mổ</th>
                  <th className="px-4 py-3 font-medium">Phòng</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-background">
                    <td className="px-4 py-3 font-mono text-lg">{formatTime(s.scheduledAt)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{s.patient.fullName}</div>
                      <div className="text-sm text-muted">{s.patient.patientCode}</div>
                    </td>
                    <td className="px-4 py-3">{s.title}</td>
                    <td className="px-4 py-3 text-muted">{s.room?.name ?? "Chưa xếp"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge code={s.currentStatus.code} label={s.currentStatus.label} cancelled={!!s.cancelledAt} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/staff/ca/${s.id}`} className="font-semibold text-primary hover:underline">
                        Chi tiết →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: dạng thẻ */}
          <ul className="flex flex-col gap-3 md:hidden">
            {list.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/staff/ca/${s.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 active:border-primary"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-lg">{formatTime(s.scheduledAt)}</span>
                    <StatusBadge code={s.currentStatus.code} label={s.currentStatus.label} cancelled={!!s.cancelledAt} />
                  </div>
                  <div>
                    <p className="font-semibold">{s.patient.fullName} · {s.patient.patientCode}</p>
                    <p className="text-sm text-muted">
                      {s.title} · {s.room?.name ?? "Chưa xếp phòng"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
