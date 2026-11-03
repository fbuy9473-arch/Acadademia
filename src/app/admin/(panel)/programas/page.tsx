import { requireModule } from "@/lib/auth";
import ActionForm from "@/components/admin/ActionForm";
import { Checkbox, Field, Select, TextArea } from "@/components/ui";
import { savePlan } from "./actions";

export const metadata = { title: "Programas" };

export default async function Programas() {
  const { db } = await requireModule("programas");
  const [{ data: plans }, { data: courses }] = await Promise.all([
    db.from("training_plans").select("*, plan_benefits(text,position)").order("position"),
    db.from("courses").select("id,name").order("name"),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Programas de treinamento</h1>
      <p className="text-sm text-muted">Os preços só aparecem no site quando definidos e marcados como publicados.</p>
      {(plans ?? []).map((p: any) => (
        <details key={p.id} className="rounded-xl border border-line bg-paper" open={p.kind === "turma"}>
          <summary className="cursor-pointer p-5 text-lg font-bold">{p.name} <span className="text-sm font-normal text-muted">{p.status === "published" ? "Publicado" : "Rascunho"}</span></summary>
          <div className="border-t border-line p-5">
            <ActionForm action={savePlan.bind(null, p.id)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome" name="name" required defaultValue={p.name} />
                <Field label="Subtítulo" name="tagline" defaultValue={p.tagline} />
                <Field label="Duração (texto)" name="duration_label" defaultValue={p.duration_label} />
                <Field label="Duração (dias)" name="duration_days" type="number" defaultValue={p.duration_days} />
                <Field label="Preço" name="price" type="number" step="0.01" defaultValue={p.price} />
                <Field label="Moeda" name="currency" defaultValue={p.currency} />
                <Field label="Texto do botão" name="cta_label" defaultValue={p.cta_label} />
                <Field label="Vagas" name="capacity" type="number" defaultValue={p.capacity} />
                <Select label="Estado" name="status" required defaultValue={p.status} options={[{ value: "draft", label: "Rascunho" }, { value: "published", label: "Publicado" }, { value: "archived", label: "Arquivado" }]} />
              </div>
              <Checkbox name="price_published" label="Mostrar preço no site" defaultChecked={p.price_published} />
              <TextArea label="Benefícios (um por linha)" name="benefits" rows={7} defaultValue={[...p.plan_benefits].sort((a: any, b: any) => a.position - b.position).map((b: any) => b.text).join("\n")} />
              <TextArea label="Condições especiais" name="conditions" rows={2} defaultValue={p.conditions} />
              {p.kind === "edicao_especial" && (
                <fieldset className="space-y-1"><legend className="text-sm font-medium">Cursos incluídos</legend>
                  {(courses ?? []).map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="included" value={c.id} defaultChecked={p.included_course_ids?.includes(c.id)} className="accent-[#028034]" />{c.name}</label>
                  ))}
                  {(courses ?? []).length === 0 && <p className="text-xs text-muted">Crie formações primeiro.</p>}
                </fieldset>
              )}
            </ActionForm>
          </div>
        </details>
      ))}
    </div>
  );
}
