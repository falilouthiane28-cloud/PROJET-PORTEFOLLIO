# Hero : recherche, point de départ et décisions

## Phase A : recherche (synthèse)

S'appuie sur la recherche faite plus tôt dans ce projet (`reports/Hero animé et performance web.md`, ~30 sources), même sujet.

1. Durées : 100 à 500 ms par élément, au-delà de 1 s l'attention décroche ; l'intro chevauche ses étapes pour être lisible en ~1 s ([NN/g](https://www.nngroup.com/articles/animation-duration/), [web.dev RAIL](https://web.dev/articles/rail)).
2. Easing : sorties fortes, easeOutQuint `cubic-bezier(0.22,1,0.36,1)` / expo.out ; sorties plus courtes que les entrées ; pas de rebond sans élan ([easings.net](https://easings.net), [WWDC23 springs](https://developer.apple.com/videos/play/wwdc2023/10158/)).
3. Texte : révélation par masques, décalage court entre éléments ; garder le texte accessible en entier ([GSAP SplitText](https://gsap.com/docs/v3/Plugins/SplitText/)).
4. Scroll : scrub lissé plutôt que lié brut au scroll, pas de détournement du scroll ([ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)).
5. Lenis : `lenis.on('scroll', ScrollTrigger.update)`, piloté par `gsap.ticker`, `lagSmoothing(0)` ; au doigt le défilement reste natif ([Lenis](https://github.com/darkroomengineering/lenis)).
6. LCP : un canvas n'est jamais candidat ; une image animée (opacité/transform) n'est comptée qu'à la fin de son animation (mesuré ici : 2,5 s) ; une paint à `opacity:0` ne compte pas ([web.dev LCP](https://web.dev/articles/lcp), [changelog LCP Chromium](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/lcp.md)).
7. Hors du thread principal : OffscreenCanvas dans un worker (≈96 % des navigateurs, Safari 17+), avec rAF dans le worker ([web.dev](https://web.dev/articles/offscreen-canvas), [caniuse](https://caniuse.com/offscreencanvas)).
8. Qualité adaptative : mesurer le temps d'image sur une fenêtre glissante, baisser la densité de pixels puis les effets, remonter prudemment ([drei PerformanceMonitor](https://github.com/pmndrs/drei)).
9. Hygiène : n'animer que transform/opacity, pause hors écran et onglet caché, libérer les ressources au démontage ([three.js docs](https://threejs.org/docs/)).

### Décisions

- **La scène reste en canvas 2D, déplacée dans un worker (OffscreenCanvas)**, au lieu de passer à Three.js. Raison : c'est le seul moyen de garder exactement le rendu d'origine (même code de dessin), et c'est le dessin de 2 800 particules sur le thread principal qui fait saccader. Three.js n'est plus utilisé : dépendance retirée (−136 Ko gzip possibles en moins à charger). Draco/KTX2 sans objet : la scène n'a aucun fichier 3D ni texture.
- **Poster d'abord sur ordinateur** : image fixe (jamais animée) de l'état initial de la scène, posée exactement à l'emplacement du dessin ; un voile se dissout au-dessus. Le worker démarre après l'intro et fait un fondu enchaîné.
- **Mobile** : la scène reste statique comme dans le design d'origine, dessinée une fois ; aucune image ajoutée (le titre reste l'élément LCP).
- **Titre** : chaque mot monte de son masque en CSS dès le premier rendu (les coupures de ligne restent exactement celles d'origine, le LCP ne dépend pas du JS). Le reste de l'intro est une timeline GSAP maîtresse.
- **Une seule horloge** sur le thread principal : `gsap.ticker` pilote Lenis, le lissage du scroll du hero, les bandes, les étiquettes, et l'envoi des entrées au worker.

## Phase B : point de départ (design d'origine restauré, commit `01dc615`)

Machine calibrée : une page vide tient 60 i/s sur les deux profils au moment des mesures.

| Mesure | Ordinateur (1440×900) | Ordinateur, CPU ×4 | Mobile (390×844, Slow 4G, CPU ×4, gestes tactiles) |
|---|---|---|---|
| LCP réel | 0,47 à 0,62 s (titre) | 1,36 à 1,40 s | 1,48 à 1,65 s (titre) |
| Intro (i/s, images perdues, pire image) | 53 à 54, 3 perdues, 283 à 350 ms | **35 à 37, 17 à 19 perdues, 583 à 934 ms** | 44 à 46, 5 perdues, 800 à 950 ms |
| Premier scroll | 58 à 59 i/s, 4 à 8 perdues | **44 à 46 i/s, 54 perdues** | 58 i/s, 8 à 11 perdues (hero statique) |
| Tâches longues au chargement | 129 à 168 ms + ~50 ms | 585 à 760 ms + 150 à 200 ms ×3 | 795 à 943 ms + 120 à 350 ms |
| CLS | 0,037 | | 0,003 |
| Console | 0 erreur | | 0 erreur |

Lighthouse (3 passages mobile, 1 desktop) :

| | Performance | Accessibilité | Bonnes pratiques | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| Mobile (Slow 4G, CPU ×4) | 99 / 99 / 99 | 100 | 100 | 100 | 1,12 s | 1,88 s | 50 ms | 0 |
| Desktop | 100 | 100 | 100 | 100 | | 0,37 s | 0 ms | 0,033 |

### Ce qui saccade

- **Au chargement** : une tâche de 0,6 à 0,9 s (CPU ×4) découpe les titres des bandes en ~400 éléments (`split`), initialise la scène et dessine les premières images ; l'intro du titre (rampe de 1,4 s lettre par lettre) démarre pendant cette tâche et perd ses premières images.
- **Pendant le scroll du hero** : chaque image redessine 2 800 particules, 22 ellipses et plusieurs dégradés sur le thread principal (canvas 2D), en plus des écritures DOM des bandes ; sous CPU ×4, 54 images perdues sur ~3 s.
- **Pas de vraie intro** : la scène apparaît d'un coup avec le JS, la nav est là d'emblée, rien n'est chorégraphié.
- **Mobile** : la scène est statique (choix du design), seul le chargement accroche (tâche de ~0,9 s).
- **À 320 px** : les étiquettes des planètes chevauchent la ligne « Studio de design et web » (audit H4).
