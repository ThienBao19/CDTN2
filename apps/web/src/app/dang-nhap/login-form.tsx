
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
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
      setError(
        err instanceof ApiError
          ? err.message
          : "Đăng nhập thất bại"
      );
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full min-h-12 rounded-xl border border-green-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#166534] focus:ring-2 focus:ring-green-100";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Email */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="identifier"
          className="text-sm font-semibold text-slate-700"
        >
          Email
        </label>

        <input
          id="identifier"
          name="identifier"
          type="email"
          required
          autoComplete="username"
          placeholder="Nhập địa chỉ email"
          className={inputClass}
        />
      </div>

      {/* Mật khẩu */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-sm font-semibold text-slate-700"
        >
          Mật khẩu
        </label>

        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          className={inputClass}
        />
      </div>

      {/* Thông báo hết phiên */}
      {isExpired && !error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Phiên làm việc đã kết thúc do không hoạt động.
          Vui lòng đăng nhập lại.
        </p>
      )}

      {/* Thông báo lỗi */}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {/* Nút đăng nhập */}
      <button
        type="submit"
        disabled={isLoading}
        className="min-h-12 w-full rounded-xl bg-[#166534] px-5 py-3 font-semibold text-white transition hover:bg-[#14532d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#166534] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      {/* Liên kết dành cho người nhà */}
      <p className="text-center text-sm text-slate-600">
        Người nhà bệnh nhân?{" "}
        <Link
          href="/nguoi-nha"
          className="font-semibold text-[#166534] hover:underline"
        >
          Vào xem bằng số điện thoại
        </Link>
      </p>
    </form>
  );
}
