// Faq.jsx — Écran FAQ (ouvert depuis le menu profil). Accordéon propre au système.
// Header avec croix (écran poussé/modal), carte navy d'intro, questions en cards accordéon,
// bloc contact en bas.
//
// deps: react, @phosphor-icons/react + loot-tokens.js

import React, { useState } from 'react';
import { X, Minus, Plus, ChatsCircle, Lifebuoy } from '@phosphor-icons/react';
import { C, F, SHADOW } from './loot-tokens';

const screen = {
  width: '100%', maxWidth: 480, margin: '0 auto', boxSizing: 'border-box',
  padding: '16px 18px 40px', background: C.canvas, minHeight: '100%', fontFamily: F.body, color: C.ink,
};

const FAQ = [
  { q: "Comment fonctionne la génération d'annonces ?",
    a: "Tu ajoutes tes photos et deux infos (prix d'achat, provenance). L'IA rédige un titre, une description et te suggère un prix. Tu vérifies, tu ajustes si besoin, puis tu copies-colles sur Vinted ou LeBonCoin. ✨" },
  { q: "Pourquoi je ne peux pas lier mon compte Vinted directement ?",
    a: "Vinted et LeBonCoin ne proposent pas de connexion officielle fiable pour publier à ta place. Loot te prépare l'annonce parfaite à copier-coller en quelques secondes — c'est plus sûr pour ton compte et ça marche à tous les coups." },
  { q: "C'est quoi une Malle ?",
    a: "Une Malle est un sous-compte pour vendre les affaires de tes proches. Chaque Malle garde son propre décompte : ce qui est vendu, ta commission, et ce qu'il te reste à reverser — tout reste clair." },
  { q: "L'IA est-elle précise sur les prix ?",
    a: "Elle te donne une fourchette de départ basée sur des ventes comparables. Au moment de lister, on te conseille de confirmer avec la reco de Vinted/LBC (basée sur un très gros volume) — c'est le prix réel que tu saisis qui alimente tes stats." },
  { q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Tes photos et tes infos de vente restent privées et ne sont jamais partagées. Tu peux exporter ou supprimer tes données à tout moment depuis ton compte." },
  { q: "Loot est-il gratuit ?",
    a: "Tu peux générer tes premières annonces gratuitement. L'offre Loot Pro débloque les Malles illimitées, le suivi financier avancé et la génération sans limite." },
];

export default function Faq({ onClose = () => {}, onContact = () => {} }) {
  const [open, setOpen] = useState(0);

  return (
    <div style={screen}>
      {/* header — croix (écran poussé depuis le menu profil) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none',
          boxShadow: '0 1px 4px rgba(28,27,58,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={16} weight="bold" color={C.ink} /></button>
        <span style={{ font: `700 18px ${F.title}`, color: C.ink, letterSpacing: '-.01em' }}>Questions fréquentes</span>
      </div>

      {/* intro navy */}
      <div style={{ background: C.ink, borderRadius: 20, padding: '16px 18px', color: '#fff', position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
        <ChatsCircle size={68} weight="fill" color="#fff" style={{ position: 'absolute', right: -10, top: -8, opacity: .1 }} />
        <div style={{ font: `700 15px ${F.title}`, marginBottom: 3 }}>Une question ? On a la réponse.</div>
        <div style={{ font: `400 12.5px/1.5 ${F.body}`, color: '#C9C7D6' }}>Le B.A.-BA de Loot en quelques points.</div>
      </div>

      {/* accordéon */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {FAQ.map((item, i) => {
          const on = open === i;
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: SHADOW.card }}>
              <button onClick={() => setOpen(on ? -1 : i)} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer',
                padding: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, textAlign: 'left' }}>
                <span style={{ font: `700 14px/1.35 ${F.body}`, color: C.ink }}>{item.q}</span>
                <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: on ? C.coralTint : C.canvas }}>
                  {on ? <Minus size={14} weight="bold" color={C.coral} /> : <Plus size={14} weight="bold" color={C.muted2} />}
                </span>
              </button>
              {on && <p style={{ font: `400 13px/1.65 ${F.body}`, color: C.muted1, margin: '11px 0 0' }}>{item.a}</p>}
            </div>
          );
        })}
      </div>

      {/* contact */}
      <div style={{ background: C.coralTint, border: `1px solid #FADAE0`, borderRadius: 16, padding: 16, marginTop: 16,
        display: 'flex', alignItems: 'center', gap: 13 }}>
        <span style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lifebuoy size={22} weight="fill" color={C.coral} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ font: `700 13.5px ${F.body}`, color: C.ink }}>Tu ne trouves pas ta réponse ?</div>
          <div style={{ font: `500 12px ${F.body}`, color: C.muted2 }}>On te répond en général sous 24 h.</div>
        </div>
        <button onClick={onContact} style={{ border: 'none', background: C.coral, color: '#fff', font: `700 12.5px ${F.body}`,
          padding: '10px 14px', borderRadius: 11, cursor: 'pointer', boxShadow: '0 5px 13px rgba(240,60,100,.26)' }}>Contact</button>
      </div>
    </div>
  );
}
