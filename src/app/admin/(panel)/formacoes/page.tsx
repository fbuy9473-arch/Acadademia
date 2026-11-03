import Link from "next/link";
import { requireModule } from "@/lib/auth";
import { courseStatusLabels } from "@/lib/labels";

export const metadata = { title: "Formações" };

export default async function Formacoes() {
  const { db } = await requireModule("formacoes");
  const { data } = await db.from("courses").select("id,name,status,duration_days,modality,course_categories(name)").order("created_at", { ascending: false });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Formações</h1>
        <Link href="/admin/formacoes/nova" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Nova formação</Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3">Nome</th><th className="p-3">Categoria</th><th className="p-3">Duração</th><th className="p-3">Modalidade</th><th className="p-3">Estado</th></tr></thead>
          <tbody>
            {(data ?? []).map((c: any) => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-mist">
                <td className="p-3"><Link className="text-brand underline" href={`/admin/formacoes/${c.id}`}>{c.name}</Link></td>
                <td className="p-3">{c.course_categories?.name ?? "—"}</td>
                <td className="p-3">{c.duration_days ? `${c.duration_days} dias` : "—"}</td>
                <td className="p-3">{c.modality ?? "—"}</td>
                <td className="p-3">{courseStatusLabels[c.status]}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">Ainda não há formações. Crie a primeira.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
