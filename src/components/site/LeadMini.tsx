"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { submitLead } from "@/app/(site)/contactos/actions";
import { Checkbox, Field, FormMessage, TextArea } from "@/components/ui";

const interests = [
  { value: "geral", label: "Informações gerais" },
  { value: "turma", label: "Treinamento por turma" },
  { value: "personalizado", label: "Treinamento personalizado" },
  { value: "edicao_especial", label: "Turma de edição especial" },
  { value: "mentoria", label: "Mentoria" },
  { value: "corporativo", label: "Proposta corporativa" },
  { value: "summit", label: "Protagonista Summit" },
];

export default function LeadMini() {
  const [state, action, pending] = useActionState(async (prev: Parameters<typeof submitLead>[0], fd: FormData) => {
    const phone = String(fd.get("phone") ?? "").trim();
    if (phone && !phone.startsWith("+")) fd.set("phone", `+244 ${phone}`);
    return submitLead(prev, fd);
  }, null);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="space-y-3 rounded-2xl bg-white p-6 text-ink shadow-xl">
      <h3 className="text-lg font-bold">Quero receber mais informações</h3>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome completo" name="name" required placeholder="O seu nome" error={e.name?.[0]} />
        <Field label="E-mail" name="email" type="email" required placeholder="O seu e-mail" error={e.email?.[0]} />
        <label className="block text-sm">
          <span className="font-medium">Telefone<span className="text-brand"> *</span></span>
          <span className="mt-1 flex overflow-hidden rounded-lg border border-line focus-within:border-brand">
            <span className="flex items-center gap-1 border-r border-line bg-mist px-2.5 text-xs font-semibold text-muted">AO +244</span>
            <input name="phone" type="tel" required placeholder="9XX XXX XXX" className="min-w-0 flex-1 bg-paper px-3 py-2.5 outline-none" />
          </span>
          {e.phone?.[0] && <span className="mt-1 block text-xs text-red-600">{e.phone[0]}</span>}
        </label>
        <label className="block text-sm">
          <span className="font-medium">Interesse<span className="text-brand"> *</span></span>
          <select name="subject" required defaultValue="" className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2.5 outline-none focus:border-brand">
            <option value="" disabled>Selecione o programa</option>
            {interests.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>
      <TextArea label="Mensagem (opcional)" name="message" rows={3} />
      <Checkbox name="consent" required label="Concordo em receber informações sobre formações, eventos e novidades da Academia Tchamile." />
      {e.consent && <p className="text-xs text-red-600">{e.consent[0]}</p>}
      <FormMessage state={state} />
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-brand py-3 font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60">
        {pending ? "A enviar…" : "Receber informações →"}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted"><Lock size={12} /> Os seus dados estão seguros connosco.</p>
    </form>
  );
}
