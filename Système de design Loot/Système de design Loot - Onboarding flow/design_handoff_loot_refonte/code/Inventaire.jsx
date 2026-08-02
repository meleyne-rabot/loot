// Inventaire.jsx — Écran Inventaire refondu.
// - Header SANS flèche retour (onglet principal).
// - Recherche + bouton Filtres (Source / Tags / Malles dans un panneau) + statuts en chips.
// - Card : hiérarchie prix/marge revue (prix listé dominant, marge en pill vert/violet).
// - Action rapide "Marquer vendu" (en vente) / "Marquer reversé" (malle, vendu non reversé).
//
// deps: react, @phosphor-icons/react + loot-tokens.js

import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlass, SlidersHorizontal, TreasureChest, CheckCircle, ArrowBendUpRight,
} from '@phosphor-icons/react';
import { C, F, SHADOW } from './loot-tokens';

const screen = {
  width: '100%', maxWidth: 480, margin: '0 auto', boxSizing: 'border-box',
  padding: '20px 18px 128px', background: C.canvas, minHeight: '100%', fontFamily: F.body, color: C.ink,
};

const STATUTS = [
  { id: 'tous', label: 'Tous', color: null },
  { id: 'en_vente', label: 'En vente', color: { fg: C.amberText, bd: '#F1D9B8' } },
  { id: 'vendus', label: 'Vendus', color: { fg: C.greenDark, bd: '#C6E7D3' } },
  { id: 'a_reverser', label: 'À reverser', color: { fg: C.violetText, bd: '#E4D3F5' } },
  { id: 'en_attente', label: 'En attente', color: { fg: '#5B5975', bd: '#E3E0E8' } },
];

// item shape :
// { id, titre, photo, statut:'en_vente'|'vendu'|'en_attente', plateforme:'Vinted'|'LBC',
//   source, achat, prix, venteReel, aReverser (number|null), malle (bool) }

function StatutBadge({ statut }) {
  const map = {
    en_vente: { t: 'En vente', fg: C.amberText, bg: C.amberTint, dot: C.amber },
    vendu: { t: 'Vendu', fg: C.greenDark, bg: C.greenTint, dot: C.green },
    en_attente: { t: 'En attente', fg: '#5B5975', bg: '#ECEAF0', dot: C.muted3 },
  };
  const s = map[statut] || map.en_vente;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: `700 10.5px ${F.body}`,
      color: s.fg, background: s.bg, padding: '3px 8px', borderRadius: 999 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />{s.t}
    </span>
  );
}

function Card({ item, onMarkSold, onMarkReversed, onOpen }) {
  const priceLabel = item.statut === 'vendu' ? 'vendu' : 'listé';
  const shownPrice = item.statut === 'vendu' ? (item.venteReel ?? item.prix) : item.prix;
  const margin = shownPrice != null && item.achat != null ? +(shownPrice - item.achat).toFixed(2) : null;

  return (
    <div style={{ background: C.surface, borderRadius: 18, padding: 12, boxShadow: SHADOW.cardHi, marginBottom: 11 }}>
      <div onClick={() => onOpen(item)} style={{ display: 'flex', gap: 12, cursor: 'pointer' }}>
        <div style={{ width: 76, height: 76, borderRadius: 14, flexShrink: 0,
          background: item.photo ? `center/cover url(${item.photo})` : C.photoStripe }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: `700 14px/1.25 ${F.title}`, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.titre}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 6 }}>
            <StatutBadge statut={item.statut} />
            {item.aReverser != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, font: `700 10.5px ${F.body}`,
                color: C.violetText, background: C.violetTint, padding: '3px 8px', borderRadius: 999 }}>
                <TreasureChest size={11} weight="fill" />À reverser</span>
            )}
            <span style={{ font: `700 10.5px ${F.body}`, color: C.vinted, background: C.vintedTint, padding: '3px 8px', borderRadius: 999 }}>{item.plateforme}</span>
            <span style={{ font: `600 10.5px ${F.body}`, color: C.muted2 }}>{item.source}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 9, borderTop: `1px solid ${C.divider}` }}>
            <span style={{ font: `800 20px ${F.title}`, color: C.ink, letterSpacing: '-.01em' }}>{shownPrice} €</span>
            <span style={{ font: `600 10.5px ${F.body}`, color: C.muted3 }}>{priceLabel}{item.achat != null ? ` · achat ${item.achat} €` : ''}</span>
            {item.aReverser != null ? (
              <span style={{ marginLeft: 'auto', font: `800 12.5px ${F.body}`, color: C.violetText, background: C.violetTint, padding: '4px 10px', borderRadius: 999 }}>à reverser {item.aReverser} €</span>
            ) : margin != null && (
              <span style={{ marginLeft: 'auto', font: `800 12.5px ${F.body}`, color: C.greenDark, background: C.greenSoft, padding: '4px 10px', borderRadius: 999 }}>+{margin} €</span>
            )}
          </div>
        </div>
      </div>
      {/* action rapide */}
      {item.statut === 'en_vente' && (
        <button onClick={() => onMarkSold(item)} style={{ width: '100%', marginTop: 11, border: `1.5px solid #C6E7D3`,
          background: '#fff', color: C.greenDark, font: `700 12.5px ${F.body}`, padding: 10, borderRadius: 12, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <CheckCircle size={16} weight="fill" />Marquer vendu</button>
      )}
      {item.statut === 'vendu' && item.aReverser != null && (
        <button onClick={() => onMarkReversed(item)} style={{ width: '100%', marginTop: 11, border: 'none',
          background: C.ink, color: '#fff', font: `700 12.5px ${F.body}`, padding: 10, borderRadius: 12, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <ArrowBendUpRight size={15} weight="fill" />Marquer reversé</button>
      )}
    </div>
  );
}

export default function Inventaire({ items = [], onOpen = () => {}, onMarkSold = () => {}, onMarkReversed = () => {}, onOpenFilters = () => {}, activeFilterCount = 0 }) {
  const [q, setQ] = useState('');
  const [statut, setStatut] = useState('tous');

  const counts = useMemo(() => ({
    tous: items.length,
    en_vente: items.filter(i => i.statut === 'en_vente').length,
    vendus: items.filter(i => i.statut === 'vendu').length,
    a_reverser: items.filter(i => i.aReverser != null).length,
    en_attente: items.filter(i => i.statut === 'en_attente').length,
  }), [items]);

  const filtered = useMemo(() => items.filter(i => {
    if (statut === 'en_vente' && i.statut !== 'en_vente') return false;
    if (statut === 'vendus' && i.statut !== 'vendu') return false;
    if (statut === 'a_reverser' && i.aReverser == null) return false;
    if (statut === 'en_attente' && i.statut !== 'en_attente') return false;
    if (q && !(`${i.titre} ${i.source}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [items, statut, q]);

  return (
    <div style={screen}>
      {/* header — pas de flèche retour */}
      <h2 style={{ font: `700 25px/1.1 ${F.title}`, letterSpacing: '-.02em', margin: '0 0 4px' }}>Mon inventaire</h2>
      <p style={{ font: `400 13px/1.5 ${F.body}`, color: C.muted1, margin: '0 0 14px' }}>Tout ton stock au même endroit, prêt à vendre.</p>

      {/* recherche + filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9, background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 13, padding: '11px 14px' }}>
          <MagnifyingGlass size={16} color={C.muted2} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un article…"
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', font: `400 13.5px ${F.body}`, color: C.ink }} />
        </div>
        <button onClick={onOpenFilters} style={{ flexShrink: 0, width: 46, border: `1.5px solid ${C.border}`, background: '#fff',
          borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
          <SlidersHorizontal size={18} color={C.ink} />
          {activeFilterCount > 0 && <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 17, height: 17, padding: '0 4px',
            borderRadius: 999, background: C.coral, color: '#fff', font: `800 9px ${F.body}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilterCount}</span>}
        </button>
      </div>

      {/* statuts en chips */}
      <div style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 16, paddingBottom: 2 }}>
        {STATUTS.map(s => {
          const on = statut === s.id;
          return (
            <button key={s.id} onClick={() => setStatut(s.id)} style={{ flexShrink: 0, cursor: 'pointer', borderRadius: 999,
              font: `${on ? 700 : 600} 12.5px ${F.body}`, padding: '8px 14px',
              color: on ? '#fff' : (s.color ? s.color.fg : C.ink), background: on ? C.ink : '#fff',
              border: on ? 'none' : `1.5px solid ${s.color ? s.color.bd : C.border}` }}>
              {s.label} · {counts[s.id === 'vendus' ? 'vendus' : s.id]}
            </button>
          );
        })}
      </div>

      {filtered.map(it => (
        <Card key={it.id} item={it} onOpen={onOpen} onMarkSold={onMarkSold} onMarkReversed={onMarkReversed} />
      ))}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', font: `500 13px ${F.body}`, color: C.muted3 }}>Aucun article pour ce filtre.</div>
      )}
    </div>
  );
}
