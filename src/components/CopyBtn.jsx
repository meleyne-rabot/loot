import { useState } from "react";

export function CopyBtn({ getText, label }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className={"btn-copy" + (ok ? " ok" : "")}
      onClick={() => {
        navigator.clipboard.writeText(getText());
        setOk(true);
        setTimeout(() => setOk(false), 1800);
      }}
    >
      {ok ? "✓ Copié" : "⎘ " + label}
    </button>
  );
}
