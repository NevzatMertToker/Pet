import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Icon, type IconName } from "./icons";

export function Field({
  label,
  error,
  hint,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={"block " + className}>
      <span className="label">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-[13px] font-medium text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-[13px] text-ink/50">{hint}</span>
      )}
    </label>
  );
}

export function TextField({
  label,
  error,
  hint,
  className,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      <input {...input} className={"input " + (error ? "input-error" : "")} aria-invalid={error ? true : undefined} />
    </Field>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className,
  children,
  ...select
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; hint?: string }) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      <select {...select} className={"input " + (error ? "input-error" : "")}>
        {children}
      </select>
    </Field>
  );
}

const NOTICE_STYLES = {
  error: { box: "border-red-200 bg-red-50 text-red-800", icon: "alert" },
  success: { box: "border-brand-200 bg-brand-50 text-brand-900", icon: "check" },
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: "info" },
  warn: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: "alert" },
} satisfies Record<string, { box: string; icon: IconName }>;

export function Notice({
  tone = "info",
  children,
  className = "",
}: {
  tone?: keyof typeof NOTICE_STYLES;
  children: ReactNode;
  className?: string;
}) {
  const style = NOTICE_STYLES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={"flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm " + style.box + " " + className}
    >
      <Icon name={style.icon} className="mt-0.5 h-4 w-4" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1.5 text-ink/60">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: IconName;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-600">
        <Icon name={icon} className="h-8 w-8" />
      </span>
      <h2 className="mt-5 text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-ink/60">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  size = "md",
  label = "Adet",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const button =
    "grid place-items-center rounded-full text-ink/70 transition hover:bg-ink/5 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent " +
    (size === "sm" ? "h-8 w-8" : "h-10 w-10");
  return (
    <div
      className="inline-flex items-center rounded-full border border-ink/15 bg-white p-0.5"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={button}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Azalt"
      >
        <Icon name="minus" className="h-4 w-4" />
      </button>
      <span className={"text-center font-semibold tabular-nums " + (size === "sm" ? "w-7 text-sm" : "w-9")}>
        {value}
      </span>
      <button
        type="button"
        className={button}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Artır"
      >
        <Icon name="plus" className="h-4 w-4" />
      </button>
    </div>
  );
}
