import "server-only";
import { redirect } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export type Role =
  | "superadmin" | "admin" | "comercial" | "financeiro" | "formador" | "gestor_eventos" | "editor";

/** Módulos do painel e quem os pode abrir (superadmin acede a tudo). Reflete as políticas RLS. */
export const modules = {
  dashboard: { label: "Dashboard", href: "/admin", roles: ["admin", "comercial", "financeiro", "formador", "gestor_eventos", "editor"] },
  inscricoes: { label: "Inscrições", href: "/admin/inscricoes", roles: ["admin", "comercial", "financeiro", "gestor_eventos"] },
  formacoes: { label: "Formações", href: "/admin/formacoes", roles: ["admin", "editor"] },
  programas: { label: "Programas", href: "/admin/programas", roles: ["admin", "editor"] },
  summit: { label: "Protagonista Summit", href: "/admin/summit", roles: ["admin", "gestor_eventos"] },
  paginas: { label: "Landing Pages", href: "/admin/paginas", roles: ["admin", "editor"] },
  crm: { label: "CRM / Leads", href: "/admin/crm", roles: ["admin", "comercial"] },
  pagamentos: { label: "Pagamentos", href: "/admin/pagamentos", roles: ["admin", "financeiro"] },
  conteudos: { label: "Conteúdos", href: "/admin/conteudos", roles: ["admin", "editor"] },
  notificacoes: { label: "Notificações", href: "/admin/notificacoes", roles: ["admin", "comercial", "financeiro", "gestor_eventos"] },
  utilizadores: { label: "Utilizadores", href: "/admin/utilizadores", roles: ["admin"] },
  auditoria: { label: "Auditoria", href: "/admin/auditoria", roles: ["admin"] },
} as const;

export type ModuleKey = keyof typeof modules;

export function canAccess(role: Role | null, mod: ModuleKey) {
  if (!role) return false;
  return role === "superadmin" || (modules[mod].roles as readonly string[]).includes(role);
}

export async function getSession() {
  if (!supabaseConfigured) return null;
  const db = await createClient();
  const { data } = await db.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await db
    .from("profiles").select("full_name, role, active").eq("id", data.user.id).maybeSingle();
  const role = profile?.active ? (profile.role as Role | null) : null;
  return { db, user: data.user, name: profile?.full_name || data.user.email || "", role };
}

/** Use no início de cada página e Server Action do painel. */
export async function requireModule(mod: ModuleKey) {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  if (!canAccess(s.role, mod)) redirect("/admin/sem-acesso");
  return s;
}
