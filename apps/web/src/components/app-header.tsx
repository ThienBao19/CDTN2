"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useIdleLogout } from "@/lib/use-idle-logout";

const STAFF_IDLE_MS = 30 * 60 * 1000;

type Props = { title: string; user: User | null; backHref?: string };

export function AppHeader({ title, user, backHref }: Props) {
  const router = useRouter();
  useIdleLogout(user !== null && user.role !== "FAMILY", STAFF_IDLE_MS);

  async function handleLogout() {
    await api.post("/auth/logout").catch(() => undefined);
    router.replace("/dang-nhap");
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        {backHref && (
          <Link href={backHref} className="text-primary">
            ← Quay lại
          </Link>
        )}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      {user && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">{user.fullName}</span>
          <button type="button" onClick={handleLogout} className="rounded-lg border border-border px-3 py-2">
            Đăng xuất
          </button>
        </div>
      )}
    </header>
  );
}
