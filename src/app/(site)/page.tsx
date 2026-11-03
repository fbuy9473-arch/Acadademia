import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, BookOpen, Briefcase, Building2, CalendarDays, Eye, Gem, Handshake, ListChecks, MapPin, Mic, Network, Play, Presentation, Quote, Target, Users } from "lucide-react";
import { getSetting, getSocialProof, getCurrentEdition, getPlans, getCourses, getTestimonials } from "@/lib/data";
import { formatEventDate } from "@/lib/format";
import { youtubeId } from "@/lib/video";
import Countdown from "@/components/site/Countdown";
import CountUp from "@/components/site/CountUp";
import LeadMini from "@/components/site/LeadMini";
import PlanCard, { type Plan } from "@/components/site/PlanCard";
import Parallax from "@/components/site/Parallax";
import Reveal from "@/components/site/Reveal";
import SplitText from "@/components/site/SplitText";
import { letterCount } from "@/lib/text";
import TestimonialsCarousel from "@/components/site/TestimonialsCarousel";
import TextReveal from "@/components/site/TextReveal";
import VideoGallery, { HeroVideoButton } from "@/components/site/VideoGallery";

type Hero = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  video_url?: string;
  cta_primary: { label: string; href: string };
  cta_secondary: { label: string; href: string };
};
type About = { mission?: string; vision?: string; values?: string[] };

const statIcons = [Users, BookOpen, Building2, Award];
const highlightIcons = [Users, Presentation, Network, Award, Briefcase];
const eyebrow = "text-xs font-semibold uppercase tracking-[0.12em] text-brand";
const btnPrimary = "btn-shine inline-flex items-center justify-center gap-2 rounded-lg bg-brand font-semibold text-white transition-colors hover:bg-brand-dark";
const KEN_BURNS = "animate-[kenburns_28s_ease-in-out_infinite_alternate]";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [hero, about, videos, highlights, contacts, homePlans, proof, edition, plans, courses, testimonials] = await Promise.all([
    getSetting<Hero>("hero"),
    getSetting<About>("about"),
    getSetting<{ items?: { title: string; label?: string; url: string }[] }>("videos"),
    getSetting<{ items?: string[] }>("summit_highlights"),
    getSetting<{ socials?: { youtube?: string } }>("contacts"),
    getSetting<{ kinds?: string[] }>("home_plans"),
    getSocialProof(),
    getCurrentEdition(),
    getPlans(),
    getCourses(),
    getTestimonials(),
  ]);
  const h: Hero = hero ?? {
    title: "Academia Tchamile",
    subtitle: "Formação, liderança e comunicação.",
    cta_primary: { label: "Explorar formações", href: "/formacoes" },
    cta_secondary: { label: "Conhecer a Academia", href: "/sobre" },
  };
  const words = h.title.split(" ");
  const head = words.slice(0, -2).join(" ");
  const accent = words.slice(-2).join(" ");
  const featured = (courses ?? []).slice(0, 3);
  const moves = [
    { icon: Target, title: "Missão", text: about?.mission },
    { icon: Eye, title: "Visão", text: about?.vision },
    { icon: Gem, title: "Valores", text: about?.values?.join(", ") },
  ].filter((m) => m.text);
  const clips = (videos?.items ?? []).flatMap((v) => { const id = youtubeId(v.url); return id ? [{ ...v, id }] : []; });
  const perks = highlights?.items ?? [];
  // três pacotes principais (editáveis no painel); o do meio fica em destaque
  const wanted = homePlans?.kinds?.length === 3 ? homePlans.kinds : ["turma", "personalizado", "mentoria"];
  const byKind = new Map(((plans ?? []) as Plan[]).map((p) => [p.kind, p]));
  const mainPlans = wanted.flatMap((k) => (byKind.has(k) ? [byKind.get(k) as Plan] : []));
  const headDelay = 250;

  return (
    <>
    <section data-tone="dark" className="relative isolate -mt-[4.75rem] overflow-hidden bg-ink text-white sm:-mt-20">
      <div className="absolute inset-y-0 right-0 w-full lg:w-[64%] fade-l">
        <Parallax speed={0.08} className="absolute -inset-y-[8%] inset-x-0">
          <Image src="/photos/orador-microfone.png" alt="" fill priority sizes="(min-width:1024px) 64vw, 100vw" className={`object-cover object-[44%_12%] lg:object-[58%_12%] ${KEN_BURNS}`} />
        </Parallax>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/5 lg:bg-gradient-to-r lg:from-ink/60 lg:via-ink/25 lg:to-transparent" />
      <Reveal delay={1400} className="absolute right-10 top-28 hidden xl:block">
        <p aria-hidden className="-rotate-6 font-serif text-3xl italic leading-snug text-white/90">
          “Educação<br />para um futuro<br />com mais<br />oportunidades.”
          <span className="mt-1 block h-0.5 w-24 rounded bg-[#2fbf6a]" />
        </p>
      </Reveal>
      <div className="relative mx-auto grid min-h-[640px] max-w-7xl items-end gap-10 px-4 pb-14 pt-[300px] sm:px-6 sm:pt-[340px] lg:min-h-[624px] lg:grid-cols-[1.3fr_1fr] lg:items-center lg:pb-24 lg:pt-36">
        <div>
          <h1 className="max-w-xl text-[2.6rem] font-extrabold leading-[1.06] sm:text-6xl">
            <SplitText text={head} delay={headDelay} />{head && " "}
            <SplitText text={accent} className="text-[#2fbf6a]" delay={headDelay + (letterCount(head) + 2) * 32} />
          </h1>
          <Reveal delay={900}><p className="mt-6 max-w-md text-base text-white/85 sm:text-lg">{h.subtitle}</p></Reveal>
          <Reveal delay={1100}><div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
            <Link href={h.cta_primary.href} className={`${btnPrimary} px-6 py-3.5`}>
              {h.cta_primary.label} <ArrowRight size={18} />
            </Link>
            <Link href={h.cta_secondary.href} className="inline-flex items-center gap-2.5 rounded-lg border border-white/40 px-5 py-3.5 font-semibold transition-colors hover:bg-white/10">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/70"><Play size={11} fill="currentColor" className="ml-0.5" /></span>
              {h.cta_secondary.label}
            </Link>
          </div></Reveal>
        </div>
        {h.video_url && <Reveal delay={1300} className="lg:self-end lg:justify-self-end"><HeroVideoButton url={h.video_url} id={youtubeId(h.video_url)} /></Reveal>}
      </div>
    </section>

    {proof && proof.length > 0 && (
      <section data-tone="dark" className="bg-[#04180d] text-white">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-7 sm:px-6 md:grid-cols-4 md:gap-x-0 md:divide-x md:divide-white/10">
          {proof.map((p: { id: string; value: string; label: string }, i: number) => {
            const Icon = statIcons[i % statIcons.length];
            return (
              <Reveal key={p.id} delay={i * 80}>
                <div className="flex items-center gap-3 md:px-6 lg:gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/30 text-[#2fbf6a] sm:h-11 sm:w-11"><Icon size={20} /></span>
                  <div><dd className="text-xl font-bold sm:text-2xl"><CountUp value={p.value} /></dd><dt className="text-xs text-white/70 sm:text-sm">{p.label}</dt></div>
                </div>
              </Reveal>
            );
          })}
        </dl>
      </section>
    )}

    {mainPlans.length > 0 && (
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-20">
        <div className="text-center">
          <Reveal><p className={eyebrow}>Programas</p></Reveal>
          <TextReveal text="Escolha o seu pacote" className="mt-2 text-3xl font-bold sm:text-4xl" />
          <Reveal delay={150}><p className="mx-auto mt-3 max-w-xl text-muted">Formação para diferentes perfis, com foco em resultados reais.</p></Reveal>
        </div>
        <div className="mt-12 grid items-stretch gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">
          {mainPlans.map((p, i) => (
            <Reveal key={p.id} delay={i * 130}>
              <PlanCard plan={p} featured={i === 1} maxBenefits={4} />
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <p className="mt-10 text-center"><Link href="/programas" className="inline-flex items-center gap-2 font-semibold text-brand hover:underline">Ver todos os programas <ArrowRight size={16} /></Link></p>
        </Reveal>
      </section>
    )}

    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <Reveal variant="zoom">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#04180d] via-[#06331a] to-brand p-8 text-white shadow-xl sm:p-12">
          <span aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">Autoavaliação</p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Descubra o seu nível de comunicação</h2>
              <p className="mt-4 max-w-lg text-white/85">Responda a 10 perguntas rápidas e receba o seu nível, os seus pontos fortes e o pacote que mais lhe convém.</p>
              <Link href="/teste-de-comunicacao" className={`${btnPrimary} mt-7 bg-white px-7 py-3.5 !text-ink hover:!bg-white/90`}>
                Fazer o teste agora <ArrowRight size={18} />
              </Link>
            </div>
            <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { icon: Mic, t: "Confiança", d: "Como lida com o palco e a pressão" },
                { icon: ListChecks, t: "Estrutura e clareza", d: "Como organiza e transmite ideias" },
                { icon: Handshake, t: "Relação com o público", d: "Como escuta e se adapta" },
              ].map(({ icon: Icon, t, d }) => (
                <li key={t} className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15"><Icon size={20} /></span>
                  <span><span className="block font-semibold">{t}</span><span className="block text-sm text-white/75">{d}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>

    <section className="relative -mt-10 rounded-t-[2.5rem] bg-mist pb-20 pt-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-[1fr_1.1fr_0.9fr]">
        <Reveal variant="left">
          <p className={eyebrow}>Sobre nós</p>
          <TextReveal text="Mais que formação," accent="um movimento de transformação." className="mt-3 text-3xl font-bold sm:text-4xl" />
          <p className="mt-4 text-muted">A Academia Tchamile é uma instituição de Moçâmedes, Namibe, focada no desenvolvimento de profissionais, líderes e empresas.</p>
          <Link href="/sobre" className={`${btnPrimary} mt-6 px-6 py-3`}>
            Conheça a nossa história <ArrowRight size={18} />
          </Link>
          {proof && proof.length > 0 && (
            <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-4">
              {proof.slice(0, 4).map((p: { id: string; value: string; label: string }) => (
                <div key={p.id}><dd className="text-2xl font-bold"><CountUp value={p.value} /></dd><dt className="text-xs text-muted">{p.label}</dt></div>
              ))}
            </dl>
          )}
        </Reveal>
        <Reveal variant="wipe" delay={100}>
          <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-xl">
            <Image src="/photos/orador-livro.png" alt="Formador da Academia Tchamile a apresentar" fill sizes="(min-width:1024px) 40vw, (min-width:768px) 50vw, 100vw" className="object-cover object-[35%_center] transition-transform duration-[1500ms] ease-out group-hover:scale-110" />
            <figure className="absolute bottom-4 right-4 max-w-[13rem] animate-[float_6s_ease-in-out_infinite] rounded-xl bg-[#04180d]/95 p-4 text-white shadow-xl ring-1 ring-white/10 sm:bottom-5 sm:right-5">
              <Quote size={22} className="text-[#2fbf6a]" fill="currentColor" />
              <blockquote className="mt-2 text-sm font-semibold leading-snug">A educação é a base para líderes que transformam realidades.</blockquote>
              <figcaption className="mt-2 font-serif text-lg italic text-[#2fbf6a]">Tchamile.</figcaption>
            </figure>
          </div>
        </Reveal>
        {moves.length > 0 && (
          <div className="md:col-span-2 lg:col-span-1">
            <ul className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
              {moves.map(({ icon: Icon, title, text }, i) => (
                <li key={title}>
                  <Reveal variant="right" delay={i * 120}>
                    <div className="group flex gap-4 rounded-xl border border-line bg-paper p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg lg:hover:translate-x-1 lg:hover:translate-y-0">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white"><Icon size={20} /></span>
                      <div><p className="font-semibold">{title}</p><p className="text-sm text-muted">{text}</p></div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>

    {edition && (
      <section data-tone="dark" className="relative isolate overflow-hidden bg-ink text-white">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[42%] fade-l">
          <Parallax speed={0.1} className="absolute -inset-y-[10%] inset-x-0">
            <Image src="/photos/plateia.png" alt="" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover object-[60%_center] opacity-40 lg:opacity-80" />
          </Parallax>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/20 lg:via-ink/70 lg:to-transparent" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1fr_0.4fr]">
          <Reveal variant="left">
            <span className="rounded bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em]">Próximo evento</span>
            <TextReveal as="h2" text={edition.title} className="mt-4 text-4xl font-extrabold sm:text-5xl" />
            {edition.subtitle && <p className="mt-4 max-w-md text-white/80">{edition.subtitle}</p>}
            <p className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/85">
              <span className="flex items-center gap-2"><CalendarDays size={16} />{formatEventDate(edition.starts_at)}</span>
              {(edition.venue || edition.city) && <span className="flex items-center gap-2"><MapPin size={16} />{[edition.venue, edition.city].filter(Boolean).join(", ")}</span>}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 sm:gap-4">
              <Link href="/protagonista-summit" className={`${btnPrimary} px-6 py-3`}>
                Inscrever-me <ArrowRight size={18} />
              </Link>
              {clips.length > 0 && (
                <a href="#galeria" className="inline-flex items-center gap-2.5 rounded-lg border border-white/40 px-5 py-3 font-semibold hover:bg-white/10">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/70"><Play size={11} fill="currentColor" className="ml-0.5" /></span>
                  Ver edição anterior
                </a>
              )}
            </div>
          </Reveal>
          <Reveal variant="right" delay={150}>
            <div className="rounded-2xl border border-white/20 bg-black/30 p-5 backdrop-blur-sm">
              <p className="text-sm text-white/70">Faltam para o evento</p>
              <div className="mt-3"><Countdown target={edition.starts_at} /></div>
            </div>
            {perks.length > 0 && (
              <ul className="mt-6 space-y-3">
                {perks.map((t, i) => {
                  const Icon = highlightIcons[i % highlightIcons.length];
                  return (
                    <li key={t}>
                      <Reveal delay={250 + i * 90} variant="right">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/30 text-[#2fbf6a] ring-1 ring-[#2fbf6a]/40"><Icon size={16} /></span>
                          {t}
                        </div>
                      </Reveal>
                    </li>
                  );
                })}
              </ul>
            )}
          </Reveal>
        </div>
      </section>
    )}

    {featured.length > 0 && (
      <section className="bg-mist py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4"><TextReveal text="Formações em destaque" className="text-3xl font-bold sm:text-4xl" /><Link href="/formacoes" className="shrink-0 text-sm font-semibold text-brand hover:underline">Ver todas</Link></div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((c: { id: string; slug: string; name: string; short_description: string | null }, i: number) => (
              <Reveal key={c.id} delay={i * 100}>
                <Link href={`/formacoes/${c.slug}`} className="block h-full rounded-2xl border border-line bg-paper p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                  <h3 className="font-bold">{c.name}</h3><p className="mt-2 text-sm text-muted">{c.short_description}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    )}

    {clips.length > 0 && (
      <section id="galeria" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-16 sm:px-6 sm:pt-20">
        <Reveal><p className={eyebrow}>Galeria de vídeos</p></Reveal>
        <TextReveal text="Momentos que inspiram" className="mt-2 text-3xl font-bold sm:text-4xl" />
        <Reveal delay={150}><p className="mt-3 max-w-xl text-muted">Veja os melhores momentos das nossas formações, eventos e histórias de pessoas que já fizeram parte desta jornada.</p></Reveal>
        <VideoGallery clips={clips} moreHref={contacts?.socials?.youtube} />
      </section>
    )}

    {testimonials && testimonials.length > 0 && <TestimonialsCarousel items={testimonials} />}

    <section data-tone="dark" className="relative overflow-hidden bg-ink text-white">
      <div className="mx-auto grid max-w-7xl items-stretch lg:grid-cols-[0.75fr_1fr_1.1fr]">
        <div className="relative h-52 lg:h-auto fade-r">
          <Image src="/photos/participante-notas.png" alt="" fill sizes="(min-width:1024px) 30vw, 100vw" className={`object-cover ${KEN_BURNS}`} />
          <span className="absolute inset-0 bg-gradient-to-t from-ink to-transparent lg:hidden" />
        </div>
        <Reveal className="self-center px-4 pb-4 pt-8 sm:px-6 lg:px-8 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">Inscreva-se agora</p>
          <TextReveal text="Dê o próximo passo" accent="na sua jornada." className="mt-3 text-3xl font-extrabold sm:text-4xl" accentClassName="text-[#2fbf6a]" />
          <p className="mt-4 text-white/80">Preencha o formulário e a nossa equipa entrará em contacto com todas as informações sobre os programas, datas e valores.</p>
        </Reveal>
        <Reveal delay={150} className="px-4 pb-16 pt-4 sm:px-6 lg:py-16 lg:pl-0 lg:pr-6">
          <LeadMini />
        </Reveal>
      </div>
    </section>
    </>
  );
}
