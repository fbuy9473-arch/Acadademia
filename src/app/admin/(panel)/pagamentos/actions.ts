"use server";

import { revalidatePath } from "next/cache";
import { requireModule } from "@/lib/auth";
import { done, fail, num, str, type Result } from "@/lib/actions";
import { notifyInternal } from "@/lib/notify";

/** Só o financeiro/admin valida; fica registado quem e quando. */
export async function setPaymentStatus(id: string, status: "confirmed" | "failed" | "refunded"): Promise<void> {
  const { db, user } = await requireModule("pagamentos");
  const patch: Record<string, unknown> = { status };
  if (status === "confirmed") Object.assign(patch, { confirmed_by: user.id, confirmed_at: new Date().toISOString(), paid_at: new Date().toISOString() });
  const { data } = await db.from("payments").update(patch).eq("id", id).select("registration_id").single();
  if (status === "confirmed") await notifyInternal("payment_confirmed", { payment: id, registration: data?.registration_id });
  revalidatePath("/admin/pagamentos");
}

export async function addExpense(_p: Result, fd: FormData): Promise<Result> {
  const { db, user } = await requireModule("pagamentos");
  const description = str(fd, "description"), amount = num(fd, "amount"), currency = str(fd, "currency")?.toUpperCase();
  if (!description || !amount || amount <= 0 || !currency || currency.length !== 3) return fail("Descrição, valor e moeda são obrigatórios.");
  const { error } = await db.from("expenses").insert({ description, amount, currency, created_by: user.id, spent_on: str(fd, "spent_on") ?? undefined });
  if (error) return fail("Sem permissão.");
  revalidatePath("/admin/pagamentos");
  return done("Despesa registada.");
}

export async function addExchangeRate(_p: Result, fd: FormData): Promise<Result> {
  const { db, user } = await requireModule("pagamentos");
  const from = str(fd, "from_currency")?.toUpperCase(), to = str(fd, "to_currency")?.toUpperCase(), rate = num(fd, "rate");
  if (!from || !to || from.length !== 3 || to.length !== 3 || !rate || rate <= 0) return fail("Moedas (3 letras) e taxa positiva são obrigatórias.");
  const { error } = await db.from("exchange_rates").insert({ from_currency: from, to_currency: to, rate, created_by: user.id });
  if (error) return fail("Sem permissão.");
  revalidatePath("/admin/pagamentos");
  return done("Taxa registada.");
}
