import { Suspense } from "react";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Đăng ký người nhà</h1>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
