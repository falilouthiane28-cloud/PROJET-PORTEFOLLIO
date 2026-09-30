# Animer la planète nacrée sans sacrifier le LCP

## Synthèse (15 lignes)

1. **Timing** : aucune source primaire ne publie de timeline d'intro canonique. Les bornes défendables sont 100–500 ms par élément, avec un effet de « drag » dès 500 ms ([NN/g](https://www.nngroup.com/articles/animation-duration/)), une perte d'attention au-delà de 1 s ([web.dev RAIL](https://web.dev/articles/rail)) et la règle de ne jamais faire attendre l'utilisateur ([Apple HIG](https://developer.apple.com/design/human-interface-guidelines/motion)). D'où une intro en étapes chevauchées, lisible et cliquable en ~1 s.
2. **Easing** : l'effet « premium » vient d'ease-out marqués, easeOutExpo `cubic-bezier(0.16, 1, 0.3, 1)` et easeOutQuint `cubic-bezier(0.22, 1, 0.36, 1)` ([easings.net](https://raw.githubusercontent.com/ai/easings.net/master/src/easings.yml)). Les entrées sont en ease-out et les sorties plus courtes, par exemple 300 ms à l'entrée et 200–250 ms à la sortie ([NN/g](https://www.nngroup.com/articles/animation-duration/)). Côté Apple, le ressort par défaut a un bounce de 0, et au-delà de 0,4 il est jugé trop exagéré pour de l'UI ([WWDC23](https://developer.apple.com/videos/play/wwdc2023/10158/)).
3. **Révélation du texte** : la méthode standard est SplitText avec `mask: "lines"`, des tweens créés dans `onSplit()` et `autoSplit: true`, qui redécoupe après le chargement des polices ou un redimensionnement. `aria: "auto"` garde la phrase lisible par les lecteurs d'écran ([GSAP SplitText](https://gsap.com/docs/v3/Plugins/SplitText/)). Tout GSAP est désormais gratuit, usage commercial compris ([licence GSAP](https://gsap.com/community/standard-license/)).
4. **Le scroll selon Apple** : c'est un flip-book sur canvas épinglé (148 JPG d'environ 31 Ko, dont l'image affichée dépend de la position de scroll), avec une image unique de repli sur réseau lent. La page analysée pesait 55,8 Mo pour 1 609 requêtes ([CSS-Tricks](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)). Une planète procédurale en WebGL obtient le même effet sans ce poids.
5. **Outils de scroll** : ScrollTrigger combine `pin` et `scrub` (`scrub: 1` = 1 s de rattrapage) sans détourner le scroll ([ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)). Les animations CSS pilotées par le scroll (`view()`, `animation-range: exit`) tournent hors du thread principal, sur Chrome 115+ et Safari 26+ ([Chrome for Developers](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)).
6. **Profondeur sur fond blanc** : superposer des ombres à faible opacité, venant d'une seule source de lumière et teintées de la couleur du fond plutôt que de noir. Plus l'élément est « haut », plus l'ombre est large et pâle. `drop-shadow()` suit le contour d'une image détourée ([Josh Comeau](https://www.joshwcomeau.com/css/designing-shadows/)).
7. **LCP** : un `<canvas>` WebGL n'est jamais candidat au LCP (seuil « bon » : 2,5 s au 75e centile) ([web.dev LCP](https://web.dev/articles/lcp)). Chrome ignore les peintures à `opacity: 0` depuis Chrome 86 et le texte transparent depuis Chrome 130 ([changelog LCP de Chromium](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/lcp.md)). Dans un cas réel, supprimer un fondu d'entrée en JS a fait gagner 6 s de LCP ([Shopify](https://performance.shopify.com/en-ca/blogs/blog/improve-largest-contentful-paint-lcp-by-removing-image-transitions)).
8. **Poster d'abord** : le LCP doit donc être porté par le H1 ou par un vrai poster AVIF détaillé. Une image plein écran ou trop floue est exclue des candidats ([web.dev LCP](https://web.dev/articles/lcp)). three.js se charge après l'événement `load` via `requestIdleCallback`, avec un repli `setTimeout`, car Safari (desktop et iOS) le garde désactivé jusqu'à la 27.2 ([caniuse](https://caniuse.com/requestidlecallback)).
9. **Poids des bibliothèques** : GSAP 3.15 pèse environ 27 Ko en gzip et Lenis 1.3.26 environ 5,5 Ko ([Bundlephobia](https://bundlephobia.com/api/size?package=gsap)). ScrollTrigger fait 44,6 Ko minifié, soit ~17 Ko en gzip selon notre estimation ([jsDelivr](https://data.jsdelivr.com/v1/packages/npm/gsap@3.15.0?structure=flat)). three.js pèse environ 150 Ko en gzip et le tree-shaking gagne peu dès qu'on importe `WebGLRenderer` ([forum three.js](https://discourse.threejs.org/t/what-is-the-state-of-tree-shaking/33168)).
10. **Lenis** : l'intégration officielle branche `lenis.on('scroll', ScrollTrigger.update)`, appelle `lenis.raf` depuis `gsap.ticker` et fixe `lagSmoothing(0)`. Avec `syncTouch: false` (défaut), le défilement tactile reste natif. Lenis est limité à 60 fps sur Safari et à 30 fps en mode économie d'énergie ([Lenis](https://github.com/darkroomengineering/lenis)). `normalizeScroll()` fait passer le scroll sur le thread JS ([ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)).
11. **Bonnes pratiques GSAP** : `gsap.matchMedia()` avec une condition `reduceMotion` annule tout automatiquement quand la media query ne correspond plus ([matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/)). Autres règles : `ScrollTrigger.batch()` pour les apparitions répétées, `refresh()` après chaque changement de mise en page, `scroll-behavior: auto` et `start: "clamp(top bottom)"` ([erreurs ScrollTrigger](https://gsap.com/resources/st-mistakes/)).
12. **Web Worker** : OffscreenCanvas couvre environ 96 % des navigateurs, avec un support complet sur Safari et iOS depuis la 17.0 ([caniuse](https://caniuse.com/offscreencanvas)). Dans un worker, three.js reste fluide même quand le thread principal est chargé. En contrepartie, il faut fournir soi-même `style`, relayer les événements d'entrée à la main, et le worker n'a pas accès au DOM ([web.dev OffscreenCanvas](https://web.dev/articles/offscreen-canvas)).
13. **Compilation des shaders** : `renderer.compileAsync(scene, camera)`, qui s'appuie sur `KHR_parallel_shader_compile`, évite l'à-coup de la première image ([docs three.js](https://threejs.org/docs/pages/WebGLRenderer.html) ; [MDN](https://developer.mozilla.org/en-US/docs/Web/API/KHR_parallel_shader_compile)). three.js en est à la r186, et WebGPURenderer se replie sur WebGL 2 depuis la r171 ([Utsubo](https://www.utsubo.com/blog/threejs-best-practices-100-tips) ; [releases three.js](https://github.com/mrdoob/three.js/releases)).
14. **Qualité adaptative** : limiter le DPR à `min(devicePixelRatio, 2)` et rester sous 100 draw calls et 100 000 sommets sur mobile ([Utsubo](https://www.utsubo.com/blog/threejs-best-practices-100-tips)). Le PerformanceMonitor de drei mesure sur 10 fenêtres de 250 ms, réagit quand 75 % sont hors limites, ajuste par pas de 0,1 et calcule DPR = 0,5 + 1,5 × facteur ([drei](https://github.com/pmndrs/drei/blob/master/docs/performances/performance-monitor.mdx)). `deviceMemory` n'est pas Baseline ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory)).
15. **Matériau et mémoire** : `MeshPhysicalMaterial` ne coûte que pour les effets activés et doit toujours avoir une env map ([docs three.js](https://threejs.org/docs/pages/MeshPhysicalMaterial.html)). Une texture 4K occupe environ 64 Mio de VRAM. Il faut surveiller `renderer.info.memory` et appeler `dispose()` sans attendre ([Utsubo](https://www.utsubo.com/blog/threejs-best-practices-100-tips)).

## Décisions d'ingénierie

1. **Le LCP est porté par le H1 et un poster.**
   - Le H1 est visible dans le HTML servi : ni `opacity: 0` ni `visibility: hidden` dans le CSS.
   - Le poster est un `<img fetchpriority="high">` AVIF, rendu réel de la planète, qui occupe environ 60–70 % de la largeur (pas le plein écran).
   - Aucun préchargeur ni rideau.
2. **Une seule timeline d'intro, de ~1,2 s au total.**
   - Planète : `expo.out` sur 0,8 s, scale de 0,96 à 1 et montée de 24 px.
   - H1 : lignes masquées avec `yPercent` de 100 à 0, en `power4.out` (≈ quint) sur 0,7 s, stagger 0,08 s. Ce stagger est une valeur d'usage, non sourcée.
   - Sous-titre et CTA : montée depuis `opacity: 0.1`, en chevauchement.
   - La nav et le CTA sont cliquables dès la première image.
   - L'intro complète ne joue qu'une fois par session. Elle est sautée si GSAP n'est pas prêt moins de 1 s après le début de la navigation.
3. **Tokens d'easing.**
   - `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`, qui correspond à `expo.out`.
   - `--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1)`.
   - Sorties en ease-in de 200 à 250 ms.
   - Aucun easing `back` ou élastique sur la planète.
4. **Chargement en trois vagues.**
   - Vague 1 : HTML, CSS critique et police du H1.
   - Vague 2 : GSAP, ScrollTrigger, SplitText et Lenis (~50 Ko en gzip) via `import()` dynamique après la première peinture.
   - Vague 3 : three.js (~150–170 Ko en gzip) après `load`, via `requestIdleCallback({timeout: 2000})`, sinon `setTimeout`.
   - Pas de 3D (poster seul) si `prefers-reduced-motion`, `saveData`, une connexion `2g`/`slow-2g` ou un échec de création du contexte WebGL.
5. **Rendu.**
   - `WebGLRenderer` et non WebGPU : l'objet est unique et le chemin WebGL est plus éprouvé sur les WebView Android.
   - Rendu dans un worker OffscreenCanvas quand c'est possible, sur le thread principal sinon.
   - `compileAsync` avant la première image.
   - Le worker envoie un message « première image » qui déclenche un fondu enchaîné du poster vers le canvas en 300–600 ms.
6. **Scène.**
   - Sphère 64×48 et `RingGeometry` de 128 segments.
   - Matériau nacré : roughness ~0,3, clearcoat 1 et clearcoatRoughness ~0,1. Iridescence de 0,2 à 0,4 sur le palier haut seulement.
   - Aucune `transmission`.
   - `RoomEnvironment` via `PMREMGenerator`, donc 0 octet téléchargé.
   - Anneau violet : `DataTexture` de 256×1 avec alpha et `depthWrite: false`.
   - Ombre de contact : un plan à dégradé radial, sans shadow map.
7. **Paliers d'appareils et moniteur de FPS.**
   - Bas (`deviceMemory` ≤ 2, 4 cœurs ou moins, ou `saveData`) : poster seul, ou DPR 1 avec `MeshStandardMaterial`.
   - Moyen (4 Go) : DPR limité à 1,5, clearcoat sans iridescence.
   - Haut : DPR 2 et matériau complet.
   - Un moniteur de FPS en vanilla reprend les paramètres de drei et se fige après 3 allers-retours. Il baisse d'abord le DPR, puis retire l'iridescence, puis le sheen.
8. **Scroll.**
   - Lenis piloté par `gsap.ticker`, avec `lagSmoothing(0)` et `syncTouch: false`. Pas de `normalizeScroll`.
   - Passage du hero à la section suivante : une timeline et un seul `pin` court (`end: "+=80%"`, `scrub: 0.6`, valeurs de départ à ajuster). La planète recule et tourne, l'anneau s'incline et le H1 s'efface.
   - `ScrollTrigger.refresh()` après `document.fonts.ready`.
   - Aucune séquence d'images.
9. **Cycle de vie et accessibilité.**
   - Pause via `IntersectionObserver` et `visibilitychange`, avec pause du moniteur de FPS.
   - `dispose()` de toutes les ressources au démontage.
   - Sur `webglcontextlost`, retour au poster.
   - Un seul contexte WebGL pour tout le site.
   - Avec `reduceMotion` : ni intro, ni pin, ni Lenis, ni 3D. Au plus un fondu de 200 ms.
10. **Polices et validation.**
    - WOFF2 variable auto-hébergée, réduite au jeu latin, avec un fallback aux métriques ajustées (`size-adjust`, `ascent-override`) ([Chrome for Developers](https://developer.chrome.com/blog/font-fallbacks)).
    - Cibles : LCP ≤ 2,5 s au 75e centile sur mobile et 10 ms maximum par image.
    - Mesures sur un appareil de classe Moto G avec la build `web-vitals/attribution`, et tailles réelles des bundles vérifiées avec `rollup-plugin-visualizer`.

## Annexe

### Chiffres clés

| Sujet | Valeur | Source |
|---|---|---|
| Budget par image (RAIL) | ≤ 10 ms (plafond 16 ms) | [web.dev](https://web.dev/articles/rail) |
| Défauts de Lenis | lerp 0,1 ; `syncTouch: false` ; `autoRaf: false` | [Lenis](https://github.com/darkroomengineering/lenis) |
| ScrollTrigger | ease de snap par défaut `power3` ; `fastScrollEnd` à 2 500 px/s | [GSAP](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) |
| GPU Adreno | `mediump` jusqu'à 2× plus rapide et économe | [Utsubo](https://www.utsubo.com/blog/threejs-best-practices-100-tips) |
| Ombres sur fond blanc | 5 couches (1 à 16 px), alpha 0,075 chacune | [Josh Comeau](https://www.joshwcomeau.com/css/designing-shadows/) |
| Réduction des animations | supprimer parallaxe, zoom et révélations décoratives | [web.dev](https://web.dev/articles/prefers-reduced-motion) |

### Ce qui reste incertain

- **Valeurs d'intro** : aucune source primaire ne donne de timeline ni de stagger chiffrés pour les sites Apple ou Awwwards. Les articles Codrops ont renvoyé des erreurs 403.
- **Pages Apple actuelles** : on ne sait pas si elles utilisent encore des séquences JPG.
- **Révélations par masque ou transform** : leur éligibilité au LCP n'est confirmée par aucune source Chrome, d'où le test prévu à la décision 10. DebugBear et Chromium divergent aussi sur le moment où un élément en fondu devient candidat.
- **Taille de three.js** : les ~150 Ko en gzip viennent de mesures de forum sur d'anciennes versions.
- **Utsubo** : c'est un blog secondaire. Les dates des versions r183 à r186 sont incohérentes entre les sources.
- **Non vérifiés** :
  - le défaut `respectReducedMotion: true` de Lenis ;
  - le support de `deviceMemory` et de `navigator.connection` hors Chromium ;
  - la couverture de `KHR_parallel_shader_compile` sur les GPU Mali et Adreno ;
  - la nature exacte du support « partiel » d'OffscreenCanvas sur Safari 16.x.

### Sources

- [NN/g, Animation Duration](https://www.nngroup.com/articles/animation-duration/)
- [web.dev, RAIL](https://web.dev/articles/rail) · [LCP](https://web.dev/articles/lcp) · [prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion) · [OffscreenCanvas](https://web.dev/articles/offscreen-canvas)
- [Apple HIG, Motion](https://developer.apple.com/design/human-interface-guidelines/motion) · [WWDC23 « Animate with springs »](https://developer.apple.com/videos/play/wwdc2023/10158/)
- [easings.net (easings.yml)](https://raw.githubusercontent.com/ai/easings.net/master/src/easings.yml)
- [GSAP SplitText](https://gsap.com/docs/v3/Plugins/SplitText/) · [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) · [Erreurs ScrollTrigger](https://gsap.com/resources/st-mistakes/) · [gsap.matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/) · [Tarifs](https://gsap.com/pricing/) · [Licence standard](https://gsap.com/community/standard-license/)
- [Lenis (GitHub)](https://github.com/darkroomengineering/lenis) · [Bundlephobia gsap](https://bundlephobia.com/api/size?package=gsap) · [Bundlephobia lenis](https://bundlephobia.com/api/size?package=lenis) · [jsDelivr gsap 3.15.0](https://data.jsdelivr.com/v1/packages/npm/gsap@3.15.0?structure=flat)
- [CSS-Tricks, défilement façon Apple](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/) · [Chrome, animations pilotées par le scroll](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) · [Chrome, fallbacks de polices](https://developer.chrome.com/blog/font-fallbacks)
- [Josh W. Comeau, Designing Beautiful Shadows](https://www.joshwcomeau.com/css/designing-shadows/)
- [Changelog LCP de Chromium](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/lcp.md) · [DebugBear, opacité et LCP](https://www.debugbear.com/blog/opacity-animation-poor-lcp) · [Shopify Performance, transitions et LCP](https://performance.shopify.com/en-ca/blogs/blog/improve-largest-contentful-paint-lcp-by-removing-image-transitions)
- [caniuse requestIdleCallback](https://caniuse.com/requestidlecallback) · [caniuse OffscreenCanvas](https://caniuse.com/offscreencanvas)
- [three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) · [MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) · [Releases three.js](https://github.com/mrdoob/three.js/releases) · [Forum three.js, tree-shaking](https://discourse.threejs.org/t/what-is-the-state-of-tree-shaking/33168)
- [MDN KHR_parallel_shader_compile](https://developer.mozilla.org/en-US/docs/Web/API/KHR_parallel_shader_compile) · [MDN Navigator.deviceMemory](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory)
- [drei PerformanceMonitor](https://github.com/pmndrs/drei/blob/master/docs/performances/performance-monitor.mdx) · [Utsubo, 100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
