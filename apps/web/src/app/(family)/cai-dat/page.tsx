"use client";

import { AppHeader } from "@/components/app-header";
import { FamilyNav } from "@/components/family-nav";
import { Card } from "@/components/ui";
import { api } from "@/lib/api";
import type { FamilySurgery } from "@/lib/types";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";
import { PasswordForm } from "./password-form";
import { PushToggle } from "./push-toggle";

// Cài đặt (mục 12.1): quản lý liên kết, bật/tắt thông báo, đổi mật khẩu
export default function SettingsPage() {
  const user = useMe();
  const { data: links, reload } = usePolling<FamilySurgery[]>("/my/surgeries");

  async function handleUnlink(linkId: string) {
    if (!window.confirm("Ngừng theo dõi bệnh nhân này?")) return;
    await api.delete(`/links/${linkId}`);
    void reload();
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <AppHeader title="Cài đặt" user={user} />
      <FamilyNav />
      <PushToggle />
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Bệnh nhân đang theo dõi</h2>
        {links?.length === 0 && <p className="text-muted">Chưa có liên kết nào.</p>}
        {links?.map((l) => (
          <div key={l.linkId} className="flex items-center justify-between gap-2 rounded-lg border border-border px-4 py-2">
            <span>{l.patientName} · {l.title}</span>
            <button type="button" onClick={() => void handleUnlink(l.linkId)} className="text-red-600">
              Hủy liên kết
            </button>
          </div>
        ))}
      </Card>
      <PasswordForm />
    </main>
  );
}
