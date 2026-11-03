import Link from "next/link";
import { notFound } from "next/navigation";
import { canAccess, requireModule } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import ActionForm from "@/components/admin/ActionForm";
import { Field, Select, TextArea } from "@/components/ui";
import { addPayment, markJoined, sendInvite, updateRegistration } from "../actions";
import { regLabels } from "@/lib/labels";

export const metadata = { title: "Inscrição" };

export default async function RegistrationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, role } = await requireModule("inscricoes");
  const { data: r }: { data: any } = await db.from("registrations")
    .select("*, participants(*), companies(*), ticket_types(name,kind), courses(name), training_plans(name), event_editions(title,group_invite_active)")
    .eq("id", id).maybeSingle();
  if (!r) notFound();

  const [{ data: history }, { data: docs }, { data: pays }, { data: contracts }] = await Promise.all([
    db.from("registration_history").select("*").eq("registration_id", id).order("changed_at", { ascending: false }),
    db.from("documents").select("id,kind,original_name,uploaded_at").eq("registration_id", id),
    db.from("payments").select("*").eq("registration_id", id).order("created_at", { ascending: false }),
    db.from("contracts").select("*").eq("registration_id", id),
  ]);
  const p = Array.isArray(r.participants) ? r.participants[0] : r.participants;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/inscricoes" className="text-sm text-brand">← Inscrições</Link>
        <h1 className="mt-1 text-3xl font-bold">Inscrição <span className="font-mono">{r.code}</span></h1>
        <p className="text-muted">{r.ticket_types?.name ?? r.courses?.name ?? r.training_plans?.name} · {r.amount != null ? formatMoney(Number(r.amount), r.currency) : "sem valor definido"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="font-bold">Participante</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div><dt className="inline text-muted">Nome: </dt><dd className="inline">{p?.full_name}</dd></div>
            <div><dt className="inline text-muted">E-mail: </dt><dd className="inline">{p?.email}</dd></div>
            <div><dt className="inline text-muted">Telefone: </dt><dd className="inline">{p?.phone}</dd></div>
            <div><dt className="inline text-muted">WhatsApp: </dt><dd className="inline">{p?.whatsapp ?? "—"}</dd></div>
            <div><dt className="inline text-muted">Documento: </dt><dd className="inline">{p?.id_number ?? "—"}</dd></div>
            {r.companies && <div><dt className="inline text-muted">Empresa: </dt><dd className="inline">{r.companies.name} (NIF {r.companies.nif})</dd></div>}
          </dl>
        </section>

        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="font-bold">Estado</h2>
          <ActionForm action={updateRegistration.bind(null, id)} className="mt-3 space-y-3">
            <Select label="Estado da inscrição" name="status" required defaultValue={r.status} options={Object.entries(regLabels).map(([value, label]) => ({ value, label }))} />
            <TextArea label="Observações internas" name="internal_notes" defaultValue={r.internal_notes} rows={3} />
          </ActionForm>
        </section>
      </div>

      <section className="rounded-xl border border-line bg-paper p-5">
        <h2 className="font-bold">Documentos</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {(docs ?? []).map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2">
              <span>{d.kind} — {d.original_name}</span>
              <a href={`/admin/documentos/${d.id}`} target="_blank" rel="noopener" className="text-brand underline">Abrir (ligação temporária)</a>
            </li>
          ))}
          {(docs ?? []).length === 0 && <li className="py-2 text-muted">Sem documentos.</li>}
        </ul>
      </section>

      {canAccess(role, "pagamentos") && (
        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="font-bold">Pagamentos</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {(pays ?? []).map((x) => <li key={x.id} className="flex justify-between py-2"><span>{formatMoney(Number(x.amount), x.currency)} · {x.method ?? "—"} · {x.reference ?? ""}</span><span>{x.status}</span></li>)}
            {(pays ?? []).length === 0 && <li className="py-2 text-muted">Sem pagamentos registados.</li>}
          </ul>
          <ActionForm action={addPayment.bind(null, id)} submit="Registar pagamento" className="mt-4 grid gap-3 sm:grid-cols-4" variant="ghost">
            <Field label="Valor" name="amount" type="number" step="0.01" required />
            <Field label="Moeda" name="currency" defaultValue={r.currency ?? ""} required />
            <Field label="Método" name="method" />
            <Field label="Referência" name="reference" />
          </ActionForm>
        </section>
      )}

      {(contracts ?? []).length > 0 && (
        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="font-bold">Contrato corporativo</h2>
          {(contracts ?? []).map((c) => <p key={c.id} className="mt-2 text-sm">Estado: {c.status} · Ingressos VIP associados: {c.vip_tickets_granted}</p>)}
        </section>
      )}

      {r.status === "confirmed" && r.edition_id && (
        <section className="rounded-xl border border-line bg-paper p-5">
          <h2 className="font-bold">Grupo oficial</h2>
          <p className="mt-2 text-sm text-muted">Convite enviado: {r.invite_sent_at ? new Date(r.invite_sent_at).toLocaleString("pt-AO") : "ainda não"} · Entrada confirmada: {r.invite_joined_at ? new Date(r.invite_joined_at).toLocaleString("pt-AO") : "não"}</p>
          <div className="mt-3 flex gap-3">
            <ActionForm action={sendInvite.bind(null, id)} submit={r.invite_sent_at ? "Reenviar instruções" : "Enviar convite"} variant="ghost"><></></ActionForm>
            <form action={markJoined.bind(null, id)}><button className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold hover:bg-mist">Marcar entrada confirmada</button></form>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-line bg-paper p-5">
        <h2 className="font-bold">Histórico de estados</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {(history ?? []).map((h) => <li key={h.id}>{new Date(h.changed_at).toLocaleString("pt-AO")} — {h.from_status ? `${regLabels[h.from_status]} → ` : ""}<strong>{regLabels[h.to_status]}</strong></li>)}
        </ul>
      </section>
    </div>
  );
}
