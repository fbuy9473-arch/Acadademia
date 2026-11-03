import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth";
import { fieldSpecs, toFormValue } from "@/lib/section-fields";
import { sectionLabels, sectionTypes, type SectionType } from "@/lib/sections";
import ActionForm from "@/components/admin/ActionForm";
import SectionList from "@/components/admin/SectionList";
import { Checkbox, Field, Select, TextArea } from "@/components/ui";
import { addSection, deletePage, deleteSection, duplicatePage, savePageMeta, saveSection, setPageStatus } from "../actions";

export const metadata = { title: "Editar landing page" };

export default async function PageEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await requireModule("paginas");
  const [{ data: page }, { data: courses }, { data: revs }] = await Promise.all([
    db.from("pages").select("*, page_sections(*)").eq("id", id).maybeSingle(),
    db.from("courses").select("id,name").order("name"),
    db.from("page_revisions").select("id,saved_at").eq("page_id", id).order("saved_at", { ascending: false }).limit(10),
  ]);
  if (!page) notFound();
  const sections = [...page.page_sections].sort((a: any, b: any) => a.position - b.position);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><Link href="/admin/paginas" className="text-sm text-brand">← Landing pages</Link>
          <h1 className="mt-1 text-3xl font-bold">{page.title}</h1>
          <p className="text-sm text-muted">{page.status === "published" ? <>Publicada em <a className="text-brand underline" href={`${site}/l/${page.slug}`} target="_blank">/l/{page.slug}</a></> : "Rascunho — não visível publicamente"}</p></div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/paginas/${id}/preview`} target="_blank" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-mist">Pré-visualizar</Link>
          {page.status === "published"
            ? <form action={setPageStatus.bind(null, id, "draft")}><button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-mist">Despublicar</button></form>
            : <form action={setPageStatus.bind(null, id, "published")}><button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Publicar</button></form>}
          <form action={duplicatePage.bind(null, id)}><button className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-mist">Duplicar</button></form>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold">Secções</h2>
        <SectionList pageId={id} items={sections.map((s: any) => ({
          id: s.id,
          node: (
            <details>
              <summary className="cursor-pointer font-semibold">{sectionLabels[s.type as SectionType]}{!s.visible && <span className="ml-2 text-xs font-normal text-muted">(oculta)</span>}</summary>
              <ActionForm action={saveSection.bind(null, id, s.id, s.type)} className="mt-4 space-y-3">
                {fieldSpecs[s.type as SectionType].map((f) => {
                  const v = toFormValue(f, s.content);
                  return f.kind === "text" || f.kind === "url"
                    ? <Field key={f.name} label={f.label} name={f.name} defaultValue={v} />
                    : <TextArea key={f.name} label={f.hint ? `${f.label} — ${f.hint}` : f.label} name={f.name} rows={f.kind === "textarea" ? 4 : 6} defaultValue={v} />;
                })}
                <Checkbox name="visible" label="Visível" defaultChecked={s.visible} />
              </ActionForm>
              <form action={deleteSection.bind(null, id, s.id)} className="mt-3"><button className="text-sm text-red-700 underline">Remover secção</button></form>
            </details>
          ),
        }))} />
        <ActionForm action={addSection.bind(null, id)} submit="Adicionar secção" variant="ghost" className="mt-4 flex items-end gap-3">
          <Select label="Tipo" name="type" required options={sectionTypes.map((t) => ({ value: t, label: sectionLabels[t] }))} />
        </ActionForm>
      </section>

      <section className="rounded-xl border border-line bg-paper p-6">
        <h2 className="text-xl font-bold">Definições e SEO</h2>
        <ActionForm action={savePageMeta.bind(null, id)} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título interno" name="title" required defaultValue={page.title} />
            <Field label="Endereço (slug)" name="slug" required defaultValue={page.slug} />
            <Field label="Título SEO (máx. 70)" name="seo_title" defaultValue={page.seo_title} />
            <Field label="Imagem de partilha (https://…)" name="og_image_path" defaultValue={page.og_image_path} />
            <Field label="Redirecionar após submissão" name="redirect_after_submit" defaultValue={page.redirect_after_submit} hint="Caminho interno (/obrigado) ou https://…" />
            <Field label="Campanha" name="campaign" defaultValue={page.campaign} />
            <Select label="Formação associada" name="course_id" defaultValue={page.course_id} options={(courses ?? []).map((c) => ({ value: c.id, label: c.name }))} />
          </div>
          <TextArea label="Descrição SEO (máx. 170)" name="seo_description" rows={2} defaultValue={page.seo_description} />
          <Checkbox name="indexable" label="Permitir indexação nos motores de busca" defaultChecked={page.indexable} />
        </ActionForm>
      </section>

      <section className="rounded-xl border border-line bg-paper p-6">
        <h2 className="text-xl font-bold">Histórico</h2>
        <ul className="mt-3 text-sm text-muted">{(revs ?? []).map((r) => <li key={r.id}>{new Date(r.saved_at).toLocaleString("pt-AO")}</li>)}{(revs ?? []).length === 0 && <li>Sem versões guardadas.</li>}</ul>
      </section>

      <form action={deletePage.bind(null, id)}><button className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Eliminar página</button></form>
    </div>
  );
}
