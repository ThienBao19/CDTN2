"use client";

import { useState } from "react";
import { Field } from "@/components/ui";
import { api } from "@/lib/api";
import type { Patient } from "@/lib/types";

type Props = {
  selected: Patient | null;
  onSelect: (patient: Patient | null) => void;
};

// Tìm bệnh nhân đã có theo mã hoặc tên
export function PatientPicker({ selected, onSelect }: Props) {
  const [results, setResults] = useState<Patient[]>([]);

  async function handleSearch(q: string) {
    if (q.trim().length < 2) return setResults([]);
    setResults(await api.get<Patient[]>(`/patients?q=${encodeURIComponent(q)}`).catch(() => []));
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-primary px-4 py-3">
        <span className="font-semibold">{selected.fullName} · {selected.patientCode}</span>
        <button type="button" onClick={() => onSelect(null)} className="text-primary">Đổi</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Field id="search" label="Tìm theo mã hoặc tên bệnh nhân" onChange={(e) => void handleSearch(e.target.value)} />
      <ul className="flex flex-col gap-1">
        {results.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p)}
              className="w-full rounded-lg border border-border px-4 py-2 text-left hover:border-primary"
            >
              {p.fullName} · {p.patientCode}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
