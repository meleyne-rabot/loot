function buildSystem(userName, calibrationNote, userPrefs) {
  const objectifMap = {
    rotation: "ROTATION RAPIDE — prix agressifs, l'objectif est de vendre vite et déstockager. Suggère des prix dans le bas de la fourchette marché.",
    equilibre: "ÉQUILIBRE — bon prix, bonne marge. Suggère des prix compétitifs sans brader.",
    profits: "PROFITS MAX — prix hauts, l'utilisatrice accepte d'attendre l'acheteur. Suggère des prix dans le haut de la fourchette marché.",
  };
  const tonMap = {
    decontracte: "ton décontracté, naturel, comme une amie qui vend ses affaires",
    neutre: "ton neutre et factuel, sans familiarité excessive",
    pro: "ton professionnel et soigné, comme une boutique en ligne",
  };

  const objectifLabel = objectifMap[userPrefs?.objectif] || objectifMap.equilibre;
  const tonLabel = tonMap[userPrefs?.ton] || tonMap.decontracte;
  const mentions = userPrefs?.mentionsFixes?.trim();
  const brief = userPrefs?.briefRedaction?.trim();

  const hashtagsNote = userPrefs?.hashtags === false
    ? "\n- Hashtags : NE PAS en générer. Renvoie hashtags:[] et n'en inclus AUCUN dans les descriptions."
    : "\n- Hashtags : inclure 5 à 8 hashtags pertinents (champ hashtags + en fin de description_vinted).";

  const prefsSection = `\n\nPRÉFÉRENCES UTILISATRICE (PRIORITÉ HAUTE) :
- Objectif pricing : ${objectifLabel}
- Ton des annonces : ${tonLabel}${hashtagsNote}${mentions ? `\n- Mentions à toujours inclure en fin de description_vinted et description_lbc : "${mentions}"` : ""}${brief ? `\n\nBRIEF RÉDACTION (RÈGLES ABSOLUES — ne jamais enfreindre) :\n${brief}` : ""}`;

  const calibrationSection = calibrationNote
    ? `\n\nCALIBRATION PRIX PERSONNELLE (OBLIGATOIRE) :
${calibrationNote}
→ Applique cette correction directement sur ton prix_recommande. Un prix juste qui part vite vaut mieux qu'un prix élevé qui stagne. Ne dépasse jamais ta reco habituelle de plus de 10% sauf pièce collector explicitement signalée.`
    : "";

  return `Tu es l'assistante de ${userName || "l'utilisatrice"}, vendeuse sur Vinted et LeBonCoin.
Elle vend : objets vintage, jouets, brocante, vêtements.

${prefsSection}${calibrationSection}

CONTEXTE UTILISATEUR = PRIORITÉ ABSOLUE.
Si elle mentionne une marque, un modèle, ou un mot comme "recherché", "rare", "collector" dans les infos — tu DOIS l'identifier précisément et adapter le prix en conséquence. Ne jamais ignorer ces indices.

RÈGLES RÉDACTION :
- Français. Jamais de superlatifs vides. Jamais inventer de détails. Respecte le ton défini dans PRÉFÉRENCES UTILISATRICE.
- JAMAIS écrire "lot" dans le titre (ni dans les hashtags)
- JAMAIS "contrefaçon", "style vintage" (dire vintage directement si c'est vintage)
- Bijoux = préciser "fantaisie"
- Peluches de marque = nom exact du modèle dans titre ET description
- "Petites voitures" pas "miniatures" pour les die-cast
- Ne jamais suggérer de mode d'envoi

PRICING (fourchettes basses = ventes rapides) :
- Fast fashion (Zara, H&M, Mango) : 4-6€
- Sport / Pepe Jeans : 5-7€
- Mid-range (Massimo Dutti, Sinéquanone) : 8-12€
- Premium (Kenzo, CK, Banana Republic) : 12-20€
- Vintage / collector recherché : fourchette HAUTE, justifiée par la rareté
- Si elle dit "recherché" ou "collector" : ne pas rester conservateur, monter le prix
- Les prix affichés sur Vinted surestiment les ventes réelles — base-toi sur les prix des articles récemment vendus, pas ceux listés${calibrationSection}

JSON strict, aucun texte ni backtick :
{"titre":"max 50 car, SANS le mot lot","description_vinted":"2-3 phrases naturelles","hashtags":["5 à 8 tags, SANS #lot"],"description_lbc":"mêmes 2-3 phrases SANS hashtag","prix_recommande":12,"prix_note":"note marché courte","categorie":"vêtement|jouet|déco|livre|accessoire|vintage|autre","vintage":true}
→ Mets "vintage":true et "categorie":"vintage" si l'objet date de plus de ~15 ans (années 2000 et avant, jouets rétro, vêtements vintage, vaisselle ancienne…). Sinon "vintage":false.`;
}

function firstUserContent(images, context) {
  const content = [];
  for (const img of images) {
    if (img.url) {
      content.push({ type: "image", source: { type: "url", url: img.url } });
    } else {
      content.push({ type: "image", source: { type: "base64", media_type: img.type, data: img.data } });
    }
  }
  content.push({ type: "text", text: "Génère une annonce." + (context ? " Infos : " + context : "") + " JSON uniquement." });
  return content;
}

// Retourne { status, body } — agnostique du framework HTTP (Vercel ou middleware Vite dev).
export async function runGenerate({ images, context, mode, currentResult, chatHistory, userName, calibrationNote, userPrefs }, apiKey) {
  if (!apiKey) {
    return { status: 500, body: { error: "ANTHROPIC_API_KEY non configurée" } };
  }
  if (!Array.isArray(images) || images.length === 0) {
    return { status: 400, body: { error: "images requis" } };
  }

  const messages =
    mode === "refine"
      ? [
          { role: "user", content: firstUserContent(images, context) },
          { role: "assistant", content: JSON.stringify(currentResult) },
          ...(chatHistory || []),
        ]
      : [{ role: "user", content: firstUserContent(images, context) }];

  const system =
    buildSystem(userName, mode === "generate" ? calibrationNote : null, mode === "generate" ? userPrefs : null) +
    (mode === "refine"
      ? "\n\nOn va te demander de corriger une annonce existante. Tu DOIS renvoyer le JSON COMPLET avec TOUS les champs (titre, description_vinted, hashtags, description_lbc, prix_recommande, prix_note, categorie), même ceux que tu ne modifies pas — recopie-les tels quels depuis le message précédent. Ne renvoie JAMAIS un JSON partiel. Ajoute aussi un champ \"message_chat\" : une courte phrase naturelle et conversationnelle expliquant précisément ce que tu viens de changer (comme dans un échange normal), pas un simple \"fait\"."
      : "");

  const callAnthropic = async () => {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages,
      }),
    });
    if (!aiRes.ok) {
      const errText = await aiRes.text();
      const err = new Error("Erreur API Anthropic");
      err.status = aiRes.status;
      err.detail = errText;
      throw err;
    }
    return aiRes;
  };

  // L'API Anthropic renvoie parfois des erreurs transitoires (surcharge
  // 529, rate limit 429) — on retente avant de remonter l'erreur à
  // l'utilisatrice, plutôt que de lui faire cliquer "Réessayer" elle-même.
  const RETRYABLE_STATUSES = [429, 529, 503];
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const aiRes = await callAnthropic();
      const data = await aiRes.json();
      const text = data.content?.find((b) => b.type === "text")?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      return { status: 200, body: parsed };
    } catch (err) {
      lastErr = err;
      if (RETRYABLE_STATUSES.includes(err.status) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
      break;
    }
  }

  let detail = lastErr?.detail || String(lastErr);
  try {
    const parsedDetail = JSON.parse(detail);
    detail = parsedDetail.error?.message || detail;
  } catch {
    // detail n'était pas du JSON, on le garde tel quel
  }
  return { status: 502, body: { error: "Erreur API Anthropic", detail } };
}
