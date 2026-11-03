"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth";
import { bool, done, fail, lines, num, slugify, str, uploadPublicImage, type Result } from "@/lib/actions";

export async function saveCourse(id: string, _p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("formacoes");
  const name = str(fd, "name");
  if (!name) return fail("O nome é obrigatório.");
  const price = num(fd, "price");
  if (price != null && price < 0) return fail("Preço inválido.");
  const currency = (str(fd, "currency") ?? "USD").toUpperCase();
  if (currency.length !== 3) return fail("Moeda: código de 3 letras (ex.: USD, AOA).");

  let categoryId = str(fd, "category_id");
  const newCat = str(fd, "new_category");
  if (newCat) {
    const { data: c } = await db.from("course_categories")
      .upsert({ name: newCat, slug: slugify(newCat) }, { onConflict: "slug" }).select("id").single();
    categoryId = c?.id ?? categoryId;
  }

  const img = await uploadPublicImage(db, fd, "image", "courses");
  if (img.error) return fail(img.error);

  const row = {
    name, slug: slugify(str(fd, "slug") ?? name), category_id: categoryId,
    short_description: str(fd, "short_description"), description: str(fd, "description"),
    objectives: lines(fd, "objectives"), skills: lines(fd, "skills"), syllabus: lines(fd, "syllabus"),
    target_audience: str(fd, "target_audience"), prerequisites: str(fd, "prerequisites"),
    duration_days: num(fd, "duration_days"), modality: str(fd, "modality"), trainer_id: str(fd, "trainer_id"),
    certification: bool(fd, "certification"), price, currency, quote_only: bool(fd, "quote_only"),
    featured: bool(fd, "featured"), status: str(fd, "status") ?? "draft",
    ...(img.url ? { image_path: img.url } : {}),
  };

  if (id === "nova") {
    const { data, error } = await db.from("courses").insert(row).select("id").single();
    if (error) return fail(error.message.includes("duplicate") ? "Já existe uma formação com este endereço." : "Sem permissão ou dados inválidos.");
    revalidatePath("/formacoes");
    redirect(`/admin/formacoes/${data.id}`);
  }
  const { error } = await db.from("courses").update(row).eq("id", id);
  if (error) return fail("Sem permissão ou dados inválidos.");
  revalidatePath("/formacoes");
  return done();
}

export async function deleteCourse(id: string): Promise<void> {
  const { db } = await requireModule("formacoes");
  await db.from("courses").delete().eq("id", id);
  revalidatePath("/formacoes");
  redirect("/admin/formacoes");
}

export async function addCohort(courseId: string, _p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("formacoes");
  const name = str(fd, "name"), starts = str(fd, "starts_on"), cap = num(fd, "capacity");
  if (!name || !starts || cap == null || cap < 0) return fail("Nome, data de início e vagas são obrigatórios.");
  const { error } = await db.from("cohorts").insert({
    course_id: courseId, name, starts_on: starts, ends_on: str(fd, "ends_on"), schedule: str(fd, "schedule"),
    location: str(fd, "location"), capacity: cap, status: str(fd, "status") ?? "published",
  });
  if (error) return fail("Sem permissão ou datas inválidas.");
  revalidatePath(`/admin/formacoes/${courseId}`);
  return done("Turma criada.");
}

export async function deleteCohort(courseId: string, cohortId: string): Promise<void> {
  const { db } = await requireModule("formacoes");
  await db.from("cohorts").delete().eq("id", cohortId);
  revalidatePath(`/admin/formacoes/${courseId}`);
}
