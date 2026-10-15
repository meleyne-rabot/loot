import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listMalles } from "../lib/malles";
import { LootSelect } from "./LootSelect";

export function MalleSelect({ value, onChange }) {
  const { user } = useAuth();
  const [malles, setMalles] = useState([]);

  useEffect(() => {
    listMalles(user.id).then(setMalles).catch(() => {});
  }, [user.id]);

  if (malles.length === 0) return null;

  const options = [
    { value: "", label: "Mes articles perso" },
    ...malles.map((m) => ({ value: m.id, label: m.nom })),
  ];

  return (
    <div className="field">
      <label className="label">Malle</label>
      <LootSelect value={value || ""} onChange={(v) => onChange(v || null)} options={options} placeholder="Mes articles perso" />
    </div>
  );
}
