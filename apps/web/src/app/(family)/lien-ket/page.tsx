import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10">
      <Link href="/" className="text-primary">← Trang chủ</Link>
      <h1 className="text-2xl font-bold">Liên kết bệnh nhân</h1>
      <p className="text-muted">Quét QR hoặc nhập mã theo dõi do bệnh viện cấp (FR-07). Sẽ làm ở Sprint 1.</p>
    </main>
  );
}
