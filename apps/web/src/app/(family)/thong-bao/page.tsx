"use client";

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { FamilyNav } from "@/components/family-nav";
import { Button, ErrorText } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { NotificationList } from "@/lib/types";
import { useEvents } from "@/lib/use-events";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";

// Danh sách thông báo đã nhận (mục 12.1); vẫn xem lại được sau khi offline (TC-09)
export default function NotificationsPage() {
  const user = useMe();
  const { data, error, reload } = usePolling<NotificationList>("/my/notifications", 60_000);
  useEvents((e) => {
    if (e.type === "notification.created") void reload();
  });

  async function handleReadAll() {
    await api.post("/my/notifications/read-all");
    void reload();
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <AppHeader title="Thông báo" user={user} />
      <FamilyNav />
      <ErrorText>{error}</ErrorText>
      {data?.items.length === 0 && <p className="text-muted">Chưa có thông báo nào.</p>}
      {data && data.unreadCount > 0 && (
        <Button variant="secondary" onClick={() => void handleReadAll()}>
          Đánh dấu đã đọc tất cả
        </Button>
      )}
      <ul className="flex flex-col gap-2">
        {data?.items.map((n) => (
          <li key={n.id}>
            <Link
              href={`/theo-doi/${n.surgeryId}`}
              onClick={() => void api.post(`/my/notifications/${n.id}/read`).catch(() => undefined)}
              className={`flex flex-col gap-1 rounded-xl border px-4 py-3 ${
                n.readAt ? "border-border bg-surface" : "border-primary bg-surface font-semibold"
              }`}
            >
              <span>{n.content}</span>
              <span className="text-sm font-normal text-muted">{formatDateTime(n.createdAt)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
