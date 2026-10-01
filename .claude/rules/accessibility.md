# Accessibilité

**Objectif :** Lighthouse Accessibilité à 100 et 0 violation axe à toutes les largeurs (`npm run test:a11y`).

## Clavier

- **Tout se fait au clavier**, dans l'ordre du document. Le lien d'évitement (`.skip`) mène à `#main`.
- **Focus visible :** ne jamais retirer `:focus-visible`. Un élément qui bouge (bouton magnétique) garde son contour.
- **Comportements de la nav :**
  - Une nav masquée au scroll réapparaît dès qu'elle reçoit le focus (`focusin`).
  - Le menu mobile se ferme avec Échap et renvoie le focus au bouton.
- **Gestes :** le « moment orbite » (maintenir le bouton) fonctionne aussi avec Espace ou Entrée maintenus.

## ARIA

- Un texte découpé pour l'animation garde une version lisible d'un seul tenant pour les lecteurs d'écran :
  - `span.sr` pour le texte entier ;
  - `aria-hidden` sur les morceaux ;
  - avec SplitText, l'option `aria: 'auto'`.
- **Décor :** le bandeau, les orbites, la scène et les étiquettes sont en `aria-hidden="true"`.
- **Annonces :** le seul message dynamique passe par la région `aria-live="polite"` du « moment orbite ».

## Mouvement réduit

- `prefers-reduced-motion: reduce` produit :
  - le hero statique ;
  - aucune parallaxe ni aucun scrub ;
  - Lenis coupé ;
  - des apparitions en fondu court (≤ 0,3 s) ou immédiates.
- **Ce qui reste :** les retours d'action (bouton pressé, focus) et les indicateurs de progression (jauge de la nav).
- **Bascule en direct :** le changement de préférence s'applique sans recharger la page.
- `prefers-reduced-transparency: reduce` produit des surfaces pleines, sans flou.

## Contraste

- 4,5:1 pour le texte normal, 3:1 pour le gros texte et les composants d'interface.
- Les palettes existantes sont validées par axe. Une animation ne doit jamais laisser un texte à un état intermédiaire peu contrasté une fois terminée.

## Toucher

- Cibles d'au moins 44 × 44 px.
- Le survol n'est jamais le seul moyen d'accéder à une information.
