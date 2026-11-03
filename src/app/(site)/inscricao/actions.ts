"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/server";
import { notifyInternal, sendEmail } from "@/lib/notify";
import { rateLimit, validateUpload } from "@/lib/security";

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string[] | undefined> } | null;

const base = z.object({
  target: z.enum(["ticket", "course", "plan"]),
  key: z.string().min(1),
  full_name: z.string().trim().min(3, "Indique o nome completo").max(120),
  phone: z.string().trim().min(7, "Contacto inválido").max(30),
  whatsapp: z.string().trim().max(30).optional(),
  email: z.email("E-mail inválido").max(160),
  id_number: z.string().trim().max(40).optional(),
  consent: z.literal("on", { error: "É necessário consentir o tratamento de dados" }),
  terms: z.literal("on", { error: "É necessário aceitar os termos" }),
  website: z.string().max(0).optional(), // honeypot
  company_name: z.string().trim().max(160).optional(),
  nif: z.string().trim().max(30).optional(),
});

export async function submitRegistration(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!supabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { message: "As inscrições ainda não estão ativas. Tente novamente mais tarde." };
  }
  if (!(await rateLimit("registration", 5))) return { message: "Demasiadas tentativas. Aguarde alguns minutos." };

  const parsed = base.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: "Verifique os campos assinalados." };
  const v = parsed.data;
  if (v.website) return { ok: true, message: "Recebido." }; // bot: resposta neutra, nada gravado

  const db = createAdminClient();

  // Resolver o alvo da inscrição no servidor (nunca confiar em preços/IDs do cliente)
  let target: { ticket_type_id?: string; edition_id?: string; course_id?: string; plan_id?: string; amount: number | null; currency: string | null; kind?: string; vip?: number } =
    { amount: null, currency: null };

  if (v.target === "ticket") {
    const { data: ed } = await db.from("event_editions").select("id,currency,registrations_open").eq("is_current", true).eq("status", "published").maybeSingle();
    if (!ed?.registrations_open) return { message: "As inscrições para o evento não estão abertas." };
    const { data: t } = await db.from("ticket_types").select("*").eq("edition_id", ed.id).eq("kind", v.key).eq("active", true).maybeSingle();
    if (!t) return { message: "Categoria de ingresso indisponível." };
    const now = new Date();
    if ((t.sales_start && new Date(t.sales_start) > now) || (t.sales_end && new Date(t.sales_end) < now)) {
      return { message: "As vendas desta categoria não estão abertas neste momento." };
    }
    const promo = t.promo_price != null && (!t.promo_ends_at || new Date(t.promo_ends_at) > now);
    target = {
      ticket_type_id: t.id, edition_id: ed.id, kind: t.kind, vip: t.includes_vip_tickets,
      amount: t.price_published ? Number(promo ? t.promo_price : t.price) : null,
      currency: t.price_published ? ed.currency : null,
    };
  } else if (v.target === "course") {
    const { data: c } = await db.from("courses").select("id,price,currency,status,quote_only").eq("id", v.key).maybeSingle();
    if (!c || c.status !== "open") return { message: "Esta formação não tem inscrições abertas." };
    target = { course_id: c.id, amount: c.quote_only ? null : c.price, currency: c.currency };
  } else {
    const { data: p } = await db.from("training_plans").select("id,price,currency,price_published,cta_mode").eq("kind", v.key).eq("status", "published").maybeSingle();
    if (!p || p.cta_mode === "proposal") return { message: "Este programa requer um pedido de proposta." };
    target = { plan_id: p.id, amount: p.price_published ? p.price : null, currency: p.currency };
  }

  const isCorporate = target.kind === "corporativo";
  if (isCorporate && (!v.company_name || !v.nif)) {
    return { errors: { company_name: ["Obrigatório"], nif: ["Obrigatório"] }, message: "Indique a empresa e o NIF." };
  }

  // Validar ficheiros ANTES de gravar qualquer coisa
  const uploads: { kind: "bi" | "payment_proof"; file: File; mime: string; ext: string }[] = [];
  for (const [field, kind] of [["bi_file", "bi"], ["proof_file", "payment_proof"]] as const) {
    const f = fd.get(field);
    if (f instanceof File && f.size > 0) {
      const check = await validateUpload(f);
      if (!check.ok) return { errors: { [field]: [check.error] }, message: "Ficheiro inválido." };
      uploads.push({ kind, file: f, mime: check.mime, ext: check.ext });
    }
  }
  const needsBi = v.target === "ticket";
  if (needsBi && !uploads.some((u) => u.kind === "bi")) {
    return { errors: { bi_file: ["Anexe a cópia do B.I."] }, message: "Falta o documento de identificação." };
  }

  const now = new Date().toISOString();
  const { data: participant, error: pErr } = await db.from("participants").insert({
    full_name: v.full_name, phone: v.phone, whatsapp: v.whatsapp || null, email: v.email.toLowerCase(),
    id_number: v.id_number || null, consent_at: now,
  }).select("id").single();
  if (pErr || !participant) return { message: "Não foi possível guardar a inscrição. Tente novamente." };

  let companyId: string | undefined;
  if (isCorporate) {
    const { data: co } = await db.from("companies").insert({
      name: v.company_name, nif: v.nif, contact_name: v.full_name, contact_email: v.email.toLowerCase(), contact_phone: v.phone,
    }).select("id").single();
    companyId = co?.id;
  }

  const hasBi = uploads.some((u) => u.kind === "bi");
  const hasProof = uploads.some((u) => u.kind === "payment_proof");
  const status = needsBi && !hasBi ? "pending_documents" : hasProof ? "in_validation" : target.amount != null || needsBi ? "pending_payment" : "in_validation";

  const { data: reg, error: rErr } = await db.from("registrations").insert({
    participant_id: participant.id, company_id: companyId ?? null,
    course_id: target.course_id ?? null, plan_id: target.plan_id ?? null,
    ticket_type_id: target.ticket_type_id ?? null, edition_id: target.edition_id ?? null,
    status, amount: target.amount, currency: target.currency, terms_accepted_at: now,
  }).select("id, code, access_token").single();
  if (rErr || !reg) {
    await db.from("participants").delete().eq("id", participant.id);
    return { message: rErr?.message.includes("esgotados") ? "Ingressos esgotados para esta categoria." : "Não foi possível guardar a inscrição." };
  }

  for (const u of uploads) {
    const path = `registrations/${reg.id}/${u.kind}-${randomUUID()}.${u.ext}`;
    const { error } = await db.storage.from("private-docs").upload(path, u.file, { contentType: u.mime, upsert: false });
    if (!error) {
      await db.from("documents").insert({
        registration_id: reg.id, kind: u.kind, storage_path: path,
        original_name: u.file.name.slice(0, 120), mime_type: u.mime, size_bytes: u.file.size,
      });
    } else {
      await notifyInternal("missing_document", { registration: reg.code, kind: u.kind, motivo: "Falha ao guardar o documento" });
    }
  }

  if (isCorporate && companyId) {
    await db.from("contracts").insert({
      company_id: companyId, registration_id: reg.id, ticket_type_id: target.ticket_type_id,
      amount: target.amount, currency: target.currency, vip_tickets_granted: target.vip ?? 0, status: "draft",
    });
  }

  await notifyInternal(isCorporate ? "new_corporate_registration" : "new_registration", { code: reg.code, name: v.full_name, status });
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await sendEmail(
    v.email,
    "Inscrição recebida na Academia Tchamile",
    `Olá ${v.full_name},\n\nRecebemos a sua inscrição (código ${reg.code}).\nConsulte o estado e os próximos passos em:\n${site}/inscricao/estado?codigo=${reg.code}&token=${reg.access_token}\n\nAcademia Tchamile`,
    "new_registration",
  );

  redirect(`/inscricao/estado?codigo=${reg.code}&token=${reg.access_token}`);
}
