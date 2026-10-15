"use client";

import { AdminNav } from "@/components/admin-nav";
import { AppHeader } from "@/components/app-header";
import { useMe } from "@/lib/use-me";
import { RoomsSection } from "./rooms-section";
import { StatusesSection } from "./statuses-section";

export default function CatalogPage() {
  const me = useMe();
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <AppHeader title="Phòng và trạng thái" user={me} />
      <AdminNav />
      <RoomsSection />
      <StatusesSection />
    </main>
  );
}
