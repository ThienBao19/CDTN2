import { formatDateTime } from "@/lib/format";
import type { HistoryEntry } from "@/lib/types";

// Lịch sử trạng thái (FR-10); ghi chú và người cập nhật chỉ có ở phía nhân viên
export function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {entries.map((h) => (
        <li key={h.id} className="flex flex-col gap-1 rounded-xl border border-border bg-surface px-4 py-3">
          <div className="flex flex-wrap justify-between gap-2">
            <span className="font-medium">
              {h.status.label}
              {h.isOverride && <span className="ml-2 text-sm text-amber-600">(điều chỉnh)</span>}
            </span>
            <span className="text-muted">{formatDateTime(h.changedAt)}</span>
          </div>
          {(h.updatedBy || h.note) && (
            <span className="text-sm text-muted">
              {h.updatedBy?.fullName}
              {h.note ? ` · ${h.note}` : ""}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
