// Supprime les sources/catégories génériques auto-seedées (avant la
// migration 0007) pour les comptes beta qui n'ont pas encore d'articles —
// pour repartir avec une liste vide, comme prévu pour les nouveaux comptes.
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

const SEED_SOURCE_NAMES = ["Emmaüs", "Vide-Grenier", "Champigny", "Autre"];
const SEED_CATEGORY_NAMES = ["Jouets", "Vêtements", "Déco", "Livres", "Accessoires", "Autre"];

async function main() {
  loadEnvLocal();
  const [, , email] = process.argv;
  if (!email) {
    console.error("Usage: node scripts/cleanup-seed-sources.cjs <email>");
    process.exit(1);
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;
  const user = usersPage.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`Aucun utilisateur trouvé pour ${email}`);
  const userId = user.id;

  const { count: itemCount } = await supabase
    .from("items").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if (itemCount > 0) {
    console.log(`${email} a déjà ${itemCount} article(s), abandon (pas touché pour ne rien casser).`);
    return;
  }

  const { error: srcErr, count: srcCount } = await supabase
    .from("sources").delete({ count: "exact" }).eq("user_id", userId).in("name", SEED_SOURCE_NAMES);
  if (srcErr) throw srcErr;

  const { error: catErr, count: catCount } = await supabase
    .from("categories").delete({ count: "exact" }).eq("user_id", userId).in("nom", SEED_CATEGORY_NAMES);
  if (catErr) throw catErr;

  console.log(`${email} : ${srcCount} source(s) et ${catCount} tag(s) génériques supprimés.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
