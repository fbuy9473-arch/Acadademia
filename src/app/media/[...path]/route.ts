// Serve as imagens públicas carregadas no painel a partir do próprio site.
// Devolve apenas o conteúdo e cabeçalhos seguros: nada do armazenamento de origem chega ao navegador.

const ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ALLOWED = /^public-media\/[A-Za-z0-9_\-/]+\.(jpe?g|png|webp)$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  if (!ORIGIN || !ALLOWED.test(path) || path.includes("..")) return new Response("Não encontrado", { status: 404 });

  const upstream = await fetch(`${ORIGIN}/storage/v1/object/public/${path}`).catch(() => null);
  if (!upstream || !upstream.ok || !upstream.body) return new Response("Não encontrado", { status: 404 });

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
