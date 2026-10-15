import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listCategories, createCategory } from "../lib/categories";
import { LootSelect } from "./LootSelect";

const ADD_NEW = "__add_new__";

export function CategorySelect({ value, onChange }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user) return;
    listCategories(user.id).then(setCategories).catch(() => {});
  }, [user]);

  const handleChange = async (v) => {
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

  const options = [
    { value: "", label: "— Catégorie —" },
    ...categories.map((c) => ({ value: c.id, label: c.nom })),
    { value: ADD_NEW, label: "+ Ajouter une catégorie…" },
  ];

  return <LootSelect value={value || ""} onChange={handleChange} options={options} placeholder="— Catégorie —" />;
}
