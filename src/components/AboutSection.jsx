import { LootLockup } from "./LootLockup";

export function AboutSection() {
  const C = {
    coral: "#F03C64", ink: "#1C1B3A", muted: "#6B6980",
  };
  const F = { title: "'Bricolage Grotesque', system-ui, sans-serif", body: "'Hanken Grotesk', system-ui, sans-serif" };

  const Section = ({ label, color, children }) => (
    <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px",
      boxShadow: "0 2px 10px rgba(28,27,58,.05)", marginBottom: 12 }}>
      <p style={{ font: `800 10.5px ${F.body}`, letterSpacing: ".08em",
        color, textTransform: "uppercase", margin: "0 0 8px" }}>{label}</p>
      {children}
    </div>
  );

  const P = ({ children }) => (
    <p style={{ font: `400 13px/1.65 ${F.body}`, color: C.ink, margin: 0 }}>{children}</p>
  );

  return (
    <div style={{ fontFamily: F.body }}>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "24px 0 22px" }}>
        <LootLockup height={48} style={{ marginBottom: 14 }} />
        <h2 style={{ font: `800 22px/1.2 ${F.title}`, letterSpacing: "-.02em",
          color: C.ink, margin: "0 0 8px" }}>Pourquoi Loot existe</h2>
        <p style={{ font: `400 13px/1.5 ${F.body}`, color: C.muted,
          maxWidth: 320, margin: "0 auto" }}>
          L'économie circulaire ne manque pas de bonne volonté. Elle manque de temps.
        </p>
      </div>

      <Section label="NOS CONSTATS" color={C.coral}>
        <P>1. Vinted et Leboncoin ont rendu la revente facile. Ce qu'elles n'ont jamais résolu, c'est le temps que ça prend quand même. Trouver les mots, décrire l'état, fixer le prix, écrire la description.</P>
        <br />
        <P>2. Tu vends les habits que ton fils a fait grandir de trois tailles, ceux de ton mec qui a la flemme, ceux de ton·ta copain·copine pas à l'aise avec les applis. Tu deviens le revendeur de tout le monde — sans jamais savoir combien tu dois reverser à qui.</P>
      </Section>

      <Section label="NOS RÉPONSES" color={C.ink}>
        <P>1. Tu configures une fois ton style, ta stratégie de prix, tes préférences — et Loot génère tes annonces. Tu n'as plus qu'à copier-coller.</P>
        <br />
        <P>2. Loot te donne une <strong>Malle</strong> par personne : chaque vente tracée, chaque reversement calculé, sans y penser.</P>
      </Section>

      <Section label="LA CONVICTION" color={C.coral}>
        <P>Chaque frein levé, c'est un vêtement de plus qui trouve une deuxième vie au lieu de dormir dans un placard ou finir à la poubelle. Et pour celles et ceux qui en ont fait un vrai savoir-faire, Loot suit aussi le stock comme un outil e-commerce — parce qu'une bonne organisation transforme une activité occasionnelle en revenu additionnel régulier.</P>
      </Section>

      <Section label="LA FONDATRICE" color={C.ink}>
        <P>Loot est né d'une power seller — moi — qui en avait marre d'écrire la même annonce pour la 400e fois. Ce n'est pas mon métier, c'est mon activité à côté du taf, mon argent de poche, ma passion pour la chine. Je voulais un outil pour moi. Je le construis pour vous.</P>
      </Section>

      <p style={{ font: `400 12px/1.5 ${F.body}`, color: C.muted,
        textAlign: "center", marginTop: 20, paddingBottom: 8 }}>
        Fait avec ❤️, en France, pour celles et ceux qui donnent une seconde vie à leurs affaires.
      </p>
    </div>
  );
}
