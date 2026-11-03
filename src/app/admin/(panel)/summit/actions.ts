"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth";
import { bool, done, fail, lines, luandaToIso, num, str, uploadPublicImage, type Result } from "@/lib/actions";
import { safeUrl } from "@/lib/sections";

const refresh = () => { revalidatePath("/protagonista-summit"); revalidatePath("/"); revalidatePath("/inscricao"); };

export async function createEdition(_p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("summit");
  const year = num(fd, "year");
  if (!year || year < 2000 || year > 2100) return fail("Ano inválido.");
  const { data: ev } = await db.from("events").select("id,name").eq("slug", "protagonista-summit").single();
  if (!ev) return fail("Evento base não encontrado (execute a migração).");
  const { data: ed, error } = await db.from("event_editions").insert({
    event_id: ev.id, year, title: ev.name, currency: str(fd, "currency")?.toUpperCase() ?? "AOA",
    starts_at: new Date(`${year}-12-15T09:00:00+01:00`).toISOString(), status: "draft",
  }).select("id").single();
  if (error || !ed) return fail("Já existe uma edição para este ano ou sem permissão.");
  await db.from("ticket_types").insert([
    { edition_id: ed.id, kind: "normal", name: "Ingresso Normal", total_quantity: 15, benefits: ["Acesso ao evento"], batch_label: "Lote 1" },
    { edition_id: ed.id, kind: "vip", name: "Ingresso VIP", total_quantity: 25, benefits: ["Acesso exclusivo"], batch_label: "Lote 1" },
    { edition_id: ed.id, kind: "corporativo", name: "Pacote Corporativo", total_quantity: 1, includes_vip_tickets: 10, includes_public_exposure: 1, includes_stage_pitch: true,
      benefits: ["Acesso corporativo", "10 ingressos VIP", "Uma exposição pública", "Pitch de negócio no palco principal"], batch_label: "Lote 1" },
  ]);
  redirect(`/admin/summit?ed=${ed.id}`);
}

export async function saveEdition(id: string, _p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("summit");
  const startsAt = luandaToIso(str(fd, "starts_at"));
  if (!startsAt) return fail("A data do evento é obrigatória.");
  const endsAt = luandaToIso(str(fd, "ends_at"));
  if (endsAt && endsAt < startsAt) return fail("O fim não pode ser anterior ao início.");
  const invite = str(fd, "group_invite_url");
  if (invite && !safeUrl.safeParse(invite).success) return fail("Ligação do grupo inválida (use https://).");
  if (bool(fd, "group_invite_active") && !invite) return fail("Defina a ligação do grupo para a ativar.");

  const img = await uploadPublicImage(db, fd, "hero_image", "summit");
  if (img.error) return fail(img.error);

  const makeCurrent = bool(fd, "is_current");
  if (makeCurrent) {
    const { data: ed } = await db.from("event_editions").select("event_id").eq("id", id).single();
    if (ed) await db.from("event_editions").update({ is_current: false }).eq("event_id", ed.event_id).neq("id", id);
  }
  const { error } = await db.from("event_editions").update({
    title: str(fd, "title") ?? "Protagonista Summit", headline: str(fd, "headline"), subtitle: str(fd, "subtitle"),
    starts_at: startsAt, ends_at: endsAt, venue: str(fd, "venue"), city: str(fd, "city"),
    about: str(fd, "about"), history: str(fd, "history"), video_url: str(fd, "video_url"),
    currency: (str(fd, "currency") ?? "AOA").toUpperCase(), registrations_open: bool(fd, "registrations_open"),
    group_invite_url: invite, group_invite_active: bool(fd, "group_invite_active"),
    is_current: makeCurrent, status: str(fd, "status") ?? "draft",
    ...(img.url ? { hero_image_path: img.url } : {}),
  }).eq("id", id);
  if (error) return fail("Sem permissão ou dados inválidos.");
  refresh();
  return done("Edição guardada. Data e estado atualizados em todas as páginas.");
}

export async function saveTicket(id: string, _p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("summit");
  const price = num(fd, "price"), promo = num(fd, "promo_price"), total = num(fd, "total_quantity");
  if (total == null || total < 0 || !Number.isInteger(total)) return fail("Quantidade total inválida.");
  if (bool(fd, "price_published") && price == null) return fail("Defina o preço antes de o publicar.");
  if (promo != null && price != null && promo >= price) return fail("O preço promocional deve ser inferior ao preço normal.");
  const { error } = await db.from("ticket_types").update({
    name: str(fd, "name") ?? "Ingresso", price, promo_price: promo, promo_ends_at: luandaToIso(str(fd, "promo_ends_at")),
    price_published: bool(fd, "price_published"), total_quantity: total, benefits: lines(fd, "benefits"),
    access_conditions: str(fd, "access_conditions"), sales_start: luandaToIso(str(fd, "sales_start")),
    sales_end: luandaToIso(str(fd, "sales_end")), batch_label: str(fd, "batch_label"), active: bool(fd, "active"),
    includes_vip_tickets: num(fd, "includes_vip_tickets") ?? 0, includes_public_exposure: num(fd, "includes_public_exposure") ?? 0,
    includes_stage_pitch: bool(fd, "includes_stage_pitch"),
  }).eq("id", id);
  if (error) return fail("Sem permissão ou dados inválidos.");
  refresh();
  return done();
}

export async function addSession(editionId: string, _p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("summit");
  const at = luandaToIso(str(fd, "starts_at")), title = str(fd, "title");
  if (!at || !title) return fail("Horário e tema são obrigatórios.");
  const { data: last } = await db.from("event_sessions").select("position").eq("edition_id", editionId).order("position", { ascending: false }).limit(1);
  const { error } = await db.from("event_sessions").insert({
    edition_id: editionId, starts_at: at, title, speaker: str(fd, "speaker"), description: str(fd, "description"),
    activity_type: str(fd, "activity_type"), stage: str(fd, "stage"), duration_minutes: num(fd, "duration_minutes"),
    position: (last?.[0]?.position ?? -1) + 1,
  });
  if (error) return fail("Sem permissão ou dados inválidos.");
  refresh(); revalidatePath("/admin/summit");
  return done("Sessão adicionada.");
}

export async function deleteSession(id: string): Promise<void> {
  const { db } = await requireModule("summit");
  await db.from("event_sessions").delete().eq("id", id);
  refresh(); revalidatePath("/admin/summit");
}

/** Troca a posição com o vizinho (dir = -1 sobe, +1 desce). */
export async function moveSession(editionId: string, id: string, dir: number): Promise<void> {
  const { db } = await requireModule("summit");
  const { data } = await db.from("event_sessions").select("id,position").eq("edition_id", editionId).order("position");
  const list = data ?? [];
  const i = list.findIndex((s) => s.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  await Promise.all([
    db.from("event_sessions").update({ position: j }).eq("id", list[i].id),
    db.from("event_sessions").update({ position: i }).eq("id", list[j].id),
  ]);
  refresh(); revalidatePath("/admin/summit");
}

export async function addAudience(editionId: string, _p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("summit");
  const title = str(fd, "title");
  if (!title) return fail("O título é obrigatório.");
  const { count } = await db.from("event_audiences").select("id", { count: "exact", head: true }).eq("edition_id", editionId);
  const { error } = await db.from("event_audiences").insert({ edition_id: editionId, title, description: str(fd, "description"), position: count ?? 0 });
  if (error) return fail("Sem permissão.");
  refresh(); revalidatePath("/admin/summit");
  return done("Público adicionado.");
}

export async function deleteAudience(id: string): Promise<void> {
  const { db } = await requireModule("summit");
  await db.from("event_audiences").delete().eq("id", id);
  refresh(); revalidatePath("/admin/summit");
}
