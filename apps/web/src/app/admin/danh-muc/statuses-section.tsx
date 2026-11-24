
"use client";

import { useState } from "react";
import { Button, Card, ErrorText } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { usePolling } from "@/lib/use-polling";

type AdminStatus = {
  id: number;
  code: string;
  label: string;
  sortOrder: number;
  notificationMessage: string;
  expectedMinutes: number | null;
};

const INPUT =
  "min-h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3";

// Danh mục trạng thái và nội dung thông báo (mục 12.3).
// Mã và thứ tự trạng thái được giữ cố định.
export function StatusesSection() {
  const { data: statuses, reload } =
    usePolling<AdminStatus[]>("/admin/statuses");

  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  async function handleSave(id: number, form: FormData) {
    setError("");
    setSavedId(null);

    const rawMinutes = String(
      form.get("expectedMinutes") ?? ""
    ).trim();

    let expectedMinutes: number | null = null;

    if (rawMinutes !== "") {
      const minutes = Number(rawMinutes);

      if (
        !Number.isSafeInteger(minutes) ||
        minutes <= 0 ||
        minutes > 2147483647
      ) {
        setError(
          "Thời gian dự kiến phải là số nguyên dương hợp lệ."
        );
        return;
      }

      expectedMinutes = minutes;
    }

    setSavingId(id);

    try {
      await api.put(`/admin/statuses/${id}`, {
        label: form.get("label"),
        notificationMessage: form.get("notificationMessage"),
        expectedMinutes,
      });

      setSavedId(id);
      await reload();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Không lưu được trạng thái."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">
        Trạng thái và nội dung thông báo
      </h2>

      <p className="text-sm text-muted">
        Nội dung thông báo hiện trên màn hình khóa:
        không ghi tên hay thông tin y tế.
      </p>

      <p className="text-sm text-muted">
        Thời gian dự kiến được tính bằng phút.
        Để trống nếu không muốn thiết lập thời gian
        mặc định cho giai đoạn.
      </p>

      <ErrorText>{error}</ErrorText>

      {statuses?.map((s) => (
        <form
          key={s.id}
          action={(form) => void handleSave(s.id, form)}
          className="grid gap-3 rounded-lg border border-border p-3 lg:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,0.8fr)_auto]"
        >
          <span className="self-center font-bold">
            {s.sortOrder}
          </span>

          <div className="flex min-w-0 flex-col gap-1">
            <label
              htmlFor={`status-label-${s.id}`}
              className="text-sm text-muted"
            >
              Tên trạng thái
            </label>

            <input
              id={`status-label-${s.id}`}
              name="label"
              defaultValue={s.label}
              required
              maxLength={100}
              className={INPUT}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <label
              htmlFor={`status-message-${s.id}`}
              className="text-sm text-muted"
            >
              Nội dung thông báo
            </label>

            <input
              id={`status-message-${s.id}`}
              name="notificationMessage"
              defaultValue={s.notificationMessage}
              required
              maxLength={200}
              className={INPUT}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1">
            <label
              htmlFor={`status-minutes-${s.id}`}
              className="text-sm text-muted"
            >
              Dự kiến (phút)
            </label>

            <input
              id={`status-minutes-${s.id}`}
              name="expectedMinutes"
              type="number"
              min={1}
              max={2147483647}
              step={1}
              defaultValue={s.expectedMinutes ?? ""}
              placeholder="Chưa đặt"
              className={INPUT}
            />
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              variant="secondary"
              disabled={savingId === s.id}
            >
              {savingId === s.id
                ? "Đang lưu..."
                : savedId === s.id
                  ? "Đã lưu"
                  : "Lưu"}
            </Button>
          </div>
        </form>
      ))}
    </Card>
  );
}
