// DetailArticle.jsx — Détail d'un article, PLEIN ÉCRAN, onglets "Annonce" / "Suivi & prix".
// - Onglet Annonce : blocs Copier (titre / description avec hashtags Vinted), régénérer, tags.
//   -> même look que GenererFlow (cohérence).
// - Onglet Suivi & prix : hero navy (marge + reco IA), prix achat/listé/vente réel, statut,
//   plateforme, source, malle, suppression. Champ "Note prix" SUPPRIMÉ (inutile).
// - Header avec flèche retour (écran de détail poussé au-dessus de l'onglet Inventaire).
//
// deps: react, @phosphor-icons/react + loot-tokens.js

import React, { useState } from 'react';
import {
  ArrowLeft, Check, Copy, ArrowClockwise, Plus, CaretUpDown, MapPin, TreasureChest,
  Lightbulb, Trash,
} from '@phosphor-icons/react';
import { C, F, SHADOW } from './loot-tokens';

const screen = {
  width: '100%', maxWidth: 480, margin: '0 auto', boxSizing: 'border-box',
  padding: '16px 18px 128px', background: C.canvas, minHeight: '100%', fontFamily: F.body, color: C.ink,
};
const label = { font: `700 11px ${F.body}`, letterSpacing: '.06em', color: C.muted2, textTransform: 'uppercase' };
const card = { background: C.surface, borderRadius: 16, padding: '14px 15px', boxShadow: SHADOW.card, boxSizing: 'border-box' };
const field = { background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '13px 15px', boxSizing: 'border-box' };

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={async () => { try { await navigator.clipboard.writeText(text); } catch {} setDone(true); setTimeout(() => setDone(false), 1500); }}
      style={{ border: 'none', background: done ? C.green : C.coral, color: '#fff', font: `700 12px ${F.body}`,
        padding: '7px 14px', borderRadius: 10, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
        boxShadow: '0 4px 11px rgba(240,60,100,.26)' }}>
      {done ? <Check size={14} weight="bold" /> : <Copy size={14} weight="fill" />}{done ? 'Copié' : 'Copier'}
    </button>
  );
}

export default function DetailArticle({ article, onBack = () => {}, onSave = () => {}, onDelete = () => {}, onRegenerate = () => {} }) {
  const a = article || {};
  const [tab, setTab] = useState('suivi');       // 'suivi' | 'annonce' (Suivi par défaut : c'est ce qu'on remplit à l'enregistrement ; Annonce = filet de secours)
  const [titre, setTitre] = useState(a.titre || '');
  const [desc, setDesc] = useState(a.description || '');
  const [tags, setTags] = useState(a.tags || ['Vintage']);
  const [plateforme, setPlateforme] = useState(a.plateforme || 'Vinted');
  const [achat, setAchat] = useState(a.achat ?? '');
  const [prixListe, setPrixListe] = useState(a.prix ?? '');
  const [venteReel, setVenteReel] = useState(a.venteReel ?? '');

  const base = venteReel !== '' ? +venteReel : (prixListe !== '' ? +prixListe : null);
  const marge = base != null && achat !== '' ? +(base - +achat).toFixed(2) : null;

  return (
    <div style={screen}>
      {/* header : flèche retour OK (écran poussé) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none',
          boxShadow: '0 1px 4px rgba(28,27,58,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={17} weight="bold" color={C.ink} /></button>
        <span style={{ font: `700 16px ${F.title}`, color: C.ink }}>Détail de l'article</span>
        <button onClick={() => onSave({ titre, desc, tags, plateforme, achat, prixListe, venteReel })}
          style={{ width: 36, height: 36, borderRadius: '50%', background: C.coral, border: 'none',
            boxShadow: '0 5px 12px rgba(240,60,100,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Check size={17} weight="bold" color="#fff" /></button>
      </div>

      {/* item strip */}
      <div style={{ display: 'flex', gap: 11, alignItems: 'center', marginBottom: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 13, flexShrink: 0, background: a.photo ? `center/cover url(${a.photo})` : C.photoStripe }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: `700 14px/1.25 ${F.title}`, color: C.ink }}>{titre || 'Sans titre'}</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: `700 10.5px ${F.body}`,
            color: C.amberText, background: C.amberTint, padding: '3px 8px', borderRadius: 999, marginTop: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber }} />En vente · {plateforme}</span>
        </div>
      </div>

      {/* onglets */}
      <div style={{ display: 'flex', gap: 6, background: '#EAE4DA', borderRadius: 14, padding: 4, marginBottom: 16 }}>
        {[['suivi', 'Suivi & prix'], ['annonce', 'Annonce']].map(([id, lbl]) => {
          const on = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{ flex: 1, textAlign: 'center', font: `700 13px ${F.body}`,
              borderRadius: 10, padding: 10, cursor: 'pointer', border: 'none',
              color: on ? '#fff' : '#8A7F70', background: on ? C.ink : 'transparent',
              boxShadow: on ? '0 2px 6px rgba(28,27,58,.2)' : 'none' }}>{lbl}</button>
          );
        })}
      </div>

      {/* ===================== ONGLET ANNONCE ===================== */}
      {tab === 'annonce' && (
        <>
          {/* photos */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 88, height: 88, borderRadius: 14, flexShrink: 0, background: C.photoStripe }} />
            <div style={{ width: 66, height: 88, borderRadius: 12, flexShrink: 0, background: C.photoStripe }} />
            <button style={{ width: 66, height: 88, borderRadius: 12, flexShrink: 0, border: `2px dashed #DBC9CF`, background: '#FBF3F5',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: '#C98BA0', cursor: 'pointer' }}>
              <Plus size={16} /><span style={{ font: `600 8.5px ${F.body}` }}>ajouter</span></button>
          </div>

          {/* titre */}
          <div style={{ ...card, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={label}>Titre</span><CopyBtn text={titre} />
            </div>
            <textarea value={titre} onChange={e => setTitre(e.target.value)} rows={2}
              style={{ width: '100%', border: 'none', resize: 'vertical', outline: 'none', background: 'transparent', font: `600 14px/1.35 ${F.body}`, color: C.ink }} />
          </div>

          {/* description */}
          <div style={{ ...card, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={label}>Description{plateforme === 'Vinted' ? <span style={{ color: C.vinted }}> · #hashtags inclus</span> : ''}</span>
              <CopyBtn text={desc} />
            </div>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={6}
              style={{ width: '100%', border: 'none', resize: 'vertical', outline: 'none', background: 'transparent', font: `400 13px/1.6 ${F.body}`, color: '#4A4860' }} />
            <button onClick={onRegenerate} style={{ width: '100%', marginTop: 11, border: `1.5px solid ${C.border}`, background: '#fff',
              color: C.ink, font: `700 12.5px ${F.body}`, padding: 10, borderRadius: 11, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ArrowClockwise size={14} />Régénérer l'annonce</button>
          </div>

          {/* tags */}
          <div style={{ ...label, margin: '16px 0 8px' }}>Tags</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {tags.map((t, i) => (
              <span key={t + i} style={{ font: `700 12px ${F.body}`, color: i === 0 ? '#fff' : C.muted1, background: i === 0 ? C.ink : '#fff',
                border: i === 0 ? 'none' : `1.5px solid ${C.border}`, borderRadius: 999, padding: '8px 14px' }}>{t}</span>
            ))}
            <button style={{ font: `600 12px ${F.body}`, color: C.coralPressed, background: C.coralTint, border: `1.5px dashed ${C.coralBorder}`,
              borderRadius: 999, padding: '8px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Plus size={11} weight="bold" />Tag</button>
          </div>
        </>
      )}

      {/* ===================== ONGLET SUIVI & PRIX ===================== */}
      {tab === 'suivi' && (
        <>
          {/* hero */}
          <div style={{ background: C.ink, borderRadius: 18, padding: '16px 18px', color: '#fff', marginBottom: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ font: `600 11px ${F.body}`, color: '#B7B5C8', textTransform: 'uppercase', letterSpacing: '.06em' }}>Marge {venteReel !== '' ? 'réelle' : 'estimée'}</div>
              <div style={{ font: `800 26px ${F.title}`, marginTop: 3 }}>{marge != null ? `${marge >= 0 ? '+' : ''}${marge} €` : '—'}</div>
            </div>
            {a.recoIA != null && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ font: `600 11px ${F.body}`, color: '#B7B5C8' }}>Reco IA</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, font: `700 13px ${F.body}`, color: '#FFDCE4', marginTop: 3 }}>
                  <Lightbulb size={14} weight="fill" color="#FFC24B" />{a.recoIA} €</div>
              </div>
            )}
          </div>

          {/* prix */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ ...label, marginBottom: 7 }}>Prix d'achat €</div>
              <input value={achat} onChange={e => setAchat(e.target.value)} inputMode="decimal" style={{ ...field, width: '100%', font: `700 15px ${F.title}`, color: C.ink, outline: 'none' }} />
            </div>
            <div>
              <div style={{ ...label, marginBottom: 7 }}>Prix listé €</div>
              <input value={prixListe} onChange={e => setPrixListe(e.target.value)} inputMode="decimal" style={{ ...field, width: '100%', font: `700 15px ${F.title}`, color: C.ink, outline: 'none' }} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ ...label, marginBottom: 7 }}>Prix de vente réel € <span style={{ color: C.muted4 }}>· au moment de la vente</span></div>
            <input value={venteReel} onChange={e => setVenteReel(e.target.value)} inputMode="decimal" placeholder="—"
              style={{ ...field, width: '100%', font: `600 14px ${F.body}`, color: C.ink, outline: 'none' }} />
          </div>

          {/* statut + plateforme */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <div>
              <div style={{ ...label, marginBottom: 7 }}>Statut</div>
              <button style={{ ...field, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `700 12px ${F.body}`, color: C.amberText }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber }} />En vente</span>
                <CaretUpDown size={15} color={C.muted2} /></button>
            </div>
            <div>
              <div style={{ ...label, marginBottom: 7 }}>Plateforme</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Vinted', 'LBC'].map(p => {
                  const on = plateforme === p;
                  return <button key={p} onClick={() => setPlateforme(p)} style={{ flex: 1, textAlign: 'center', font: `700 12px ${F.body}`,
                    borderRadius: 12, padding: '12px 4px', cursor: 'pointer',
                    color: on ? C.vinted : C.muted3, background: on ? C.vintedTint : '#fff',
                    border: `1.5px solid ${on ? C.vintedBorder : C.border}` }}>{p}</button>;
                })}
              </div>
            </div>
          </div>

          {/* source */}
          <div style={{ marginTop: 16 }}>
            <div style={{ ...label, marginBottom: 7 }}>Source</div>
            <button style={{ ...field, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: `600 14px ${F.body}`, color: C.ink, cursor: 'pointer' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPin size={15} color={C.muted2} />{a.source || 'Croix Rouge Bry'}</span>
              <CaretUpDown size={15} color={C.muted2} /></button>
          </div>
          {/* malle */}
          <div style={{ marginTop: 12 }}>
            <div style={{ ...label, marginBottom: 7 }}>Malle</div>
            <button style={{ ...field, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', font: `600 14px ${F.body}`, color: C.ink, cursor: 'pointer' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><TreasureChest size={15} weight="fill" color={C.muted2} />{a.malle || 'Mes articles perso'}</span>
              <CaretUpDown size={15} color={C.muted2} /></button>
          </div>

          <button onClick={onDelete} style={{ width: '100%', marginTop: 18, border: `1.5px solid #F0C6D0`, background: '#fff',
            color: C.coralPressed, font: `700 13px ${F.body}`, padding: 13, borderRadius: 14, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <Trash size={16} />Supprimer l'article</button>
        </>
      )}
    </div>
  );
}
