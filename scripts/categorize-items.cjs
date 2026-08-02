// Assigne automatiquement une category_id aux items qui n'en ont pas,
// par correspondance de mots-clés sur le nom de l'article.
//
// Usage: node scripts/categorize-items.cjs <email-utilisatrice>

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

function normalize(s) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Ordre = priorité de correspondance (premier match gagnant).
const RULES = [
  ["Livres", ["livre", " bd ", "bd ", "histoire de", "mandela", "permaculture", "maus", "sepher"]],
  ["Jouets", [
    "peluche", "figurine", "jeu ", "jeux ", "jeux", "puzzle", "poney", "poupon", "lego",
    "doudou", "vilac", "janod", "djeco", "smartmax", "furby", "furbys", "barbie",
    "camera lollipop", "caisse enregistreuse", "telecran", "valise polly pocket",
    "valise barbie", "secret keypers", "mecano", "malette fisherprice", "train caoutchouc",
    "oeuf vilac", "hochet", "oball", "cible flechette", "domino", "bus poly pocket",
    "boule chicco", "boule lego", "boule smartmax", "veilleuse", "flex tour", "sylvanian",
    "fragglerock", "popples", "mickey", "donald", "radio fisher price", "figurine pluto",
    "figurine disney", "mob jouet", "ludo pepa pig", "tic tac boum", "bracelets", "tapo bac",
    "oui oui peluche", "semainier", "lilliputiens", "tortue", "teletubies", "petit poney",
    "petits poney",
  ]],
  ["Vêtements", [
    "robe", "top ", "haut ", "chemise", "chemie", "veste", "jean ", "pantalon", "jupe",
    "short ", "pyjama", "survet", "sweat", "combi", "maillot", "blouson", "salopette",
    "t-shirt", "tshirt", "doudoune", "gigoteuse", "blouse", "cire jaune", "chale", "toque",
    "jogging", "pull", "combishort",
  ]],
  ["Accessoires", [
    "sac ", "escarpins", "escarpings", "sandales", "basket", "vans ", "timberland",
    "mocassins", "bottine", "ceinture", "espadrille", "babies", "pochette",
  ]],
  ["Déco", [
    "mug", "tasse", "vase", "plat ", "bouteille", "theiere", "carafe", "miroir", "nappe",
    "coupelle", "verre", "assiette", "cendrier", "chaise", "portant", "coquetier",
    "housse de couette", "taie ", "serviette", "dessous de", "moule", "etain",
  ]],
];

function categorize(name) {
  const n = normalize(name);
  for (const [cat, keywords] of RULES) {
    if (keywords.some((k) => n.includes(normalize(k)))) return cat;
  }
  return "Autre";
}

const DEFAULT_CATEGORIES = ["Jouets", "Vêtements", "Déco", "Livres", "Accessoires", "Autre"];

async function main() {
  loadEnvLocal();
  const [, , email] = process.argv;
  if (!email) {
    console.error("Usage: node scripts/categorize-items.cjs <email-utilisatrice>");
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;
  const user = usersPage.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`Aucun utilisateur trouvé pour ${email}`);
  const userId = user.id;

  let { data: categories, error: catErr } = await supabase.from("categories").select("*").eq("user_id", userId);
  if (catErr) throw catErr;

  const existingNames = new Set(categories.map((c) => c.nom));
  const missing = DEFAULT_CATEGORIES.filter((nom) => !existingNames.has(nom));
  if (missing.length) {
    const { data: created, error } = await supabase
      .from("categories")
      .insert(missing.map((nom) => ({ user_id: userId, nom })))
      .select();
    if (error) throw error;
    categories = [...categories, ...created];
    console.log("Catégories créées :", missing.join(", "));
  }
  const categoryByName = new Map(categories.map((c) => [c.nom, c]));

  const { data: items, error: itemsErr } = await supabase
    .from("items").select("id, name").eq("user_id", userId).is("category_id", null);
  if (itemsErr) throw itemsErr;

  console.log(`${items.length} articles sans catégorie à classer…`);

  const tally = {};
  for (const item of items) {
    const catName = categorize(item.name || "");
    tally[catName] = (tally[catName] || 0) + 1;
    const category = categoryByName.get(catName);
    const { error } = await supabase.from("items").update({ category_id: category.id }).eq("id", item.id);
    if (error) throw error;
  }

  console.log("Répartition :", tally);
  console.log("Terminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
