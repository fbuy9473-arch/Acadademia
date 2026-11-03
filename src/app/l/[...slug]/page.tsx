import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Sections, { type SectionRow } from "@/components/site/Sections";

export const dynamic = "force-dynamic";

async function load(slugParts: string[]) {
  if (!supabaseConfigured) return null;
  const db = await createClient();
  const { data } = await db.from("pages").select("*, page_sections(id,type,position,visible,content)")
    .eq("slug", slugParts.join("/")).eq("kind", "landing").eq("status", "published").maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const p = await load((await params).slug);
  if (!p) return {};
  return {
    title: p.seo_title || p.title,
    description: p.seo_description ?? undefined,
    robots: p.indexable ? undefined : { index: false, follow: false },
    openGraph: p.og_image_path ? { images: [p.og_image_path] } : undefined,
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const p: any = await load((await params).slug);
  if (!p) notFound();
  const db = await createClient();
  const [{ data: testimonials }, { data: stats }] = await Promise.all([
    db.from("testimonials").select("id,author,role,body").eq("status", "published").order("position").limit(6),
    db.from("social_proof").select("id,value,label").eq("visible", true).order("position"),
  ]);
  // métrica de visualização (best effort)
  try { await db.from("page_views").insert({ page_id: p.id }); } catch {}

  const sections = (p.page_sections as (SectionRow & { position: number; visible: boolean })[])
    .filter((s) => s.visible).sort((a, b) => a.position - b.position);
  return (
    <>
      <Header />
      <main className="flex-1">
        <Sections sections={sections} extras={{ testimonials: testimonials ?? [], stats: stats ?? [], redirectTo: p.redirect_after_submit }} />
      </main>
      <Footer />
    </>
  );
}
