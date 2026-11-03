"use server";

import { revalidatePath } from "next/cache";
import { requireModule } from "@/lib/auth";
import { done, fail, num, str, type Result } from "@/lib/actions";
import { notifyInternal, sendEmail } from "@/lib/notify";

const statuses = ["draft", "pending_documents", "pending_payment", "in_validation", "confirmed", "rejected", "cancelled", "refunded"];

export async function updateRegistration(id: string, _p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("inscricoes");
  const status = str(fd, "status");
  if (!status || !statuses.includes(status)) return fail("Estado inválido.");

  const { data: reg } = await db.from("registrations")
    .select("status, amount, currency, participants(full_name,email), code").eq("id", id).single();
  if (!reg) return fail("Inscrição não encontrada.");

  if (status === "confirmed" && reg.status !== "confirmed" && reg.amount != null) {
    const { data: pays } = await db.from("payments").select("amount,currency").eq("registration_id", id).eq("status", "confirmed");
    const paid = (pays ?? []).filter((p) => p.currency === reg.currency).reduce((a, p) => a + Number(p.amount), 0);
    if (paid < Number(reg.amount)) return fail("Não é possível confirmar: não há pagamento confirmado que cubra o valor da inscrição.");
  }

  const { error } = await db.from("registrations").update({ status, internal_notes: str(fd, "internal_notes") }).eq("id", id);
  if (error) return fail("Sem permissão ou erro ao guardar.");

  const p: any = Array.isArray(reg.participants) ? reg.participants[0] : reg.participants;
  if (status === "confirmed" && reg.status !== "confirmed" && p?.email) {
    await sendEmail(p.email, "Inscrição confirmada — Academia Tchamile",
      `Olá ${p.full_name},\n\nA sua inscrição ${reg.code} foi confirmada. Consulte os próximos passos e o convite para o grupo oficial na página de estado da inscrição.\n\nAcademia Tchamile`, "registration_approved");
    await notifyInternal("registration_approved", { code: reg.code });
  }
  revalidatePath(`/admin/inscricoes/${id}`);
  return done();
}

export async function addPayment(id: string, _p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("pagamentos");
  const amount = num(fd, "amount"), currency = str(fd, "currency")?.toUpperCase();
  if (!amount || amount <= 0 || !currency || currency.length !== 3) return fail("Valor e moeda (3 letras) são obrigatórios.");
  const { error } = await db.from("payments").insert({
    registration_id: id, amount, currency, method: str(fd, "method"), reference: str(fd, "reference"), status: "pending",
  });
  if (error) return fail("Sem permissão ou erro ao registar.");
  revalidatePath(`/admin/inscricoes/${id}`);
  return done("Pagamento registado como pendente. Valide-o em Pagamentos.");
}

export async function sendInvite(id: string, _p: Result): Promise<Result> {
  const { db } = await requireModule("inscricoes");
  const { data: reg } = await db.from("registrations")
    .select("status,code,access_token,participants(full_name,email),event_editions(group_invite_url,group_invite_active)").eq("id", id).single();
  const ed: any = Array.isArray(reg?.event_editions) ? reg?.event_editions[0] : reg?.event_editions;
  const p: any = Array.isArray(reg?.participants) ? reg?.participants[0] : reg?.participants;
  if (!reg || reg.status !== "confirmed") return fail("A inscrição tem de estar confirmada.");
  if (!ed?.group_invite_active || !ed?.group_invite_url) return fail("O convite do grupo não está ativo para esta edição.");
  if (!p?.email) return fail("Participante sem e-mail.");
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await sendEmail(p.email, "Convite para o grupo oficial — Academia Tchamile",
    `Olá ${p.full_name},\n\nA sua inscrição está confirmada. Se desejar, entre no grupo oficial (a entrada é voluntária):\n${site}/inscricao/estado?codigo=${reg.code}&token=${reg.access_token}\n\nAcademia Tchamile`, "registration_approved");
  await db.from("registrations").update({ invite_sent_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/admin/inscricoes/${id}`);
  return done("Convite enviado (veja o resultado real em notificações).");
}

export async function markJoined(id: string): Promise<void> {
  const { db } = await requireModule("inscricoes");
  await db.from("registrations").update({ invite_joined_at: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/admin/inscricoes/${id}`);
}
