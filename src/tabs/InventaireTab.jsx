// InventaireTab.jsx — Écran Inventaire V7 (suit Inventaire.jsx du handoff)
// Header sans flèche retour. Recherche + Filtres (bottom sheet). Statuts chips. Cards V7.
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { listCategories } from "../lib/categories";
import { listSources } from "../lib/sources";
import { listMalles } from "../lib/malles";
import {
  MagnifyingGlass, SlidersHorizontal, CheckCircle, X, Sparkle,
} from "@phosphor-icons/react";

// ─── tokens ────────────────────────────────────────────────────────────────
const C = {
  canvas: "#F6F2EC", surface: "#FFFFFF", ink: "#1C1B3A",
  muted1: "#6B6980", muted2: "#8A879B", muted3: "#9C99AB", muted4: "#B7AE9E",
  border: "#E3DCD0", divider: "#F0EBE3",
  coral: "#F03C64", coralPressed: "#C22A50",
  green: "#2FA96A", greenDark: "#1E8A57", greenTint: "#DDF1E6", greenSoft: "#EDF7F1",
  amber: "#E0912F", amberText: "#B0651B", amberTint: "#FBEAD1",
  violet: "#A56BE0", violetText: "#8B4FC9", violetTint: "#F0E7FA",
  vinted: "#0B7A73", vintedTint: "#DEF3F1",
  photoStripe: "repeating-linear-gradient(135deg,#F1ECE4,#F1ECE4 6px,#E9E1D5 6px,#E9E1D5 12px)",
};
const F = { title: "'Bricolage Grotesque', system-ui, sans-serif", body: "'Hanken Grotesk', system-ui, sans-serif" };
const SHADOW = { cardHi: "0 4px 14px rgba(28,27,58,.08)" };

const screen = {
  width: "100%", maxWidth: 480, margin: "0 auto", boxSizing: "border-box",
  padding: "20px 18px 128px", background: C.canvas, minHeight: "100%", fontFamily: F.body, color: C.ink,
};

const STATUTS = [
  { id: "tous",       label: "Tous",     color: null },
  { id: "en-vente",   label: "En vente", color: { fg: C.amberText, bd: "#F1D9B8" } },
  { id: "vendu",      label: "Vendus",   color: { fg: C.greenDark, bd: "#C6E7D3" } },
];

function StatutBadge({ statut }) {
  const map = {
    "en-vente": { t: "En vente", fg: C.amberText, bg: C.amberTint, dot: C.amber },
    vendu:      { t: "Vendu",    fg: C.greenDark,  bg: C.greenTint, dot: C.green },
    "en-attente":{ t: "En attente", fg: "#5B5975", bg: "#ECEAF0",   dot: C.muted3 },
  };
  const s = map[statut] || map["en-attente"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, font: `700 10.5px ${F.body}`,
      color: s.fg, background: s.bg, padding: "3px 8px", borderRadius: 999 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />{s.t}
    </span>
  );
}

function Card({ item, sourcesById, mallesById, onMarkSold, onOpen }) {
  const shownPrice = item.statut === "vendu"
    ? (parseFloat(item.prixVente) || parseFloat(item.prixAffiche) || null)
    : (parseFloat(item.prixAffiche) || null);
  const achat = (item.prixAchat !== null && item.prixAchat !== "") ? parseFloat(item.prixAchat) : 0;
  let commission = 0;
  if (item.malleId) {
    if (item.statut === "vendu" && item.montantAReverser) {
      commission = parseFloat(item.montantAReverser);
    } else if (item.statut === "en-vente" && shownPrice != null) {
      const commPct = mallesById?.[item.malleId]?.commissionPct ?? 0;
      commission = Math.round(shownPrice * (1 - commPct / 100) * 100) / 100;
    }
  }
  const margin = shownPrice != null && achat != null ? +(shownPrice - achat - commission).toFixed(2) : null;
  const platLabel = item.plateformes?.[0] === "leboncoin" ? "LBC" : "Vinted";

  return (
    <div style={{ background: C.surface, borderRadius: 18, padding: 12, boxShadow: SHADOW.cardHi, marginBottom: 11 }}>
      <div onClick={() => onOpen(item)} style={{ display: "flex", gap: 12, cursor: "pointer" }}>
        <div style={{ width: 76, height: 76, borderRadius: 14, flexShrink: 0,
          background: item.image ? `center/cover url(${item.image})` : C.photoStripe }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: `700 14px/1.25 ${F.title}`, color: C.ink,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.name}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginTop: 6 }}>
            <StatutBadge statut={item.statut} />
            <span style={{ font: `700 10.5px ${F.body}`, color: C.vinted, background: C.vintedTint,
              padding: "3px 8px", borderRadius: 999 }}>{platLabel}</span>
            {item.source && (
              <span style={{ font: `600 10.5px ${F.body}`, color: C.muted2 }}>{item.source}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 9,
            borderTop: `1px solid ${C.divider}` }}>
            <span style={{ font: `800 20px ${F.title}`, color: C.ink, letterSpacing: "-.01em" }}>
              {shownPrice != null ? `${shownPrice} €` : "—"}
            </span>
            <span style={{ font: `600 10.5px ${F.body}`, color: C.muted3 }}>
              {item.statut === "vendu" ? "vendu" : "listé"}
              {achat != null ? ` · achat ${achat} €` : ""}
            </span>
            {margin != null ? (
              <span style={{ marginLeft: "auto", font: `800 12.5px ${F.body}`, color: C.greenDark,
                background: C.greenSoft, padding: "4px 10px", borderRadius: 999 }}>
                +{margin} €
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {item.statut === "en-vente" && (
        <button onClick={() => onMarkSold(item)} style={{ width: "100%", marginTop: 11,
          border: `1.5px solid #C6E7D3`, background: "#fff", color: C.greenDark,
          font: `700 12.5px ${F.body}`, padding: 10, borderRadius: 12, cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <CheckCircle size={16} weight="fill" />Marquer vendu
        </button>
      )}
    </div>
  );
}

function FilterSheet({ open, onClose, onClearAll, sources, categories, malles,
  sourceFilter, tagFilter, malleFilter, onSourceToggle, onTagToggle, onMalleChange,
  statut, onStatutChange, enAttenteCount }) {
  if (!open) return null;
  const anyActive = sourceFilter.length > 0 || tagFilter.length > 0 || malleFilter !== "tout" || statut === "en-attente";
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 48,
        background: "rgba(28,27,58,.3)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 49,
        background: C.surface, borderRadius: "22px 22px 0 0",
        padding: "20px 18px 44px", boxShadow: "0 -8px 30px rgba(28,27,58,.15)",
        maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <span style={{ font: `700 16px ${F.title}`, color: C.ink }}>Filtres</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {anyActive && (
              <button onClick={onClearAll} style={{ font: `600 12px ${F.body}`, color: C.coralPressed,
                background: "none", border: "none", cursor: "pointer" }}>Effacer tout</button>
            )}
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%",
              background: "#F0EBE3", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={15} color={C.ink} />
            </button>
          </div>
        </div>
        <Section label="Statut">
          <Chip label={`En attente · ${enAttenteCount}`} on={statut === "en-attente"} onClick={() => onStatutChange(statut === "en-attente" ? "tous" : "en-attente")} />
        </Section>
        {sources.length > 0 && (
          <Section label="Sources">
            {sources.map(s => {
              const on = sourceFilter.includes(s.id);
              return <Chip key={s.id} label={s.nom} on={on} onClick={() => onSourceToggle(s.id)} />;
            })}
          </Section>
        )}
        {categories.length > 0 && (
          <Section label="Tags">
            {categories.map(c => {
              const on = tagFilter.includes(c.id);
              return <Chip key={c.id} label={c.nom} on={on} onClick={() => onTagToggle(c.id)} />;
            })}
          </Section>
        )}
        {malles.length > 0 && (
          <Section label="Malles">
            {[{ id: "tout", nom: "Toutes" }, { id: "moi", nom: "Mes articles" }, ...malles].map(m => {
              const on = malleFilter === m.id;
              return <Chip key={m.id} label={m.nom} on={on} onClick={() => onMalleChange(m.id)} />;
            })}
          </Section>
        )}
      </div>
    </>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ font: `700 10.5px ${F.body}`, letterSpacing: ".06em", color: C.muted2,
        textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{children}</div>
    </div>
  );
}

function Chip({ label, on, onClick }) {
  return (
    <button onClick={onClick} style={{ borderRadius: 999, padding: "8px 14px", cursor: "pointer",
      font: `${on ? 700 : 600} 13px ${F.body}`,
      color: on ? "#fff" : C.ink, background: on ? C.ink : "#fff",
      border: on ? "none" : `1.5px solid ${C.border}` }}>
      {label}
    </button>
  );
}

export function InventaireTab({ items, onUpdate, onDelete, onItemPatched, onGoToGenerer, onOpenDetail }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState("tous");
  const [filterOpen, setFilterOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState([]);
  const [sourceFilter, setSourceFilter] = useState([]);
  const [malleFilter, setMalleFilter] = useState("tout");
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  const [sourcesById, setSourcesById] = useState({});
  const [malles, setMalles] = useState([]);
  const [mallesById, setMallesById] = useState({});

  useEffect(() => {
    listCategories(user.id).then(setCategories).catch(() => {});
    listSources(user.id).then((srcs) => {
      setSources(srcs);
      setSourcesById(Object.fromEntries(srcs.map((s) => [s.id, s])));
    }).catch(() => {});
    listMalles(user.id).then((ms) => {
      setMalles(ms);
      setMallesById(Object.fromEntries(ms.map((m) => [m.id, m])));
    }).catch(() => {});
  }, [user.id]);

  const counts = useMemo(() => ({
    tous:        items.length,
    "en-vente":  items.filter(i => i.statut === "en-vente").length,
    vendu:       items.filter(i => i.statut === "vendu").length,
    "en-attente":items.filter(i => i.statut === "en-attente").length,
  }), [items]);

  const activeFilterCount = sourceFilter.length + tagFilter.length + (malleFilter !== "tout" ? 1 : 0) + (statut === "en-attente" ? 1 : 0);

  const filtered = useMemo(() => items.filter(i => {
    if (statut === "en-vente"   && i.statut !== "en-vente")   return false;
    if (statut === "vendu"      && i.statut !== "vendu")       return false;
    if (statut === "en-attente" && i.statut !== "en-attente") return false;
    if (tagFilter.length    > 0 && !tagFilter.some(id => (i.tagIds || []).includes(id)))   return false;
    if (sourceFilter.length > 0 && !sourceFilter.includes(i.sourceId))                     return false;
    if (malleFilter === "moi"   && i.malleId)                  return false;
    if (malleFilter !== "tout"  && malleFilter !== "moi" && i.malleId !== malleFilter) return false;
    if (q && !(`${i.name} ${i.source}`).toLowerCase().includes(q.toLowerCase()))      return false;
    return true;
  }).sort((a, b) => {
    if (statut === "vendu") {
      return new Date(b.venduAt || 0) - new Date(a.venduAt || 0);
    }
    return 0;
  }), [items, statut, tagFilter, sourceFilter, malleFilter, q, sourcesById]);

  const markSold = async (item) => {
    const input = window.prompt("Prix de vente réel (€) ?", item.prixAffiche || "");
    if (input === null) return;
    const sourceType = sourcesById[item.sourceId]?.type;
    const malleCommissionPct = item.malleId ? (mallesById[item.malleId]?.commissionPct ?? 0) : 0;
    try {
      await onUpdate({ ...item, statut: "vendu", prixVente: input, malleCommissionPct }, sourceType);
      showToast("✓ Marqué vendu");
    } catch (err) { showToast("✗ " + (err?.message || "Erreur")); }
  };

  const toggleTag    = (id) => setTagFilter(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleSource = (id) => setSourceFilter(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const clearAll     = () => { setSourceFilter([]); setTagFilter([]); setMalleFilter("tout"); setStatut("tous"); };

  return (
    <div style={screen}>
      {/* recherche + filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, background: "#fff",
          border: `1.5px solid ${C.border}`, borderRadius: 13, padding: "11px 14px" }}>
          <MagnifyingGlass size={16} color={C.muted2} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un article…"
            style={{ border: "none", outline: "none", background: "transparent",
              width: "100%", font: `400 13.5px ${F.body}`, color: C.ink }} />
        </div>
        <button onClick={() => setFilterOpen(true)} style={{ flexShrink: 0, width: 46,
          border: `1.5px solid ${C.border}`, background: "#fff", borderRadius: 13,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", cursor: "pointer" }}>
          <SlidersHorizontal size={18} color={C.ink} />
          {activeFilterCount > 0 && (
            <span style={{ position: "absolute", top: -5, right: -5, minWidth: 17, height: 17,
              padding: "0 4px", borderRadius: 999, background: C.coral, color: "#fff",
              font: `800 9px ${F.body}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* statuts en chips */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {STATUTS.map(s => {
          const on = statut === s.id;
          const cnt = counts[s.id] ?? 0;
          return (
            <button key={s.id} onClick={() => setStatut(s.id)} style={{ flexShrink: 0, cursor: "pointer",
              borderRadius: 999, font: `${on ? 700 : 600} 12.5px ${F.body}`, padding: "8px 14px",
              color: on ? "#fff" : (s.color ? s.color.fg : C.ink),
              background: on ? C.ink : "#fff",
              border: on ? "none" : `1.5px solid ${s.color ? s.color.bd : C.border}` }}>
              {s.label} · {cnt}
            </button>
          );
        })}
      </div>

      {/* cards */}
      {filtered.map(it => (
        <Card key={it.id} item={it} sourcesById={sourcesById} mallesById={mallesById}
          onOpen={onOpenDetail} onMarkSold={markSold} />
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ font: `500 13px ${F.body}`, color: C.muted3, marginBottom: 16 }}>
            Aucun article pour ce filtre.
          </p>
          {items.length === 0 && onGoToGenerer && (
            <button onClick={onGoToGenerer} style={{ border: "none", background: C.coral, color: "#fff",
              font: `700 14px ${F.body}`, padding: "13px 22px", borderRadius: 14, cursor: "pointer",
              boxShadow: "0 8px 20px rgba(240,60,100,.28)",
              display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Sparkle size={16} weight="fill" />Générer ta première annonce
            </button>
          )}
        </div>
      )}

      <FilterSheet
        open={filterOpen} onClose={() => setFilterOpen(false)} onClearAll={clearAll}
        sources={sources} categories={categories} malles={malles}
        sourceFilter={sourceFilter} tagFilter={tagFilter} malleFilter={malleFilter}
        onSourceToggle={toggleSource} onTagToggle={toggleTag} onMalleChange={setMalleFilter}
        statut={statut} onStatutChange={setStatut} enAttenteCount={counts["en-attente"]}
      />
    </div>
  );
}
