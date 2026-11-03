"use server";

import { revalidatePath } from "next/cache";
import { requireModule } from "@/lib/auth";
import { bool, done, fail, lines, num, str, uploadPublicImage, type Result } from "@/lib/actions";
import { safeUrl } from "@/lib/sections";
import { youtubeId } from "@/lib/video";

const refresh = () => revalidatePath("/", "layout");

async function setSetting(key: string, value: unknown): Promise<Result> {
  const { db } = await requireModule("conteudos");
  const { error } = await db.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) return fail("Sem permissão ou dados inválidos.");
  refresh();
  return done();
}

const link = (fd: FormData, k: string) => {
  const v = str(fd, k) ?? "";
  return safeUrl.safeParse(v).success ? v : null;
};

export async function saveHero(_p: Result, fd: FormData): Promise<Result> {
  const links = [link(fd, "cta1_href"), link(fd, "cta2_href")];
  if (links.includes(null)) return fail("Ligação inválida (use https:// ou caminho interno).");
  const video = str(fd, "video_url") ?? "";
  if (video && !safeUrl.safeParse(video).success) return fail("Ligação do vídeo inválida.");
  return setSetting("hero", {
    video_url: video,
    eyebrow: str(fd, "eyebrow") ?? "", title: str(fd, "title") ?? "", subtitle: str(fd, "subtitle") ?? "",
    cta_primary: { label: str(fd, "cta1_label") ?? "", href: links[0] },
    cta_secondary: { label: str(fd, "cta2_label") ?? "", href: links[1] },
  });
}

export async function saveContacts(_p: Result, fd: FormData): Promise<Result> {
  const socials: Record<string, string> = {};
  for (const k of ["facebook", "instagram", "linkedin", "youtube"]) {
    const v = str(fd, k) ?? "";
    if (!v) continue;
    if (!v.startsWith("https://") || !safeUrl.safeParse(v).success) return fail(`Ligação inválida em ${k} (use https://).`);
    socials[k] = v;
  }
  return setSetting("contacts", { email: str(fd, "email") ?? "", phone: str(fd, "phone") ?? "", whatsapp: str(fd, "whatsapp") ?? "", address: str(fd, "address") ?? "", socials });
}

export async function saveAbout(_p: Result, fd: FormData): Promise<Result> {
  return setSetting("about", {
    history: str(fd, "history"), origin: str(fd, "origin"), mission: str(fd, "mission"), vision: str(fd, "vision"),
    methodology: str(fd, "methodology"), impact: str(fd, "impact"), values: lines(fd, "values"), objectives: lines(fd, "objectives"),
    differentials: lines(fd, "differentials"), specialties: lines(fd, "specialties"),
  });
}

export async function saveLegal(_p: Result, fd: FormData): Promise<Result> {
  return setSetting("legal", { privacy: str(fd, "privacy"), terms: str(fd, "terms") });
}

export async function addProof(_p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("conteudos");
  const label = str(fd, "label"), value = str(fd, "value");
  if (!label || !value) return fail("Indicador e valor são obrigatórios.");
  const { error } = await db.from("social_proof").insert({ label, value, position: num(fd, "position") ?? 0 });
  if (error) return fail("Sem permissão.");
  refresh(); revalidatePath("/admin/conteudos");
  return done("Indicador adicionado.");
}

export async function addTestimonial(_p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("conteudos");
  const author = str(fd, "author"), body = str(fd, "body");
  if (!author || !body) return fail("Autor e texto são obrigatórios.");
  const rating = num(fd, "rating");
  if (rating != null && (rating < 1 || rating > 5)) return fail("A avaliação deve ir de 1 a 5.");
  const img = await uploadPublicImage(db, fd, "photo", "testimonials");
  if (img.error) return fail(img.error);
  const { error } = await db.from("testimonials").insert({ author, role: str(fd, "role"), body, rating, photo_path: img.url ?? null, status: bool(fd, "published") ? "published" : "draft" });
  if (error) return fail("Sem permissão.");
  refresh(); revalidatePath("/admin/conteudos");
  return done("Testemunho adicionado.");
}

/** Os três pacotes principais do Início; o do meio aparece em destaque. */
export async function saveHomePlans(_p: Result, fd: FormData): Promise<Result> {
  const kinds = ["slot1", "slot2", "slot3"].map((k) => str(fd, k) ?? "");
  if (kinds.some((k) => !k)) return fail("Escolha os três pacotes.");
  if (new Set(kinds).size !== 3) return fail("Os três pacotes têm de ser diferentes.");
  return setSetting("home_plans", { kinds });
}

export async function saveHighlights(_p: Result, fd: FormData): Promise<Result> {
  return setSetting("summit_highlights", { items: lines(fd, "highlights").slice(0, 5) });
}

type VideoItem = { id?: string; title: string; label?: string; url: string };

async function readVideos(db: Awaited<ReturnType<typeof requireModule>>["db"]): Promise<VideoItem[]> {
  const { data } = await db.from("site_settings").select("value").eq("key", "videos").maybeSingle();
  return ((data?.value as { items?: VideoItem[] } | null)?.items ?? []);
}

export async function addVideo(_p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("conteudos");
  const title = str(fd, "title"), url = str(fd, "url");
  if (!title || !url) return fail("Título e ligação são obrigatórios.");
  if (!youtubeId(url)) return fail("Use uma ligação do YouTube (youtube.com/watch?v=… ou youtu.be/…).");
  const items = await readVideos(db);
  items.push({ id: crypto.randomUUID(), title, label: str(fd, "label") ?? "", url });
  return setSetting("videos", { items });
}

export async function removeVideo(key: string): Promise<void> {
  const { db } = await requireModule("conteudos");
  const items = (await readVideos(db)).filter((v) => (v.id ?? v.url) !== key);
  await setSetting("videos", { items });
  revalidatePath("/admin/conteudos");
}

export async function addFaq(_p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("conteudos");
  const question = str(fd, "question"), answer = str(fd, "answer");
  if (!question || !answer) return fail("Pergunta e resposta são obrigatórias.");
  const { error } = await db.from("faqs").insert({ question, answer, position: num(fd, "position") ?? 0 });
  if (error) return fail("Sem permissão.");
  refresh(); revalidatePath("/admin/conteudos");
  return done("Pergunta adicionada.");
}

export async function addMember(_p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("conteudos");
  const name = str(fd, "name");
  if (!name) return fail("O nome é obrigatório.");
  const img = await uploadPublicImage(db, fd, "photo", "team");
  if (img.error) return fail(img.error);
  const { error } = await db.from("team_members").insert({
    name, job_title: str(fd, "job_title"), bio: str(fd, "bio"), specialization: str(fd, "specialization"),
    is_trainer: bool(fd, "is_trainer"), photo_path: img.url ?? null,
  });
  if (error) return fail("Sem permissão.");
  refresh(); revalidatePath("/admin/conteudos");
  return done("Membro adicionado.");
}

export async function addBanner(_p: Result, fd: FormData): Promise<Result> {
  const { db } = await requireModule("conteudos");
  const message = str(fd, "message");
  if (!message) return fail("A mensagem é obrigatória.");
  const href = link(fd, "link_url");
  if (href === null) return fail("Ligação inválida.");
  const { error } = await db.from("banners").insert({ message, link_url: href || null, active: true });
  if (error) return fail("Sem permissão.");
  refresh(); revalidatePath("/admin/conteudos");
  return done("Aviso publicado.");
}

const tables = ["social_proof", "testimonials", "faqs", "team_members", "banners"] as const;
export async function removeRow(table: (typeof tables)[number], id: string): Promise<void> {
  const { db } = await requireModule("conteudos");
  if (!tables.includes(table)) return;
  await db.from(table).delete().eq("id", id);
  refresh(); revalidatePath("/admin/conteudos");
}
