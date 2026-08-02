import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listCategories, createCategory } from "../lib/categories";

// value: array d'ids de tags sélectionnés. onChange reçoit la nouvelle array.
export function TagSelect({ value = [], onChange }) {
  const { user } = useAuth();
  const [tags, setTags] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newNom, setNewNom] = useState("");

  useEffect(() => {
    listCategories(user.id).then(setTags).catch(() => {});
  }, [user.id]);

  const toggle = (id) => {
    const next = value.includes(id) ? value.filter((x) => x !== id) : [...value, id];
    onChange(next);
  };

  const confirmAdd = async () => {
    if (!newNom.trim()) return;
    const created = await createCategory(newNom.trim(), user.id);
    setTags((prev) => [...prev, created].sort((a, b) => a.nom.localeCompare(b.nom)));
    onChange([...value, created.id]);
    setAdding(false);
    setNewNom("");
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {tags.map((t) => (
        <button
          key={t.id} type="button"
          className={"pill" + (value.includes(t.id) ? " active" : "")}
          onClick={() => toggle(t.id)}
        >
          {t.nom}
        </button>
      ))}
      {adding ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            className="input input-sm" style={{ width: 120 }} placeholder="Nouveau tag…" autoFocus
            value={newNom} onChange={(e) => setNewNom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmAdd()}
          />
          <button type="button" className="btn btn-primary btn-xs" onClick={confirmAdd}>OK</button>
        </div>
      ) : (
        <button type="button" className="pill" onClick={() => setAdding(true)}>+ Tag</button>
      )}
    </div>
  );
}
