// Jetons de mouvement : la même sensation partout (hero, sections, micro-interactions).
// Valeurs reprises du design d'origine (--ease-out de site.css) et du rapport de recherche
// (reports/Système de mouvement portfolio.md). Le CSS a ses équivalents dans styles/motion.css.

// Courbes. GSAP accepte les noms ci-dessous ; le CSS et WAAPI prennent les cubic-bezier.
export const EASE = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',      // arrivée, sans rebond (--ease-out d'origine ≈ expo.out)
  outQuint: 'cubic-bezier(0.22, 1, 0.36, 1)',// révélations de texte (easeOutQuint)
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',   // allers-retours (--ease-io d'origine)
  in: 'cubic-bezier(0.55, 0, 1, 0.45)'       // sorties (plus courtes que les entrées)
};
export const GSAP_EASE = { out: 'expo.out', outQuint: 'quint.out', inOut: 'power3.inOut', in: 'power3.in' };

// Durées en secondes
export const DUR = {
  press: 0.1,      // retour au toucher, immédiat
  micro: 0.3,      // survol, focus
  base: 0.6,       // éléments d'interface
  reveal: 1.1,     // apparition d'un bloc (identique aux .reveal d'origine)
  line: 1.0,       // une ligne de titre qui monte de son masque
  intro: 2.6       // timeline maîtresse du hero (titre lisible avant 1,5 s)
};

// Décalages entre éléments d'un même groupe (secondes)
export const STAGGER = { line: 0.08, item: 0.09, word: 0.03 };

// Distances (px) : petites, le mouvement accompagne, il ne voyage pas
export const DIST = { reveal: 36, item: 20, magnet: 10, parallax: 40 };

// Ressorts (pointeur, gestes) : amortissement critique par défaut, sans rebond (Apple, WWDC18)
export const SPRING = {
  pointer: { stiffness: 170, damping: 26, mass: 1 },   // ≈ réponse 0,4 s, sans dépassement
  magnet: { stiffness: 220, damping: 22, mass: 1 }
};

// Facteur de lissage indépendant de la fréquence d'images : k pour un pas dt (ms), base à 60 i/s
export const lerpFactor = (base, dtMs) => 1 - Math.pow(1 - base, dtMs / 16.667);

// Le mouvement réduit coupe tout déplacement : il ne reste que des fondus courts
export const REDUCED = { duration: 0.3, ease: 'power1.out' };
