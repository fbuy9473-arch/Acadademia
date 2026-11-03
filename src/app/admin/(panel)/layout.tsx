import Link from "next/link";
import { redirect } from "next/navigation";
import { canAccess, getSession, modules, type ModuleKey } from "@/lib/auth";
import { Logo } from "@/components/site/Logo";
import { logout } from "../login/actions";

export const metadata = { title: { default: "Administração", template: "%s | Administração" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  if (!s.role) redirect("/admin/sem-acesso");
  const items = (Object.keys(modules) as ModuleKey[]).filter((k) => canAccess(s.role, k));
  const unread = canAccess(s.role, "notificacoes")
    ? (await s.db.from("notifications").select("id", { count: "exact", head: true }).eq("channel", "internal").is("read_at", null)).count ?? 0
    : 0;
  const badge = (k: ModuleKey) => k === "notificacoes" && unread > 0
    ? <span className="ml-2 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>
    : null;

  return (
    <div className="flex min-h-screen bg-mist">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-ink p-4 text-white md:flex">
        <div className="mb-6 rounded-lg bg-white p-2"><Logo className="h-10 w-auto" /></div>
        <nav aria-label="Administração" className="flex-1 space-y-1 overflow-y-auto text-sm">
          {items.map((k) => (
            <Link key={k} href={modules[k].href} className="block rounded-lg px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">{modules[k].label}{badge(k)}</Link>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-3 text-xs text-white/60">
          <p className="truncate">{s.name}</p><p>{s.role}</p>
          <form action={logout}><button className="mt-2 text-white/80 underline">Terminar sessão</button></form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <nav aria-label="Administração (móvel)" className="flex gap-1 overflow-x-auto bg-ink p-2 text-xs text-white md:hidden">
          {items.map((k) => <Link key={k} href={modules[k].href} className="shrink-0 rounded-md px-3 py-2 hover:bg-white/10">{modules[k].label}{badge(k)}</Link>)}
          <form action={logout}><button className="px-3 py-2 underline">Sair</button></form>
        </nav>
        <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
