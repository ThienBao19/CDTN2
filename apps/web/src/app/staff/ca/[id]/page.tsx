"use client";

import { useParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { HistoryList } from "@/components/history-list";
import { StatusBadge } from "@/components/status-badge";
import { StatusSteps } from "@/components/status-steps";
import { Card, ErrorText } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { HistoryEntry, StatusRef, Surgery } from "@/lib/types";
import { useEvents } from "@/lib/use-events";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";
import { CancelPanel } from "./cancel-panel";
import { FamilyContactsPanel } from "./family-contacts-panel";
import { EditPanel } from "./edit-panel";
import { StatusPanel } from "./status-panel";

export default function StaffSurgeryPage() {
  const { id } = useParams<{ id: string }>();
  const user = useMe();
  const surgery = usePolling<Surgery>(`/surgeries/${id}`);
  const history = usePolling<HistoryEntry[]>(`/surgeries/${id}/history`);
  const { data: statuses } = usePolling<StatusRef[]>("/statuses");

  const s = surgery.data;
  const isActive = s !== null && !s.cancelledAt;
  const isFinal = s !== null && !statuses?.some((x) => x.sortOrder > s.currentStatus.sortOrder);
  // Ma trận quyền: chỉ nhân viên y tế cập nhật trạng thái
  const canUpdateStatus = user?.role === "STAFF" && isActive;

  function reloadAll() {
    void surgery.reload();
    void history.reload();
  }
  // Nhân viên khác cập nhật cùng ca thì màn hình này cũng đổi theo
  useEvents((e) => {
    if (e.type === "surgery.updated" && e.surgeryId === id) reloadAll();
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 lg:px-10">
      <AppHeader title={s ? s.patient.fullName : "Chi tiết ca"} user={user} backHref="/staff" />
      <ErrorText>{surgery.error}</ErrorText>
      {!s && !surgery.error && <p className="text-muted">Đang tải thông tin ca…</p>}

      {s && (
        <>
          {/* Thông tin chung của ca */}
          <Card className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted">Mã BN {s.patient.patientCode}</span>
                <span className="text-xl font-semibold">{s.title}</span>
              </div>
              <StatusBadge code={s.currentStatus.code} label={s.currentStatus.label} cancelled={!!s.cancelledAt} />
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-background px-4 py-3">
                <dt className="text-muted">Giờ dự kiến</dt>
                <dd className="font-semibold">{formatDateTime(s.scheduledAt)}</dd>
              </div>
              <div className="rounded-xl bg-background px-4 py-3">
                <dt className="text-muted">Phòng</dt>
                <dd className="font-semibold">
                  {s.room ? `${s.room.name}${s.room.location ? ` · ${s.room.location}` : ""}` : "Chưa xếp phòng"}
                </dd>
              </div>
            </dl>
            {s.cancelledAt && (
              <p className="rounded-lg bg-red-50 px-4 py-3 font-semibold text-red-700">
                Ca đã hủy: {s.cancelReason}
              </p>
            )}
          </Card>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            {/* Cột trái: thao tác */}
            <div className="flex flex-col gap-6">
              {canUpdateStatus && statuses && (
                <StatusPanel surgery={s} statuses={statuses} onChanged={reloadAll} />
              )}
              <FamilyContactsPanel surgeryId={s.id} canAdd={isActive && !isFinal} />
              {isActive && (
                <Card className="flex flex-col gap-3">
                  <h2 className="text-lg font-semibold">Quản lý ca</h2>
                  <EditPanel surgery={s} onSaved={reloadAll} />
                  {!isFinal && <CancelPanel surgeryId={s.id} onCancelled={reloadAll} />}
                </Card>
              )}
            </div>

            {/* Cột phải: tiến trình + lịch sử */}
            <div className="flex flex-col gap-6 lg:sticky lg:top-6">
              <Card className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">Tiến trình</h2>
                <StatusSteps currentOrder={s.currentStatus.sortOrder} />
              </Card>
              <Card className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">Lịch sử trạng thái</h2>
                {history.data?.length === 0 ? (
                  <p className="text-muted">Chưa có thay đổi nào.</p>
                ) : (
                  <HistoryList entries={history.data ?? []} />
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
