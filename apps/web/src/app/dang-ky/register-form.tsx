"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ErrorText, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

// Đăng ký tài khoản người nhà bằng email hoặc số điện thoại (FR-01)
export function RegisterForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const contact = String(form.get("contact") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (password !== form.get("confirm")) {
      setError("Mật khẩu nhập lại không khớp");
      return;
    }
    const isEmail = contact.includes("@");
    setError("");
    setIsLoading(true);
    try {
      await api.post("/auth/register", {
        fullName: form.get("fullName"),
        ...(isEmail ? { email: contact } : { phone: contact }),
        password,
      });
      await api.post("/auth/login", { identifier: contact, password });
      router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/theo-doi");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đăng ký thất bại");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field id="fullName" name="fullName" label="Họ tên" required autoComplete="name" />
      <Field id="contact" name="contact" label="Số điện thoại hoặc email" required autoComplete="username" />
      <Field id="password" name="password" label="Mật khẩu (tối thiểu 8 ký tự)" type="password" minLength={8} required autoComplete="new-password" />
      <Field id="confirm" name="confirm" label="Nhập lại mật khẩu" type="password" required autoComplete="new-password" />
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
      </Button>
    </form>
  );
}
