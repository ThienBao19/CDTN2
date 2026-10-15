import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <Link href="/" className="text-primary">← Trang chủ</Link>
      <h1 className="text-2xl font-bold">Danh sách ca phẫu thuật</h1>
      <p className="text-muted">Lọc theo ngày, phòng, trạng thái; cập nhật trạng thái bằng một nút (FR-04, FR-05). Sẽ làm ở Sprint 1.</p>
    </main>
  );
}
