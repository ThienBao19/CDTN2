"use client";

import { useState } from "react";
import { Button, Card, ErrorText } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { StatusRef, Surgery } from "@/lib/types";

type Props = {
  surgery: Surgery;
  statuses: StatusRef[];
  onChanged: () => void;
};

// Một nút lớn chuyển sang trạng thái kế tiếp, xác nhận trước khi gửi (mục 12.4)
export function StatusPanel({ surgery, statuses, onChanged }: Props) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const next = statuses.find((s) => s.sortOrder === surgery.currentStatus.sortOrder + 1);

  async function send(body: { statusCode: string; override?: boolean; note?: string }) {
    setError("");
    setIsSaving(true);
    try {
      await api.post(`/surgeries/${surgery.id}/status`, body);
      setIsConfirming(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không cập nhật được");
    } finally {
      setIsSaving(false);
    }
  }

  function handleOverride(form: FormData) {
    void send({
      statusCode: String(form.get("statusCode")),
      note: String(form.get("note") ?? ""),
      override: true,
    });
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Cập nhật trạng thái</h2>
      {!next && <p className="text-muted">Ca đã ở trạng thái cuối.</p>}
      {next && !isConfirming && (
        <Button className="min-h-16 text-xl" onClick={() => setIsConfirming(true)}>
          Chuyển sang: {next.label}
        </Button>
      )}
      {next && isConfirming && (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-primary p-4">
          <p className="text-lg">
            Xác nhận chuyển sang <strong>{next.label}</strong>? Người nhà sẽ nhận thông báo.
          </p>
          <div className="flex gap-3">
            <Button disabled={isSaving} onClick={() => void send({ statusCode: next.code })}>
              Xác nhận
            </Button>
            <Button variant="secondary" onClick={() => setIsConfirming(false)}>
              Hủy
            </Button>
          </div>
        </div>
      )}
      <ErrorText>{error}</ErrorText>
      <details className="rounded-xl border border-border p-4">
        <summary className="cursor-pointer font-medium">Điều chỉnh (quay lui / bỏ bước)</summary>
        <form action={handleOverride} className="mt-3 flex flex-col gap-3">
          <select name="statusCode" className="min-h-12 rounded-xl border border-border bg-surface px-3">
            {statuses
              .filter((s) => s.code !== surgery.currentStatus.code)
              .map((s) => (
                <option key={s.code} value={s.code}>{s.label}</option>
              ))}
          </select>
          <textarea
            name="note"
            required
            placeholder="Lý do điều chỉnh (bắt buộc)"
            className="min-h-20 rounded-xl border border-border bg-surface px-4 py-2"
          />
          <Button variant="secondary" type="submit" disabled={isSaving}>
            Lưu điều chỉnh
          </Button>
        </form>
      </details>
    </Card>
  );
}
