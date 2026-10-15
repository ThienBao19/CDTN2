import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <Link href="/" className="text-primary">← Trang chủ</Link>
      <h1 className="text-2xl font-bold">Trang quản trị</h1>
      <p className="text-muted">Quản lý tài khoản, phòng, danh mục trạng thái và nhật ký truy cập (FR-11, FR-12). Sẽ làm ở Sprint 2.</p>
    </main>
  );
}
