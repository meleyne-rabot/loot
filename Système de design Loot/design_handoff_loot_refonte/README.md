# Handoff : Refonte Loot — Nav, système de composants, écrans & logo

## Overview
Refonte visuelle de **Loot** (app web React + Vite pour vendeurs de seconde main). Ce paquet fige le **nouveau système visuel** et l'applique à la navigation principale et à deux écrans clés. Objectif : cohérence entre tous les écrans, lisibilité et confiance — en particulier sur les écrans financiers (Stats, commissions, reversements).

Direction retenue par la fondatrice :
- **Système visuel = « Crème & Corail » (option 1a)** — base neutre chaude, corail en accent unique.
- **Navigation = barre flottante avec FAB central « Générer »** (repris de l'option 1c).
- **Logo = lockup 3a** (glyphe + mot), avec le **glyphe seul comme icône d'app**.

## About the Design Files
Les fichiers de ce bundle sont des **références de design réalisées en HTML** (`Loot Système.dc.html`) — des prototypes qui montrent l'intention visuelle et le comportement, **pas du code de production à copier tel quel**. Le fichier utilise un petit runtime maison (`support.js`) : ouvre-le dans un navigateur pour visualiser, mais **ne le porte pas** dans l'app.

La tâche est de **recréer ces designs dans le codebase existant** (React + Vite) en suivant ses patterns établis (composants, structure de dossiers, gestion d'état). Les valeurs exactes (couleurs, typo, espacements, rayons, ombres) sont documentées ci-dessous et doivent être respectées **au pixel** (fidélité haute).

## Fidelity
**High-fidelity (hifi).** Couleurs, typographie, espacements et interactions sont définitifs. Recréer l'UI au pixel avec les libs du codebase. Idéalement, extraire les Design Tokens ci-dessous dans le thème/variables CSS de l'app, puis construire les composants réutilisables (Button, Card, Badge, BottomNav) avant de monter les écrans.

---

## Design Tokens

### Couleurs
| Rôle | Hex | Usage |
|---|---|---|
| Canvas / fond | `#F6F2EC` | Fond d'écran (crème chaud) |
| Surface | `#FFFFFF` | Cards, inputs, nav |
| Ink (texte principal) | `#1C1B3A` | Titres, chiffres, texte fort, cards « financières » foncées |
| Muted 1 | `#6B6980` | Paragraphes |
| Muted 2 | `#8A879B` | Labels de section, icônes inactives |
| Muted 3 | `#9C99AB` | Texte secondaire, onglets inactifs |
| Bordure input | `#E3DCD0` | Bordure 1.5px des champs/dropdowns/pills |
| Divider | `#EFE9E0` / `#F0EBE3` | Filets internes de cards, fonds de barres |
| **Accent corail** | `#F03C64` | Action primaire, accents, barres CA |
| Corail pressé / sur fond clair | `#C22A50` | Texte corail sur tint clair |
| Corail tint | `#FFF0F2` | Fonds très légers (zone photo, chips) |
| Vert succès | `#2FA96A` | Marge/gain, calibration positive |
| Vert sur foncé | `#4FD48A` | ROI/positif sur card navy |
| Vert tint | `#E4F4EB` / `#DDF1E6` | Fond badge « Vendu » |
| Ambre (dot « En vente ») | `#E0912F` | Point ; tint `#FBEAD1`, texte `#B0651B` |
| Violet (« À reverser ») | `#A56BE0` | Point ; tint `#F0E7FA`, texte `#8B4FC9` |
| Rouge négatif | `#E0453F` | Calibration négative |
| Vinted | texte `#0B7A73` / fond `#DEF3F1` | Badge plateforme |
| LeBonCoin | texte `#C6551E` / fond `#FDE8DA` (orange marque `#F56B2A`) | Badge plateforme |

### Typographie
Deux familles (Google Fonts) :
- **Bricolage Grotesque** — titres, chiffres, wordmark. Poids 700–800, `letter-spacing: -.01em à -.02em`.
- **Hanken Grotesk** — texte courant, labels, UI. Poids 400–700.

| Élément | Font / poids / taille |
|---|---|
| Titre d'écran | Bricolage 700, 25px, -.02em |
| Chiffre hero (marge) | Bricolage 800, 36px, -.02em |
| Chiffre métrique | Bricolage 800, 22–24px, -.01em |
| Prix listé (card) | Bricolage 800, 18px |
| Label de section | Hanken 700, 11px, UPPERCASE, +.06em, `#8A879B` |
| Paragraphe | Hanken 400, 13–14px, line-height 1.5 |
| Badge / valeur barre | Hanken 700, 11–12px |
| Label onglet nav | Hanken 600, 10.5px |

### Rayons
Cards 16–22px · inputs & boutons 14px (16px pour CTA pleine largeur) · pills/badges 999px · barre nav 22px · FAB 50% · icône d'app 20–24px.

### Ombres
| Rôle | Valeur |
|---|---|
| Card | `0 2px 10px rgba(28,27,58,.05)` |
| Card élevée / icône app | `0 4px 14px rgba(28,27,58,.08)` |
| Bouton corail | `0 6px 16px rgba(240,60,100,.28)` |
| CTA / FAB | `0 8px 20px rgba(240,60,100,.30)` → FAB `0 10px 24px rgba(240,60,100,.44)` |
| Barre nav | `0 8px 26px rgba(28,27,58,.13)` |

### Espacement
Base 8px. Gaps courants : 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 22 px. Padding d'écran : `20px 18px` (haut/côtés), `128px` en bas pour dégager la nav flottante.

### Icônes
**Phosphor Icons** (`@phosphor-icons/web`), poids `regular` + `fill`. Mapping :
- Générer → `sparkle` (fill) · Inventaire → `package` · Stats → `chart-bar` · Réglages → `gear-six`
- Source → `map-pin` · Régénérer → `arrow-clockwise` · Marge/tendance → `trend-up`
- CA → `currency-eur` · Vendus → `check-circle` · Taux → `lightning` · Panier → `shopping-bag` · Dépense → `wallet`
- Compte → `user` · Aide → `question` · Dropdown → `caret-up-down` / `caret-down` · Photo → `camera` · Galerie → `image`
- Logo : `treasure-chest` (malle) + `arrows-clockwise` (boucle) + `sparkle`

**Emojis signature conservés (2 seulement)** : ✨ (génération IA) et 🧳 (Malle). Tout le reste passe en icônes Phosphor.

---

## Composants

### BottomNav (barre flottante + FAB central)
- Barre : positionnée `left:14 right:14 bottom:16`, hauteur 64px, radius 22px, fond blanc, ombre nav. **Flottante** (détachée des bords).
- 3 onglets plats : **Inventaire** & **Stats** dans la moitié gauche (`justify-content: space-around`), **Réglages** dans la moitié droite, séparés par un espace central de 58px.
- **FAB « Générer »** : cercle 62px, corail, centré (`left:50%`, `translateX(-50%)`, `bottom:40px`), bordure 4px couleur du fond (`#F6F2EC`), ombre FAB. Contenu : icône `sparkle` (fill, blanc, 22px) + label « Générer » (Hanken 700, 8px, blanc).
- **État actif** : icône `fill` + couleur `#F03C64`, label corail. **Inactif** : icône `regular` + `#9C99AB`.
- *Note* : asymétrie assumée (2 onglets à gauche, 1 à droite) car il n'y a que 3 sections hors Générer. Rééquilibrable si une 4e section arrive.

### Button — primaire
Fond `#F03C64`, texte blanc Hanken 700 14–15px, radius 14–16px, padding 13–15px, ombre bouton corail. Icône optionnelle en tête (ex. `sparkle` fill). Pleine largeur pour les CTA d'écran (radius 16, padding 15).

### Button — secondaire
Fond blanc, bordure 1.5px `#E3DCD0`, texte `#1C1B3A`, radius 14px. Variante « rose » : fond `#FFF0F2`, bordure `#F0B6C4`, texte `#C22A50` (utilisée pour « Régénérer », « Galerie »).

### Card inventaire
Fond blanc, radius 18px, padding 12px, ombre card. Flex horizontal, gap 12px.
- **Vignette** 70×70px, radius 13px (placeholder rayé en attendant la vraie photo).
- **Titre** Bricolage 700 14px.
- **Ligne méta** (gap 6px, wrap) : badge statut + badge plateforme + source (`map-pin` + nom, muted).
- **Ligne argent** (séparée par un filet `#F0EBE3`) : **prix listé dominant** (`14 €`, Bricolage 800 18px) + « listé » muted, puis à droite `acheté 1 € · +13 €` avec le gain en vert `#2FA96A`. → Fini les 4 puces empilées.

### Badges de statut (pill + point 6px)
| Statut | Texte | Fond | Point |
|---|---|---|---|
| En vente | `#B0651B` | `#FBEAD1` | `#E0912F` |
| Vendu | `#1E8A57` | `#DDF1E6` | `#2FA96A` |
| En attente | `#5B5975` | `#ECEAF0` | `#9C99AB` |
| À reverser | `#8B4FC9` | `#F0E7FA` | `#A56BE0` |

Badges plateforme (sans point) : **Vinted** `#0B7A73` sur `#DEF3F1` · **LeBonCoin** `#C6551E` sur `#FDE8DA`.

### Metric card (Stats)
Fond blanc, radius 16px, padding 13×15px, ombre card. Icône Phosphor 17px corail (ou verte pour « Vendus »), chiffre Bricolage 800 22px, label Hanken 600 11.5px muted. Grille 2 colonnes, gap 10px.

### Barre de répartition
Ligne flex : label 92px (ellipsis) + track flex (hauteur 9px, fond `#F0EBE3`, radius 9px) + remplissage (radius 9px) + valeur Bricolage 800 12px alignée à droite. **Remplissage corail `#F03C64` pour les montants (CA)** ; **navy `#1C1B3A` pour le panier par tag** (différenciation).

### Filter pill / dropdown
Fond blanc, bordure 1.5px `#E3DCD0`, radius 999px (pills) ou 14px (dropdowns pleine largeur), texte Hanken 600, `caret-down` / `caret-up-down` en `#8A879B`.

### Stepper (flow Générer)
Cercle 34px : **actif** corail plein + label corail + ombre ; **inactif** blanc, bordure 2px `#E3DCD0`, chiffre `#B7AE9E`. Ligne de liaison 2px `#E3DCD0`.

---

## Écrans / Views

### 1. Générer — Étape 1 · Photos ( id `2a` dans le proto)
**But** : l'utilisateur ajoute photos + contexte (source, prix d'achat, détails) avant génération IA. Première des 3 étapes (Photos → Annonce → Publier).
**Layout** (colonne, largeur mobile ~390px, padding `20px 18px 128px`) :
1. **Header** : wordmark « loot » + avatar rond (icône `user`).
2. **Stepper 3 étapes** — Photos actif.
3. Phrase d'intro : « **Prends tes photos** et ajoute le contexte — source, prix d'achat, détails que l'objectif ne voit pas. »
4. **Toggle segmenté** « Un article » (actif, fond navy `#1C1B3A`, texte blanc) / « Multi-ajout » (inactif) + bulle d'aide `?`.
5. **Malle** : label « 🧳 MALLE » + dropdown « — Mes articles perso — ».
6. **Zone photo** : encadré pointillé (`2px dashed #DBC9CF`, fond `#FBF3F5`, radius 20px), icône `camera` corail, boutons **Galerie** (secondaire rose) + **Caméra** (primaire corail), légende « Jusqu'à 5 photos par article ».
7. **Infos complémentaires (optionnel)** : textarea, placeholder « Marque, taille, année, défauts… tout ce que la photo ne montre pas ✨ ».
8. **Prix d'achat €** : champ avec préfixe €, placeholder « ex : 2 ».
9. **Source** : dropdown « Mon placard ».
10. **CTA pleine largeur** « Continuer → » (primaire) → passe à l'étape 2.
11. **BottomNav** avec FAB « Générer » en état actif.

### 2. Stats — vue financière (id `2b` dans le proto)
**But** : montrer ce qui rapporte vraiment, source par source. Écran de confiance financière.
**Layout** :
1. **Header** identique.
2. Titre « Statistiques » + sous-titre « Vois enfin ce qui te rapporte vraiment, source par source. »
3. **Filtres** (pills) : « 🧳 Toutes », « Toutes sources », « Tags ».
4. **Card hero navy** (`#1C1B3A`, radius 22px) : label « MARGE NETTE » + chip ROI vert « ROI 427% », chiffre `+1 080 €` (Bricolage 800 36px), sous-ligne « sur 1 227 € de ventes · 253 € dépensés ».
5. **Grille 6 métriques** (2 col) : CA total 1 227 €, Vendus 127, Taux de vente 45 %, Panier moyen 10 €, Articles 280, Dépense nette 253 €.
6. **Card « Répartition · source »** : toggle CA/Nb (CA actif, navy), barres corail (Emmaus Champigny 696 €, Rue Blanche 232 €, Vide Grenier 75 €, Rue 17ème 63 €, Sans source 43 €…).
7. **Card « Panier moyen · tag »** : barres navy (Vintage 14 €, Déco 12 €, Accessoires 10 €, Jouets 9 €, Livres 6 €…).
8. **Card « Calibration prix »** : « Prix listé vs reco IA » (19 articles) **−28 %** en vert ; « Prix vente vs prix listé » (127 ventes) **−4 %** en rouge ; note « Ces écarts nourrissent l'IA pour affiner ses suggestions de prix au fil du temps. »
9. **BottomNav** avec onglet **Stats** actif.

> Les valeurs chiffrées sont issues du proto — à remplacer par les vraies données de l'app.

---

## Logo (retenu : 3a + glyphe seul en icône d'app)

### Glyphe (icône d'app — la pièce maîtresse)
Carré arrondi (radius 20–24px). Trois calques centrés :
1. **Boucle** `arrows-clockwise` en fond, grande (~85% de la taille), faible opacité (blanc 26% sur corail ; ou corail 16% sur clair). = idée « seconde main / circularité ».
2. **Malle** `treasure-chest` (fill) au centre, bien lisible. = « butin ».
3. **Sparkle** `sparkle` (fill) en haut à droite, petit. = « IA ».

Déclinaisons d'icône d'app :
- **Fond clair** : carré `#FFF0F2`, malle + boucle en corail `#F03C64`, sparkle vert `#2FA96A`.
- **Fond foncé** : carré `#1C1B3A`, malle corail, boucle blanche 14%, sparkle vert `#4FD48A`.
- **Fond corail** (variante pleine, cf. lockup 3a) : carré `#F03C64`, malle + boucle + sparkle blancs.

### Lockup horizontal (3a)
Glyphe (74px, fond corail, contenu blanc) **+** wordmark « loot » (Bricolage 800, `#1C1B3A`, -.02em, ~56px) alignés horizontalement, gap 16px.
**Baseline** (tagline) : « UNE PHOTO, **ON ÉCRIT**, TU VENDS. » en Hanken 700, 12px, UPPERCASE, `letter-spacing: .14em`, « ON ÉCRIT » en corail.

### Règles
- Le **glyphe seul** doit rester lisible en petit (favicon 32px, avatar) — la malle prime, la boucle est un support.
- Ne pas déformer le wordmark ; conserver Bricolage Grotesque.
- Palette logo = palette de marque (navy / corail / vert / touches sparkle), pas de nouvelles couleurs.

---

## Interactions & comportement
- **BottomNav** : tap sur un onglet → change de section (route). FAB « Générer » → ouvre le flow Générer (étape 1). Transition douce sur l'état actif (couleur + swap regular↔fill).
- **Flow Générer** : stepper cliquable/verrouillé selon avancement ; « Continuer » valide l'étape et avance. Champs optionnels clairement marqués « (optionnel) ».
- **Stats** : filtres (Malle / Source / Tags) et toggle CA/Nb re-calculent les cards, la grille et les barres. Barres animables (largeur 0→valeur, ~400ms ease-out).
- **États** : hover/press léger sur boutons et pills (assombrir/ombre) ; focus visible sur inputs (bordure corail). Prévoir loading (skeleton sur cards) et empty states (ex. « À reverser (0) »).

## State management
- `activeTab` (nav), `generateStep` (1–3), sélection Malle, filtres Stats (`malle`, `source`, `tags`, `metricMode: CA|Nb`).
- Données : liste d'articles (statut, plateforme, source, tags, prix achat/IA/listé/vente), agrégats Stats (marge, CA, ROI, taux, panier, répartitions), config Malles (nom, commission %).
- Réutiliser la couche de données/fetch existante de l'app ; ces écrans sont surtout de la présentation.

## Assets
- **Icônes** : Phosphor Icons (`@phosphor-icons/web`, poids regular + fill) — à installer via le gestionnaire de paquets du projet plutôt qu'en CDN.
- **Polices** : Bricolage Grotesque + Hanken Grotesk (Google Fonts) — self-host de préférence.
- **Logo** : à produire en SVG définitif à partir de la spec 3a (le proto compose des glyphes Phosphor ; la version finale devrait être un SVG dédié, dessiné par un·e designer sur cette base).
- **Photos produits** : fournies par l'utilisateur (placeholders rayés dans le proto).
- Logo actuel de référence : `uploads/image-1782593092881.webp` et `uploads/WhatsApp Image 2026-06-27 at 22.00.34 (1).jpeg`.

## Files
- `Loot Système.dc.html` — prototype de référence (ouvrir dans un navigateur). Contient, du haut vers le bas : **Turn 3** (explorations de logo 3a–3d), **Turn 2** (écrans 2a Générer & 2b Stats — la cible), **Turn 1** (les 3 directions initiales 1a/1b/1c pour contexte). La direction retenue est **1a** pour le style + la **nav de 1c**.
- `support.js` — runtime du prototype (nécessaire à l'affichage ; **ne pas** porter dans l'app).
