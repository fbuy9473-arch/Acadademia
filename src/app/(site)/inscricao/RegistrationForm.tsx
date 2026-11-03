"use client";

import { useActionState, useState } from "react";
import { Check, FileText, ShieldCheck } from "lucide-react";
import clsx from "clsx";
import { submitRegistration } from "./actions";
import { Button, Checkbox, Field, FormMessage } from "@/components/ui";

export type Option = { target: "ticket" | "course" | "plan"; key: string; label: string; note?: string };

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{n}</span>
      <h2 className="text-lg font-bold">{title}</h2>
    </div>
  );
}

export default function RegistrationForm({ options, selected }: { options: Option[]; selected: string }) {
  const [state, action, pending] = useActionState(submitRegistration, null);
  const e = state?.errors ?? {};
  const [sel, setSel] = useState(selected);
  const current = options.find((o) => `${o.target}:${o.key}` === sel) ?? options[0];

  return (
    <form action={action} encType="multipart/form-data" className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="mb-3 w-full"><Step n={1} title="Escolha a sua inscrição" /></legend>
        {options.map((o) => {
          const on = o === current;
          return (
            <label
              key={`${o.target}:${o.key}`}
              className={clsx("flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-md", on ? "border-brand bg-brand-soft ring-4 ring-brand/10" : "border-line bg-paper")}
            >
              <input type="radio" name="__choice" value={`${o.target}:${o.key}`} checked={on} onChange={() => setSel(`${o.target}:${o.key}`)} className="sr-only" />
              <span className={clsx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors", on ? "border-brand bg-brand text-white" : "border-line")}>{on && <Check size={14} strokeWidth={3} />}</span>
              <span className="flex-1"><span className="font-semibold">{o.label}</span></span>
              {o.note && <span className="rounded-full bg-paper px-3 py-1 text-sm font-semibold text-brand">{o.note}</span>}
            </label>
          );
        })}
      </fieldset>
      <input type="hidden" name="target" value={current.target} readOnly />
      <input type="hidden" name="key" value={current.key} readOnly />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <section className="space-y-4">
        <Step n={2} title="Os seus dados" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" name="full_name" required error={e.full_name?.[0]} />
          <Field label="E-mail" name="email" type="email" required error={e.email?.[0]} />
          <Field label="Telefone" name="phone" type="tel" required error={e.phone?.[0]} />
          <Field label="WhatsApp" name="whatsapp" type="tel" />
          <Field label="Nº do documento de identificação" name="id_number" />
        </div>

        {current.target === "ticket" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Empresa (pacote corporativo)" name="company_name" error={e.company_name?.[0]} />
            <Field label="NIF (pacote corporativo)" name="nif" error={e.nif?.[0]} />
          </div>
        )}
      </section>

      {current.target === "ticket" && (
        <section className="space-y-4 rounded-2xl bg-mist p-5">
          <p className="flex items-center gap-2 text-sm font-semibold"><FileText size={16} className="text-brand" /> Documentos (PDF, JPG ou PNG, máx. 5 MB)</p>
          <label className="block text-sm">
            <span className="font-medium">Cópia do B.I. <span className="text-brand">*</span></span>
            <input type="file" name="bi_file" accept="application/pdf,image/jpeg,image/png" className="mt-1.5 block w-full rounded-xl border border-dashed border-line bg-paper p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:font-semibold file:text-white" />
            {e.bi_file && <span className="text-xs text-red-600">{e.bi_file[0]}</span>}
          </label>
          <label className="block text-sm">
            <span className="font-medium">Comprovativo de pagamento (se já efetuou)</span>
            <input type="file" name="proof_file" accept="application/pdf,image/jpeg,image/png" className="mt-1.5 block w-full rounded-xl border border-dashed border-line bg-paper p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:font-semibold file:text-white" />
            {e.proof_file && <span className="text-xs text-red-600">{e.proof_file[0]}</span>}
          </label>
          <p className="flex items-start gap-2 text-xs text-muted"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand" /> Os documentos ficam em armazenamento privado, acessível apenas à equipa autorizada.</p>
        </section>
      )}

      <section className="space-y-4">
        <Step n={3} title="Confirmação" />
        <div className="space-y-3">
          <Checkbox name="consent" required label="Consinto o tratamento dos meus dados pessoais para efeitos desta inscrição." />
          {e.consent && <p className="text-xs text-red-600">{e.consent[0]}</p>}
          <Checkbox name="terms" required label={<>Li e aceito os <a href="/privacidade" target="_blank" className="text-brand underline">termos e a política de privacidade</a>.</>} />
        </div>
        <FormMessage state={state} />
        <Button type="submit" disabled={pending} className="btn-shine w-full py-3.5 text-base">{pending ? "A enviar…" : "Submeter inscrição"}</Button>
      </section>
    </form>
  );
}
