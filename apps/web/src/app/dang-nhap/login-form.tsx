"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ErrorText, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { homeForRole } from "@/lib/format";
import type { User } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setIsLoading(true);
    try {
      const { user } = await api.post<{ user: User }>("/auth/login", {
        identifier: form.get("identifier"),
        password: form.get("password"),
      });
      // Chỉ chấp nhận đường dẫn nội bộ để tránh open redirect
      const target = next?.startsWith("/") && !next.startsWith("//") ? next : homeForRole(user.role);
      router.replace(target);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đăng nhập thất bại");
      setIsLoading(false);
    }
  }

  const registerHref = next ? `/dang-ky?next=${encodeURIComponent(next)}` : "/dang-ky";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field id="identifier" name="identifier" label="Email hoặc số điện thoại" required autoComplete="username" />
      <Field id="password" name="password" label="Mật khẩu" type="password" required autoComplete="current-password" />
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
      <p className="text-center text-muted">
        Người nhà chưa có tài khoản?{" "}
        <Link href={registerHref} className="font-semibold text-primary">
          Đăng ký
        </Link>
      </p>
    </form>
  );
}
