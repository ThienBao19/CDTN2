"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ErrorText, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

// QR chứa đường dẫn /lien-ket?code=..., mở bằng camera điện thoại là điền sẵn mã
export function LinkForm() {
  const router = useRouter();
  const initialCode = useSearchParams().get("code") ?? "";
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    setError("");
    setIsLoading(true);
    try {
      const link = await api.post<{ surgeryId: string }>("/links", { code });
      router.replace(`/theo-doi/${link.surgeryId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không liên kết được");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field
        id="code"
        name="code"
        label="Mã theo dõi (8 ký tự)"
        defaultValue={initialCode}
        placeholder="VD: ABCD-EFGH"
        autoCapitalize="characters"
        autoComplete="off"
        className="min-h-14 rounded-xl border border-border bg-surface px-4 text-center font-mono text-2xl tracking-widest uppercase"
        required
      />
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Đang kiểm tra..." : "Theo dõi bệnh nhân"}
      </Button>
    </form>
  );
}
