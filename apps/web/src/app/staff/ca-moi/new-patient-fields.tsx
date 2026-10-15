import { Field } from "@/components/ui";

export function NewPatientFields() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field id="patientCode" name="patientCode" label="Mã bệnh nhân" required pattern="[A-Za-z0-9\-]{3,20}" />
      <Field id="fullName" name="fullName" label="Họ tên bệnh nhân" required />
      <Field id="dateOfBirth" name="dateOfBirth" label="Ngày sinh" type="date" required />
      <label className="flex flex-col gap-1">
        <span className="font-medium">Giới tính</span>
        <select name="gender" required className="min-h-12 rounded-xl border border-border bg-surface px-3">
          <option value="MALE">Nam</option>
          <option value="FEMALE">Nữ</option>
          <option value="OTHER">Khác</option>
        </select>
      </label>
    </div>
  );
}
