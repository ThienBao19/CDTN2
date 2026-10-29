"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { loginPathFor } from "./format";
import type { User } from "./types";

// Lấy người dùng hiện tại; hết phiên thì quay về trang đăng nhập
export function useMe(): User | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api
      .get<User>("/auth/me")
      .then(setUser)
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          // Giữ cả query (vd ?code= của QR) để quay lại đúng chỗ sau khi đăng nhập
          const here = window.location.pathname + window.location.search;
          const target = loginPathFor(window.location.pathname);
          router.replace(target === "/nguoi-nha" ? target : `${target}?next=${encodeURIComponent(here)}`);
        }
      });
  }, [router]);

  return user;
}
