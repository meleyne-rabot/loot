// Corrige manuellement la date de vente (vendu_at) d'un article par nom
// (recherche partielle) — utile pour les ventes passées en "Vendu" avant
// que ce champ n'existe ou n'ait été rempli automatiquement.
//
// Usage: node scripts/fix-vendu-at.cjs <email-utilisatrice> "<nom partiel>" [YYYY-MM-DD]
// Sans date, utilise aujourd'hui.

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
  const [, , email, namePart, dateArg] = process.argv;
  if (!email || !namePart) {
    console.error('Usage: node scripts/fix-vendu-at.cjs <email> "<nom partiel>" [YYYY-MM-DD]');
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;
  const user = usersPage.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`Aucun utilisateur trouvé pour ${email}`);
  const userId = user.id;

  const { data: items, error: itemsErr } = await supabase
    .from("items").select("id, name, statut, vendu_at").eq("user_id", userId).ilike("name", `%${namePart}%`);
  if (itemsErr) throw itemsErr;

  if (items.length === 0) {
    console.log("Aucun article trouvé.");
    return;
  }
  if (items.length > 1) {
    console.log(`${items.length} articles correspondent, soyez plus précis·e :`);
    items.forEach((i) => console.log(`- ${i.name} (statut: ${i.statut}, vendu_at: ${i.vendu_at})`));
    return;
  }

  const item = items[0];
  if (item.statut !== "vendu") {
    console.log(`"${item.name}" n'est pas marqué "vendu" (statut actuel: ${item.statut}), abandon.`);
    return;
  }

  const venduAt = dateArg ? new Date(dateArg + "T12:00:00").toISOString() : new Date().toISOString();
  const { error } = await supabase.from("items").update({ vendu_at: venduAt }).eq("id", item.id);
  if (error) throw error;
  console.log(`"${item.name}" → vendu_at = ${venduAt}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
