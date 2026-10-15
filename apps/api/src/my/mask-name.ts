// Ẩn bớt họ tên trên màn hình người nhà và màn hình khóa (mục 7):
// "Nguyễn Văn An" -> "N. V. An"
export function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? '';
  const initials = parts.slice(0, -1).map((p) => `${p.charAt(0)}.`);
  return [...initials, parts[parts.length - 1]].join(' ');
}
