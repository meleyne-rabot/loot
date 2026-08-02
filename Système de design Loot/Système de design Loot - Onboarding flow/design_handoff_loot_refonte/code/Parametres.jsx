// Parametres.jsx — Écran Paramètres refondu : UNE seule page (plus de sous-menu).
// Sections : Génération IA (objectif, ton, hashtags, mentions fixes) + Sources + Tags.
//
// FIX NAV : Paramètres est un ONGLET principal -> AUCUNE flèche retour dans le header.
// (Les 2 flèches "retour" de l'ancienne version étaient un doublon à supprimer.
//  Règle générale : les 5 écrans d'onglet — Inventaire, Stats, Générer, Malles,
//  Paramètres — n'ont jamais de bouton retour ; seuls les écrans de détail poussés
//  au-dessus d'un onglet en ont un.)
//
// deps: react, @phosphor-icons/react + loot-tokens.js

import React, { useState } from 'react';
import {
  Sparkle, ArrowsClockwise, Scales, Coins, MapPin, Tag, Plus, X, ArrowBendUpRight,
} from '@phosphor-icons/react';
import { C, F, SHADOW } from './loot-tokens';

const screen = {
  width: '100%', maxWidth: 480, margin: '0 auto', boxSizing: 'border-box',
  padding: '20px 18px 128px', background: C.canvas, minHeight: '100%', fontFamily: F.body, color: C.ink,
};
const sectionTitle = { font: `700 11px ${F.body}`, letterSpacing: '.07em', color: C.muted2,
  textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7 };
const card = { background: C.surface, borderRadius: 18, boxShadow: SHADOW.card, boxSizing: 'border-box' };
const miniLabel = { font: `700 10.5px ${F.body}`, letterSpacing: '.06em', color: C.muted2, textTransform: 'uppercase' };
const addInput = { flex: 1, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12,
  padding: '12px 14px', font: `400 13px ${F.body}`, color: C.ink, outline: 'none', boxSizing: 'border-box' };
const addBtn = { border: 'none', background: C.coral, color: '#fff', font: `700 13px ${F.body}`, padding: '12px 16px',
  borderRadius: 12, cursor: 'pointer', boxShadow: '0 5px 13px rgba(240,60,100,.24)', display: 'inline-flex', alignItems: 'center', gap: 5 };

const OBJECTIFS = [
  { id: 'rotation', titre: 'Rotation rapide', sub: 'Prix agressifs pour vendre vite', Icon: ArrowsClockwise, tint: C.coralTint, ic: C.coral },
  { id: 'equilibre', titre: 'Équilibre', sub: 'Bon prix, bonne marge', Icon: Scales, tint: '#EDEBF3', ic: '#5B5975' },
  { id: 'profits', titre: 'Profits max', sub: 'Prix hauts, attente possible', Icon: Coins, tint: '#E4F4EB', ic: C.greenDark },
];

export default function Parametres() {
  const [objectif, setObjectif] = useState('equilibre');
  const [ton, setTon] = useState('decontracte');
  const [hashtags, setHashtags] = useState(true);
  const [mentions, setMentions] = useState('');
  const [sources, setSources] = useState(['Emmaüs Champigny', 'Croix Rouge Bry', 'Vide Grenier', 'Mon placard', 'Emmaüs Ivry', 'Rue Blanche']);
  const [tags, setTags] = useState(['Vintage', 'Déco', 'Accessoires', 'Jouets', 'Livres', 'Vêtements']);
  const [newSource, setNewSource] = useState('');
  const [newTag, setNewTag] = useState('');

  const addSource = () => { if (newSource.trim()) { setSources([...sources, newSource.trim()]); setNewSource(''); } };
  const addTag = () => { if (newTag.trim()) { setTags([...tags, newTag.trim()]); setNewTag(''); } };

  const Chip = ({ label, onDelete, dark }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 999, padding: '8px 12px 8px 14px',
      font: `${dark ? 700 : 600} 13px ${F.body}`, color: dark ? '#fff' : C.ink,
      background: dark ? C.ink : C.surface, border: dark ? 'none' : `1.5px solid ${C.border}` }}>
      {label}
      <button onClick={onDelete} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
        <X size={13} color={dark ? C.muted3 : C.muted4} />
      </button>
    </span>
  );

  return (
    <div style={screen}>
      {/* HEADER — pas de flèche retour (onglet principal) */}
      <h2 style={{ font: `700 25px/1.1 ${F.title}`, letterSpacing: '-.02em', margin: '0 0 4px' }}>Paramètres</h2>
      <p style={{ font: `400 13px/1.5 ${F.body}`, color: C.muted1, margin: '0 0 18px' }}>Tout se règle ici, sur une seule page.</p>

      {/* ===== GÉNÉRATION IA ===== */}
      <div style={{ ...sectionTitle, margin: '0 0 10px' }}><Sparkle size={14} weight="fill" color={C.coral} />Génération IA</div>

      {/* objectif */}
      <div style={{ ...card, padding: 6, marginBottom: 12 }}>
        <div style={{ ...miniLabel, padding: '11px 12px 8px' }}>Objectif de prix</div>
        {OBJECTIFS.map(o => {
          const on = objectif === o.id;
          return (
            <label key={o.id} onClick={() => setObjectif(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 12px', borderRadius: 12, cursor: 'pointer', background: on ? '#FFF6F8' : 'transparent' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: '#fff',
                border: on ? `6px solid ${C.coral}` : `2px solid ${C.border}` }} />
              <span style={{ width: 34, height: 34, borderRadius: 10, background: o.tint, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}><o.Icon size={17} weight="fill" color={o.ic} /></span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', font: `700 14px ${F.body}`, color: C.ink }}>{o.titre}</span>
                <span style={{ font: `500 11.5px ${F.body}`, color: C.muted2 }}>{o.sub}</span>
              </span>
            </label>
          );
        })}
      </div>

      {/* ton */}
      <div style={{ ...card, padding: 14, marginBottom: 12 }}>
        <div style={{ ...miniLabel, marginBottom: 10 }}>Ton des annonces</div>
        <div style={{ display: 'flex', gap: 7 }}>
          {[['decontracte', 'Décontracté'], ['neutre', 'Neutre'], ['pro', 'Pro']].map(([id, lbl]) => {
            const on = ton === id;
            return (
              <button key={id} onClick={() => setTon(id)} style={{ flex: 1, textAlign: 'center', font: `700 13px ${F.body}`,
                borderRadius: 11, padding: '11px 4px', cursor: 'pointer',
                color: on ? '#fff' : C.muted1, background: on ? C.ink : '#fff',
                border: on ? 'none' : `1.5px solid ${C.border}` }}>{lbl}</button>
            );
          })}
        </div>
      </div>

      {/* hashtags toggle */}
      <div style={{ ...card, padding: 15, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ font: `700 14px ${F.body}`, color: C.ink }}>Hashtags dans les annonces</div>
          <div style={{ font: `500 11.5px ${F.body}`, color: C.muted2 }}>Ajoutés en fin de description — Vinted uniquement</div>
        </div>
        <button onClick={() => setHashtags(!hashtags)} style={{ width: 44, height: 26, borderRadius: 999, border: 'none',
          background: hashtags ? C.coral : '#D7D2CC', position: 'relative', flexShrink: 0, cursor: 'pointer' }}>
          <span style={{ position: 'absolute', top: 3, left: hashtags ? 21 : 3, width: 20, height: 20, borderRadius: '50%',
            background: '#fff', transition: 'left .15s' }} />
        </button>
      </div>

      {/* mentions fixes (cible du lien "mentions récurrentes" du flow Générer) */}
      <div style={{ ...card, padding: 15 }}>
        <div style={{ ...miniLabel, marginBottom: 4 }}>Mentions fixes</div>
        <div style={{ font: `400 11.5px/1.5 ${F.body}`, color: C.muted2, marginBottom: 10 }}>
          Toujours ajouté à tes annonces — conditions, habitudes d'envoi…
        </div>
        <textarea value={mentions} onChange={e => setMentions(e.target.value)} rows={3}
          placeholder="Ex : Pas de Vinted Go. Envoi soigné et protégé. Non fumeur, pas d'animal."
          style={{ width: '100%', background: C.canvas, border: `1.5px solid ${C.border}`, borderRadius: 12,
            padding: '12px 13px', resize: 'vertical', font: `400 13px/1.5 ${F.body}`, color: C.ink, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* ===== SOURCES ===== */}
      <div style={{ ...sectionTitle, margin: '22px 0 10px' }}><MapPin size={14} weight="fill" color={C.coral} />Sources d'achat</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {sources.map((s, i) => <Chip key={s + i} label={s} onDelete={() => setSources(sources.filter((_, j) => j !== i))} />)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={newSource} onChange={e => setNewSource(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSource()}
          placeholder="Ex : Vide-grenier, Emmaüs…" style={addInput} />
        <button onClick={addSource} style={addBtn}><Plus size={14} weight="bold" />Ajouter</button>
      </div>

      {/* ===== TAGS ===== */}
      <div style={{ ...sectionTitle, margin: '22px 0 10px' }}><Tag size={14} weight="fill" color={C.coral} />Tags</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {tags.map((t, i) => <Chip key={t + i} label={t} dark={i === 0} onDelete={() => setTags(tags.filter((_, j) => j !== i))} />)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()}
          placeholder="Ex : Vêtements, Jouets, Déco…" style={addInput} />
        <button onClick={addTag} style={addBtn}><Plus size={14} weight="bold" />Ajouter</button>
      </div>

      {/* note : compte & éditorial dans le menu profil */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 20, padding: '13px 15px',
        background: 'rgba(28,27,58,.04)', borderRadius: 14 }}>
        <ArrowBendUpRight size={16} color={C.violet} style={{ marginTop: 1, flexShrink: 0 }} />
        <span style={{ font: `500 12px/1.5 ${F.body}`, color: C.muted1 }}>
          <b style={{ color: C.ink }}>Mon compte</b>, <b style={{ color: C.ink }}>Notre histoire</b> &amp; l'aide sont dans le menu profil — tape sur ton avatar en haut à droite.
        </span>
      </div>
    </div>
  );
}
