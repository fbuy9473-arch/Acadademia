import clsx from "clsx";

export function Field({ label, name, type = "text", required, defaultValue, placeholder, hint, error, step, min }: {
  label: string; name: string; type?: string; required?: boolean; defaultValue?: string | number | null;
  placeholder?: string; hint?: string; error?: string; step?: string; min?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}{required && <span className="text-brand"> *</span>}</span>
      <input
        name={name} type={type} required={required} defaultValue={defaultValue ?? undefined}
        placeholder={placeholder} step={step} min={min} aria-invalid={Boolean(error)}
        className={clsx("mt-1.5 w-full rounded-xl border bg-paper px-3.5 py-3 outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand/15", error ? "border-red-500" : "border-line")}
      />
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function TextArea({ label, name, defaultValue, rows = 4, required, error }: {
  label: string; name: string; defaultValue?: string | null; rows?: number; required?: boolean; error?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}{required && <span className="text-brand"> *</span>}</span>
      <textarea name={name} rows={rows} required={required} defaultValue={defaultValue ?? undefined}
        className={clsx("mt-1.5 w-full rounded-xl border bg-paper px-3.5 py-3 outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand/15", error ? "border-red-500" : "border-line")} />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Select({ label, name, options, defaultValue, required, error }: {
  label: string; name: string; options: { value: string; label: string }[]; defaultValue?: string | null; required?: boolean; error?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}{required && <span className="text-brand"> *</span>}</span>
      <select name={name} required={required} defaultValue={defaultValue ?? ""}
        className={clsx("mt-1.5 w-full rounded-xl border bg-paper px-3.5 py-3 outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand/15", error ? "border-red-500" : "border-line")}>
        {!required && <option value="">—</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Checkbox({ label, name, defaultChecked, required }: { label: React.ReactNode; name: string; defaultChecked?: boolean; required?: boolean }) {
  return (
    <label className="flex items-start gap-2.5 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} required={required} className="mt-0.5 h-4 w-4 accent-[#028034]" />
      <span>{label}</span>
    </label>
  );
}

export function Button({ children, variant = "primary", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  return (
    <button {...rest} className={clsx(
      "rounded-xl px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-60",
      variant === "primary" && "bg-brand text-white hover:bg-brand-dark",
      variant === "ghost" && "border border-line hover:bg-mist",
      variant === "danger" && "border border-red-200 text-red-700 hover:bg-red-50",
      rest.className,
    )}>{children}</button>
  );
}

export function FormMessage({ state }: { state?: { ok?: boolean; message?: string } | null }) {
  if (!state?.message) return null;
  return (
    <p role="status" className={clsx("rounded-lg px-4 py-3 text-sm", state.ok ? "bg-brand-soft text-brand-dark" : "bg-red-50 text-red-700")}>
      {state.message}
    </p>
  );
}
