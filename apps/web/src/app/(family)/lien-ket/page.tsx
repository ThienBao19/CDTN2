import Link from "next/link";
import { Suspense } from "react";
import { LinkForm } from "./link-form";

export default function LinkPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">
      <Link href="/theo-doi" className="text-primary">
        ← Danh sách theo dõi
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Liên kết bệnh nhân</h1>
        <p className="text-muted">
          Nhập mã do bệnh viện cung cấp, hoặc dùng camera điện thoại quét mã QR.
        </p>
      </div>
      <Suspense>
        <LinkForm />
      </Suspense>
    </main>
  );
}
