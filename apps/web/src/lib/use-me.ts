"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "./api";
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
          router.replace(`/dang-nhap?next=${encodeURIComponent(window.location.pathname)}`);
        }
      });
  }, [router]);

  return user;
}
