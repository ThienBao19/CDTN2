"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, ErrorText, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { FamilyContact } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

// Nhân viên đăng ký người nhà được theo dõi ca: SĐT + họ tên (người nhà không cần tài khoản)
export function FamilyContactsPanel({ surgeryId, canAdd }: { surgeryId: string; canAdd: boolean }) {
  const { data: contacts, reload } = usePolling<FamilyContact[]>(`/surgeries/${surgeryId}/family-contacts`);
  const [error, setError] = useState("");
  const [added, setAdded] = useState("");

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setError("");
    setAdded("");
    try {
      const contact = await api.post<FamilyContact>(`/surgeries/${surgeryId}/family-contacts`, {
        phone: form.get("phone"),
        fullName: form.get("fullName"),
      });
      formEl.reset();
      setAdded(`Đã đăng ký ${contact.fullName} (${contact.phone}).`);
      void reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không đăng ký được");
    }
  }

  async function handleRemove(contact: FamilyContact) {
    if (!window.confirm(`Gỡ quyền theo dõi của ${contact.fullName}?`)) return;
    await api.delete(`/links/${contact.id}`).catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Không gỡ được");
    });
    void reload();
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Người nhà được theo dõi</h2>
      {canAdd && (
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
          <Field id="contact-phone" name="phone" label="Số điện thoại" type="tel" required />
          <Field id="contact-name" name="fullName" label="Họ tên người nhà" required />
          <div className="flex items-end">
            <Button type="submit" variant="secondary" className="w-full">Đăng ký</Button>
          </div>
        </form>
      )}
      <ErrorText>{error}</ErrorText>
      {added && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-green-800">
          {added} Người nhà vào xem bằng số điện thoại, họ tên của mình và họ tên bệnh nhân.
        </p>
      )}
      {contacts?.length === 0 && <p className="text-muted">Chưa đăng ký người nhà nào.</p>}
      <ul className="flex flex-col gap-2">
        {contacts?.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-2">
            <span className={c.status === "ACTIVE" ? "" : "text-muted line-through"}>
              {c.fullName} · {c.phone}
              <span className="ml-2 text-sm text-muted">
                đăng ký {formatDateTime(c.linkedAt)}{c.addedBy ? ` bởi ${c.addedBy}` : ""}
              </span>
            </span>
            {c.status === "ACTIVE" ? (
              <button type="button" onClick={() => void handleRemove(c)} className="text-red-600">
                Gỡ quyền
              </button>
            ) : (
              <span className="text-sm text-muted">Đã gỡ</span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
