import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { loadPrefs, savePrefs } from "../lib/prefs";
import { listSources, createSource, deleteSource, forceDeleteSource } from "../lib/sources";
import { listCategories, createCategory, deleteCategory, forceDeleteCategory } from "../lib/categories";
import { Sparkle, MapPin, Tag, Plus, X, ArrowBendUpRight, ArrowsClockwise, Scales, Coins } from "@phosphor-icons/react";

// ─── tokens ────────────────────────────────────────────────────────────────
const C = {
  canvas: "#F6F2EC", surface: "#FFFFFF", ink: "#1C1B3A",
  muted1: "#6B6980", muted2: "#8A879B", muted3: "#9C99AB", muted4: "#B7AE9E",
  border: "#E3DCD0",
  coral: "#F03C64",
  green: "#2FA96A", greenDark: "#1E8A57",
};
const F = {
  title: "'Bricolage Grotesque', system-ui, sans-serif",
  body: "'Hanken Grotesk', system-ui, sans-serif",
};
const SHADOW = { card: "0 2px 10px rgba(28,27,58,.05)" };

const screen = {
  width: "100%", maxWidth: 480, margin: "0 auto", boxSizing: "border-box",
  padding: "0 18px 128px", background: C.canvas, minHeight: "100%", fontFamily: F.body, color: C.ink,
};
const sectionTitle = {
  font: `700 11px ${F.body}`, letterSpacing: ".07em", color: C.muted2,
  textTransform: "uppercase", display: "flex", alignItems: "center", gap: 7,
};
const card = { background: C.surface, borderRadius: 18, boxShadow: SHADOW.card, boxSizing: "border-box" };
const miniLabel = { font: `700 10.5px ${F.body}`, letterSpacing: ".06em", color: C.muted2, textTransform: "uppercase" };
const addInput = {
  flex: 1, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12,
  padding: "12px 14px", font: `400 13px ${F.body}`, color: C.ink, outline: "none", boxSizing: "border-box",
};
const addBtn = {
  border: "none", background: C.coral, color: "#fff", font: `700 13px ${F.body}`, padding: "12px 16px",
  borderRadius: 12, cursor: "pointer", boxShadow: "0 5px 13px rgba(240,60,100,.24)",
  display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
};

const OBJECTIFS = [
  { id: "rotation", titre: "Rotation rapide", sub: "Prix agressifs pour vendre vite", Icon: ArrowsClockwise, tint: "#FFF0F2", ic: C.coral },
  { id: "equilibre", titre: "Équilibre", sub: "Bon prix, bonne marge", Icon: Scales, tint: "#EDEBF3", ic: "#5B5975" },
  { id: "profits", titre: "Profits max", sub: "Prix hauts, attente possible", Icon: Coins, tint: "#E4F4EB", ic: C.greenDark },
];

function Chip({ label, onDelete, dark }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      borderRadius: 999, padding: "8px 12px 8px 14px",
      font: `${dark ? 700 : 600} 13px ${F.body}`,
      color: dark ? "#fff" : C.ink,
      background: dark ? C.ink : C.surface,
      border: dark ? "none" : `1.5px solid ${C.border}`,
    }}>
      {label}
      <button onClick={onDelete} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex" }}>
        <X size={13} color={dark ? C.muted3 : C.muted4} />
      </button>
    </span>
  );
}

function GenSection({ user }) {
  const [prefs, setPrefs] = useState(() => loadPrefs(user.id));

  const patch = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(user.id, next);
  };

  return (
    <>
      <div style={{ ...sectionTitle, margin: "20px 0 10px" }}>
        <Sparkle size={14} weight="fill" color={C.coral} />GÉNÉRATION IA
      </div>

      {/* objectif */}
      <div style={{ ...card, padding: 6, marginBottom: 12 }}>
        <div style={{ ...miniLabel, padding: "11px 12px 8px" }}>Objectif de prix</div>
        {OBJECTIFS.map((o) => {
          const on = prefs.objectif === o.id;
          return (
            <label key={o.id} onClick={() => patch("objectif", o.id)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
              borderRadius: 12, cursor: "pointer", background: on ? "#FFF6F8" : "transparent",
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0, background: "#fff",
                border: on ? `6px solid ${C.coral}` : `2px solid ${C.border}`,
              }} />
              <span style={{
                width: 34, height: 34, borderRadius: 10, background: o.tint, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><o.Icon size={17} weight="fill" color={o.ic} /></span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", font: `700 14px ${F.body}`, color: C.ink }}>{o.titre}</span>
                <span style={{ font: `500 11.5px ${F.body}`, color: C.muted2 }}>{o.sub}</span>
              </span>
            </label>
          );
        })}
      </div>

      {/* ton */}
      <div style={{ ...card, padding: 14, marginBottom: 12 }}>
        <div style={{ ...miniLabel, marginBottom: 10 }}>Ton des annonces</div>
        <div style={{ display: "flex", gap: 7 }}>
          {[["decontracte", "Décontracté"], ["neutre", "Neutre"], ["pro", "Pro"]].map(([id, lbl]) => {
            const on = prefs.ton === id;
            return (
              <button key={id} onClick={() => patch("ton", id)} style={{
                flex: 1, textAlign: "center", font: `700 13px ${F.body}`, borderRadius: 11,
                padding: "11px 4px", cursor: "pointer",
                color: on ? "#fff" : C.muted1, background: on ? C.ink : "#fff",
                border: on ? "none" : `1.5px solid ${C.border}`,
              }}>{lbl}</button>
            );
          })}
        </div>
      </div>

      {/* hashtags toggle */}
      <div style={{ ...card, padding: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ font: `700 14px ${F.body}`, color: C.ink }}>Hashtags dans les annonces</div>
          <div style={{ font: `500 11.5px ${F.body}`, color: C.muted2 }}>Ajoutés en fin de description — Vinted uniquement</div>
        </div>
        <button onClick={() => patch("hashtags", prefs.hashtags === false ? true : false)} style={{
          width: 44, height: 26, borderRadius: 999, border: "none",
          background: prefs.hashtags !== false ? C.coral : "#D7D2CC",
          position: "relative", flexShrink: 0, cursor: "pointer",
        }}>
          <span style={{
            position: "absolute", top: 3, left: prefs.hashtags !== false ? 21 : 3,
            width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s",
          }} />
        </button>
      </div>

      {/* brief rédaction */}
      <div style={{ ...card, padding: 15, marginBottom: 12 }}>
        <div style={{ ...miniLabel, marginBottom: 4 }}>Brief de rédaction</div>
        <div style={{ font: `400 11.5px/1.5 ${F.body}`, color: C.muted2, marginBottom: 10 }}>
          Ce que l'IA doit toujours respecter — interdictions, formulations à éviter, règles de style.
        </div>
        <textarea
          value={prefs.briefRedaction || ""}
          onChange={(e) => patch("briefRedaction", e.target.value)}
          rows={4}
          placeholder={"Ex : Jamais de tirets longs (—). Jamais \"bon état général\". Jamais \"lot\" dans le titre. Pas de superlatifs. Descriptions courtes et directes."}
          style={{
            width: "100%", background: C.canvas, border: `1.5px solid ${C.border}`, borderRadius: 12,
            padding: "12px 13px", resize: "vertical", font: `400 13px/1.5 ${F.body}`, color: C.ink,
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* mentions fixes */}
      <div style={{ ...card, padding: 15 }}>
        <div style={{ ...miniLabel, marginBottom: 4 }}>Mentions fixes</div>
        <div style={{ font: `400 11.5px/1.5 ${F.body}`, color: C.muted2, marginBottom: 10 }}>
          Toujours ajouté à tes annonces — conditions, habitudes d'envoi…
        </div>
        <textarea
          value={prefs.mentionsFixes || ""}
          onChange={(e) => patch("mentionsFixes", e.target.value)}
          rows={3}
          placeholder="Ex : Pas de Vinted Go. Envoi soigné et protégé. Non fumeur, pas d'animal."
          style={{
            width: "100%", background: C.canvas, border: `1.5px solid ${C.border}`, borderRadius: 12,
            padding: "12px 13px", resize: "vertical", font: `400 13px/1.5 ${F.body}`, color: C.ink,
            outline: "none", boxSizing: "border-box",
          }}
        />
      </div>
    </>
  );
}

function SourcesSection({ user }) {
  const [sources, setSources] = useState([]);
  const [restricted, setRestricted] = useState(null);
  const [newNom, setNewNom] = useState("");

  const load = () => listSources(user.id).then(setSources);
  useEffect(() => { load(); }, [user.id]);

  const add = async () => {
    if (!newNom.trim()) return;
    await createSource(newNom.trim(), user.id, { type: "personnel" });
    setNewNom(""); load();
  };

  const remove = async (s) => {
    try { await deleteSource(s.id, user.id); load(); }
    catch (e) { if (e.code === "RESTRICTED") setRestricted(s); else alert(e.message); }
  };

  const forceRemove = async (s) => {
    await forceDeleteSource(s.id, null, user.id);
    setRestricted(null); load();
  };

  return (
    <>
      <div style={{ ...sectionTitle, margin: "22px 0 10px" }}>
        <MapPin size={14} weight="fill" color={C.coral} />SOURCES D'ACHAT
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {sources.map((s) => (
          <div key={s.id}>
            <Chip label={s.nom} onDelete={() => remove(s)} />
            {restricted?.id === s.id && (
              <div style={{
                marginTop: 6, fontSize: 11.5, background: "#FEF3C7",
                padding: "8px 10px", borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
              }}>
                Des articles utilisent cette source.{" "}
                <button
                  style={{ border: "none", background: C.ink, color: "#fff", borderRadius: 8, padding: "4px 10px", font: `700 11px ${F.body}`, cursor: "pointer" }}
                  onClick={() => forceRemove(s)}>
                  Supprimer quand même
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={newNom} onChange={(e) => setNewNom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ex : Vide-grenier, Emmaüs…" style={addInput}
        />
        <button onClick={add} style={addBtn}><Plus size={14} weight="bold" />Ajouter</button>
      </div>
    </>
  );
}

function TagsSection({ user }) {
  const [categories, setCategories] = useState([]);
  const [restricted, setRestricted] = useState(null);
  const [newNom, setNewNom] = useState("");
  const [mergeTarget, setMergeTarget] = useState({});

  const load = () => listCategories(user.id).then(setCategories);
  useEffect(() => { load(); }, [user.id]);

  const add = async () => {
    if (!newNom.trim()) return;
    await createCategory(newNom.trim(), user.id);
    setNewNom(""); load();
  };

  const remove = async (c) => {
    try { await deleteCategory(c.id, user.id); load(); }
    catch (e) { if (e.code === "RESTRICTED") setRestricted(c); else alert(e.message); }
  };

  const forceRemove = async (c, targetId) => {
    const fallback = targetId || categories.find((x) => x.nom.toLowerCase() === "autre" && x.id !== c.id)?.id;
    if (!fallback) { alert("Aucun tag 'Autre' trouvé pour réassigner."); return; }
    await forceDeleteCategory(c.id, fallback, user.id);
    setRestricted(null); load();
  };

  return (
    <>
      <div style={{ ...sectionTitle, margin: "22px 0 10px" }}>
        <Tag size={14} weight="fill" color={C.coral} />TAGS
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {categories.map((c, i) => (
          <div key={c.id}>
            <Chip label={c.nom} onDelete={() => remove(c)} />
            {restricted?.id === c.id && (
              <div style={{
                marginTop: 6, fontSize: 11.5, background: "#FEF3C7",
                padding: "8px 10px", borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
              }}>
                Ce tag a des articles liés.
                <select
                  value={mergeTarget[c.id] || ""}
                  onChange={(e) => setMergeTarget((p) => ({ ...p, [c.id]: e.target.value }))}
                  style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 8px", font: `400 11px ${F.body}`, background: "#fff" }}
                >
                  <option value="">Fusionner dans…</option>
                  {categories.filter((x) => x.id !== c.id).map((x) => (
                    <option key={x.id} value={x.id}>{x.nom}</option>
                  ))}
                </select>
                <button
                  style={{ border: "none", background: C.ink, color: "#fff", borderRadius: 8, padding: "4px 10px", font: `700 11px ${F.body}`, cursor: "pointer" }}
                  onClick={() => forceRemove(c, mergeTarget[c.id])}>
                  {mergeTarget[c.id] ? "Fusionner" : "Supprimer (→ Autre)"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={newNom} onChange={(e) => setNewNom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ex : Vêtements, Jouets, Déco…" style={addInput}
        />
        <button onClick={add} style={addBtn}><Plus size={14} weight="bold" />Ajouter</button>
      </div>
    </>
  );
}

export function SettingsTab() {
  const { user } = useAuth();

  return (
    <div style={screen}>
      <GenSection user={user} />
      <SourcesSection user={user} />
      <TagsSection user={user} />

      {/* note compte / profil */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10, marginTop: 20,
        padding: "13px 15px", background: "rgba(28,27,58,.04)", borderRadius: 14,
      }}>
        <ArrowBendUpRight size={16} color="#A56BE0" style={{ marginTop: 1, flexShrink: 0 }} />
        <span style={{ font: `500 12px/1.5 ${F.body}`, color: C.muted1 }}>
          <b style={{ color: C.ink }}>Mon compte</b>, <b style={{ color: C.ink }}>Qui sommes-nous ?</b> &amp; l'aide sont dans le menu profil — tape sur ton avatar en haut à droite.
        </span>
      </div>
    </div>
  );
}
