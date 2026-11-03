"use server";

import { redirect } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/security";
import { fail, type Result } from "@/lib/actions";

export async function login(_p: Result, fd: FormData): Promise<Result> {
  if (!supabaseConfigured) return fail("O acesso não está disponível neste momento. Tente novamente mais tarde.");
  if (!(await rateLimit("login", 8))) return fail("Demasiadas tentativas. Aguarde alguns minutos.");
  const db = await createClient();
  const { error } = await db.auth.signInWithPassword({
    email: String(fd.get("email") ?? ""), password: String(fd.get("password") ?? ""),
  });
  if (error) return fail("Credenciais inválidas.");
  redirect("/admin");
}

export async function logout() {
  const db = await createClient();
  await db.auth.signOut();
  redirect("/admin/login");
}
