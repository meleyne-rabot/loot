const key = (userId) => `loot:prefs:${userId}`;

export const DEFAULT_PREFS = {
  objectif: "equilibre",   // "rotation" | "equilibre" | "profits"
  ton: "decontracte",      // "decontracte" | "neutre" | "pro"
  mentionsFixes: "",       // texte libre, toujours injecté dans les descriptions
  hashtags: true,          // inclure les hashtags dans les descriptions
  briefRedaction: "",      // règles de style perso — ce qu'on ne veut jamais / toujours
};

export function loadPrefs(userId) {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(userId, prefs) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(prefs));
  } catch {}
}
