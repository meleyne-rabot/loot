// Recherche Google Custom Search pour trouver les prix marché d'un article.
// Env vars requises (à ajouter dans Vercel Dashboard > Settings > Environment Variables) :
//   GOOGLE_SEARCH_KEY — clé API Google Cloud (Custom Search JSON API activée)
//   GOOGLE_SEARCH_CX  — ID du Custom Search Engine configuré sur vinted.fr + leboncoin.fr
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { title, categorie } = req.body || {};
  if (!title) return res.status(400).json({ error: "title requis" });

  const key = process.env.GOOGLE_SEARCH_KEY;
  const cx  = process.env.GOOGLE_SEARCH_CX;
  if (!key || !cx) return res.status(503).json({ error: "GOOGLE_SEARCH_KEY / GOOGLE_SEARCH_CX non configurés" });

  // Requêtes ciblées vinted + lbc pour avoir des prix réels
  const queries = [
    `"${title}" vinted prix`,
    `"${title}" leboncoin`,
  ];

  const results = [];
  for (const q of queries) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(q)}&num=5`;
      const data = await fetch(url).then((r) => r.json());
      for (const item of data.items || []) {
        const price = extractPrice(item.snippet || "");
        if (price) {
          results.push({
            titre: item.title?.slice(0, 80),
            prix: price,
            source: item.displayLink?.replace(/^www\./, ""),
            snippet: item.snippet?.slice(0, 120),
          });
        }
      }
    } catch { /* ignore erreur sur une requête */ }
  }

  // Dédoublonne et trie par prix croissant
  const seen = new Set();
  const unique = results.filter((r) => {
    const k = `${r.prix}-${r.titre}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a, b) => a.prix - b.prix).slice(0, 8);

  res.json({ results: unique });
}

function extractPrice(text) {
  // Extrait le premier prix en euros mentionné dans le texte
  const match = text.match(/(\d{1,4}(?:[,.]\d{1,2})?)\s*€/);
  if (!match) return null;
  const n = parseFloat(match[1].replace(",", "."));
  return n >= 1 && n <= 2000 ? n : null;
}
