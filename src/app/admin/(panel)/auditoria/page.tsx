import Link from "next/link";
import { requireModule } from "@/lib/auth";
import { fieldLabel, tableLabel } from "@/lib/audit-labels";

export const metadata = { title: "Auditoria" };

const when = new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "medium", timeZone: "Africa/Luanda" });
const actions: Record<string, string> = { INSERT: "Criou", UPDATE: "Alterou", DELETE: "Eliminou" };

/** Só mostra os campos que mudaram (ou todos, numa criação/eliminação). */
function changes(oldD: Record<string, unknown> | null, newD: Record<string, unknown> | null) {
  const keys = new Set([...Object.keys(oldD ?? {}), ...Object.keys(newD ?? {})]);
  // identificadores internos e datas de atualização não interessam a quem lê o registo
  return [...keys].filter((k) => JSON.stringify(oldD?.[k]) !== JSON.stringify(newD?.[k]) && k !== "updated_at" && k !== "id" && !k.endsWith("_id"));
}
const show = (v: unknown) =>
  v === undefined || v === null ? "—" : typeof v === "boolean" ? (v ? "Sim" : "Não") : typeof v === "object" ? "(conteúdo alterado)" : String(v);

export default async function Auditoria({ searchParams }: { searchParams: Promise<{ tabela?: string }> }) {
  const sp = await searchParams;
  const { db } = await requireModule("auditoria");
  const [{ data: tables }, { data }] = await Promise.all([
    db.from("audit_log").select("table_name").order("at", { ascending: false }).limit(500),
    sp.tabela
      ? db.from("audit_log").select("*").eq("table_name", sp.tabela).order("at", { ascending: false }).limit(200)
      : db.from("audit_log").select("*").order("at", { ascending: false }).limit(200),
  ]);
  const names = [...new Set((tables ?? []).map((t) => t.table_name))].sort((a, b) => tableLabel(a).localeCompare(tableLabel(b), "pt"));
  const actorIds = [...new Set((data ?? []).map((r) => r.actor_id).filter(Boolean))] as string[];
  const { data: actors } = actorIds.length ? await db.from("profiles").select("id,full_name").in("id", actorIds) : { data: [] };
  const who = new Map((actors ?? []).map((a) => [a.id, a.full_name || "Utilizador"]));

  return (
    <div>
      <h1 className="text-3xl font-bold">Auditoria</h1>
      <p className="text-sm text-muted">Registo automático de quem criou, alterou ou eliminou dados sensíveis. Últimos 200 eventos.</p>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/auditoria" className={`rounded-lg border px-3 py-1.5 ${!sp.tabela ? "border-brand bg-brand-soft" : "border-line bg-paper"}`}>Tudo</Link>
        {names.map((n) => <Link key={n} href={`/admin/auditoria?tabela=${n}`} className={`rounded-lg border px-3 py-1.5 ${sp.tabela === n ? "border-brand bg-brand-soft" : "border-line bg-paper"}`}>{tableLabel(n)}</Link>)}
      </div>

      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper text-sm">
        {(data ?? []).length === 0 && <li className="p-6 text-muted">Sem eventos registados.</li>}
        {(data ?? []).map((r) => {
          const diff = changes(r.old_data, r.new_data);
          return (
            <li key={r.id} className="p-4">
              <details>
                <summary className="cursor-pointer list-none">
                  <span className="font-semibold">{actions[r.action] ?? r.action}</span> <span className="ml-1">{tableLabel(r.table_name)}</span>
                  <span className="ml-2 text-muted">por {r.actor_id ? who.get(r.actor_id) ?? "Utilizador" : "sistema"}</span>
                  <span className="ml-2 text-xs text-muted">{when.format(new Date(r.at))}</span>
                </summary>
                <table className="mt-3 w-full text-left text-xs">
                  <thead><tr className="text-muted"><th className="py-1 pr-3">Campo</th><th className="pr-3">Antes</th><th>Depois</th></tr></thead>
                  <tbody>
                    {diff.map((k) => (
                      <tr key={k} className="border-t border-line align-top">
                        <td className="py-1 pr-3 font-medium">{fieldLabel(k)}</td>
                        <td className="break-all pr-3 text-red-700">{show(r.old_data?.[k])}</td>
                        <td className="break-all text-brand-dark">{show(r.new_data?.[k])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
