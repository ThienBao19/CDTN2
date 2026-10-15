"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, ErrorText, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { usePolling } from "@/lib/use-polling";

type AdminRoom = { id: string; name: string; type: string; location: string | null; isActive: boolean };

const TYPE_LABELS: Record<string, string> = {
  OPERATING: "Phòng mổ",
  RECOVERY: "Hồi sức",
  WAITING: "Khu chờ",
  OTHER: "Khác",
};

export function RoomsSection() {
  const { data: rooms, reload } = usePolling<AdminRoom[]>("/admin/rooms");
  const [error, setError] = useState("");

  async function run(task: () => Promise<unknown>) {
    setError("");
    try {
      await task();
      void reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không lưu được");
    }
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const location = String(form.get("location") ?? "").trim();
    void run(async () => {
      await api.post("/admin/rooms", { name: form.get("name"), type: form.get("type"), ...(location ? { location } : {}) });
      formEl.reset();
    });
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Phòng và khu vực</h2>
      <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-4">
        <Field id="name" name="name" label="Tên phòng" required />
        <label className="flex flex-col gap-1">
          <span className="font-medium">Loại</span>
          <select name="type" className="min-h-12 rounded-xl border border-border bg-surface px-3">
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <Field id="location" name="location" label="Vị trí" />
        <div className="flex items-end">
          <Button type="submit" className="w-full">Thêm phòng</Button>
        </div>
      </form>
      <ErrorText>{error}</ErrorText>
      <ul className="flex flex-col gap-2">
        {rooms?.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-2">
            <span className={r.isActive ? "" : "text-muted line-through"}>
              {r.name} · {TYPE_LABELS[r.type] ?? r.type}
              {r.location ? ` · ${r.location}` : ""}
            </span>
            <button
              type="button"
              onClick={() => void run(() => api.put(`/admin/rooms/${r.id}`, { isActive: !r.isActive }))}
              className="text-primary"
            >
              {r.isActive ? "Ngừng sử dụng" : "Dùng lại"}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
