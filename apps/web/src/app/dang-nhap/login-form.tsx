"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ErrorText, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { safeNextPath } from "@/lib/format";
import type { User } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const isExpired = params.has("het-phien");
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
      router.replace(safeNextPath(next, user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đăng nhập thất bại");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field id="identifier" name="identifier" label="Email" required autoComplete="username" />
      <Field id="password" name="password" label="Mật khẩu" type="password" required autoComplete="current-password" />
      {isExpired && !error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-amber-800">
          Phiên làm việc đã kết thúc do không hoạt động. Vui lòng đăng nhập lại.
        </p>
      )}
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
      <p className="text-center text-muted">
        Người nhà bệnh nhân?{" "}
        <Link href="/nguoi-nha" className="font-semibold text-primary">
          Vào xem bằng số điện thoại
        </Link>
      </p>
    </form>
  );
}
