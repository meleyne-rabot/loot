import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { listMalles, createMalle, updateMalle, deleteMalle, getOrCreateShareToken } from "../lib/malles";
import { listItems } from "../lib/items";
import { MalleDetailTab } from "./MalleDetailTab";
import { TreasureChest, Plus, PencilSimple, X, Eye, ShareNetwork } from "@phosphor-icons/react";

const PASTILLE_COLORS = [
  { bg: "#EDE9FF", color: "#5B35CC" },
  { bg: "#FDE8EF", color: "#C72558" },
  { bg: "#DEF3F1", color: "#0B7A73" },
  { bg: "#FBEAD1", color: "#B0651B" },
  { bg: "#E0F0FF", color: "#1A6BB5" },
];
function malleColor(idx) { return PASTILLE_COLORS[idx % PASTILLE_COLORS.length]; }

// Vue articles pour une malle (tous statuts)
function MalleArticlesView({ malle, onBack }) {
  const { user } = useAuth();
  const [malleItems, setMalleItems] = useState([]);
  useEffect(() => {
    listItems(user.id).then((all) => setMalleItems(all.filter((i) => i.malleId === malle.id))).catch(() => {});
  }, [malle.id]);
  const cl = malleColor(0);
  const sLbl = { vendu: "Vendu", "en-vente": "En vente", "en-attente": "En attente" };
  const sCls = { vendu: "#1BA868", "en-vente": "#F03C64", "en-attente": "#8A879B" };

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 14 }}>← Retour</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span style={{
          width: 40, height: 40, borderRadius: 12, background: cl.bg, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <TreasureChest size={20} weight="fill" color={cl.color} />
        </span>
        <div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>{malle.nom}</div>
          <div style={{ fontSize: 12, color: "var(--muted-2)" }}>{malleItems.length} article{malleItems.length !== 1 ? "s" : ""}</div>
        </div>
      </div>

      {malleItems.length === 0 ? (
        <div className="empty">
          <TreasureChest size={40} color="var(--muted)" />
          <p style={{ marginTop: 10 }}>Aucun article dans cette malle.</p>
        </div>
      ) : (
        malleItems.map((item) => {
          const v = parseFloat(item.prixVente) || 0;
          const a = parseFloat(item.prixAchat) || 0;
          return (
            <div key={item.id} style={{
              background: "var(--surface)", borderRadius: 14, padding: "12px 14px",
              marginBottom: 8, display: "flex", alignItems: "center", gap: 12,
              boxShadow: "var(--shadow-card)",
            }}>
              {item.image
                ? <img src={item.image} alt={item.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                : <div style={{ width: 48, height: 48, borderRadius: 10, background: "#F0EBE3", flexShrink: 0 }} />
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted-2)", marginTop: 2 }}>
                  {a > 0 && `Acheté ${a} €`}{v > 0 && ` · Vendu ${v} €`}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                background: item.statut === "vendu" ? "#E8F9F1" : item.statut === "en-vente" ? "#FEE8EE" : "#F4F4F6",
                color: sCls[item.statut] || "#8A879B",
              }}>
                {sLbl[item.statut] || item.statut}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}

export function MallesTab() {
  const { user }        = useAuth();
  const { showToast }   = useToast();
  const [malles, setMalles] = useState([]);
  const [items,  setItems]  = useState([]);
  const [viewing,         setViewing]         = useState(null); // malle → MalleDetailTab (reversements)
  const [viewingArticles, setViewingArticles] = useState(null); // malle → MalleArticlesView
  const [editingId, setEditingId] = useState(null); // malle.id en cours d'édition inline
  const [editData,  setEditData]  = useState({});   // { nom, commissionPct, description, paypalMe }
  const [adding,  setAdding]  = useState(false);
  const [newNom,  setNewNom]  = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPct,  setNewPct]  = useState("");

  const load = () => {
    listMalles(user.id).then(setMalles).catch(() => {});
    listItems(user.id).then(setItems).catch(() => {});
  };
  useEffect(() => { load(); }, [user.id]);

  if (viewing)         return <MalleDetailTab malle={viewing} onBack={() => { setViewing(null); load(); }} />;
  if (viewingArticles) return <MalleArticlesView malle={viewingArticles} onBack={() => setViewingArticles(null)} />;

  const totalAReverser = malles.reduce((s, m) => s + (parseFloat(m.detteMalle) || 0), 0);

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditData({ nom: m.nom, commissionPct: m.commissionPct ?? 0, description: m.description ?? "", paypalMe: m.paypalMe ?? "" });
  };

  const saveEdit = async (malleId) => {
    await updateMalle(malleId, user.id, {
      nom: editData.nom,
      commissionPct: Number(editData.commissionPct),
      description: editData.description,
      paypalMe: editData.paypalMe,
    });
    setEditingId(null);
    load();
    showToast("✓ Malle mise à jour");
  };

  const add = async () => {
    if (!newNom.trim()) return;
    await createMalle(newNom.trim(), user.id, newDesc.trim(), newPct !== "" ? Number(newPct) : 0);
    setNewNom(""); setNewDesc(""); setNewPct(""); setAdding(false);
    load();
    showToast("✓ Malle créée");
  };

  const share = async (m) => {
    try {
      const token = await getOrCreateShareToken(m.id, user.id);
      const url = `${window.location.origin}/malle/${token}`;
      if (navigator.share) {
        await navigator.share({ title: `Malle ${m.nom}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("🔗 Lien copié !");
      }
    } catch (e) {
      if (e?.name !== "AbortError") showToast("Impossible de partager");
    }
  };

  const remove = async (m) => {
    if (!confirm(`Supprimer la malle "${m.nom}" ? Les articles associés ne seront pas supprimés.`)) return;
    await deleteMalle(m.id, user.id);
    load();
    showToast("Malle supprimée");
  };

  return (
    <div className="page">
      {/* Hero navy */}
      <div style={{
        position: "relative", borderRadius: 20, background: "#1C1B3A",
        padding: "22px 22px 20px", marginBottom: 16, overflow: "hidden",
      }}>
        <TreasureChest size={96} color="rgba(255,255,255,.06)" style={{
          position: "absolute", right: -10, bottom: -14, pointerEvents: "none",
        }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#9B8FFF", display: "inline-block" }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".10em", color: "#9B8FFF", textTransform: "uppercase" }}>
            TOTAL À REVERSER
          </span>
        </div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 34, color: "#FFFFFF", lineHeight: 1.1, letterSpacing: "-.01em" }}>
          {totalAReverser.toFixed(2)} €
        </div>
        <div style={{ fontSize: 12, color: "#B7B5C8", marginTop: 6 }}>
          {malles.length} malle{malles.length !== 1 ? "s" : ""} · {malles.filter((m) => (m.detteMalle || 0) > 0).length} en attente de reversement
        </div>
      </div>

      {/* Liste des malles */}
      {malles.length === 0 && !adding && (
        <div className="empty" style={{ paddingTop: 24 }}>
          <TreasureChest size={48} color="var(--muted)" />
          <p style={{ marginTop: 12, marginBottom: 6 }}>Pas encore de malle</p>
          <p style={{ fontSize: 12, color: "var(--muted)", maxWidth: 240, textAlign: "center" }}>
            Crée une malle par personne pour qui tu vends — leurs articles et leurs reversements restent séparés des tiens.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {malles.map((m, idx) => {
          const doit    = parseFloat(m.detteMalle) || 0;
          const vendu   = items.filter((i) => i.malleId === m.id && i.statut === "vendu").reduce((s, i) => s + (parseFloat(i.prixVente) || 0), 0);
          const nbItems = items.filter((i) => i.malleId === m.id).length;
          const cl      = malleColor(idx);
          const initial = (m.nom?.[0] || "?").toUpperCase();
          const isEditing = editingId === m.id;

          return (
            <div key={m.id} style={{
              background: "var(--surface)", borderRadius: 18,
              padding: isEditing ? "15px" : "15px 15px 12px",
              boxShadow: "var(--shadow-card)",
            }}>
              {/* Header malle */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isEditing ? 12 : 10 }}>
                <span style={{
                  width: 44, height: 44, borderRadius: 14, background: cl.bg, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
                  fontSize: 18, color: cl.color,
                }}>{initial}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.nom}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted-2)" }}>
                    Commission {m.commissionPct || 0}% · {nbItems} article{nbItems !== 1 ? "s" : ""}
                  </div>
                </div>
                {/* Actions header */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => isEditing ? setEditingId(null) : startEdit(m)}
                    title={isEditing ? "Annuler" : "Modifier"}
                    style={{ background: isEditing ? "#F0EBE3" : "none", border: "none", cursor: "pointer", padding: 7, borderRadius: 10, color: "var(--muted)", display: "flex" }}
                  >
                    {isEditing ? <X size={16} /> : <PencilSimple size={16} />}
                  </button>
                  {!isEditing && (
                    <button
                      onClick={() => remove(m)}
                      title="Supprimer"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 7, borderRadius: 10, color: "#C4BDB0", display: "flex" }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Formulaire d'édition inline */}
              {isEditing && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".06em", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Nom</label>
                    <input className="input input-sm" value={editData.nom} onChange={(e) => setEditData((d) => ({ ...d, nom: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".06em", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Description</label>
                    <input className="input input-sm" placeholder="Optionnel" value={editData.description} onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Commission %</label>
                    <input className="input input-sm" type="number" min="0" max="100" style={{ width: 70 }}
                      value={editData.commissionPct} onChange={(e) => setEditData((d) => ({ ...d, commissionPct: e.target.value }))} />
                    <span style={{ fontSize: 11, color: "var(--muted-2)" }}>
                      {Number(editData.commissionPct) === 0 ? "tu reverses tout" : `tu gardes ${editData.commissionPct}%`}
                    </span>
                  </div>
                  <button className="btn btn-primary btn-xs" style={{ alignSelf: "flex-start" }} onClick={() => saveEdit(m.id)} disabled={!editData.nom.trim()}>
                    Enregistrer
                  </button>
                </div>
              )}

              {!isEditing && (
                <>
                  <div style={{ height: 1, background: "#F0EBE3", marginBottom: 10 }} />
                  {/* Ligne 1 : vendu + boutons — position stable */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12.5, color: "var(--muted)", flexShrink: 0, whiteSpace: "nowrap" }}>
                      Vendu <strong style={{ color: "var(--ink)" }}>{vendu.toFixed(2)} €</strong>
                    </span>
                    <button
                      onClick={() => setViewingArticles(m)}
                      style={{
                        background: "#F4F4F6", color: "var(--ink)", border: "none", borderRadius: 20,
                        padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "'Hanken Grotesk', sans-serif", flexShrink: 0,
                        display: "flex", alignItems: "center", gap: 5,
                      }}
                    >
                      <Eye size={13} />Articles ({nbItems})
                    </button>
                    <button
                      onClick={() => share(m)}
                      style={{
                        background: "#EDE9FF", color: "#5B35CC", border: "none", borderRadius: 20,
                        padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        fontFamily: "'Hanken Grotesk', sans-serif", flexShrink: 0,
                        display: "flex", alignItems: "center", gap: 5,
                      }}
                    >
                      <ShareNetwork size={13} />Partager
                    </button>
                    <button
                      onClick={doit > 0 ? () => setViewing(m) : undefined}
                      disabled={doit === 0}
                      style={{
                        background: doit > 0 ? "#F03C64" : "#E3DCD0",
                        color: doit > 0 ? "#fff" : "#A8A098",
                        border: "none", borderRadius: 20,
                        padding: "5px 14px", fontSize: 12, fontWeight: 700,
                        cursor: doit > 0 ? "pointer" : "not-allowed",
                        fontFamily: "'Hanken Grotesk', sans-serif", flexShrink: 0,
                      }}
                    >Reverser</button>
                  </div>
                  {/* Ligne 2 : statut — toujours en bas, ne bouge pas les boutons */}
                  <div style={{ marginTop: 8 }}>
                    {doit > 0
                      ? <span style={{ background: "#EDE9FF", color: "#5B35CC", borderRadius: 20, padding: "3px 10px", fontSize: 11.5, fontWeight: 700 }}>
                          À reverser {doit.toFixed(2)} €
                        </span>
                      : <span style={{ fontSize: 12, fontWeight: 700, color: "#1BA868" }}>Tu es à jour ✓</span>
                    }
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Bouton + Nouvelle malle */}
        {adding ? (
          <div style={{
            background: "var(--surface)", borderRadius: 18,
            padding: "16px", boxShadow: "var(--shadow-card)",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 2 }}>
              Nouvelle malle
            </p>
            <input className="input input-sm" placeholder="Prénom — ex: Emma, Maman, Alex" value={newNom} onChange={(e) => setNewNom(e.target.value)} />
            <input className="input input-sm" placeholder="Description (optionnel)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>Commission %</span>
              <input className="input input-sm" type="number" min="0" max="100" style={{ width: 70 }}
                placeholder="0" value={newPct} onChange={(e) => setNewPct(e.target.value)} />
              <span style={{ fontSize: 11, color: "var(--muted-2)" }}>
                {newPct === "" || newPct === "0" ? "tu reverses tout" : `tu gardes ${newPct}%`}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button className="btn btn-primary btn-xs" onClick={add} disabled={!newNom.trim()}>Créer</button>
              <button className="btn btn-xs" onClick={() => { setAdding(false); setNewNom(""); setNewDesc(""); setNewPct(""); }}>Annuler</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              border: "2px dashed #D4CEC6", borderRadius: 18, padding: "16px",
              background: "transparent", cursor: "pointer", width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8, color: "var(--muted)", fontSize: 13.5, fontWeight: 600,
              fontFamily: "'Hanken Grotesk', sans-serif",
              transition: "border-color .2s, color .2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#F03C64"; e.currentTarget.style.color = "#F03C64"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#D4CEC6"; e.currentTarget.style.color = "var(--muted)"; }}
          >
            <Plus size={16} />
            Nouvelle malle
          </button>
        )}
      </div>
    </div>
  );
}
