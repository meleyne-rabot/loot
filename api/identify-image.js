// Google Vision API — Web Detection
// Identifie un article depuis une image : marque, modèle, objets similaires sur le web + prix trouvés.
// Env var requise : GOOGLE_VISION_KEY
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { image } = req.body || {};
  if (!image) return res.status(400).json({ error: "image (base64) requise" });

  const key = process.env.GOOGLE_VISION_KEY;
  if (!key) return res.status(503).json({ error: "GOOGLE_VISION_KEY non configurée" });

  const visionRes = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: image },
          features: [
            { type: "WEB_DETECTION", maxResults: 15 },
            { type: "LABEL_DETECTION", maxResults: 8 },
          ],
        }],
      }),
    }
  );

  if (!visionRes.ok) {
    const err = await visionRes.text();
    return res.status(502).json({ error: "Erreur Google Vision", detail: err });
  }

  const data = await visionRes.json();
  const det = data.responses?.[0]?.webDetection || {};
  const labels = data.responses?.[0]?.labelAnnotations || [];

  // Entités identifiées (ce que c'est)
  const entities = (det.webEntities || [])
    .filter((e) => e.score > 0.4 && e.description)
    .map((e) => e.description)
    .slice(0, 8);

  // Meilleure hypothèse de label
  const bestGuess = det.bestGuessLabels?.[0]?.label || null;

  // Pages web avec images similaires — on cherche des prix dedans
  const pages = (det.pagesWithMatchingImages || [])
    .slice(0, 8)
    .map((p) => {
      const price = extractPrice(p.pageTitle || "");
      return {
        title: (p.pageTitle || "").slice(0, 100),
        url: p.url,
        price,
      };
    });

  // Prix trouvés dans les titres de pages + labels Vision
  const prices = pages.filter((p) => p.price).map((p) => p.price).sort((a, b) => a - b);

  // Labels génériques de Vision (complète l'identification)
  const visionLabels = labels
    .filter((l) => l.score > 0.7)
    .map((l) => l.description)
    .slice(0, 5);

  res.json({ entities, bestGuess, pages: pages.slice(0, 6), prices, visionLabels });
}

function extractPrice(text) {
  const match = text.match(/(\d{1,4}(?:[,.]\d{1,2})?)\s*[€$£]/);
  if (!match) return null;
  const n = parseFloat(match[1].replace(",", "."));
  return n >= 1 && n <= 5000 ? n : null;
}
