import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getSetting } from "@/lib/data";
import PageHeader from "@/components/site/PageHeader";
import Reveal from "@/components/site/Reveal";
import ContactForm from "./ContactForm";

export const metadata: Metadata = { title: "Contactos" };
export const dynamic = "force-dynamic";

type Contacts = { email?: string; phone?: string; whatsapp?: string; address?: string };

export default async function ContactosPage({ searchParams }: { searchParams: Promise<{ assunto?: string }> }) {
  const { assunto } = await searchParams;
  const c = (await getSetting<Contacts>("contacts")) ?? {};
  const items = [
    c.address && { icon: MapPin, label: "Onde estamos", value: c.address },
    c.phone && { icon: Phone, label: "Telefone", value: c.phone, href: `tel:${c.phone}` },
    c.whatsapp && { icon: MessageCircle, label: "WhatsApp", value: "Enviar mensagem", href: `https://wa.me/${c.whatsapp.replace(/\D/g, "")}` },
    c.email && { icon: Mail, label: "E-mail", value: c.email, href: `mailto:${c.email}` },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <div className="pb-20">
      <PageHeader eyebrow="Contactos" title="Fale" accent="connosco" description="Tire dúvidas ou peça uma proposta personalizada ou corporativa. Respondemos o mais depressa possível." />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.4fr]">
        <ul className="space-y-4 self-start">
          {items.map(({ icon: Icon, label, value, href }, i) => {
            const body = (
              <div className="group flex items-center gap-4 rounded-2xl border border-line bg-paper p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white"><Icon size={20} /></span>
                <span><span className="block text-xs font-semibold uppercase tracking-[0.1em] text-muted">{label}</span><span className="block font-semibold">{value}</span></span>
              </div>
            );
            return (
              <li key={label}>
                <Reveal variant="left" delay={i * 100}>{href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{body}</a> : body}</Reveal>
              </li>
            );
          })}
        </ul>
        <Reveal variant="right" delay={100}>
          <div className="rounded-3xl border border-line bg-paper p-6 shadow-lg sm:p-8">
            <h2 className="text-xl font-bold">Envie-nos uma mensagem</h2>
            <p className="mb-6 mt-1 text-sm text-muted">Os campos com asterisco são obrigatórios.</p>
            <ContactForm subject={assunto ?? "geral"} />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
