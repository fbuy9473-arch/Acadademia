import type { Metadata } from "next";
import Link from "next/link";
import { Check, SearchX } from "lucide-react";
import clsx from "clsx";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/server";
import PageHeader from "@/components/site/PageHeader";
import Reveal from "@/components/site/Reveal";

export const metadata: Metadata = { title: "Estado da inscrição", robots: { index: false } };
export const dynamic = "force-dynamic";

const labels: Record<string, string> = {
  draft: "Rascunho", pending_documents: "Pendente de documentos", pending_payment: "Pendente de pagamento",
  in_validation: "Em validação", confirmed: "Confirmada", rejected: "Rejeitada", cancelled: "Cancelada", refunded: "Reembolsada",
};
const nextSteps: Record<string, string> = {
  pending_documents: "Envie os documentos em falta à equipa para avançarmos com a validação.",
  pending_payment: "Efetue o pagamento e envie o comprovativo. O convite para o grupo oficial é enviado depois da confirmação.",
  in_validation: "A equipa está a validar os seus dados e pagamento. Será notificado/a quando houver novidades.",
  rejected: "A inscrição não foi aceite. Contacte a equipa para mais informações.",
};
const steps: [string, string][] = [
  ["pending_documents", "Documentos"], ["pending_payment", "Pagamento"], ["in_validation", "Validação"], ["confirmed", "Confirmada"],
];
const failed = new Set(["rejected", "cancelled", "refunded"]);

export default async function EstadoPage({ searchParams }: { searchParams: Promise<{ codigo?: string; token?: string }> }) {
  const { codigo, token } = await searchParams;
  let reg: Record<string, any> | null = null;
  if (supabaseConfigured && process.env.SUPABASE_SERVICE_ROLE_KEY && codigo && token && /^[0-9a-f-]{36}$/i.test(token)) {
    const { data } = await createAdminClient()
      .from("registrations")
      .select("code,status,created_at,edition_id,participants(full_name),event_editions(group_invite_url,group_invite_active,title)")
      .eq("code", codigo.toUpperCase()).eq("access_token", token).maybeSingle();
    reg = data;
  }

  if (!reg) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-20 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"><SearchX size={26} /></span>
        <h1 className="mt-5 text-3xl font-bold">Inscrição não encontrada</h1>
        <p className="mt-3 text-muted">Use a ligação enviada no e-mail de confirmação.</p>
        <Link href="/contactos" className="mt-6 inline-block font-semibold text-brand hover:underline">Precisa de ajuda? Fale connosco</Link>
      </div>
    );
  }

  const ed = Array.isArray(reg.event_editions) ? reg.event_editions[0] : reg.event_editions;
  const invite = reg.status === "confirmed" && ed?.group_invite_active && ed?.group_invite_url ? ed.group_invite_url : null;
  const at = steps.findIndex(([k]) => k === reg!.status);
  const isFailed = failed.has(reg.status);

  return (
    <div className="pb-20">
      <PageHeader eyebrow="Inscrição" title="Estado da" accent="inscrição" />
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <Reveal>
          <div className="rounded-3xl border border-line bg-paper p-6 shadow-lg sm:p-8">
            <dl className="divide-y divide-line">
              <div className="flex items-center justify-between py-3"><dt className="text-muted">Código</dt><dd className="rounded-lg bg-mist px-3 py-1 font-mono font-semibold">{reg.code}</dd></div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-muted">Estado</dt>
                <dd className={clsx("rounded-full px-3 py-1 text-sm font-semibold", isFailed ? "bg-red-50 text-red-700" : "bg-brand-soft text-brand-dark")}>{labels[reg.status] ?? reg.status}</dd>
              </div>
            </dl>
            {!isFailed && at >= 0 && (
              <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Progresso da inscrição">
                {steps.map(([k, label], i) => (
                  <li key={k} className="text-center">
                    <span className={clsx("mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors", i <= at ? "bg-brand text-white" : "bg-mist text-muted")}>{i < at || reg!.status === "confirmed" ? <Check size={16} strokeWidth={3} /> : i + 1}</span>
                    <span className={clsx("mt-2 block text-xs", i <= at ? "font-semibold" : "text-muted")}>{label}</span>
                  </li>
                ))}
              </ol>
            )}
            {nextSteps[reg.status] && <p className="mt-6 rounded-2xl bg-mist p-4 text-sm">{nextSteps[reg.status]}</p>}
            {invite && (
              <div className="mt-6 rounded-2xl bg-brand-soft p-5">
                <p className="font-semibold">Inscrição confirmada!</p>
                <p className="mt-1 text-sm">Entre, se desejar, no grupo oficial do evento. A entrada é voluntária.</p>
                <a href={invite} target="_blank" rel="noopener noreferrer" className="btn-shine mt-4 inline-block rounded-xl bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark">Entrar no grupo</a>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
