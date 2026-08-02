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
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;
  console.log("Utilisateurs:", usersPage.users.map((u) => ({ id: u.id, email: u.email, created_at: u.created_at })));

  const { data: sources, error } = await supabase.from("sources").select("id, user_id, name");
  if (error) throw error;
  const byUser = {};
  for (const s of sources) {
    byUser[s.user_id] = byUser[s.user_id] || [];
    byUser[s.user_id].push(s.name);
  }
  console.log("\nSources par user_id:");
  for (const [uid, names] of Object.entries(byUser)) {
    console.log(uid, "->", names);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
