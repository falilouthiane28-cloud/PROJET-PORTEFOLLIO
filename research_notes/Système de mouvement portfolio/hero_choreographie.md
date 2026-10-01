# Chorégraphie du hero et storytelling au scroll (Apple / niveau Awwwards SOTD)

Périmètre : faits sourcés pour chorégraphier une intro hero de 2,5 à 3,5 s et des révélations au scroll sur tout le site, pour un portfolio en vanilla JS (design cosmique sombre, scène canvas de Saturne, grand titre, CTA, nav), sans changer son style. Recherche faite le 2026-10-01. Les notes de méthode : une partie du contenu récupéré venait de résumés automatiques de pages. Quand un résumé paraissait générique ou pas fiable (en particulier la page Motion du HIG d'Apple, que l'outil de récupération n'a pas pu rendre), le point a été recoupé avec des extraits de recherche ou placé dans Gaps.

## 1. Durées d'intro, durées par élément, stagger et chevauchement

### Takeaway
Aucune source primaire ne publie de « durée standard d'intro hero ». Les valeurs documentées touchent seulement les briques : révélation de ligne d'environ 1 s, stagger de 0,05 à 0,1 s, `expo.out`, et des animations d'interface sous 300 ms. Une intro de 2,5 à 3,5 s se construit donc en faisant se chevaucher des animations d'environ 0,8 à 1,2 s, et non en les enchaînant.

### Cited Findings
- L'exemple de la doc SplitText de GSAP anime les éléments découpés avec une durée de 1 s, un stagger de 0,05 s et un décalage y de 100 px — [GSAP SplitText docs](https://gsap.com/docs/v3/Plugins/SplitText/)
- Le motif courant de révélation de lignes masquées utilise `yPercent: 100` (départ sous la ligne), un stagger d'environ 0,1 et `ease: "expo.out"`, avec SplitText configuré en `mask: "lines"` — [Codrops: 5 creative demos using free GSAP plugins](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/); [CodePen, Masked Text Reveal (Osmo)](https://codepen.io/osmosupply/pen/pvvKezw); [GSAP Text Animation guide 2026, Good Fella Lab](https://lab.good-fella.com/blog/gsap-text-animation-splittext-guide)
- Les animations d'interface devraient « généralement durer moins de 300 ms ». Les actions déclenchées au clavier ne devraient pas être animées du tout — [Emil Kowalski, Great animations](https://emilkowal.ski/ui/great-animations)
- Le HIG d'Apple : « Prefer quick, precise animations », et des animations brèves et précises paraissent plus légères et moins intrusives — [Apple HIG, Motion](https://developers.apple.com/design/human-interface-guidelines/foundations/motion) (texte confirmé via extrait de recherche, pas par lecture de la page complète)
- Les tutoriels Codrops sur les intros structurent le chargement en une section « Introduction/Preloader » dans un timeline GSAP. Exemple : les tuiles visibles s'animent depuis le centre de l'écran jusqu'à leur place dans la grille — [Codrops, Infinite Parallax Grid](https://tympanus.net/codrops/2025/06/11/building-an-infinite-parallax-grid-with-gsap-and-seamless-tiling/); [Codrops, Palmer draggable grid](https://tympanus.net/codrops/2025/09/01/recreating-palmers-draggable-product-grid-with-gsap/)
- Trajectoires symétriques : si un élément disparaît d'un côté, on s'attend à ce qu'il réapparaisse du même côté — [WWDC18 « Designing Fluid Interfaces » transcript](https://asciiwwdc.com/2018/sessions/803)

### Inferences
- Plan de chorégraphie proposé (déduit des valeurs ci-dessus, pas une norme publiée). Total d'environ 3,0 s :
  - 0,00 s : la scène de Saturne monte en fondu (opacity, scale 1,04 → 1, environ 1,6 s, expo.out).
  - 0,35 s : les lignes du titre montent depuis leur masque (`yPercent 100 → 0`, 1,0 à 1,1 s, stagger 0,08 à 0,12 s, expo.out).
  - Vers 1,1 s : le sous-titre apparaît (0,8 s).
  - Vers 1,4 s : le CTA apparaît (0,6 s).
  - Vers 1,5 à 1,7 s : la nav descend ou apparaît en fondu (0,6 s, stagger d'environ 0,04 s).
  - Le dernier élément se pose vers 2,3 à 2,6 s. L'easing restant donne l'impression d'environ 3 s.
  - Le chevauchement passe par les décalages de position du timeline (par exemple `"<0.2"` ou `"-=0.6"`).
- Le préchargeur / logo devrait compter dans le budget total. Si la scène est déjà prête, l'ignorer : l'attente perçue compte plus que le spectacle.
- L'élément principal (la planète) doit commencer en premier, et la nav en dernier : elle a le rôle visuel le plus faible et l'utilisateur doit pouvoir l'utiliser vite.

### Gaps
- Aucune durée d'intro mesurée sur des pages Apple ou des sites SOTD d'Awwwards n'a été trouvée dans des sources primaires. Les sources Awwwards et Codrops visées n'ont pas toutes pu être lues : l'article Codrops « cinematic 3D scroll » a renvoyé HTTP 403 — [Codrops, Cinematic 3D scroll](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/).

## 2. Easing, ressorts et ligne de conduite du HIG / des WWDC

### Takeaway
Ease-out (expo / quint / power3-4) est l'easing par défaut pour les entrées. Les ressorts sont réservés au mouvement piloté par le geste et interruptible : amortissement de 100 % par défaut, environ 80 % seulement quand un lancer porte de l'élan. Apple insiste sur un mouvement utile, bref, interruptible, et sur le respect de Reduce Motion.

### Cited Findings
- `ease-out` est recommandé parce qu'il « démarre vite et ralentit à la fin », ce qui donne une impression de réponse rapide. N'animer que `transform` / `opacity`. Viser 60 fps. Les animations CSS et WAAPI restent fluides même quand le thread principal est occupé, contrairement aux bibliothèques basées sur rAF — [Emil Kowalski, Great animations](https://emilkowal.ski/ui/great-animations)
- `cubic-bezier(0.22, 1, 0.36, 1)` correspond à easeOutQuint — [easings.net](https://easings.net/#easeOutQuint)
- GSAP fournit les familles d'easing `power1` à `power4` et `expo` (`.in`, `.out`, `.inOut`) — [GSAP Eases docs](https://gsap.com/docs/v3/Eases/)
- WWDC18 (« Designing Fluid Interfaces ») : décrire les ressorts par un amortissement et une réponse (response), pas par une durée. Commencer avec un amortissement de 100 % (pas de dépassement) pour la plupart des interfaces. Environ 80 % quand on lance un élément avec de l'élan, car un geste avec élan mais sans dépassement « paraît souvent cassé ». Les animations doivent rester réorientables à tout moment. Projeter la position d'arrivée à partir de la vitesse et du taux de décélération — [WWDC18 Session 803 transcript](https://asciiwwdc.com/2018/sessions/803); [vidéo Apple](https://developer.apple.com/videos/play/wwdc2018/803/)
- La plupart des animations devraient utiliser un amortissement de 1 (pas de rebond) — [Nathan Gitter, Building Fluid Interfaces](https://medium.com/@nathangitter/building-fluid-interfaces-ios-swift-9732bb934bf5)
- HIG : « Add motion purposefully, supporting the experience without overshadowing it ». Ne pas ajouter de mouvement pour le simple plaisir d'en ajouter. Le mouvement gratuit peut distraire ou donner une impression de déconnexion. Quand Reduce Motion est activé, réduire ou supprimer les animations — [Apple HIG, Motion](https://developers.apple.com/design/human-interface-guidelines/foundations/motion) (via extrait de recherche)
- Rauno : les interactions réelles s'interrompent. Les interactions fréquentes doivent avoir peu ou pas d'animation, parce que la nouveauté s'use et devient une charge cognitive. La fermeture de la Dynamic Island utilise des ressorts physiques plutôt que des courbes fixes — [Rauno Freiberg, Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design)

### Inferences
- Intro : tweens à durée fixe en expo.out / power4.out / `cubic-bezier(0.22,1,0.36,1)`. C'est une séquence non interactive, la durée prévisible est donc acceptable.
- Pointeur, bouton magnétique, inclinaison de la planète : utiliser un suivi par ressort ou par lerp (sans état « terminé », donc interruptible par nature).
- Le hero doit pouvoir s'interrompre : si l'utilisateur fait défiler pendant l'intro, finir le timeline en accéléré (par exemple `tl.timeScale(3)` ou `tl.progress(1)`) plutôt que de bloquer le scroll.

### Gaps
- Le texte complet de la page HIG Motion n'a pas pu être lu directement (rendu JS). Les citations viennent d'extraits de recherche.

## 3. Storytelling au scroll : pin, scrub, vitesse, parallaxe, passage d'une section à l'autre

### Takeaway
Les pages produit d'Apple pilotent des séquences d'images ou des scènes canvas épinglées en fonction de la progression du scroll. Les mêmes effets sont aujourd'hui possibles en natif avec les timelines CSS de scroll et de vue, qui tournent hors du thread principal. Le smooth scroll (Lenis) est courant sur les sites primés mais a des limites connues.

### Cited Findings
- Technique Apple : un `<canvas>` fixe / sticky ; progression = scrollTop / scroll maximal ; `frameIndex = floor(progress × frameCount)` ; dessin dans `requestAnimationFrame` ; images préchargées (exemple : 148 images ; une page a mesuré 1 609 requêtes et 55,8 Mo). Apple sert des images statiques en repli sur connexion lente et des séquences adaptées à l'appareil — [CSS-Tricks, Apple-style scrolling animations](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)
- Animations pilotées par le scroll en CSS : `scroll()` (progression du scroller) et `view()` (progression de l'élément dans la zone visible). Plages : `entry`, `exit`, `cover`, `contain`, `entry-crossing`, `exit-crossing`. `animation-duration: auto`. Peuvent tourner hors du thread principal. Prises en charge par Chrome/Edge 115+, Safari 26+, Firefox seulement en Technology Preview. Utiliser `@supports` — [Chrome for Developers, Scroll-driven animations](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)
- Valeurs par défaut de Lenis : `lerp 0.1`, `duration 1.2`, easing exponentiel `Math.min(1, 1.001 - Math.pow(2, -10 * t))`, `wheelMultiplier 1`, `syncTouch false`. Limites : 60 fps maximum sur Safari, pas de smooth scroll au-dessus des iframes, pas de prise en charge de CSS scroll-snap sans plugin, `syncTouch` peu fiable avant iOS 16. Intégration GSAP : `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(t => lenis.raf(t*1000))`, `gsap.ticker.lagSmoothing(0)` — [Lenis GitHub](https://github.com/darkroomengineering/lenis)
- WCAG considère le mouvement provoqué par le scroll de l'utilisateur comme essentiel (l'utilisateur le contrôle), mais les éléments décoratifs en parallaxe qui bougent pendant le scroll devraient pouvoir être désactivés — [W3C, Understanding SC 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- La parallaxe (arrière-plan qui bouge à une autre vitesse que le premier plan) déclenche des troubles vestibulaires — [web.dev, prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion)

### Inferences
- Premium ou bruyant : ce qui fait premium, c'est un seul mouvement de « héros » par écran, rattaché à la progression du scroll (scrub) avec un lissage léger (par exemple scrub 0,5 à 1 dans ScrollTrigger), plus des révélations d'entrée discrètes. Ce qui fait bruyant : plusieurs couches de parallaxe à des vitesses qui s'opposent, des effets de vitesse sur chaque élément, des révélations qui se rejouent. Cette lecture est une synthèse à partir de la retenue prônée par le HIG et de Rauno sur la fréquence, pas une règle publiée.
- Saturne : faire tourner ou reculer légèrement la planète avec la progression de la sortie du hero (`view()` / ScrollTrigger `scrub`) pour faire le lien avec la section suivante. Garder 2 ou 3 couches de profondeur au maximum (étoiles, planète, texte).
- Préférer les timelines CSS de scroll pour les révélations simples (hors thread principal), avec repli en IntersectionObserver ou GSAP derrière `@supports`.

### Gaps
- Aucun chiffre sourcé n'a été trouvé pour la valeur de scrub, la distance d'épinglage ou l'intensité du lien à la vitesse (l'article Codrops cinematic était bloqué).

## 4. Lignes masquées, mots surlignés, clip-path, compteurs, boutons magnétiques, curseurs : bonnes pratiques et pièges

### Takeaway
Le texte découpé doit garder un nom accessible et n'être découpé qu'une fois les polices chargées. Les révélations en fondu depuis `opacity: 0` sur l'élément LCP peuvent dégrader le LCP. N'animer que transform / opacity / clip-path pour éviter le CLS.

### Cited Findings
- `mask` de SplitText : enveloppe chaque ligne, mot ou caractère dans un élément avec `visibility: clip` (un seul type à la fois). `aria: "auto"` met un `aria-label` sur le parent et `aria-hidden` sur les morceaux. Découper avant le chargement des polices provoque des décalages : attendre `document.fonts.ready` ou utiliser `autoSplit: true` avec `onSplit()` qui renvoie l'animation. `revert()` restaure le DOM d'origine — [GSAP SplitText docs](https://gsap.com/docs/v3/Plugins/SplitText/)
- Depuis août 2020, Chrome ignore les éléments à `opacity: 0` pour le LCP. Un titre qui apparaît en fondu ne devient candidat LCP qu'au prochain repaint (chargement de police, redimensionnement…), ce qui peut faire enregistrer un LCP tardif. Les images gardent leur `startTime` d'origine, mais le texte prend le moment du repaint. Solutions : supprimer le fondu, ou partir d'une opacité non nulle (0,01 à 0,1) — [DebugBear, opacity animation and LCP](https://www.debugbear.com/blog/opacity-animation-poor-lcp); spec ouverte : [w3c/largest-contentful-paint #148](https://github.com/w3c/largest-contentful-paint/issues/148)
- Shopify a mesuré une amélioration du LCP après avoir retiré les transitions sur les images — [Shopify Performance, removing image transitions](https://performance.shopify.com/blogs/blog/improve-largest-contentful-paint-lcp-by-removing-image-transitions)
- Les animations de transform ne provoquent pas de layout shift dans le CLS. Animer des propriétés de mise en page (top, width, margin) peut en provoquer — [web.dev, CLS](https://web.dev/articles/cls)
- Éviter d'animer padding et margin (relayout). Préférer transform et opacity — [Emil Kowalski](https://emilkowal.ski/ui/great-animations)

### Inferences
- Titre du hero : il est probablement l'élément LCP. La révélation par masque (`yPercent` dans une ligne `visibility: clip`) garde l'opacité à 1. Le texte est peint mais clippé, ce qui évite le piège du `opacity: 0`. À vérifier dans DevTools > Performance, car un texte entièrement clippé peut ne pas être compté comme peint.
- Compteurs : réserver la largeur finale (`font-variant-numeric: tabular-nums`, largeur min) pour éviter les variations de mise en page. Mettre la valeur finale dans le DOM pour les lecteurs d'écran.
- Boutons magnétiques / curseur personnalisé : seulement pour `(hover: hover) and (pointer: fine)`. Garder le curseur natif ou un repère de focus visible. Désactiver avec reduced motion. Limiter le déplacement à quelques pixels avec un ressort ou un lerp.

### Gaps
- Aucune source primaire n'a été trouvée pour des valeurs chiffrées de boutons magnétiques ou de curseurs personnalisés (force, rayon) ni pour leurs pièges d'accessibilité. Les points ci-dessus sont des déductions.
- Les valeurs sourcées pour les révélations en clip-path et les surlignages mot par mot n'ont pas été couvertes dans le budget d'appels.

## 5. Variantes reduced motion

### Takeaway
Avec reduced motion, retirer les déplacements, la parallaxe, le zoom et le scrub décoratif. Garder les fondus courts et les retours fonctionnels. Écouter les changements de préférence en direct.

### Cited Findings
- Supprimer : parallaxe, gradients animés, vidéo de fond en lecture automatique, révélations inutiles, zooms. Garder : retours aux actions, indicateurs de chargement / progression, transitions d'état essentielles. En JS, écouter les changements de préférence et arrêter les animations en cours — [web.dev, prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion)
- WCAG 2.3.3 (AAA) : le mouvement déclenché par une interaction doit pouvoir être désactivé sauf s'il est essentiel. Les changements de couleur, de flou ou d'opacité seuls ne comptent pas comme mouvement, sauf s'ils changent la taille, la forme ou la position perçues. Techniques : `prefers-reduced-motion` en CSS / JS, et un réglage sur tout le site — [W3C, Understanding SC 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)
- HIG : quand Reduce Motion est activé, réduire ou supprimer les animations — [Apple HIG, Motion](https://developers.apple.com/design/human-interface-guidelines/foundations/motion)

### Inferences
- Intro en reduced motion : un fondu de 300 à 400 ms sur le contenu du hero, sans transform. Planète statique ou rotation très lente. Pas de lissage du scroll (désactiver Lenis). Révélations en simple fondu ou apparition directe. Suivi du pointeur désactivé.
- Une variante en fondu seul reste conforme à la WCAG 2.3.3, puisque l'opacité seule ne compte pas comme mouvement.

### Gaps
- Le résumé de web.dev parlait de « nécessité médicale » et de statistiques sur les troubles vestibulaires. Ces passages n'ont pas pu être vérifiés mot pour mot et ne sont pas repris ici.
