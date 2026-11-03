"use server";

import { revalidatePath } from "next/cache";
import { requireModule } from "@/lib/auth";
import { done, fail, str, type Result } from "@/lib/actions";

export async function moveLead(id: string, fd: FormData): Promise<void> {
  const { db, user } = await requireModule("crm");
  const stage = str(fd, "stage_id");
  if (!stage) return;
  const { data: st } = await db.from("pipeline_stages").select("name").eq("id", stage).single();
  await db.from("leads").update({ stage_id: stage }).eq("id", id);
  await db.from("lead_interactions").insert({ lead_id: id, author_id: user.id, kind: "stage", body: `Movido para "${st?.name}"` });
  revalidatePath("/admin/crm");
}

export async function addNote(id: string, _p: Result, fd: FormData): Promise<Result> {
  const { db, user } = await requireModule("crm");
  const body = str(fd, "body");
  if (!body) return fail("Escreva a nota.");
  const { error } = await db.from("lead_interactions").insert({ lead_id: id, author_id: user.id, kind: "note", body });
  if (error) return fail("Sem permissão.");
  revalidatePath("/admin/crm");
  return done("Nota adicionada.");
}

export async function assignToMe(id: string): Promise<void> {
  const { db, user } = await requireModule("crm");
  await db.from("leads").update({ owner_id: user.id }).eq("id", id);
  revalidatePath("/admin/crm");
}
