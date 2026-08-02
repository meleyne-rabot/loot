// Petite barre de progression visuelle (pas de navigation, juste un repère).
// `current` = index (0-based) de l'étape active parmi `labels`.
export function StepIndicator({ labels, current }) {
  return (
    <div className="step-indicator">
      {labels.map((label, i) => (
        <div
          key={label}
          className={"step-indicator-item" + (i < current ? " done" : i === current ? " active" : "")}
          title={label}
        />
      ))}
    </div>
  );
}
