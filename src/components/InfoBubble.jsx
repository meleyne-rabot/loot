import { useEffect, useRef, useState } from "react";

// Petite bulle d'aide contextuelle : icône "?" cliquable qui affiche un
// texte explicatif dans un popover, fermé au clic extérieur.
export function InfoBubble({ children, align = "left", label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <span className="info-bubble" ref={ref}>
      <button type="button" className="info-bubble-trigger" onClick={() => setOpen((v) => !v)} aria-label="Aide" style={label ? { borderRadius: 8, padding: "3px 8px", fontSize: 11, width: "auto" } : {}}>
        {label || "?"}
      </button>
      {open && <div className={"info-bubble-panel " + align}>{children}</div>}
    </span>
  );
}
