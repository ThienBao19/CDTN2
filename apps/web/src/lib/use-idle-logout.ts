"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "./api";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
const CHECK_EVERY_MS = 30_000;

// Mục 7: tự đăng xuất khi không hoạt động (áp dụng cho nhân viên và quản trị viên)
export function useIdleLogout(isEnabled: boolean, idleMs: number): void {
  const router = useRouter();

  useEffect(() => {
    if (!isEnabled) return;
    let lastActive = Date.now();
    const markActive = () => {
      lastActive = Date.now();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    const timer = setInterval(() => {
      if (Date.now() - lastActive < idleMs) return;
      clearInterval(timer);
      void api
        .post("/auth/logout")
        .catch(() => undefined)
        .finally(() => router.replace("/dang-nhap?het-phien=1"));
    }, CHECK_EVERY_MS);
    return () => {
      clearInterval(timer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive));
    };
  }, [isEnabled, idleMs, router]);
}
