// Onboarding.jsx — Carousel de bienvenue (1re connexion) + rejouable depuis Aide.
// 5 slides : Bienvenue (navy) → Photo → IA/copier → Gains → Malles.
// Points de progression, "Passer", swipe tactile, CTA final.
//
// Persistance : au 1er lancement seulement. Utilise `hasSeenOnboarding()` pour décider
// d'afficher au boot ; `markOnboardingSeen()` au clic "C'est parti"/"Passer".
// Depuis Aide (menu profil), monte <Onboarding replay onClose={...} /> pour le rejouer.
//
// deps: react, @phosphor-icons/react + loot-tokens.js

import React, { useState, useRef } from 'react';
import {
  ArrowRight, Camera, MagicWand, Copy, ChartLineUp, TreasureChest, Sparkle, ArrowsClockwise, NotePencil,
} from '@phosphor-icons/react';
import { C, F } from './loot-tokens';

const KEY = 'loot.onboardingSeen.v1';
export const hasSeenOnboarding = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export const markOnboardingSeen = () => { try { localStorage.setItem(KEY, '1'); } catch {} };

// slide 0 = bienvenue (navy). slides 1..4 = contenu (crème).
const SLIDES = [
  { kind: 'welcome', title: 'Bienvenue sur Loot \ud83d\udc4b', body: "Une photo. On écrit. Tu vends." },
  { kind: 'step', n: 1, Icon: Camera, tint: C.coralTint, ic: C.coral, title: '1. Prends en photo',
    body: "Photographie ton article et ajoute deux infos rapides : prix d'achat, provenance. C'est tout." },
  { kind: 'step', n: 2, Icon: MagicWand, badge: Copy, tint: '#EDEBF3', ic: '#5B5975', title: '2. L\u2019IA rédige, tu copies',
    body: "Titre, description et prix conseillé en quelques secondes. Tu copies-colles sur Vinted ou LeBonCoin — les hashtags sont déjà inclus." },
  { kind: 'step', n: 3, Icon: NotePencil, tint: C.amberTint, ic: C.amber, title: '3. Personnalise ton style',
    body: "Définis tes mentions une bonne fois pour toutes : marre d\u2019ajouter « Pas de Vinted Go » à chaque annonce ? Loot l\u2019ajoute pour toi, à chaque fois. 🙌" },
  { kind: 'step', n: 4, Icon: ChartLineUp, tint: C.greenSoft, ic: C.greenDark, title: '4. Suis tes gains',
    body: "Marge, taux de vente, meilleures sources… Loot fait tes comptes pour que tu saches ce qui rapporte vraiment." },
  { kind: 'step', n: 5, Icon: TreasureChest, tint: C.violetTint, ic: C.violetText, title: '5. Vends pour tes proches',
    body: "Crée une Malle pour chaque personne : commissions et reversements suivis automatiquement, chacun s\u2019y retrouve." },
];

export default function Onboarding({ onDone = () => {}, replay = false }) {
  const [i, setI] = useState(0);
  const startX = useRef(null);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];
  const dark = s.kind === 'welcome';

  const finish = () => { if (!replay) markOnboardingSeen(); onDone(); };
  const next = () => (last ? finish() : setI(i + 1));

  const onTouchStart = e => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -45 && !last) setI(i + 1);
    if (dx > 45 && i > 0) setI(i - 1);
    startX.current = null;
  };

  const wrap = {
    width: '100%', maxWidth: 480, margin: '0 auto', minHeight: '100%', boxSizing: 'border-box',
    padding: '22px 24px', display: 'flex', flexDirection: 'column', fontFamily: F.body,
    background: dark ? C.ink : C.canvas,
  };
  const dotBg = dark ? 'rgba(255,255,255,.25)' : '#DCD5C8';

  return (
    <div style={wrap} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* progression + passer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {SLIDES.map((_, k) => (
            <span key={k} style={{ width: k === i ? 22 : 6, height: 6, borderRadius: 999, background: k === i ? C.coral : dotBg, transition: 'width .2s' }} />
          ))}
        </div>
        {!last && (
          <button onClick={finish} style={{ border: 'none', background: 'none', cursor: 'pointer',
            font: `600 13px ${F.body}`, color: dark ? 'rgba(255,255,255,.55)' : C.muted2 }}>Passer</button>
        )}
      </div>

      {/* hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: dark ? 26 : 24 }}>
        {dark ? (
          <span style={{ position: 'relative', width: 104, height: 104, borderRadius: 30, background: C.coral,
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 40px rgba(240,60,100,.45)' }}>
            <ArrowsClockwise size={88} color="rgba(255,255,255,.28)" style={{ position: 'absolute' }} />
            <TreasureChest size={52} weight="fill" color="#fff" style={{ position: 'relative', zIndex: 1 }} />
            <Sparkle size={22} weight="fill" color="#fff" style={{ position: 'absolute', top: 16, right: 16 }} />
          </span>
        ) : (
          <span style={{ position: 'relative', width: 104, height: 104, borderRadius: 32, background: s.tint,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <s.Icon size={50} weight="fill" color={s.ic} />
            {s.badge && (
              <span style={{ position: 'absolute', bottom: -6, right: -6, width: 38, height: 38, borderRadius: '50%', background: C.coral,
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(240,60,100,.4)' }}>
                <s.badge size={18} weight="fill" color="#fff" />
              </span>
            )}
          </span>
        )}
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: `800 ${dark ? 27 : 24}px/1.18 ${F.title}`, letterSpacing: '-.02em', color: dark ? '#fff' : C.ink }}>{s.title}</div>
          <p style={{ font: `400 14.5px/1.6 ${F.body}`, color: dark ? '#C9C7D6' : C.muted1, margin: '12px auto 0', maxWidth: 264 }}>{s.body}</p>
        </div>
      </div>

      {/* cta */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {s.kind === 'step' && !last && <span style={{ font: `600 13px ${F.body}`, color: C.muted2 }}>{s.n} / {SLIDES.length - 1}</span>}
        <button onClick={next} style={{ flex: 1, border: 'none', background: C.coral, color: '#fff', font: `700 15px ${F.body}`,
          padding: 16, borderRadius: 16, cursor: 'pointer', boxShadow: `0 8px 20px rgba(240,60,100,${dark || last ? .36 : .28})`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {last ? <><Sparkle size={18} weight="fill" />C'est parti !</> : (dark ? 'Commencer' : <>Suivant<ArrowRight size={18} weight="bold" /></>)}
        </button>
      </div>
      {last && (
        <div style={{ textAlign: 'center', marginTop: 10, font: `500 12px ${F.body}`, color: '#A8A4B5' }}>
          {replay ? 'Tu peux fermer ce guide à tout moment.' : 'Tu pourras revoir ce guide dans Aide.'}
        </div>
      )}
    </div>
  );
}
