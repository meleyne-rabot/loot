import { supabase } from "./supabase";

function fromRow(row) {
  return {
    id: row.id, nom: row.nom, description: row.description || "",
    commissionPct: row.commission_pct ?? 0, phone: row.phone || "",
    detteMalle: row.dette_malle ?? 0,
    paypalMe: row.paypal_me || "",
    createdAt: row.created_at,
  };
}

export async function listMalles(userId) {
  const { data, error } = await supabase
    .from("malles")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(fromRow);
}

export async function createMalle(nom, userId, description = "", commissionPct = 0) {
  const { data, error } = await supabase
    .from("malles")
    .insert({ nom, description, user_id: userId, commission_pct: commissionPct })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateMalle(id, userId, patch) {
  const dbPatch = {};
  if ("nom" in patch) dbPatch.nom = patch.nom;
  if ("description" in patch) dbPatch.description = patch.description;
  if ("commissionPct" in patch) dbPatch.commission_pct = patch.commissionPct;
  if ("phone" in patch) dbPatch.phone = patch.phone;
  if ("paypalMe" in patch) dbPatch.paypal_me = patch.paypalMe;
  if ("commission_pct" in patch) dbPatch.commission_pct = patch.commission_pct;

  const { data, error } = await supabase
    .from("malles")
    .update(dbPatch)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function deleteMalle(id, userId) {
  const { error } = await supabase.from("malles").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function getOrCreateShareToken(id, userId) {
  const { data: existing } = await supabase
    .from("malles")
    .select("share_token")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (existing?.share_token) return existing.share_token;

  const token = crypto.randomUUID();
  const { error } = await supabase
    .from("malles")
    .update({ share_token: token })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
  return token;
}

export async function createReversement(malleId, userId, montant, methode, date, note = "") {
  const { data, error } = await supabase
    .from("reversements")
    .insert({ malle_id: malleId, user_id: userId, montant, methode, date, note: note || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listReversements(malleId, userId) {
  const { data, error } = await supabase
    .from("reversements")
    .select("*")
    .eq("malle_id", malleId)
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}
