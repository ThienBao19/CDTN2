export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type ErrorBody = { message?: string | string[] };

function errorMessage(body: ErrorBody | null, status: number): string {
  const msg = body?.message;
  if (Array.isArray(msg)) return msg[0] ?? "Dữ liệu không hợp lệ";
  if (msg) return msg;
  if (status === 401) return "Vui lòng đăng nhập lại";
  return "Có lỗi xảy ra, vui lòng thử lại";
}

// Gọi API qua proxy /api (cùng origin, gửi kèm cookie httpOnly)
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Không kết nối được máy chủ", 0);
  }
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as unknown;
  if (res.status === 401 && !path.startsWith("/auth/")) redirectToLogin();
  if (!res.ok) throw new ApiError(errorMessage(body as ErrorBody, res.status), res.status);
  return body as T;
}

// Phiên hết hạn/bị thu hồi: về trang đăng nhập, giữ nguyên đường dẫn và query
// (vd /lien-ket?code=... từ mã QR) để quay lại đúng chỗ sau khi đăng nhập
function redirectToLogin(): void {
  if (typeof window === "undefined" || window.location.pathname === "/dang-nhap") return;
  const here = window.location.pathname + window.location.search;
  window.location.assign(`/dang-nhap?next=${encodeURIComponent(here)}`);
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) }),
  put: <T>(path: string, data: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  delete: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, {
      method: "DELETE",
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    }),
  patch: <T>(path: string, data: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
};
