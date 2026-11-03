import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Compass, Building2, SlidersHorizontal, Star, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { formatMoney } from "@/lib/format";

export type Plan = {
  id: string; kind: string; name: string; tagline: string | null; duration_label: string | null;
  price: number | null; currency: string; price_published: boolean; cta_label: string; cta_mode: string;
  conditions: string | null; plan_benefits: { id: string; text: string; position: number }[];
};

const meta: Record<string, { icon: LucideIcon; photo: string }> = {
  turma: { icon: Users, photo: "/photos/plateia.png" },
  personalizado: { icon: SlidersHorizontal, photo: "/photos/orador-livro.png" },
  edicao_especial: { icon: Star, photo: "/photos/participante-notas.png" },
  mentoria: { icon: Compass, photo: "/photos/orador-microfone.png" },
  corporativo: { icon: Building2, photo: "/photos/plateia.png" },
};

export const planHref = (p: Pick<Plan, "kind" | "cta_mode">) =>
  p.cta_mode === "proposal" ? `/contactos?assunto=${p.kind}` : `/inscricao?plano=${p.kind}`;

/** Cartão de pacote. `featured` destaca-o (fundo escuro); `maxBenefits` limita a lista (Início). */
export default function PlanCard({ plan, featured = false, maxBenefits }: { plan: Plan; featured?: boolean; maxBenefits?: number }) {
  const { icon: Icon, photo } = meta[plan.kind] ?? meta.turma;
  const benefits = [...plan.plan_benefits].sort((a, b) => a.position - b.position);
  const shown = maxBenefits ? benefits.slice(0, maxBenefits) : benefits;
  const hasPrice = plan.price_published && plan.price != null;

  return (
    <article
      className={clsx(
        "group relative flex h-full flex-col rounded-3xl border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl",
        featured ? "z-10 border-ink bg-ink text-white shadow-xl md:scale-[1.04]" : "border-line bg-paper shadow-sm",
      )}
    >
      <div className="relative">
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-3xl">
        <Image src={photo} alt="" fill sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
        <span className={clsx("absolute inset-0 bg-gradient-to-t to-transparent", featured ? "from-ink via-ink/30" : "from-black/50")} />
        {plan.duration_label && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <CalendarDays size={13} /> {plan.duration_label}
          </span>
        )}
      </div>
        <span className={clsx("absolute -bottom-0 left-6 flex h-12 w-12 translate-y-1/2 items-center justify-center rounded-2xl bg-brand text-white shadow-lg ring-4 transition-transform duration-300 group-hover:-translate-y-[40%] group-hover:rotate-6", featured ? "ring-ink" : "ring-paper")}>
          <Icon size={22} />
        </span>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-9">
        <h3 className="text-xl font-bold">{plan.name}</h3>
        {plan.tagline && <p className={clsx("mt-1 text-sm", featured ? "text-white/70" : "text-muted")}>{plan.tagline}</p>}

        <ul className="mt-5 flex-1 space-y-3 text-sm">
          {shown.map((b) => (
            <li key={b.id} className="flex gap-3">
              <span className={clsx("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", featured ? "bg-brand/30 text-[#2fbf6a]" : "bg-brand-soft text-brand")}><Check size={12} strokeWidth={3} /></span>
              <span className={featured ? "text-white/90" : undefined}>{b.text}</span>
            </li>
          ))}
        </ul>

        {!maxBenefits && plan.conditions && <p className={clsx("mt-5 rounded-xl p-3 text-xs", featured ? "bg-white/10 text-white/75" : "bg-mist text-muted")}>{plan.conditions}</p>}

        <div className={clsx("mt-6 border-t pt-5", featured ? "border-white/15" : "border-line")}>
          {hasPrice ? (
            <p className="text-3xl font-extrabold">{formatMoney(Number(plan.price), plan.currency)}</p>
          ) : (
            <p className={clsx("text-sm font-semibold", featured ? "text-[#2fbf6a]" : "text-brand")}>Valor sob consulta</p>
          )}
          <Link
            href={planHref(plan)}
            className={clsx(
              "btn-shine mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-colors",
              featured ? "bg-brand text-white hover:bg-brand-dark" : "border border-brand text-brand hover:bg-brand hover:text-white",
            )}
          >
            {plan.cta_label} <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
