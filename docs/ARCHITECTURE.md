# Architecture

## Arborescence

```
index.html                 page unique : balisage, textes, SEO, préchargements (polices, poster)
src/
  main.js                  entrée : styles, site, nav, hero ; charge le système de mouvement en temps libre
  styles/
    fonts.css              @font-face (polices auto-hébergées)
    site.css               design d'origine (ne pas modifier sans raison mesurée)
    nav.css                barre de navigation
    hero.css               états du hero (intro, statique, poster)
    motion.css             jetons CSS et styles des effets ajoutés (invisibles au repos)
  js/
    site.js                horloge, apparitions .reveal, traits dessinés, moment « orbite »
    nav.js                 nav : pastille, CTA magnétique, jauge, retrait au scroll, menu mobile
    hero/
      index.js             contrôleur du hero : intro, scroll, pointeur, bascule statique / animé, Lenis
      scene.js             dessin de la scène (Saturne, anneau, 4 mondes), sans DOM
      worker.js            rendu dans un worker (OffscreenCanvas)
      quality.js           qualité adaptative (fonction pure, testée)
      tier.js              niveau d'appareil (fonction pure, testée)
  motion/
    tokens.js              jetons de mouvement (testés)
    util.js                outils des effets
    index.js               orchestrateur (gsap.matchMedia), chargé à la demande
    effects/*.js           un effet par fichier : init(root) → destroy()
  assets/                  polices, images (AVIF/WebP responsives), logo
scripts/                   serve (CDN local), frames et bench (i/s, LCP), audit (6 largeurs), budgets, précompression
test/                      unit (node:test), e2e, a11y, reduced-motion (Playwright), perf (Lighthouse, i/s)
.claude/                   règles, agents, hooks de Claude Code
.githooks/pre-commit       lint, tests unitaires, budget du bundle
docs/                      architecture, mouvement, performance, décisions, audit, changelog
```

## Ordre de chargement

| Étape | Quoi | Coût |
|---|---|---|
| 1 | HTML avec CSS en ligne (17 Ko gzip). Polices et poster préchargés ; sur mobile, pas de poster. | Chemin critique |
| 2 | Premier rendu : le titre du hero monte en CSS. Élément LCP : le poster sur ordinateur, le paragraphe sur mobile. | Sans JS |
| 3 | `index-*.js` (57,9 Ko gzip) : GSAP, ScrollTrigger, Lenis, site, nav, hero. | Module différé |
| 4 | Intro du hero : timeline GSAP, démarrée 2 images après l'initialisation. | — |
| 5 | Après l'intro, en temps libre : découpe des bandes, puis worker de la scène, puis fondu enchaîné poster → canvas. | Hors thread principal |
| 6 | Après `load`, en temps libre : `motion-*.js` (9,2 Ko gzip, avec SplitText et le sous-ensemble Motion), puis `initMotion()`. | À la demande |

## Flux de données du hero

```
scroll (Lenis à la souris, natif au doigt)
  → ScrollTrigger (progression, vitesse)
  → st.target
gsap.ticker (horloge unique)
  → lissage de st.shown et du pointeur
  → bandes, étiquettes, sortie (DOM)
  → postMessage {p, vel, ox, oy}
  → worker
worker : scene.step + scene.draw sur l'OffscreenCanvas
  → qualité adaptative (DPR, puis particules)
  → stats renvoyées au thread principal
```

## Démontage

- **Effets :** chaque effet de `src/motion/effects` renvoie un `destroy()`. `gsap.matchMedia` les appelle quand ses conditions changent (mouvement réduit activé, passage de la souris au tactile, largeur < 1025 px) et annule les tweens, ScrollTriggers et SplitText créés dans son contexte.
- **Hero :** passer en mode statique arrête le worker (`dispose`, puis `close`) et remplace le canvas.
