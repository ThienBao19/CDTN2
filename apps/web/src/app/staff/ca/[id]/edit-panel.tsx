"use client";

import { useState, type FormEvent } from "react";
import { Button, ErrorText, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Room, Surgery } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

// Giá trị cho ô datetime-local theo giờ của máy (nhân viên ở Việt Nam)
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// FR-04: cập nhật tên ca, giờ dự kiến, phòng; đổi giờ/phòng sẽ báo cho người nhà
export function EditPanel({ surgery, onSaved }: { surgery: Surgery; onSaved: () => void }) {
  const { data: rooms } = usePolling<Room[]>("/rooms");
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const roomId = String(form.get("roomId") ?? "");
    setError("");
    setIsSaved(false);
    try {
      await api.put(`/surgeries/${surgery.id}`, {
        title: form.get("title"),
        scheduledAt: new Date(String(form.get("scheduledAt"))).toISOString(),
        ...(roomId ? { roomId } : {}),
      });
      setIsSaved(true);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được");
    }
  }

  return (
    <details className="rounded-xl border border-border p-4">
      <summary className="cursor-pointer font-medium">Sửa thông tin ca (tên, giờ, phòng)</summary>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
        <Field id="edit-title" name="title" label="Tên ca" defaultValue={surgery.title} required />
        <Field
          id="edit-scheduledAt"
          name="scheduledAt"
          label="Giờ dự kiến"
          type="datetime-local"
          defaultValue={toLocalInput(surgery.scheduledAt)}
          required
        />
        <label className="flex flex-col gap-1">
          <span className="font-medium">Phòng mổ</span>
          <select name="roomId" defaultValue={surgery.room?.id ?? ""} className="min-h-12 rounded-xl border border-border bg-surface px-3">
            <option value="">Giữ nguyên</option>
            {rooms?.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>
        <ErrorText>{error}</ErrorText>
        {isSaved && <p className="text-green-700">Đã lưu. Người nhà được báo nếu giờ hoặc phòng thay đổi.</p>}
        <Button type="submit" variant="secondary">Lưu thay đổi</Button>
      </form>
    </details>
  );
}
