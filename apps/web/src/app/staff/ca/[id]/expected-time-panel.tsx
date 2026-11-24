
"use client";

import { useEffect, useState } from "react";
import { Button, Card, ErrorText } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Surgery } from "@/lib/types";

type ExpectedTimePanelProps = {
  surgery: Surgery;
  onSaved: () => void;
};

export function ExpectedTimePanel({
  surgery,
  onSaved,
}: ExpectedTimePanelProps) {
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const defaultMinutes =
    surgery.currentStatus.expectedMinutes ?? null;

  const customMinutes = surgery.expectedMinutes ?? null;

  const appliedMinutes = customMinutes ?? defaultMinutes;

  // Đồng bộ ô nhập khi dữ liệu ca được tải lại.
  useEffect(() => {
    setMinutes(
      surgery.expectedMinutes == null
        ? ""
        : String(surgery.expectedMinutes)
    );
    setError("");
    setSuccess("");
  }, [surgery.id, surgery.expectedMinutes, surgery.currentStatus.id]);

  async function handleSave() {
    setError("");
    setSuccess("");

    const raw = minutes.trim();
    const value = Number(raw);

    if (
      raw === "" ||
      !Number.isSafeInteger(value) ||
      value <= 0 ||
      value > 2147483647
    ) {
      setError("Vui lòng nhập số phút nguyên dương hợp lệ.");
      return;
    }

    setSaving(true);

    try {
      await api.put(`/surgeries/${surgery.id}`, {
        expectedMinutes: value,
      });

      setSuccess("Đã lưu thời gian dự kiến riêng.");
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Không lưu được thời gian dự kiến."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUseDefault() {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await api.put(`/surgeries/${surgery.id}`, {
        expectedMinutes: null,
      });

      setMinutes("");
      setSuccess("Đã chuyển về thời gian mặc định.");
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Không thể sử dụng thời gian mặc định."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">
          Thời gian dự kiến
        </h2>
        <p className="mt-1 text-sm text-muted">
          Điều chỉnh thời gian cho giai đoạn hiện tại
          của ca phẫu thuật.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-background p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted">
            Giai đoạn hiện tại
          </span>
          <span className="text-right font-semibold">
            {surgery.currentStatus.label}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted">
            Mặc định của Admin
          </span>
          <span className="font-semibold">
            {defaultMinutes !== null
              ? `${defaultMinutes} phút`
              : "Chưa thiết lập"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted">
            Thời gian đang áp dụng
          </span>
          <span className="font-semibold text-green-700">
            {appliedMinutes !== null
              ? `${appliedMinutes} phút`
              : "Chưa thiết lập"}
          </span>
        </div>

        {customMinutes !== null && (
          <p className="text-xs text-muted">
            Ca này đang sử dụng thời gian riêng
            do nhân viên điều chỉnh.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={`expected-minutes-${surgery.id}`}
          className="font-medium"
        >
          Thời gian riêng (phút)
        </label>

        <input
          id={`expected-minutes-${surgery.id}`}
          type="number"
          min={1}
          max={2147483647}
          step={1}
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          placeholder="Ví dụ: 90"
          disabled={saving}
          className="min-h-12 w-full rounded-xl border border-border bg-surface px-3"
        />

        <p className="text-sm text-muted">
          Thời gian riêng chỉ áp dụng cho giai đoạn
          hiện tại. Khi chuyển giai đoạn, hệ thống
          sẽ sử dụng thời gian mặc định mới.
        </p>
      </div>

      <ErrorText>{error}</ErrorText>

      {success && (
        <p role="status" className="text-sm font-medium text-green-700">
          {success}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={saving || customMinutes === null}
          onClick={() => void handleUseDefault()}
        >
          Dùng mặc định
        </Button>

        <Button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
        >
          {saving ? "Đang lưu..." : "Lưu thời gian"}
        </Button>
      </div>
    </Card>
  );
}
