import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listCategories, createCategory } from "../lib/categories";

const ADD_NEW = "__add_new__";

// value: id de la catégorie sélectionnée. onChange reçoit l'objet {id, nom}.
export function CategorySelect({ value, onChange }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user) return;
    listCategories(user.id).then(setCategories).catch(() => {});
  }, [user]);

  const handleChange = async (e) => {
    const v = e.target.value;
    if (v === ADD_NEW) {
      const nom = window.prompt("Nom de la nouvelle catégorie (ex: Jouets, Déco…)");
      if (!nom || !nom.trim()) return;
      const created = await createCategory(nom.trim(), user.id);
      setCategories((prev) => [...prev, created].sort((a, b) => a.nom.localeCompare(b.nom)));
      onChange(created);
      return;
    }
    const selected = categories.find((c) => c.id === v) || null;
    onChange(selected);
  };

  return (
    <select className="select" value={value || ""} onChange={handleChange}>
      <option value="">— Catégorie —</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>{c.nom}</option>
      ))}
      <option value={ADD_NEW}>+ Ajouter une catégorie…</option>
    </select>
  );
}
