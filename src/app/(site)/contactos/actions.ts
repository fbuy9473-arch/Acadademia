"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/server";
import { notifyInternal } from "@/lib/notify";
import { rateLimit } from "@/lib/security";
import type { FormState } from "../inscricao/actions";

const schema = z.object({
  name: z.string().trim().min(3, "Indique o nome").max(120),
  email: z.email("E-mail inválido").max(160),
  phone: z.string().trim().min(7, "Contacto inválido").max(30),
  whatsapp: z.string().trim().max(30).optional(),
  company_name: z.string().trim().max(160).optional(),
  nif: z.string().trim().max(30).optional(),
  participants: z.string().trim().max(10).optional(),
  subject: z.enum(["geral", "turma", "personalizado", "edicao_especial", "mentoria", "corporativo", "summit"]).default("geral"),
  message: z.string().trim().max(2000).optional(),
  consent: z.literal("on", { error: "É necessário consentir o tratamento de dados" }),
  website: z.string().max(0).optional(),
});

export async function submitLead(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!supabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { message: "O formulário ainda não está ativo. Tente novamente mais tarde." };
  }
  if (!(await rateLimit("lead", 5))) return { message: "Demasiadas tentativas. Aguarde alguns minutos." };
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: "Verifique os campos assinalados." };
  const v = parsed.data;
  if (v.website) return { ok: true, message: "Mensagem enviada." };

  const db = createAdminClient();
  const { data: stage } = await db.from("pipeline_stages").select("id").order("position").limit(1).maybeSingle();
  const planKind = ["turma", "personalizado", "edicao_especial", "mentoria", "corporativo"].includes(v.subject) ? v.subject : null;

  const { error } = await db.from("leads").insert({
    name: v.name, email: v.email.toLowerCase(), phone: v.phone, whatsapp: v.whatsapp || null,
    company_name: v.company_name || null, source: "website", plan_kind: planKind, stage_id: stage?.id ?? null,
    message: v.message || null, consent: true,
    extra: { nif: v.nif || null, participants: v.participants || null, subject: v.subject },
  });
  if (error) return { message: "Não foi possível enviar. Tente novamente." };

  await notifyInternal(v.subject === "corporativo" || planKind === "personalizado" ? "new_quote" : "new_lead", { name: v.name, subject: v.subject });
  return { ok: true, message: "Mensagem recebida. A nossa equipa entrará em contacto." };
}
