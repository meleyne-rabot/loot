import { ArrowsClockwise, TreasureChest, Sparkle } from "@phosphor-icons/react";

// Glyphe seul — composé de 3 icônes Phosphor superposées (source de vérité du design system)
export function LootIcon({ size = 52, variant = "coral", style }) {
  const bg      = variant === "dark"  ? "#1C1B3A" : variant === "light" ? "#FFF0F2" : "#F03C64";
  const main    = variant === "light" ? "#F03C64" : "#FFFFFF";
  const bgAlpha = variant === "dark"  ? "rgba(255,255,255,.14)" : variant === "light" ? "rgba(240,60,100,.16)" : "rgba(255,255,255,.26)";
  const spark   = variant === "dark"  ? "#4FD48A" : variant === "light" ? "#2FA96A" : "#FFFFFF";
  const rx      = Math.round(size * 0.25);

  return (
    <span style={{
      position: "relative", width: size, height: size, borderRadius: rx,
      background: bg, display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, overflow: "hidden", ...style,
    }}>
      <ArrowsClockwise size={size * 0.77} color={bgAlpha} style={{ position: "absolute" }} />
      <TreasureChest size={size * 0.44} weight="fill" color={main} style={{ position: "relative", zIndex: 1 }} />
      <Sparkle size={size * 0.175} weight="fill" color={spark}
        style={{ position: "absolute", top: size * 0.14, right: size * 0.14, zIndex: 2 }} />
    </span>
  );
}

// Mini glyphe inline pour le header (30×30, radius 9px, ombre)
export function LootGlyph({ size = 30, style }) {
  return (
    <span style={{
      position: "relative", width: size, height: size, borderRadius: Math.round(size * 0.3),
      background: "#F03C64", display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, overflow: "hidden", boxShadow: "0 2px 6px rgba(240,60,100,.28)", ...style,
    }}>
      <ArrowsClockwise size={size * 0.83} color="rgba(255,255,255,.30)" style={{ position: "absolute" }} />
      <TreasureChest size={size * 0.50} weight="fill" color="#FFFFFF" style={{ position: "relative", zIndex: 1 }} />
      <Sparkle size={size * 0.27} weight="fill" color="#FFFFFF"
        style={{ position: "absolute", top: size * 0.13, right: size * 0.13, zIndex: 2 }} />
    </span>
  );
}

// Lockup horizontal — glyphe + wordmark + tagline (pour About/onboarding)
export function LootLockup({ height = 52, style }) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 10, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <LootIcon size={height} variant="coral" />
        <span style={{
          fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
          fontSize: Math.round(height * 0.76), letterSpacing: "-.02em", color: "#1C1B3A", lineHeight: 1,
        }}>loot</span>
      </div>
      <span style={{
        fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, fontSize: 12,
        letterSpacing: ".14em", color: "#1C1B3A", textTransform: "uppercase",
      }}>
        Une photo, <span style={{ color: "#F03C64" }}>on écrit</span>, tu vends.
      </span>
    </div>
  );
}
