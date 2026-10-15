"use client";

import { useState } from "react";
import { Button, ErrorText } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

export function CancelPanel({ surgeryId, onCancelled }: { surgeryId: string; onCancelled: () => void }) {
  const [error, setError] = useState("");

  async function handleCancel(form: FormData) {
    setError("");
    try {
      await api.post(`/surgeries/${surgeryId}/cancel`, { reason: form.get("reason") });
      onCancelled();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không hủy được ca");
    }
  }

  return (
    <details className="rounded-xl border border-red-300 p-4">
      <summary className="cursor-pointer font-medium text-red-600">Hủy ca phẫu thuật</summary>
      <form action={handleCancel} className="mt-3 flex flex-col gap-3">
        <textarea name="reason" required placeholder="Lý do hủy ca" className="min-h-20 rounded-xl border border-border bg-surface px-4 py-2" />
        <ErrorText>{error}</ErrorText>
        <Button variant="danger" type="submit">Xác nhận hủy ca</Button>
      </form>
    </details>
  );
}
