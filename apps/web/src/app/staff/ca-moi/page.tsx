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
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <AppHeader title="Tạo ca phẫu thuật" user={user} backHref="/staff" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Bệnh nhân</h2>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isNewPatient} onChange={(e) => setIsNewPatient(e.target.checked)} />
              Bệnh nhân mới
            </label>
          </div>
          {isNewPatient ? <NewPatientFields /> : <PatientPicker selected={patient} onSelect={setPatient} />}
        </Card>
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Ca phẫu thuật</h2>
          <Field id="title" name="title" label="Tên ca" required />
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
        </Card>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Đang lưu..." : "Tạo ca"}
        </Button>
      </form>
    </main>
  );
}
