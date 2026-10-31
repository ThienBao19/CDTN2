"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { playStageSound, startRinging, stopRinging, unlockSound } from "@/lib/alert-sound";
import { syncPush } from "@/lib/push";
import { useEvents, type AppEvent } from "@/lib/use-events";

// Âm báo khi app đang mở: xong một giai đoạn kêu "ting",
// ca kết thúc thì chuông reo + rung liên tục tới khi người nhà bấm tắt
export function useStatusAlarm() {
  const [isRinging, setRinging] = useState(false);

  useEffect(() => {
    // Trình duyệt chỉ cho phát tiếng sau một lần chạm vào trang
    const unlock = () => unlockSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      stopRinging();
    };
  }, []);

  const handle = useCallback((e: AppEvent) => {
    if (e.type !== "notification.created") return;
    if (e.alert === "final") {
      startRinging();
      setRinging(true);
    } else if (e.alert === "stage") {
      playStageSound();
    }
  }, []);

  const dismiss = useCallback(() => {
    stopRinging();
    setRinging(false);
  }, []);

  return { isRinging, handle, dismiss };
}

export function AlarmDialog({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="alarm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-surface p-6 text-center">
        <span className="text-5xl" aria-hidden>
          🔔
        </span>
        <h2 id="alarm-title" className="text-2xl font-bold">
          Ca phẫu thuật đã hoàn tất
        </h2>
        <p className="text-muted">Bệnh nhân đã xong toàn bộ quy trình. Mời bạn liên hệ quầy để được hướng dẫn.</p>
        <Button className="w-full" onClick={onDismiss}>
          Tắt chuông
        </Button>
      </div>
    </div>
  );
}

// Gắn ở layout người nhà: nghe sự kiện trên mọi trang (danh sách, chi tiết ca, thông báo)
export function FamilyAlerts() {
  const alarm = useStatusAlarm();
  useEffect(() => {
    syncPush().catch((error: unknown) => console.warn("Không đăng ký lại được thông báo đẩy", error));
  }, []);
  useEvents(alarm.handle);
  return alarm.isRinging ? <AlarmDialog onDismiss={alarm.dismiss} /> : null;
}
