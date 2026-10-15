import Link from "next/link";
import { StatusSteps } from "@/components/status-steps";
import { fetchHealth } from "@/lib/api";

export const dynamic = "force-dynamic";

const ENTRIES = [
  {
    href: "/lien-ket",
    title: "Tôi là người nhà",
    desc: "Nhập mã hoặc quét QR để theo dõi ca phẫu thuật",
  },
  {
    href: "/staff",
    title: "Nhân viên y tế",
    desc: "Quản lý ca, cập nhật trạng thái, cấp mã theo dõi",
  },
  {
    href: "/admin",
    title: "Quản trị viên",
    desc: "Tài khoản, phòng, danh mục trạng thái, nhật ký",
  },
];

export default async function Home() {
  const health = await fetchHealth();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Theo dõi tình trạng bệnh nhân</h1>
        <p className="text-muted">
          Người nhà nhận thông báo ngay khi ca phẫu thuật chuyển giai đoạn, không
          cần chờ trước phòng mổ.
        </p>
      </header>

      <nav className="grid gap-3">
        {ENTRIES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="rounded-2xl border border-border bg-surface p-5 transition hover:border-primary"
          >
            <span className="block text-xl font-semibold">{e.title}</span>
            <span className="text-muted">{e.desc}</span>
          </Link>
        ))}
      </nav>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Các giai đoạn của ca phẫu thuật</h2>
        <StatusSteps />
      </section>

      <footer className="text-sm text-muted">
        API:{" "}
        {health ? (
          <span className="text-green-600">hoạt động (CSDL {health.database})</span>
        ) : (
          <span className="text-red-600">chưa kết nối được</span>
        )}
      </footer>
    </main>
  );
}
