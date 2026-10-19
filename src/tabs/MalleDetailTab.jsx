import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { createReversement, listReversements, updateMalle, addCredit, removeCredit } from "../lib/malles";
import { TreasureChest, ArrowDown, CreditCard, Coins, Buildings, Phone, Wallet, CheckCircle, Copy, PlusCircle, Trash, PiggyBank } from "@phosphor-icons/react";

const METHODES = [
  { value: "virement",  label: "Virement",  icon: Buildings },
  { value: "paypal",    label: "PayPal",    icon: CreditCard },
  { value: "wero",      label: "Wero",      icon: Phone },
  { value: "especes",   label: "Espèces",   icon: Coins },
  { value: "autre",     label: "Autre",     icon: Wallet },
];

const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const fmtMontant = (n) => Number(n).toFixed(2).replace(".", ",") + " €";

export function MalleDetailTab({ malle, onBack }) {
  const { user }      = useAuth();
  const { showToast } = useToast();

  const [dette, setDette]           = useState(parseFloat(malle.detteMalle) || 0);
  const [reversements, setReversements] = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [montant, setMontant]       = useState("");
  const [methode, setMethode]       = useState("virement");
  const [note, setNote]             = useState("");
  const [date, setDate]             = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving]         = useState(false);
  const [weroMsg, setWeroMsg]       = useState(false);

  // Édition PayPal
  const [editPaypal, setEditPaypal] = useState(false);
  const [paypalInput, setPaypalInput] = useState(malle.paypalMe || "");

  // Cagnotte — crédits manuels
  const [credits, setCredits] = useState(malle.credits || []);
  const [showCreditForm, setShowCreditForm] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditMotif, setCreditMotif] = useState("");
  const [creditDate, setCreditDate] = useState(new Date().toISOString().slice(0, 10));
  const [savingCredit, setSavingCredit] = useState(false);

  useEffect(() => {
    listReversements(malle.id, user.id).then(setReversements).catch(() => {});
  }, [malle.id]);

  const openForm = () => {
    setMontant(dette > 0 ? dette.toFixed(2) : "");
    setShowForm(true);
  };

  const submit = async () => {
    const m = parseFloat(String(montant).replace(",", "."));
    if (!m || m <= 0) { showToast("Montant invalide"); return; }
    setSaving(true);
    try {
      await createReversement(malle.id, user.id, m, methode, date, note);
      const newDette = Math.max(0, dette - m);
      setDette(newDette);
      setReversements(await listReversements(malle.id, user.id));
      setShowForm(false);
      setNote("");
      showToast("✓ Reversement enregistré");
    } catch (e) {
      showToast("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const copyMontantWero = async () => {
    const m = parseFloat(String(montant).replace(",", ".")) || dette;
    try {
      await navigator.clipboard.writeText(m.toFixed(2));
      setWeroMsg(true);
      setTimeout(() => setWeroMsg(false), 3500);
    } catch {
      showToast("Impossible de copier");
    }
  };

  const openPaypal = () => {
    const m = parseFloat(String(montant).replace(",", ".")) || dette;
    const pseudo = (malle.paypalMe || "").replace(/^https?:\/\/paypal\.me\//i, "").replace(/^paypal\.me\//i, "");
    window.open(`https://paypal.me/${pseudo}/${m.toFixed(2)}`, "_blank");
  };

  const savePaypal = async () => {
    await updateMalle(malle.id, user.id, { paypalMe: paypalInput.trim() });
    malle.paypalMe = paypalInput.trim();
    setEditPaypal(false);
    showToast("✓ PayPal.me enregistré");
  };

  const totalVerse = reversements.reduce((s, r) => s + parseFloat(r.montant), 0);
  const totalCredits = credits.reduce((s, c) => s + parseFloat(c.amount || 0), 0);

  const submitCredit = async () => {
    const a = parseFloat(String(creditAmount).replace(",", "."));
    if (!a || a <= 0) { showToast("Montant invalide"); return; }
    setSavingCredit(true);
    try {
      const updated = await addCredit(malle.id, user.id, { amount: a, motif: creditMotif.trim(), date: creditDate });
      setCredits(updated.credits);
      setShowCreditForm(false);
      setCreditAmount(""); setCreditMotif("");
      setCreditDate(new Date().toISOString().slice(0, 10));
      showToast("✓ Crédit ajouté");
    } catch { showToast("Erreur lors de l'ajout"); }
    finally { setSavingCredit(false); }
  };

  const deleteCredit = async (creditId) => {
    try {
      const updated = await removeCredit(malle.id, user.id, creditId);
      setCredits(updated.credits);
      showToast("Crédit supprimé");
    } catch { showToast("Erreur"); }
  };

  return (
    <div className="page">
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 14 }}>← Retour</button>

      {/* En-tête navy */}
      <div style={{
        borderRadius: 20, background: "#1C1B3A", padding: "20px 20px 18px",
        marginBottom: 14, position: "relative", overflow: "hidden",
      }}>
        <TreasureChest size={90} color="rgba(255,255,255,.05)"
          style={{ position: "absolute", right: -10, bottom: -16, pointerEvents: "none" }} />
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "#6B6880", textTransform: "uppercase", marginBottom: 4 }}>
          DETTE ACTUELLE · {malle.nom}
        </div>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 36, color: dette > 0 ? "#fff" : "#1BA868", lineHeight: 1 }}>
          {fmtMontant(dette)}
        </div>
        {dette === 0 && (
          <div style={{ fontSize: 12, color: "#1BA868", marginTop: 6, fontWeight: 600 }}>Tu es à jour ✓</div>
        )}
        {dette > 0 && (
          <div style={{ fontSize: 12, color: "#B7B5C8", marginTop: 6 }}>
            {malle.commissionPct > 0 ? `Commission ${malle.commissionPct}% déduite` : "0% commission"}
            {totalVerse > 0 && ` · ${fmtMontant(totalVerse)} déjà versé`}
          </div>
        )}
      </div>

      {/* Bouton principal */}
      {!showForm && dette > 0 && (
        <button
          onClick={openForm}
          style={{
            width: "100%", border: "none", borderRadius: 16,
            background: "#F03C64", color: "#fff", fontFamily: "'Hanken Grotesk', sans-serif",
            fontWeight: 700, fontSize: 15, padding: "14px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginBottom: 14,
          }}
        >
          <ArrowDown size={18} />
          Effectuer un reversement
        </button>
      )}

      {/* Formulaire de reversement */}
      {showForm && (
        <div style={{ background: "var(--surface)", borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: "var(--shadow-card)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>
            Nouveau reversement
          </div>

          {/* Montant */}
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Montant (€)</label>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            style={{ marginBottom: 12, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18 }}
          />

          {/* Méthode */}
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 6 }}>Méthode</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {METHODES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setMethode(value)}
                style={{
                  border: methode === value ? "2px solid #1C1B3A" : "2px solid #E3DCD0",
                  borderRadius: 12, padding: "6px 12px", fontSize: 12.5, fontWeight: 600,
                  background: methode === value ? "#1C1B3A" : "transparent",
                  color: methode === value ? "#fff" : "var(--muted)",
                  cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* Boutons PayPal / Wero */}
          {methode === "paypal" && (
            <div style={{ marginBottom: 12 }}>
              {malle.paypalMe ? (
                <button
                  onClick={openPaypal}
                  style={{
                    width: "100%", border: "none", borderRadius: 12, padding: "10px",
                    background: "#003087", color: "#fff", fontWeight: 700, fontSize: 13,
                    cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <CreditCard size={15} />
                  Payer via PayPal · {fmtMontant(parseFloat(String(montant).replace(",", ".")) || dette)}
                </button>
              ) : (
                <div style={{ fontSize: 12, color: "var(--muted)", background: "#F6F2EC", borderRadius: 10, padding: "10px 12px" }}>
                  Renseigne le PayPal.me de {malle.nom} dans les réglages de la malle pour activer ce bouton.
                </div>
              )}
            </div>
          )}

          {methode === "wero" && (
            <div style={{ marginBottom: 12 }}>
              <button
                onClick={copyMontantWero}
                style={{
                  width: "100%", border: "none", borderRadius: 12, padding: "10px",
                  background: "#6B30C8", color: "#fff", fontWeight: 700, fontSize: 13,
                  cursor: "pointer", fontFamily: "'Hanken Grotesk', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Copy size={15} />
                Copier le montant pour Wero
              </button>
              {weroMsg && (
                <div style={{ marginTop: 8, borderRadius: 10, background: "#EDE9FF", padding: "10px 12px", fontSize: 12, color: "#5B35CC", fontWeight: 600 }}>
                  ✓ Montant copié — ouvre ton app bancaire, sélectionne {malle.nom} et colle le montant.
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ marginBottom: 12 }} />

          {/* Note */}
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Note (optionnel)</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Ex: virement du 3 juillet…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ resize: "none", marginBottom: 14 }}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={submit} disabled={saving || !montant}>
              {saving ? "Enregistrement…" : "Valider le reversement"}
            </button>
            <button className="btn" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Cagnotte — crédits manuels */}
      <div style={{ background: "var(--surface)", borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: "var(--shadow-card)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <PiggyBank size={16} weight="fill" color="#2FA96A" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--muted)", textTransform: "uppercase" }}>
              Cagnotte · {fmtMontant(totalCredits)}
            </span>
          </div>
          <button onClick={() => setShowCreditForm((v) => !v)} style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 12, fontWeight: 600, color: "#2FA96A",
            background: "#DDF1E6", border: "none", borderRadius: 10, padding: "5px 10px", cursor: "pointer",
          }}>
            <PlusCircle size={13} />
            Ajouter
          </button>
        </div>

        {showCreditForm && (
          <div style={{ background: "#F6FBF8", borderRadius: 14, padding: 14, marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Montant (€)</label>
            <input className="input" type="number" min="0" step="0.01" value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              style={{ marginBottom: 10, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18 }} />
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Motif</label>
            <input className="input" placeholder="Ex: argent de poche octobre, cadeau anniversaire…"
              value={creditMotif} onChange={(e) => setCreditMotif(e.target.value)} style={{ marginBottom: 10 }} />
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", display: "block", marginBottom: 4 }}>Date</label>
            <input className="input" type="date" value={creditDate}
              onChange={(e) => setCreditDate(e.target.value)} style={{ marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={submitCredit} disabled={savingCredit || !creditAmount}
                style={{ background: "#2FA96A", boxShadow: "none" }}>
                {savingCredit ? "Enregistrement…" : "Valider"}
              </button>
              <button className="btn" onClick={() => setShowCreditForm(false)}>Annuler</button>
            </div>
          </div>
        )}

        {credits.length === 0 && !showCreditForm && (
          <div style={{ fontSize: 12, color: "var(--muted-2)", textAlign: "center", padding: "8px 0" }}>
            Aucun crédit manuel pour l'instant.
          </div>
        )}

        {credits.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {[...credits].sort((a, b) => b.date.localeCompare(a.date)).map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10,
                background: "#F6FBF8", borderRadius: 12, padding: "9px 12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{fmtMontant(c.amount)}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted-2)", marginTop: 1 }}>
                    {fmtDate(c.date)}{c.motif ? ` · ${c.motif}` : ""}
                  </div>
                </div>
                <button onClick={() => deleteCredit(c.id)} style={{
                  background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--muted-3)",
                }}>
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Config PayPal.me */}
      <div style={{ background: "var(--surface)", borderRadius: 16, padding: "12px 14px", marginBottom: 14, boxShadow: "var(--shadow-card)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: editPaypal ? 8 : 0 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>PayPal.me de {malle.nom}</div>
            <div style={{ fontSize: 11, color: "var(--muted-2)" }}>
              {malle.paypalMe || "Non renseigné"}
            </div>
          </div>
          <button
            onClick={() => setEditPaypal(!editPaypal)}
            style={{ fontSize: 11, fontWeight: 600, color: "#5B35CC", background: "#EDE9FF", border: "none", borderRadius: 10, padding: "4px 10px", cursor: "pointer" }}
          >
            {editPaypal ? "Annuler" : "Modifier"}
          </button>
        </div>
        {editPaypal && (
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              className="input input-sm"
              placeholder="paypal.me/pseudo"
              value={paypalInput}
              onChange={(e) => setPaypalInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-dark btn-xs" onClick={savePaypal}>OK</button>
          </div>
        )}
      </div>

      {/* Historique */}
      {reversements.length > 0 && (
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 10 }}>
            Historique · {fmtMontant(totalVerse)} versé
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reversements.map((r) => {
              const M = METHODES.find((m) => m.value === r.methode) || METHODES[4];
              return (
                <div key={r.id} style={{
                  background: "var(--surface)", borderRadius: 14, padding: "11px 13px",
                  display: "flex", alignItems: "center", gap: 10,
                  boxShadow: "var(--shadow-card)",
                }}>
                  <span style={{
                    width: 34, height: 34, borderRadius: 10, background: "#E8F9F1",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <CheckCircle size={18} color="#1BA868" weight="fill" />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{fmtMontant(r.montant)}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted-2)", marginTop: 1 }}>
                      {fmtDate(r.date)} · {M.label}
                      {r.note && ` · ${r.note}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {reversements.length === 0 && dette === 0 && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 13 }}>
          Aucun reversement encore enregistré.
        </div>
      )}
    </div>
  );
}
