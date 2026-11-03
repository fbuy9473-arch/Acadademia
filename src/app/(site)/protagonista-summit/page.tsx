import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase, CalendarDays, Check, Clock, MapPin, Play, Ticket, Users } from "lucide-react";
import clsx from "clsx";
import { getCurrentEdition } from "@/lib/data";
import { formatEventDate, formatMoney } from "@/lib/format";
import Countdown from "@/components/site/Countdown";
import Parallax from "@/components/site/Parallax";
import Reveal from "@/components/site/Reveal";
import SplitText from "@/components/site/SplitText";
import TextReveal from "@/components/site/TextReveal";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const e = await getCurrentEdition();
  return {
    title: e?.title ?? "Protagonista Summit",
    description: e?.subtitle ?? "Protagonista Summit da Academia Tchamile.",
  };
}

type Ticket = {
  id: string; kind: string; name: string; price: number | null; promo_price: number | null;
  promo_ends_at: string | null; price_published: boolean; total_quantity: number;
  benefits: string[]; active: boolean;
};

const eyebrow = "text-xs font-semibold uppercase tracking-[0.12em] text-brand";
const btn = "btn-shine inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-7 py-3.5 font-semibold text-white transition-colors hover:bg-brand-dark";

function SummitSoon() {
  return (
    <section data-tone="dark" className="relative isolate -mt-[4.75rem] overflow-hidden bg-ink text-white sm:-mt-20">
      <div className="absolute inset-0">
        <Parallax speed={0.08} className="absolute -inset-y-[8%] inset-x-0">
          <Image src="/photos/plateia.png" alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
        </Parallax>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
      <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-40 text-center sm:px-6 sm:pt-48">
        <span className="rounded bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em]">Em breve</span>
        <h1 className="mt-6 text-5xl font-extrabold sm:text-7xl"><SplitText text="Protagonista Summit" delay={150} /></h1>
        <Reveal delay={700}><p className="mx-auto mt-6 max-w-xl text-lg text-white/80">Estamos a preparar a próxima edição. Em breve divulgamos a data, o local, a programação e os ingressos.</p></Reveal>
        <Reveal delay={900}>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contactos?assunto=summit" className={btn}>Quero ser avisado <ArrowRight size={18} /></Link>
            <Link href="/" className="inline-flex items-center rounded-xl border border-white/40 px-7 py-3.5 font-semibold hover:bg-white/10">Voltar ao início</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default async function SummitPage() {
  const e = await getCurrentEdition();
  if (!e) return <SummitSoon />;

  const tickets = ((e.ticket_types ?? []) as Ticket[]).filter((t) => t.active);
  const sessions = [...(e.event_sessions ?? [])].sort((a: { position: number }, b: { position: number }) => a.position - b.position);
  const audiences = [...(e.event_audiences ?? [])].sort((a: { position: number }, b: { position: number }) => a.position - b.position);
  const startsAt: string = e.starts_at;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: startsAt,
    location: e.venue || e.city ? { "@type": "Place", name: [e.venue, e.city].filter(Boolean).join(", ") } : undefined,
    description: e.subtitle ?? undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section data-tone="dark" className="relative isolate -mt-[4.75rem] overflow-hidden bg-ink text-white sm:-mt-20">
        <div className="absolute inset-0">
          <Parallax speed={0.08} className="absolute -inset-y-[8%] inset-x-0">
            <Image src="/photos/plateia.png" alt="" fill priority sizes="100vw" className="object-cover opacity-40 animate-[kenburns_28s_ease-in-out_infinite_alternate]" />
          </Parallax>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/40" />
        <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-40 text-center sm:px-6 sm:pt-48">
          <h1 className="text-5xl font-extrabold sm:text-7xl"><SplitText text={e.title} delay={150} /></h1>
          <Reveal delay={600}>
            {e.headline && <p className="mt-5 text-xl text-white/90">{e.headline}</p>}
            {e.subtitle && <p className="mt-2 text-white/70">{e.subtitle}</p>}
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/85">
              <span className="flex items-center gap-2"><CalendarDays size={16} />{formatEventDate(startsAt)}</span>
              {(e.venue || e.city) && <span className="flex items-center gap-2"><MapPin size={16} />{[e.venue, e.city].filter(Boolean).join(", ")}</span>}
            </p>
          </Reveal>
          <Reveal delay={800}>
            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/20 bg-black/30 p-5 backdrop-blur-md"><Countdown target={startsAt} /></div>
          </Reveal>
          <Reveal delay={1000}>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              {e.registrations_open ? (
                <Link href="/inscricao?evento=summit" className={btn}>Garantir o meu ingresso <ArrowRight size={18} /></Link>
              ) : (
                <span className="rounded-xl bg-white/10 px-7 py-3.5 font-semibold text-white/70">Inscrições em breve</span>
              )}
              {sessions.length > 0 && (
                <a href="#programacao" className="inline-flex items-center gap-2.5 rounded-xl border border-white/40 px-6 py-3.5 font-semibold hover:bg-white/10">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/70"><Play size={11} fill="currentColor" className="ml-0.5" /></span>
                  Ver programação
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {e.about && (
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <Reveal><p className={eyebrow}>Sobre o evento</p></Reveal>
          <TextReveal text={`O que é o ${e.title}?`} className="mt-2 text-3xl font-bold sm:text-4xl" />
          <Reveal delay={150}><p className="mt-5 whitespace-pre-line text-muted">{e.about}</p></Reveal>
        </section>
      )}

      {audiences.length > 0 && (
        <section className="bg-mist py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <TextReveal text="Para quem é o evento" className="text-3xl font-bold sm:text-4xl" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {audiences.map((a: { id: string; title: string; description: string | null }, i: number) => {
                const Icon = [Users, Briefcase, Ticket, Users][i % 4];
                return (
                  <Reveal key={a.id} delay={i * 90}>
                    <div className="group h-full rounded-2xl border border-line bg-paper p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white"><Icon size={20} /></span>
                      <h3 className="mt-4 font-semibold">{a.title}</h3>
                      {a.description && <p className="mt-1 text-sm text-muted">{a.description}</p>}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {sessions.length > 0 && (
        <section id="programacao" className="mx-auto max-w-4xl scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
          <Reveal><p className={eyebrow}>Programa</p></Reveal>
          <TextReveal text="Programação" className="mt-2 text-3xl font-bold sm:text-4xl" />
          <ol className="relative mt-10 space-y-4 before:absolute before:bottom-2 before:left-[3.4rem] before:top-2 before:w-px before:bg-line max-sm:before:hidden">
            {sessions.map((s: { id: string; starts_at: string; title: string; speaker: string | null; stage: string | null }, i: number) => (
              <li key={s.id}>
                <Reveal delay={i * 70} variant="right">
                  <div className="group flex gap-5 rounded-2xl border border-line bg-paper p-4 transition-all duration-300 hover:border-brand/40 hover:shadow-lg">
                    <time className="flex h-12 w-[4.5rem] shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-soft text-sm font-bold text-brand">
                      <Clock size={13} />
                      {new Intl.DateTimeFormat("pt-AO", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Luanda" }).format(new Date(s.starts_at))}
                    </time>
                    <div className="self-center">
                      <p className="font-semibold">{s.title}</p>
                      <p className="flex flex-wrap gap-x-4 text-sm text-muted">{[s.speaker, s.stage].filter((t): t is string => Boolean(t)).map((t) => <span key={t}>{t}</span>)}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>
      )}

      {tickets.length > 0 && (
        <section className="bg-mist py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center">
              <Reveal><p className={eyebrow}>Ingressos</p></Reveal>
              <TextReveal text="Escolha o seu ingresso" className="mt-2 text-3xl font-bold sm:text-4xl" />
            </div>
            <div className="mt-12 grid items-stretch gap-8 md:grid-cols-3">
              {tickets.map((t, i) => {
                const promo = t.promo_price != null && (!t.promo_ends_at || new Date(t.promo_ends_at) > new Date());
                const price = promo ? t.promo_price : t.price;
                const featured = t.kind === "vip";
                return (
                  <Reveal key={t.id} delay={i * 120}>
                    <article className={clsx("group flex h-full flex-col rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl", featured ? "z-10 border-ink bg-ink text-white shadow-xl md:scale-[1.04]" : "border-line bg-paper")}>
                      <h3 className="text-xl font-bold">{t.name}</h3>
                      {t.price_published && price != null ? (
                        <p className="mt-3 text-3xl font-extrabold">
                          {formatMoney(Number(price), e.currency)}
                          {promo && t.price != null && <span className={clsx("ml-2 text-sm font-normal line-through", featured ? "text-white/50" : "text-muted")}>{formatMoney(Number(t.price), e.currency)}</span>}
                        </p>
                      ) : (
                        <p className={clsx("mt-3 text-sm font-semibold", featured ? "text-[#2fbf6a]" : "text-brand")}>Valor em breve</p>
                      )}
                      <ul className="mt-6 flex-1 space-y-3 text-sm">
                        {t.benefits.map((b) => (
                          <li key={b} className="flex gap-3">
                            <span className={clsx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", featured ? "bg-brand/30 text-[#2fbf6a]" : "bg-brand-soft text-brand")}><Check size={12} strokeWidth={3} /></span>
                            <span className={featured ? "text-white/90" : undefined}>{b}</span>
                          </li>
                        ))}
                      </ul>
                      {e.registrations_open && (
                        <Link href={`/inscricao?evento=summit&ingresso=${t.kind}`} className={clsx("btn-shine mt-7 inline-flex items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-colors", featured ? "bg-brand text-white hover:bg-brand-dark" : "border border-brand text-brand hover:bg-brand hover:text-white")}>
                          Escolher {t.name} <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                      )}
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
