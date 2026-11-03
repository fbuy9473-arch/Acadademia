import Link from "next/link";
import { requireModule } from "@/lib/auth";
import { isoToLuanda } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import ActionForm from "@/components/admin/ActionForm";
import { Checkbox, Field, Select, TextArea } from "@/components/ui";
import { addAudience, addSession, createEdition, deleteAudience, deleteSession, moveSession, saveEdition, saveTicket } from "./actions";

export const metadata = { title: "Protagonista Summit" };

export default async function SummitAdmin({ searchParams }: { searchParams: Promise<{ ed?: string }> }) {
  const { ed } = await searchParams;
  const { db } = await requireModule("summit");
  const { data: editions } = await db.from("event_editions").select("id,year,title,is_current,status").order("year", { ascending: false });
  const current = (editions ?? []).find((e) => e.id === ed) ?? (editions ?? []).find((e) => e.is_current) ?? (editions ?? [])[0];

  const header = (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {(editions ?? []).map((e) => <Link key={e.id} href={`/admin/summit?ed=${e.id}`} className={`rounded-lg border px-3 py-1.5 ${e.id === current?.id ? "border-brand bg-brand-soft" : "border-line bg-paper"}`}>{e.year}{e.is_current && " ★"}</Link>)}
    </div>
  );
  const create = (
    <ActionForm action={createEdition} submit="Criar edição" variant="ghost" className="mt-4 flex flex-wrap items-end gap-3">
      <Field label="Ano" name="year" type="number" required defaultValue={new Date().getFullYear() + 1} />
      <Field label="Moeda" name="currency" defaultValue="AOA" />
    </ActionForm>
  );
  if (!current) return <div><h1 className="text-3xl font-bold">Protagonista Summit</h1><p className="mt-3 text-muted">Ainda não há edições. Execute a migração ou crie a primeira.</p>{create}</div>;

  const [{ data: e }, { data: tickets }, { data: sessions }, { data: audiences }, { data: regs }] = await Promise.all([
    db.from("event_editions").select("*").eq("id", current.id).single(),
    db.from("ticket_types").select("*").eq("edition_id", current.id).order("kind"),
    db.from("event_sessions").select("*").eq("edition_id", current.id).order("position"),
    db.from("event_audiences").select("*").eq("edition_id", current.id).order("position"),
    db.from("registrations").select("ticket_type_id,status").eq("edition_id", current.id),
  ]);
  const sold = (tid: string, st: string[]) => (regs ?? []).filter((r) => r.ticket_type_id === tid && st.includes(r.status)).length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Protagonista Summit</h1>
      {header}
      <section className="rounded-xl border border-line bg-paper p-6">
        <h2 className="text-xl font-bold">Edição {e.year}</h2>
        <p className="text-sm text-muted">A data definida aqui é a única fonte: hero, contagem decrescente, formulários e confirmações usam este valor.</p>
        <ActionForm action={saveEdition.bind(null, e.id)} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" name="title" required defaultValue={e.title} />
            <Field label="Headline" name="headline" defaultValue={e.headline} />
            <Field label="Início (hora de Luanda)" name="starts_at" type="datetime-local" required defaultValue={isoToLuanda(e.starts_at)} />
            <Field label="Fim (hora de Luanda)" name="ends_at" type="datetime-local" defaultValue={isoToLuanda(e.ends_at)} />
            <Field label="Local" name="venue" defaultValue={e.venue} />
            <Field label="Cidade" name="city" defaultValue={e.city} />
            <Field label="Moeda dos ingressos" name="currency" defaultValue={e.currency} />
            <Field label="URL do vídeo" name="video_url" defaultValue={e.video_url} hint="https://…" />
            <Select label="Estado" name="status" required defaultValue={e.status} options={[{ value: "draft", label: "Rascunho" }, { value: "published", label: "Publicado" }, { value: "archived", label: "Arquivado" }]} />
          </div>
          <TextArea label="Subtítulo" name="subtitle" rows={2} defaultValue={e.subtitle} />
          <TextArea label="O que é o evento" name="about" rows={5} defaultValue={e.about} />
          <TextArea label="História do evento" name="history" rows={5} defaultValue={e.history} />
          <label className="block text-sm"><span className="font-medium">Imagem do hero</span><input type="file" name="hero_image" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-sm" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Convite do grupo (https://…)" name="group_invite_url" defaultValue={e.group_invite_url} />
            <div className="space-y-2 pt-6">
              <Checkbox name="group_invite_active" label="Convite do grupo ativo" defaultChecked={e.group_invite_active} />
              <Checkbox name="registrations_open" label="Inscrições abertas" defaultChecked={e.registrations_open} />
              <Checkbox name="is_current" label="Edição atual (mostrada no site)" defaultChecked={e.is_current} />
            </div>
          </div>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Ingressos e pacotes</h2>
        {(tickets ?? []).map((t) => (
          <details key={t.id} className="rounded-xl border border-line bg-paper">
            <summary className="cursor-pointer p-4 font-semibold">{t.name} <span className="font-normal text-muted">· {t.total_quantity} no total · {sold(t.id, ["pending_documents", "pending_payment", "in_validation", "confirmed"])} reservados · {sold(t.id, ["confirmed"])} confirmados{t.price_published && t.price != null ? ` · ${formatMoney(Number(t.price), e.currency)}` : ""}</span></summary>
            <div className="border-t border-line p-4">
              <ActionForm action={saveTicket.bind(null, t.id)}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Nome" name="name" required defaultValue={t.name} />
                  <Field label="Quantidade total (inventário)" name="total_quantity" type="number" min={0} required defaultValue={t.total_quantity} />
                  <Field label="Lote" name="batch_label" defaultValue={t.batch_label} />
                  <Field label="Preço" name="price" type="number" step="0.01" defaultValue={t.price} />
                  <Field label="Preço promocional" name="promo_price" type="number" step="0.01" defaultValue={t.promo_price} />
                  <Field label="Promoção termina" name="promo_ends_at" type="datetime-local" defaultValue={isoToLuanda(t.promo_ends_at)} />
                  <Field label="Início das vendas" name="sales_start" type="datetime-local" defaultValue={isoToLuanda(t.sales_start)} />
                  <Field label="Fim das vendas" name="sales_end" type="datetime-local" defaultValue={isoToLuanda(t.sales_end)} />
                  {t.kind === "corporativo" && <>
                    <Field label="Ingressos VIP incluídos" name="includes_vip_tickets" type="number" min={0} defaultValue={t.includes_vip_tickets} />
                    <Field label="Exposições públicas" name="includes_public_exposure" type="number" min={0} defaultValue={t.includes_public_exposure} />
                  </>}
                </div>
                <TextArea label="Benefícios (um por linha)" name="benefits" rows={4} defaultValue={(t.benefits ?? []).join("\n")} />
                <TextArea label="Condições de acesso / contratação" name="access_conditions" rows={2} defaultValue={t.access_conditions} />
                <div className="flex flex-wrap gap-6">
                  <Checkbox name="price_published" label="Mostrar preço no site" defaultChecked={t.price_published} />
                  <Checkbox name="active" label="Categoria ativa" defaultChecked={t.active} />
                  {t.kind === "corporativo" && <Checkbox name="includes_stage_pitch" label="Inclui pitch no palco principal" defaultChecked={t.includes_stage_pitch} />}
                </div>
              </ActionForm>
            </div>
          </details>
        ))}
      </section>

      <section className="rounded-xl border border-line bg-paper p-6">
        <h2 className="text-xl font-bold">Programação</h2>
        <ol className="mt-3 divide-y divide-line text-sm">
          {(sessions ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2">
              <span><strong>{isoToLuanda(s.starts_at).slice(11)}</strong> {s.title}{s.speaker && ` — ${s.speaker}`}</span>
              <span className="flex gap-3">
                <form action={moveSession.bind(null, e.id, s.id, -1)}><button aria-label="Subir" className="px-1">↑</button></form>
                <form action={moveSession.bind(null, e.id, s.id, 1)}><button aria-label="Descer" className="px-1">↓</button></form>
                <form action={deleteSession.bind(null, s.id)}><button className="text-red-700 underline">Remover</button></form>
              </span>
            </li>
          ))}
          {(sessions ?? []).length === 0 && <li className="py-2 text-muted">Sem sessões.</li>}
        </ol>
        <ActionForm action={addSession.bind(null, e.id)} submit="Adicionar sessão" variant="ghost" className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Horário" name="starts_at" type="datetime-local" required />
          <Field label="Tema" name="title" required />
          <Field label="Orador" name="speaker" />
          <Field label="Tipo" name="activity_type" />
          <Field label="Palco / local" name="stage" />
          <Field label="Duração (min)" name="duration_minutes" type="number" min={1} />
        </ActionForm>
      </section>

      <section className="rounded-xl border border-line bg-paper p-6">
        <h2 className="text-xl font-bold">Para quem é o evento</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {(audiences ?? []).map((a) => <li key={a.id} className="flex justify-between py-2"><span>{a.title}</span><form action={deleteAudience.bind(null, a.id)}><button className="text-red-700 underline">Remover</button></form></li>)}
        </ul>
        <ActionForm action={addAudience.bind(null, e.id)} submit="Adicionar público" variant="ghost" className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Título" name="title" required /><Field label="Descrição" name="description" />
        </ActionForm>
      </section>

      <section className="rounded-xl border border-line bg-paper p-6"><h2 className="text-xl font-bold">Nova edição</h2>{create}</section>
    </div>
  );
}
