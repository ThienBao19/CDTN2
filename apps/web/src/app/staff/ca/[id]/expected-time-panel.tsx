
"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, ErrorText } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Surgery } from "@/lib/types";

type ExpectedTimePanelProps = {
  surgery: Surgery;
  onSaved: () => void;
};

type OverdueNotificationResponse = {
  success: boolean;
  recipientCount: number;
  message: string;
};

export function ExpectedTimePanel({
  surgery,
  onSaved,
}: ExpectedTimePanelProps) {
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Trạng thái thao tác gửi thông báo.
  const [sending, setSending] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [notificationSuccess, setNotificationSuccess] = useState("");

  // Ngăn gửi nhiều yêu cầu cùng lúc.
  const sendingRef = useRef(false);

  const defaultMinutes =
    surgery.currentStatus.expectedMinutes ?? null;

  const customMinutes = surgery.expectedMinutes ?? null;

  const appliedMinutes = customMinutes ?? defaultMinutes;

  const expectedFinishAt = surgery.expectedFinishAt ?? null;

  const isOverdue = surgery.isOverdue === true;

  const overdueMinutes = surgery.overdueMinutes ?? 0;

  // Nhận diện lần bắt đầu giai đoạn hiện tại.
  const stageKey = [
    surgery.id,
    surgery.currentStatus.id,
    surgery.stageStartedAt ?? "",
  ].join(":");

  // Sử dụng trạng thái thông báo từ Backend.
  // Không phụ thuộc vào React State nên không mất khi F5.
  const notificationStateReady =
    typeof surgery.overdueNotificationSent === "boolean" &&
    typeof surgery.overdueNotificationRecipientCount === "number" &&
    typeof surgery.overdueNotificationPendingCount === "number" &&
    typeof surgery.overdueNotificationTotalRecipients === "number";

  const notificationSent =
    surgery.overdueNotificationSent === true;

  const recipientCount =
    surgery.overdueNotificationRecipientCount ?? 0;

  const pendingCount =
    surgery.overdueNotificationPendingCount ?? 0;

  const totalRecipients =
    surgery.overdueNotificationTotalRecipients ?? 0;

  const hasRecipients = totalRecipients > 0;

  const canSendNotification =
    notificationStateReady &&
    isOverdue &&
    !surgery.cancelledAt &&
    !notificationSent &&
    hasRecipients &&
    pendingCount > 0;

  const busy = saving || sending;

  // Khóa nút tạm thời sau khi gửi thành công,
  // trong lúc chờ dữ liệu mới từ Backend.
  const [awaitingRefresh, setAwaitingRefresh] =
    useState<{
      stageKey: string;
      previousRecipientCount: number;
    } | null>(null);

  const waitingForNotificationState =
    awaitingRefresh !== null &&
    awaitingRefresh.stageKey === stageKey &&
    recipientCount <= awaitingRefresh.previousRecipientCount &&
    !notificationSent &&
    pendingCount > 0;

  // Đồng bộ ô nhập khi dữ liệu ca được tải lại.
  useEffect(() => {
    setMinutes(
      surgery.expectedMinutes == null
        ? ""
        : String(surgery.expectedMinutes)
    );

    setError("");
    setSuccess("");
  }, [
    surgery.id,
    surgery.expectedMinutes,
    surgery.currentStatus.id,
    surgery.stageStartedAt,
  ]);

  // Xóa phản hồi của thông báo khi chuyển giai đoạn.
  useEffect(() => {
    setNotificationError("");
    setNotificationSuccess("");
    setAwaitingRefresh(null);
  }, [stageKey]);

  // Bỏ khóa tạm thời khi Backend đã cập nhật trạng thái.
  useEffect(() => {
    if (awaitingRefresh === null) {
      return;
    }

    if (
      awaitingRefresh.stageKey !== stageKey ||
      recipientCount > awaitingRefresh.previousRecipientCount ||
      notificationSent ||
      pendingCount === 0
    ) {
      setAwaitingRefresh(null);
    }
  }, [
    awaitingRefresh,
    stageKey,
    recipientCount,
    notificationSent,
    pendingCount,
  ]);

  // Xóa phản hồi lỗi cũ nếu Backend xác nhận đã gửi hết.
  useEffect(() => {
    if (notificationSent) {
      setNotificationError("");
    }
  }, [notificationSent]);

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

  // Chỉ gửi khi nhân viên chủ động xác nhận.
  async function handleSendNotification() {
    if (
      !canSendNotification ||
      sendingRef.current ||
      busy ||
      waitingForNotificationState
    ) {
      return;
    }

    setNotificationError("");
    setNotificationSuccess("");

    const confirmed = window.confirm(
      `Bạn có muốn gửi thông báo cho ${pendingCount} người nhà chưa nhận thông báo không?\n\n` +
        "Nội dung thông báo:\n" +
        "Giai đoạn hiện tại đang kéo dài hơn dự kiến. " +
        "Nhân viên y tế sẽ cập nhật thông tin khi có thay đổi. " +
        "Mong quý khách thông cảm."
    );

    if (!confirmed) {
      return;
    }

    sendingRef.current = true;
    setSending(true);

    try {
      const result =
        await api.post<OverdueNotificationResponse>(
          `/surgeries/${surgery.id}/overdue-notification`
        );

      if (!result.success) {
        setNotificationError(
          "Không thể tạo thông báo cho người nhà."
        );
        return;
      }

      setAwaitingRefresh({
        stageKey,
        previousRecipientCount: recipientCount,
      });

      setNotificationSuccess(
        `Đã tạo thông báo cho ${result.recipientCount} người nhà.`
      );

      // Tải lại dữ liệu để lấy trạng thái mới từ Backend.
      onSaved();
    } catch (err) {
      setNotificationError(
        err instanceof ApiError
          ? err.message
          : "Không thể gửi thông báo. Vui lòng thử lại."
      );

      // Có thể nhân viên khác vừa gửi thông báo,
      // hoặc dữ liệu ca đã thay đổi.
      // Tải lại để đồng bộ trạng thái mới nhất.
      onSaved();
    } finally {
      sendingRef.current = false;
      setSending(false);
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

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-sm text-muted">
            Dự kiến hoàn thành
          </span>

          <span
            className={`text-right font-semibold ${
              isOverdue
                ? "text-[#b91c1c]"
                : "text-green-700"
            }`}
          >
            {expectedFinishAt
              ? formatDateTime(expectedFinishAt)
              : "Chưa xác định"}
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
          disabled={busy}
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
        <p
          role="status"
          className="text-sm font-medium text-green-700"
        >
          {success}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={busy || customMinutes === null}
          onClick={() => void handleUseDefault()}
        >
          Dùng mặc định
        </Button>

        <Button
          type="button"
          disabled={busy}
          onClick={() => void handleSave()}
        >
          {saving ? "Đang lưu..." : "Lưu thời gian"}
        </Button>
      </div>

      {/* Cảnh báo và gửi thông báo khi ca quá giờ */}
      {isOverdue && !surgery.cancelledAt && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4">
          <div className="flex items-center gap-2 text-[#991b1b]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 shrink-0"
              aria-hidden="true"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>

            <h3 className="font-semibold">
              Ca phẫu thuật đã quá giờ
            </h3>
          </div>

          <p className="text-sm text-[#991b1b]">
            Giai đoạn hiện tại đã vượt quá thời gian
            dự kiến{" "}
            <strong>
              {overdueMinutes > 0
                ? `${overdueMinutes} phút`
                : "chưa đến 1 phút"}
            </strong>
            .
          </p>

          {/* Chưa lấy được trạng thái từ Backend */}
          {!notificationStateReady && (
            <div className="rounded-lg border border-[#fecaca] bg-white p-3">
              <p className="text-sm text-[#991b1b]">
                Chưa xác định được trạng thái thông báo.
                Vui lòng tải lại thông tin ca phẫu thuật.
              </p>

              <button
                type="button"
                disabled={busy}
                onClick={onSaved}
                className="mt-2 text-sm font-semibold text-[#991b1b] underline disabled:opacity-60"
              >
                Tải lại thông tin
              </button>
            </div>
          )}

          {/* Chưa có người nhà đăng ký theo dõi */}
          {notificationStateReady && !hasRecipients && (
            <div className="rounded-lg border border-[#fecaca] bg-white p-3">
              <p className="text-sm font-medium text-[#991b1b]">
                Chưa có người nhà đăng ký theo dõi.
              </p>

              <p className="mt-1 text-xs text-[#991b1b]">
                Vui lòng đăng ký người nhà trước khi
                gửi thông báo quá giờ.
              </p>
            </div>
          )}

          {/* Đã gửi thông báo cho tất cả người nhà */}
          {notificationStateReady && notificationSent && (
            <div
              role="status"
              className="flex flex-col gap-2 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3"
            >
              <div className="flex items-center gap-2 text-[#166534]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m8 12 3 3 5-6" />
                </svg>

                <span className="text-sm font-semibold">
                  Đã gửi thông báo
                </span>
              </div>

              <p className="text-sm text-[#166534]">
                Đã tạo thông báo quá giờ cho{" "}
                <strong>
                  {recipientCount}/{totalRecipients}
                </strong>{" "}
                người nhà đang theo dõi.
              </p>

              <p className="text-xs text-[#166534]">
                Hệ thống không gửi lại thông báo cho
                cùng người nhà trong lần vào giai đoạn này.
              </p>
            </div>
          )}

          {/* Vẫn còn người nhà chưa được gửi thông báo */}
          {notificationStateReady &&
            hasRecipients &&
            !notificationSent && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-[#991b1b]">
                  Nhân viên y tế có thể chủ động gửi thông báo
                  để người nhà nắm được tình hình cập nhật.
                </p>

                <div className="rounded-lg border border-[#fecaca] bg-white p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#991b1b]">
                      Tổng số người nhà
                    </span>

                    <strong className="text-[#991b1b]">
                      {totalRecipients}
                    </strong>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#166534]">
                      Đã gửi thông báo
                    </span>

                    <strong className="text-[#166534]">
                      {recipientCount}
                    </strong>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-[#991b1b]">
                      Chưa gửi thông báo
                    </span>

                    <strong className="text-[#991b1b]">
                      {pendingCount}
                    </strong>
                  </div>
                </div>
              </div>
            )}

          <button
            type="button"
            disabled={
              busy ||
              !canSendNotification ||
              waitingForNotificationState
            }
            onClick={() => void handleSendNotification()}
            className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
              notificationSent
                ? "border-[#d1d5db] bg-[#e5e7eb] text-[#6b7280]"
                : "border-[#fca5a5] bg-white text-[#991b1b] hover:bg-[#fee2e2] disabled:opacity-60"
            }`}
          >
            {notificationSent ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
            )}

            {sending
              ? "Đang gửi thông báo..."
              : notificationSent
                ? "Đã gửi thông báo"
                : waitingForNotificationState
                  ? "Đang cập nhật trạng thái..."
                  : !notificationStateReady
                    ? "Chưa xác định trạng thái"
                    : !hasRecipients
                      ? "Chưa có người nhà theo dõi"
                      : recipientCount > 0
                        ? `Gửi bổ sung cho ${pendingCount} người nhà`
                        : "Gửi thông báo cho người nhà"}
          </button>

          {waitingForNotificationState && (
            <button
              type="button"
              disabled={busy}
              onClick={onSaved}
              className="text-sm font-medium text-[#991b1b] underline disabled:opacity-60"
            >
              Tải lại trạng thái thông báo
            </button>
          )}

          {notificationError && (
            <p
              role="alert"
              className="rounded-lg bg-white p-3 text-sm font-medium text-[#b91c1c]"
            >
              {notificationError}
            </p>
          )}

          {notificationSuccess && !notificationSent && (
            <div
              role="status"
              className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-sm font-medium text-[#166534]"
            >
              {notificationSuccess}
            </div>
          )}

          <p className="text-xs text-[#991b1b]">
            Thông báo chỉ được gửi khi nhân viên chủ động
            xác nhận. Hệ thống không tự động chuyển trạng thái ca.
          </p>
        </div>
      )}
    </Card>
  );
}
