"use client";

import { useParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { HistoryList } from "@/components/history-list";
import { StatusSteps } from "@/components/status-steps";
import { Card, ErrorText } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { HistoryEntry, StatusRef, Surgery } from "@/lib/types";
import { useEvents } from "@/lib/use-events";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";
import { CancelPanel } from "./cancel-panel";
import { CodesPanel } from "./codes-panel";
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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <AppHeader title={s ? s.patient.fullName : "Chi tiết ca"} user={user} backHref="/staff" />
      <ErrorText>{surgery.error}</ErrorText>
      {s && (
        <>
          <Card className="flex flex-col gap-1">
            <span className="text-muted">Mã BN {s.patient.patientCode}</span>
            <span className="text-xl font-semibold">{s.title}</span>
            <span className="text-muted">
              {formatDateTime(s.scheduledAt)}
              {s.room ? ` · ${s.room.name}` : " · Chưa xếp phòng"}
            </span>
            {s.cancelledAt && (
              <span className="font-semibold text-red-600">Đã hủy: {s.cancelReason}</span>
            )}
          </Card>
          <StatusSteps currentOrder={s.currentStatus.sortOrder} />
          {canUpdateStatus && statuses && (
            <StatusPanel surgery={s} statuses={statuses} onChanged={reloadAll} />
          )}
          <CodesPanel surgeryId={s.id} canIssue={isActive && !isFinal} />
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Lịch sử trạng thái</h2>
            <HistoryList entries={history.data ?? []} />
          </section>
          {isActive && <EditPanel surgery={s} onSaved={reloadAll} />}
          {isActive && !isFinal && <CancelPanel surgeryId={s.id} onCancelled={reloadAll} />}
        </>
      )}
    </main>
  );
}
