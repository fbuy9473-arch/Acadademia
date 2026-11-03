import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Search } from "lucide-react";
import { getCourses } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import PageHeader from "@/components/site/PageHeader";
import Reveal from "@/components/site/Reveal";
import SetupNotice from "@/components/site/SetupNotice";

export const metadata: Metadata = {
  title: "Formações",
  description: "Desenvolva competências práticas e relevantes para a sua vida pessoal e profissional.",
};
export const dynamic = "force-dynamic";

type SP = Promise<{ q?: string; categoria?: string; modalidade?: string }>;
const statusLabel: Record<string, string> = { open: "Inscrições abertas", full: "Lotado", published: "Em breve" };
const modalityLabel: Record<string, string> = { presencial: "Presencial", online: "Online", hibrido: "Híbrido" };
const field = "rounded-xl border border-line bg-paper px-4 py-3 outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand/15";

export default async function FormacoesPage({ searchParams }: { searchParams: SP }) {
  const { q, categoria, modalidade } = await searchParams;
  const all = (await getCourses()) ?? [];
  const cats = [...new Map(all.filter((c: any) => c.course_categories).map((c: any) => [c.course_categories.slug, c.course_categories.name])).entries()];
  const list = all.filter((c: any) =>
    (!q || c.name.toLowerCase().includes(q.toLowerCase())) &&
    (!categoria || c.course_categories?.slug === categoria) &&
    (!modalidade || c.modality === modalidade));
  const filtering = Boolean(q || categoria || modalidade);

  return (
    <div className="pb-20">
      <PageHeader eyebrow="Formações" title="Desenvolva competências" accent="que fazem a diferença" description="Formações práticas e relevantes para a sua vida pessoal e profissional." />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {all.length > 0 && (
          <Reveal>
            <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]" role="search">
              <label className="relative sm:col-span-2 lg:col-span-1">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input name="q" defaultValue={q} placeholder="Pesquisar formações…" aria-label="Pesquisar" className={`${field} w-full pl-11`} />
              </label>
              <select name="categoria" defaultValue={categoria ?? ""} aria-label="Categoria" className={field}>
                <option value="">Todas as categorias</option>
                {cats.map(([slug, name]) => <option key={slug as string} value={slug as string}>{name as string}</option>)}
              </select>
              <select name="modalidade" defaultValue={modalidade ?? ""} aria-label="Modalidade" className={field}>
                <option value="">Todas as modalidades</option>
                <option value="presencial">Presencial</option><option value="online">Online</option><option value="hibrido">Híbrido</option>
              </select>
              <button className="btn-shine rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">Filtrar</button>
            </form>
          </Reveal>
        )}

        {list.length === 0 ? (
          filtering ? (
            <div className="mt-10 rounded-3xl border border-line bg-paper p-10 text-center">
              <p className="text-lg font-semibold">Nenhuma formação encontrada</p>
              <p className="mt-1 text-muted">Experimente alterar a pesquisa ou os filtros.</p>
              <Link href="/formacoes" className="mt-5 inline-block font-semibold text-brand hover:underline">Limpar filtros</Link>
            </div>
          ) : <SetupNotice what="Formações" />
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c: any, i: number) => (
              <Reveal key={c.id} delay={(i % 3) * 100}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-paper transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                  <div className="relative flex h-32 items-end justify-between bg-gradient-to-br from-brand via-[#06331a] to-[#04180d] p-5">
                    <span aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white transition-transform duration-300 group-hover:rotate-6"><GraduationCap size={22} /></span>
                    <span className="relative rounded-full border border-white/30 bg-black/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">{statusLabel[c.status]}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    {c.course_categories && <span className="w-fit rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-dark">{c.course_categories.name}</span>}
                    <h2 className="mt-3 text-xl font-bold"><Link href={`/formacoes/${c.slug}`} className="after:absolute after:inset-0">{c.name}</Link></h2>
                    <p className="mt-2 flex-1 text-sm text-muted">{c.short_description}</p>
                    <ul className="mt-4 flex flex-wrap gap-2 text-xs">
                      {[c.duration_days && `${c.duration_days} dias`, modalityLabel[c.modality] ?? c.modality, c.certification && "Com certificação"].filter(Boolean).map((t: string) => (
                        <li key={t} className="rounded-full bg-mist px-3 py-1 font-medium text-muted">{t}</li>
                      ))}
                    </ul>
                    <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                      <p className="font-bold">{!c.quote_only && c.price != null ? formatMoney(Number(c.price), c.currency) : <span className="text-sm font-semibold text-brand">Valor sob consulta</span>}</p>
                      <Link href={c.status === "open" ? `/inscricao?formacao=${c.id}` : `/formacoes/${c.slug}`} className="relative z-10 inline-flex items-center gap-1.5 font-semibold text-brand">
                        {c.status === "open" ? "Inscrever-me" : "Ver detalhes"} <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
