"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/server";
import { notifyInternal } from "@/lib/notify";
import { rateLimit } from "@/lib/security";
import { MAX_SCORE } from "@/lib/quiz";
import type { FormState } from "../inscricao/actions";

const schema = z.object({
  name: z.string().trim().min(3, "Indique o nome").max(120),
  email: z.email("E-mail inválido").max(160),
  phone: z.string().trim().min(7, "Contacto inválido").max(30),
  score: z.coerce.number().int().min(0).max(MAX_SCORE),
  level: z.enum(["inicial", "intermedio", "avancado"]),
  plan: z.enum(["turma", "personalizado", "mentoria"]),
  dims: z.string().max(400).optional(),
  consent: z.literal("on", { error: "É necessário consentir o tratamento de dados" }),
  website: z.string().max(0).optional(),
});

/** Guarda o resultado do teste como lead no CRM, para a equipa entrar em contacto. */
export async function saveQuizResult(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!supabaseConfigured || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { message: "O envio ainda não está ativo. Tente novamente mais tarde." };
  }
  if (!(await rateLimit("quiz", 5))) return { message: "Demasiadas tentativas. Aguarde alguns minutos." };
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors, message: "Verifique os campos assinalados." };
  const v = parsed.data;
  if (v.website) return { ok: true, message: "Resultado guardado." };

  const db = createAdminClient();
  const { data: stage } = await db.from("pipeline_stages").select("id").order("position").limit(1).maybeSingle();
  const { error } = await db.from("leads").insert({
    name: v.name, email: v.email.toLowerCase(), phone: v.phone, source: "teste-comunicacao",
    plan_kind: v.plan, stage_id: stage?.id ?? null, consent: true,
    message: `Teste de nível de comunicação: ${v.score}/${MAX_SCORE} (${v.level}).`,
    extra: { quiz: { score: v.score, max: MAX_SCORE, level: v.level, dims: v.dims ?? null } },
  });
  if (error) return { message: "Não foi possível guardar. Tente novamente." };

  await notifyInternal("new_lead", { name: v.name, subject: "teste-comunicacao", score: `${v.score}/${MAX_SCORE}` });
  return { ok: true, message: "Resultado guardado. A nossa equipa entrará em contacto." };
}
