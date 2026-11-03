"use server";

import { revalidatePath } from "next/cache";
import { requireModule } from "@/lib/auth";
import { bool, done, fail, lines, num, str, type Result } from "@/lib/actions";

export async function savePlan(id: string, _p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("programas");
  const name = str(fd, "name");
  if (!name) return fail("O nome é obrigatório.");
  const price = num(fd, "price");
  const publishPrice = bool(fd, "price_published");
  if (publishPrice && price == null) return fail("Defina o preço antes de o publicar.");
  const currency = (str(fd, "currency") ?? "USD").toUpperCase();
  if (currency.length !== 3) return fail("Moeda: código de 3 letras.");

  const { error } = await db.from("training_plans").update({
    name, tagline: str(fd, "tagline"), duration_label: str(fd, "duration_label"), duration_days: num(fd, "duration_days"),
    price, currency, price_published: publishPrice, cta_label: str(fd, "cta_label") ?? "Inscrever-me",
    conditions: str(fd, "conditions"), capacity: num(fd, "capacity"), status: str(fd, "status") ?? "draft",
    included_course_ids: fd.getAll("included").map(String),
  }).eq("id", id);
  if (error) return fail("Sem permissão ou dados inválidos.");

  // benefícios: substitui a lista, preservando a ordem das linhas
  const benefits = lines(fd, "benefits");
  await db.from("plan_benefits").delete().eq("plan_id", id);
  if (benefits.length) {
    const { error: e2 } = await db.from("plan_benefits").insert(benefits.map((text, position) => ({ plan_id: id, text, position })));
    if (e2) return fail("Plano guardado, mas houve erro nos benefícios.");
  }
  revalidatePath("/programas");
  return done();
}
