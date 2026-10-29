"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { playStageSound, startRinging, stopRinging, unlockSound } from "@/lib/alert-sound";

// Nghe thử âm báo; lần bấm đầu cũng mở khóa âm thanh cho trình duyệt (iPhone)
export function SoundTest() {
  const [isRinging, setRinging] = useState(false);

  function handleStage() {
    unlockSound();
    playStageSound();
  }

  function handleRing() {
    unlockSound();
    if (isRinging) {
      stopRinging();
      setRinging(false);
    } else {
      startRinging();
      setRinging(true);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Âm báo</h2>
      <p className="text-sm text-muted">
        Khi app đang mở: mỗi giai đoạn xong sẽ kêu một tiếng; ca hoàn tất sẽ reo chuông và rung tới khi bạn bấm tắt.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={handleStage}>
          Thử âm giai đoạn
        </Button>
        <Button variant="secondary" onClick={handleRing}>
          {isRinging ? "Tắt chuông" : "Thử chuông"}
        </Button>
      </div>
    </Card>
  );
}
