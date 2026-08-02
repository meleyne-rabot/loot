import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables d'environnement Supabase manquantes : VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY"
  );
}

// detectSessionInUrl désactivé : on gère nous-mêmes le retour OAuth dans
// AuthContext (évite une course avec la détection automatique).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { detectSessionInUrl: false },
});
