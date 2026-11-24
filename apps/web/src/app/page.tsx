
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { sessionHome } from "@/lib/server-session";

export const dynamic = "force-dynamic";

const ENTRIES = [
  {
    href: "/nguoi-nha",
    title: "Tôi là người nhà",
    desc: "Nhập số điện thoại, họ tên bạn và họ tên bệnh nhân",
  },
  {
    href: "/staff",
    title: "Nhân viên y tế",
    desc: "Quản lý ca, cập nhật trạng thái, đăng ký người nhà",
  },
  {
    href: "/admin",
    title: "Quản trị viên",
    desc: "Tài khoản, phòng, danh mục trạng thái, nhật ký",
  },
];

export default async function Home() {
  // Mở lại app (PWA) khi phiên còn hạn: vào thẳng trang của vai trò
  const home = await sessionHome();
  if (home) redirect(home);

  return (
    <main className="min-h-screen w-full bg-[#f0fdf4] text-slate-900 [color-scheme:light] [--muted:#475569] [--primary:#166534]">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-2 [&_div>span:first-child]:!text-[#166534]">
          <h1 className="sr-only">{APP_NAME}</h1>
          <BrandLogo size="lg" subtitle={APP_TAGLINE} />

          <p className="text-slate-600">
            Người nhà nhận thông báo ngay khi ca phẫu thuật chuyển giai đoạn, không
            cần chờ trước phòng mổ.
          </p>
        </header>

        <nav className="grid gap-3">
          {ENTRIES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm transition hover:border-[#166534] hover:bg-green-50"
            >
              <span className="block text-xl font-semibold text-slate-900">
                {e.title}
              </span>
              <span className="text-slate-600">
                {e.desc}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
