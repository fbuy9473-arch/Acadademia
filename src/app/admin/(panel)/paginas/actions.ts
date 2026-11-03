"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireModule } from "@/lib/auth";
import { bool, done, fail, slugify, str, type Result } from "@/lib/actions";
import { safeUrl, sectionSchemas, sectionTypes, type SectionType } from "@/lib/sections";
import { parseSection } from "@/lib/section-fields";

const slugRe = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const reserved = ["admin", "api", "l"];

async function snapshot(db: any, pageId: string, userId: string) {
  const { data } = await db.from("pages").select("*, page_sections(*)").eq("id", pageId).single();
  if (data) await db.from("page_revisions").insert({ page_id: pageId, snapshot: data, saved_by: userId });
}

export async function createPage(_p: Result, fd: FormData): Promise<Result> {
  const { db, user } = await requireModule("paginas");
  const title = str(fd, "title");
  if (!title) return fail("O título é obrigatório.");
  const slug = slugify(str(fd, "slug") ?? title);
  if (!slugRe.test(slug) || reserved.includes(slug)) return fail("Endereço inválido ou reservado.");
  const { data, error } = await db.from("pages").insert({ title, slug, kind: "landing", status: "draft", created_by: user.id }).select("id").single();
  if (error || !data) return fail("Já existe uma página com este endereço, ou sem permissão.");
  await db.from("page_sections").insert([
    { page_id: data.id, type: "hero", position: 0, content: sectionSchemas.hero.parse({ title }) },
    { page_id: data.id, type: "form", position: 1, content: sectionSchemas.form.parse({ title: "Peça informações" }) },
  ]);
  redirect(`/admin/paginas/${data.id}`);
}

const metaSchema = z.object({
  title: z.string().trim().min(1).max(160), slug: z.string().regex(slugRe),
  seo_title: z.string().trim().max(70).nullable(), seo_description: z.string().trim().max(170).nullable(),
  og_image_path: safeUrl.nullable(), redirect_after_submit: safeUrl.nullable(), campaign: z.string().max(80).nullable(),
});

export async function savePageMeta(id: string, _p: Result, fd: FormData): Promise<Result> {
  const { db, user } = await requireModule("paginas");
  const parsed = metaSchema.safeParse({
    title: str(fd, "title") ?? "", slug: slugify(str(fd, "slug") ?? ""), seo_title: str(fd, "seo_title"),
    seo_description: str(fd, "seo_description"), og_image_path: str(fd, "og_image_path"),
    redirect_after_submit: str(fd, "redirect_after_submit"), campaign: str(fd, "campaign"),
  });
  if (!parsed.success) return fail("Dados inválidos (verifique o endereço, ligações https:// e tamanhos de SEO).");
  if (reserved.includes(parsed.data.slug)) return fail("Endereço reservado.");
  await snapshot(db, id, user.id);
  const { error } = await db.from("pages").update({ ...parsed.data, indexable: bool(fd, "indexable"), course_id: str(fd, "course_id") }).eq("id", id);
  if (error) return fail("Endereço já em uso ou sem permissão.");
  revalidatePath(`/l/${parsed.data.slug}`);
  return done();
}

export async function setPageStatus(id: string, status: "draft" | "published"): Promise<void> {
  const { db, user } = await requireModule("paginas");
  await snapshot(db, id, user.id);
  const { data } = await db.from("pages").update({ status, published_at: status === "published" ? new Date().toISOString() : null }).eq("id", id).select("slug").single();
  if (data) revalidatePath(`/l/${data.slug}`);
  revalidatePath(`/admin/paginas/${id}`);
}

export async function duplicatePage(id: string): Promise<void> {
  const { db, user } = await requireModule("paginas");
  const { data: p } = await db.from("pages").select("*, page_sections(*)").eq("id", id).single();
  if (!p) return;
  const slug = `${p.slug}-copia-${Math.random().toString(36).slice(2, 6)}`;
  const { data: np } = await db.from("pages").insert({
    title: `${p.title} (cópia)`, slug, kind: "landing", status: "draft", seo_title: p.seo_title, seo_description: p.seo_description,
    og_image_path: p.og_image_path, indexable: p.indexable, redirect_after_submit: p.redirect_after_submit, campaign: p.campaign, course_id: p.course_id, created_by: user.id,
  }).select("id").single();
  if (!np) return;
  const secs = (p.page_sections ?? []).map((s: any) => ({ page_id: np.id, type: s.type, position: s.position, visible: s.visible, content: s.content }));
  if (secs.length) await db.from("page_sections").insert(secs);
  redirect(`/admin/paginas/${np.id}`);
}

export async function deletePage(id: string): Promise<void> {
  const { db } = await requireModule("paginas");
  await db.from("pages").delete().eq("id", id);
  redirect("/admin/paginas");
}

export async function addSection(pageId: string, _p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("paginas");
  const type = str(fd, "type") as SectionType | null;
  if (!type || !sectionTypes.includes(type)) return fail("Tipo de secção inválido.");
  const { count } = await db.from("page_sections").select("id", { count: "exact", head: true }).eq("page_id", pageId);
  const { error } = await db.from("page_sections").insert({ page_id: pageId, type, position: count ?? 0, content: sectionSchemas[type].parse({}) });
  if (error) return fail("Sem permissão.");
  revalidatePath(`/admin/paginas/${pageId}`);
  return done("Secção adicionada.");
}

export async function saveSection(pageId: string, sectionId: string, type: SectionType, _p: Result, fd: FormData): Promise<Result> {
  const { db, user } = await requireModule("paginas");
  const parsed = parseSection(type, (n) => String(fd.get(n) ?? ""));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Conteúdo inválido.");
  await snapshot(db, pageId, user.id);
  const { error } = await db.from("page_sections").update({ content: parsed.data, visible: bool(fd, "visible") }).eq("id", sectionId);
  if (error) return fail("Sem permissão.");
  const { data: p } = await db.from("pages").select("slug").eq("id", pageId).single();
  if (p) revalidatePath(`/l/${p.slug}`);
  revalidatePath(`/admin/paginas/${pageId}`);
  return done();
}

export async function deleteSection(pageId: string, sectionId: string): Promise<void> {
  const { db } = await requireModule("paginas");
  await db.from("page_sections").delete().eq("id", sectionId);
  revalidatePath(`/admin/paginas/${pageId}`);
}

/** Recebe a nova ordem completa (arrastar e largar ou botões ↑↓). */
export async function reorderSections(pageId: string, orderedIds: string[]): Promise<void> {
  const { db } = await requireModule("paginas");
  if (!Array.isArray(orderedIds) || orderedIds.some((i) => typeof i !== "string")) return;
  await Promise.all(orderedIds.map((id, position) => db.from("page_sections").update({ position }).eq("id", id).eq("page_id", pageId)));
  const { data: p } = await db.from("pages").select("slug").eq("id", pageId).single();
  if (p) revalidatePath(`/l/${p.slug}`);
  revalidatePath(`/admin/paginas/${pageId}`);
}
