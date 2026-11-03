import Link from "next/link";
import { requireModule } from "@/lib/auth";
import ActionForm from "@/components/admin/ActionForm";
import { Field } from "@/components/ui";
import { createPage } from "./actions";

export const metadata = { title: "Landing Pages" };

export default async function Paginas() {
  const { db } = await requireModule("paginas");
  const [{ data: pages }, { data: views }] = await Promise.all([
    db.from("pages").select("id,title,slug,status,campaign,updated_at").eq("kind", "landing").order("updated_at", { ascending: false }),
    db.from("page_views").select("page_id"),
  ]);
  const count = (id: string) => (views ?? []).filter((v) => v.page_id === id).length;
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Landing Pages</h1>
      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3">Título</th><th className="p-3">Endereço</th><th className="p-3">Estado</th><th className="p-3">Visualizações</th></tr></thead>
          <tbody>
            {(pages ?? []).map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-mist">
                <td className="p-3"><Link className="text-brand underline" href={`/admin/paginas/${p.id}`}>{p.title}</Link></td>
                <td className="p-3 font-mono">/l/{p.slug}</td>
                <td className="p-3">{p.status === "published" ? "Publicada" : "Rascunho"}</td>
                <td className="p-3">{count(p.id)}</td>
              </tr>
            ))}
            {(pages ?? []).length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted">Ainda não há landing pages.</td></tr>}
          </tbody>
        </table>
      </div>
      <section className="rounded-xl border border-line bg-paper p-6">
        <h2 className="text-xl font-bold">Nova landing page</h2>
        <ActionForm action={createPage} submit="Criar e editar" className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Título" name="title" required />
          <Field label="Endereço (slug)" name="slug" hint="Ficará em /l/endereço" />
        </ActionForm>
      </section>
    </div>
  );
}
