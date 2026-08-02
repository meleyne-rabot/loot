import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listSources, createSource } from "../lib/sources";

const ADD_NEW = "__add_new__";

// value: id de la source sélectionnée. onChange reçoit l'objet source complet
// {id, nom, type, commissionPct} (ou null si désélection).
export function SourceSelect({ value, onChange }) {
  const { user } = useAuth();
  const [sources, setSources] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newNom, setNewNom] = useState("");

  useEffect(() => {
    if (!user) return;
    listSources(user.id).then(setSources).catch(() => {});
  }, [user]);

  const handleChange = (e) => {
    const v = e.target.value;
    if (v === ADD_NEW) {
      setAdding(true);
      return;
    }
    const selected = sources.find((s) => s.id === v) || null;
    onChange(selected);
  };

  const confirmAdd = async () => {
    if (!newNom.trim()) return;
    const created = await createSource(newNom.trim(), user.id, { type: "personnel" });
    setSources((prev) => [...prev, created].sort((a, b) => a.nom.localeCompare(b.nom)));
    onChange(created);
    setAdding(false);
    setNewNom("");
  };

  if (adding) {
    return (
      <div style={{ background: "#fff", border: "2px solid var(--pink-border)", borderRadius: 10, padding: 10 }}>
        <input
          className="input" placeholder="Nom de la source (ex: Champigny, Emmaüs…)"
          value={newNom} onChange={(e) => setNewNom(e.target.value)} style={{ marginBottom: 6 }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-primary btn-sm" onClick={confirmAdd}>Ajouter</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Annuler</button>
        </div>
      </div>
    );
  }

  return (
    <select className="select" value={value || ""} onChange={handleChange}>
      <option value="">— Source —</option>
      {sources.map((s) => (
        <option key={s.id} value={s.id}>{s.nom}</option>
      ))}
      <option value={ADD_NEW}>+ Ajouter une source…</option>
    </select>
  );
}
