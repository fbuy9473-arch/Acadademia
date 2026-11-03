import Link from "next/link";
import { canAccess, requireModule } from "@/lib/auth";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Dashboard" };

function range(sp: { p?: string; from?: string; to?: string }) {
  const now = new Date();
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let from = new Date(sod.getTime() - 29 * 86_400_000), to = new Date(sod.getTime() + 86_400_000);
  if (sp.p === "hoje") from = sod;
  else if (sp.p === "7") from = new Date(sod.getTime() - 6 * 86_400_000);
  else if (sp.p === "mes") from = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (sp.p === "custom" && sp.from && sp.to) {
    from = new Date(sp.from); to = new Date(new Date(sp.to).getTime() + 86_400_000);
  }
  return { from, to };
}

const periods = [["hoje", "Hoje"], ["7", "Últimos 7 dias"], ["30", "Últimos 30 dias"], ["mes", "Mês atual"]];

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ p?: string; from?: string; to?: string }> }) {
  const sp = await searchParams;
  const s = await requireModule("dashboard");
  const { db, role } = s;
  const { from, to } = range(sp);
  const f = from.toISOString(), t = to.toISOString();
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const head = { count: "exact" as const, head: true };
  const showNotif = canAccess(role, "notificacoes"), showReg = canAccess(role, "inscricoes"), showFin = canAccess(role, "pagamentos"), showCrm = canAccess(role, "crm"), showCms = canAccess(role, "formacoes");

  const [unreadNotifs, participants, regsPeriod, regsPending, courses, cohorts, leads, ticketsSold, payConfirmed, payPending, views, regRows, leadsTotal, confirmedPeriod] = await Promise.all([
    showNotif ? count(db.from("notifications").select("id", head).eq("channel", "internal").is("read_at", null)) : 0,
    showReg ? count(db.from("participants").select("id", head)) : 0,
    showReg ? count(db.from("registrations").select("id", head).gte("created_at", f).lt("created_at", t)) : 0,
    showReg ? count(db.from("registrations").select("id", head).in("status", ["pending_documents", "pending_payment", "in_validation"])) : 0,
    showCms ? count(db.from("courses").select("id", head).in("status", ["published", "open", "full"])) : 0,
    showCms ? count(db.from("cohorts").select("id", head).gte("starts_on", new Date().toISOString().slice(0, 10))) : 0,
    showCrm ? count(db.from("leads").select("id", head).gte("created_at", f).lt("created_at", t)) : 0,
    showReg ? count(db.from("registrations").select("id", head).not("ticket_type_id", "is", null).eq("status", "confirmed")) : 0,
    showFin ? db.from("payments").select("amount,currency").eq("status", "confirmed").gte("confirmed_at", f).lt("confirmed_at", t).then((r) => r.data ?? []) : [],
    showFin ? db.from("payments").select("amount,currency").eq("status", "pending").then((r) => r.data ?? []) : [],
    showCms ? count(db.from("page_views").select("id", head).gte("viewed_at", f).lt("viewed_at", t)) : 0,
    showReg ? db.from("registrations").select("created_at,status").gte("created_at", f).lt("created_at", t).then((r) => r.data ?? []) : [],
    showCrm ? count(db.from("leads").select("id", head)) : 0,
    showReg ? count(db.from("registrations").select("id", head).eq("status", "confirmed").gte("created_at", f).lt("created_at", t)) : 0,
  ]);

  const sum = (rows: { amount: number; currency: string }[]) => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.currency, (m.get(r.currency) ?? 0) + Number(r.amount)));
    return [...m.entries()].map(([c, a]) => formatMoney(a, c)).join(" · ") || "—";
  };

  // registos por dia
  const days: { d: string; n: number }[] = [];
  for (let d = new Date(from); d < to && days.length < 92; d = new Date(d.getTime() + 86_400_000)) days.push({ d: d.toISOString().slice(0, 10), n: 0 });
  regRows.forEach((r: { created_at: string }) => { const x = days.find((y) => y.d === r.created_at.slice(0, 10)); if (x) x.n++; });
  const max = Math.max(1, ...days.map((x) => x.n));

  const cards: [string, string | number][] = [
    ...(showNotif ? ([["Notificações por ler", unreadNotifs]] as [string, number][]) : []),
    ...(showReg ? ([["Participantes registados", participants], ["Inscrições no período", regsPeriod], ["Inscrições pendentes", regsPending], ["Ingressos vendidos (confirmados)", ticketsSold]] as [string, number][]) : []),
    ...(showCms ? ([["Formações publicadas", courses], ["Turmas futuras", cohorts], ["Visualizações de landing pages", views]] as [string, number][]) : []),
    ...(showCrm ? ([["Leads no período", leads]] as [string, number][]) : []),
    ...(showFin ? ([["Receita recebida (período)", sum(payConfirmed as any)], ["Pagamentos pendentes", sum(payPending as any)]] as [string, string][]) : []),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold">Dashboard</h1><p className="text-sm text-muted">Resumo da atividade da Academia.</p></div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {periods.map(([k, l]) => <Link key={k} href={`/admin?p=${k}`} className={`rounded-lg border px-3 py-1.5 ${(sp.p ?? "30") === k ? "border-brand bg-brand-soft" : "border-line bg-paper"}`}>{l}</Link>)}
          <form className="flex items-center gap-1"><input type="hidden" name="p" value="custom" />
            <input type="date" name="from" defaultValue={sp.from} className="rounded-lg border border-line px-2 py-1.5" aria-label="De" />
            <input type="date" name="to" defaultValue={sp.to} className="rounded-lg border border-line px-2 py-1.5" aria-label="Até" />
            <button className="rounded-lg bg-ink px-3 py-1.5 text-white">Aplicar</button></form>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([l, v]) => (
          <div key={l} className={`rounded-xl border bg-paper p-5 ${l === "Notificações por ler" && Number(v) > 0 ? "border-brand" : "border-line"}`}><p className="text-sm text-muted">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>
        ))}
      </div>

      {showReg && (
        <section className="mt-8 rounded-xl border border-line bg-paper p-5">
          <h2 className="font-bold">Inscrições por dia</h2>
          {regRows.length === 0 ? <p className="mt-3 text-sm text-muted">Sem inscrições neste período.</p> : (
            <svg role="img" aria-label="Inscrições por dia" viewBox={`0 0 ${days.length * 14} 120`} className="mt-4 h-40 w-full" preserveAspectRatio="none">
              {days.map((x, i) => <rect key={x.d} x={i * 14 + 2} width={10} y={110 - (x.n / max) * 100} height={(x.n / max) * 100} fill="#028034" rx={2}><title>{`${x.d}: ${x.n}`}</title></rect>)}
            </svg>
          )}
        </section>
      )}

      {showReg && showCrm && leadsTotal > 0 && (
        <p className="mt-6 text-sm text-muted">
          Taxa de conversão (inscrições confirmadas ÷ leads no período): {leads > 0 ? `${((confirmedPeriod / leads) * 100).toFixed(1)}%` : "dados insuficientes"}
        </p>
      )}
    </div>
  );
}
