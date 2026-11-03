import Link from "next/link";
import { requireModule } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { regLabels } from "@/lib/labels";

export const metadata = { title: "Inscrições" };

export default async function Inscricoes({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string }> }) {
  const { estado, q } = await searchParams;
  const { db } = await requireModule("inscricoes");
  let query = db.from("registrations")
    .select("id,code,status,amount,currency,created_at,participants!inner(full_name,email),ticket_types(name),courses(name),training_plans(name)")
    .order("created_at", { ascending: false }).limit(200);
  if (estado) query = query.eq("status", estado);
  if (q) query = query.or(`full_name.ilike.%${q.replace(/[%,()]/g, "")}%`, { referencedTable: "participants" });
  const { data } = await query;
  const rows: any[] = data ?? [];

  return (
    <div>
      <h1 className="text-3xl font-bold">Inscrições</h1>
      <form className="mt-5 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={q} placeholder="Pesquisar por nome" className="rounded-lg border border-line bg-paper px-3 py-2" />
        <select name="estado" defaultValue={estado ?? ""} className="rounded-lg border border-line bg-paper px-3 py-2">
          <option value="">Todos os estados</option>
          {Object.entries(regLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <button className="rounded-lg bg-ink px-4 py-2 text-white">Filtrar</button>
      </form>
      <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3">Código</th><th className="p-3">Participante</th><th className="p-3">Inscrição</th><th className="p-3">Valor</th><th className="p-3">Estado</th><th className="p-3">Data</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const p = Array.isArray(r.participants) ? r.participants[0] : r.participants;
              const what = r.ticket_types?.name ?? r.courses?.name ?? r.training_plans?.name ?? "—";
              return (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-mist">
                  <td className="p-3 font-mono"><Link href={`/admin/inscricoes/${r.id}`} className="text-brand underline">{r.code}</Link></td>
                  <td className="p-3">{p?.full_name}<span className="block text-xs text-muted">{p?.email}</span></td>
                  <td className="p-3">{what}</td>
                  <td className="p-3">{r.amount != null ? formatMoney(Number(r.amount), r.currency) : "—"}</td>
                  <td className="p-3">{regLabels[r.status]}</td>
                  <td className="p-3 text-muted">{new Date(r.created_at).toLocaleDateString("pt-AO")}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">Sem inscrições.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
