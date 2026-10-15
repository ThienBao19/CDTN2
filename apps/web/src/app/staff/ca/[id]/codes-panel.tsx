"use client";

import QRCode from "qrcode";
import { useState } from "react";
import { Button, Card, ErrorText } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { IssuedCode, TrackingCodeView } from "@/lib/types";
import { usePolling } from "@/lib/use-polling";

const STATUS_LABELS: Record<TrackingCodeView["status"], string> = {
  PENDING: "Chờ sử dụng",
  USED: "Đã dùng",
  REVOKED: "Đã thu hồi",
  EXPIRED: "Hết hạn",
};

type Issued = IssuedCode & { qr: string };

// Cấp mã theo dõi + QR cho người nhà, thu hồi mã chưa dùng (FR-06, UC-01)
export function CodesPanel({ surgeryId, canIssue }: { surgeryId: string; canIssue: boolean }) {
  const { data: codes, reload } = usePolling<TrackingCodeView[]>(`/surgeries/${surgeryId}/tracking-codes`);
  const [issued, setIssued] = useState<Issued | null>(null);
  const [error, setError] = useState("");

  async function handleIssue() {
    setError("");
    try {
      const code = await api.post<IssuedCode>(`/surgeries/${surgeryId}/tracking-codes`);
      const url = `${window.location.origin}/lien-ket?code=${code.code}`;
      setIssued({ ...code, qr: await QRCode.toDataURL(url, { width: 280, margin: 1 }) });
      void reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tạo được mã");
    }
  }

  async function handleRevoke(id: string) {
    if (!window.confirm("Thu hồi mã này?")) return;
    await api.delete(`/tracking-codes/${id}`).catch((err: unknown) => {
      setError(err instanceof ApiError ? err.message : "Không thu hồi được");
    });
    if (issued?.id === id) setIssued(null);
    void reload();
  }

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Mã theo dõi cho người nhà</h2>
      {canIssue && (
        <Button variant="secondary" onClick={() => void handleIssue()}>
          Cấp mã theo dõi mới
        </Button>
      )}
      <ErrorText>{error}</ErrorText>
      {issued && (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-primary p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh QR dạng data URL */}
          <img src={issued.qr} alt={`QR mã ${issued.code}`} width={280} height={280} />
          <span className="font-mono text-3xl font-bold tracking-widest">{issued.code}</span>
          <span className="text-sm text-muted">
            Hết hạn {formatDateTime(issued.expiresAt)} · Mã chỉ hiển thị một lần
          </span>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {codes?.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-2">
            <span>
              {STATUS_LABELS[c.status]} · tạo {formatDateTime(c.createdAt)} bởi {c.createdBy}
            </span>
            {c.status === "PENDING" && (
              <button onClick={() => void handleRevoke(c.id)} className="text-red-600">
                Thu hồi
              </button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
