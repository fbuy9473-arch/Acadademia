"use client";

import { useActionState, useEffect } from "react";
import { submitLead } from "./actions";
import { Button, Checkbox, Field, FormMessage, Select, TextArea } from "@/components/ui";

const subjects = [
  { value: "geral", label: "Informações gerais" },
  { value: "turma", label: "Treinamento por turma" },
  { value: "personalizado", label: "Proposta de treinamento personalizado" },
  { value: "edicao_especial", label: "Turma de edição especial" },
  { value: "mentoria", label: "Mentoria" },
  { value: "corporativo", label: "Proposta corporativa" },
  { value: "summit", label: "Protagonista Summit" },
];

export default function ContactForm({ subject, redirectTo }: { subject: string; redirectTo?: string | null }) {
  const [state, action, pending] = useActionState(submitLead, null);
  useEffect(() => {
    if (state?.ok && redirectTo && (redirectTo.startsWith("/") && !redirectTo.startsWith("//") || redirectTo.startsWith("https://"))) window.location.assign(redirectTo);
  }, [state, redirectTo]);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <Select label="Assunto" name="subject" required options={subjects} defaultValue={subject} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome (ou pessoa de contacto)" name="name" required error={e.name?.[0]} />
        <Field label="E-mail" name="email" type="email" required error={e.email?.[0]} />
        <Field label="Telefone" name="phone" type="tel" required error={e.phone?.[0]} />
        <Field label="WhatsApp" name="whatsapp" type="tel" />
        <Field label="Organização (se aplicável)" name="company_name" />
        <Field label="NIF (empresas)" name="nif" />
        <Field label="Nº de participantes" name="participants" type="number" min={1} />
      </div>
      <TextArea label="Objetivos e observações" name="message" />
      <Checkbox name="consent" required label="Consinto o tratamento dos meus dados para responder a este pedido." />
      {e.consent && <p className="text-xs text-red-600">{e.consent[0]}</p>}
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>{pending ? "A enviar…" : "Enviar pedido"}</Button>
    </form>
  );
}
