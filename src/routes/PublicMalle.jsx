import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
const supabasePublic = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);
import { TreasureChest, Tag, CheckCircle, ShoppingBag, Percent, ArrowDown } from "@phosphor-icons/react";

const C = {
  navy: "#1C1B3A", coral: "#F03C64", green: "#2FA96A", greenDark: "#1BA868",
  greenTint: "#DDF1E6", muted: "#8A879B", muted2: "#B7AE9E", ink: "#1C1B3A",
  canvas: "#F6F2EC", surface: "#FFFFFF", border: "#E3DCD0", divider: "#F0EBE3",
  violet: "#5B35CC", violetTint: "#EDE9FF",
  amber: "#E0912F", amberTint: "#FBEAD1",
};
const F = { title: "'Bricolage Grotesque', system-ui, sans-serif", body: "'Hanken Grotesk', system-ui, sans-serif" };
const card = { background: C.surface, borderRadius: 18, padding: "16px", boxShadow: "0 2px 10px rgba(28,27,58,.05)", marginBottom: 12 };

function setMeta(property, content) {
  let el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(property.startsWith("og:") || property.startsWith("twitter:") ? "property" : "name", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function PublicMalle() {
  const { token } = useParams();
  const [malle, setMalle]   = useState(null);
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    async function load() {
      const { data: malleData, error: malleErr } = await supabasePublic
        .from("malles")
        .select("id, nom, description, commission_pct, dette_malle")
        .eq("share_token", token)
        .single();
      if (malleErr || !malleData) { setError("Ce lien est invalide ou a expiré."); setLoading(false); return; }

      const { data: itemsData, error: itemsErr } = await supabasePublic
        .from("items")
        .select("id, name, image, statut, prix_affiche, prix_vente, prix_recommande, montant_a_reverser, reverse_paye, date_reversement, vendu_at")
        .eq("malle_id", malleData.id)
        .order("vendu_at", { ascending: false, nullsFirst: false });
      if (itemsErr) { setError("Impossible de charger les articles."); setLoading(false); return; }

      setMalle(malleData);
      setItems(itemsData || []);
      setLoading(false);

      // OG / share snippet
      const pageTitle = `Malle de ${malleData.nom} · loot`;
      const pageDesc  = `Suis les ventes en temps réel · 100 % transparence`;
      document.title = pageTitle;
      setMeta("og:title",       pageTitle);
      setMeta("og:description", pageDesc);
      setMeta("og:url",         window.location.href);
      setMeta("og:type",        "website");
      setMeta("twitter:card",   "summary");
      setMeta("twitter:title",  pageTitle);
      setMeta("twitter:description", pageDesc);
    }
    load();
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.canvas, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: F.body, color: C.muted, fontSize: 14 }}>Chargement…</div>
    </div>
  );
  if (error) return (
    <div style={{ minHeight: "100vh", background: C.canvas, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
      <TreasureChest size={48} color={C.muted} />
      <p style={{ fontFamily: F.body, color: C.muted, fontSize: 14, textAlign: "center" }}>{error}</p>
    </div>
  );

  const vendus  = items.filter((i) => i.statut === "vendu");
  const enVente = items.filter((i) => i.statut === "en-vente");
  const commPct = malle.commission_pct ?? 0;

  const caTotal      = vendus.reduce((s, i) => s + (parseFloat(i.prix_vente) || 0), 0);
  const totalARevers = vendus.reduce((s, i) => s + (parseFloat(i.montant_a_reverser) || 0), 0);
  const resteAVers   = parseFloat(malle.dette_malle) || 0;
  const dejaVerse    = totalARevers - resteAVers;
  const commission   = caTotal - totalARevers;

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : null;

  return (
    <div style={{ minHeight: "100vh", background: C.canvas, fontFamily: F.body }}>

      {/* ── Header navy ── */}
      <div style={{ background: C.navy, padding: "22px 20px 28px", position: "relative", overflow: "hidden" }}>
        <TreasureChest size={110} color="rgba(255,255,255,.05)" style={{ position: "absolute", right: -14, bottom: -22, pointerEvents: "none" }} />
        {/* Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <span style={{ fontFamily: F.title, fontWeight: 800, fontSize: 13, color: C.coral }}>loot</span>
          <span style={{ fontSize: 11, color: "#6B6880" }}>·</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#6B6880" }}>suivi de vente</span>
        </div>
        <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: 28, color: "#fff", margin: "0 0 6px", letterSpacing: "-.01em" }}>
          {malle.nom}
        </h1>
        {malle.description && (
          <p style={{ fontSize: 13, color: "#B7B5C8", margin: "0 0 14px", lineHeight: 1.5 }}>{malle.description}</p>
        )}
        {/* Badge transparence */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: "rgba(255,255,255,.08)", borderRadius: 20,
          padding: "5px 12px", fontSize: 11, fontWeight: 600, color: "#B7B5C8",
        }}>
          <CheckCircle size={13} color="#9B8FFF" weight="fill" />
          100 % transparence · mis à jour en temps réel
        </span>
      </div>

      <div style={{ padding: "16px 16px 56px", maxWidth: 480, margin: "0 auto" }}>

        {/* ── Bloc financier principal ── */}
        {vendus.length > 0 && (
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            {/* En-tête du bloc */}
            <div style={{ background: C.navy, padding: "14px 16px 12px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "#6B6880", textTransform: "uppercase", marginBottom: 4 }}>Bilan financier</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: F.title, fontWeight: 800, fontSize: 30, color: "#fff" }}>{caTotal.toFixed(0)} €</span>
                <span style={{ fontSize: 13, color: "#B7B5C8" }}>collectés sur {vendus.length} vente{vendus.length > 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Lignes détail */}
            <div style={{ padding: "4px 0" }}>
              {/* Commission */}
              {commPct > 0 && (
                <FinRow
                  icon={<Percent size={14} color={C.amber} weight="fill" />}
                  label={`Commission Loot (${commPct}%)`}
                  value={`− ${commission.toFixed(2)} €`}
                  valueColor={C.amber}
                  bg={C.amberTint}
                />
              )}
              {/* Total à reverser */}
              <FinRow
                icon={<ArrowDown size={14} color={C.violet} weight="fill" />}
                label="Total à te reverser"
                value={`${totalARevers.toFixed(2)} €`}
                valueColor={C.violet}
                bg={C.violetTint}
              />
              {/* Déjà versé */}
              {dejaVerse > 0 && (
                <FinRow
                  icon={<CheckCircle size={14} color={C.green} weight="fill" />}
                  label="Déjà versé"
                  value={`${dejaVerse.toFixed(2)} €`}
                  valueColor={C.green}
                  bg={C.greenTint}
                />
              )}
              {/* Reste */}
              <div style={{
                margin: "8px 12px 12px",
                padding: "12px 14px",
                borderRadius: 12,
                background: resteAVers > 0 ? "#FEE8EE" : C.greenTint,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: resteAVers > 0 ? C.coral : C.greenDark }}>
                  {resteAVers > 0 ? "Reste à verser" : "Tout est versé ✓"}
                </span>
                {resteAVers > 0 && (
                  <span style={{ fontFamily: F.title, fontWeight: 800, fontSize: 18, color: C.coral }}>
                    {resteAVers.toFixed(2)} €
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Stats rapides ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Vendus", value: vendus.length, icon: <CheckCircle size={16} color={C.green} weight="fill" /> },
            { label: "En vente", value: enVente.length, icon: <ShoppingBag size={16} color={C.coral} weight="fill" /> },
            { label: "Total", value: items.length, icon: <TreasureChest size={16} color={C.navy} weight="fill" /> },
          ].map((s) => (
            <div key={s.label} style={{ background: C.surface, borderRadius: 14, padding: "12px 10px", textAlign: "center", boxShadow: "0 2px 8px rgba(28,27,58,.04)" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 20, color: C.ink }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Articles en vente ── */}
        {enVente.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <SectionTitle>En vente · {enVente.length} article{enVente.length > 1 ? "s" : ""}</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {enVente.map((item) => <ItemCard key={item.id} item={item} />)}
            </div>
          </section>
        )}

        {/* ── Articles vendus ── */}
        {vendus.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <SectionTitle>Vendus · {caTotal.toFixed(0)} € collectés</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {vendus.map((item) => <ItemCard key={item.id} item={item} fmtDate={fmtDate} />)}
            </div>
          </section>
        )}

        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: C.muted, fontSize: 14 }}>
            Aucun article dans cette malle pour l'instant.
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ marginTop: 32, textAlign: "center", display: "flex", flexDirection: "column", gap: 4 }}>
          <div>
            <span style={{ fontSize: 12, color: C.muted2 }}>Suivi de vente propulsé par </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.coral, fontFamily: F.title }}>loot</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted2 }}>Toutes les données sont synchronisées en temps réel</div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>
      {children}
    </div>
  );
}

function FinRow({ icon, label, value, valueColor, bg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: 13, color: C.ink, fontFamily: F.body }}>{label}</span>
      </div>
      <span style={{ fontFamily: F.title, fontWeight: 700, fontSize: 14, color: valueColor, whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

function ItemCard({ item, fmtDate }) {
  const vendu = item.statut === "vendu";
  const prix  = parseFloat(item.prix_vente) || parseFloat(item.prix_affiche) || parseFloat(item.prix_recommande) || null;
  const aRev  = parseFloat(item.montant_a_reverser) || null;
  const date  = fmtDate && item.vendu_at ? fmtDate(item.vendu_at) : null;

  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "11px 13px",
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 2px 8px rgba(28,27,58,.04)",
    }}>
      {item.image
        ? <img src={item.image} alt={item.name} style={{ width: 50, height: 50, borderRadius: 10, objectFit: "cover", flexShrink: 0, filter: vendu ? "grayscale(20%)" : "none" }} />
        : <div style={{ width: 50, height: 50, borderRadius: 10, background: "#F0EBE3", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Tag size={18} color="#C4BDB0" />
          </div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.name}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
          {prix > 0 && (
            <span style={{ fontSize: 12, color: vendu ? C.greenDark : C.muted, fontWeight: 600 }}>
              {vendu ? "Vendu " : ""}{prix % 1 === 0 ? prix.toFixed(0) : prix.toFixed(2)} €
            </span>
          )}
          {vendu && aRev > 0 && (
            <span style={{ fontSize: 12, color: C.violet, fontWeight: 600 }}>
              · Dû {aRev.toFixed(2)} €
            </span>
          )}
          {date && <span style={{ fontSize: 11, color: C.muted }}>{date}</span>}
        </div>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, flexShrink: 0,
        background: vendu ? C.violetTint : "#FEE8EE",
        color: vendu ? C.violet : "#C22A50",
      }}>
        {vendu ? "Vendu" : "En vente"}
      </span>
    </div>
  );
}
