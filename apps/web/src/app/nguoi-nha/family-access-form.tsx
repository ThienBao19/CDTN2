
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";

// Người nhà truy cập bằng thông tin đã đăng ký với nhân viên y tế
export function FamilyAccessForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    setError("");
    setIsLoading(true);

    try {
      await api.post("/auth/family-access", {
        phone: form.get("phone"),
        fullName: form.get("fullName"),
        patientName: form.get("patientName"),
      });

      router.replace("/theo-doi");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Không vào được, vui lòng thử lại"
      );
      setIsLoading(false);
    }
  }

  const inputClass =
    "min-h-12 w-full rounded-xl border border-green-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#166534] focus:ring-2 focus:ring-green-100";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Số điện thoại */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="phone"
          className="text-sm font-semibold text-slate-700"
        >
          Số điện thoại của bạn
        </label>

        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="Nhập số điện thoại đã đăng ký"
          className={inputClass}
        />
      </div>

      {/* Họ tên người nhà */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="fullName"
          className="text-sm font-semibold text-slate-700"
        >
          Họ tên của bạn
        </label>

        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          placeholder="Nhập họ và tên của bạn"
          className={inputClass}
        />
      </div>

      {/* Họ tên bệnh nhân */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="patientName"
          className="text-sm font-semibold text-slate-700"
        >
          Họ tên bệnh nhân
        </label>

        <input
          id="patientName"
          name="patientName"
          type="text"
          autoComplete="off"
          required
          placeholder="Nhập họ và tên bệnh nhân"
          className={inputClass}
        />
      </div>

      <p className="text-sm text-slate-500">
        Gõ có dấu hay không dấu đều được.
      </p>

      {/* Thông báo lỗi */}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {/* Nút tra cứu */}
      <button
        type="submit"
        disabled={isLoading}
        className="min-h-12 w-full rounded-xl bg-[#166534] px-5 py-3 font-semibold text-white transition hover:bg-[#14532d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#166534] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading
          ? "Đang kiểm tra..."
          : "Xem tình trạng bệnh nhân"}
      </button>
    </form>
  );
}
