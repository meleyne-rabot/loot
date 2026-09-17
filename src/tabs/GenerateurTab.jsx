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
  Copy, Check, CheckCircle, TreasureChest, PencilSimple, GearSix, Plus,
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
async function getPriceCalibrationNote(userId) {
  try {
    const items = await listItems(userId);
    const withReco = items.filter((i) => parseFloat(i.prixRecommande) > 0 && parseFloat(i.prixAffiche) > 0);
    if (withReco.length < 3) return "";
    const avg = Math.round(
      withReco.reduce((s, i) => s + ((parseFloat(i.prixAffiche) - parseFloat(i.prixRecommande)) / parseFloat(i.prixRecommande)) * 100, 0) / withReco.length
    );
    if (Math.abs(avg) < 3) return "";
    return `L'utilisatrice liste en moyenne à ${avg >= 0 ? "+" : ""}${avg}% vs tes recos (${withReco.length} articles). Baisse ton prix_recommande de ${Math.abs(avg)}% par rapport à ta valeur marché habituelle.`;
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
  const [autoSavedId, setAutoSavedId] = useState(null); // id de l'item auto-sauvegardé

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
      setAutoSavedId(created?.id || true);
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
    setGenerating(true); setError("");
    titleCopiedRef.current = false;
    descCopiedRef.current = false;
    setAutoSavedId(null);
    autoSavingRef.current = false;
    try {
      const calibNote = await getPriceCalibrationNote(user.id);
      const prefs = loadPrefs(user.id);
      const ctx = [infos, hint ? `Précision : ${hint}` : ""].filter(Boolean).join("\n\n");
      const r = await callAI(images, ctx, user?.user_metadata?.full_name, calibNote, prefs);
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

  function changePlateforme(plat) {
    setPlateforme(plat);
    if (result) setDesc(getDesc(result, plat));
  }

  const reset = () => {
    autoSavingRef.current = false;
    titleCopiedRef.current = false;
    descCopiedRef.current = false;
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

      if (autoSavedId && autoSavedId !== true && onUpdate) {
        // Article déjà auto-sauvegardé — on met à jour le prix et la description
        await onUpdate({ ...itemData, id: autoSavedId }, source?.type);
        showToast("✓ Prix mis à jour dans l'inventaire");
      } else if (!autoSavedId) {
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
