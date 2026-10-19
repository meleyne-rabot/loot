// GenerateurTab.jsx — suit GenererFlow.jsx (design handoff V6)
// tokens C/F/SHADOW, screen/label/fieldBox/card identiques à la référence

import { useEffect, useRef, useState } from "react";
import { callAI } from "../lib/ai";
import { compressImage, compressForAI } from "../lib/image";
import { listItems } from "../lib/items";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { listCategories, matchCategoryByName, findOrCreateVintage } from "../lib/categories";
import { listMalles } from "../lib/malles";
import { findOrCreateMonPlacard } from "../lib/sources";
import { loadPrefs } from "../lib/prefs";
import { SourceSelect } from "../components/SourceSelect";
import { MalleSelect } from "../components/MalleSelect";
import {
  Camera, Image as ImageIcon, Sparkle, ArrowClockwise,
  Copy, Check, CheckCircle, TreasureChest, PencilSimple, GearSix, Plus, MagnifyingGlass,
} from "@phosphor-icons/react";

// ─── tokens (miroir de loot-tokens.js) ──────────────────────────────────────
const C = {
  canvas: "#F6F2EC", surface: "#FFFFFF", ink: "#1C1B3A",
  muted1: "#6B6980", muted2: "#8A879B", muted3: "#9C99AB", muted4: "#B7AE9E",
  border: "#E3DCD0", divider: "#F0EBE3",
  coral: "#F03C64", coralPressed: "#C22A50", coralBorder: "#F0B6C4",
  green: "#2FA96A", greenDark: "#1E8A57", greenSoft: "#EDF7F1", greenSoftBorder: "#C9E9D6",
  amberText: "#B0651B", amberSoft: "#FBEFE0",
  vinted: "#0B7A73", vintedTint: "#DEF3F1", vintedBorder: "#9FD9D3",
  photoStripe: "repeating-linear-gradient(135deg,#F1ECE4,#F1ECE4 6px,#E9E1D5 6px,#E9E1D5 12px)",
};
const F = {
  title: "'Bricolage Grotesque', system-ui, sans-serif",
  body: "'Hanken Grotesk', system-ui, sans-serif",
};
const SHADOW = {
  card: "0 2px 10px rgba(28,27,58,.05)",
  coral: "0 8px 20px rgba(240,60,100,.28)",
};

// ─── style constants (même noms que la référence) ───────────────────────────
const screen = {
  width: "100%", maxWidth: 480, margin: "0 auto", boxSizing: "border-box",
  padding: "20px 18px 128px", background: C.canvas, minHeight: "100%",
  fontFamily: F.body, color: C.ink,
};
const lbl = { font: `700 11px ${F.body}`, letterSpacing: ".06em", color: C.muted2, textTransform: "uppercase" };
const fieldBox = { background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "13px 15px", boxSizing: "border-box" };
const card = { background: C.surface, borderRadius: 16, padding: "14px 15px", boxShadow: SHADOW.card, boxSizing: "border-box" };

// ─── CopyButton (miroir de la référence) ────────────────────────────────────
function CopyButton({ text, onCopy }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove(); }
    setDone(true);
    onCopy?.();
    setTimeout(() => setDone(false), 1600);
  };
  return (
    <button onClick={copy} style={{
      border: "none", background: done ? C.green : C.coral, color: "#fff",
      font: `700 12px ${F.body}`, padding: "7px 14px", borderRadius: 10, cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 6,
      boxShadow: done ? "none" : "0 4px 11px rgba(240,60,100,.26)", transition: "background .2s",
    }}>
      {done ? <Check size={14} weight="bold" /> : <Copy size={14} weight="fill" />}
      {done ? "Copié" : "Copier"}
    </button>
  );
}

// chip style pour les hints (miroir de la référence)
const chip = () => ({
  font: `700 11.5px ${F.body}`, borderRadius: 999, padding: "7px 13px",
  cursor: "pointer", border: "none", background: "#F1EFF4", color: "#5B5975",
});

// ─── helpers ────────────────────────────────────────────────────────────────
async function getPriceCalibrationNote(userId, contextHint = "") {
  try {
    const items = await listItems(userId);
    const parts = [];

    // 1. Ajustement par catégorie (reco IA → prix réellement listé)
    const cats = {};
    for (const i of items) {
      const cat = i.categorie || "autre";
      const reco = parseFloat(i.prixRecommande);
      const affiche = parseFloat(i.prixAffiche);
      if (reco > 0 && affiche > 0) {
        if (!cats[cat]) cats[cat] = { sum: 0, count: 0 };
        cats[cat].sum += ((affiche - reco) / reco) * 100;
        cats[cat].count++;
      }
    }
    const catLines = Object.entries(cats)
      .filter(([, v]) => v.count >= 2)
      .map(([cat, v]) => {
        const avg = Math.round(v.sum / v.count);
        if (Math.abs(avg) < 3) return null;
        return `- ${cat} : ${avg >= 0 ? "+" : ""}${avg}% (${v.count} articles)`;
      })
      .filter(Boolean);
    if (catLines.length > 0) {
      parts.push(`Ajustement par catégorie (reco IA → prix réel listé) :\n${catLines.join("\n")}`);
    }

    // 2. Dernières ventes réelles (ancres de prix concrètes)
    const vendus = items
      .filter((i) => i.statut === "vendu" && parseFloat(i.prixVente) > 0 && i.name)
      .sort((a, b) => new Date(b.venduAt || b.createdAt) - new Date(a.venduAt || a.createdAt))
      .slice(0, 20);
    if (vendus.length > 0) {
      const lines = vendus.map((i) => {
        const nom = i.name.length > 50 ? i.name.slice(0, 47) + "…" : i.name;
        const vendu = parseFloat(i.prixVente).toFixed(0);
        const affiche = parseFloat(i.prixAffiche) > 0 ? ` (listé ${parseFloat(i.prixAffiche).toFixed(0)}€)` : "";
        return `- ${nom} → vendu ${vendu}€${affiche}`;
      });
      parts.push(`Ventes réelles récentes (ancres de prix — utilise-les pour calibrer) :\n${lines.join("\n")}`);
    }

    // 3. Marge de négociation habituelle (listé → vendu réel)
    const vendusWithBoth = items.filter(
      (i) => i.statut === "vendu" && parseFloat(i.prixVente) > 0 && parseFloat(i.prixAffiche) > 0
    );
    if (vendusWithBoth.length >= 3) {
      // Global
      const globalNego = Math.round(
        vendusWithBoth.reduce((s, i) => s + ((parseFloat(i.prixVente) - parseFloat(i.prixAffiche)) / parseFloat(i.prixAffiche)) * 100, 0) / vendusWithBoth.length
      );
      // Par catégorie (si ≥3 vendus avec les deux prix)
      const negoCats = {};
      for (const i of vendusWithBoth) {
        const cat = i.categorie || "autre";
        if (!negoCats[cat]) negoCats[cat] = { sum: 0, count: 0 };
        negoCats[cat].sum += ((parseFloat(i.prixVente) - parseFloat(i.prixAffiche)) / parseFloat(i.prixAffiche)) * 100;
        negoCats[cat].count++;
      }
      const negoLines = Object.entries(negoCats)
        .filter(([, v]) => v.count >= 3)
        .map(([cat, v]) => `- ${cat} : ${Math.round(v.sum / v.count)}% (${v.count} ventes)`)
        .join("\n");
      const negoNote = negoLines
        ? `Global : ${globalNego}%\n${negoLines}`
        : `${globalNego}% en moyenne (${vendusWithBoth.length} ventes)`;
      parts.push(
        `Marge de négociation habituelle (prix listé → prix vendu réel) :\n${negoNote}\n→ Si la négo est de -X%, liste X% au-dessus du prix cible pour tomber juste après négo. Intègre cette marge dans ton prix_recommande.`
      );
    }

    // 3. Prix réels par marque (apprentissage automatique depuis l'historique)
    const KNOWN_BRANDS = [
      "Zara","H&M","Mango","Massimo Dutti","Sandro","Maje","Kenzo","Banana Republic",
      "Calvin Klein","Ralph Lauren","Lacoste","Levi","Tommy Hilfiger","Adidas","Nike",
      "Puma","Gap","Monoprix","Promod","Cache Cache","Camaieu","Pimkie","Jennyfer",
      "Comptoir des Cotonniers","Jacadi","Petit Bateau","Catimini","Sergent Major",
      "Playmobil","Lego","Fisher-Price","Barbie","Sylvanian","Blythe","Schleich",
      "Burberry","Gucci","Louis Vuitton","Dior","Chanel","Hermès","Versace","Prada",
      "Pepe Jeans","Sinequanone","Caroll","Naf Naf","Aigle","The Kooples",
    ];
    const brandStats = {};
    for (const item of vendus) {
      const nameLow = item.name.toLowerCase();
      for (const brand of KNOWN_BRANDS) {
        if (nameLow.includes(brand.toLowerCase())) {
          if (!brandStats[brand]) brandStats[brand] = { sum: 0, count: 0 };
          brandStats[brand].sum += parseFloat(item.prixVente);
          brandStats[brand].count++;
          break; // une seule marque par article pour éviter les doublons
        }
      }
    }
    const brandLines = Object.entries(brandStats)
      .filter(([, v]) => v.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 12)
      .map(([brand, v]) => `- ${brand} : ${(v.sum / v.count).toFixed(0)}€ moy. (${v.count} ventes)`);
    if (brandLines.length > 0) {
      parts.push(`Prix réels par marque (tes ventes) :\n${brandLines.join("\n")}\n→ Ces prix sont tes ancres réelles par marque — priorité sur les fourchettes génériques.`);
    }

    // 4. Détection doublon : matching sur les mots du contexte vs noms vendus
    if (contextHint && vendus.length > 0) {
      const words = contextHint.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      const scored = vendus.map((i) => {
        const nameWords = i.name.toLowerCase().split(/\W+/);
        const overlap = words.filter((w) => nameWords.some((nw) => nw.includes(w) || w.includes(nw))).length;
        return { i, score: overlap };
      }).filter((x) => x.score >= 2).sort((a, b) => b.score - a.score).slice(0, 2);
      if (scored.length > 0) {
        const matchLines = scored.map(({ i }) =>
          `"${i.name}" vendu ${parseFloat(i.prixVente).toFixed(0)}€${parseFloat(i.prixAffiche) > 0 ? ` (listé ${parseFloat(i.prixAffiche).toFixed(0)}€)` : ""}`
        );
        parts.push(`⚠️ Article similaire déjà vendu par cette utilisatrice : ${matchLines.join(" / ")}. ANCRE ton prix_recommande sur ces valeurs réelles — c'est son vrai marché.`);
      }
    }

    return parts.join("\n\n");
  } catch { return ""; }
}

function getDesc(result, platform) {
  if (!result) return "";
  const ht = (result.hashtags || []).map((h) => "#" + h.replace(/^#/, "")).join(" ");
  const strip = (s) => (s || "").replace(/(\s*\n+)?(#[\w][^\n]*\n*)+$/g, "").trimEnd();
  if (platform === "vinted") {
    const base = strip(result.description_vinted);
    return base + (ht ? "\n\n" + ht : "");
  }
  return strip(result.description_lbc || result.description_vinted || "");
}

// ─── composant principal ─────────────────────────────────────────────────────
export function GenerateurTab({ onSave, onUpdate, onPhaseChange, goBackRef, onOpenAnnonceSettings }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [phase, setPhase] = useState("saisie");
  const [images, setImages] = useState([]);
  const [infos, setInfos] = useState("");
  const [prixAchat, setPrixAchat] = useState("");
  const [source, setSource] = useState(null);
  const [pour, setPour] = useState("stock");
  const [malleId, setMalleId] = useState(null);
  const [malles, setMalles] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [result, setResult] = useState(null);
  const [plateforme, setPlateforme] = useState("vinted");
  const [titre, setTitre] = useState("");
  const [desc, setDesc] = useState("");
  const [prixListe, setPrixListe] = useState("");
  const [refine, setRefine] = useState("");
  const [marcheResults, setMarcheResults] = useState(null);
  const [marcheLoading, setMarcheLoading] = useState(false);
  const [visionData, setVisionData] = useState(null); // résultat identification image
  const [autoSavedId, setAutoSavedId] = useState(null); // pour l'affichage UI uniquement
  const autoSavedIdRef = useRef(null); // source de vérité pour save() — synchrone, pas de délai React

  const fileRef = useRef();
  const camRef = useRef();
  const autoSavingRef = useRef(false); // garde-fou contre double déclenchement
  const titleCopiedRef = useRef(false);
  const descCopiedRef = useRef(false);
  // Refs toujours à jour pour l'auto-save (évite les stale closures)
  const liveRef = useRef({});
  liveRef.current = { images, titre, desc, result, user, malles, malleId, source, prixAchat, prixListe, plateforme, pour, onSave };

  useEffect(() => {
    listMalles(user.id).then(setMalles).catch(() => {});
    findOrCreateMonPlacard(user.id).then(setSource).catch(() => {});
  }, [user.id]);

  // triggerAutoSave — appelé directement dans onCopy, utilise liveRef pour éviter les stale closures
  const triggerAutoSave = async () => {
    if (autoSavingRef.current) return;
    autoSavingRef.current = true;
    const { images: imgs, titre: t, desc: d, result: r, user: u, malles: ms,
            malleId: mid, source: src, prixAchat: pa, prixListe: pl,
            plateforme: plat, pour: p, onSave: save } = liveRef.current;
    try {
      let thumb = null;
      if (imgs[0]?.url) thumb = await compressImage(imgs[0].url);
      const categories = await listCategories(u.id).catch(() => []);
      const category = matchCategoryByName(categories, r?.categorie);
      const tagIds = category ? [category.id] : [];
      if (r?.vintage) {
        const v = await findOrCreateVintage(categories, u.id).catch(() => null);
        if (v && !tagIds.includes(v.id)) tagIds.push(v.id);
      }
      const malle = ms.find(m => m.id === mid) || null;
      const created = await save(
        {
          name: t, source: src?.nom || "", sourceId: src?.id || null,
          tagIds, description: d,
          hashtags: (r?.hashtags || []).map(h => h.replace(/^#/, "")),
          prixAchat: pa, prixAffiche: pl, prixRecommande: String(r?.prix_recommande ?? ""),
          prixVente: "", statut: "en-vente", plateformes: [plat],
          categorie: r?.categorie || "autre", image: thumb,
          commissionPct: src?.commissionPct || 0,
          malleId: p === "malle" ? mid || null : null,
          malleCommissionPct: malle?.commissionPct ?? 0,
        },
        src?.type,
        { stayOnPage: true }
      );
      const createdId = created?.id || null;
      autoSavedIdRef.current = createdId;
      setAutoSavedId(createdId || true); // true = auto-sauvegardé mais id perdu
      showToast("✓ Enregistré · Entre le prix Vinted ci-dessous");
    } catch (err) {
      autoSavingRef.current = false;
      showToast("✗ Enregistrement échoué : " + (err?.message || "erreur inconnue"));
    }
  };

  useEffect(() => {
    if (goBackRef) goBackRef.current = () => {
      if (phase === "result") { setPhase("saisie"); onPhaseChange?.("photos"); }
    };
  });
  useEffect(() => { onPhaseChange?.(phase === "saisie" ? "photos" : "review"); }, [phase]);

  const handleFiles = (files) => {
    Promise.all(
      Array.from(files).slice(0, 5 - images.length).map((f) => new Promise((res) => {
        const r = new FileReader();
        r.onload = async (e) => {
          const c = await compressForAI(e.target.result);
          res({ data: c.split(",")[1], type: "image/jpeg", url: c });
        };
        r.readAsDataURL(f);
      }))
    ).then((imgs) => setImages((prev) => [...prev, ...imgs].slice(0, 5)));
  };

  async function generer(hint = "", plat = plateforme) {
    if (!images.length) return;
    setGenerating(true); setError(""); setVisionData(null);
    titleCopiedRef.current = false;
    descCopiedRef.current = false;
    setAutoSavedId(null);
    autoSavingRef.current = false;
    try {
      const ctx = [infos, hint ? `Précision : ${hint}` : ""].filter(Boolean).join("\n\n");

      // Appel Vision API en parallèle de la calibration (uniquement première génération)
      const visionPromise = !hint ? identifyWithVision(images[0]) : Promise.resolve(null);

      const [calibNote, vision] = await Promise.all([
        getPriceCalibrationNote(user.id, ctx),
        visionPromise,
      ]);
      if (vision) setVisionData(vision);

      // Enrichissement du contexte avec l'identification Vision
      const visionCtx = vision ? buildVisionContext(vision) : "";
      const enrichedCtx = [ctx, visionCtx].filter(Boolean).join("\n\n");

      const prefs = loadPrefs(user.id);
      const r = await callAI(images, enrichedCtx, user?.user_metadata?.full_name, calibNote, prefs);
      setResult(r);
      setTitre(r.titre || "");
      setDesc(getDesc(r, plat));
      setPrixListe(String(r.prix_recommande ?? ""));
      setRefine("");
      setPhase("result");
      window.scrollTo(0, 0);
    } catch { setError("Erreur de génération. Réessaie."); }
    setGenerating(false);
  }

  async function identifyWithVision(img) {
    try {
      // On envoie le data URL base64 sans le préfixe "data:image/...;base64,"
      const base64 = img.url ? null : img.data; // img.data est déjà du base64 pur
      if (!base64) return null;
      const res = await fetch("/api/identify-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  function buildVisionContext(vision) {
    const parts = [];
    if (vision.bestGuess) parts.push(`Identification visuelle : "${vision.bestGuess}"`);
    if (vision.entities?.length) parts.push(`Entités reconnues : ${vision.entities.slice(0, 5).join(", ")}`);
    if (vision.prices?.length) {
      const min = Math.min(...vision.prices);
      const max = Math.max(...vision.prices);
      parts.push(`Prix observés sur le web pour cet article : ${min === max ? `${min}€` : `${min}–${max}€`}`);
    }
    return parts.length ? `[IDENTIFICATION IMAGE]\n${parts.join("\n")}` : "";
  }

  function changePlateforme(plat) {
    setPlateforme(plat);
    if (result) setDesc(getDesc(result, plat));
  }

  const reset = () => {
    autoSavingRef.current = false;
    titleCopiedRef.current = false;
    descCopiedRef.current = false;
    autoSavedIdRef.current = null;
    setAutoSavedId(null);
    setPhase("saisie"); setImages([]); setInfos(""); setPrixAchat("");
    setResult(null); setTitre(""); setDesc(""); setPrixListe("");
    setRefine(""); setError(""); setPour("stock"); setMalleId(null); setPlateforme("vinted");
    if (fileRef.current) fileRef.current.value = "";
    if (camRef.current) camRef.current.value = "";
    window.scrollTo(0, 0);
  };

  const save = async () => {
    setError("");
    try {
      const malle = malles.find((m) => m.id === malleId) || null;
      const itemData = {
        name: titre, source: source?.nom || "", sourceId: source?.id || null,
        description: desc,
        hashtags: (result?.hashtags || []).map((h) => h.replace(/^#/, "")),
        prixAchat, prixAffiche: prixListe, prixRecommande: String(result?.prix_recommande ?? ""),
        prixVente: "", statut: "en-vente", plateformes: [plateforme],
        categorie: result?.categorie || "autre",
        commissionPct: source?.commissionPct || 0,
        malleId: pour === "malle" ? malleId || null : null,
        malleCommissionPct: malle?.commissionPct ?? 0,
      };

      // Utilise le ref (synchrone) pour éviter le délai de batch React sur autoSavedId state
      const savedId = autoSavedIdRef.current;
      if (savedId && onUpdate) {
        // Article déjà auto-sauvegardé — on met à jour le prix et la description
        let thumb = null;
        if (images[0]?.url) thumb = await compressImage(images[0].url);
        await onUpdate({ ...itemData, id: savedId, ...(thumb ? { image: thumb } : {}) }, source?.type);
        showToast("✓ Prix mis à jour dans l'inventaire");
      } else if (!savedId) {
        // Pas encore sauvegardé — création classique
        let thumb = null;
        if (images[0]?.url) thumb = await compressImage(images[0].url);
        const categories = await listCategories(user.id).catch(() => []);
        const category = matchCategoryByName(categories, result?.categorie);
        const tagIds = category ? [category.id] : [];
        if (result?.vintage) {
          const v = await findOrCreateVintage(categories, user.id).catch(() => null);
          if (v && !tagIds.includes(v.id)) tagIds.push(v.id);
        }
        await onSave({ ...itemData, tagIds, image: thumb }, source?.type, { stayOnPage: true });
        showToast("✓ Article ajouté à l'inventaire");
      }
      reset();
    } catch (err) { setError(err?.message || "Erreur de sauvegarde. Réessaie."); }
  };

  // ── platBtn helper (miroir de la référence) ──────────────────────────────
  const platBtn = (id, txtColor, bg, border) => ({
    flex: 1, borderRadius: 12, padding: 11, cursor: "pointer", font: `700 13px ${F.body}`,
    border: plateforme === id ? `1.5px solid ${border}` : `1.5px solid ${C.border}`,
    background: plateforme === id ? bg : "#fff",
    color: plateforme === id ? txtColor : C.muted3,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  });

  // ════════════════════════════════════════════════════════ PHASE SAISIE ════
  if (phase === "saisie") {
    return (
      <div style={screen}>
        {/* zone photo */}
        <div
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          style={{ border: "2px dashed #DBC9CF", borderRadius: 20, background: "#FBF3F5",
            padding: "22px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Camera size={30} color={C.coral} />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => fileRef.current.click()} style={{
              border: `1.5px solid ${C.coralBorder}`, background: "#fff", color: C.coralPressed,
              font: `700 13px ${F.body}`, padding: "10px 16px", borderRadius: 12, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}><ImageIcon size={16} />Galerie</button>
            <button onClick={() => camRef.current.click()} style={{
              border: "none", background: C.coral, color: "#fff", font: `700 13px ${F.body}`,
              padding: "10px 16px", borderRadius: 12, cursor: "pointer",
              boxShadow: "0 5px 13px rgba(240,60,100,.28)", display: "inline-flex", alignItems: "center", gap: 6,
            }}><Camera size={16} weight="fill" />Caméra</button>
          </div>
          <span style={{ font: `500 12px ${F.body}`, color: "#A98F98" }}>Jusqu'à 5 photos</span>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
          <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
        </div>

        {/* thumbs */}
        {images.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: "relative", flexShrink: 0 }}>
                <img src={img.url} alt="" style={{ width: 62, height: 62, borderRadius: 12, objectFit: "cover", display: "block" }} />
                <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))} style={{
                  position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%",
                  background: C.ink, color: "#fff", border: `2px solid ${C.canvas}`,
                  cursor: "pointer", fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
                }}>×</button>
              </div>
            ))}
            {images.length < 5 && (
              <button onClick={() => fileRef.current.click()} style={{
                width: 62, height: 62, borderRadius: 12, flexShrink: 0,
                border: "1.5px dashed #DBC9CF", background: "#FBF3F5",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#C98BA0", cursor: "pointer",
              }}><Plus size={16} /></button>
            )}
          </div>
        )}

        {/* infos */}
        <div style={{ ...lbl, margin: "18px 0 8px" }}>
          Infos <span style={{ color: C.muted4, textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>
            (optionnel — ce qui ne se voit pas sur les photos)
          </span>
        </div>
        <textarea value={infos} onChange={(e) => setInfos(e.target.value)} rows={2}
          placeholder="Marque, année, défaut, matière… seulement si la photo ne le montre pas ✨"
          style={{ ...fieldBox, width: "100%", resize: "vertical", font: `400 13.5px/1.5 ${F.body}`, color: C.ink, outline: "none" }} />

        {/* prix achat + provenance */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
          <div>
            <div style={{ ...lbl, marginBottom: 7 }}>Prix d'achat €</div>
            <input value={prixAchat} onChange={(e) => setPrixAchat(e.target.value)}
              type="number" inputMode="decimal" placeholder="0,5"
              style={{ ...fieldBox, width: "100%", font: `700 15px ${F.title}`, color: C.ink, outline: "none" }} />
          </div>
          <div>
            <div style={{ ...lbl, marginBottom: 7 }}>Provenance</div>
            <SourceSelect value={source?.id} onChange={setSource} />
          </div>
        </div>

        {/* pour */}
        <div style={{ ...lbl, margin: "16px 0 8px" }}>Pour</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPour("stock")} style={{
            flex: 1, borderRadius: 12, padding: 12, cursor: "pointer", font: `700 13px ${F.body}`,
            border: pour === "stock" ? "none" : `1.5px solid ${C.border}`,
            background: pour === "stock" ? C.ink : "#fff", color: pour === "stock" ? "#fff" : C.muted1,
          }}>Mon stock</button>
          <button onClick={() => setPour("malle")} style={{
            flex: 1, borderRadius: 12, padding: 12, cursor: "pointer", font: `700 13px ${F.body}`,
            border: pour === "malle" ? "none" : `1.5px solid ${C.border}`,
            background: pour === "malle" ? C.ink : "#fff", color: pour === "malle" ? "#fff" : C.muted1,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}><TreasureChest size={15} weight="fill" color={pour === "malle" ? "#fff" : C.muted2} />Une malle</button>
        </div>
        {pour === "malle" && malles.length > 0 && (
          <div style={{ marginTop: 8 }}><MalleSelect value={malleId} onChange={setMalleId} /></div>
        )}

        {error && <p style={{ color: C.coral, marginTop: 10, font: `700 13px ${F.body}` }}>{error}</p>}

        <button onClick={() => generer()} disabled={!images.length || generating} style={{
          width: "100%", border: "none", background: C.coral, color: "#fff",
          font: `700 15px ${F.body}`, padding: 16, borderRadius: 16, marginTop: 22, cursor: "pointer",
          boxShadow: SHADOW.coral, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          opacity: !images.length || generating ? 0.6 : 1,
        }}>
          <Sparkle size={18} weight="fill" />
          {generating ? "Génération…" : "Générer l'annonce"}
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════ PHASE RÉSULTAT ══
  const quickHints = ["Plus court", "Plus détaillé", "Autre ton"];

  return (
    <div style={screen}>
      {/* statut */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
        {images[0]?.url
          ? <img src={images[0].url} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
          : <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, background: C.photoStripe }} />
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: `700 12px ${F.body}`,
            color: C.greenDark, background: C.greenSoft, border: `1px solid ${C.greenSoftBorder}`,
            padding: "3px 10px", borderRadius: 999 }}>
            <Sparkle size={12} weight="fill" color={C.green} />
            {generating ? "Régénération…" : "Annonce prête"}
          </span>
          <div style={{ font: `500 12px ${F.body}`, color: C.muted2, marginTop: 4 }}>
            Copie chaque champ dans {plateforme === "vinted" ? "Vinted" : "LeBonCoin"}.
          </div>
        </div>
        <button onClick={reset} style={{ border: "none", background: "transparent", font: `600 12px ${F.body}`, color: C.muted2, cursor: "pointer" }}>
          Recommencer
        </button>
      </div>

      {/* plateforme */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => changePlateforme("vinted")} style={platBtn("vinted", C.vinted, C.vintedTint, C.vintedBorder)}>
          {plateforme === "vinted" && <CheckCircle size={15} weight="fill" />}Vinted
        </button>
        <button onClick={() => changePlateforme("lbc")} style={platBtn("lbc", "#C6551E", "#FDE8DA", "#F3C3A3")}>
          {plateforme === "lbc" && <CheckCircle size={15} weight="fill" />}LeBonCoin
        </button>
      </div>

      {/* titre */}
      <div style={{ ...card, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={lbl}>Titre</span>
          <CopyButton text={titre} onCopy={() => { titleCopiedRef.current = true; if (descCopiedRef.current) triggerAutoSave(); }} />
        </div>
        <textarea value={titre} onChange={(e) => setTitre(e.target.value)} rows={2}
          style={{ width: "100%", border: "none", resize: "vertical", outline: "none",
            background: "transparent", font: `600 14px/1.35 ${F.body}`, color: C.ink }} />
        <div style={{ fontSize: 10, color: titre.length > 50 ? C.coral : C.muted4, marginTop: 3 }}>
          {titre.length}/50
        </div>
      </div>

      {/* description */}
      <div style={{ ...card, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={lbl}>Description{plateforme === "vinted" ? " (hashtags inclus)" : ""}</span>
          <CopyButton text={desc} onCopy={() => { descCopiedRef.current = true; if (titleCopiedRef.current) triggerAutoSave(); }} />
        </div>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={6}
          style={{ width: "100%", border: "none", resize: "vertical", outline: "none",
            background: "transparent", font: `400 13px/1.6 ${F.body}`, color: "#4A4860" }} />
      </div>

      {/* identification vision */}
      {visionData && (visionData.bestGuess || visionData.entities?.length > 0) && (
        <div style={{ ...card, background: C.violetTint, border: `1.5px solid ${C.violet}20`, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <MagnifyingGlass size={13} weight="fill" color={C.violetText} />
            <span style={{ font: `700 11px ${F.body}`, color: C.violetText, textTransform: "uppercase", letterSpacing: ".05em" }}>Identification image</span>
          </div>
          {visionData.bestGuess && (
            <div style={{ font: `600 13px ${F.body}`, color: C.ink, marginBottom: 4 }}>
              {visionData.bestGuess}
            </div>
          )}
          {visionData.entities?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {visionData.entities.slice(0, 6).map((e, i) => (
                <span key={i} style={{ font: `500 11px ${F.body}`, color: C.violetText,
                  background: "#fff", border: `1px solid ${C.violet}40`,
                  padding: "3px 8px", borderRadius: 999 }}>{e}</span>
              ))}
            </div>
          )}
          {visionData.prices?.length > 0 && (
            <div style={{ font: `600 11px ${F.body}`, color: C.muted1, marginTop: 6 }}>
              Prix web : {Math.min(...visionData.prices)}–{Math.max(...visionData.prices)} €
            </div>
          )}
        </div>
      )}

      {/* prix conseillé */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={lbl}>Prix conseillé</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 3 }}>
              <span style={{ font: `800 22px ${F.title}`, color: C.ink, flexShrink: 0, minWidth: 60 }}>{prixListe} €</span>
              {result?.prix_note && (
                <span style={{ font: `600 11px ${F.body}`, color: C.amberText, background: C.amberSoft, padding: "2px 8px", borderRadius: 999 }}>
                  {result.prix_note}
                </span>
              )}
            </div>
          </div>
          <PencilSimple size={16} color={C.muted2} />
        </div>
      </div>

      {/* prix marché */}
      <div style={{ ...card, marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: marcheResults ? 10 : 0 }}>
          <div style={{ ...lbl }}>Prix marché</div>
          <button disabled={marcheLoading} onClick={async () => {
            setMarcheLoading(true);
            try {
              const res = await fetch("/api/price-search", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: titre, categorie: result?.categorie }),
              });
              const data = await res.json();
              setMarcheResults(data.results || []);
            } catch { setMarcheResults([]); }
            finally { setMarcheLoading(false); }
          }} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            font: `600 12px ${F.body}`, color: marcheLoading ? C.muted3 : C.coral,
            background: "none", border: `1.5px solid ${marcheLoading ? C.border : C.coralBorder}`,
            borderRadius: 999, padding: "5px 12px", cursor: marcheLoading ? "default" : "pointer",
          }}>
            {marcheLoading
              ? <><ArrowClockwise size={12} style={{ animation: "spin 0.8s linear infinite" }} /> Recherche…</>
              : <><MagnifyingGlass size={12} /> Rechercher</>}
          </button>
        </div>
        {marcheResults && marcheResults.length === 0 && !marcheLoading && (
          <div style={{ font: `400 12px ${F.body}`, color: C.muted2 }}>Aucun résultat trouvé — vérifie la configuration Google Search.</div>
        )}
        {marcheResults && marcheResults.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {marcheResults.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8,
                background: C.canvas, borderRadius: 10, padding: "8px 11px" }}>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ font: `600 11px ${F.body}`, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.titre}</div>
                  <div style={{ font: `400 10.5px ${F.body}`, color: C.muted2, marginTop: 1 }}>{r.source}</div>
                </div>
                <span style={{ font: `700 13px ${F.title}`, color: C.green, flexShrink: 0 }}>{r.prix} €</span>
              </div>
            ))}
            {marcheResults.length > 0 && (() => {
              const avg = Math.round(marcheResults.reduce((s, r) => s + r.prix, 0) / marcheResults.length);
              const min = Math.min(...marcheResults.map(r => r.prix));
              const max = Math.max(...marcheResults.map(r => r.prix));
              return (
                <div style={{ font: `600 11px ${F.body}`, color: C.muted1, textAlign: "center", paddingTop: 2 }}>
                  Fourchette : {min}–{max} € · Moy. {avg} €
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ajuster & régénérer */}
      <div style={{ ...card, marginTop: 16 }}>
        <div style={{ ...lbl, marginBottom: 9 }}>Ajuster &amp; régénérer</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
          {quickHints.map((h) => (
            <button key={h} onClick={() => { setRefine(h); generer(h); }} disabled={generating} style={chip()}>{h}</button>
          ))}
        </div>
        <textarea value={refine} onChange={(e) => setRefine(e.target.value)} rows={2}
          placeholder="Ou précise : marque, provenance, défaut à mentionner…"
          style={{ ...fieldBox, width: "100%", background: C.canvas, resize: "vertical",
            font: `400 13px/1.5 ${F.body}`, color: C.ink, outline: "none" }} />
        <button onClick={() => generer(refine)} disabled={generating} style={{
          width: "100%", border: "none", background: C.coral, color: "#fff",
          font: `700 14px ${F.body}`, padding: 13, borderRadius: 13, marginTop: 10, cursor: "pointer",
          boxShadow: "0 6px 15px rgba(240,60,100,.24)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
          opacity: generating ? 0.7 : 1,
        }}>
          <ArrowClockwise size={16} weight="fill" />
          {generating ? "Régénération…" : "Régénérer avec ma précision"}
        </button>
        <button onClick={onOpenAnnonceSettings} style={{
          width: "100%", border: "none", background: "transparent", cursor: "pointer",
          marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.divider}`,
          font: `600 12px ${F.body}`, color: C.muted2,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <GearSix size={14} />Mentions récurrentes (livraison, signature…){" "}
          <span style={{ color: C.coral }}>Paramètres</span>
        </button>
      </div>

      {/* enregistrer au prix réellement listé */}
      <div style={{ ...card, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
          <CheckCircle size={19} color={autoSavedId ? C.green : C.ink} />
          <span style={{ font: `500 12.5px/1.4 ${F.body}`, color: "#4A4860" }}>
            {autoSavedId
              ? <><b style={{ color: C.greenDark }}>Enregistré ✓</b> · Entre le prix réel et valide.</>
              : <>Après avoir collé sur {plateforme === "vinted" ? "Vinted" : "LeBonCoin"}, enregistre au{" "}<b style={{ color: C.ink }}>prix réellement listé</b>.</>
            }
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8,
            background: C.canvas, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "9px 13px" }}>
            <span style={{ font: `800 15px ${F.title}`, color: C.ink }}>€</span>
            <input value={prixListe} onChange={(e) => setPrixListe(e.target.value)}
              type="number" inputMode="decimal"
              style={{ border: "none", outline: "none", background: "transparent", width: "100%",
                font: `800 15px ${F.title}`, color: C.ink }} />
          </div>
          <button onClick={save} style={{
            flexShrink: 0, border: "none", background: C.coral, color: "#fff",
            font: `700 13px ${F.body}`, padding: "12px 16px", borderRadius: 12, cursor: "pointer",
            boxShadow: "0 5px 13px rgba(240,60,100,.26)",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}><CheckCircle size={16} weight="fill" />Enregistrer</button>
        </div>
        {error && <p style={{ color: C.coral, marginTop: 8, font: `700 13px ${F.body}` }}>{error}</p>}
      </div>
    </div>
  );
}
