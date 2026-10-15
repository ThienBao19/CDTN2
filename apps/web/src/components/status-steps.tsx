import { SURGERY_STATUSES } from "@pt/shared";

type Props = {
  currentOrder?: number;
};

// Thanh tiến trình 5 giai đoạn (mục 12.1 — màn hình chi tiết trạng thái)
export function StatusSteps({ currentOrder = 0 }: Props) {
  return (
    <ol className="flex flex-col gap-2">
      {SURGERY_STATUSES.map((s) => {
        const isDone = s.order < currentOrder;
        const isCurrent = s.order === currentOrder;
        return (
          <li
            key={s.code}
            aria-current={isCurrent ? "step" : undefined}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
              isCurrent
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                isCurrent ? "bg-white text-primary" : "border border-border"
              }`}
            >
              {isDone ? "✓" : s.order}
            </span>
            <span className="font-medium">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
