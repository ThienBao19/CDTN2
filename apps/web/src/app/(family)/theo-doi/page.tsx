"use client";

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { FamilyNav } from "@/components/family-nav";
import { ErrorText } from "@/components/ui";
import { formatTime } from "@/lib/format";
import type { FamilySurgery } from "@/lib/types";
import { useEvents } from "@/lib/use-events";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";

// Realtime qua SSE; polling chỉ là dự phòng khi mất kết nối
const REFRESH_MS = 30_000;

export default function FollowListPage() {
  const user = useMe();
  const { data: items, error, reload } = usePolling<FamilySurgery[]>("/my/surgeries", REFRESH_MS);
  useEvents((e) => {
    if (e.type === "surgery.updated") void reload();
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <AppHeader title="Bệnh nhân đang theo dõi" user={user} />
      <FamilyNav />
      <ErrorText>{error}</ErrorText>
      {items?.length === 0 && (
        <p className="text-muted">
          Chưa có ca phẫu thuật nào đang theo dõi.
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {items?.map((s) => (
          <li key={s.surgeryId}>
            <Link
              href={`/theo-doi/${s.surgeryId}`}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 hover:border-primary"
            >
              <span className="text-lg font-semibold">{s.patientName}</span>
              <span className="text-muted">{s.title}</span>
              <span className="text-xl font-bold text-primary">
                {s.isCancelled ? "Ca đã hủy" : s.currentStatus.label}
              </span>
              <span className="text-sm text-muted">Cập nhật lúc {formatTime(s.updatedAt)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted">
        Thiếu bệnh nhân? Nhờ nhân viên y tế đăng ký số điện thoại của bạn vào ca phẫu thuật, rồi vào lại
        bằng họ tên bệnh nhân đó.
      </p>
    </main>
  );
}
