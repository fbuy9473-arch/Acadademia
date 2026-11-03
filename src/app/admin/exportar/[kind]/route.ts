import { NextResponse } from "next/server";
import { canAccess, getSession } from "@/lib/auth";

const esc = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // evita injeção de fórmulas em folhas de cálculo
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const s = await getSession();
  const { kind } = await params;
  if (!s) return new NextResponse("Não autenticado", { status: 401 });

  let header: string[] = [], rows: unknown[][] = [];
  if (kind === "pagamentos" && canAccess(s.role, "pagamentos")) {
    const { data } = await s.db.from("payments").select("created_at,amount,currency,status,method,reference,confirmed_at,registrations(code)").order("created_at", { ascending: false });
    header = ["Criado", "Valor", "Moeda", "Estado", "Método", "Referência", "Confirmado em", "Inscrição"];
    rows = (data ?? []).map((p: any) => [p.created_at, p.amount, p.currency, p.status, p.method, p.reference, p.confirmed_at, p.registrations?.code]);
  } else if (kind === "inscricoes" && canAccess(s.role, "inscricoes")) {
    const { data } = await s.db.from("registrations").select("code,status,amount,currency,created_at,participants(full_name,email,phone)").order("created_at", { ascending: false });
    header = ["Código", "Estado", "Valor", "Moeda", "Criada", "Nome", "E-mail", "Telefone"];
    rows = (data ?? []).map((r: any) => [r.code, r.status, r.amount, r.currency, r.created_at, r.participants?.full_name, r.participants?.email, r.participants?.phone]);
  } else return new NextResponse("Sem permissão", { status: 403 });

  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  return new NextResponse("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${kind}.csv"` } });
}
