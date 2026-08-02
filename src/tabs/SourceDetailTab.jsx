import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listItems, markAllReverseForSource, markReverse } from "../lib/items";

export function SourceDetailTab({ source, onBack }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const load = () => listItems(user.id).then((all) => setItems(all.filter((i) => i.sourceId === source.id)));

  useEffect(() => { load(); }, [source.id]);

  const aReverser = items.filter((i) => i.statut === "vendu" && !i.reversePaye);
  const dejaPayes = items.filter((i) => i.reversePaye);
  const total = aReverser.reduce((s, i) => s + (parseFloat(i.montantAReverser) || 0), 0);

  const markAll = async () => {
    if (!aReverser.length) return;
    if (!confirm(`Marquer ${aReverser.length} article(s) comme payés pour un total de ${total.toFixed(2)} € ?`)) return;
    await markAllReverseForSource(source.id, user.id, date);
    load();
  };

  const markOne = async (id) => {
    await markReverse(id, user.id, date);
    load();
  };

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 14 }}>← Retour</button>
      <h3 style={{ marginBottom: 4 }}>{source.nom}</h3>
      <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>Dépôt-vente · commission {source.commissionPct}%</p>

      <div className="stat-card" style={{ marginBottom: 16 }}>
        <div className="stat-label">TOTAL À REVERSER</div>
        <div className="stat-val">{total.toFixed(2)} €</div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <input className="input" type="date" style={{ maxWidth: 160 }} value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn btn-dark" onClick={markAll} disabled={!aReverser.length}>Tout marquer payé</button>
      </div>

      <p className="psection-label" style={{ marginBottom: 8 }}>À reverser ({aReverser.length})</p>
      {aReverser.length === 0 && <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>Rien à reverser pour l'instant.</p>}
      {aReverser.map((i) => (
        <div key={i.id} className="card" style={{ gridTemplateColumns: "1fr auto" }}>
          <div className="card-body">
            <div className="card-name">{i.name}</div>
            <div className="card-prices">
              <span className="chip chip-green">Vendu {i.prixVente} €</span>
              <span className="chip" style={{ background: "var(--orange)", color: "#fff" }}>Doit {parseFloat(i.montantAReverser).toFixed(2)} €</span>
            </div>
          </div>
          <button className="btn btn-dark btn-sm" style={{ alignSelf: "center", marginRight: 12 }} onClick={() => markOne(i.id)}>Marquer payé</button>
        </div>
      ))}

      {dejaPayes.length > 0 && (
        <>
          <div className="sep" />
          <p className="psection-label" style={{ marginBottom: 8 }}>Historique payé ({dejaPayes.length})</p>
          {dejaPayes.map((i) => (
            <div key={i.id} className="card" style={{ gridTemplateColumns: "1fr" }}>
              <div className="card-body">
                <div className="card-name">{i.name}</div>
                <div className="card-prices">
                  <span className="chip chip-green">{parseFloat(i.montantAReverser).toFixed(2)} € reversé le {i.dateReversement}</span>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
