import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Đăng nhập nhân viên</h1>
      <p className="-mt-4 text-muted">Dành cho nhân viên y tế và quản trị viên bệnh viện.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
