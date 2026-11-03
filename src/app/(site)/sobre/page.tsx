import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, Gem, Sparkles, Target } from "lucide-react";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { getSetting } from "@/lib/data";
import PageHeader from "@/components/site/PageHeader";
import Reveal from "@/components/site/Reveal";
import SetupNotice from "@/components/site/SetupNotice";
import TestimonialsCarousel from "@/components/site/TestimonialsCarousel";
import TextReveal from "@/components/site/TextReveal";

export const metadata: Metadata = { title: "Sobre a Academia" };
export const dynamic = "force-dynamic";

type About = {
  history?: string; origin?: string; mission?: string; vision?: string; values?: string[]; objectives?: string[];
  methodology?: string; differentials?: string[]; specialties?: string[]; impact?: string;
};

const eyebrow = "text-xs font-semibold uppercase tracking-[0.12em] text-brand";

export default async function SobrePage() {
  const about = await getSetting<About>("about");
  let team: any[] = [], testimonials: any[] = [];
  if (supabaseConfigured) {
    const db = await createClient();
    [team, testimonials] = await Promise.all([
      db.from("team_members").select("*").eq("visible", true).order("position").then((r) => r.data ?? []),
      db.from("testimonials").select("*").eq("status", "published").order("position").limit(8).then((r) => r.data ?? []),
    ]);
  }
  if (!about && team.length === 0) return <SetupNotice what="Sobre a Academia" />;
  const a = about ?? {};

  const story: [string, string | undefined][] = [
    ["A nossa história", a.history], ["Como surgiu", a.origin], ["Metodologia de ensino", a.methodology], ["Impacto na comunidade e no mercado", a.impact],
  ];
  const pillars = [
    { icon: Target, title: "Missão", text: a.mission },
    { icon: Eye, title: "Visão", text: a.vision },
  ].filter((p) => p.text);
  const lists: [string, string[] | undefined, typeof Gem][] = [
    ["Valores", a.values, Gem], ["Objetivos", a.objectives, Target], ["Diferenciais", a.differentials, Sparkles], ["Áreas de especialização", a.specialties, CheckCircle2],
  ];

  return (
    <div className="pb-20">
      <PageHeader eyebrow="Sobre nós" title="Mais que formação," accent="um movimento de transformação." description="Academia Tchamile, Moçâmedes, Namibe, Angola." />

      <section className="mx-auto grid max-w-6xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <Reveal variant="wipe">
          <div className="group relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl">
            <Image src="/photos/plateia.png" alt="Participantes e formadores da Academia Tchamile" fill priority sizes="(min-width:1024px) 45vw, 100vw" className="object-cover transition-transform duration-[1500ms] ease-out group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </Reveal>
        <div className="space-y-8">
          {story.filter(([, t]) => t).map(([h, t], i) => (
            <Reveal key={h} delay={i * 90} variant="right">
              <h2 className="text-2xl font-bold">{h}</h2>
              <p className="mt-3 whitespace-pre-line text-muted">{t}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {pillars.length > 0 && (
        <section className="mx-auto mt-16 grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-2">
          {pillars.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 120}>
              <div className="group h-full rounded-3xl bg-gradient-to-br from-[#04180d] via-[#06331a] to-brand p-8 text-white shadow-lg transition-transform duration-300 hover:-translate-y-1.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 transition-transform duration-300 group-hover:rotate-6"><Icon size={22} /></span>
                <h2 className="mt-5 text-2xl font-bold">{title}</h2>
                <p className="mt-2 text-white/85">{text}</p>
              </div>
            </Reveal>
          ))}
        </section>
      )}

      {lists.filter(([, l]) => l?.length).map(([h, l, Icon]) => (
        <section key={h} className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <TextReveal text={h} className="text-2xl font-bold sm:text-3xl" />
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {l!.map((item, i) => (
              <li key={item}>
                <Reveal delay={i * 80} className="h-full">
                  <div className="group flex h-full items-start gap-4 rounded-2xl border border-line bg-paper p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white"><Icon size={18} /></span>
                    <span className="pt-1.5 text-sm font-medium">{item}</span>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {team.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <p className={eyebrow}>Quem somos</p>
          <TextReveal text="Equipa e formadores" className="mt-2 text-2xl font-bold sm:text-3xl" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m, i) => (
              <Reveal key={m.id} delay={i * 100}>
                <article className="group h-full rounded-3xl border border-line bg-paper p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                  <div className="flex items-center gap-4">
                    {m.photo_path ? (
                      <Image src={m.photo_path} alt={m.name} width={72} height={72} className="h-[72px] w-[72px] rounded-2xl object-cover" />
                    ) : (
                      <span className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-[#06331a] text-2xl font-extrabold text-white transition-transform duration-300 group-hover:rotate-3">{String(m.name).charAt(0)}</span>
                    )}
                    <div>
                      <h3 className="text-lg font-bold">{m.name}</h3>
                      {m.job_title && <p className="text-sm font-medium text-brand">{m.job_title}</p>}
                    </div>
                  </div>
                  {m.specialization && <p className="mt-4 inline-block rounded-full bg-mist px-3 py-1 text-xs font-medium text-muted">{m.specialization}</p>}
                  {m.bio && <p className="mt-3 text-sm text-muted">{m.bio}</p>}
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {testimonials.length > 0 && <TestimonialsCarousel items={testimonials} />}

      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <Reveal variant="zoom">
          <div data-tone="dark" className="relative overflow-hidden rounded-3xl bg-ink p-8 text-center text-white sm:p-12">
            <span aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/30 blur-3xl" />
            <h2 className="relative text-3xl font-extrabold sm:text-4xl">Pronto para dar o próximo passo?</h2>
            <p className="relative mx-auto mt-3 max-w-lg text-white/80">Conheça as nossas formações ou descubra, em poucos minutos, o seu nível de comunicação.</p>
            <div className="relative mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/formacoes" className="btn-shine inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 font-semibold hover:bg-brand-dark">Explorar formações <ArrowRight size={18} /></Link>
              <Link href="/teste-de-comunicacao" className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3.5 font-semibold hover:bg-white/10">Fazer o teste de comunicação</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
