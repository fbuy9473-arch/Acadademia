import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type Kind =
  | "new_registration" | "new_lead" | "new_quote" | "missing_document" | "payment_pending"
  | "payment_confirmed" | "registration_approved" | "cohort_date_changed" | "event_approaching"
  | "contract_pending" | "new_corporate_registration";

/** Aviso interno para o painel. Fica sempre registado, independentemente de e-mail/WhatsApp. */
export async function notifyInternal(kind: Kind, payload: Record<string, unknown>) {
  try {
    await createAdminClient().from("notifications").insert({ kind, channel: "internal", payload, status: "sent", sent_at: new Date().toISOString() });
  } catch (e) {
    console.error("notifyInternal falhou", e);
  }
}

/**
 * Envia e-mail via Resend. O estado só é "sent" quando o fornecedor responde 2xx;
 * sem chave configurada fica "skipped", nunca "sent".
 */
export async function sendEmail(to: string, subject: string, text: string, kind: Kind) {
  const db = createAdminClient();
  const { data: row } = await db
    .from("notifications").insert({ kind, channel: "email", recipient: to, payload: { subject, text }, status: "queued" })
    .select("id").single();
  const finish = (patch: Record<string, unknown>) =>
    row ? db.from("notifications").update({ ...patch, attempts: 1 }).eq("id", row.id) : Promise.resolve();

  const key = process.env.RESEND_API_KEY;
  if (!key) return finish({ status: "skipped", error: "Envio de e-mail ainda não ativado" });
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? "Academia Tchamile <onboarding@resend.dev>", to, subject, text }),
    });
    const body = await res.text();
    return finish(res.ok
      ? { status: "sent", sent_at: new Date().toISOString(), provider_response: body.slice(0, 500) }
      : { status: "failed", error: "O envio falhou", provider_response: body.slice(0, 500) });
  } catch (e) {
    return finish({ status: "failed", error: "O envio falhou" });
  }
}
