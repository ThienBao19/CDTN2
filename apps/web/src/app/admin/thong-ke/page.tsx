"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { DayBarChart, HorizontalBars } from "@/components/stats-charts";
import { Card, ErrorText } from "@/components/ui";
import { todayVN } from "@/lib/format";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";

type SurgeryStats = {
  from: string;
  to: string;
  total: number;
  cancelled: number;
  completed: number;
  byDay: { date: string; total: number; cancelled: number }[];
  byRoom: { roomId: string | null; name: string; total: number; cancelled: number }[];
  byStatus: { code: string; label: string; count: number }[];
};
type StageStats = {
  surgeries: number;
  items: {
    code: string;
    label: string;
    samples: number;
    avgMinutes: number | null;
    medianMinutes: number | null;
    minMinutes: number | null;
    maxMinutes: number | null;
  }[];
};
type PushStats = {
  total: number;
  sent: number;
  skipped: number;
  failed: number;
  pending: number;
  deliveryRate: number | null;
  latency: {
    samples: number;
    avgSeconds: number | null;
    p95Seconds: number | null;
    targetSeconds: number;
    withinTargetRate: number | null;
  };
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-slate-400",
  PREPARING: "bg-amber-500",
  IN_SURGERY: "bg-blue-600",
  RECOVERING: "bg-violet-500",
  COMPLETED: "bg-green-600",
  CANCELLED: "bg-red-400",
};
const INPUT = "min-h-12 rounded-xl border border-border bg-surface px-3";

function shiftDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function minutes(v: number | null): string {
  if (v === null) return "—";
  if (v >= 60) return `${Math.floor(v / 60)} giờ ${Math.round(v % 60)} phút`;
  return `${v.toLocaleString("vi-VN")} phút`;
}

function pct(v: number | null): string {
  return v === null ? "—" : `${v.toLocaleString("vi-VN")}%`;
}

// Dashboard thống kê: số ca, thời gian từng giai đoạn, tỉ lệ push; lọc theo khoảng ngày và xuất CSV
export default function AdminStatsPage() {
  const me = useMe();
  const today = todayVN();
  const [from, setFrom] = useState(shiftDays(today, -29));
  const [to, setTo] = useState(today);

  const valid = Boolean(from && to && from <= to);
  const qs = new URLSearchParams({ from, to }).toString();
  const surgeries = usePolling<SurgeryStats>(valid ? `/admin/stats/surgeries?${qs}` : null);
  const stages = usePolling<StageStats>(valid ? `/admin/stats/stage-durations?${qs}` : null);
  const push = usePolling<PushStats>(valid ? `/admin/stats/notifications?${qs}` : null);
  const s = surgeries.data;
  const p = push.data;

  const presets = [
    { label: "7 ngày", from: shiftDays(today, -6), to: today },
    { label: "30 ngày", from: shiftDays(today, -29), to: today },
    { label: "Tháng này", from: `${today.slice(0, 8)}01`, to: today },
    { label: "90 ngày", from: shiftDays(today, -89), to: today },
  ];
  const nfrPass = p?.latency.p95Seconds != null && p.latency.p95Seconds <= p.latency.targetSeconds;
  const tiles = [
    { label: "Tổng số ca", value: s?.total },
    { label: "Đã hoàn tất", value: s?.completed },
    { label: "Đã hủy", value: s?.cancelled },
    { label: "Push gửi thành công", value: p ? pct(p.deliveryRate) : undefined },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 lg:px-10">
      <AppHeader title="Thống kê" user={me} />

      {/* Bộ lọc khoảng ngày + xuất file */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Từ ngày</span>
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={INPUT} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Đến ngày</span>
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={INPUT} />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1">
            <a
              href={valid ? `/api/admin/stats/export?${qs}&type=surgeries` : undefined}
              aria-disabled={!valid}
              className="flex min-h-12 flex-1 items-center justify-center whitespace-nowrap rounded-xl bg-primary px-4 font-semibold text-white hover:opacity-90 lg:flex-none"
            >
              ⬇ Xuất từng ca (CSV)
            </a>
            <a
              href={valid ? `/api/admin/stats/export?${qs}&type=summary` : undefined}
              aria-disabled={!valid}
              className="flex min-h-12 flex-1 items-center justify-center whitespace-nowrap rounded-xl border border-border px-4 font-semibold hover:border-primary lg:flex-none"
            >
              ⬇ Xuất tổng hợp
            </a>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((pr) => {
            const active = pr.from === from && pr.to === to;
            return (
              <button
                key={pr.label}
                type="button"
                onClick={() => {
                  setFrom(pr.from);
                  setTo(pr.to);
                }}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                  active ? "border-primary bg-primary text-white" : "border-border hover:border-primary"
                }`}
              >
                {pr.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">File CSV mở trực tiếp bằng Excel (đã kèm mã hóa UTF-8 cho tiếng Việt).</p>
      </section>

      {!valid && <ErrorText>Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</ErrorText>}
      <ErrorText>{surgeries.error || stages.error || push.error}</ErrorText>

      {/* Số liệu chính */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">{t.label}</p>
            <p className="mt-1 text-3xl font-bold text-[#166534]">{t.value ?? "–"}</p>
          </div>
        ))}
      </section>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Số ca theo ngày</h2>
        {s ? <DayBarChart data={s.byDay} /> : <p className="text-muted">Đang tải…</p>}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Theo phòng</h2>
          {s ? (
            <HorizontalBars
              items={s.byRoom.map((r) => ({
                label: r.name,
                value: r.total,
                note: r.cancelled ? `${r.cancelled} hủy` : undefined,
              }))}
            />
          ) : (
            <p className="text-muted">Đang tải…</p>
          )}
        </Card>
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Theo trạng thái hiện tại</h2>
          {s ? (
            <HorizontalBars
              items={s.byStatus.map((x) => ({ label: x.label, value: x.count, color: STATUS_COLORS[x.code] }))}
            />
          ) : (
            <p className="text-muted">Đang tải…</p>
          )}
        </Card>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Thời gian trung bình từng giai đoạn</h2>
          {stages.data && (
            <span className="text-sm text-muted">Tính từ lịch sử trạng thái của {stages.data.surgeries} ca</span>
          )}
        </div>
        {stages.data ? (
          <>
            <HorizontalBars
              unit="phút"
              items={stages.data.items.map((i) => ({
                label: i.label,
                value: i.avgMinutes ?? 0,
                color: STATUS_COLORS[i.code],
              }))}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-muted">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">Giai đoạn</th>
                    <th className="py-2 pr-3 font-medium">Số mẫu</th>
                    <th className="py-2 pr-3 font-medium">Trung bình</th>
                    <th className="py-2 pr-3 font-medium">Trung vị</th>
                    <th className="py-2 pr-3 font-medium">Ngắn nhất</th>
                    <th className="py-2 font-medium">Dài nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.data.items.map((i) => (
                    <tr key={i.code} className="border-b border-border last:border-0">
                      <td className="py-2 pr-3 font-medium">{i.label}</td>
                      <td className="py-2 pr-3 tabular-nums">{i.samples}</td>
                      <td className="py-2 pr-3">{minutes(i.avgMinutes)}</td>
                      <td className="py-2 pr-3">{minutes(i.medianMinutes)}</td>
                      <td className="py-2 pr-3">{minutes(i.minMinutes)}</td>
                      <td className="py-2">{minutes(i.maxMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">
              Thời gian ở một giai đoạn = lúc chuyển sang trạng thái kế tiếp − lúc vào trạng thái đó. Giai đoạn
              &ldquo;Đã hoàn tất&rdquo; là bước cuối nên không tính.
            </p>
          </>
        ) : (
          <p className="text-muted">Đang tải…</p>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Thông báo đẩy (push)</h2>
          {p && p.latency.samples > 0 && (
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                nfrPass ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
              }`}
            >
              {nfrPass ? "✓ Đạt" : "✗ Chưa đạt"} NFR: p95 ≤ {p.latency.targetSeconds} giây
            </span>
          )}
        </div>
        {p ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <HorizontalBars
              unit="tin"
              items={[
                { label: "Đã gửi (SENT)", value: p.sent, color: "bg-green-600" },
                { label: "Bỏ qua (SKIPPED)", value: p.skipped, color: "bg-slate-400" },
                { label: "Lỗi (FAILED)", value: p.failed, color: "bg-red-500" },
                { label: "Đang chờ (PENDING)", value: p.pending, color: "bg-amber-500" },
              ]}
            />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Tổng số thông báo", String(p.total)],
                ["Tỉ lệ gửi thành công", pct(p.deliveryRate)],
                ["Độ trễ trung bình", p.latency.avgSeconds === null ? "—" : `${p.latency.avgSeconds.toLocaleString("vi-VN")} giây`],
                ["Độ trễ p95", p.latency.p95Seconds === null ? "—" : `${p.latency.p95Seconds.toLocaleString("vi-VN")} giây`],
                [`Đến trong ${p.latency.targetSeconds} giây`, pct(p.latency.withinTargetRate)],
                ["Số mẫu đo độ trễ", String(p.latency.samples)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-background px-4 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-lg font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="text-muted">Đang tải…</p>
        )}
        <p className="text-xs text-muted">
          Tỉ lệ gửi thành công = SENT ÷ (SENT + FAILED). SKIPPED là thông báo không gửi push vì chưa cấu hình FCM
          hoặc người nhận chưa đăng ký thiết bị, nên không tính vào tỉ lệ.
        </p>
      </Card>
    </main>
  );
}
