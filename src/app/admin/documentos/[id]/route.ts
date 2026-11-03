import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** Documentos pessoais nunca têm ligação pública: gera-se um URL assinado de 60 s após verificar o papel. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s || !s.role || !["superadmin", "admin", "gestor_eventos", "financeiro"].includes(s.role)) {
    return new NextResponse("Sem permissão", { status: 403 });
  }
  const { id } = await params;
  // A leitura passa pela sessão do utilizador (RLS) para confirmar que o registo é acessível.
  const { data: doc } = await s.db.from("documents").select("storage_path").eq("id", id).maybeSingle();
  if (!doc) return new NextResponse("Não encontrado", { status: 404 });
  const { data, error } = await createAdminClient().storage.from("private-docs").createSignedUrl(doc.storage_path, 60);
  if (error || !data) return new NextResponse("Erro ao gerar ligação", { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}
