import Link from "next/link";
import { requireModule } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import ActionForm from "@/components/admin/ActionForm";
import { Field } from "@/components/ui";
import { addExchangeRate, addExpense, setPaymentStatus } from "./actions";

export const metadata = { title: "Pagamentos" };

const sumBy = (rows: { amount: number; currency: string }[]) => {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(r.currency, (m.get(r.currency) ?? 0) + Number(r.amount)));
  return [...m.entries()].map(([c, a]) => formatMoney(a, c)).join(" · ") || "—";
};

export default async function Pagamentos() {
  const { db } = await requireModule("pagamentos");
  const [{ data: pays }, { data: exp }] = await Promise.all([
    db.from("payments").select("*, registrations(code, participants(full_name))").order("created_at", { ascending: false }).limit(300),
    db.from("expenses").select("*").order("spent_on", { ascending: false }).limit(100),
  ]);
  const by = (s: string) => (pays ?? []).filter((p) => p.status === s);
  const stats: [string, string][] = [
    ["Recebido (confirmado)", sumBy(by("confirmed"))], ["Pendente de validação", sumBy(by("pending"))],
    ["Reembolsado", sumBy(by("refunded"))], ["Despesas", sumBy(exp ?? [])],
  ];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Pagamentos</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/admin/exportar/pagamentos" className="rounded-lg border border-line px-4 py-2 font-semibold hover:bg-mist">Exportar pagamentos (CSV)</Link>
          <Link href="/admin/exportar/inscricoes" className="rounded-lg border border-line px-4 py-2 font-semibold hover:bg-mist">Exportar inscrições (CSV)</Link>
        </div>
      </div>
      <p className="text-sm text-muted">Valores na moeda original; não há conversão automática. Só pagamentos validados contam como receita.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([l, v]) => <div key={l} className="rounded-xl border border-line bg-paper p-5"><p className="text-sm text-muted">{l}</p><p className="mt-1 text-xl font-bold">{v}</p></div>)}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3">Inscrição</th><th className="p-3">Valor</th><th className="p-3">Método / ref.</th><th className="p-3">Estado</th><th className="p-3">Ações</th></tr></thead>
          <tbody>
            {(pays ?? []).map((p: any) => (
              <tr key={p.id} className="border-b border-line last:border-0">
                <td className="p-3">{p.registrations?.code ?? "—"}<span className="block text-xs text-muted">{p.registrations?.participants?.full_name}</span></td>
                <td className="p-3">{formatMoney(Number(p.amount), p.currency)}</td>
                <td className="p-3">{[p.method, p.reference].filter(Boolean).join(" · ") || "—"}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3">{p.status === "pending" && (
                  <span className="flex gap-3">
                    <form action={setPaymentStatus.bind(null, p.id, "confirmed")}><button className="font-semibold text-brand underline">Confirmar</button></form>
                    <form action={setPaymentStatus.bind(null, p.id, "failed")}><button className="text-red-700 underline">Rejeitar</button></form>
                  </span>)}
                  {p.status === "confirmed" && <form action={setPaymentStatus.bind(null, p.id, "refunded")}><button className="text-red-700 underline">Reembolsar</button></form>}
                </td>
              </tr>
            ))}
            {(pays ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">Sem pagamentos.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-paper p-6"><h2 className="font-bold">Registar despesa</h2>
          <ActionForm action={addExpense} submit="Registar" variant="ghost" className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Descrição" name="description" required /><Field label="Data" name="spent_on" type="date" />
            <Field label="Valor" name="amount" type="number" step="0.01" required /><Field label="Moeda" name="currency" required />
          </ActionForm></section>
        <section className="rounded-xl border border-line bg-paper p-6"><h2 className="font-bold">Registar taxa de câmbio</h2>
          <ActionForm action={addExchangeRate} submit="Registar" variant="ghost" className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="De" name="from_currency" required /><Field label="Para" name="to_currency" required /><Field label="Taxa" name="rate" type="number" step="0.000001" required />
          </ActionForm></section>
      </div>
    </div>
  );
}
