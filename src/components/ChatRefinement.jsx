import { useState } from "react";
import { refineAI } from "../lib/ai";
import { useAuth } from "../context/AuthContext";

export function ChatRefinement({ images, context, result, onRefined }) {
  const { user } = useAuth();
  const [chatInput, setChatInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!chatInput.trim() || loading) return;
    const msg = { role: "user", content: chatInput };
    const newHistory = [...history, msg];
    setHistory(newHistory);
    setChatInput("");
    setLoading(true);
    try {
      const refined = await refineAI(
        images, context, result,
        newHistory.map((m) => ({ role: m.role, content: m.content })),
        user?.user_metadata?.full_name
      );
      setHistory((h) => [...h, { role: "assistant", content: refined.message_chat || "✓ Annonce mise à jour" }]);
      onRefined(refined);
    } catch {
      setHistory((h) => [...h, { role: "assistant", content: "Erreur, réessaie." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 12, background: "#fff", borderRadius: 12, border: "2px solid var(--pink-border)", overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", borderBottom: "1.5px solid var(--pink-border)", background: "var(--pink-light)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: "var(--muted)" }}>
          💬 Affiner l'annonce
        </span>
      </div>
      {history.length > 0 && (
        <div style={{ padding: "10px 14px", maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "var(--pink)" : "#F5F5F5",
                color: m.role === "user" ? "#fff" : "var(--navy)",
                padding: "6px 12px", borderRadius: 10, fontSize: 13, maxWidth: "85%",
              }}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", background: "#F5F5F5", padding: "6px 12px", borderRadius: 10, fontSize: 13, color: "var(--muted)" }}>
              <span className="spinner" style={{ borderTopColor: "var(--muted)" }} /> Correction…
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px" }}>
        <input
          className="input"
          style={{ flex: 1, margin: 0 }}
          placeholder="Ex: baisse le prix, corrige le titre, ajoute #vintage…"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
        />
        <button className="btn btn-primary" onClick={send} disabled={!chatInput.trim() || loading} style={{ padding: "8px 14px", flexShrink: 0 }}>
          Envoyer
        </button>
      </div>
    </div>
  );
}
