import "server-only";
import { headers } from "next/headers";

const hits = new Map<string, number[]>();

/**
 * Limitador em memória (por instância). Suficiente para travar abuso simples;
 * em produção multi-instância substituir por Redis/Upstash.
 */
export async function rateLimit(bucket: string, max = 5, windowMs = 10 * 60_000) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length <= max;
}

const MAX_BYTES = 5 * 1024 * 1024;
const SIGNATURES: { mime: string; ext: string; magic: number[] }[] = [
  { mime: "application/pdf", ext: "pdf", magic: [0x25, 0x50, 0x44, 0x46] },
  { mime: "image/jpeg", ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  { mime: "image/png", ext: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
];

/** Valida tamanho e o tipo REAL (assinatura dos primeiros bytes), não só a extensão. */
export async function validateUpload(file: File) {
  if (file.size === 0) return { ok: false as const, error: "Ficheiro vazio" };
  if (file.size > MAX_BYTES) return { ok: false as const, error: "Ficheiro acima de 5 MB" };
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const sig = SIGNATURES.find((s) => s.magic.every((b, i) => head[i] === b));
  if (!sig) return { ok: false as const, error: "Formato inválido (apenas PDF, JPG ou PNG)" };
  return { ok: true as const, mime: sig.mime, ext: sig.ext };
}

const IMG: { mime: string; ext: string; magic: number[] }[] = [
  { mime: "image/jpeg", ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  { mime: "image/png", ext: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", ext: "webp", magic: [0x52, 0x49, 0x46, 0x46] },
];

/** Imagens públicas do CMS (sem SVG: pode conter scripts). Máx. 8 MB. */
export async function validateImage(file: File) {
  if (file.size === 0 || file.size > 8 * 1024 * 1024) return { ok: false as const, error: "Imagem vazia ou acima de 8 MB" };
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const sig = IMG.find((s) => s.magic.every((b, i) => head[i] === b));
  return sig ? { ok: true as const, mime: sig.mime, ext: sig.ext } : { ok: false as const, error: "Apenas JPG, PNG ou WebP" };
}
