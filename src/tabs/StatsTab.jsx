import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { listSources } from "../lib/sources";
import { listCategories } from "../lib/categories";
import { listMalles } from "../lib/malles";
import {
  CurrencyEur, CheckCircle, Lightning, ShoppingBag,
  Package, Wallet, TrendUp, Timer, Hourglass, Tag, PlusCircle,
} from "@phosphor-icons/react";
import { C, F } from "../lib/loot-tokens";

function netRevenue(i) {
  const prixVente = parseFloat(i.prixVente) || 0;
  const montantAReverser = parseFloat(i.montantAReverser);
  return Number.isFinite(montantAReverser) ? prixVente - montantAReverser : prixVente;
}

function computeStats(items) {
  const vendus = items.filter((i) => i.statut === "vendu" && i.prixVente);
  const tv = vendus.reduce((s, i) => s + (parseFloat(i.prixVente) || 0), 0);
  const tNet = vendus.reduce((s, i) => s + netRevenue(i), 0);
  const tav = vendus.reduce((s, i) => s + (parseFloat(i.prixAchat) || 0), 0);
  const ta = items.reduce((s, i) => s + (parseFloat(i.prixAchat) || 0), 0);
  const marge = tNet - tav;
  const roi = ta > 0 ? Math.round((marge / ta) * 100) : null;
  const withReco = items.filter((i) => parseFloat(i.prixRecommande) > 0 && parseFloat(i.prixAffiche) > 0);
  const avgEcartPct = withReco.length > 0
    ? Math.round(withReco.reduce((s, i) => s + ((parseFloat(i.prixAffiche) - parseFloat(i.prixRecommande)) / parseFloat(i.prixRecommande)) * 100, 0) / withReco.length)
    : null;
  const venduWithPrix = vendus.filter((i) => parseFloat(i.prixVente) > 0 && parseFloat(i.prixAffiche) > 0);
  const avgVentePct = venduWithPrix.length > 0
    ? Math.round(venduWithPrix.reduce((s, i) => s + ((parseFloat(i.prixVente) - parseFloat(i.prixAffiche)) / parseFloat(i.prixAffiche)) * 100, 0) / venduWithPrix.length)
    : null;
  // Time to sell : nb de jours entre created_at et vendu_at
  const vendusWithDates = vendus.filter((i) => i.createdAt && i.venduAt);
  const avgTimeToSell = vendusWithDates.length > 0
    ? Math.round(vendusWithDates.reduce((s, i) => {
        return s + (new Date(i.venduAt) - new Date(i.createdAt)) / (1000 * 60 * 60 * 24);
      }, 0) / vendusWithDates.length)
    : null;

  // Âge moyen du stock : nb de jours depuis created_at pour les articles non vendus
  const enVente = items.filter((i) => i.statut !== "vendu" && i.createdAt);
  const now = Date.now();
  const avgStockAge = enVente.length > 0
    ? Math.round(enVente.reduce((s, i) => s + (now - new Date(i.createdAt)) / (1000 * 60 * 60 * 24), 0) / enVente.length)
    : null;

  return { vendus, tv, ta, tNet, marge, roi, withReco, avgEcartPct, avgVentePct, venduWithPrix, avgTimeToSell, avgStockAge };
}

const SESSION_GAP_MS = 10 * 1000; // 10s → capte les imports batch automatiques (500ms/article)

function buildDailyActivity(items, days = 7, weekOffset = 0) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  today.setDate(today.getDate() - weekOffset * 7);
  const slots = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      label: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
      dayNum: d.getDate(),
      day: d.toISOString().slice(0, 10),
      ajouts: 0, ventes: 0, gains: 0,
    };
  });
  const byDay = Object.fromEntries(slots.map((s) => [s.day, s]));

  // Ventes : exclut les items déjà reversés (import historique), venduAt prioritaire sinon createdAt
  for (const it of items) {
    if (it.statut === "vendu" && !it.reversePaye) {
      const dateStr = (it.venduAt || it.createdAt || "").slice(0, 10);
      if (dateStr && byDay[dateStr]) {
        byDay[dateStr].ventes++;
        byDay[dateStr].gains += parseFloat(it.prixVente) || 0;
      }
    }
  }

  // Ajouts : dédupliqués par session (items créés dans une fenêtre de 5 min
  // consécutive = 1 seule session, pour lisser les imports en batch).
  const withDate = items
    .filter((it) => it.createdAt && !it.reversePaye && !(it.statut === "vendu" && !it.venduAt) && byDay[it.createdAt.slice(0, 10)])
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  let lastTs = null;
  for (const it of withDate) {
    const ts = new Date(it.createdAt).getTime();
    const day = it.createdAt.slice(0, 10);
    if (lastTs === null || ts - lastTs > SESSION_GAP_MS) {
      byDay[day].ajouts++;
    }
    lastTs = ts;
  }

  return slots;
}

function isoWeek(date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
}

function buildWeeklyActivity(items, numWeeks = 13) {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0 = lundi
  const slots = Array.from({ length: numWeeks }, (_, i) => {
    const start = new Date(today);
    start.setDate(today.getDate() - dow - (numWeeks - 1 - i) * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return {
      label: `S${isoWeek(start)}`,
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      ajouts: 0, ventes: 0, gains: 0,
    };
  });
  for (const it of items) {
    if (it.statut === "vendu" && !it.reversePaye) {
      const d = (it.venduAt || it.createdAt || "").slice(0, 10);
      if (d) { const sl = slots.find(s => d >= s.start && d <= s.end); if (sl) { sl.ventes++; sl.gains += parseFloat(it.prixVente) || 0; } }
    }
  }
  for (const it of items) {
    if (it.createdAt && !it.reversePaye && !(it.statut === "vendu" && !it.venduAt)) { const d = it.createdAt.slice(0, 10); const sl = slots.find(s => d >= s.start && d <= s.end); if (sl) sl.ajouts++; }
  }
  return slots;
}

function buildMonthlyActivity(items, numMonths = 12) {
  const today = new Date();
  const slots = Array.from({ length: numMonths }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (numMonths - 1 - i), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
      start: d.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      ajouts: 0, ventes: 0, gains: 0,
    };
  });
  for (const it of items) {
    if (it.statut === "vendu" && !it.reversePaye) {
      const d = (it.venduAt || it.createdAt || "").slice(0, 10);
      if (d) { const sl = slots.find(s => d >= s.start && d <= s.end); if (sl) { sl.ventes++; sl.gains += parseFloat(it.prixVente) || 0; } }
    }
  }
  for (const it of items) {
    if (it.createdAt && !it.reversePaye && !(it.statut === "vendu" && !it.venduAt)) { const d = it.createdAt.slice(0, 10); const sl = slots.find(s => d >= s.start && d <= s.end); if (sl) sl.ajouts++; }
  }
  return slots;
}

function buildSlots(items, period) {
  if (period.type === "week") return buildWeeklyActivity(items, period.count);
  if (period.type === "month") return buildMonthlyActivity(items, period.count);
  return buildDailyActivity(items, period.count);
}

function MiniBarChart({ slots, getValue, color, H = 60 }) {
  const W = 320, BAR_W = 3, GAP = 2;
  const step = (W - BAR_W) / (slots.length - 1);
  const maxVal = Math.max(1, ...slots.map(getValue));
  const monthLabels = [];
  let lastMonth = null;
  slots.forEach((s, i) => {
    const month = s.label.split(" ")[1];
    if (month !== lastMonth) { monthLabels.push({ i, label: month }); lastMonth = month; }
  });
  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} style={{ width: "100%", overflow: "visible" }}>
      {slots.map((s, i) => {
        const v = getValue(s);
        const h = v > 0 ? Math.max(3, (v / maxVal) * H) : 0;
        return h > 0 ? (
          <rect key={s.day} x={i * step} y={H - h} width={BAR_W} height={h} rx={1.5} fill={color} opacity={0.85} />
        ) : null;
      })}
      {monthLabels.map(({ i, label }) => (
        <text key={label} x={i * step} y={H + 12} fontSize={8} fill="var(--muted-2)" fontFamily="Hanken Grotesk, sans-serif">{label}</text>
      ))}
    </svg>
  );
}

const VIOLET = '#6C63F0', VIOLET_DK = '#4A42C7';

const PERIODS = [
  { label: "7 j",     type: "day",   count: 7  },
  { label: "Semaine", type: "week",  count: 13 },
  { label: "Mois",    type: "month", count: 12 },
];

function ActivityChart({ items }) {
  const defaultIdx = useMemo(() => {
    for (let i = PERIODS.length - 1; i >= 0; i--) {
      const s = buildSlots(items, PERIODS[i]);
      if (s.some((d) => d.ajouts > 0 || d.ventes > 0 || d.gains > 0)) return i;
    }
    return 0;
  }, [items]);

  const [periodIdx, setPeriodIdx] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const touchStartX = useRef(null);

  const period = PERIODS[periodIdx];
  const is7j = period.type === "day";

  const slots = is7j
    ? buildDailyActivity(items, 7, weekOffset)
    : buildSlots(items, period);

  const currentWeekNum = is7j ? isoWeek(new Date(Date.now() - weekOffset * 7 * 86400000)) : null;

  const handlePeriodChange = (i) => { setPeriodIdx(i); setWeekOffset(0); };

  const hasAny = slots.some((s) => s.ajouts > 0 || s.ventes > 0 || s.gains > 0);

  const H = 120;
  const maxGain  = Math.max(1, ...slots.map((s) => s.gains));
  const maxAjout = Math.max(1, ...slots.map((s) => s.ajouts));
  const total       = slots.reduce((s, d) => s + d.gains, 0);
  const totalAjouts = slots.reduce((s, d) => s + d.ajouts, 0);
  const bestIdx = slots.reduce((b, d, i, a) => (d.gains > a[b].gains ? i : b), 0);

  const barGap   = period.type === "day" && period.count <= 7 ? 6 : period.type === "day" ? 1 : 2;
  const labelStep = period.type === "month" ? 1 : period.type === "week" ? 2 : period.count <= 7 ? 1 : 5;
  const getAxisLabel = (s) => {
    if (period.type === "month" || period.type === "week") return s.label;
    return period.count > 7 ? String(s.dayNum) : s.label.split(" ")[0];
  };

  return (
    <div className="section-card" style={{ marginBottom: 14 }}>
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <span className="psection-label">
          Gains nets · {period.label}{is7j ? ` · S${currentWeekNum}` : ""}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {is7j && (
            <>
              <button onClick={() => setWeekOffset(o => o + 1)} style={{ padding: "3px 8px", borderRadius: 20, border: `1.5px solid ${C.border}`, background: "#fff", color: C.muted2, fontSize: 12, cursor: "pointer" }}>‹</button>
              <button onClick={() => setWeekOffset(o => Math.max(0, o - 1))} disabled={weekOffset === 0} style={{ padding: "3px 8px", borderRadius: 20, border: `1.5px solid ${weekOffset === 0 ? C.divider : C.border}`, background: "#fff", color: weekOffset === 0 ? C.divider : C.muted2, fontSize: 12, cursor: weekOffset === 0 ? "default" : "pointer" }}>›</button>
            </>
          )}
          {PERIODS.map((p, i) => (
            <button key={p.label} onClick={() => handlePeriodChange(i)} style={{
              padding: "3px 9px", borderRadius: 20, border: "1.5px solid",
              borderColor: i === periodIdx ? C.ink : C.border,
              background: i === periodIdx ? C.ink : "#fff",
              color: i === periodIdx ? "#fff" : C.muted2,
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: F.body,
            }}>{p.label}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: F.title, fontWeight: 800, fontSize: 24, color: C.ink, letterSpacing: "-.01em" }}>{Math.round(total)} €</span>
      </div>

      <div style={{ overflow: "hidden" }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null || !is7j) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 40) {
            if (dx < 0) setWeekOffset(o => o + 1);
            else if (weekOffset > 0) setWeekOffset(o => o - 1);
          }
          touchStartX.current = null;
        }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: barGap, height: H + 44 }}>
          {slots.map((s, i) => {
            const h    = s.gains > 0 ? Math.max(14, Math.round((s.gains / maxGain) * H)) : 0;
            const best = i === bestIdx && s.gains > 0;
            const showLabel = i === bestIdx || i % labelStep === 0 || i === slots.length - 1;
            const key  = s.start || s.day || i;
            return (
              <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 4, minWidth: 0 }}>
                {/* badge ventes */}
                {s.ventes > 0
                  ? <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontFamily: F.body, fontWeight: 700, fontSize: 9, color: C.greenDark, background: C.greenTint, padding: "2px 4px", borderRadius: 999, whiteSpace: "nowrap" }}>
                      {s.ventes}<Tag size={8} weight="fill" />
                    </span>
                  : <span style={{ height: 17 }} />}
                {/* barre */}
                {s.gains > 0
                  ? <div style={{ width: "100%", height: h, borderRadius: 6, background: `linear-gradient(180deg, #8983F5, ${VIOLET})`, boxShadow: best ? "0 6px 14px rgba(108,99,240,.28)" : "none" }} />
                  : <div style={{ width: "100%", height: 4, borderRadius: 4, background: "#EDEBF3" }} />}
                {/* valeur */}
                {s.gains > 0
                  ? <span style={{ fontFamily: F.title, fontWeight: 800, fontSize: best ? 11 : 10, color: VIOLET_DK, whiteSpace: "nowrap" }}>{s.gains.toFixed(0)}€</span>
                  : <span style={{ fontFamily: F.body, fontWeight: 600, fontSize: 10, color: "#B7B4C4" }}>–</span>}
                {/* axe */}
                <span style={{ fontFamily: F.body, fontWeight: best ? 700 : 600, fontSize: 9, color: best ? C.ink : C.muted2, visibility: showLabel ? "visible" : "hidden", whiteSpace: "nowrap" }}>
                  {getAxisLabel(s)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ajouts — stat secondaire */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.divider}` }}>
        <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, background: C.coralTint, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PlusCircle size={18} weight="fill" color={C.coral} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 15, color: C.ink, lineHeight: 1 }}>
            {totalAjouts} ajouts
            <span style={{ fontFamily: F.body, fontWeight: 600, fontSize: 12, color: C.muted2 }}> sur {PERIODS[periodIdx].label}</span>
          </div>
          <div style={{ fontFamily: F.body, fontWeight: 500, fontSize: 11, color: C.muted2, marginTop: 2 }}>Ton stock continue de grandir</div>
        </div>
        {/* mini-sparkline ajouts */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 24 }}>
          {slots.map((s, i) => (
            <span key={i} style={{ width: 5, height: Math.max(3, Math.round((s.ajouts / maxAjout) * 24)), borderRadius: 2, background: s.ajouts === maxAjout ? C.coral : "#F5B9C8" }} />
          ))}
        </div>
      </div>
    </div>
  );
}


function MetricCard({ icon, value, label, iconColor }) {
  return (
    <div className="metric-card">
      <div className="metric-card-icon" style={{ color: iconColor || "var(--coral)" }}>
        {icon}
      </div>
      <div className="metric-val">{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

export function StatsTab({ items }) {
  const { user } = useAuth();
  const [sources, setSources] = useState([]);
  const [tags, setTags] = useState([]);
  const [malles, setMalles] = useState([]);
  const [sourceFilter, setSourceFilter] = useState("tout");
  const [tagFilter, setTagFilter] = useState([]);
  const [malleFilter, setMalleFilter] = useState("tout");
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const tagMenuRef = useRef(null);
  const [breakdownMetric, setBreakdownMetric] = useState("ca");
  const [dateFilter, setDateFilter] = useState("tout");
  const DATE_FILTERS = ["1m", "3m", "6m", "tout"];
  const DATE_LABELS  = { "1m": "1 m", "3m": "3 m", "6m": "6 m", "tout": "Tout" };
  const cutoff = useMemo(() => {
    const months = { "1m": 1, "3m": 3, "6m": 6 }[dateFilter];
    if (!months) return null;
    const d = new Date(); d.setMonth(d.getMonth() - months);
    return d.toISOString().slice(0, 10);
  }, [dateFilter]);

  useEffect(() => {
    listSources(user.id).then(setSources).catch(() => {});
    listCategories(user.id).then(setTags).catch(() => {});
    listMalles(user.id).then(setMalles).catch(() => {});
  }, [user.id]);

  useEffect(() => {
    if (!tagMenuOpen) return;
    const onClick = (e) => { if (tagMenuRef.current && !tagMenuRef.current.contains(e.target)) setTagMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [tagMenuOpen]);

  const toggleTag = (id) =>
    setTagFilter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const scoped = items
    .filter((i) => i.statut !== "en-attente")
    .filter((i) => sourceFilter === "tout" || i.sourceId === sourceFilter)
    .filter((i) => tagFilter.length === 0 || tagFilter.every((id) => (i.tagIds || []).includes(id)))
    .filter((i) => malleFilter === "tout" || (malleFilter === "moi" ? !i.malleId : i.malleId === malleFilter));

  const { vendus: vendusAll, tv: tvAll, marge: margeAll, roi: roiAll, withReco, avgEcartPct } = computeStats(scoped);
  const vendus = cutoff ? vendusAll.filter((i) => ((i.venduAt || i.createdAt) || "").slice(0, 10) >= cutoff) : vendusAll;
  // nb articles + dépense nette filtrés par période (cutoff sur createdAt)
  const scopedPeriod = cutoff ? scoped.filter(i => (i.createdAt || "").slice(0, 10) >= cutoff) : scoped;
  const ta = scopedPeriod.reduce((s, i) => s + (parseFloat(i.prixAchat) || 0), 0);
  const _now = Date.now();
  const _enVente = scopedPeriod.filter(i => i.statut !== "vendu" && i.createdAt);
  const avgStockAge = _enVente.length > 0
    ? Math.round(_enVente.reduce((s, i) => s + (_now - new Date(i.createdAt)) / (1000 * 60 * 60 * 24), 0) / _enVente.length)
    : null;
  const tv = vendus.reduce((s, i) => s + (parseFloat(i.prixVente) || 0), 0);
  const tav = vendus.reduce((s, i) => s + (parseFloat(i.prixAchat) || 0), 0);
  const marge = vendus.reduce((s, i) => s + (parseFloat(i.prixVente) || 0) - (parseFloat(i.prixAchat) || 0) - (i.malleId && i.montantAReverser ? parseFloat(i.montantAReverser) : 0), 0);
  const roi = tav > 0 ? Math.round(((tv - tav) / tav) * 100) : null;
  const panierMoyen = vendus.length > 0 ? tv / vendus.length : 0;
  const tauxVente = scopedPeriod.length > 0 ? Math.round((vendus.length / scopedPeriod.length) * 100) : 0;
  const venduWithPrix = vendus.filter((i) => parseFloat(i.prixVente) > 0 && parseFloat(i.prixAffiche) > 0);
  const avgVentePct = venduWithPrix.length > 0
    ? Math.round(venduWithPrix.reduce((s, i) => s + ((parseFloat(i.prixVente) - parseFloat(i.prixAffiche)) / parseFloat(i.prixAffiche)) * 100, 0) / venduWithPrix.length)
    : null;
  const vendusWithDates = vendus.filter((i) => i.createdAt && i.venduAt);
  const avgTimeToSell = vendusWithDates.length > 0
    ? Math.round(vendusWithDates.reduce((s, i) => s + (new Date(i.venduAt) - new Date(i.createdAt)) / (1000 * 60 * 60 * 24), 0) / vendusWithDates.length)
    : null;

  const bySource = Object.values(
    vendus.filter((i) => !i.malleId).reduce((acc, i) => {
      const nom = sources.find((s) => s.id === i.sourceId)?.nom || i.source || "Sans source";
      if (!acc[nom]) acc[nom] = { nom, ca: 0, count: 0 };
      acc[nom].ca += netRevenue(i);
      acc[nom].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b[breakdownMetric] - a[breakdownMetric]);
  const maxBreakdown = Math.max(1, ...bySource.map((s) => s[breakdownMetric]));

  const byTag = Object.values(
    vendus.reduce((acc, i) => {
      (i.tagIds?.length ? i.tagIds : ["sans-tag"]).forEach((tagId) => {
        const nom = tags.find((t) => t.id === tagId)?.nom || "Sans tag";
        if (!acc[nom]) acc[nom] = { nom, total: 0, count: 0 };
        acc[nom].total += netRevenue(i);
        acc[nom].count += 1;
      });
      return acc;
    }, {})
  ).map((t) => ({ nom: t.nom, panier: t.total / t.count })).sort((a, b) => b.panier - a.panier);
  const maxPanierTag = Math.max(1, ...byTag.map((t) => t.panier));

  return (
    <div className="page">
      {/* Filtre date */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px 8px", overflowX: "auto" }}>
        {DATE_FILTERS.map((f) => (
          <button key={f} onClick={() => setDateFilter(f)} style={{
            padding: "4px 12px", borderRadius: 20, border: "1.5px solid",
            borderColor: f === dateFilter ? "var(--ink)" : "var(--border)",
            background: f === dateFilter ? "var(--ink)" : "var(--surface)",
            color: f === dateFilter ? "#fff" : "var(--muted-2)",
            fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            fontFamily: "'Hanken Grotesk', sans-serif", flexShrink: 0,
          }}>{DATE_LABELS[f]}</button>
        ))}
      </div>
      {/* Filtres */}
      <div className="filters">
        {malles.length > 0 && (
          <select className={"select-pill" + (malleFilter !== "tout" ? " active" : "")} value={malleFilter} onChange={(e) => setMalleFilter(e.target.value)}>
            <option value="tout">Toutes les malles</option>
            <option value="moi">Mes articles</option>
            {malles.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
        )}
        <select className={"select-pill" + (sourceFilter !== "tout" ? " active" : "")} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="tout">Toutes sources</option>
          {sources.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        <div className="tag-dropdown" ref={tagMenuRef}>
          <button type="button" className={"select-pill" + (tagFilter.length > 0 ? " active" : "")} onClick={() => setTagMenuOpen((v) => !v)}>
            {tagFilter.length > 0 ? `Tags (${tagFilter.length})` : "Tags"}
          </button>
          {tagMenuOpen && (
            <div className="tag-dropdown-panel">
              {tags.map((t) => (
                <label key={t.id} className="tag-dropdown-item">
                  <input type="checkbox" checked={tagFilter.includes(t.id)} onChange={() => toggleTag(t.id)} />
                  {t.nom}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card hero navy — Marge nette */}
      <div className="hero-card">
        <div className="hero-card-label">
          MARGE NETTE
          {roi !== null && <span className="roi-chip">ROI {roi}%</span>}
        </div>
        <div className="hero-card-val">
          {marge >= 0 ? "+" : ""}{marge.toFixed(0)} €
        </div>
        <div className="hero-card-sub">
          sur {tv.toFixed(0)} € de ventes · {ta.toFixed(0)} € dépensés
        </div>
      </div>

      {/* Grille métriques */}
      <div className="stats-grid" style={{ marginBottom: 14 }}>
        <MetricCard icon={<CurrencyEur size={17} weight="fill" />} value={tv.toFixed(0) + " €"} label="CA total" />
        <MetricCard icon={<CheckCircle size={17} weight="fill" />} value={vendus.length} label="Vendus" iconColor="var(--green)" />
        <MetricCard icon={<Lightning size={17} weight="fill" />} value={tauxVente + " %"} label="Taux de vente" />
        <MetricCard icon={<ShoppingBag size={17} weight="fill" />} value={panierMoyen.toFixed(2).replace(".", ",") + " €"} label="Panier moyen" />
        <MetricCard icon={<Package size={17} weight="fill" />} value={scopedPeriod.length} label="Articles" />
        <MetricCard icon={<Wallet size={17} weight="fill" />} value={ta.toFixed(0) + " €"} label="Dépense nette" />
        {avgTimeToSell !== null && (
          <MetricCard icon={<Timer size={17} weight="fill" />} value={avgTimeToSell + " j"} label="Délai de vente moy." iconColor="var(--navy)" />
        )}
        {avgStockAge !== null && (
          <MetricCard icon={<Hourglass size={17} weight="fill" />} value={avgStockAge + " j"} label="Âge moyen du stock" iconColor="var(--amber)" />
        )}
      </div>

      <ActivityChart items={scoped} />

      {/* Répartition par source */}
      {bySource.length > 0 && (
        <div className="section-card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span className="psection-label">Répartition · source</span>
            <div style={{ display: "flex", gap: 5 }}>
              <button
                className={"btn btn-xs" + (breakdownMetric === "ca" ? " btn-dark" : " btn-ghost")}
                onClick={() => setBreakdownMetric("ca")}
              >CA</button>
              <button
                className={"btn btn-xs" + (breakdownMetric === "count" ? " btn-dark" : " btn-ghost")}
                onClick={() => setBreakdownMetric("count")}
              >Nb articles</button>
            </div>
          </div>
          {bySource.map((s) => (
            <div key={s.nom} className="bar-row">
              <div className="bar-label">{s.nom}</div>
              <div className="bar-track">
                <div className="bar-fill bar-fill-coral" style={{ width: `${(s[breakdownMetric] / maxBreakdown) * 100}%` }} />
              </div>
              <div className="bar-value">{breakdownMetric === "ca" ? s.ca.toFixed(0) + " €" : s.count}</div>
            </div>
          ))}
        </div>
      )}

      {/* Panier moyen par tag */}
      {byTag.length > 0 && (
        <div className="section-card" style={{ marginBottom: 14 }}>
          <div style={{ marginBottom: 12 }}>
            <span className="psection-label">Panier moyen · tag</span>
          </div>
          {byTag.map((t) => (
            <div key={t.nom} className="bar-row">
              <div className="bar-label">{t.nom}</div>
              <div className="bar-track">
                <div className="bar-fill bar-fill-navy" style={{ width: `${(t.panier / maxPanierTag) * 100}%` }} />
              </div>
              <div className="bar-value">{t.panier.toFixed(2).replace(".", ",")} €</div>
            </div>
          ))}
        </div>
      )}

      {/* Calibration prix */}
      {(avgEcartPct !== null || avgVentePct !== null) && (
        <div className="section-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <TrendUp size={16} weight="fill" color="var(--coral)" />
            <span className="psection-label">Calibration prix</span>
          </div>
          {avgEcartPct !== null && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>Prix listé vs reco IA</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{withReco.length} articles</div>
              </div>
              <span style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800, fontSize: 16,
                color: avgEcartPct > 0 ? "var(--green)" : avgEcartPct >= -10 ? "var(--ink)" : "var(--coral)",
              }}>
                {avgEcartPct >= 0 ? "+" : ""}{avgEcartPct}%
              </span>
            </div>
          )}
          {avgVentePct !== null && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>Prix vente vs prix listé</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{venduWithPrix.length} ventes</div>
              </div>
              <span style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 800, fontSize: 16,
                color: avgVentePct > 0 ? "var(--green)" : avgVentePct >= -10 ? "var(--ink)" : "var(--coral)",
              }}>
                {avgVentePct >= 0 ? "+" : ""}{avgVentePct}%
              </span>
            </div>
          )}
          <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
            Ces écarts nourrissent l'IA pour affiner ses suggestions de prix au fil du temps.
          </p>
        </div>
      )}
    </div>
  );
}
