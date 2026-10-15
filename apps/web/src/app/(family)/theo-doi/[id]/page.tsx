"use client";

import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { HistoryList } from "@/components/history-list";
import { StatusSteps } from "@/components/status-steps";
import { Button, Card, ErrorText } from "@/components/ui";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/format";
import type { FamilySurgery } from "@/lib/types";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";

const REFRESH_MS = 10_000;

export default function FollowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useMe();
  const { data, error } = usePolling<FamilySurgery>(`/my/surgeries/${id}`, REFRESH_MS);

  async function handleUnlink() {
    if (!data || !window.confirm("Ngừng theo dõi bệnh nhân này?")) return;
    await api.delete(`/links/${data.linkId}`);
    router.replace("/theo-doi");
  }

  const room = data?.room;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <AppHeader title={data?.patientName ?? "Chi tiết"} user={user} backHref="/theo-doi" />
      <ErrorText>{error}</ErrorText>
      {data && (
        <>
          <Card className="flex flex-col gap-1">
            <span className="text-muted">{data.title}</span>
            <span className="text-3xl font-bold text-primary">
              {data.isCancelled ? "Ca đã hủy" : data.currentStatus.label}
            </span>
            {room && (
              <span className="text-muted">
                {room.name}
                {room.location ? ` · ${room.location}` : ""}
              </span>
            )}
            <span className="text-sm text-muted">Cập nhật lúc {formatTime(data.updatedAt)}</span>
          </Card>
          <StatusSteps currentOrder={data.currentStatus.sortOrder} />
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Lịch sử trạng thái</h2>
            <HistoryList entries={data.history ?? []} />
          </section>
          <Button variant="secondary" onClick={handleUnlink}>
            Ngừng theo dõi
          </Button>
        </>
      )}
    </main>
  );
}
