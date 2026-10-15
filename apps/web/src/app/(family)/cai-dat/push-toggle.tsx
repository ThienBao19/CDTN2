"use client";

import { useEffect, useState } from "react";
import { Button, Card, ErrorText } from "@/components/ui";
import { disablePush, enablePush, isPushConfigured, isPushEnabled } from "@/lib/push";

export function PushToggle() {
  const [isOn, setIsOn] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const isConfigured = isPushConfigured();

  useEffect(() => setIsOn(isPushEnabled()), []);

  async function handleToggle() {
    setError("");
    setIsBusy(true);
    try {
      if (isOn) await disablePush();
      else await enablePush();
      setIsOn(!isOn);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đổi được cài đặt thông báo");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Thông báo đẩy</h2>
      {isConfigured ? (
        <>
          <p className="text-muted">
            {isOn
              ? "Đang bật: điện thoại sẽ báo khi trạng thái ca thay đổi."
              : "Đang tắt: bạn vẫn xem được trạng thái và thông báo trong ứng dụng."}
          </p>
          <Button variant={isOn ? "secondary" : "primary"} disabled={isBusy} onClick={() => void handleToggle()}>
            {isOn ? "Tắt thông báo đẩy" : "Bật thông báo đẩy"}
          </Button>
        </>
      ) : (
        <p className="text-muted">
          Bệnh viện chưa bật thông báo đẩy. Bạn vẫn xem được thông báo trong mục Thông báo.
        </p>
      )}
      <ErrorText>{error}</ErrorText>
    </Card>
  );
}
