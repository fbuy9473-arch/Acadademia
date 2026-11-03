import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth";
import { courseStatusLabels } from "@/lib/labels";
import ActionForm from "@/components/admin/ActionForm";
import { Checkbox, Field, Select, TextArea } from "@/components/ui";
import { addCohort, deleteCohort, deleteCourse, saveCourse } from "../actions";

export const metadata = { title: "Formação" };

export default async function CourseEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await requireModule("formacoes");
  const isNew = id === "nova";
  const [{ data: course }, { data: cats }, { data: trainers }, { data: cohorts }] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : db.from("courses").select("*").eq("id", id).maybeSingle(),
    db.from("course_categories").select("id,name").order("name"),
    db.from("team_members").select("id,name").eq("is_trainer", true).order("name"),
    isNew ? Promise.resolve({ data: [] }) : db.from("cohorts").select("*").eq("course_id", id).order("starts_on"),
  ]);
  if (!isNew && !course) notFound();
  const c: any = course ?? {};

  return (
    <div className="space-y-8">
      <div><Link href="/admin/formacoes" className="text-sm text-brand">← Formações</Link>
        <h1 className="mt-1 text-3xl font-bold">{isNew ? "Nova formação" : c.name}</h1></div>

      <ActionForm action={saveCourse.bind(null, id)} className="space-y-5 rounded-xl border border-line bg-paper p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" name="name" required defaultValue={c.name} />
          <Field label="Endereço (slug)" name="slug" defaultValue={c.slug} hint="Em branco: gerado a partir do nome." />
          <Select label="Categoria" name="category_id" defaultValue={c.category_id} options={(cats ?? []).map((x) => ({ value: x.id, label: x.name }))} />
          <Field label="Ou criar nova categoria" name="new_category" />
          <Select label="Modalidade" name="modality" defaultValue={c.modality} options={[{ value: "presencial", label: "Presencial" }, { value: "online", label: "Online" }, { value: "hibrido", label: "Híbrido" }]} />
          <Select label="Formador" name="trainer_id" defaultValue={c.trainer_id} options={(trainers ?? []).map((x) => ({ value: x.id, label: x.name }))} />
          <Field label="Duração (dias)" name="duration_days" type="number" min={1} defaultValue={c.duration_days} />
          <Select label="Estado" name="status" required defaultValue={c.status ?? "draft"} options={Object.entries(courseStatusLabels).map(([value, label]) => ({ value, label }))} />
          <Field label="Preço" name="price" type="number" step="0.01" defaultValue={c.price} hint="Em branco = não mostrar preço." />
          <Field label="Moeda" name="currency" defaultValue={c.currency ?? "USD"} />
        </div>
        <TextArea label="Descrição curta" name="short_description" rows={2} defaultValue={c.short_description} />
        <TextArea label="Descrição completa" name="description" rows={6} defaultValue={c.description} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea label="Objetivos (um por linha)" name="objectives" defaultValue={(c.objectives ?? []).join("\n")} />
          <TextArea label="Competências adquiridas (uma por linha)" name="skills" defaultValue={(c.skills ?? []).join("\n")} />
          <TextArea label="Conteúdo programático (um tópico por linha)" name="syllabus" defaultValue={(c.syllabus ?? []).join("\n")} />
          <TextArea label="Público-alvo" name="target_audience" defaultValue={c.target_audience} />
          <TextArea label="Pré-requisitos" name="prerequisites" rows={2} defaultValue={c.prerequisites} />
        </div>
        <label className="block text-sm"><span className="font-medium">Imagem (JPG, PNG ou WebP)</span>
          <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-sm" />
          {c.image_path && <span className="text-xs text-muted">Atual: {c.image_path}</span>}</label>
        <div className="flex flex-wrap gap-6">
          <Checkbox name="certification" label="Com certificação" defaultChecked={c.certification} />
          <Checkbox name="quote_only" label="Apenas orçamento (sem preço)" defaultChecked={c.quote_only} />
          <Checkbox name="featured" label="Destaque (popular)" defaultChecked={c.featured} />
        </div>
      </ActionForm>

      {!isNew && (
        <>
          <section className="rounded-xl border border-line bg-paper p-6">
            <h2 className="text-xl font-bold">Turmas</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {(cohorts ?? []).map((k) => (
                <li key={k.id} className="flex items-center justify-between py-2">
                  <span>{k.name} · {k.starts_on}{k.location && ` · ${k.location}`} · {k.capacity} vagas · {k.status}</span>
                  <form action={deleteCohort.bind(null, id, k.id)}><button className="text-red-700 underline">Remover</button></form>
                </li>
              ))}
              {(cohorts ?? []).length === 0 && <li className="py-2 text-muted">Sem turmas.</li>}
            </ul>
            <ActionForm action={addCohort.bind(null, id)} submit="Adicionar turma" variant="ghost" className="mt-4 grid gap-3 sm:grid-cols-3">
              <Field label="Nome da turma" name="name" required />
              <Field label="Início" name="starts_on" type="date" required />
              <Field label="Fim" name="ends_on" type="date" />
              <Field label="Horário" name="schedule" />
              <Field label="Local" name="location" />
              <Field label="Vagas" name="capacity" type="number" min={0} required />
              <Select label="Estado" name="status" required defaultValue="published" options={Object.entries(courseStatusLabels).map(([value, label]) => ({ value, label }))} />
            </ActionForm>
          </section>
          <form action={deleteCourse.bind(null, id)}><button className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Eliminar formação</button></form>
        </>
      )}
    </div>
  );
}
