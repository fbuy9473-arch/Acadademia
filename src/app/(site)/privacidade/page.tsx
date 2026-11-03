import type { Metadata } from "next";
import { getSetting } from "@/lib/data";
import PageHeader from "@/components/site/PageHeader";
import Reveal from "@/components/site/Reveal";
import SetupNotice from "@/components/site/SetupNotice";

export const metadata: Metadata = { title: "Privacidade e termos de utilização" };
export const dynamic = "force-dynamic";

export default async function PrivacidadePage() {
  const legal = await getSetting<{ privacy?: string; terms?: string }>("legal");
  if (!legal?.privacy && !legal?.terms) return <SetupNotice what="Política de privacidade e termos" />;
  const blocks = [["Política de privacidade", legal.privacy], ["Termos de utilização", legal.terms]].filter(([, t]) => t) as [string, string][];
  return (
    <div className="pb-20">
      <PageHeader eyebrow="Legal" title="Privacidade e" accent="termos de utilização" />
      <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
        {blocks.map(([h, t], i) => (
          <Reveal key={h} delay={i * 100}>
            <section className="rounded-3xl border border-line bg-paper p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold">{h}</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">{t}</p>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
