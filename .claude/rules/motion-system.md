---
paths:
  - "src/motion/**"
  - "src/js/hero/**"
  - "src/js/nav.js"
  - "src/js/site.js"
  - "src/styles/**"
---
# Système de mouvement

## Rôle de chaque moteur (un seul moteur par élément et par propriété)

| Moteur | Rôle |
|---|---|
| **GSAP + ScrollTrigger** | Timeline maîtresse du hero, scrub et pin, révélations de lignes (SplitText), séquences, chorégraphie de page. |
| **Motion (`motion`)** | Uniquement `inView` (déclencheurs), `hover` et `press` (reconnaissance des gestes) et `animate` sur des éléments que GSAP ne touche **jamais**. Les transformations s'écrivent en chaînes CSS complètes (`transform: 'translateY(20px)'`), car les raccourcis `x`/`y` ne sont pas accélérés. |
| **CSS** | États de survol et de focus, transitions simples, bandeau, mouvement réduit. |
| **Lenis** | Défilement doux à la souris seulement : coupé au doigt et en mouvement réduit. |

- **Une seule horloge :** `gsap.ticker`. Lenis s'y branche :
  - `lenis.on('scroll', ScrollTrigger.update)` ;
  - `gsap.ticker.add(t => lenis.raf(t * 1000))` ;
  - `gsap.ticker.lagSmoothing(0)`.
  - **Pas de boucle `requestAnimationFrame` permanente.**
- **Deux effets sur un même élément :** imbriquer un enveloppant (chaque moteur a son élément).

## Règles

- **Jetons uniquement :** pas de durée ni de courbe en dur.
  - JS : `src/motion/tokens.js` ;
  - CSS : `styles/motion.css`, avec `--ease-out` et `--ease-io` d'origine.
- **N'animer que `transform` et `opacity`** (et `clip-path` pour les masques). Jamais `width`, `height`, `top` ou `left`.
- **`will-change` ciblé :** posé juste avant l'animation, retiré à la fin.
- **Lectures et écritures DOM groupées :** toutes les lectures, puis toutes les écritures. Rien qui force un layout dans une boucle.
- **Hors écran, rien ne tourne :**
  - IntersectionObserver, `inView` ou ScrollTrigger avec `toggleActions` ;
  - `ScrollTrigger.batch` pour les listes.
- **Démontage :** chaque effet a un `destroy()` qui tue ses tweens et ScrollTriggers (`ctx.revert()` avec `gsap.context`), retire ses écouteurs et débranche ses observers.
- **Mouvement réduit obligatoire :** `gsap.matchMedia()` avec `(prefers-reduced-motion: reduce)`. La variante réduite affiche l'état final, ou un fondu de 0,3 s au plus, sans déplacement.
- **Le titre du hero ne part jamais de `opacity: 0`**, car cela retarde le LCP : révélation par masque uniquement.
- **Intro interruptible :** un geste de scroll accélère la fin de l'intro, il ne la bloque pas.
- **Moins, mais mieux :**
  - un seul mouvement lié au scroll par écran ;
  - 2 à 3 couches de profondeur au maximum ;
  - pas de curseur personnalisé.

Catalogue complet des animations : `docs/MOTION-SYSTEM.md`. Toute nouvelle animation y est ajoutée.
