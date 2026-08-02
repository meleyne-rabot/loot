import { supabase } from "./supabase";

function fromRow(row) {
  return { id: row.id, nom: row.nom };
}

export async function listCategories(userId) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("nom", { ascending: true });
  if (error) throw error;
  return data.map(fromRow);
}

export async function createCategory(nom, userId) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ nom, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateCategory(id, userId, nom) {
  const { data, error } = await supabase
    .from("categories")
    .update({ nom })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
}

// Fait correspondre une catégorie texte suggérée par l'IA (ex: "vêtement",
// "jouet") à une catégorie réelle de l'utilisatrice (ex: "Vêtements"), en
// ignorant casse et pluriel. Fallback sur "Autre" si rien ne correspond.
export function matchCategoryByName(categories, name) {
  if (!name) return categories.find((c) => c.nom.toLowerCase() === "autre") || null;
  const norm = (s) => s.toLowerCase().trim().replace(/s$/, "");
  const target = norm(name);
  return (
    categories.find((c) => norm(c.nom) === target) ||
    categories.find((c) => c.nom.toLowerCase() === "autre") ||
    null
  );
}

// Retourne le tag "Vintage" existant, ou le crée s'il n'existe pas encore.
export async function findOrCreateVintage(categories, userId) {
  const existing = categories.find((c) => c.nom.toLowerCase() === "vintage");
  if (existing) return existing;
  return createCategory("Vintage", userId);
}

function isRestrictError(error) {
  return error?.code === "23503";
}

export async function deleteCategory(id, userId) {
  const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", userId);
  if (error) {
    if (isRestrictError(error)) {
      const e = new Error("Cette catégorie est utilisée par des articles.");
      e.code = "RESTRICTED";
      throw e;
    }
    throw error;
  }
}

export async function forceDeleteCategory(id, fallbackId, userId) {
  const { error: reassignError } = await supabase
    .from("items")
    .update({ category_id: fallbackId })
    .eq("category_id", id)
    .eq("user_id", userId);
  if (reassignError) throw reassignError;

  const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
