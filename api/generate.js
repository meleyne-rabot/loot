import { runGenerate } from "./_generateCore.js";

// Un appel avec plusieurs photos (article multi-angles) peut prendre plus
// que les 10s par défaut — on monte la limite pour éviter les coupures
// réseau ("Load failed") côté client.
export const config = {
  maxDuration: 60,
  api: { bodyParser: { sizeLimit: "20mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { status, body } = await runGenerate(req.body || {}, process.env.ANTHROPIC_API_KEY);
  res.status(status).json(body);
}
