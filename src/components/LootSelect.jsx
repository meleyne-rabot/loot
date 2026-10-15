import { useEffect, useRef, useState } from "react";
import { C, F, SHADOW } from "../lib/loot-tokens";

/**
 * Dropdown custom 100% brandé — remplace <select> natif.
 *
 * Props :
 *   value      — valeur sélectionnée (string | null)
 *   onChange   — (value: string) => void
 *   options    — [{ value, label, disabled? }]
 *   placeholder — texte affiché si rien de sélectionné
 *   small      — taille réduite (filtres)
 *   className  — classe CSS additionnelle sur le trigger
 */
export function LootSelect({ value, onChange, options = [], placeholder = "—", small = false, pill = false, active = false, className = "", style = {} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find((o) => o.value === value);

  // Ferme si clic en dehors
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, [open]);

  // Ferme sur Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const h = pill ? 32 : small ? 34 : 46;
  const fs = pill ? 12 : small ? 12 : 14;
  const px = pill ? 12 : small ? 10 : 14;
  const br = pill ? 999 : 14;

  const isActive = pill && active;
  const triggerStyle = {
    display: "inline-flex", alignItems: "center", justifyContent: "space-between", gap: 5,
    height: h, padding: `0 ${px}px`,
    background: isActive ? C.ink : C.surface,
    border: `1.5px solid ${isActive ? C.ink : open ? C.coral : C.border}`,
    borderRadius: br, cursor: "pointer",
    font: `600 ${fs}px ${F.body}`,
    color: isActive ? "#fff" : selected ? C.ink : C.muted2,
    boxShadow: open && !pill ? `0 0 0 3px rgba(240,60,100,.12)` : "none",
    transition: "border-color .15s, box-shadow .15s",
    userSelect: "none", WebkitTapHighlightColor: "transparent",
    width: pill ? "auto" : "100%", boxSizing: "border-box",
    ...style,
  };

  // Dropdown positionné en absolu sous le trigger
  const dropStyle = {
    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999,
    background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 16,
    boxShadow: SHADOW.cardHi,
    overflow: "hidden", maxHeight: 280, overflowY: "auto",
  };

  return (
    <div ref={ref} style={{ position: "relative" }} className={className}>
      <div style={triggerStyle} onClick={() => setOpen((o) => !o)} role="button" aria-haspopup="listbox" aria-expanded={open}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width={pill ? 11 : small ? 13 : 15} height={pill ? 11 : small ? 13 : 15} viewBox="0 0 24 24" fill="none"
          stroke={isActive ? "#fff" : C.muted2} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transition: "transform .15s", transform: open ? "rotate(180deg)" : "none" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {open && (
        <div style={dropStyle} role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div key={opt.value}
                role="option" aria-selected={isSelected}
                style={{
                  padding: `${small ? 9 : 12}px ${px + 2}px`,
                  font: `${isSelected ? 700 : 500} ${fs}px ${F.body}`,
                  color: opt.disabled ? C.muted3 : isSelected ? C.coral : C.ink,
                  background: isSelected ? C.coralTint : "transparent",
                  cursor: opt.disabled ? "default" : "pointer",
                  borderBottom: `1px solid ${C.divider}`,
                }}
                onMouseEnter={(e) => { if (!opt.disabled && !isSelected) e.currentTarget.style.background = C.canvas; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? C.coralTint : "transparent"; }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { if (!opt.disabled) { onChange(opt.value); setOpen(false); } }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
