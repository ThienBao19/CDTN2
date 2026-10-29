"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ErrorText, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

// Người nhà vào xem: không mật khẩu, không email; thông tin phải khớp với đăng ký của nhân viên
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
      setError(err instanceof ApiError ? err.message : "Không vào được, vui lòng thử lại");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field id="phone" name="phone" label="Số điện thoại của bạn" type="tel" inputMode="tel" autoComplete="tel" required />
      <Field id="fullName" name="fullName" label="Họ tên của bạn" autoComplete="name" required />
      <Field id="patientName" name="patientName" label="Họ tên bệnh nhân" autoComplete="off" required />
      <p className="text-sm text-muted">Gõ có dấu hay không dấu đều được.</p>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Đang kiểm tra..." : "Xem tình trạng bệnh nhân"}
      </Button>
    </form>
  );
}
