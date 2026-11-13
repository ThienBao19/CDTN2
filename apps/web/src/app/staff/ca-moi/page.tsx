"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppHeader } from "@/components/app-header";
import { Button, Card, ErrorText, Field } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { Patient, Room, Surgery } from "@/lib/types";
import { useMe } from "@/lib/use-me";
import { usePolling } from "@/lib/use-polling";
import { NewPatientFields } from "./new-patient-fields";
import { PatientPicker } from "./patient-picker";

// Tạo bệnh nhân (nếu mới) và ca phẫu thuật (FR-03, FR-04)
export default function NewSurgeryPage() {
  const router = useRouter();
  const user = useMe();
  const { data: rooms } = usePolling<Room[]>("/rooms");
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function resolvePatientId(form: FormData): Promise<string> {
    if (!isNewPatient) {
      if (!patient) throw new ApiError("Vui lòng chọn bệnh nhân", 400);
      return patient.id;
    }
    const created = await api.post<Patient>("/patients", {
      patientCode: form.get("patientCode"),
      fullName: form.get("fullName"),
      dateOfBirth: form.get("dateOfBirth"),
      gender: form.get("gender"),
    });
    return created.id;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setIsSaving(true);
    try {
      const patientId = await resolvePatientId(form);
      const roomId = String(form.get("roomId") ?? "");
      const surgery = await api.post<Surgery>("/surgeries", {
        patientId,
        title: form.get("title"),
        scheduledAt: new Date(String(form.get("scheduledAt"))).toISOString(),
        ...(roomId ? { roomId } : {}),
      });
      router.replace(`/staff/ca/${surgery.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tạo được ca");
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-8 lg:px-10">
      <AppHeader title="Tạo ca phẫu thuật" user={user} backHref="/staff" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Bước 1: chọn hoặc tạo bệnh nhân */}
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 text-lg font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-white">1</span>
              Bệnh nhân
            </h2>
            <div role="radiogroup" aria-label="Loại bệnh nhân" className="flex rounded-xl border border-border bg-background p-1">
              {[
                { value: false, label: "Đã có hồ sơ" },
                { value: true, label: "Bệnh nhân mới" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  role="radio"
                  aria-checked={isNewPatient === opt.value}
                  onClick={() => setIsNewPatient(opt.value)}
                  className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition ${
                    isNewPatient === opt.value ? "bg-primary text-white" : "text-muted hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {isNewPatient ? <NewPatientFields /> : <PatientPicker selected={patient} onSelect={setPatient} />}
        </Card>

        {/* Bước 2: thông tin ca */}
        <Card className="flex flex-col gap-4">
          <h2 className="flex items-center gap-3 text-lg font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-white">2</span>
            Thông tin ca phẫu thuật
          </h2>
          <Field id="title" name="title" label="Tên ca" placeholder="VD: Mổ ruột thừa nội soi" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="scheduledAt" name="scheduledAt" label="Giờ dự kiến" type="datetime-local" required />
            <label className="flex flex-col gap-1">
              <span className="font-medium">Phòng mổ</span>
              <select name="roomId" className="min-h-12 rounded-xl border border-border bg-surface px-3">
                <option value="">Chưa xếp phòng</option>
                {rooms?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-sm text-muted">Sau khi tạo ca, bạn có thể đăng ký người nhà ở trang chi tiết ca.</p>
        </Card>

        <ErrorText>{error}</ErrorText>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => router.push("/staff")}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSaving} className="sm:min-w-40">
            {isSaving ? "Đang lưu..." : "Tạo ca"}
          </Button>
        </div>
      </form>
    </main>
  );
}
