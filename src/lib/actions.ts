import "server-only";

export type Result = { ok?: boolean; message?: string } | null;

export const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
};
export const num = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (v == null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
export const bool = (fd: FormData, k: string) => fd.get(k) === "on";
export const lines = (fd: FormData, k: string) =>
  (str(fd, k) ?? "").split("\n").map((l) => l.trim()).filter(Boolean);

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** datetime-local (hora de Luanda, UTC+1) -> ISO */
export const luandaToIso = (v: string | null) => (v ? new Date(`${v}:00+01:00`).toISOString() : null);
export const isoToLuanda = (iso?: string | null) =>
  iso ? new Date(new Date(iso).getTime() + 3_600_000).toISOString().slice(0, 16) : "";

export const fail = (message: string): Result => ({ ok: false, message });
export const done = (message = "Guardado."): Result => ({ ok: true, message });

import { randomUUID } from "node:crypto";
import { validateImage } from "@/lib/security";

/** Carrega uma imagem para o armazenamento público com a sessão do utilizador e devolve o caminho público no site. */
export async function uploadPublicImage(
  db: { storage: { from: (b: string) => any } }, fd: FormData, field: string, folder: string,
): Promise<{ url?: string; error?: string }> {
  const f = fd.get(field);
  if (!(f instanceof File) || f.size === 0) return {};
  const v = await validateImage(f);
  if (!v.ok) return { error: v.error };
  const path = `${folder}/${randomUUID()}.${v.ext}`;
  const { error } = await db.storage.from("public-media").upload(path, f, { contentType: v.mime });
  if (error) return { error: "Falha no upload da imagem" };
  // caminho do próprio site (ver src/app/media), nunca o endereço direto do armazenamento
  return { url: `/media/public-media/${path}` };
}
