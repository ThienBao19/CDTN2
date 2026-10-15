"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, ErrorText, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

// Tạo tài khoản nhân viên y tế / quản trị viên (FR-12)
export function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const phone = String(form.get("phone") ?? "").trim();
    setError("");
    try {
      await api.post("/admin/users", {
        fullName: form.get("fullName"),
        email: form.get("email"),
        password: form.get("password"),
        role: form.get("role"),
        ...(phone ? { phone } : {}),
      });
      formEl.reset();
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tạo được tài khoản");
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">Tạo tài khoản nhân viên</h2>
        <Field id="fullName" name="fullName" label="Họ tên" required />
        <Field id="email" name="email" label="Email" type="email" required />
        <Field id="phone" name="phone" label="Số điện thoại (không bắt buộc)" />
        <Field id="password" name="password" label="Mật khẩu ban đầu" type="password" minLength={8} required autoComplete="new-password" />
        <label className="flex flex-col gap-1">
          <span className="font-medium">Vai trò</span>
          <select name="role" className="min-h-12 rounded-xl border border-border bg-surface px-3">
            <option value="STAFF">Nhân viên y tế</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </label>
        <div className="flex items-end">
          <Button type="submit" className="w-full">Tạo tài khoản</Button>
        </div>
        <div className="sm:col-span-2">
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
    </Card>
  );
}
