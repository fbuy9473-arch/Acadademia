import type { MetadataRoute } from "next";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const fixed = ["", "/sobre", "/formacoes", "/programas", "/protagonista-summit", "/teste-de-comunicacao", "/contactos", "/faq", "/privacidade"]
    .map((p) => ({ url: `${site}${p}` }));
  if (!supabaseConfigured) return fixed;
  const db = await createClient();
  const [{ data: courses }, { data: pages }] = await Promise.all([
    db.from("courses").select("slug,updated_at").in("status", ["published", "open", "full"]),
    db.from("pages").select("slug,updated_at").eq("kind", "landing").eq("status", "published").eq("indexable", true),
  ]);
  return [
    ...fixed,
    ...(courses ?? []).map((c) => ({ url: `${site}/formacoes/${c.slug}`, lastModified: c.updated_at })),
    ...(pages ?? []).map((p) => ({ url: `${site}/l/${p.slug}`, lastModified: p.updated_at })),
  ];
}
