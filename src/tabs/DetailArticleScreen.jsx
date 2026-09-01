// DetailArticleScreen.jsx — Détail d'un article, plein écran, V7
// Suit DetailArticle.jsx du handoff — onglet Suivi & prix par défaut + Annonce.
// Header avec flèche retour (écran poussé au-dessus de l'Inventaire).
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { callAI } from "../lib/ai";
import { listMalles } from "../lib/malles";
import { SourceSelect } from "../components/SourceSelect";
import { TagSelect } from "../components/TagSelect";
import {
  ArrowLeft, Check, Copy, ArrowClockwise, Lightbulb, Trash,
} from "@phosphor-icons/react";

// ─── tokens ────────────────────────────────────────────────────────────────
const C = {
  canvas: "#F6F2EC", surface: "#FFFFFF", ink: "#1C1B3A",
  muted1: "#6B6980", muted2: "#8A879B", muted3: "#9C99AB", muted4: "#B7AE9E",
  border: "#E3DCD0", divider: "#F0EBE3",
  coral: "#F03C64", coralPressed: "#C22A50", coralTint: "#FFF0F2", coralBorder: "#F0B6C4",
  green: "#2FA96A", greenDark: "#1E8A57", greenTint: "#DDF1E6", greenSoft: "#EDF7F1",
  amber: "#E0912F", amberText: "#B0651B", amberTint: "#FBEAD1",
  violet: "#A56BE0", violetText: "#8B4FC9", violetTint: "#F0E7FA",
  vinted: "#0B7A73", vintedTint: "#DEF3F1", vintedBorder: "#9FD9D3",
  photoStripe: "repeating-linear-gradient(135deg,#F1ECE4,#F1ECE4 6px,#E9E1D5 6px,#E9E1D5 12px)",
};
const F = { title: "'Bricolage Grotesque', system-ui, sans-serif", body: "'Hanken Grotesk', system-ui, sans-serif" };
const SHADOW = { card: "0 2px 10px rgba(28,27,58,.05)" };

const screen = {
  width: "100%", maxWidth: 480, margin: "0 auto", boxSizing: "border-box",
  padding: "16px 18px 128px", background: C.canvas, minHeight: "100%", fontFamily: F.body, color: C.ink,
};
const lbl = { font: `700 11px ${F.body}`, letterSpacing: ".06em", color: C.muted2, textTransform: "uppercase" };
const card = { background: C.surface, borderRadius: 16, padding: "14px 15px", boxShadow: SHADOW.card, boxSizing: "border-box" };
const field = { background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "13px 15px", boxSizing: "border-box" };

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); } catch {}
    setDone(true); setTimeout(() => setDone(false), 1500);
  };
  return (
    <button onClick={copy} style={{ border: "none", background: done ? C.green : C.coral, color: "#fff",
      font: `700 12px ${F.body}`, padding: "7px 14px", borderRadius: 10, cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 6,
      boxShadow: done ? "none" : "0 4px 11px rgba(240,60,100,.26)", transition: "background .2s" }}>
      {done ? <Check size={14} weight="bold" /> : <Copy size={14} weight="fill" />}
      {done ? "Copié" : "Copier"}
    </button>
  );
}

export function DetailArticleScreen({ item, onBack, onSave, onDelete }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const a = item || {};

  const [tab, setTab] = useState("suivi");
  const [name, setName] = useState(a.name || "");
  const [desc, setDesc] = useState(a.description || "");
  const [tagIds, setTagIds] = useState(a.tagIds || []);
  const [plateforme, setPlateforme] = useState(a.plateformes?.[0] === "leboncoin" ? "LBC" : "Vinted");
  const [sourceObj, setSourceObj] = useState({ id: a.sourceId || null, nom: a.source || "", type: null });
  const [malleId, setMalleId] = useState(a.malleId || null);
  const [statut, setStatut] = useState(a.statut || "en-attente");
  const [achat, setAchat] = useState(a.prixAchat ?? "");
  const [prixListe, setPrixListe] = useState(a.prixAffiche ?? "");
  const [venteReel, setVenteReel] = useState(a.prixVente ?? "");
  const [venduAtDate, setVenduAtDate] = useState(a.venduAt ? a.venduAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [commissionPct, setCommissionPct] = useState(a.commissionPct ?? 0);
  const [reversePaye, setReversePaye] = useState(a.reversePaye || false);
  const [dateReversement, setDateReversement] = useState(a.dateReversement || new Date().toISOString().slice(0, 10));
  const [malles, setMalles] = useState([]);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState("");

  useEffect(() => {
    listMalles(user.id).then(setMalles).catch(() => {});
  }, [user.id]);

  const isDepotVente = sourceObj?.type === "depot_vente";
  const currentMalle = malles.find(m => m.id === malleId);
  const mallePct = currentMalle?.commissionPct ?? 0;

  const toN = v => v === "" || v == null ? null : (n => isNaN(n) ? null : n)(Number(String(v).replace(",", ".")));
  const base = toN(venteReel) ?? toN(prixListe);
  const marge = base != null && toN(achat) != null ? +(base - toN(achat)).toFixed(2) : null;

  const handleSourceChange = (src) => {
    setSourceObj(src ? { id: src.id, nom: src.nom, type: src.type } : { id: null, nom: "", type: null });
    if (src?.type === "depot_vente") setCommissionPct(src.commissionPct || 0);
  };

  const regenerate = async () => {
    if (!a.image) return;
    setRegenerating(true); setRegenError("");
    try {
      let imagePayload;
      if (a.image.startsWith("data:")) {
        const [, meta, data] = a.image.match(/^data:([^;]+);base64,(.+)$/) || [];
        imagePayload = { data, type: meta || "image/jpeg" };
      } else {
        imagePayload = { url: a.image };
      }
      const r = await callAI([imagePayload], name, user?.user_metadata?.full_name);
      setDesc((r.description_vinted || "") + (r.hashtags?.length ? "\n\n" + r.hashtags.map(h => "#" + h.replace(/^#/, "")).join(" ") : ""));
    } catch (err) { setRegenError(err?.message || "Erreur de régénération. Réessaie."); }
    setRegenerating(false);
  };

  const save = () => {
    const plateformes = [plateforme === "LBC" ? "leboncoin" : "vinted"];
    const malleCommissionPct = mallePct;
    onSave?.({
      ...a, name, description: desc, tagIds, plateformes,
      sourceId: sourceObj?.id || null, source: sourceObj?.nom || "",
      statut, prixAchat: String(achat), prixAffiche: String(prixListe),
      prixVente: String(venteReel), commissionPct, reversePaye, dateReversement,
      malleId, malleCommissionPct,
      venduAt: statut === "vendu" ? (venduAtDate ? new Date(venduAtDate + "T12:00:00").toISOString() : a.venduAt) : null,
    }, sourceObj?.type);
  };

  const handleDelete = () => {
    if (window.confirm("Supprimer cet article définitivement ?")) {
      onDelete?.(a.id);
      onBack?.();
    }
  };

  const statutStyle = {
    "en-vente":  { fg: C.amberText, bg: C.amberTint, dot: C.amber,   label: "En vente" },
    vendu:       { fg: C.greenDark,  bg: C.greenTint, dot: C.green,   label: "Vendu" },
    "en-attente":{ fg: "#5B5975",    bg: "#ECEAF0",   dot: C.muted3,  label: "En attente" },
  }[statut] || { fg: "#5B5975", bg: "#ECEAF0", dot: C.muted3, label: "En attente" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 55, overflowY: "auto",
      background: C.canvas, animation: "fadeUp .2s ease both" }}>
      <div style={screen}>
        {/* header : flèche retour + bouton sauvegarder */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", background: "#fff",
            border: "none", boxShadow: "0 1px 4px rgba(28,27,58,.08)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ArrowLeft size={17} weight="bold" color={C.ink} />
          </button>
          <span style={{ font: `700 16px ${F.title}`, color: C.ink }}>Détail de l'article</span>
          <button onClick={save} style={{ width: 36, height: 36, borderRadius: "50%", background: C.coral,
            border: "none", boxShadow: "0 5px 12px rgba(240,60,100,.3)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Check size={17} weight="bold" color="#fff" />
          </button>
        </div>

        {/* item strip */}
        <div style={{ display: "flex", gap: 11, alignItems: "center", marginBottom: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 13, flexShrink: 0,
            background: a.image ? `center/cover url(${a.image})` : C.photoStripe }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ font: `700 14px/1.25 ${F.title}`, color: C.ink,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name || "Sans titre"}
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
              font: `700 10.5px ${F.body}`, color: statutStyle.fg, background: statutStyle.bg,
              padding: "3px 8px", borderRadius: 999, marginTop: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: statutStyle.dot }} />
              {statutStyle.label} · {plateforme}
            </span>
          </div>
        </div>

        {/* onglets segmentés */}
        <div style={{ display: "flex", gap: 6, background: "#EAE4DA", borderRadius: 14,
          padding: 4, marginBottom: 16 }}>
          {[["suivi", "Suivi & prix"], ["annonce", "Annonce"]].map(([id, label]) => {
            const on = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} style={{ flex: 1, textAlign: "center",
                font: `700 13px ${F.body}`, borderRadius: 10, padding: 10, cursor: "pointer", border: "none",
                color: on ? "#fff" : "#8A7F70", background: on ? C.ink : "transparent",
                boxShadow: on ? "0 2px 6px rgba(28,27,58,.2)" : "none" }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* ══════════ ONGLET ANNONCE ══════════ */}
        {tab === "annonce" && (
          <>
            {/* titre */}
            <div style={{ ...card, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={lbl}>Titre</span>
                <CopyBtn text={name} />
              </div>
              <textarea value={name} onChange={e => setName(e.target.value)} rows={2}
                style={{ width: "100%", border: "none", resize: "vertical", outline: "none",
                  background: "transparent", font: `600 14px/1.35 ${F.body}`, color: C.ink }} />
            </div>

            {/* description */}
            <div style={{ ...card, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={lbl}>
                  Description
                  {plateforme === "Vinted" && <span style={{ color: C.vinted }}> · #hashtags inclus</span>}
                </span>
                <CopyBtn text={desc} />
              </div>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={6}
                style={{ width: "100%", border: "none", resize: "vertical", outline: "none",
                  background: "transparent", font: `400 13px/1.6 ${F.body}`, color: "#4A4860" }} />
              <button onClick={regenerate} disabled={!a.image || regenerating}
                style={{ width: "100%", marginTop: 11, border: `1.5px solid ${C.border}`,
                  background: "#fff", color: C.ink, font: `700 12.5px ${F.body}`, padding: 10,
                  borderRadius: 11, cursor: !a.image ? "default" : "pointer",
                  opacity: regenerating || !a.image ? 0.5 : 1,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <ArrowClockwise size={14} />{regenerating ? "Régénération…" : "Régénérer l'annonce"}
              </button>
              {regenError && <p style={{ font: `400 12px ${F.body}`, color: C.coral, margin: "8px 0 0" }}>{regenError}</p>}
            </div>

            {/* tags */}
            <div style={{ ...lbl, margin: "16px 0 8px" }}>Tags</div>
            <TagSelect value={tagIds} onChange={setTagIds} />
          </>
        )}

        {/* ══════════ ONGLET SUIVI & PRIX ══════════ */}
        {tab === "suivi" && (
          <>
            {/* hero navy marge */}
            <div style={{ background: C.ink, borderRadius: 18, padding: "16px 18px", color: "#fff",
              marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ font: `600 11px ${F.body}`, color: "#B7B5C8",
                  textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Marge {venteReel !== "" ? "réelle" : "estimée"}
                </div>
                <div style={{ font: `800 26px ${F.title}`, marginTop: 3 }}>
                  {marge != null ? `${marge >= 0 ? "+" : ""}${marge} €` : "—"}
                </div>
              </div>
              {a.prixRecommande && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ font: `600 11px ${F.body}`, color: "#B7B5C8" }}>Reco IA</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5,
                    font: `700 13px ${F.body}`, color: "#FFDCE4", marginTop: 3 }}>
                    <Lightbulb size={14} weight="fill" color="#FFC24B" />{a.prixRecommande} €
                  </div>
                </div>
              )}
            </div>

            {/* prix achat / listé */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ ...lbl, marginBottom: 7 }}>Prix d'achat €</div>
                <input value={achat} onChange={e => setAchat(e.target.value)} inputMode="decimal"
                  style={{ ...field, width: "100%", font: `700 15px ${F.title}`, color: C.ink, outline: "none" }} />
              </div>
              <div>
                <div style={{ ...lbl, marginBottom: 7 }}>Prix listé €</div>
                <input value={prixListe} onChange={e => setPrixListe(e.target.value)} inputMode="decimal"
                  style={{ ...field, width: "100%", font: `700 15px ${F.title}`, color: C.ink, outline: "none" }} />
              </div>
            </div>

            {/* prix vente réel */}
            <div style={{ marginTop: 12 }}>
              <div style={{ ...lbl, marginBottom: 7 }}>
                Prix de vente réel €{" "}
                <span style={{ color: C.muted4, textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>
                  · au moment de la vente
                </span>
              </div>
              <input value={venteReel} onChange={e => {
                setVenteReel(e.target.value);
                if (e.target.value && statut !== "vendu") setStatut("vendu");
              }} inputMode="decimal" placeholder="—"
                style={{ ...field, width: "100%", font: `600 14px ${F.body}`, color: C.ink, outline: "none" }} />
            </div>

            {/* date de vente */}
            {statut === "vendu" && (
              <div style={{ marginTop: 12 }}>
                <div style={{ ...lbl, marginBottom: 7 }}>Date de vente</div>
                <input type="date" value={venduAtDate} onChange={e => setVenduAtDate(e.target.value)}
                  style={{ ...field, width: "100%", font: `600 14px ${F.body}`, color: C.ink, outline: "none" }} />
              </div>
            )}

            {/* statut + plateforme */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
              <div>
                <div style={{ ...lbl, marginBottom: 7 }}>Statut</div>
                <select value={statut} onChange={e => setStatut(e.target.value)}
                  style={{ ...field, width: "100%", font: `600 13px ${F.body}`, color: C.ink,
                    outline: "none", cursor: "pointer" }}>
                  <option value="en-attente">En attente</option>
                  <option value="en-vente">En vente</option>
                  <option value="vendu">Vendu</option>
                </select>
              </div>
              <div>
                <div style={{ ...lbl, marginBottom: 7 }}>Plateforme</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["Vinted", "LBC"].map(p => {
                    const on = plateforme === p;
                    return (
                      <button key={p} onClick={() => setPlateforme(p)} style={{ flex: 1, textAlign: "center",
                        font: `700 12px ${F.body}`, borderRadius: 12, padding: "13px 4px", cursor: "pointer",
                        color: on ? C.vinted : C.muted3, background: on ? C.vintedTint : "#fff",
                        border: `1.5px solid ${on ? C.vintedBorder : C.border}` }}>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* source */}
            <div style={{ marginTop: 16 }}>
              <div style={{ ...lbl, marginBottom: 7 }}>Source</div>
              <SourceSelect value={sourceObj?.id} onChange={handleSourceChange} />
            </div>

            {/* malle */}
            {malles.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ ...lbl, marginBottom: 7 }}>Malle</div>
                <select value={malleId || ""} onChange={e => setMalleId(e.target.value || null)}
                  style={{ ...field, width: "100%", font: `600 13px ${F.body}`, color: C.ink,
                    outline: "none", cursor: "pointer" }}>
                  <option value="">Mes articles perso</option>
                  {malles.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              </div>
            )}

            {/* dépôt-vente */}
            {isDepotVente && (
              <div style={{ ...card, marginTop: 14 }}>
                <div style={{ ...lbl, marginBottom: 10 }}>Dépôt-vente</div>
                <div style={{ ...lbl, marginBottom: 7 }}>Commission %</div>
                <input type="number" value={commissionPct} onChange={e => setCommissionPct(Number(e.target.value))}
                  style={{ ...field, width: "100%", font: `600 14px ${F.body}`, color: C.ink, outline: "none", marginBottom: 10 }} />
                {statut === "vendu" && venteReel && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <span style={{ font: `700 12px ${F.body}`, color: C.amberText,
                      background: C.amberTint, padding: "5px 12px", borderRadius: 999 }}>
                      Doit {(parseFloat(venteReel) * (1 - commissionPct / 100)).toFixed(2)} €
                    </span>
                    {reversePaye ? (
                      <span style={{ font: `500 12px ${F.body}`, color: C.muted2 }}>
                        ✓ Reversé le {dateReversement}
                      </span>
                    ) : (
                      <>
                        <input type="date" value={dateReversement}
                          onChange={e => setDateReversement(e.target.value)}
                          style={{ ...field, font: `500 13px ${F.body}`, color: C.ink, outline: "none" }} />
                        <button onClick={() => setReversePaye(true)} style={{ background: C.ink, color: "#fff",
                          border: "none", borderRadius: 10, padding: "8px 14px",
                          font: `700 12px ${F.body}`, cursor: "pointer" }}>
                          Marquer payé
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* malle — reversal section */}
            {malleId && currentMalle && (
              <div style={{ ...card, marginTop: 14 }}>
                <div style={{ ...lbl, marginBottom: 10 }}>Malle · {currentMalle.nom}</div>
                {statut === "vendu" && venteReel ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <span style={{ font: `700 12px ${F.body}`, color: C.violetText,
                      background: C.violetTint, padding: "5px 12px", borderRadius: 999 }}>
                      À reverser {(parseFloat(venteReel) * (1 - mallePct / 100)).toFixed(2)} €
                      {mallePct > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>({mallePct}%)</span>}
                    </span>
                    {reversePaye ? (
                      <span style={{ font: `500 12px ${F.body}`, color: C.muted2 }}>
                        ✓ Reversé le {dateReversement}
                      </span>
                    ) : (
                      <>
                        <input type="date" value={dateReversement}
                          onChange={e => setDateReversement(e.target.value)}
                          style={{ ...field, font: `500 13px ${F.body}`, color: C.ink, outline: "none" }} />
                        <button onClick={() => setReversePaye(true)} style={{ background: C.ink, color: "#fff",
                          border: "none", borderRadius: 10, padding: "8px 14px",
                          font: `700 12px ${F.body}`, cursor: "pointer" }}>
                          Marquer payé
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <p style={{ font: `400 12px ${F.body}`, color: C.muted2, margin: 0 }}>
                    Le montant à reverser sera calculé à la vente.
                  </p>
                )}
              </div>
            )}

            {/* supprimer */}
            <button onClick={handleDelete} style={{ width: "100%", marginTop: 18,
              border: `1.5px solid #F0C6D0`, background: "#fff", color: C.coralPressed,
              font: `700 13px ${F.body}`, padding: 13, borderRadius: 14, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <Trash size={16} />Supprimer l'article
            </button>
          </>
        )}
      </div>
    </div>
  );
}
