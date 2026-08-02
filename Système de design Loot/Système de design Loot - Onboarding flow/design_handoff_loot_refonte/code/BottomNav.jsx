// BottomNav.jsx — Barre de navigation flottante + FAB central "Générer"
// deps: @phosphor-icons/react
import React from 'react';
import { Package, ChartBar, TreasureChest, GearSix, Sparkle } from '@phosphor-icons/react';
import { C, F, SHADOW } from './loot-tokens';

// active: 'inventaire' | 'stats' | 'generer' | 'malles' | 'parametres'
export default function BottomNav({ active = 'inventaire', onNav = () => {}, onGenerate = () => {} }) {
  const generActive = active === 'generer';
  const Tab = ({ id, label, Icon }) => {
    const on = active === id;
    return (
      <button onClick={() => onNav(id)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        color: on ? C.coral : C.muted3, padding: 0,
      }}>
        <Icon size={22} weight={on ? 'fill' : 'regular'} />
        <span style={{ font: `600 10.5px ${F.body}` }}>{label}</span>
      </button>
    );
  };
  return (
    <div style={{ position: 'absolute', left: 14, right: 14, bottom: 16, height: 64,
      background: C.surface, borderRadius: 22, display: 'flex', alignItems: 'center', boxShadow: SHADOW.nav }}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
        <Tab id="inventaire" label="Inventaire" Icon={Package} />
        <Tab id="stats" label="Stats" Icon={ChartBar} />
      </div>
      <div style={{ width: 58, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
        <Tab id="malles" label="Malles" Icon={TreasureChest} />
        <Tab id="parametres" label="Paramètres" Icon={GearSix} />
      </div>
      {/* FAB : corail au repos, navy quand Générer est l'écran actif */}
      <button onClick={onGenerate} style={{
        position: 'absolute', left: '50%', bottom: 40, transform: 'translateX(-50%)',
        width: 62, height: 62, borderRadius: '50%', cursor: 'pointer',
        background: generActive ? C.ink : C.coral, border: `4px solid ${C.canvas}`,
        boxShadow: generActive ? SHADOW.fabNavy : SHADOW.fab,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
      }}>
        <Sparkle size={22} weight="fill" color="#fff" />
        <span style={{ font: `700 8px ${F.body}`, color: '#fff' }}>Générer</span>
      </button>
    </div>
  );
}
