import { sectionSchemas, type SectionType } from "@/lib/sections";

export type FieldSpec = { name: string; label: string; kind: "text" | "textarea" | "lines" | "faq" | "pricing" | "url"; hint?: string };

export const fieldSpecs: Record<SectionType, FieldSpec[]> = {
  hero: [{ name: "title", label: "Título", kind: "text" }, { name: "subtitle", label: "Subtítulo", kind: "textarea" }, { name: "cta_label", label: "Texto do botão", kind: "text" }, { name: "cta_href", label: "Destino do botão", kind: "url" }, { name: "image", label: "Imagem (https://…)", kind: "url" }],
  text_image: [{ name: "title", label: "Título", kind: "text" }, { name: "body", label: "Texto", kind: "textarea" }, { name: "image", label: "Imagem (https://…)", kind: "url" }],
  video: [{ name: "title", label: "Título", kind: "text" }, { name: "url", label: "Vídeo YouTube/Vimeo", kind: "url" }],
  benefits: [{ name: "title", label: "Título", kind: "text" }, { name: "items", label: "Benefícios (um por linha)", kind: "lines" }],
  program: [{ name: "title", label: "Título", kind: "text" }, { name: "items", label: "Tópicos (um por linha)", kind: "lines" }],
  trainer: [{ name: "name", label: "Nome", kind: "text" }, { name: "bio", label: "Biografia", kind: "textarea" }, { name: "photo", label: "Fotografia (https://…)", kind: "url" }],
  testimonials: [{ name: "title", label: "Título (usa os testemunhos publicados)", kind: "text" }],
  stats: [{ name: "title", label: "Título (usa os indicadores visíveis)", kind: "text" }],
  pricing: [{ name: "title", label: "Título", kind: "text" }, { name: "items", label: "Planos (um por linha)", kind: "pricing", hint: "Nome | Preço | benefício; benefício | Texto do botão | Destino" }],
  faq: [{ name: "title", label: "Título", kind: "text" }, { name: "items", label: "Perguntas (uma por linha)", kind: "faq", hint: "Pergunta | Resposta" }],
  form: [{ name: "title", label: "Título", kind: "text" }, { name: "subject", label: "Assunto (geral, turma, personalizado, corporativo, summit…)", kind: "text" }],
  cta: [{ name: "title", label: "Título", kind: "text" }, { name: "label", label: "Texto do botão", kind: "text" }, { name: "href", label: "Destino", kind: "url" }],
  footer: [{ name: "text", label: "Texto", kind: "text" }],
};

/** Conteúdo guardado -> texto para o formulário */
export function toFormValue(spec: FieldSpec, content: any): string {
  const v = content?.[spec.name];
  if (spec.kind === "lines") return (v ?? []).join("\n");
  if (spec.kind === "faq") return (v ?? []).map((x: any) => `${x.q} | ${x.a}`).join("\n");
  if (spec.kind === "pricing") return (v ?? []).map((x: any) => [x.name, x.price, (x.features ?? []).join("; "), x.cta_label, x.cta_href].join(" | ")).join("\n");
  return v ?? "";
}

/** Formulário -> objeto, validado pelo schema do tipo (rejeita URLs perigosas, trunca tamanhos). */
export function parseSection(type: SectionType, get: (name: string) => string) {
  const raw: Record<string, unknown> = {};
  for (const spec of fieldSpecs[type]) {
    const v = get(spec.name);
    const rows = v.split("\n").map((l) => l.trim()).filter(Boolean);
    if (spec.kind === "lines") raw[spec.name] = rows;
    else if (spec.kind === "faq") raw[spec.name] = rows.map((r) => { const [q, ...a] = r.split("|"); return { q: q.trim(), a: a.join("|").trim() }; });
    else if (spec.kind === "pricing") raw[spec.name] = rows.map((r) => { const [name, price, f, cta_label, cta_href] = r.split("|").map((x) => x.trim()); return { name, price: price ?? "", features: (f ?? "").split(";").map((x) => x.trim()).filter(Boolean), cta_label: cta_label ?? "", cta_href: cta_href ?? "" }; });
    else raw[spec.name] = v;
  }
  return sectionSchemas[type].safeParse(raw);
}
