import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { listSources } from "../lib/sources";
import { callAI } from "../lib/ai";
import { SourceSelect } from "./SourceSelect";
import { TagSelect } from "./TagSelect";
import { PlatformChecks } from "./PlatformChecks";
import { CopyBtn } from "./CopyBtn";
import { InfoBubble } from "./InfoBubble";
import { MalleSelect } from "./MalleSelect";
import { listMalles } from "../lib/malles";

export function EditModal({ item, onSave, onClose, onDelete }) {
  const { user } = useAuth();
  const [f, setF] = useState({ ...item, plateformes: item.plateformes || ["vinted"] });
  const [sourceType, setSourceType] = useState(null);
  const [malles, setMalles] = useState([]);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState("");
  const s = (k, v) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (!item.sourceId) return;
    listSources(user.id).then((sources) => {
      const current = sources.find((src) => src.id === item.sourceId);
      if (current) setSourceType(current.type);
    }).catch(() => {});
  }, [item.sourceId, user.id]);

  useEffect(() => {
    listMalles(user.id).then(setMalles).catch(() => {});
  }, [user.id]);

  const isDepotVente = sourceType === "depot_vente";
  const currentMalle = malles.find((m) => m.id === f.malleId);
  const mallePct = currentMalle?.commissionPct ?? 0;

  const regenerate = async () => {
    if (!item.image) return;
    setRegenerating(true);
    setRegenError("");
    try {
      const [, meta, data] = item.image.match(/^data:([^;]+);base64,(.+)$/) || [];
      const r = await callAI([{ data, type: meta || "image/jpeg" }], f.name, user?.user_metadata?.full_name);
      s("description", (r.description_vinted || "") + (r.hashtags?.length ? "\n\n" + r.hashtags.map((h) => "#" + h.replace(/^#/, "")).join(" ") : ""));
      s("hashtags", r.hashtags || []);
      s("prixRecommande", String(r.prix_recommande ?? ""));
    } catch {
      setRegenError("Erreur de régénération. Réessaie.");
    }
    setRegenerating(false);
  };

  // Portail vers document.body : garantit que la modale (position: fixed)
  // n'est jamais piégée par un ancêtre avec transform/filter/animation
  // (qui redéfinirait son "containing block" et la coincerait visuellement).
  return createPortal(
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onSave({ ...f, malleCommissionPct: mallePct }, sourceType)}>
      <div className="modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>Détail de l'article</h3>
          <button
            onClick={() => onSave({ ...f, malleCommissionPct: mallePct }, sourceType)}
            title="Fermer (enregistre)"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--muted)", fontSize: 20, lineHeight: 1, display: "flex", alignItems: "center" }}
          >×</button>
        </div>
        <div className="field">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <label className="label" style={{ marginBottom: 0 }}>Nom</label>
            <CopyBtn getText={() => f.name || ""} label="Titre" />
          </div>
          <input className="input" value={f.name || ""} onChange={(e) => s("name", e.target.value)} />
        </div>

        <div className="psection">
          <div className="psection-hd">
            <span className="psection-label">Annonce</span>
            <div style={{ display: "flex", gap: 6 }}>
              {item.image && (
                <button className="btn btn-ghost btn-sm" onClick={regenerate} disabled={regenerating}>
                  {regenerating ? <><span className="spinner" style={{ borderTopColor: "var(--pink)" }} /> Régénération…</> : "🔄 Régénérer"}
                </button>
              )}
              <CopyBtn getText={() => f.description || ""} label="Description" />
            </div>
          </div>
          <textarea className="textarea" rows={4} placeholder="Description générée…" value={f.description || ""} onChange={(e) => s("description", e.target.value)} />
          {regenError && <p style={{ color: "var(--pink)", fontSize: 12, marginTop: 6 }}>{regenError}</p>}
          {f.prixRecommande && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
              💡 Reco IA : <strong style={{ color: "var(--navy)" }}>{f.prixRecommande} €</strong>
              <InfoBubble align="right">
                Ce prix est estimé à partir des articles <strong>actuellement listés</strong> sur le marché — pas ceux réellement vendus. Les vendeurs surestiment souvent leurs prix. Pour un repère plus fiable, consulte les <strong>ventes récentes</strong> sur Vinted (filtre "Vendus") : c'est ce que les acheteurs ont vraiment payé.
              </InfoBubble>
            </div>
          )}
        </div>

        <div className="field">
          <label className="label">Tags</label>
          <TagSelect value={f.tagIds || []} onChange={(v) => s("tagIds", v)} />
        </div>

        <div className="row">
          <div className="field">
            <label className="label">Source</label>
            <SourceSelect
              value={f.sourceId}
              onChange={(src) => {
                s("sourceId", src?.id || null);
                s("source", src?.nom || "");
                if (!isDepotVente && src?.type === "depot_vente") s("commissionPct", src.commissionPct);
                setSourceType(src?.type || null);
              }}
            />
          </div>
          <div className="field">
            <label className="label">Statut</label>
            <select className="select" value={f.statut || "en-attente"} onChange={(e) => s("statut", e.target.value)}>
              <option value="en-attente">En attente</option>
              <option value="en-vente">En vente</option>
              <option value="vendu">Vendu</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label className="label">Prix achat €</label>
            <input className="input" type="number" value={f.prixAchat || ""} onChange={(e) => s("prixAchat", e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Prix listé €</label>
            <input className="input" type="number" value={f.prixAffiche || ""} onChange={(e) => s("prixAffiche", e.target.value)} />
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label className="label">Prix vente réel €</label>
            <input
              className="input" type="number" value={f.prixVente || ""}
              onChange={(e) => {
                s("prixVente", e.target.value);
                if (e.target.value && f.statut !== "vendu") s("statut", "vendu");
              }}
            />
          </div>
          <div className="field">
            <label className="label">Note prix</label>
            <input className="input" placeholder="Pourquoi ce prix ?" value={f.prixNote || ""} onChange={(e) => s("prixNote", e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label className="label">Plateformes</label>
          <PlatformChecks value={f.plateformes} onChange={(v) => s("plateformes", v)} />
        </div>

        <MalleSelect value={f.malleId} onChange={(v) => s("malleId", v)} />

        {isDepotVente && (
          <div className="psection" style={{ marginTop: 12 }}>
            <div className="psection-label" style={{ marginBottom: 8 }}>Dépôt-vente</div>
            <div className="field">
              <label className="label">Commission %</label>
              <input className="input" type="number" value={f.commissionPct ?? 0} onChange={(e) => s("commissionPct", Number(e.target.value))} />
            </div>
            {f.statut === "vendu" && f.prixVente && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="chip chip-amber">
                  Doit {(parseFloat(f.prixVente) * (1 - (f.commissionPct ?? 0) / 100)).toFixed(2)} €
                </span>
                {f.reversePaye ? (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>✓ Reversé le {f.dateReversement}</span>
                ) : (
                  <>
                    <input
                      className="input" type="date" style={{ maxWidth: 160 }}
                      value={f.dateReversement || new Date().toISOString().slice(0, 10)}
                      onChange={(e) => s("dateReversement", e.target.value)}
                    />
                    <button className="btn btn-dark btn-sm" onClick={() => s("reversePaye", true)}>
                      Marquer payé
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {f.malleId && currentMalle && (
          <div className="psection" style={{ marginTop: 12 }}>
            <div className="psection-label" style={{ marginBottom: 8 }}>Malle · {currentMalle.nom}</div>
            {f.statut === "vendu" && f.prixVente ? (
              <span className="chip chip-amber">
                Contribution dette : {(parseFloat(f.prixVente) * (1 - mallePct / 100)).toFixed(2)} €
                {mallePct > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>(commission {mallePct}%)</span>}
              </span>
            ) : (
              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                Le montant à reverser sera calculé à la vente.
              </p>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: 9, marginTop: 16, alignItems: "center" }}>
          <button
            onClick={onClose}
            title="Annuler les modifications"
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", padding: "7px 10px", color: "var(--muted)", fontSize: 16, display: "flex", alignItems: "center", gap: 5 }}
          >
            <span style={{ fontSize: 17 }}>↩</span>
            <span style={{ fontSize: 12 }}>Annuler</span>
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              title="Supprimer l'article"
              style={{ marginLeft: "auto", background: "none", border: "1px solid #FFD0DA", borderRadius: 8, cursor: "pointer", padding: "7px 10px", color: "#C02050", fontSize: 18, display: "flex", alignItems: "center" }}
            >🗑️</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
