// GenererFlow.jsx — Flow "Générer" refondu : UN écran, deux états (saisie -> résultat).
// Plus de stepper, plus de redirection Vinted, plus de doublon Étape 2/3.
// Copier-coller par CHAMP (Vinted/LBC ont 2 champs séparés → pas de "tout copier").
// Hashtags générés UNIQUEMENT pour Vinted. Refine guidé (chips + précision libre).
// Enregistrement au PRIX RÉELLEMENT LISTÉ.
//
// deps: react, @phosphor-icons/react
// Fonts: Bricolage Grotesque + Hanken Grotesk (Google Fonts) dans index.html.
//
// ⚠ FIX ZOOM / DIMENSIONNEMENT :
//   1) index.html <head> :
//      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1">
//   2) Pas de largeur fixe (390px) : conteneur fluide width:100% + maxWidth, boxSizing border-box.

import React, { useState } from 'react';
import {
  Camera, Image as ImageIcon, CaretDown, TreasureChest, Sparkle,
  Copy, ArrowClockwise, PencilSimple, CheckCircle, Check, GearSix,
} from '@phosphor-icons/react';
import { C, F, SHADOW } from './loot-tokens';

const screen = {
  width: '100%', maxWidth: 480, margin: '0 auto', boxSizing: 'border-box',
  padding: '20px 18px 128px', background: C.canvas, minHeight: '100%',
  fontFamily: F.body, color: C.ink,
};
const label = { font: `700 11px ${F.body}`, letterSpacing: '.06em', color: C.muted2, textTransform: 'uppercase' };
const fieldBox = { background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '13px 15px', boxSizing: 'border-box' };
const card = { background: C.surface, borderRadius: 16, padding: '14px 15px', boxShadow: SHADOW.card, boxSizing: 'border-box' };

// Bouton copier par champ (le geste central) ---------------------------------
function CopyButton({ text, variant = 'coral', children = 'Copier' }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    setDone(true); setTimeout(() => setDone(false), 1600);
  };
  const styles = variant === 'vinted'
    ? { bg: C.vintedTint, fg: C.vinted, boxShadow: 'none', pad: '6px 12px', radius: 999, size: 11 }
    : { bg: done ? C.green : C.coral, fg: '#fff', boxShadow: '0 4px 11px rgba(240,60,100,.26)', pad: '7px 14px', radius: 10, size: 12 };
  return (
    <button onClick={copy} style={{ border: 'none', background: styles.bg, color: done && variant !== 'coral' ? C.green : styles.fg,
      font: `700 ${styles.size}px ${F.body}`, padding: styles.pad, borderRadius: styles.radius, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: styles.boxShadow }}>
      {done ? <Check size={14} weight="bold" /> : <Copy size={14} weight={variant === 'coral' ? 'fill' : 'regular'} />}
      {done ? 'Copié' : children}
    </button>
  );
}

// =========================================================================
export default function GenererFlow({ onSaved = () => {}, onOpenAnnonceSettings = () => {} }) {
  const [phase, setPhase] = useState('saisie');   // 'saisie' | 'result'
  const [pour, setPour] = useState('stock');      // 'stock' | 'malle'
  const [infos, setInfos] = useState('');
  const [prixAchat, setPrixAchat] = useState('');
  const [generating, setGenerating] = useState(false);

  // résultat éditable
  const [plateforme, setPlateforme] = useState('vinted'); // 'vinted' | 'lbc'
  const [titre, setTitre] = useState('');
  const [desc, setDesc] = useState('');   // pour Vinted, se termine par les hashtags
  const [prixListe, setPrixListe] = useState('');
  const [refine, setRefine] = useState('');               // précision de l'utilisateur

  // Appel IA. `hint` = instruction de refine (optionnelle). `plat` = plateforme cible.
  async function generer(hint = '', plat = plateforme) {
    setGenerating(true);
    // TODO: brancher l'IA réelle. Passe { infos, prixAchat, plat, hint } au backend.
    // La plateforme conditionne la sortie : pour Vinted, l'IA ajoute les hashtags
    // À LA FIN de la description (ils sont donc copiés avec elle). Pour LBC : aucun hashtag.
    await new Promise(r => setTimeout(r, 600));
    const baseDesc = "Superbe lot de 60 pins vintage du Canada, émaillés, années 80-90. Thèmes variés (sport, villes, JO, mascottes). Bon état général, quelques patines d'époque. Idéal collection ou revente à l'unité. Envoi soigné. ✨";
    const hashtags = '#vintage #pins #collection #canada';
    const ai = {
      titre: 'Lot 60 pins vintage Canada — collection émaillée années 80-90',
      description: plat === 'vinted' ? `${baseDesc}\n\n${hashtags}` : baseDesc,
      prixConseille: 35,
    };
    setTitre(ai.titre); setDesc(ai.description); setPrixListe(String(ai.prixConseille));
    setRefine(''); setGenerating(false); setPhase('result'); window.scrollTo(0, 0);
  }

  // Changer de plateforme régénère (hashtags ajoutés/retirés en fin de description).
  function changePlateforme(plat) {
    setPlateforme(plat);
    generer('', plat);
  }

  // ---------------------------------------------------------------- SAISIE
  if (phase === 'saisie') {
    return (
      <div style={screen}>
        <h2 style={{ font: `700 24px/1.1 ${F.title}`, letterSpacing: '-.02em', margin: '0 0 4px' }}>Nouvelle annonce</h2>
        <p style={{ font: `400 13px/1.5 ${F.body}`, color: C.muted1, margin: '0 0 16px' }}>
          Ajoute tes photos et deux infos — l'IA rédige l'annonce, tu n'as plus qu'à copier-coller.
        </p>

        <div style={{ border: `2px dashed #DBC9CF`, borderRadius: 20, background: '#FBF3F5',
          padding: '22px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Camera size={30} color={C.coral} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ border: `1.5px solid ${C.coralBorder}`, background: '#fff', color: C.coralPressed,
              font: `700 13px ${F.body}`, padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6 }}><ImageIcon size={16} />Galerie</button>
            <button style={{ border: 'none', background: C.coral, color: '#fff', font: `700 13px ${F.body}`,
              padding: '10px 16px', borderRadius: 12, cursor: 'pointer', boxShadow: '0 5px 13px rgba(240,60,100,.28)',
              display: 'inline-flex', alignItems: 'center', gap: 6 }}><Camera size={16} weight="fill" />Caméra</button>
          </div>
          <span style={{ font: `500 12px ${F.body}`, color: '#A98F98' }}>Jusqu'à 5 photos</span>
        </div>

        <div style={{ ...label, margin: '18px 0 8px' }}>Infos <span style={{ color: C.muted4 }}>(optionnel — ce qui ne se voit pas sur les photos)</span></div>
        <textarea value={infos} onChange={e => setInfos(e.target.value)} rows={2}
          placeholder="Marque, année, défaut, matière… seulement si la photo ne le montre pas ✨"
          style={{ ...fieldBox, width: '100%', resize: 'vertical', font: `400 13.5px/1.5 ${F.body}`, color: C.ink, outline: 'none' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
          <div>
            <div style={{ ...label, marginBottom: 7 }}>Prix d'achat €</div>
            <input value={prixAchat} onChange={e => setPrixAchat(e.target.value)} inputMode="decimal" placeholder="0,5"
              style={{ ...fieldBox, width: '100%', font: `700 15px ${F.title}`, color: C.ink, outline: 'none' }} />
          </div>
          <div>
            <div style={{ ...label, marginBottom: 7 }}>Provenance</div>
            <button style={{ ...fieldBox, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              font: `600 13px ${F.body}`, color: C.ink, cursor: 'pointer' }}>Emmaüs<CaretDown size={14} color={C.muted2} /></button>
          </div>
        </div>

        <div style={{ ...label, margin: '16px 0 8px' }}>Pour</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPour('stock')} style={{ flex: 1, borderRadius: 12, padding: 12, cursor: 'pointer',
            font: `700 13px ${F.body}`, border: pour === 'stock' ? 'none' : `1.5px solid ${C.border}`,
            background: pour === 'stock' ? C.ink : '#fff', color: pour === 'stock' ? '#fff' : C.muted1 }}>Mon stock</button>
          <button onClick={() => setPour('malle')} style={{ flex: 1, borderRadius: 12, padding: 12, cursor: 'pointer',
            font: `700 13px ${F.body}`, border: pour === 'malle' ? 'none' : `1.5px solid ${C.border}`,
            background: pour === 'malle' ? C.ink : '#fff', color: pour === 'malle' ? '#fff' : C.muted1,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <TreasureChest size={15} weight="fill" color={pour === 'malle' ? '#fff' : C.muted2} />Une malle</button>
        </div>

        <button onClick={() => generer()} disabled={generating} style={{ width: '100%', border: 'none', background: C.coral, color: '#fff',
          font: `700 15px ${F.body}`, padding: 16, borderRadius: 16, marginTop: 22, cursor: 'pointer',
          boxShadow: SHADOW.coral, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: generating ? .7 : 1 }}>
          <Sparkle size={18} weight="fill" />{generating ? 'Génération…' : "Générer l'annonce"}
        </button>
      </div>
    );
  }

  // --------------------------------------------------------------- RÉSULTAT
  const platBtn = (id, txtColor, bg, border) => ({
    flex: 1, borderRadius: 12, padding: 11, cursor: 'pointer', font: `700 13px ${F.body}`,
    border: plateforme === id ? `1.5px solid ${border}` : `1.5px solid ${C.border}`,
    background: plateforme === id ? bg : '#fff', color: plateforme === id ? txtColor : C.muted3,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  });
  const chip = (active) => ({ font: `700 11.5px ${F.body}`, borderRadius: 999, padding: '7px 13px', cursor: 'pointer',
    border: 'none', background: active ? C.ink : '#F1EFF4', color: active ? '#fff' : '#5B5975' });

  const quickHints = ['Plus court', 'Plus détaillé', 'Autre ton'];

  return (
    <div style={screen}>
      {/* statut */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, background: C.photoStripe }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `700 12px ${F.body}`,
            color: C.greenDark, background: C.greenSoft, border: `1px solid ${C.greenSoftBorder}`, padding: '3px 10px', borderRadius: 999 }}>
            <Sparkle size={12} weight="fill" color={C.green} />Annonce prête</span>
          <div style={{ font: `500 12px ${F.body}`, color: C.muted2, marginTop: 4 }}>Copie chaque champ dans {plateforme === 'vinted' ? 'Vinted' : 'LeBonCoin'}.</div>
        </div>
      </div>

      {/* plateforme : change le format (hashtags = Vinted only) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => changePlateforme('vinted')} style={platBtn('vinted', C.vinted, C.vintedTint, C.vintedBorder)}>
          {plateforme === 'vinted' && <CheckCircle size={15} weight="fill" />}Vinted</button>
        <button onClick={() => changePlateforme('lbc')} style={platBtn('lbc', '#C6551E', '#FDE8DA', '#F3C3A3')}>
          {plateforme === 'lbc' && <CheckCircle size={15} weight="fill" />}LeBonCoin</button>
      </div>

      {/* Titre (copier) */}
      <div style={{ ...card, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={label}>Titre</span><CopyButton text={titre} />
        </div>
        <textarea value={titre} onChange={e => setTitre(e.target.value)} rows={2}
          style={{ width: '100%', border: 'none', resize: 'vertical', outline: 'none', background: 'transparent',
            font: `600 14px/1.35 ${F.body}`, color: C.ink }} />
      </div>

      {/* Description (copier) */}
      <div style={{ ...card, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={label}>Description{plateforme === 'vinted' ? ' (hashtags inclus)' : ''}</span><CopyButton text={desc} />
        </div>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={6}
          style={{ width: '100%', border: 'none', resize: 'vertical', outline: 'none', background: 'transparent',
            font: `400 13px/1.6 ${F.body}`, color: '#4A4860' }} />
      </div>

      {/* prix conseillé */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={label}>Prix conseillé</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 3 }}>
              <span style={{ font: `800 22px ${F.title}`, color: C.ink }}>{prixListe} €</span>
              <span style={{ font: `600 11px ${F.body}`, color: C.amberText, background: C.amberSoft, padding: '2px 8px', borderRadius: 999 }}>28–45 €</span>
            </div>
          </div>
          <PencilSimple size={16} color={C.muted2} />
        </div>
      </div>

      {/* ajuster & régénérer */}
      <div style={{ ...card, marginTop: 16 }}>
        <div style={{ ...label, marginBottom: 9 }}>Ajuster &amp; régénérer</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
          {quickHints.map(h => (
            <button key={h} onClick={() => generer(h)} style={chip(false)}>{h}</button>
          ))}
        </div>
        <textarea value={refine} onChange={e => setRefine(e.target.value)} rows={2}
          placeholder="Ou précise : marque, provenance, défaut à mentionner…"
          style={{ ...fieldBox, width: '100%', background: C.canvas, resize: 'vertical', font: `400 13px/1.5 ${F.body}`, color: C.ink, outline: 'none' }} />
        <button onClick={() => generer(refine)} disabled={generating} style={{ width: '100%', border: 'none', background: C.coral, color: '#fff',
          font: `700 14px ${F.body}`, padding: 13, borderRadius: 13, marginTop: 10, cursor: 'pointer',
          boxShadow: '0 6px 15px rgba(240,60,100,.24)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          opacity: generating ? .7 : 1 }}>
          <ArrowClockwise size={16} weight="fill" />{generating ? 'Régénération…' : 'Régénérer avec ma précision'}
        </button>
        {/* Mentions récurrentes (livraison, signature…) définies une fois dans Paramètres > Mes annonces */}
        <button onClick={onOpenAnnonceSettings} style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
          marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.divider}`,
          font: `600 12px ${F.body}`, color: C.muted2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <GearSix size={14} />Mentions récurrentes (livraison, signature…) <span style={{ color: C.coral }}>Paramètres</span>
        </button>
      </div>

      {/* enregistrer au prix réellement listé */}
      <div style={{ ...card, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
          <CheckCircle size={19} color={C.ink} />
          <span style={{ font: `500 12.5px/1.4 ${F.body}`, color: '#4A4860' }}>
            Après avoir collé sur {plateforme === 'vinted' ? 'Vinted' : 'LeBonCoin'}, enregistre au <b style={{ color: C.ink }}>prix réellement listé</b>.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: C.canvas, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '9px 13px' }}>
            <span style={{ font: `800 15px ${F.title}`, color: C.ink }}>€</span>
            <input value={prixListe} onChange={e => setPrixListe(e.target.value)} inputMode="decimal"
              style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', font: `800 15px ${F.title}`, color: C.ink }} />
          </div>
          <button onClick={() => onSaved({ titre, desc, prixListe, pour, plateforme })}
            style={{ flexShrink: 0, border: 'none', background: C.coral, color: '#fff', font: `700 13px ${F.body}`,
              padding: '12px 16px', borderRadius: 12, cursor: 'pointer', boxShadow: '0 5px 13px rgba(240,60,100,.26)',
              display: 'inline-flex', alignItems: 'center', gap: 6 }}><CheckCircle size={16} weight="fill" />Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
