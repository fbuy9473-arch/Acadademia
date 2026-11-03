import { supabaseConfigured, createClient } from "@/lib/supabase/server";

type Db = Awaited<ReturnType<typeof createClient>>;
type Row = any;

/** Leitura tolerante: sem base de dados ligada devolve null em vez de rebentar a página. */
async function safe(fn: (db: Db) => PromiseLike<{ data: Row; error: unknown }>): Promise<Row> {
  if (!supabaseConfigured) return null;
  try {
    const { data, error } = await fn(await createClient());
    return error ? null : data;
  } catch {
    return null;
  }
}

export async function getSetting<T = Record<string, unknown>>(key: string): Promise<T | null> {
  const r = await safe((db) => db.from("site_settings").select("value").eq("key", key).maybeSingle());
  return (r?.value as T) ?? null;
}

export const getPlans = () =>
  safe((db) =>
    db.from("training_plans").select("*, plan_benefits(id,text,position)")
      .eq("status", "published").order("position"),
  );

export const getCurrentEdition = () =>
  safe((db) =>
    db.from("event_editions").select("*, ticket_types(*), event_sessions(*), event_audiences(*)")
      .eq("is_current", true).eq("status", "published").maybeSingle(),
  );

export const getCourses = () =>
  safe((db) =>
    db.from("courses").select("*, course_categories(name,slug)")
      .in("status", ["published", "open", "full"]).order("featured", { ascending: false }),
  );

export const getSocialProof = () =>
  safe((db) => db.from("social_proof").select("*").eq("visible", true).order("position"));

export const getTestimonials = () =>
  safe((db) => db.from("testimonials").select("id,author,role,body,rating,photo_path").eq("status", "published").order("position").limit(8));
