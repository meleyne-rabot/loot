# Code React — Flow Générer (refonte simple)

Composants prêts à coller dans l'app **Loot** (React + Vite). Ils remplacent l'ancien flow 3 étapes.

## Fichiers
- `loot-tokens.js` — couleurs, fonts, ombres (source de vérité partagée).
- `BottomNav.jsx` — barre de nav flottante + FAB central (Inventaire · Stats · [Générer] · Malles · Paramètres).
- `GenererFlow.jsx` — **le flow Générer complet** : un seul écran, deux états (`saisie` → `result`).
- `Parametres.jsx` — **écran Paramètres tout-en-un** (une seule page) : Génération IA (objectif, ton, hashtags, mentions fixes) + Sources + Tags.
- `Inventaire.jsx` — **écran Inventaire** : header sans flèche retour, recherche + bouton Filtres (badge), statuts en chips, cards à hiérarchie prix/marge revue, action rapide Marquer vendu / Marquer reversé.
- `DetailArticle.jsx` — **détail d'un article**, plein écran, onglets **Annonce** (blocs Copier titre/description + hashtags Vinted, régénérer, tags) / **Suivi & prix** (hero navy marge + reco IA, prix achat/listé/vente réel, statut, plateforme, source, malle, suppression). Champ « Note prix » supprimé.

## ⚠ Fix nav : pas de flèche retour sur les onglets
Les 5 écrans d'onglet (Inventaire, Stats, Générer, Malles, Paramètres) sont des **destinations racines** → **jamais de bouton retour** dans leur header (le header = logo + avatar seulement). Les 2 flèches « retour » qu'on voyait sur Paramètres étaient un doublon à supprimer. Un bouton retour n'apparaît que sur un **écran de détail poussé au-dessus** d'un onglet (ex. Détail d'article).

## Dépendances
```bash
npm i @phosphor-icons/react
```
Polices (dans `index.html`) :
```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700..800&family=Hanken+Grotesk:wght@400..700&display=swap" rel="stylesheet">
```

## ⚠ Fix du zoom / dimensionnement (le bug de la fenêtre qui se rescale)
La fenêtre se zoome parce qu'un écran a une **largeur fixe** qui déborde. Deux corrections :
1. **Viewport** dans `index.html <head>` :
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1">
   ```
2. **Jamais de largeur fixe** (ex. `width: 390px`) sur un écran. Ici le conteneur racine est **fluide** :
   `width: 100%; max-width: 480px; margin: 0 auto; box-sizing: border-box;`. Tous les champs sont en `width: 100%`.

## Ce qui change vs l'ancien flow (et pourquoi)
- **Plus de stepper 3 étapes.** L'ancien Étape 2 (Annonce) et Étape 3 (Publier) répétaient le même contenu → supprimé. Un seul écran : on saisit, on génère, le résultat s'affiche à la place.
- **Copier-coller par champ.** Vinted et LBC ont **deux champs séparés** (titre / description) → boutons **Copier** distincts sur chaque bloc. Pas de « tout copier » (inutile).
- **Hashtags = Vinted, en fin de description.** Le sélecteur de plateforme conditionne la sortie : pour Vinted, l'IA ajoute les hashtags **à la fin de la description** (donc copiés avec elle, un seul geste) ; pour LBC, aucun hashtag. Pas de bloc hashtags séparé.
- **Mentions récurrentes.** Depuis « Ajuster & régénérer », un lien `onOpenAnnonceSettings` pointe vers *Paramètres > Mes annonces* : l'utilisateur y définit une fois ses mentions (livraison, signature, conditions…) qui sont ensuite injectées dans chaque annonce.
- **Refine guidé.** Sur le résultat : chips rapides (Plus court / Plus détaillé / Autre ton) + un champ de précision libre → `generer(hint)` renvoie l'instruction à l'IA.
- **Pas de redirection Vinted** (elle ne marche pas de façon fiable). Le geste = copier puis coller manuellement.
- **Enregistrement au prix réellement listé.** Le prix se décide souvent dans Vinted/LBC (leur reco, gros volume) → champ prix éditable avant « Enregistrer ». C'est ce chiffre qui alimente les Stats.

## Branchement IA
Dans `GenererFlow.jsx`, la fonction `generer(hint, plat)` contient un `TODO` : remplace le mock par ton appel backend en passant `{ infos, prixAchat, plat, hint }`. La sortie attendue :
```js
{ titre, description, prixConseille, hashtags /* [] si plat !== 'vinted' */ }
```
`onSaved({ titre, desc, prixListe, pour, plateforme })` est appelé au clic « Enregistrer » — branche-le sur ta création d'article + mise à jour d'inventaire. `onOpenAnnonceSettings()` doit router vers *Paramètres > Mes annonces* (mentions récurrentes).

## Paramètres (Parametres.jsx)
Une **seule page** (fini le sous-menu à 2 cartes). Sections empilées : **Génération IA** (objectif de prix en radios, ton en segmenté, toggle hashtags, **Mentions fixes** = cible du lien « mentions récurrentes » du flow Générer), **Sources** et **Tags** en **chips** supprimables + champ d'ajout (plus léger que les rangées pleines). Compte / Notre histoire / aide restent dans le menu profil (avatar).

## Inventaire (Inventaire.jsx)
Header **sans flèche retour** (onglet principal). Barre : recherche + bouton **Filtres** (ouvre un panneau Source/Tags/Malles — à brancher via `onOpenFilters`, `activeFilterCount` pour le badge). **Statuts en chips** (Tous / En vente / Vendus / À reverser / En attente) avec compteurs. **Card** : hiérarchie revue — prix listé en gros (Bricolage 20px), badges statut/plateforme/source, **marge en pill vert** (`+N €`) ou **violet** (`à reverser N €`) pour les malles, achat en gris discret. **Action rapide** : `Marquer vendu` (en vente) / `Marquer reversé` (malle vendue non reversée). Props : `items`, `onOpen`, `onMarkSold`, `onMarkReversed`, `onOpenFilters`, `activeFilterCount`. Forme d'un item documentée en tête du fichier.

## Détail d'article (DetailArticle.jsx)
**Plein écran** avec **onglets segmentés Suivi & prix / Annonce** (choix validé). **Suivi & prix est l'onglet par défaut** à l'ouverture (c'est ce qu'on remplit à l'enregistrement ; l'Annonce n'est qu'un filet de secours si on n'a pas pu copier au moment de vendre). Flèche retour présente ici car c'est un **écran de détail poussé** au-dessus de l'onglet Inventaire (≠ les 5 onglets racines).
- **Annonce** : reprend le look de Générer — blocs **Copier** (titre / description avec hashtags Vinted inclus), **Régénérer**, tags éditables.
- **Suivi & prix** : hero **navy** (marge estimée/réelle + reco IA), prix d'achat / listé / **vente réel**, statut, plateforme, source, malle, **Supprimer**. La marge se recalcule (vente réel sinon listé, moins achat).
- **« Note prix » supprimé** (inutile). Props : `article`, `onBack`, `onSave`, `onDelete`, `onRegenerate`.
- Variante visuelle proposée dans le proto (`9d`, une seule page sans onglets) — non codée ; dis-moi si tu la préfères.

## Multi-ajout — reco : NE PAS le livrer en v1
Le multi-ajout **plante** et ajoute beaucoup de complexité pour peu de valeur au démarrage. Reco : le retirer de la v1, fiabiliser l'ajout unitaire, et le réintroduire plus tard (en file d'attente d'articles) une fois la brique unitaire solide. Aucun composant multi n'est fourni ici volontairement.
