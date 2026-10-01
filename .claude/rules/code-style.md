---
paths:
  - "src/**/*.js"
  - "src/**/*.css"
  - "scripts/**/*.mjs"
  - "test/**/*.mjs"
---
# Style de code

- **Modules ES vanilla, un rôle par fichier :**
  - `src/js/` : le site d'origine (site, nav, hero) ;
  - `src/motion/` : le système de mouvement (jetons, orchestrateur, `effects/*.js`).
  - Pas de React, pas de Tailwind, pas de framework.
- **Contenu séparé de la logique :** le texte vit dans `index.html`. Le JS ne crée pas de texte visible, sauf l'état du « moment orbite », déjà présent.
- **Commentaires en français**, courts, qui expliquent le *pourquoi* (une mesure, un piège), pas le *quoi*.
- **Nommage :** camelCase pour le JS, kebab-case et BEM léger (`.bloc__element--variante`) pour le CSS, comme le code existant.
- **Effets :** chaque effet exporte `init(root?)`, qui renvoie `destroy()` ou un objet `{ destroy }`. Aucun effet de bord à l'import.
- **Fonctions pures testables :** les calculs (niveau d'appareil, qualité, lissage) vont dans de petits modules couverts par `test/unit/`.
- **Pas de formatage automatique :** le code garde son style compact d'origine. ESLint vérifie les erreurs, pas le style.
- **Ne pas modifier `site.css` sans raison mesurée.** Les styles ajoutés vont dans `styles/motion.css`.
