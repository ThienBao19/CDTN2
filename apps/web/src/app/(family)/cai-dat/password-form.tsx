"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, ErrorText, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

export function PasswordForm() {
  const [error, setError] = useState("");
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    setError("");
    setIsDone(false);
    try {
      await api.put("/auth/password", {
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      });
      formEl.reset();
      setIsDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không đổi được mật khẩu");
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Đổi mật khẩu</h2>
        <Field id="currentPassword" name="currentPassword" label="Mật khẩu hiện tại" type="password" required autoComplete="current-password" />
        <Field id="newPassword" name="newPassword" label="Mật khẩu mới (tối thiểu 8 ký tự)" type="password" minLength={8} required autoComplete="new-password" />
        <ErrorText>{error}</ErrorText>
        {isDone && <p className="text-green-700">Đã đổi mật khẩu.</p>}
        <Button type="submit" variant="secondary">Lưu mật khẩu mới</Button>
      </form>
    </Card>
  );
}
