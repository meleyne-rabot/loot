import { useState } from "react";
import { Minus, Plus, ChatsCircle, Lifebuoy } from "@phosphor-icons/react";

const C = {
  canvas: "#F6F2EC", surface: "#FFFFFF", ink: "#1C1B3A",
  muted1: "#6B6980", muted2: "#8A879B",
  border: "#E3DCD0",
  coral: "#F03C64", coralTint: "#FFF0F2",
};
const F = {
  title: "'Bricolage Grotesque', system-ui, sans-serif",
  body: "'Hanken Grotesk', system-ui, sans-serif",
};
const SHADOW = { card: "0 2px 10px rgba(28,27,58,.05)" };

const FAQ = [
  {
    q: "Pourquoi je ne peux pas lier mon compte Vinted ou LeBonCoin ?",
    a: "La question à 1M€. Vinted et LeBonCoin ne proposent pas d'API publique. Simuler une connexion directe sur ces plateformes violerait leurs conditions d'utilisation, avec deux risques : que la fonctionnalité disparaisse du jour au lendemain si la plateforme la détecte, et surtout — le vrai risque — le bannissement de ton compte. 😬 Si tu es sur Loot, c'est sûrement pas pour te faire virer de Vinted. On reste en contact avec ces plateformes pour activer ça le jour où une API publique existe — et ce jour-là, on sabre le champagne. 🍾",
  },
  {
    q: "L'outil est-il précis sur les recommandations de prix ?",
    a: "Franchement, c'est un axe qu'on améliore en continu. Loot s'appuie sur les modèles d'Anthropic pour analyser les objets similaires en ligne et te proposer un prix de départ — mais ces objets sont ceux qui sont listés, pas forcément ceux qui se vendent, donc le prix a tendance à être surestimé. C'est pour ça qu'on te recommande de recaler ton prix avec la reco Vinted ou LeBonCoin au moment de publier : elle se base sur les ventes réelles. Et plus tu utilises Loot, plus les recos s'affinent.",
  },
  {
    q: "Comment fonctionne la génération d'annonces ?",
    a: "Tu ajoutes tes photos et deux infos (prix d'achat, provenance). Loot rédige un titre, une description et te suggère un prix. Tu vérifies, tu ajustes si besoin, puis tu copies-colles sur Vinted ou LeBonCoin. ✨",
  },
  {
    q: "C'est quoi une Malle ?",
    a: "Une Malle est un sous-compte pour vendre les affaires de tes proches. Chaque Malle garde son propre décompte : ce qui est vendu, ta commission, et ce qu'il te reste à reverser — tout reste clair.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Tes photos et infos sont hébergées sur une infrastructure sécurisée (Supabase), chiffrées, et accessibles uniquement via ta connexion Google — jamais de mot de passe stocké. Tu peux exporter ou supprimer tes données à tout moment depuis ton compte.",
  },
  {
    q: "Loot est-il gratuit ?",
    a: "Loot est gratuit au lancement — profites-en pour tester toutes les fonctionnalités sans limite. À terme, l'offre Loot Pro débloquera les Malles illimitées, le suivi financier avancé et la génération sans limite.",
  },
  {
    q: "Qui est derrière Loot ?",
    a: "Loot est né d'une power seller — moi — qui en avait marre d'écrire la même annonce pour la 400e fois. Ce n'est pas mon métier, c'est mon activité à côté du taf, ma passion pour la chine. Je voulais un outil pour moi. Je le construis pour vous.",
  },
];

function FaqItem({ q, a, isOpen, onToggle }) {
  return (
    <div style={{ background: C.surface, borderRadius: 16, padding: 16, boxShadow: SHADOW.card }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", border: "none", background: "none", cursor: "pointer",
          padding: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: 12, textAlign: "left",
        }}
      >
        <span style={{ font: `700 14px/1.35 ${F.body}`, color: C.ink }}>{q}</span>
        <span style={{
          width: 26, height: 26, flexShrink: 0, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: isOpen ? C.coralTint : C.canvas,
        }}>
          {isOpen
            ? <Minus size={14} weight="bold" color={C.coral} />
            : <Plus size={14} weight="bold" color={C.muted2} />
          }
        </span>
      </button>
      {isOpen && (
        <p style={{ font: `400 13px/1.65 ${F.body}`, color: C.muted1, margin: "11px 0 0" }}>{a}</p>
      )}
    </div>
  );
}

export function FaqSection({ onContact }) {
  const [open, setOpen] = useState(0);

  return (
    <div style={{ fontFamily: F.body }}>
      {/* intro navy */}
      <div style={{
        background: C.ink, borderRadius: 20, padding: "16px 18px", color: "#fff",
        position: "relative", overflow: "hidden", marginBottom: 16,
      }}>
        <ChatsCircle size={68} weight="fill" color="#fff" style={{ position: "absolute", right: -10, top: -8, opacity: .1, pointerEvents: "none" }} />
        <div style={{ font: `700 15px ${F.title}`, marginBottom: 3 }}>Une question ? On a la réponse.</div>
        <div style={{ font: `400 12.5px/1.5 ${F.body}`, color: "#C9C7D6" }}>Le B.A.-BA de Loot en quelques points.</div>
      </div>

      {/* accordéon */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {FAQ.map((item, i) => (
          <FaqItem
            key={i}
            q={item.q}
            a={item.a}
            isOpen={open === i}
            onToggle={() => setOpen(open === i ? -1 : i)}
          />
        ))}
      </div>

      {/* contact */}
      <div style={{
        background: C.coralTint, border: "1px solid #FADAE0", borderRadius: 16,
        padding: 16, marginTop: 16, display: "flex", alignItems: "center", gap: 13,
      }}>
        <span style={{
          width: 42, height: 42, flexShrink: 0, borderRadius: 12, background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Lifebuoy size={22} weight="fill" color={C.coral} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ font: `700 13.5px ${F.body}`, color: C.ink }}>Tu ne trouves pas ta réponse ?</div>
          <div style={{ font: `500 12px ${F.body}`, color: C.muted2 }}>On te répond en général sous 24 h.</div>
        </div>
        <button
          onClick={onContact}
          style={{
            border: "none", background: C.coral, color: "#fff",
            font: `700 12.5px ${F.body}`, padding: "10px 14px", borderRadius: 11,
            cursor: "pointer", boxShadow: "0 5px 13px rgba(240,60,100,.26)",
          }}
        >Contact</button>
      </div>
    </div>
  );
}
