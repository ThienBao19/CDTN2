"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";

// Tải dữ liệu và tự làm mới định kỳ (mục 11.2: polling khi màn hình đang mở)
export function usePolling<T>(path: string | null, intervalMs?: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!path) return;
    try {
      setData(await api.get<T>(path));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Lỗi tải dữ liệu");
    }
  }, [path]);

  useEffect(() => {
    void reload();
    if (!intervalMs) return;
    const timer = setInterval(() => void reload(), intervalMs);
    return () => clearInterval(timer);
  }, [reload, intervalMs]);

  return { data, error, reload };
}
