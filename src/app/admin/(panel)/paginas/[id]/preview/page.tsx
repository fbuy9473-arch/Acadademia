import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModule } from "@/lib/auth";
import Sections from "@/components/site/Sections";

export const metadata = { title: "Pré-visualização" };

export default async function Preview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ w?: string }> }) {
  const { id } = await params;
  const { w } = await searchParams;
  const { db } = await requireModule("paginas");
  const [{ data: page }, { data: testimonials }, { data: stats }] = await Promise.all([
    db.from("pages").select("*, page_sections(*)").eq("id", id).maybeSingle(),
    db.from("testimonials").select("id,author,role,body").eq("status", "published").limit(6),
    db.from("social_proof").select("id,value,label").eq("visible", true),
  ]);
  if (!page) notFound();
  const sections = [...page.page_sections].filter((s: any) => s.visible).sort((a: any, b: any) => a.position - b.position);
  const mobile = w === "mobile";
  return (
    <div className="min-h-screen bg-mist p-4">
      <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between text-sm">
        <Link href={`/admin/paginas/${id}`} className="text-brand">← Voltar ao editor</Link>
        <div className="flex gap-2">
          <Link href={`/admin/paginas/${id}/preview`} className={`rounded-lg border px-3 py-1.5 ${!mobile ? "border-brand bg-brand-soft" : "border-line bg-paper"}`}>Desktop</Link>
          <Link href={`/admin/paginas/${id}/preview?w=mobile`} className={`rounded-lg border px-3 py-1.5 ${mobile ? "border-brand bg-brand-soft" : "border-line bg-paper"}`}>Mobile</Link>
        </div>
      </div>
      <div className={`mx-auto overflow-hidden rounded-xl border border-line bg-paper ${mobile ? "max-w-[390px]" : "max-w-5xl"}`}>
        <Sections sections={sections as any} extras={{ testimonials: testimonials ?? [], stats: stats ?? [], redirectTo: null }} />
      </div>
    </div>
  );
}
