"use server";

import { revalidatePath } from "next/cache";
import { requireModule, type Role } from "@/lib/auth";
import { bool, done, fail, str, type Result } from "@/lib/actions";
import { createAdminClient } from "@/lib/supabase/admin";

const roles: Role[] = ["superadmin", "admin", "comercial", "financeiro", "formador", "gestor_eventos", "editor"];

export async function setRole(userId: string, _p: Result, fd: FormData): Promise<Result> {
  const s = await requireModule("utilizadores");
  const role = str(fd, "role") as Role | null;
  if (role && !roles.includes(role)) return fail("Papel inválido.");
  // Só o superadmin atribui ou altera o papel de superadmin
  const { data: target } = await s.db.from("profiles").select("role").eq("id", userId).single();
  if ((role === "superadmin" || target?.role === "superadmin") && s.role !== "superadmin") return fail("Apenas um superadministrador pode gerir superadministradores.");
  if (userId === s.user.id && (!bool(fd, "active") || role !== s.role)) return fail("Não pode alterar o seu próprio papel ou desativar a própria conta.");
  const { error } = await s.db.from("profiles").update({ role, active: bool(fd, "active") }).eq("id", userId);
  if (error) return fail("Sem permissão.");
  revalidatePath("/admin/utilizadores");
  return done();
}

export async function inviteUser(_p: Result, fd: FormData): Promise<Result> {
  const s = await requireModule("utilizadores");
  const email = str(fd, "email"), role = str(fd, "role") as Role | null;
  if (!email || !role || !roles.includes(role)) return fail("E-mail e papel válidos são obrigatórios.");
  if (role === "superadmin" && s.role !== "superadmin") return fail("Apenas um superadministrador pode criar superadministradores.");
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: str(fd, "full_name") ?? "" } });
  if (error || !data.user) return fail("Não foi possível enviar o convite. Verifique o e-mail e tente novamente.");
  await admin.from("profiles").update({ role, full_name: str(fd, "full_name") ?? "" }).eq("id", data.user.id);
  revalidatePath("/admin/utilizadores");
  return done("Convite enviado por e-mail.");
}
