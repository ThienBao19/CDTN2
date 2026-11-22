// Biểu đồ cột đơn giản bằng CSS (không cần thư viện), dùng cho trang thống kê quản trị

type DayPoint = { date: string; total: number; cancelled: number };

function shortDate(date: string): string {
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}

// Số ca theo ngày: cột đứng, phần ca hủy tô riêng ở đáy cột
export function DayBarChart({ data }: { data: DayPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  const step = Math.max(1, Math.ceil(data.length / 10)); // tối đa ~10 nhãn trục X
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <div
          className="flex h-56 items-end gap-[2px] border-b border-border"
          style={{ minWidth: `${Math.max(data.length * 14, 280)}px` }}
          role="img"
          aria-label="Biểu đồ số ca phẫu thuật theo ngày"
        >
          {data.map((d) => {
            const done = d.total - d.cancelled;
            return (
              <div
                key={d.date}
                className="group relative flex h-full flex-1 flex-col justify-end"
                title={`${shortDate(d.date)}: ${d.total} ca${d.cancelled ? ` (${d.cancelled} hủy)` : ""}`}
              >
                <span className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white group-hover:block">
                  {shortDate(d.date)}: {d.total} ca{d.cancelled ? ` · ${d.cancelled} hủy` : ""}
                </span>
                {done > 0 && (
                  <div
                    className="w-full rounded-t-[4px] bg-primary group-hover:opacity-80"
                    style={{ height: `${(done / max) * 100}%` }}
                  />
                )}
                {d.cancelled > 0 && (
                  <div
                    className={`w-full bg-red-400 group-hover:opacity-80 ${done > 0 ? "mt-[2px]" : "rounded-t-[4px]"}`}
                    style={{ height: `${(d.cancelled / max) * 100}%` }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-[2px] pt-1 text-xs text-muted" style={{ minWidth: `${Math.max(data.length * 14, 280)}px` }}>
          {data.map((d, i) => (
            <span key={d.date} className="flex-1 text-center">
              {i % step === 0 ? shortDate(d.date) : ""}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-muted">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-primary" aria-hidden="true" /> Ca diễn ra
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-red-400" aria-hidden="true" /> Ca hủy
        </span>
        <span>Cột cao nhất: {max} ca</span>
      </div>
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString("vi-VN");

type BarItem = { label: string; value: number; color?: string; note?: string };

// Thanh ngang có nhãn và số liệu ghi rõ (không phụ thuộc vào màu)
export function HorizontalBars({ items, unit = "ca" }: { items: BarItem[]; unit?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) return <p className="text-muted">Chưa có dữ liệu.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((i) => (
        <li
          key={i.label}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(0,9rem)_1fr_auto]"
        >
          <span className="truncate" title={i.label}>{i.label}</span>
          <div
            className="order-last col-span-2 h-3 rounded-full bg-background sm:order-none sm:col-span-1"
            title={`${i.label}: ${fmt(i.value)} ${unit}`}
          >
            <div
              className={`h-3 rounded-full ${i.color ?? "bg-primary"}`}
              style={{ width: `${(i.value / max) * 100}%`, minWidth: i.value > 0 ? "6px" : 0 }}
            />
          </div>
          <span className="text-right font-semibold tabular-nums sm:w-24">
            {fmt(i.value)} {unit}
            {i.note && <span className="block text-xs font-normal text-muted">{i.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
