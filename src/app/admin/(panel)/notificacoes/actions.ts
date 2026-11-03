"use server";

import { revalidatePath } from "next/cache";
import { requireModule } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// A tabela só tem política de leitura para o pessoal; marcar como lida usa o cliente de serviço,
// depois de confirmar o acesso ao módulo.
export async function markRead(id: string): Promise<void> {
  await requireModule("notificacoes");
  await createAdminClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
  revalidatePath("/admin", "layout");
}

export async function markAllRead(): Promise<void> {
  await requireModule("notificacoes");
  await createAdminClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("channel", "internal").is("read_at", null);
  revalidatePath("/admin", "layout");
}
