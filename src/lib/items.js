import { supabase } from "./supabase";

function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    sourceId: row.source_id,
    tagIds: row.tag_ids || [],
    description: row.description,
    hashtags: row.hashtags || [],
    prixAchat: row.prix_achat ?? "",
    prixAffiche: row.prix_affiche ?? "",
    prixRecommande: row.prix_recommande ?? "",
    prixNote: row.prix_note || "",
    prixVente: (row.prix_vente != null && !isNaN(row.prix_vente)) ? String(row.prix_vente) : "",
    statut: row.statut,
    plateformes: row.plateformes || [],
    categorie: row.categorie,
    image: row.image,
    commissionPct: row.commission_pct ?? 0,
    montantAReverser: row.montant_a_reverser ?? "",
    reversePaye: row.reverse_paye ?? false,
    dateReversement: row.date_reversement,
    createdAt: row.created_at,
    acquiredAt: row.acquired_at,
    venduAt: row.vendu_at,
    malleId: row.malle_id || null,
  };
}

// `sourceType` ('personnel' | 'depot_vente') doit être fourni par l'appelant
// (déjà connu côté UI via l'objet source sélectionné) pour calculer le
// montant à reverser sans aller-retour DB supplémentaire.
function toNum(v) {
  if (v === "" || v == null) return null;
  const n = Number(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

function toRow(item, userId, sourceType) {
  const prixVente = toNum(item.prixVente);
  const commissionPct = item.commissionPct ?? 0;
  // Les malles fonctionnent comme du dépôt-vente : on calcule ce qui est à
  // reverser à la personne. commissionPct sur la malle = % qu'on GARDE (0 = on
  // reverse tout, 20 = on garde 20% pour ses frais).
  const malleCommissionPct = item.malleCommissionPct ?? 0;
  const montantAReverser =
    prixVente != null && (sourceType === "depot_vente" || !!item.malleId)
      ? Math.round(prixVente * (1 - (item.malleId ? malleCommissionPct : commissionPct) / 100) * 100) / 100
      : null;
  const statut = item.statut || "en-attente";
  // Horodate le passage en "vendu" pour pouvoir calculer un temps de vente
  // moyen plus tard — posé une seule fois, conservé si déjà présent.
  const venduAt = statut === "vendu" ? (item.venduAt || new Date().toISOString()) : null;

  return {
    user_id: userId,
    name: item.name,
    source: item.source,
    source_id: item.sourceId ?? null,
    tag_ids: item.tagIds || [],
    description: item.description,
    hashtags: item.hashtags || [],
    prix_achat: toNum(item.prixAchat),
    prix_affiche: toNum(item.prixAffiche),
    prix_recommande: toNum(item.prixRecommande),
    prix_note: item.prixNote || null,
    prix_vente: prixVente,
    statut,
    plateformes: item.plateformes || [],
    categorie: item.categorie,
    image: item.image || null,
    commission_pct: commissionPct,
    montant_a_reverser: montantAReverser,
    reverse_paye: item.reversePaye ?? false,
    date_reversement: item.dateReversement || null,
    acquired_at: item.acquiredAt || null,
    vendu_at: venduAt,
    malle_id: item.malleId || null,
  };
}

export async function listItems(userId) {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function createItem(item, userId, sourceType) {
  const { data, error } = await supabase
    .from("items")
    .insert(toRow(item, userId, sourceType))
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateItem(item, userId, sourceType) {
  const { data, error } = await supabase
    .from("items")
    .update(toRow(item, userId, sourceType))
    .eq("id", item.id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function deleteItem(id, userId) {
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function markReverse(itemId, userId, date) {
  const { data, error } = await supabase
    .from("items")
    .update({ reverse_paye: true, date_reversement: date })
    .eq("id", itemId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function markAllReverseForMalle(malleId, userId, date) {
  const { data, error } = await supabase
    .from("items")
    .update({ reverse_paye: true, date_reversement: date })
    .eq("malle_id", malleId)
    .eq("user_id", userId)
    .eq("statut", "vendu")
    .eq("reverse_paye", false)
    .select();
  if (error) throw error;
  return data.map(fromRow);
}

export async function markAllReverseForSource(sourceId, userId, date) {
  const { data, error } = await supabase
    .from("items")
    .update({ reverse_paye: true, date_reversement: date })
    .eq("source_id", sourceId)
    .eq("user_id", userId)
    .eq("statut", "vendu")
    .eq("reverse_paye", false)
    .select();
  if (error) throw error;
  return data.map(fromRow);
}
