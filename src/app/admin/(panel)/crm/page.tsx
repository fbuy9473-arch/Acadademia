import { requireModule } from "@/lib/auth";
import ActionForm from "@/components/admin/ActionForm";
import { TextArea } from "@/components/ui";
import { addNote, assignToMe, moveLead } from "./actions";

export const metadata = { title: "CRM / Leads" };

export default async function Crm() {
  const { db } = await requireModule("crm");
  const [{ data: stages }, { data: leads }, { data: inter }] = await Promise.all([
    db.from("pipeline_stages").select("*").order("position"),
    db.from("leads").select("*, profiles!leads_owner_id_fkey(full_name)").order("created_at", { ascending: false }).limit(300),
    db.from("lead_interactions").select("*").order("created_at", { ascending: false }).limit(500),
  ]);
  return (
    <div>
      <h1 className="text-3xl font-bold">CRM / Leads</h1>
      <p className="text-sm text-muted">Os pedidos de proposta e contactos do site entram na primeira etapa.</p>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {(stages ?? []).map((st) => {
          const col = (leads ?? []).filter((l: any) => l.stage_id === st.id);
          return (
            <section key={st.id} className="w-72 shrink-0 rounded-xl bg-paper p-3 border border-line">
              <h2 className="mb-3 text-sm font-bold">{st.name} <span className="font-normal text-muted">({col.length})</span></h2>
              <div className="space-y-3">
                {col.map((l: any) => (
                  <article key={l.id} className="rounded-lg border border-line p-3 text-sm">
                    <p className="font-semibold">{l.name}</p>
                    <p className="text-xs text-muted">{[l.company_name, l.email, l.phone].filter(Boolean).join(" · ")}</p>
                    {l.plan_kind && <p className="mt-1 text-xs text-brand">{l.plan_kind}</p>}
                    {l.message && <p className="mt-2 text-xs">{l.message}</p>}
                    {l.extra?.participants && <p className="text-xs text-muted">Participantes: {l.extra.participants}</p>}
                    <p className="mt-2 text-xs text-muted">Responsável: {l.profiles?.full_name || "—"}</p>
                    <form action={moveLead.bind(null, l.id)} className="mt-2 flex gap-1">
                      <select name="stage_id" defaultValue={l.stage_id ?? ""} aria-label="Etapa" className="min-w-0 flex-1 rounded border border-line px-1 py-1 text-xs">
                        {(stages ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <button className="rounded bg-ink px-2 text-xs text-white">Mover</button>
                    </form>
                    {!l.owner_id && <form action={assignToMe.bind(null, l.id)}><button className="mt-1 text-xs text-brand underline">Assumir</button></form>}
                    <details className="mt-2"><summary className="cursor-pointer text-xs text-muted">Histórico ({(inter ?? []).filter((i) => i.lead_id === l.id).length})</summary>
                      <ul className="mt-1 space-y-1 text-xs">{(inter ?? []).filter((i) => i.lead_id === l.id).map((i) => <li key={i.id}>{new Date(i.created_at).toLocaleDateString("pt-AO")} — {i.body}</li>)}</ul>
                      <ActionForm action={addNote.bind(null, l.id)} submit="Guardar nota" variant="ghost" className="mt-2 space-y-2"><TextArea label="Nova nota" name="body" rows={2} /></ActionForm>
                    </details>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
