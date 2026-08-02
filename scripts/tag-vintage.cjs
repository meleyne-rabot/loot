// Ajoute le tag "Vintage" à tous les articles dont le nom contient
// littéralement "vintage" (insensible à la casse). Ne touche pas aux
// articles déjà tagués "Vintage".
//
// Usage: node scripts/tag-vintage.cjs <email-utilisatrice>

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();
  const [, , email] = process.argv;
  if (!email) {
    console.error("Usage: node scripts/tag-vintage.cjs <email-utilisatrice>");
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;
  const user = usersPage.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`Aucun utilisateur trouvé pour ${email}`);
  const userId = user.id;

  let { data: vintageTag } = await supabase
    .from("categories").select("*").eq("user_id", userId).ilike("nom", "vintage").maybeSingle();
  if (!vintageTag) {
    const { data: created, error } = await supabase
      .from("categories").insert({ user_id: userId, nom: "Vintage" }).select().single();
    if (error) throw error;
    vintageTag = created;
    console.log("Tag 'Vintage' créé.");
  }

  const { data: items, error: itemsErr } = await supabase
    .from("items").select("id, name, tag_ids").eq("user_id", userId).ilike("name", "%vintage%");
  if (itemsErr) throw itemsErr;

  console.log(`${items.length} articles avec "vintage" dans le nom.`);

  let updated = 0;
  for (const item of items) {
    const tagIds = item.tag_ids || [];
    if (tagIds.includes(vintageTag.id)) continue;
    const { error } = await supabase
      .from("items").update({ tag_ids: [...tagIds, vintageTag.id] }).eq("id", item.id);
    if (error) throw error;
    updated++;
  }

  console.log(`${updated} articles tagués "Vintage".`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
