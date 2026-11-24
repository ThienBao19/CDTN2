
"use client";

import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { HistoryList } from "@/components/history-list";
import { StatusSteps } from "@/components/status-steps";
import { Button, Card, ErrorText } from "@/components/ui";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/format";
import type { FamilySurgery } from "@/lib/types";
import { useEvents } from "@/lib/use-events";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";

// Realtime qua SSE; polling chỉ là dự phòng khi mất kết nối
const REFRESH_MS = 30_000;

// Định dạng ngày theo múi giờ của trình duyệt.
function formatExpectedDate(value: Date): string {
  return value.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function FollowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useMe();

  const { data, error, reload } = usePolling<FamilySurgery>(
    `/my/surgeries/${id}`,
    REFRESH_MS,
  );

  useEvents((e) => {
    if (e.surgeryId === id) void reload();
  });

  async function handleUnlink() {
    if (!data || !window.confirm("Ngừng theo dõi bệnh nhân này?"))
      return;

    await api.delete(`/links/${data.linkId}`);
    router.replace("/theo-doi");
  }

  const room = data?.room;

  // Kiểm tra thời gian hoàn thành dự kiến.
  const expectedFinishAt = data?.expectedFinishAt
    ? new Date(data.expectedFinishAt)
    : null;

  const hasExpectedTime =
    !!data &&
    !data.isCancelled &&
    expectedFinishAt !== null &&
    Number.isFinite(expectedFinishAt.getTime());

  const isOverdue =
    hasExpectedTime &&
    expectedFinishAt !== null &&
    expectedFinishAt.getTime() < Date.now();

  // Chuẩn bị nội dung ngày giờ dự kiến.
  const expectedTimeText =
    hasExpectedTime && data?.expectedFinishAt
      ? formatTime(data.expectedFinishAt)
      : "";

  const expectedDateText =
    hasExpectedTime && expectedFinishAt
      ? formatExpectedDate(expectedFinishAt)
      : "";

  const expectedDateTimeText =
    `${expectedTimeText} ngày ${expectedDateText}`;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <AppHeader
        title={data?.patientName ?? "Chi tiết"}
        user={user}
        backHref="/theo-doi"
      />

      <ErrorText>{error}</ErrorText>

      {data && (
        <>
          <Card className="flex flex-col gap-1">
            <span className="text-muted">{data.title}</span>

            <span className="text-3xl font-bold text-primary">
              {data.isCancelled
                ? "Ca đã hủy"
                : data.currentStatus.label}
            </span>

            {room && (
              <span className="text-muted">
                {room.name}
                {room.location ? ` · ${room.location}` : ""}
              </span>
            )}

            <span className="text-sm text-muted">
              Cập nhật lúc {formatTime(data.updatedAt)}
            </span>
          </Card>

          {/* Thời gian hoàn thành dự kiến */}
          {hasExpectedTime && data.expectedFinishAt && (
            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>

                <h2 className="text-lg font-semibold">
                  Thời gian hoàn thành dự kiến
                </h2>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-bold text-primary">
                    {expectedTimeText}
                  </span>

                  <span className="text-sm font-medium text-muted">
                    {expectedDateText}
                  </span>
                </div>

                <p className="mt-3 text-sm font-medium">
                  {isOverdue
                    ? `Thời điểm dự kiến: ${expectedDateTimeText}. Giai đoạn này đang kéo dài hơn dự kiến.`
                    : `Dự kiến xong giai đoạn này lúc khoảng ${expectedDateTimeText}.`}
                </p>
              </div>

              <p className="text-sm leading-relaxed text-muted">
                {isOverdue
                  ? "Vui lòng chờ thông tin cập nhật tiếp theo từ nhân viên y tế."
                  : "Thời gian chỉ mang tính tham khảo và có thể thay đổi tùy theo tình trạng thực tế."}
              </p>
            </Card>
          )}

          <StatusSteps
            currentOrder={data.currentStatus.sortOrder}
          />

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">
              Lịch sử trạng thái
            </h2>

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
