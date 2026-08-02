// Import ponctuel de l'historique d'inventaire (Google Sheet exporté en CSV)
// vers Supabase. Utilise la clé service_role (bypass RLS) — usage local
// uniquement, jamais dans le code de l'app.
//
// Colonnes CSV attendues (en-tête en première ligne) :
//   Date ajout, Source, Article, Prix d'achat, Prix listé, Vendu, Statut, Date vente
//
// Usage: node scripts/import-items.cjs <chemin-csv> <email-utilisatrice>
//
// Nécessite SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local
// (clé service_role, PAS la clé anon — ne doit jamais être commitée ni
// utilisée côté client).

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

// Parseur CSV minimal mais conforme RFC4180 (gère les champs entre
// guillemets contenant des virgules, ex: "1,00 €").
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function parseNumber(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/€/g, "").replace(/\s/g, "").replace(",", ".").trim();
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

function normalizeSourceName(name) {
  const n = name.trim();
  if (n.toLowerCase() === "rue blanche") return "Rue Blanche";
  return n;
}

const LESLIE_COMMISSION_PCT = 50;

async function main() {
  loadEnvLocal();
  const [, , csvPath, email] = process.argv;
  if (!csvPath || !email) {
    console.error("Usage: node scripts/import-items.cjs <chemin-csv> <email-utilisatrice>");
    process.exit(1);
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;
  const user = usersPage.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`Aucun utilisateur trouvé pour ${email}`);
  const userId = user.id;
  console.log(`Utilisatrice : ${email} (${userId})`);

  const csv = fs.readFileSync(path.resolve(csvPath), "utf8");
  const rows = parseCsv(csv);
  const header = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  const idx = {
    source: header.indexOf("Source"),
    article: header.indexOf("Article"),
    prixAchat: header.indexOf("Prix d'achat"),
    prixListe: header.indexOf("Prix listé"),
    vendu: header.indexOf("Vendu"),
    statut: header.indexOf("Statut"),
  };

  const sourceNames = [...new Set(dataRows.map((r) => normalizeSourceName(r[idx.source] || "")).filter(Boolean))];
  console.log("Sources détectées :", sourceNames.join(", "));

  const { data: existingSources, error: srcErr } = await supabase
    .from("sources").select("*").eq("user_id", userId);
  if (srcErr) throw srcErr;

  const sourceByName = new Map(existingSources.map((s) => [s.name, s]));
  for (const name of sourceNames) {
    if (sourceByName.has(name)) continue;
    const isLeslie = name.toLowerCase() === "leslie";
    const { data: created, error } = await supabase
      .from("sources")
      .insert({
        user_id: userId,
        name,
        type: isLeslie ? "depot_vente" : "personnel",
        commission_pct: isLeslie ? LESLIE_COMMISSION_PCT : 0,
      })
      .select()
      .single();
    if (error) throw error;
    sourceByName.set(name, created);
    console.log(`+ Source créée : ${name} (${created.type})`);
  }

  const itemsToInsert = dataRows
    .map((r) => {
      const sourceName = normalizeSourceName(r[idx.source] || "");
      const source = sourceByName.get(sourceName);
      const statutRaw = (r[idx.statut] || "").trim().toLowerCase();
      const statut = statutRaw === "vendu" ? "vendu" : statutRaw === "en vente" ? "en-vente" : "en-attente";
      const prixAchat = parseNumber(r[idx.prixAchat]);
      const prixAffiche = parseNumber(r[idx.prixListe]);
      const prixVente = statut === "vendu" ? parseNumber(r[idx.vendu]) : null;
      const commissionPct = source?.type === "depot_vente" ? source.commission_pct : 0;
      const montantAReverser =
        source?.type === "depot_vente" && prixVente != null
          ? Math.round(prixVente * (1 - commissionPct / 100) * 100) / 100
          : null;

      return {
        user_id: userId,
        name: (r[idx.article] || "").trim(),
        source: sourceName,
        source_id: source?.id || null,
        category_id: null,
        prix_achat: prixAchat,
        prix_affiche: prixAffiche,
        prix_vente: prixVente,
        statut,
        plateformes: ["vinted"],
        categorie: null,
        hashtags: [],
        image: null,
        commission_pct: commissionPct,
        montant_a_reverser: montantAReverser,
        reverse_paye: false,
      };
    })
    .filter((item) => item.name);

  console.log(`${itemsToInsert.length} articles à insérer…`);

  const chunkSize = 50;
  let inserted = 0;
  for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
    const chunk = itemsToInsert.slice(i, i + chunkSize);
    const { error } = await supabase.from("items").insert(chunk);
    if (error) throw error;
    inserted += chunk.length;
    console.log(`  ${inserted}/${itemsToInsert.length}`);
  }

  console.log("Import terminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
