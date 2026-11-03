import type { Metadata } from "next";
import { getCourses, getCurrentEdition, getPlans } from "@/lib/data";
import { formatMoney } from "@/lib/format";
import PageHeader from "@/components/site/PageHeader";
import Reveal from "@/components/site/Reveal";
import SetupNotice from "@/components/site/SetupNotice";
import RegistrationForm, { type Option } from "./RegistrationForm";

export const metadata: Metadata = { title: "Inscrição" };
export const dynamic = "force-dynamic";

type SP = Promise<{ plano?: string; ingresso?: string; formacao?: string; evento?: string }>;

export default async function InscricaoPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [edition, courses, plans] = await Promise.all([getCurrentEdition(), getCourses(), getPlans()]);
  const options: Option[] = [];

  if (edition?.registrations_open) {
    for (const t of edition.ticket_types ?? []) {
      if (!t.active) continue;
      options.push({
        target: "ticket", key: t.kind, label: `${edition.title}: ${t.name}`,
        note: t.price_published && t.price != null ? formatMoney(Number(t.price), edition.currency) : undefined,
      });
    }
  }
  for (const c of courses ?? []) {
    if (c.status !== "open") continue;
    options.push({ target: "course", key: c.id, label: c.name, note: !c.quote_only && c.price != null ? formatMoney(Number(c.price), c.currency) : undefined });
  }
  for (const p of plans ?? []) {
    if (p.cta_mode === "proposal") continue;
    options.push({ target: "plan", key: p.kind, label: p.name, note: p.price_published && p.price != null ? formatMoney(Number(p.price), p.currency) : undefined });
  }

  const selected = sp.ingresso ? `ticket:${sp.ingresso}` : sp.formacao ? `course:${sp.formacao}` : sp.plano ? `plan:${sp.plano}` : "";

  return (
    <div className="pb-20">
      <PageHeader eyebrow="Inscrição" title="Garanta a sua" accent="vaga" description="Preencha os dados e acompanhe o estado da sua inscrição depois de submeter." />
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {options.length === 0 ? <SetupNotice what="Inscrições" /> : (
          <Reveal>
            <div className="rounded-3xl border border-line bg-paper p-6 shadow-lg sm:p-8">
              <RegistrationForm options={options} selected={selected} />
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
