import Link from "next/link";
import { Check } from "lucide-react";
import ContactForm from "@/app/(site)/contactos/ContactForm";
import { embedUrl, sectionSchemas, type SectionType } from "@/lib/sections";

export type SectionRow = { id: string; type: SectionType; content: unknown };
type Extras = { testimonials: { id: string; author: string; role: string | null; body: string }[]; stats: { id: string; value: string; label: string }[]; redirectTo?: string | null };

/** Todo o conteúdo é renderizado como texto (React escapa), e re-validado antes de desenhar. */
export default function Sections({ sections, extras }: { sections: SectionRow[]; extras: Extras }) {
  return <>{sections.map((s) => <One key={s.id} s={s} extras={extras} />)}</>;
}

function Title({ children }: { children: string }) {
  return children ? <h2 className="text-3xl font-bold">{children}</h2> : null;
}

function One({ s, extras }: { s: SectionRow; extras: Extras }) {
  const parsed = sectionSchemas[s.type]?.safeParse(s.content);
  if (!parsed?.success) return null;
  const c = parsed.data as any;
  const wrap = "mx-auto max-w-5xl px-4 py-14 sm:px-6";

  switch (s.type) {
    case "hero":
      return (
        <section className="bg-ink text-white">
          <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
            <h1 className="text-4xl font-extrabold sm:text-6xl">{c.title}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">{c.subtitle}</p>
            {c.cta_label && <Link href={c.cta_href || "#"} className="mt-8 inline-block rounded-lg bg-brand px-7 py-3.5 font-semibold hover:bg-brand-dark">{c.cta_label}</Link>}
          </div>
        </section>
      );
    case "text_image":
      return (
        <section className={`${wrap} grid items-center gap-8 md:grid-cols-2`}>
          <div><Title>{c.title}</Title><p className="mt-4 whitespace-pre-line text-muted">{c.body}</p></div>
          {c.image && <img src={c.image} alt="" className="rounded-2xl" />}
        </section>
      );
    case "video": {
      const e = embedUrl(c.url);
      return <section className={wrap}><Title>{c.title}</Title>{e && <iframe src={e} title={c.title || "Vídeo"} className="mt-6 aspect-video w-full rounded-2xl" allowFullScreen loading="lazy" referrerPolicy="no-referrer" />}</section>;
    }
    case "benefits":
    case "program":
      return (
        <section className={wrap}><Title>{c.title}</Title>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">{c.items.map((i: string, n: number) => <li key={n} className="flex gap-2.5 rounded-xl border border-line p-4 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-brand" />{i}</li>)}</ul>
        </section>
      );
    case "trainer":
      return <section className={wrap}><div className="rounded-2xl bg-mist p-8"><h2 className="text-2xl font-bold">{c.name}</h2><p className="mt-3 text-muted">{c.bio}</p></div></section>;
    case "testimonials":
      return extras.testimonials.length ? (
        <section className={wrap}><Title>{c.title}</Title>
          <div className="mt-6 grid gap-4 md:grid-cols-3">{extras.testimonials.map((t) => <blockquote key={t.id} className="rounded-xl border border-line p-5 text-sm"><p>“{t.body}”</p><footer className="mt-3 font-medium">{t.author}{t.role && <span className="ml-2 text-muted">{t.role}</span>}</footer></blockquote>)}</div>
        </section>
      ) : null;
    case "stats":
      return extras.stats.length ? (
        <section className={wrap}><Title>{c.title}</Title><dl className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">{extras.stats.map((x) => <div key={x.id}><dd className="text-3xl font-bold text-brand">{x.value}</dd><dt className="text-sm text-muted">{x.label}</dt></div>)}</dl></section>
      ) : null;
    case "pricing":
      return (
        <section className={wrap}><Title>{c.title}</Title>
          <div className="mt-6 grid gap-5 md:grid-cols-3">{c.items.map((p: any, n: number) => (
            <article key={n} className="flex flex-col rounded-2xl border border-line p-6"><h3 className="text-lg font-bold">{p.name}</h3><p className="mt-1 text-2xl font-bold">{p.price}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">{p.features.map((f: string, i: number) => <li key={i} className="flex gap-2"><Check size={16} className="mt-0.5 text-brand" />{f}</li>)}</ul>
              {p.cta_label && <Link href={p.cta_href || "#"} className="mt-5 rounded-lg bg-brand py-2.5 text-center font-semibold text-white hover:bg-brand-dark">{p.cta_label}</Link>}
            </article>))}</div>
        </section>
      );
    case "faq":
      return <section className={wrap}><Title>{c.title}</Title><div className="mt-6 divide-y divide-line rounded-xl border border-line">{c.items.map((f: any, n: number) => <details key={n} className="p-4"><summary className="cursor-pointer font-medium">{f.q}</summary><p className="mt-2 text-sm text-muted">{f.a}</p></details>)}</div></section>;
    case "form":
      return <section id="inscricao" className="mx-auto max-w-2xl px-4 py-14 sm:px-6"><Title>{c.title}</Title><div className="mt-6"><ContactForm subject={c.subject || "geral"} redirectTo={extras.redirectTo} /></div></section>;
    case "cta":
      return <section className="bg-brand-soft"><div className="mx-auto max-w-3xl px-4 py-14 text-center"><Title>{c.title}</Title>{c.label && <Link href={c.href || "#"} className="mt-6 inline-block rounded-lg bg-brand px-7 py-3.5 font-semibold text-white hover:bg-brand-dark">{c.label}</Link>}</div></section>;
    case "footer":
      return <footer className="bg-ink py-8 text-center text-sm text-white/70">{c.text}</footer>;
  }
}
