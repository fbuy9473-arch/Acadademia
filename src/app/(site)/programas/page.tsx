import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPlans } from "@/lib/data";
import PlanCard, { type Plan } from "@/components/site/PlanCard";
import Reveal from "@/components/site/Reveal";
import SetupNotice from "@/components/site/SetupNotice";

export const metadata: Metadata = {
  title: "Programas de Treinamento",
  description: "Escolha o programa ideal para o seu desenvolvimento.",
};
export const dynamic = "force-dynamic";

export default async function ProgramasPage() {
  const plans = (await getPlans()) as Plan[] | null;
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">
      <Reveal>
        <h1 className="text-4xl font-bold sm:text-5xl">Programas de Treinamento</h1>
        <p className="mt-3 max-w-2xl text-muted">Escolha o programa ideal para o seu desenvolvimento.</p>
      </Reveal>

      {!plans || plans.length === 0 ? (
        <SetupNotice what="Programas" />
      ) : (
        <div className="mt-12 grid items-stretch gap-8 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 110}>
              <PlanCard plan={p} />
            </Reveal>
          ))}
        </div>
      )}

      <Reveal delay={150}>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-mist p-6">
          <div>
            <p className="font-semibold">Não sabe qual escolher?</p>
            <p className="text-sm text-muted">Faça o teste de nível de comunicação e receba uma recomendação.</p>
          </div>
          <Link href="/teste-de-comunicacao" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark">
            Fazer o teste <ArrowRight size={16} />
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
