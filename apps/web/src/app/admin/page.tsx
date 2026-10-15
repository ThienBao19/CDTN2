"use client";

import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Card } from "@/components/ui";
import { useMe } from "@/lib/use-me";

// Sprint 2: quản lý tài khoản, phòng, danh mục trạng thái, nhật ký truy cập (FR-11, FR-12)
export default function AdminPage() {
  const user = useMe();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <AppHeader title="Trang quản trị" user={user} />
      <Link href="/staff" className="rounded-2xl border border-border bg-surface p-5 hover:border-primary">
        <span className="block text-lg font-semibold">Bệnh nhân và ca phẫu thuật</span>
        <span className="text-muted">Tạo, sửa ca; cấp và thu hồi mã theo dõi</span>
      </Link>
      <Card>
        <span className="block text-lg font-semibold">Tài khoản, phòng, nhật ký truy cập</span>
        <span className="text-muted">Sẽ làm ở Sprint 2.</span>
      </Card>
    </main>
  );
}
