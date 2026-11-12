// Nhãn màu theo trạng thái ca (dùng ở danh sách ca của nhân viên)
const STATUS_STYLES: Record<string, string> = {
  RECEIVED: "bg-slate-100 text-slate-700",
  PREPARING: "bg-amber-100 text-amber-800",
  IN_SURGERY: "bg-blue-100 text-blue-800",
  RECOVERING: "bg-violet-100 text-violet-800",
  COMPLETED: "bg-green-100 text-green-800",
};

type Props = { code: string; label: string; cancelled?: boolean };

export function StatusBadge({ code, label, cancelled = false }: Props) {
  const style = cancelled ? "bg-red-100 text-red-700" : (STATUS_STYLES[code] ?? "bg-slate-100 text-slate-700");
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${style}`}>
      {cancelled ? "Đã hủy" : label}
    </span>
  );
}
