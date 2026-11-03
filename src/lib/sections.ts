import { z } from "zod";

/** URLs permitidas: relativas ou https. Bloqueia javascript:, data: e afins. */
export const safeUrl = z.string().trim().max(500).refine(
  (u) => u === "" || u.startsWith("/") && !u.startsWith("//") || /^https:\/\//i.test(u),
  "Ligação inválida (apenas https:// ou caminhos internos)",
);

const text = (n = 300) => z.string().trim().max(n).default("");
const list = (n = 300) => z.array(z.string().trim().max(n)).max(30).default([]);

export const sectionSchemas = {
  hero: z.object({ title: text(160), subtitle: text(400), cta_label: text(60), cta_href: safeUrl.default(""), image: safeUrl.default("") }),
  text_image: z.object({ title: text(160), body: text(3000), image: safeUrl.default("") }),
  video: z.object({ title: text(160), url: safeUrl.default("") }),
  benefits: z.object({ title: text(160), items: list() }),
  program: z.object({ title: text(160), items: list() }),
  trainer: z.object({ name: text(120), bio: text(1500), photo: safeUrl.default("") }),
  testimonials: z.object({ title: text(160) }),
  stats: z.object({ title: text(160) }),
  pricing: z.object({ title: text(160), items: z.array(z.object({ name: text(80), price: text(60), features: list(), cta_label: text(60), cta_href: safeUrl.default("") })).max(6).default([]) }),
  faq: z.object({ title: text(160), items: z.array(z.object({ q: text(200), a: text(1500) })).max(30).default([]) }),
  form: z.object({ title: text(160), subject: text(30) }),
  cta: z.object({ title: text(160), label: text(60), href: safeUrl.default("") }),
  footer: z.object({ text: text(300) }),
} as const;

export type SectionType = keyof typeof sectionSchemas;
export const sectionTypes = Object.keys(sectionSchemas) as SectionType[];

export const sectionLabels: Record<SectionType, string> = {
  hero: "Hero", text_image: "Texto e imagem", video: "Vídeo", benefits: "Benefícios", program: "Programa da formação",
  trainer: "Formador", testimonials: "Testemunhos", stats: "Indicadores", pricing: "Planos e preços", faq: "Perguntas frequentes",
  form: "Formulário", cta: "Chamada para ação", footer: "Rodapé",
};

/** Só aceita embeds de YouTube/Vimeo. */
export function embedUrl(u: string): string | null {
  try {
    const url = new URL(u);
    if (/(^|\.)youtube\.com$/.test(url.hostname) && url.searchParams.get("v")) return `https://www.youtube-nocookie.com/embed/${url.searchParams.get("v")}`;
    if (url.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed${url.pathname}`;
    if (url.hostname === "vimeo.com" && /^\/\d+$/.test(url.pathname)) return `https://player.vimeo.com/video${url.pathname}`;
  } catch {}
  return null;
}
