import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { listMalles } from "../lib/malles";

export function MalleSelect({ value, onChange }) {
  const { user } = useAuth();
  const [malles, setMalles] = useState([]);

  useEffect(() => {
    listMalles(user.id).then(setMalles).catch(() => {});
  }, [user.id]);

  if (malles.length === 0) return null;

  return (
    <div className="field">
      <label className="label">Malle</label>
      <select
        className="select"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Mes articles perso</option>
        {malles.map((m) => (
          <option key={m.id} value={m.id}>{m.nom}</option>
        ))}
      </select>
    </div>
  );
}
