"use client";

import Link from "next/link";
import { useState } from "react";
import { SURGERY_STATUSES } from "@pt/shared";
import { AppHeader } from "@/components/app-header";
import { ErrorText } from "@/components/ui";
import { formatTime, todayVN } from "@/lib/format";
import type { Room, Surgery } from "@/lib/types";
import { useEvents } from "@/lib/use-events";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";

const REFRESH_MS = 30_000;
const SELECT_CLASS = "min-h-12 rounded-xl border border-border bg-surface px-3";

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

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <AppHeader title="Ca phẫu thuật" user={user} />
      <div className="flex flex-wrap items-end gap-3">
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
        <Link href="/staff/ca-moi" className="ml-auto min-h-12 rounded-xl bg-primary px-5 py-3 font-semibold text-white">
          + Tạo ca mới
        </Link>
      </div>
      <ErrorText>{error}</ErrorText>
      {surgeries?.length === 0 && <p className="text-muted">Không có ca nào phù hợp.</p>}
      <ul className="flex flex-col gap-2">
        {surgeries?.map((s) => (
          <li key={s.id}>
            <Link
              href={`/staff/ca/${s.id}`}
              className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:border-primary"
            >
              <span className="font-mono text-lg">{formatTime(s.scheduledAt)}</span>
              <span className="flex flex-col">
                <span className="font-semibold">{s.patient.fullName} · {s.patient.patientCode}</span>
                <span className="text-sm text-muted">{s.title}{s.room ? ` · ${s.room.name}` : ""}</span>
              </span>
              <span className={s.cancelledAt ? "text-red-600" : "font-semibold text-primary"}>
                {s.cancelledAt ? "Đã hủy" : s.currentStatus.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
