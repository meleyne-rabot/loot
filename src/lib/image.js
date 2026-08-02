// Compresse une image au format JPEG, redimensionnée à `max` px max et
// qualité `quality`. Fonction de base réutilisée par les deux presets
// ci-dessous.
function compress(dataUrl, max, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(max / img.width, max / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

// Vignette stockée en base (légère, ~30KB) pour l'affichage dans l'app.
export function compressImage(dataUrl) {
  return compress(dataUrl, 300, 0.7);
}

// Image envoyée à l'IA pour génération. Claude redimensionne de toute façon
// les images en interne à ~1,15 mégapixel (~1090×1090) avant analyse — au
// delà, plus de pixels n'apporte aucun détail supplémentaire, juste plus de
// poids. On vise donc cette résolution avec une qualité élevée pour que les
// étiquettes/marques restent bien lisibles, tout en évitant les photos
// brutes de plusieurs Mo qui dépassaient la taille max acceptée par l'API.
export function compressForAI(dataUrl) {
  return compress(dataUrl, 800, 0.75);
}
