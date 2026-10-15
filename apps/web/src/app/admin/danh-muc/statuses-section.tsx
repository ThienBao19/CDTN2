"use client";

import { useState } from "react";
import { Button, Card, ErrorText } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { usePolling } from "@/lib/use-polling";

type AdminStatus = { id: number; code: string; label: string; sortOrder: number; notificationMessage: string };

const INPUT = "min-h-11 rounded-lg border border-border bg-surface px-3";

// Danh mục trạng thái và nội dung thông báo (mục 12.3); mã và thứ tự giữ cố định
export function StatusesSection() {
  const { data: statuses, reload } = usePolling<AdminStatus[]>("/admin/statuses");
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState<number | null>(null);

  async function handleSave(id: number, form: FormData) {
    setError("");
    setSavedId(null);
    try {
      await api.put(`/admin/statuses/${id}`, {
        label: form.get("label"),
        notificationMessage: form.get("notificationMessage"),
      });
      setSavedId(id);
      void reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được");
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Trạng thái và nội dung thông báo</h2>
      <p className="text-sm text-muted">Nội dung thông báo hiện trên màn hình khóa: không ghi tên hay thông tin y tế.</p>
      <ErrorText>{error}</ErrorText>
      {statuses?.map((s) => (
        <form key={s.id} action={(form) => void handleSave(s.id, form)} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[2rem_1fr_2fr_auto]">
          <span className="self-center font-bold">{s.sortOrder}</span>
          <input name="label" defaultValue={s.label} required className={INPUT} aria-label="Tên hiển thị" />
          <input name="notificationMessage" defaultValue={s.notificationMessage} required className={INPUT} aria-label="Nội dung thông báo" />
          <Button type="submit" variant="secondary">{savedId === s.id ? "Đã lưu" : "Lưu"}</Button>
        </form>
      ))}
    </Card>
  );
}
