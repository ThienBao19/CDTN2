import "server-only";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";

export type HealthResponse = { status: string; database: string; time: string };

export async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${API_ORIGIN}/api/health`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as HealthResponse) : null;
  } catch {
    return null;
  }
}
