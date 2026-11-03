import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import PageHeader from "@/components/site/PageHeader";
import Reveal from "@/components/site/Reveal";
import SetupNotice from "@/components/site/SetupNotice";

export const metadata: Metadata = { title: "Perguntas frequentes" };
export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const faqs = supabaseConfigured
    ? ((await (await createClient()).from("faqs").select("*").eq("status", "published").order("position")).data ?? [])
    : [];
  const jsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  return (
    <div className="pb-20">
      <PageHeader eyebrow="Ajuda" title="Perguntas" accent="frequentes" description="As respostas às dúvidas mais comuns sobre inscrições, documentos e pagamentos." />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {faqs.length === 0 ? <SetupNotice what="Perguntas frequentes" /> : (
          <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <Reveal key={f.id} delay={i * 70}>
                  <details className="group rounded-2xl border border-line bg-paper px-5 transition-all duration-300 hover:border-brand/40 open:border-brand/40 open:shadow-md">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold [&::-webkit-details-marker]:hidden">
                      {f.question}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand transition-transform duration-300 group-open:rotate-180"><ChevronDown size={16} /></span>
                    </summary>
                    <p className="animate-[fadeUp_.35s_ease-out_both] pb-5 text-muted">{f.answer}</p>
                  </details>
                </Reveal>
              ))}
            </div>
            <Reveal delay={150}>
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-mist p-6">
                <div><p className="font-semibold">Não encontrou a resposta?</p><p className="text-sm text-muted">A nossa equipa terá todo o gosto em ajudar.</p></div>
                <Link href="/contactos" className="btn-shine inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark">Falar connosco <ArrowRight size={16} /></Link>
              </div>
            </Reveal>
          </>
        )}
      </div>
    </div>
  );
}
