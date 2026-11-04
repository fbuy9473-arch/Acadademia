import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { nav } from "./nav";
import SocialLinks, { type Socials } from "./Social";
import { getSetting } from "@/lib/data";

type Contacts = { email?: string; phone?: string; whatsapp?: string; address?: string; socials?: Socials };

const support = [
  { href: "/teste-de-comunicacao", label: "Teste de comunicação" },
  { href: "/faq", label: "Perguntas frequentes" },
  { href: "/inscricao", label: "Inscrições" },
  { href: "/privacidade", label: "Política de privacidade" },
  { href: "/privacidade", label: "Termos de uso" },
];

export default async function Footer() {
  const c = (await getSetting<Contacts>("contacts")) ?? {};
  const col = "text-sm space-y-2 text-white/75";
  return (
    <footer data-tone="dark" className="mt-auto bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.3fr]">
        <div>
          <div className="inline-block rounded-lg bg-white p-2"><Logo /></div>
          <p className="mt-4 max-w-xs text-sm text-white/70">Formação, liderança, comunicação e impacto.</p>
          <SocialLinks socials={c.socials} />
        </div>
        <nav aria-label="Links rápidos">
          <h3 className="mb-3 text-sm font-semibold">Links rápidos</h3>
          <ul className={col}>{nav.map((i) => <li key={i.href}><Link href={i.href} className="hover:text-white">{i.label}</Link></li>)}</ul>
        </nav>
        <nav aria-label="Suporte">
          <h3 className="mb-3 text-sm font-semibold">Suporte</h3>
          <ul className={col}>{support.map((i) => <li key={i.label}><Link href={i.href} className="hover:text-white">{i.label}</Link></li>)}</ul>
        </nav>
        <address className="not-italic">
          <h3 className="mb-3 text-sm font-semibold">Contactos</h3>
          <ul className={col}>
            {c.address && <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-[#2fbf6a]" />{c.address}</li>}
            {c.phone && <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-[#2fbf6a]" /><a className="hover:text-white" href={`tel:${c.phone}`}>{c.phone}</a></li>}
            {c.email && <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-[#2fbf6a]" /><a className="hover:text-white" href={`mailto:${c.email}`}>{c.email}</a></li>}
          </ul>
        </address>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-white/50 sm:px-6">
          <span>© {new Date().getFullYear()} Academia Tchamile. Todos os direitos reservados.</span>
          <span>Desenvolvido com propósito em Angola <span className="text-red-400">♥</span> · <a href="/admin/login" className="hover:text-white">Área administrativa</a></span>
        </div>
      </div>
    </footer>
  );
}
