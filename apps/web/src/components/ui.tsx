import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

const VARIANTS = {
  primary: "bg-primary text-white hover:opacity-90",
  secondary: "border border-border bg-surface hover:border-primary",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

// Nút lớn, dễ bấm (NFR-08)
export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`min-h-12 rounded-xl px-5 py-3 font-semibold transition disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function Field({ label, id, ...props }: FieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1">
      <span className="font-medium">{label}</span>
      <input
        id={id}
        className="min-h-12 rounded-xl border border-border bg-surface px-4 py-2 text-base"
        {...props}
      />
    </label>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-red-700">
      {children}
    </p>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-5 ${className}`}>{children}</div>
  );
}
