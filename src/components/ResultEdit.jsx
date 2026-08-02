import { CopyBtn } from "./CopyBtn";
import { PlatformChecks } from "./PlatformChecks";

export function ResultEdit({
  result, plateformes, onPlateformes,
  titre, onTitre, descVinted, onDescVinted, descLbc, onDescLbc,
}) {
  if (!result) return null;
  return (
    <div className="result">
      <div className="psection">
        <div className="psection-hd">
          <span className="psection-label">Titre</span>
          <CopyBtn getText={() => titre} label="Titre" />
        </div>
        <input
          className="input"
          value={titre}
          onChange={(e) => onTitre(e.target.value)}
          style={{ fontWeight: 700, fontSize: 15 }}
        />
        <div style={{ fontSize: 10, color: titre.length > 50 ? "var(--pink)" : "var(--muted)", marginTop: 3 }}>
          {titre.length}/50
        </div>
      </div>

      <div className="field" style={{ marginBottom: 10 }}>
        <label className="label">Publier sur</label>
        <PlatformChecks value={plateformes} onChange={onPlateformes} />
      </div>

      {plateformes.includes("vinted") && (
        <div className="psection">
          <div className="psection-hd">
            <span className="psection-label" style={{ color: "#1A7A42" }}>● Vinted</span>
            <div style={{ display: "flex", gap: 5 }}>
              <CopyBtn getText={() => titre} label="Titre" />
              <CopyBtn getText={() => descVinted} label="Description + tags" />
            </div>
          </div>
          <textarea className="textarea" rows={5} value={descVinted} onChange={(e) => onDescVinted(e.target.value)} />
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Hashtags inclus en bas du texte, modifiables directement.</div>
        </div>
      )}

      {plateformes.includes("leboncoin") && (
        <div className="psection">
          <div className="psection-hd">
            <span className="psection-label" style={{ color: "#B54510" }}>● LeBonCoin</span>
            <div style={{ display: "flex", gap: 5 }}>
              <CopyBtn getText={() => titre} label="Titre" />
              <CopyBtn getText={() => descLbc} label="Description" />
            </div>
          </div>
          <textarea className="textarea" rows={3} value={descLbc} onChange={(e) => onDescLbc(e.target.value)} />
        </div>
      )}

      {result.prix_recommande && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>Reco IA :</span>
          <span className="prix-reco" style={{ fontSize: 15 }}>{result.prix_recommande} €</span>
          {result.prix_note && <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>— {result.prix_note}</span>}
        </div>
      )}
    </div>
  );
}
