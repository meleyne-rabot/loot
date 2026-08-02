import { useEffect, useRef, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useToast } from "./context/ToastContext";
import { listItems, createItem, updateItem, deleteItem } from "./lib/items";
import { GenerateurTab } from "./tabs/GenerateurTab";
import { InventaireTab } from "./tabs/InventaireTab";
import { DetailArticleScreen } from "./tabs/DetailArticleScreen";
import { StatsTab } from "./tabs/StatsTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { MallesTab } from "./tabs/MallesTab";
import {
  Package, ChartBar, GearSix, Sparkle, TreasureChest,
  UserCircle, Bell, CreditCard, BookOpenText, Question, Lifebuoy, SignOut, CrownSimple, X,
} from "@phosphor-icons/react";
import { LootGlyph, LootIcon } from "./components/LootLockup";
import { AboutSection } from "./components/AboutSection";
import { FaqSection } from "./components/FaqSection";
import { InfoBubble } from "./components/InfoBubble";
import { Onboarding, hasSeenOnboarding, markOnboardingSeen } from "./tabs/Onboarding";

const GEN_STEPS = [
  { label: "Photos", desc: "Prends tes photos et ajoute le contexte — source, prix d'achat, détails que l'objectif ne voit pas." },
  { label: "Annonce", desc: "Revois le titre et la description générés. Affine avec le chat si besoin." },
  { label: "Publier", desc: "Copie-colle sur Vinted ou LBC, fixe ton prix, puis sauvegarde dans l'inventaire." },
];
const PHASE_INDEX = { photos: 0, review: 1, publish: 2 };

function GenStepBar({ phase }) {
  const current = PHASE_INDEX[phase] ?? 0;
  const step = GEN_STEPS[current];
  return (
    <div className="gen-step-bar" style={{ padding: "12px 18px 14px", userSelect: "none" }}>
      <div className="gen-step-axis">
        {GEN_STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const cls = done ? "done" : active ? "active" : "future";
          return (
            <div key={s.label} style={{ display: "flex", alignItems: "center", flex: i < GEN_STEPS.length - 1 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div className={`gen-step-circle ${cls}`}>{done ? "✓" : i + 1}</div>
                <span className={`gen-step-label ${cls}`}>{s.label}</span>
              </div>
              {i < GEN_STEPS.length - 1 && (
                <div className={`gen-step-line${done ? " done" : ""}`} style={{ marginBottom: 18 }} />
              )}
            </div>
          );
        })}
      </div>
      <p className="gen-step-desc">
        <strong>Étape {current + 1} — {step.label} :</strong> {step.desc}
      </p>
    </div>
  );
}

const GENERER_META = {
  key: "generer", title: "Nouvelle annonce",
  subtitle: "La meilleure annonce, c'est celle que tu n'écris pas toi-même :-)",
  hint: "Ajoute une photo et quelques infos (marque, taille, état…) — Loot génère le titre, la description et un prix suggéré. Pour Vinted, des hashtags sont ajoutés automatiquement pour améliorer ta visibilité ; tu peux désactiver ça dans Paramètres. Une fois l'annonce générée, ajoute-la à ton inventaire pour garder un suivi de ton stock.",
};

const NAV_TABS = [
  {
    key: "inventaire", Icon: Package, label: "Inventaire", title: "Mon inventaire",
    subtitle: "Ton stock, enfin rangé.",
    hint: "Retrouve ici tout ce que tu as mis en vente. Marque un article comme vendu directement depuis cette vue, et filtre par Tag, Malle, Statut ou Source pour visualiser précisément ton stock — bien plus fin que ce que proposent les plateformes de revente. Ce suivi alimente directement tes Stats.",
  },
  {
    key: "stats", Icon: ChartBar, label: "Stats", title: "Statistiques",
    subtitle: "Gère ton placard comme un vrai business.",
    hint: "Les stats des plateformes de revente restent basiques. Ici, tu vois vraiment ce qui rapporte : quelles sources sont les plus rentables, ton taux de rotation, combien d'articles vendus, et si tu revends des objets achetés, ta marge réelle. De quoi suivre ton activité comme un vrai business.",
  },
  {
    key: "malles", Icon: TreasureChest, label: "Malles", title: "Mes Malles",
    subtitle: "Tu vends. Loot compte. Personne ne râle.",
    hint: "La Malle te permet de vendre pour tes proches sans perdre le fil de qui doit quoi à qui. Crée une Malle par personne — tes enfants, ta mère, ton mec, ta pote — et suis en un coup d'œil combien tu leur dois. Chaque vente est tracée, chaque reversement calculé automatiquement.",
  },
  {
    key: "settings", Icon: GearSix, label: "Paramètres", title: "Paramètres",
    subtitle: "Loot s'adapte à ton style de vente.",
    hint: "Ici tu règles tout : ton style d'annonce, tes objectifs de prix, tes sources, tes Malles. On ajoute régulièrement de nouveaux réglages — reviens de temps en temps voir les nouveautés.",
  },
];

function FullPageModal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60, background: "var(--canvas)",
      display: "flex", flexDirection: "column", animation: "fadeUp .2s ease both",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
        borderBottom: "1px solid #EDE8DF", background: "var(--surface)", flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: "none", border: "none", cursor: "pointer", padding: 6,
          display: "flex", alignItems: "center", color: "var(--ink)", borderRadius: 10,
        }}>
          <X size={20} />
        </button>
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>
          {title}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px" }}>
        {children}
      </div>
    </div>
  );
}

function AboutModal({ onClose }) {
  return <FullPageModal title="Qui sommes-nous ?" onClose={onClose}><AboutSection /></FullPageModal>;
}

function FaqModal({ onClose }) {
  return (
    <FullPageModal title="Questions fréquentes" onClose={onClose}>
      <FaqSection onContact={() => window.open("mailto:meleyne@gmail.com")} />
    </FullPageModal>
  );
}

// ── Menu profil (tap avatar) ──────────────────────────────
function ProfileDrawer({ user, onClose, onOpenAbout, onOpenFaq, onOpenOnboarding }) {
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const name   = user?.user_metadata?.full_name || user?.email || "";
  const avatar = user?.user_metadata?.avatar_url;
  const initial = name[0]?.toUpperCase() || "?";

  const soon = () => showToast("🚀 Bientôt disponible !");

  const ItemRow = ({ icon: Icon, label, color = "#1C1B3A", onClick: handleClick }) => (
    <button onClick={handleClick || soon} style={{
      width: "100%", background: "none", border: "none", cursor: "pointer",
      padding: "10px 12px", display: "flex", alignItems: "center", gap: 12,
      fontSize: 13.5, fontWeight: 600, color, fontFamily: "inherit",
      borderRadius: 12, textAlign: "left", transition: "background .15s",
    }}
      onMouseEnter={(e) => e.currentTarget.style.background = "#F6F2EC"}
      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
    >
      <Icon size={19} color="#5B5975" />
      {label}
    </button>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(28,27,58,.34)", backdropFilter: "blur(1.5px)" }} />
      <div style={{
        position: "fixed", top: 60, right: 14, zIndex: 41, width: 270,
        background: "#fff", borderRadius: 20,
        boxShadow: "0 18px 50px rgba(28,27,58,.30)",
        overflow: "hidden", animation: "fadeUp .18s ease both",
      }}>
        {/* En-tête navy */}
        <div style={{ padding: "18px 18px 16px", display: "flex", alignItems: "center", gap: 12, background: "#1C1B3A" }}>
          {avatar
            ? <img src={avatar} alt="" style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            : <span style={{
                width: 46, height: 46, borderRadius: "50%", background: "#F03C64",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, color: "#fff",
                flexShrink: 0,
              }}>{initial}</span>
          }
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 500, fontSize: 12, color: "#B7B5C8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
          </div>
        </div>

        {/* Plan */}
        <button onClick={soon} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "11px 16px", borderBottom: "1px solid #F0EBE3", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "inherit", fontWeight: 700, fontSize: 12, color: "#B0651B" }}>
            <CrownSimple size={15} color="#E0912F" weight="fill" />
            Loot Pro
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#8A879B" }}>Gérer</span>
        </button>

        {/* Groupe 1 : compte */}
        <div style={{ padding: "6px" }}>
          <ItemRow icon={UserCircle} label="Mon compte" />
          <ItemRow icon={Bell} label="Notifications" />
        </div>
        <div style={{ height: 1, background: "#F0EBE3", margin: "0 12px" }} />

        {/* Groupe 2 : éditorial */}
        <div style={{ padding: "6px" }}>
          <ItemRow icon={Sparkle} label="Premiers pas" onClick={() => { onClose(); onOpenOnboarding(); }} />
          <ItemRow icon={BookOpenText} label="Qui sommes-nous ?" onClick={() => { onClose(); onOpenAbout(); }} />
          <ItemRow icon={Question} label="FAQ" onClick={() => { onClose(); onOpenFaq(); }} />
          <ItemRow icon={Lifebuoy} label="Nous contacter" onClick={() => window.open("mailto:meleyne@gmail.com")} />
        </div>
        <div style={{ height: 1, background: "#F0EBE3", margin: "0 12px" }} />

        {/* Déconnexion */}
        <div style={{ padding: "6px" }}>
          <button onClick={signOut} style={{
            width: "100%", background: "none", border: "none", cursor: "pointer",
            padding: "10px 12px", display: "flex", alignItems: "center", gap: 12,
            fontSize: 13.5, fontWeight: 700, color: "#D6335B", fontFamily: "inherit",
            borderRadius: 12, textAlign: "left", transition: "background .15s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#FFF0F2"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            <SignOut size={19} color="#D6335B" />
            Déconnexion
          </button>
        </div>
      </div>
    </>
  );
}

const ITEMS_CACHE_KEY = "loot:items-cache";

export default function App() {
  const { user } = useAuth();
  const [tab, setTab]           = useState("generer");
  const [genPhase, setGenPhase] = useState("photos");
  const genGoBackRef            = useRef(null);
  const [items, setItems]       = useState([]);
  const [ready, setReady]       = useState(false);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [aboutOpen,      setAboutOpen]      = useState(false);
  const [faqOpen,        setFaqOpen]        = useState(false);
  const [detailItem,     setDetailItem]     = useState(null);
  const [onboardingOpen, setOnboardingOpen] = useState(() => !hasSeenOnboarding());
  const [onboardingReplay, setOnboardingReplay] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      const cached = localStorage.getItem(ITEMS_CACHE_KEY + ":" + user.id);
      if (cached) { setItems(JSON.parse(cached)); setReady(true); }
    } catch { /* cache corrompu */ }
    listItems(user.id).then((data) => {
      setItems(data); setReady(true);
      try { localStorage.setItem(ITEMS_CACHE_KEY + ":" + user.id, JSON.stringify(data)); } catch { /* quota */ }
    });
  }, [user]);

  const add = async (item, sourceType, { stayOnPage } = {}) => {
    const created = await createItem(item, user.id, sourceType);
    setItems((prev) => [created, ...prev]);
    if (!stayOnPage) setTab("inventaire");
  };
  const upd = async (u, sourceType) => {
    const updated = await updateItem(u, user.id, sourceType);
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };
  const del = async (id) => {
    await deleteItem(id, user.id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };
  const itemPatched = (updated) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  if (!ready) {
    return (
      <div className="splash">
        <LootIcon size={96} variant="coral" />
        <p>Chargement…</p>
      </div>
    );
  }

  const current = tab === "generer" ? GENERER_META : NAV_TABS.find((t) => t.key === tab);
  const fabBg = tab === "generer" ? "#1C1B3A" : "#F03C64";
  const fabShadow = tab === "generer"
    ? "0 10px 24px rgba(28,27,58,.40)"
    : "0 10px 24px rgba(240,60,100,.44)";

  return (
    <div className="app">
      <header className="header">
        {/* Mini-lockup : glyphe + wordmark — toujours à gauche */}
        <button className="header-lockup" onClick={() => setTab("generer")}>
          <LootGlyph size={30} />
          <span className="header-wordmark">loot</span>
        </button>

        <button className="header-avatar" onClick={() => setProfileOpen((v) => !v)} title="Mon compte">
          {user?.user_metadata?.avatar_url
            ? <img src={user.user_metadata.avatar_url} alt="avatar" />
            : <span style={{
                fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
                fontSize: 14, color: "#fff",
              }}>
                {(user?.user_metadata?.full_name || user?.email || "?")[0].toUpperCase()}
              </span>
          }
        </button>
      </header>

      {profileOpen && <ProfileDrawer user={user} onClose={() => setProfileOpen(false)} onOpenAbout={() => setAboutOpen(true)} onOpenFaq={() => setFaqOpen(true)} onOpenOnboarding={() => { setOnboardingReplay(true); setOnboardingOpen(true); }} />}
      {aboutOpen   && <AboutModal onClose={() => setAboutOpen(false)} />}
      {faqOpen     && <FaqModal   onClose={() => setFaqOpen(false)} />}

      <div className="page-head">
        <h1 className="page-title">
          {current?.title}
          {current?.hint && <span style={{ marginLeft: 7 }}><InfoBubble align="center">{current.hint}</InfoBubble></span>}
        </h1>
        <p className="page-subtitle">{current?.subtitle}</p>
      </div>

      {tab === "generer"    && <GenerateurTab onSave={add} onPhaseChange={setGenPhase} goBackRef={genGoBackRef} />}
      {tab === "inventaire" && <InventaireTab items={items} onUpdate={upd} onDelete={del} onItemPatched={itemPatched} onGoToGenerer={() => setTab("generer")} onOpenDetail={setDetailItem} />}
      {tab === "stats"      && <StatsTab items={items} />}
      {tab === "malles"     && <MallesTab />}
      {tab === "settings"   && <SettingsTab />}


      {detailItem && (
        <DetailArticleScreen
          item={detailItem}
          onBack={() => setDetailItem(null)}
          onSave={async (updated, sourceType) => {
            await upd(updated, sourceType);
            setDetailItem(null);
          }}
          onDelete={async (id) => {
            await del(id);
            setDetailItem(null);
          }}
        />
      )}

      {onboardingOpen && (
        <Onboarding
          replay={onboardingReplay}
          onDone={() => { setOnboardingOpen(false); setOnboardingReplay(false); }}
        />
      )}

      {/* ── BottomNav flottante + FAB ── */}
      <div className="bottom-nav-wrap">
        <nav className="bottom-nav">
          <div className="bottom-nav-left">
            {NAV_TABS.slice(0, 2).map((t) => (
              <button key={t.key} className={"bottom-nav-item" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>
                <t.Icon size={22} weight={tab === t.key ? "fill" : "regular"} />
                <span className="bottom-nav-label">
                  {t.key === "inventaire" ? `Inv. (${items.length})` : t.label}
                </span>
              </button>
            ))}
          </div>
          <div className="bottom-nav-gap" />
          <div className="bottom-nav-right">
            {NAV_TABS.slice(2).map((t) => (
              <button key={t.key} className={"bottom-nav-item" + (tab === t.key ? " active" : "")} onClick={() => setTab(t.key)}>
                <t.Icon size={22} weight={tab === t.key ? "fill" : "regular"} />
                <span className="bottom-nav-label">{t.label}</span>
              </button>
            ))}
          </div>
        </nav>
        <button
          className="fab"
          style={{ background: fabBg, boxShadow: fabShadow }}
          onClick={() => setTab("generer")}
        >
          <Sparkle size={22} weight="fill" color="#fff" />
          <span className="fab-label">Générer</span>
        </button>
      </div>
    </div>
  );
}
