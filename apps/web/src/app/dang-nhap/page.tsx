import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f0fdf4] px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-green-100 bg-white shadow-xl lg:grid-cols-2">
        {/* Khu vực giới thiệu */}
        <section className="flex flex-col justify-center bg-[#166534] px-7 py-10 text-white sm:px-10 lg:px-12 lg:py-16">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-4xl">
            <span aria-hidden="true">✚</span>
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-green-100">
            Hospital Management System
          </p>

          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Hệ thống quản lý
            <br />
            và theo dõi bệnh nhân
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-green-100">
            Nền tảng hỗ trợ nhân viên y tế và quản trị viên quản lý
            thông tin, theo dõi tiến trình điều trị và phối hợp
            công việc hiệu quả.
          </p>

          <div className="mt-10 hidden border-t border-white/20 pt-6 text-sm text-green-100 lg:block">
            An toàn thông tin • Quản lý tập trung • Dễ dàng sử dụng
          </div>
        </section>

        {/* Khu vực đăng nhập */}
        <section className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-16">
          <div className="mb-8">
            <div className="mb-4 inline-flex rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-[#166534]">
              Cổng đăng nhập nội bộ
            </div>

            <h2 className="text-3xl font-bold text-slate-900">
              Chào mừng trở lại!
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Đăng nhập bằng tài khoản được bệnh viện cấp để
              truy cập hệ thống quản lý.
            </p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#166534] hover:underline"
            >
              <span aria-hidden="true">←</span>
              Quay về trang chủ
            </Link>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-500">
            Hệ thống theo dõi và thông báo tình trạng bệnh nhân
          </div>
        </section>
      </div>
    </main>
  );
}
