import Link from "next/link";
import { requireModule } from "@/lib/auth";
import { markAllRead, markRead } from "./actions";

export const metadata = { title: "Notificações" };

const kinds: Record<string, { label: string; href?: string }> = {
  new_registration: { label: "Nova inscrição", href: "/admin/inscricoes" },
  new_corporate_registration: { label: "Nova inscrição corporativa", href: "/admin/inscricoes" },
  new_lead: { label: "Novo lead", href: "/admin/crm" },
  new_quote: { label: "Novo pedido de orçamento", href: "/admin/crm" },
  missing_document: { label: "Documento em falta", href: "/admin/inscricoes" },
  payment_pending: { label: "Pagamento pendente", href: "/admin/pagamentos" },
  payment_confirmed: { label: "Pagamento confirmado", href: "/admin/pagamentos" },
  registration_approved: { label: "Inscrição aprovada", href: "/admin/inscricoes" },
  cohort_date_changed: { label: "Data de turma alterada", href: "/admin/formacoes" },
  event_approaching: { label: "Evento a aproximar-se", href: "/admin/summit" },
  contract_pending: { label: "Contrato pendente", href: "/admin/crm" },
};
const channels: Record<string, string> = { internal: "Painel", email: "E-mail", whatsapp: "WhatsApp", webhook: "Ligações externas" };

/** Nomes dos dados guardados nos avisos, em português. */
const fieldLabels: Record<string, string> = {
  name: "Nome", subject: "Assunto", score: "Pontuação", registration: "Inscrição", kind: "Tipo", motivo: "Motivo",
  code: "Código", email: "E-mail", phone: "Telefone", text: "Mensagem",
};
const subjectLabels: Record<string, string> = {
  geral: "Informações gerais", turma: "Treinamento por turma", personalizado: "Treinamento personalizado",
  edicao_especial: "Turma de edição especial", mentoria: "Mentoria", corporativo: "Proposta corporativa",
  summit: "Protagonista Summit", "teste-comunicacao": "Teste de comunicação",
};
const showValue = (k: string, v: unknown) => (k === "subject" && typeof v === "string" ? subjectLabels[v] ?? v : typeof v === "object" ? "…" : String(v));
const statuses: Record<string, string> = { queued: "Em fila", sent: "Enviada", failed: "Falhou", skipped: "Ignorada (sem integração)" };

const when = new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Luanda" });

export default async function Notificacoes({ searchParams }: { searchParams: Promise<{ canal?: string; so?: string }> }) {
  const sp = await searchParams;
  const { db } = await requireModule("notificacoes");
  let q = db.from("notifications").select("*").order("created_at", { ascending: false }).limit(150);
  const canal = sp.canal && sp.canal in channels ? sp.canal : "internal";
  q = q.eq("channel", canal);
  if (sp.so === "por-ler") q = q.is("read_at", null);
  const { data } = await q;
  const rows = data ?? [];
  const tab = (href: string, label: string, on: boolean) => (
    <Link href={href} className={`rounded-lg border px-3 py-1.5 text-sm ${on ? "border-brand bg-brand-soft" : "border-line bg-paper"}`}>{label}</Link>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Notificações</h1><p className="text-sm text-muted">Avisos gerados pelo sistema e estado das mensagens enviadas.</p></div>
        {canal === "internal" && <form action={markAllRead}><button className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm hover:bg-mist">Marcar todas como lidas</button></form>}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {Object.entries(channels).map(([k, l]) => tab(`/admin/notificacoes?canal=${k}`, l, canal === k))}
        <span className="mx-2 w-px bg-line" />
        {tab(`/admin/notificacoes?canal=${canal}`, "Todas", sp.so !== "por-ler")}
        {tab(`/admin/notificacoes?canal=${canal}&so=por-ler`, "Por ler", sp.so === "por-ler")}
      </div>

      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
        {rows.length === 0 && <li className="p-6 text-sm text-muted">Sem notificações.</li>}
        {rows.map((n) => {
          const k = kinds[n.kind] ?? { label: n.kind };
          const payload = Object.entries((n.payload ?? {}) as Record<string, unknown>).filter(([, v]) => v != null && v !== "");
          const unread = canal === "internal" && !n.read_at;
          return (
            <li key={n.id} className={`flex flex-wrap items-start justify-between gap-3 p-4 text-sm ${unread ? "bg-brand-soft/50" : ""}`}>
              <div className="min-w-0">
                <p className="font-semibold">{unread && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand align-middle" aria-label="Por ler" />}{k.label}
                  {canal !== "internal" && <span className="ml-2 rounded bg-mist px-2 py-0.5 text-xs font-normal">{statuses[n.status] ?? n.status}</span>}
                </p>
                {payload.length > 0 && <p className="mt-1 break-words text-muted">{payload.map(([a, b]) => `${fieldLabels[a] ?? a}: ${showValue(a, b)}`).join("; ")}</p>}
                {n.recipient && <p className="text-xs text-muted">Para: {n.recipient}</p>}
                {n.error && <p className="text-xs text-red-700">Erro: {n.error}</p>}
                <p className="mt-1 text-xs text-muted">{when.format(new Date(n.created_at))}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                {k.href && <Link href={k.href} className="font-semibold text-brand">Abrir →</Link>}
                {unread && <form action={markRead.bind(null, n.id)}><button className="underline">Marcar como lida</button></form>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
