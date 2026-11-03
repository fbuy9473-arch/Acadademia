import Link from "next/link";
import { ChevronDown, Menu, Search, ArrowRight } from "lucide-react";
import { getCourses } from "@/lib/data";
import HeaderShell from "./HeaderShell";
import { Logo } from "./Logo";
import { nav } from "./nav";

export default async function Header() {
  const courses = (await getCourses()) ?? [];
  const cats = [...new Map(courses.filter((c: any) => c.course_categories).map((c: any) => [c.course_categories.slug, c.course_categories.name])).entries()] as [string, string][];
  const link = "nav-link opacity-85 hover:opacity-100";
  const pop = "rounded-xl border border-white/60 bg-white/85 p-2 text-ink shadow-xl backdrop-blur-xl";

  return (
    <>
      {/* reserva o espaço da cápsula, que flutua por cima do conteúdo */}
      <div className="h-[4.75rem] sm:h-20" aria-hidden />
      <HeaderShell>
        <div className="grid h-14 grid-cols-[auto_1fr] items-center gap-4 px-3 sm:px-5 lg:grid-cols-[1fr_auto_1fr]">
          <Link href="/" aria-label="Academia Tchamile, início" className="justify-self-start"><Logo className="h-10 w-auto rounded-lg shadow-sm" /></Link>

          <nav aria-label="Principal" className="hidden items-center gap-7 text-sm font-medium lg:flex">
            {nav.map((i) =>
              i.href === "/formacoes" ? (
                <div key={i.href} className="group relative">
                  <Link href={i.href} className={`${link} inline-flex items-center gap-1`}>{i.label}<ChevronDown size={14} className="transition-transform group-hover:rotate-180 group-focus-within:rotate-180" /></Link>
                  <div className={`${pop} invisible absolute left-1/2 top-full z-50 mt-3 min-w-56 -translate-x-1/2 translate-y-1 opacity-0 transition-all duration-200 before:absolute before:inset-x-0 before:-top-3 before:h-3 before:content-[''] group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100`}>
                    <Link href="/formacoes" className="block rounded-lg px-3 py-2 hover:bg-white/70">Todas as formações</Link>
                    {cats.map(([slug, name]) => (
                      <Link key={slug} href={`/formacoes?categoria=${slug}`} className="block rounded-lg px-3 py-2 hover:bg-white/70">{name}</Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link key={i.href} href={i.href} className={link}>{i.label}</Link>
              ),
            )}
          </nav>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <details className="group relative">
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg hover:bg-white/30" aria-label="Pesquisar formações">
                <Search size={18} />
              </summary>
              <form action="/formacoes" role="search" className={`${pop} absolute right-0 mt-4 flex w-72 gap-2`}>
                <input name="q" type="search" placeholder="Pesquisar formações…" aria-label="Pesquisar" className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand" />
                <button className="rounded-lg bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark">Ir</button>
              </form>
            </details>
            <Link href="/inscricao" className="btn-shine inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-brand px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:px-5">
              Inscrever-me <ArrowRight size={16} />
            </Link>
            <details className="relative lg:hidden">
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-current/25" aria-label="Abrir menu">
                <Menu size={20} />
              </summary>
              <nav aria-label="Móvel" className={`${pop} absolute right-0 mt-4 w-64`}>
                {nav.map((i) => (
                  <Link key={i.href} href={i.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/70">{i.label}</Link>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </HeaderShell>
    </>
  );
}
