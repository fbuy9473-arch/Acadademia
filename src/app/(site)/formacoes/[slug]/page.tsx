import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  if (!supabaseConfigured) return null;
  const db = await createClient();
  const { data } = await db.from("courses")
    .select("*, course_categories(name), team_members(name,job_title,bio), cohorts(id,name,starts_on,ends_on,location,capacity,status)")
    .eq("slug", slug).in("status", ["published", "open", "full", "closed"]).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await load((await params).slug);
  return c ? { title: c.name, description: c.short_description ?? undefined } : {};
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const c: any = await load((await params).slug);
  if (!c) notFound();
  const upcoming = (c.cohorts ?? []).filter((k: any) => k.status !== "draft" && new Date(k.starts_on) >= new Date(new Date().toDateString()));
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Course", name: c.name, description: c.short_description,
    provider: { "@type": "Organization", name: "Academia Tchamile" },
  };
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {c.course_categories && <p className="text-sm font-medium text-brand">{c.course_categories.name}</p>}
      <h1 className="mt-2 text-4xl font-bold">{c.name}</h1>
      <ul className="mt-4 flex flex-wrap gap-2 text-sm">{[c.duration_days && `${c.duration_days} dias`, c.modality, c.certification && "Com certificação"].filter(Boolean).map((t: string) => <li key={t} className="rounded-full bg-mist px-3 py-1 capitalize text-muted">{t}</li>)}</ul>
      {c.description && <p className="mt-6 whitespace-pre-line">{c.description}</p>}
      {c.objectives?.length > 0 && (<><h2 className="mt-8 text-xl font-bold">Objetivos</h2><ul className="mt-2 list-disc pl-5">{c.objectives.map((o: string) => <li key={o}>{o}</li>)}</ul></>)}
      {c.skills?.length > 0 && (<><h2 className="mt-8 text-xl font-bold">Competências adquiridas</h2><ul className="mt-2 list-disc pl-5">{c.skills.map((o: string) => <li key={o}>{o}</li>)}</ul></>)}
      {c.target_audience && (<><h2 className="mt-8 text-xl font-bold">Público-alvo</h2><p className="mt-2">{c.target_audience}</p></>)}
      {c.prerequisites && (<><h2 className="mt-8 text-xl font-bold">Pré-requisitos</h2><p className="mt-2">{c.prerequisites}</p></>)}
      {upcoming.length > 0 && (
        <>
          <h2 className="mt-8 text-xl font-bold">Próximas turmas</h2>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
            {upcoming.map((k: any) => (
              <li key={k.id} className="flex justify-between p-4 text-sm">
                <span>{k.name}{k.location && <span className="ml-3 text-muted">{k.location}</span>}</span>
                <time dateTime={k.starts_on}>{new Intl.DateTimeFormat("pt-AO", { dateStyle: "long" }).format(new Date(k.starts_on))}</time>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-10 flex items-center gap-5">
        {!c.quote_only && c.price != null && <p className="text-2xl font-bold">{formatMoney(Number(c.price), c.currency)}</p>}
        {c.status === "open"
          ? <Link href={`/inscricao?formacao=${c.id}`} className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">Inscrever-me</Link>
          : <Link href="/contactos" className="rounded-lg border border-line px-6 py-3 font-semibold hover:bg-mist">{c.status === "full" ? "Lotado, contactar" : "Pedir informações"}</Link>}
      </div>
    </article>
  );
}
