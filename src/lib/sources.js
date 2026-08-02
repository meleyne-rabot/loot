import { supabase } from "./supabase";

function fromRow(row) {
  return {
    id: row.id,
    nom: row.name,
    type: row.type,
    commissionPct: row.commission_pct ?? 0,
    displayOrder: row.display_order ?? 0,
  };
}

export async function listSources(userId) {
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("user_id", userId)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data.map(fromRow);
}

export async function createSource(nom, userId, { type = "personnel", commissionPct = 0 } = {}) {
  const { data: existing } = await supabase
    .from("sources")
    .select("display_order")
    .eq("user_id", userId)
    .order("display_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;
  const { data, error } = await supabase
    .from("sources")
    .insert({ name: nom, user_id: userId, type, commission_pct: commissionPct, display_order: nextOrder })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

// Échange l'ordre d'affichage de deux sources (déplacement haut/bas dans
// les Réglages — celles les plus utilisées peuvent être mises en premier).
export async function swapSourceOrder(a, b, userId) {
  await supabase.from("sources").update({ display_order: b.displayOrder }).eq("id", a.id).eq("user_id", userId);
  await supabase.from("sources").update({ display_order: a.displayOrder }).eq("id", b.id).eq("user_id", userId);
}

export async function updateSource(id, userId, { nom, type, commissionPct }) {
  const patch = {};
  if (nom !== undefined) patch.name = nom;
  if (type !== undefined) patch.type = type;
  if (commissionPct !== undefined) patch.commission_pct = commissionPct;
  const { data, error } = await supabase
    .from("sources")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

function isRestrictError(error) {
  return error?.code === "23503";
}

// Supprime la source ; si des items y sont liés, lève une erreur avec
// code "RESTRICTED" pour que l'UI propose la réassignation forcée.
export async function deleteSource(id, userId) {
  const { error } = await supabase.from("sources").delete().eq("id", id).eq("user_id", userId);
  if (error) {
    if (isRestrictError(error)) {
      const e = new Error("Cette source est utilisée par des articles.");
      e.code = "RESTRICTED";
      throw e;
    }
    throw error;
  }
}

// Retourne la source "Mon placard" de l'utilisatrice, en la créant si elle
// n'existe pas encore. Utilisée comme source par défaut dans le Générateur.
export async function findOrCreateMonPlacard(userId) {
  const { data } = await supabase
    .from("sources")
    .select("*")
    .eq("user_id", userId)
    .ilike("name", "mon placard")
    .limit(1);
  if (data?.length) return fromRow(data[0]);
  return createSource("Mon placard", userId, { type: "personnel" });
}

// Réassigne tous les items de `id` vers `fallbackId` (ou null = vider),
// puis supprime la source.
export async function forceDeleteSource(id, fallbackId, userId) {
  const patch = fallbackId
    ? { source_id: fallbackId }
    : { source_id: null, source: "" };
  const { error: reassignError } = await supabase
    .from("items")
    .update(patch)
    .eq("source_id", id)
    .eq("user_id", userId);
  if (reassignError) throw reassignError;

  const { error } = await supabase.from("sources").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
