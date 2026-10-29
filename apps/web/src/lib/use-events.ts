"use client";

import { useEffect, useRef } from "react";

export type AppEventType = "surgery.updated" | "notification.created";
// alert: cách báo cho người nhà (stage: xong giai đoạn, final: ca kết thúc)
export type AppEvent = { type: AppEventType; surgeryId: string; alert?: "stage" | "final" | "info" };
type Handler = (event: AppEvent) => void;

// Nhận sự kiện realtime qua SSE (mục 11.2); EventSource tự kết nối lại khi mất mạng
export function useEvents(onEvent: Handler): void {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const source = new EventSource("/api/events");
    const listener = (e: MessageEvent<string>) => {
      try {
        const data = JSON.parse(e.data) as AppEvent;
        handlerRef.current(data);
      } catch {
        // Bỏ qua gói tin không hợp lệ
      }
    };
    source.addEventListener("surgery.updated", listener);
    source.addEventListener("notification.created", listener);
    return () => source.close();
  }, []);
}
