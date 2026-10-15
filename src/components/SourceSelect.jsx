import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listSources, createSource } from "../lib/sources";
import { LootSelect } from "./LootSelect";
import { C, F } from "../lib/loot-tokens";

const ADD_NEW = "__add_new__";

export function SourceSelect({ value, onChange }) {
  const { user } = useAuth();
  const [sources, setSources] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newNom, setNewNom] = useState("");

  useEffect(() => {
    if (!user) return;
    listSources(user.id).then(setSources).catch(() => {});
  }, [user]);

  const handleChange = (v) => {
    if (v === ADD_NEW) { setAdding(true); return; }
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

  const options = [
    { value: "", label: "— Source —" },
    ...sources.map((s) => ({ value: s.id, label: s.nom })),
    { value: ADD_NEW, label: "+ Ajouter une source…" },
  ];

  return <LootSelect value={value || ""} onChange={handleChange} options={options} placeholder="— Source —" />;
}
