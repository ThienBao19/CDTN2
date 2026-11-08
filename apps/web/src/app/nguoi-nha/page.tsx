
import Link from "next/link";
import { redirect } from "next/navigation";
import { sessionHome } from "@/lib/server-session";
import { FamilyAccessForm } from "./family-access-form";

export const dynamic = "force-dynamic";

export default async function FamilyEntryPage() {
  // Giữ nguyên cơ chế chuyển hướng khi phiên người nhà còn hạn
  if ((await sessionHome()) === "/theo-doi") {
    redirect("/theo-doi");
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f0fdf4] px-4 py-10">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-green-100 bg-white shadow-xl">
        {/* Phần giới thiệu */}
        <header className="bg-[#166534] px-6 py-9 text-white sm:px-10">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
            <span aria-hidden="true">♡</span>
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-green-100">
            Patient Tracking System
          </p>

          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Theo dõi tình trạng
            <br />
            người thân
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-7 text-green-50 sm:text-base">
            Cập nhật tiến trình phẫu thuật của người thân một cách
            thuận tiện, giúp gia đình chủ động nắm bắt thông tin.
          </p>
        </header>

        {/* Khu vực tra cứu */}
        <section className="px-6 py-8 sm:px-10 sm:py-10">
          <div className="mb-7">
            <div className="mb-4 inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-[#166534]">
              Tra cứu thông tin bệnh nhân
            </div>

            <h2 className="text-2xl font-bold text-slate-900">
              Thông tin xác minh
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Vui lòng nhập số điện thoại và họ tên bạn đã đăng ký
              với nhân viên y tế, cùng họ tên bệnh nhân.
            </p>
          </div>

          <FamilyAccessForm />

          <div className="mt-7 rounded-xl border border-green-100 bg-green-50 px-4 py-4">
            <p className="text-sm leading-6 text-slate-700">
              <span className="font-semibold text-[#166534]">
                Chưa được đăng ký?
              </span>{" "}
              Hãy nhờ nhân viên y tế tại quầy thêm số điện thoại
              của bạn vào ca phẫu thuật.
            </p>
          </div>


            <div className="mt-8 flex flex-col items-center gap-4 border-t border-slate-100 pt-6 text-center">
              <Link
                href="/dang-nhap"
                className="text-sm font-semibold text-[#166534] hover:underline"
              >
                Nhân viên y tế / quản trị viên đăng nhập
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#166534] hover:underline"
              >
                <span aria-hidden="true">←</span>
                Quay về trang chủ
              </Link>
            </div>

        </section>
      </div>
    </main>
  );
}
