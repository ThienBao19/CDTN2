"use client";

import Link from "next/link";
import { useState } from "react";
import { SURGERY_STATUSES } from "@pt/shared";
import { AppHeader } from "@/components/app-header";
import { StatusBadge } from "@/components/status-badge";
import { ErrorText } from "@/components/ui";
import { formatTime, todayVN } from "@/lib/format";
import type { Room, Surgery } from "@/lib/types";
import { useEvents } from "@/lib/use-events";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";

const REFRESH_MS = 30_000;

const SELECT_CLASS =
  "min-h-12 w-full rounded-xl border border-border bg-surface px-3";

// Kiểm tra ca đang hoạt động và đã quá giờ.
function isSurgeryOverdue(surgery: Surgery): boolean {
  return (
    !surgery.cancelledAt &&
    surgery.currentStatus.code !== "COMPLETED" &&
    surgery.isOverdue === true
  );
}

// Hiển thị thời gian dự kiến theo giờ Việt Nam.
function formatExpectedFinish(value: string): string {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Không xác định";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hourCycle: "h23",
  }).format(date);
}

// Thông tin thời gian dự kiến và cảnh báo quá giờ.
// Sử dụng chung cho giao diện Desktop và Mobile.
function SurgeryTiming({ surgery }: { surgery: Surgery }) {
  if (
    surgery.cancelledAt ||
    surgery.currentStatus.code === "COMPLETED"
  ) {
    return null;
  }

  const overdue = isSurgeryOverdue(surgery);
  const overdueMinutes = surgery.overdueMinutes ?? 0;

  if (!surgery.expectedFinishAt && !overdue) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-col items-start gap-1">
      {overdue && (
        <span className="inline-flex items-center gap-1 rounded-lg border border-[#fecaca] bg-[#fee2e2] px-2 py-1 text-xs font-semibold text-[#991b1b]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>

          {overdueMinutes > 0
            ? `Quá giờ ${overdueMinutes} phút`
            : "Đã quá giờ"}
        </span>
      )}

      {surgery.expectedFinishAt && (
        <span className="text-xs leading-relaxed text-muted">
          Dự kiến:{" "}
          {formatExpectedFinish(surgery.expectedFinishAt)}
        </span>
      )}
    </div>
  );
}

// Danh sách ca, lọc theo ngày, phòng, trạng thái.
export default function StaffSurgeriesPage() {
  const user = useMe();

  const [date, setDate] = useState(todayVN());
  const [roomId, setRoomId] = useState("");
  const [status, setStatus] = useState("");

  const { data: rooms } = usePolling<Room[]>("/rooms");

  const params = new URLSearchParams({
    ...(date ? { date } : {}),
    ...(roomId ? { roomId } : {}),
    ...(status ? { status } : {}),
  });

  const {
    data: surgeries,
    error,
    reload,
  } = usePolling<Surgery[]>(
    `/surgeries?${params}`,
    REFRESH_MS,
  );

  useEvents(() => void reload());

  const list = surgeries ?? [];

  // Thống kê số ca quá giờ theo bộ lọc hiện tại.
  const overdueCount = list.filter(isSurgeryOverdue).length;

  const stats = [
    {
      label: "Tổng số ca",
      value: list.length,
      warning: false,
    },
    {
      label: "Đang phẫu thuật",
      value: list.filter(
        (s) =>
          !s.cancelledAt &&
          s.currentStatus.code === "IN_SURGERY",
      ).length,
      warning: false,
    },
    {
      label: "Đã hoàn tất",
      value: list.filter(
        (s) =>
          !s.cancelledAt &&
          s.currentStatus.code === "COMPLETED",
      ).length,
      warning: false,
    },
    {
      label: "Ca quá giờ",
      value: overdueCount,
      warning: overdueCount > 0,
    },
    {
      label: "Đã hủy",
      value: list.filter((s) => s.cancelledAt).length,
      warning: false,
    },
  ];

  const hasFilter =
    roomId !== "" ||
    status !== "" ||
    date !== todayVN();

  function resetFilters() {
    setDate(todayVN());
    setRoomId("");
    setStatus("");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 lg:px-10">
      <AppHeader title="Ca phẫu thuật" user={user} />

      {/* Thống kê nhanh theo bộ lọc hiện tại */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map((item) => (
          <div
            key={item.label}
            className={`rounded-2xl border p-4 ${
              item.warning
                ? "border-[#fecaca] bg-[#fef2f2]"
                : "border-border bg-surface"
            }`}
          >
            <p
              className={`text-sm ${
                item.warning
                  ? "font-medium text-[#991b1b]"
                  : "text-muted"
              }`}
            >
              {item.label}
            </p>

            <p
              className={`mt-1 text-3xl font-bold ${
                item.warning
                  ? "text-[#b91c1c]"
                  : ""
              }`}
            >
              {surgeries ? item.value : "–"}
            </p>
          </div>
        ))}
      </section>

      {/* Cảnh báo tổng quan khi có ca quá giờ */}
      {overdueCount > 0 && (
        <section
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0 text-[#b91c1c]"
            aria-hidden="true"
          >
            <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>

          <div>
            <p className="font-semibold text-[#991b1b]">
              Có {overdueCount} ca vượt quá thời gian dự kiến
            </p>

            <p className="mt-1 text-sm text-[#b91c1c]">
              Vui lòng kiểm tra tình trạng thực tế và cập nhật
              thông tin cho người nhà khi cần thiết.
            </p>
          </div>
        </section>
      )}

      {/* Bộ lọc */}
      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Ngày</span>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={SELECT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Phòng</span>

          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Tất cả</option>

            {rooms?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            Trạng thái
          </span>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Tất cả</option>

            {SURGERY_STATUSES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          {hasFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-12 flex-1 rounded-xl border border-border px-4 font-semibold hover:border-primary lg:flex-none"
            >
              Bỏ lọc
            </button>
          )}

          <Link
            href="/staff/ca-moi"
            className="flex min-h-12 flex-1 items-center justify-center whitespace-nowrap rounded-xl bg-primary px-5 font-semibold text-white hover:opacity-90 lg:flex-none"
          >
            + Tạo ca mới
          </Link>
        </div>
      </section>

      <ErrorText>{error}</ErrorText>

      {!surgeries && !error && (
        <p className="text-muted">
          Đang tải danh sách ca…
        </p>
      )}

      {surgeries?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-4xl" aria-hidden="true">
            🗓️
          </p>

          <p className="mt-2 font-semibold">
            Không có ca nào phù hợp
          </p>

          <p className="text-sm text-muted">
            Thử đổi ngày hoặc bỏ bớt bộ lọc.
          </p>
        </div>
      )}

      {list.length > 0 && (
        <>
          {/* Desktop: dạng bảng */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-surface md:block">
            <table className="w-full text-left">
              <thead className="whitespace-nowrap bg-background text-sm text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    Giờ
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Bệnh nhân
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Ca mổ
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Phòng
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Trạng thái
                  </th>

                  <th className="px-4 py-3" />
                </tr>
              </thead>

              <tbody>
                {list.map((s) => (
                  <tr
                    key={s.id}
                    className={`border-t border-border ${
                      isSurgeryOverdue(s)
                        ? "bg-surface hover:bg-background"
                        : "hover:bg-background"
                    }`}
                  >
                    <td
                      className={`px-4 py-3 font-mono text-lg ${
                        isSurgeryOverdue(s)
                          ? "border-l-4 border-l-[#ef4444]"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      {formatTime(s.scheduledAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold">
                        {s.patient.fullName}
                      </div>

                      <div className="text-sm text-muted">
                        {s.patient.patientCode}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {s.title}
                    </td>

                    <td className="px-4 py-3 text-muted">
                      {s.room?.name ?? "Chưa xếp"}
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge
                        code={s.currentStatus.code}
                        label={s.currentStatus.label}
                        cancelled={!!s.cancelledAt}
                      />

                      <SurgeryTiming surgery={s} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        href={`/staff/ca/${s.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        Chi tiết →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: dạng thẻ */}
          <ul className="flex flex-col gap-3 md:hidden">
            {list.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/staff/ca/${s.id}`}
                  className={`flex flex-col gap-2 rounded-2xl border p-4 active:border-primary ${
                    isSurgeryOverdue(s)
                      ? "border-[#f87171] bg-surface"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-lg">
                      {formatTime(s.scheduledAt)}
                    </span>

                    <StatusBadge
                      code={s.currentStatus.code}
                      label={s.currentStatus.label}
                      cancelled={!!s.cancelledAt}
                    />
                  </div>

                  <div>
                    <p className="font-semibold">
                      {s.patient.fullName} ·{" "}
                      {s.patient.patientCode}
                    </p>

                    <p className="text-sm text-muted">
                      {s.title} ·{" "}
                      {s.room?.name ?? "Chưa xếp phòng"}
                    </p>
                  </div>

                  <SurgeryTiming surgery={s} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}