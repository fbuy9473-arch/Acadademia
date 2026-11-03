import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function Banner() {
  if (!supabaseConfigured) return null;
  const now = new Date().toISOString();
  const { data } = await (await createClient()).from("banners").select("message,link_url")
    .eq("active", true).or(`starts_at.is.null,starts_at.lte.${now}`).or(`ends_at.is.null,ends_at.gte.${now}`).limit(1);
  const b = data?.[0];
  if (!b) return null;
  const inner = <p className="px-4 py-2 text-center text-sm font-medium text-white">{b.message}</p>;
  return <div className="bg-brand">{b.link_url ? <a href={b.link_url}>{inner}</a> : inner}</div>;
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Banner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
