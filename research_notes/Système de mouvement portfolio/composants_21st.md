# Composants 21st.dev à porter en vanilla JS + CSS (portfolio studio sombre, one-page)

Contexte : site sans React/Tailwind. On porte des idées et des techniques, pas du code. Sections cibles : hero, bande marquee, grille projets (images), services, méthode/étapes, studio/à propos + chiffres, FAQ, CTA contact WhatsApp, footer.

Note de méthode : le connecteur MCP 21st (recherche/obtention de code) demandait une authentification et n'a pas pu être utilisé. Les recherches passent par les pages publiques 21st.dev, le blog 21st.dev (qui analyse ses propres composants), et le dépôt GitHub de Magic UI (source des composants `@dillionverma` publiés sur 21st.dev). Les sources du blog 21st.dev sont « de première main » mais éditoriales (la plateforme fait la promotion de son catalogue).

## Candidats : quoi, URL, technique, place sur le site, coût en vanilla

### Takeaway
Une liste courte de 10 candidats couvre toutes les sections : text reveal par mot au scroll, magnetic button (CTA), spotlight card (services/projets), number ticker (stats), marquee CSS, border beam (un seul CTA), accordéon FAQ en CSS natif, scroll progress en CSS, tilt card léger (projets, optionnel), curseur custom (optionnel, à éviter en général). Presque tous se réduisent à « une variable CSS écrite depuis un seul listener » ou « une animation CSS pure ».

### Cited Findings

**1. Text Reveal (mot par mot au scroll), Magic UI / dillionverma**
- URL : https://21st.dev/@dillionverma/components/text-reveal — décrit comme « fade in text as you scroll down the page » — [Magic UI docs](https://magicui.design/docs/components/text-reveal)
- Technique source : section `h-[200vh]` contenant un bloc `sticky top-0` ; le texte est coupé en mots (`children.split(" ")`), chaque mot i reçoit une plage `[i/n, (i+1)/n]` de `scrollYProgress` (Motion `useScroll({target})`) mappée vers l'opacité via `useTransform` ; chaque mot a une copie fantôme `opacity-30` en dessous pour garder la mise en page — [source GitHub text-reveal.tsx](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/text-reveal.tsx)
- Variantes 21st : « Scroll word reveal » issu du catalogue d'exemples officiel Motion (https://21st.dev/@motiondotdev/components/motion-scroll-word-reveal) et « Text Reveal » de ddoemonn (mot ou caractère, flou + glissement en décalé, déclenché à l'entrée dans le viewport) (https://21st.dev/@ddoemonn/components/text-reveal) — [WebSearch 21st.dev](https://21st.dev/community/components/s/text-animation)
- Bonnes pratiques scroll du blog 21st : préférer IntersectionObserver ou `animation-timeline: view()` aux listeners de scroll ; le texte doit exister dans le HTML (à `opacity:0`), pas être injecté par JS ; ne pas lire `getBoundingClientRect` dans un handler de scroll ; les sections épinglées (pin) sont « là où les pages pilotées au scroll commencent à paraître fausses » — [21st.dev blog, scroll animations](https://21st.dev/blog/react-scroll-animation-components)
- Équivalents vanilla : Codrops ScrollBlurTypography (https://github.com/codrops/ScrollBlurTypography/), SlicedTextEffect (https://github.com/codrops/SlicedTextEffect), et démos GSAP SplitText + ScrollTrigger (GSAP est devenu 100 % gratuit) — [Codrops, mai 2025](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/) ; tinkerfx « split text reveal on scroll, in CSS & JS » (https://tinkerfx.com/effects/split-reveal) — [WebSearch](https://tinkerfx.com/effects/split-reveal)
- Motion (vanilla) propose `scroll()` (~5,1 ko) qui utilise ScrollTimeline « where possible » pour l'accélération matérielle, et `inView()` construit sur IntersectionObserver — [motion.dev/docs/scroll](https://motion.dev/docs/scroll)

**2. Magnetic Button (CTA WhatsApp, bouton hero)**
- URLs : Magnetic (ibelick) https://21st.dev/@ibelick/components/magnetic ; Magnetic Button (bundui) https://21st.dev/@bundui/components/magnetic-button ; Fluid Magnetic Cursor (easemize) https://21st.dev/@easemize/components/magnetic-cursor — [21st.dev blog, magnetic](https://21st.dev/blog/react-magnetic-cursor-effects)
- Technique : mesurer le centre de l'élément, translater l'élément d'une fraction de la distance au pointeur tant qu'il est dans un rayon ; un seul `mousemove` sur le conteneur parent ; `translate3d` (reste sur le compositeur) ; retour par ressort/easing — [21st.dev blog](https://21st.dev/blog/react-magnetic-cursor-effects)
- Déplacement recommandé : « pas plus d'environ vingt pixels », sinon l'élément semble décollé de sa zone cliquable — [21st.dev blog](https://21st.dev/blog/react-magnetic-cursor-effects)
- A11y : aucun effet au tactile, l'élément doit fonctionner sans ; couper le listener sous `prefers-reduced-motion: reduce` ; un seul élément magnétique est négligeable, une grille de vingt cartes devient un problème de budget frame — [21st.dev blog](https://21st.dev/blog/react-magnetic-cursor-effects)

**3. Spotlight Card / Magic Card (services, cartes projets)**
- URLs : Spotlight Card (easemize, « le composant carte le plus mis en favori du catalogue ») https://21st.dev/@easemize/components/spotlight-card ; Card Spotlight (Aceternity / manuarora700) https://21st.dev/@manuarora700/components/card-spotlight ; Magic Card (Magic UI) https://21st.dev/@dillionverma/components/magic-card — [21st.dev blog spotlight](https://21st.dev/blog/react-spotlight-effect-components) ; [liste Magic UI sur 21st](https://21st.dev/@dillionverma/library/magic-ui)
- Technique recommandée : deux variables CSS `--x`/`--y` + `radial-gradient(400px circle at var(--x) var(--y), rgb(255 255 255 / .08), transparent 40%)` sur un pseudo-élément ; le handler écrit directement la variable (écriture de style, pas d'état) — [21st.dev blog spotlight](https://21st.dev/blog/react-spotlight-effect-components)
- Les trois sources de surcoût (« twenty times the cost ») : suivi via état React (re-render par frame), un listener par carte au lieu d'un seul sur le conteneur, empilement avec backdrop-blur et bordures animées — [21st.dev blog spotlight](https://21st.dev/blog/react-spotlight-effect-components)
- L'effet ne marche que sur fond sombre (il ajoute de la lumière ; sur blanc c'est une « tache grise »), disparaît au tactile, à couper sous reduced-motion — [21st.dev blog spotlight](https://21st.dev/blog/react-spotlight-effect-components)
- Magic Card : `onPointerMove` → `clientX - rect.left`, gradient radial de 200 px par défaut, deux couches (bordure + remplissage à `inset-px`), au `pointerleave` le gradient est repoussé hors champ (`-gradientSize`), reset aussi sur perte de focus/visibilité — [source magic-card.tsx](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/magic-card.tsx)

**4. Number Ticker (stats du studio)**
- URL : https://21st.dev/@dillionverma/components/number-ticker — [liste Magic UI](https://21st.dev/@dillionverma/library/magic-ui)
- Technique source : `useInView(ref, {once:true})` déclenche, une `useSpring` (damping 60, stiffness 100) interpole la valeur, chaque changement écrit `textContent` formaté par `Intl.NumberFormat` ; classe `tabular-nums` pour éviter que la largeur saute — [source number-ticker.tsx](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/number-ticker.tsx)

**5. Marquee (bande marquee, logos/clients)**
- URL : https://21st.dev/@dillionverma/components/marquee ; autres : 3D Marquee (Aceternity) https://21st.dev/community/components/aceternity/3d-marquee ; catalogue de 113+ marquees https://21st.dev/community/components/s/marquee — [WebSearch 21st](https://21st.dev/community/components/s/marquee)
- Technique source : contenu répété 4 fois par défaut, keyframes CSS pilotées par `--duration: 40s` et `--gap: 1rem`, `pauseOnHover` via `animation-play-state: paused`, option verticale ; aucune gestion ARIA ni `prefers-reduced-motion` intégrée — [source marquee.tsx](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/marquee.tsx)
- Variante liée à la vitesse de scroll : « Scroll Based Velocity » https://21st.dev/@dillionverma/components/scroll-based-velocity — [liste Magic UI](https://21st.dev/@dillionverma/library/magic-ui)

**6. Border Beam / Shine Border (un seul CTA ou une carte vedette)**
- URLs : Border Beam (Magic UI) https://21st.dev/@dillionverma/components/border-beam ; Border Beam (Jakubantalik, tracé en conic-gradient, vitesse/couleur/pause configurables) https://21st.dev/@Jakubantalik/components/border-beam ; Shine Border https://21st.dev/@dillionverma/components/shine-border — [WebSearch 21st](https://21st.dev/@Jakubantalik/components/border-beam)
- Technique source Magic UI : un calque `absolute inset-0` avec bordure transparente et masque double `linear-gradient` en `mask-composite: intersect` + `mask-clip: padding-box, border-box` (seul l'anneau de bordure est visible) ; à l'intérieur, un carré en dégradé suit `offset-path: rect(0 auto auto 0 round <size>px)` et anime `offset-distance` de 0 % à 100 % en boucle linéaire (6 s par défaut) — [source border-beam.tsx](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/border-beam.tsx)
- Le parent doit être `relative` + `overflow-hidden` — [Magic UI docs](https://magicui.design/docs/components/border-beam)

**7. Accordéon FAQ animé**
- URLs : Accordion (ddoemonn, accessible, ressort, hauteur auto mesurée) https://21st.dev/@ddoemonn/components/accordion ; FAQ (kokonutd) https://21st.dev/@kokonutd/components/faq ; FAQ Chat Accordion (Framer Motion) https://21st.dev/community/components/anshuman008/faq-chat-accordion — [WebSearch 21st](https://21st.dev/community/components/s/accordion) ; [21st.dev blog FAQ](https://21st.dev/blog/react-faq-accordion-components)
- Recommandations : `<details>/<summary>` = zéro JS, sémantique native ; animer sans mesurer via `grid-template-rows: 0fr → 1fr` ou `interpolate-size: allow-keywords` ; bouton réel dans un titre avec `aria-expanded`/`aria-controls` ; ne pas laisser de liens invisibles dans l'ordre de tabulation ; JSON-LD FAQPage identique au texte visible, contenu présent dans le HTML — [21st.dev blog FAQ](https://21st.dev/blog/react-faq-accordion-components)
- `interpolate-size` et `calc-size()` : Chrome/Edge 129+, pas Firefox ni Safari (au moment de l'article) ; sur `<details>`, n'anime que l'ouverture tant que `::details-content` n'est pas utilisé — [Chrome for Developers](https://developer.chrome.com/docs/css-ui/animate-to-height-auto)

**8. Scroll progress (barre de lecture, ou progression dans la section Méthode)**
- `animation-timeline: scroll()` pour une barre de progression globale, `view()` pour la position d'un élément dans le viewport ; Chrome/Edge depuis 115, Safari 26 (sept. 2025), Firefox encore derrière un flag ; détecter avec `CSS.supports("animation-timeline: scroll()")` et repli sur barre statique ou listener limité — [MDN / résultats de recherche](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline) ; [MDN blog](https://developer.mozilla.org/en-US/blog/scroll-progress-animations-in-css)

**9. Tilt Card (grille projets, optionnel)**
- URL : Tilt Card (tom_ui) https://21st.dev/@tom_ui/components/tilt-card — tilt 3D au curseur + perspective + spotlight, uniquement en transforms CSS sans librairie — [WebSearch 21st](https://21st.dev/@tom_ui/components/tilt-card) ; catalogue 95+ tilts https://21st.dev/community/components/s/tilt

**10. Curseur custom (optionnel, probablement à éviter)**
- URLs : Morphing Cursor (Jatin Yadav), Fluid Magnetic Cursor (easemize), Text Cursor Proximity (danielpetho), Custom Cursor https://21st.dev/@designali-in/components/custom-cursor, Cursor (motion-primitives) https://21st.dev/motion-primitives/cursor — [21st.dev blog cursor](https://21st.dev/blog/custom-cursor-react)
- Implémentation : élément `position: fixed`, `pointermove` sur window, coordonnées dans une ref écrites dans `transform` à l'intérieur d'un rAF ; `pointer-events: none` + `aria-hidden` — [21st.dev blog cursor](https://21st.dev/blog/custom-cursor-react)
- Quand s'en passer : tactile (ne pas monter sans `matchMedia("(pointer: fine)")`), interfaces denses (perte des signaux d'affordance), `cursor: none` supprime des aides OS (pointeur agrandi, contraste, « shake-to-find »), reduced-motion (retirer l'interpolation) — [21st.dev blog cursor](https://21st.dev/blog/custom-cursor-react)

**Autres composants repérés (non approfondis)** : Animated Shiny Text, Shimmer Button, Shiny Button, Blur Fade, Word Rotate, Bento Grid, Progressive Blur, Sticky Scroll Reveal (Aceternity, https://21st.dev/community/components/aceternity/sticky-scroll-reveal), Container Scroll Animation, Hero Parallax, Zoom Parallax — [liste Magic UI](https://21st.dev/@dillionverma/library/magic-ui) ; [21st.dev blog scroll](https://21st.dev/blog/react-scroll-animation-components)

### Inferences
Estimations de coût en vanilla (mes estimations, non sourcées, à partir des sources ci-dessus) :

| # | Effet | Section | Technique vanilla | JS estimé | Coût runtime | Reduced-motion / a11y |
|---|---|---|---|---|---|---|
| 1 | Text reveal par mot | Studio/à propos (manifeste), intro Méthode | Mots enveloppés en `<span>` au build ou au chargement ; CSS `animation-timeline: view()` + `animation-range` décalé par `--i`, repli IO qui ajoute une classe | 20-40 lignes | faible (opacité seulement) | texte entier visible immédiatement ; `aria-label` ou texte d'origine conservé pour les lecteurs d'écran si on découpe |
| 2 | Magnetic button | CTA WhatsApp, bouton hero | un `pointermove` délégué, lerp en rAF, `translate3d` plafonné à ~20 px | 30-50 lignes | négligeable pour 1-3 éléments | désactivé si `pointer: coarse` ou reduced-motion |
| 3 | Spotlight card | Services, cartes projets | 1 listener sur la grille, écrit `--x/--y` sur la carte survolée ; `::before` en radial-gradient | 15-25 lignes | faible si un seul listener et pas de blur | sans effet au tactile ; hover/focus doit avoir un état visible indépendant |
| 4 | Number ticker | Stats studio | IO `once`, rAF avec easing (pas besoin de ressort), `Intl.NumberFormat('fr-FR')`, `font-variant-numeric: tabular-nums` | 25-35 lignes | négligeable | afficher la valeur finale directement ; valeur finale dans le HTML pour SEO/lecteurs d'écran |
| 5 | Marquee | Bande marquee | 100 % CSS : piste dupliquée ×2, `translateX(-50%)` en keyframes, `--duration`/`--gap` | 0-10 lignes (dupliquer le contenu) | faible (transform) | copie dupliquée en `aria-hidden` ; pause sous reduced-motion ; bouton pause conseillé si > 5 s (WCAG 2.2.2) |
| 6 | Border beam | Un seul CTA (contact) | 100 % CSS : masque + `offset-path: rect()` + `@keyframes offset-distance` ; repli `conic-gradient` + `@property --angle` | 0 ligne | faible, mais une animation infinie : la limiter à un élément | animation arrêtée sous reduced-motion |
| 7 | FAQ accordéon | FAQ | `<details name="faq">` + `interpolate-size`/`::details-content` en amélioration progressive, ou bouton + `grid-template-rows` | 0-30 lignes | négligeable | natif avec details ; JSON-LD FAQPage |
| 8 | Scroll progress | Global ou section Méthode (ligne qui se remplit entre étapes) | `animation-timeline: scroll()` / `view()`, `transform: scaleX/scaleY` ; repli statique | 0-10 lignes | quasi nul (compositeur) | purement décoratif, `aria-hidden` |
| 9 | Tilt card | Grille projets (optionnel) | `rotateX/rotateY` ±4-6° depuis `--x/--y` déjà calculés pour le spotlight | +10 lignes si mutualisé avec #3 | moyen avec des images (couche 3D par carte) | désactivé au tactile et sous reduced-motion |
| 10 | Curseur custom | (aucune recommandée) | fixed + rAF | 40-80 lignes | constant (rAF permanent) | risques a11y listés ci-dessus |

- Les candidats « goût sûr et bon marché » pour un studio sombre premium : 1, 2, 3, 4, 5, 7, 8. Tous reposent sur des variables CSS ou de l'animation CSS pure, et le spotlight est justement conçu pour fond sombre.
- À doser : border beam (n'en mettre qu'un), tilt (risque d'effet « gadget » sur des visuels de projets ; un tilt faible ou rien), text reveal « épinglé » 200vh à la Magic UI (préférer une version non épinglée liée au `view()` pour éviter l'effet de scroll piégé).
- Gadget / lourd à éviter : curseur custom, curseurs fluides (TubeCursor, Splash Cursor = simulation de fluide), particules, Globe, Warp Background, 3D Marquee, Hero Parallax.
- Mutualisation : un seul module « pointeur » (un listener `pointermove` délégué sur `document`, rAF unique) peut alimenter magnetic + spotlight + tilt, ce qui évite le piège « un listener par carte » signalé par 21st.

### Gaps
- Le MCP 21st nécessitait une authentification : je n'ai pas pu lire le code source des composants hors Magic UI (easemize Spotlight Card, tom_ui Tilt Card, ibelick Magnetic, ddoemonn Accordion). Leurs descriptions viennent des pages et du blog 21st.dev.
- Aucun composant 21st.dev spécifique « lien souligné animé » ou « bento hover » n'a été examiné ; Bento Grid de Magic UI apparaît dans la liste mais sa technique n'a pas été lue.
- Les nombres de lignes de JS et coûts runtime sont des estimations personnelles, non mesurées.

## Lesquels sont sobres et bon marché vs gadgets/lourds ; lesquels dépendent de fonctions framer-motion difficiles à porter

### Takeaway
Très peu de ces composants dépendent réellement de framer-motion : la plupart utilisent Motion seulement pour `useInView`, `useSpring` ou `useScroll`/`useTransform`, qui se remplacent par IntersectionObserver, un lerp en rAF et les scroll-driven animations CSS. Les vrais points durs sont `layout`/`AnimatePresence` (animations de sortie et de layout), absents de la shortlist.

### Cited Findings
- Text Reveal Magic UI utilise `useScroll({target})` + `useTransform(progress, range, [0,1])` par mot — [source](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/text-reveal.tsx) ; l'équivalent natif `animation-timeline: view()` existe dans Chrome/Edge 115+ et Safari 26, pas encore dans Firefox stable — [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline)
- Number Ticker utilise `useInView` + `useSpring` (damping 60 / stiffness 100) et écrit directement `textContent` (pas de re-render) — [source](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/number-ticker.tsx)
- Border Beam n'utilise Motion que pour animer `offsetDistance` en boucle linéaire, ce que fait une `@keyframes` CSS — [source](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/border-beam.tsx)
- Marquee n'utilise aucun Motion : keyframes CSS + variables — [source](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/marquee.tsx)
- Magic Card utilise `useMotionTemplate` pour construire le `radial-gradient` ; le blog 21st recommande d'écrire directement une variable CSS — [source magic-card](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/magic-card.tsx) ; [21st.dev blog spotlight](https://21st.dev/blog/react-spotlight-effect-components)
- Accordéons 21st « spring-animated » avec hauteur mesurée — remplaçables par `grid-template-rows 0fr→1fr` ou `interpolate-size` — [21st.dev blog FAQ](https://21st.dev/blog/react-faq-accordion-components) ; [Chrome for Developers](https://developer.chrome.com/docs/css-ui/animate-to-height-auto)
- Le blog 21st déconseille les listeners de scroll par frame et le scroll « hijacké » (casse la navigation clavier et la recherche dans la page) — [21st.dev blog scroll](https://21st.dev/blog/react-scroll-animation-components)

### Inferences
- Portage facile (aucune dépendance difficile) : marquee, border beam, spotlight, scroll progress, FAQ (CSS seul) ; ticker et magnetic (remplacer `useSpring` par un lerp/ressort critique en ~10 lignes).
- Portage moyen : text reveal (découpage en mots + repli IO pour Firefox) ; tilt (mutualiser avec spotlight).
- Portage difficile ou à éviter : composants qui reposent sur `AnimatePresence`/`layout` (listes animées, morphing de layout, Word Rotate avec sortie animée), simulations WebGL/fluides (Splash Cursor, Globe, Particles).
- Si on veut une seule petite dépendance, Motion vanilla (`scroll()` ~5,1 ko, `inView()`, `animate()` avec ressorts) couvre text reveal, ticker et magnetic sans React — [motion.dev](https://motion.dev/docs/scroll). Sinon tout se fait sans librairie.

### Gaps
- Pas de mesure de performance chiffrée trouvée pour ces composants (les « vingt fois le coût » du blog 21st sont une formule de titre, pas un benchmark).
- Je n'ai pas vérifié la taille de bundle de `animate()`/`inView()` Motion vanilla séparément.

## Références vanilla équivalentes (Codrops, Motion, GSAP, CSS natif)

### Takeaway
Les références les plus utiles : scroll-driven animations CSS (MDN), `interpolate-size` (Chrome for Developers), Motion vanilla `scroll()`/`inView()`, et les dépôts Codrops pour les reveals typographiques (GSAP SplitText désormais gratuit).

### Cited Findings
- MDN `animation-timeline`, `scroll()`, `view()` et l'article MDN sur les barres de progression de scroll en CSS — [MDN animation-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline) ; [MDN scroll()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline/scroll) ; [MDN blog](https://developer.mozilla.org/en-US/blog/scroll-progress-animations-in-css) ; [ViewTimeline API](https://developer.mozilla.org/en-US/docs/Web/API/ViewTimeline)
- Animer vers `height: auto` (accordéons) : `interpolate-size`, `calc-size()`, `::details-content` — [Chrome for Developers](https://developer.chrome.com/docs/css-ui/animate-to-height-auto)
- Motion vanilla : `scroll()` (ScrollTimeline accéléré quand possible), `inView()` (IntersectionObserver) — [motion.dev/docs/scroll](https://motion.dev/docs/scroll)
- Codrops : 5 démos GSAP gratuites dont SplitText + ScrollTrigger — [Codrops 2025](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/) ; ScrollBlurTypography — [GitHub](https://github.com/codrops/ScrollBlurTypography/) ; SlicedTextEffect — [GitHub](https://github.com/codrops/SlicedTextEffect) ; galerie WebGL révélée au scroll (GSAP + Three.js, trop lourd ici mais utile pour la chorégraphie SplitText par lignes) — [Codrops 2026](https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/)
- tinkerfx « Split text reveal on scroll, in CSS & JS » — [tinkerfx](https://tinkerfx.com/effects/split-reveal)
- Tilt 3D vanilla HTML/CSS/JS (tutoriel DEV) — [DEV Community](https://dev.to/getcoderipple/how-to-build-a-3d-tilt-profile-card-with-html-css-javascript-4g2i)
- Accordéon accessible de référence (comportement ARIA) : shadcn/ui et Radix — [21st.dev blog FAQ](https://21st.dev/blog/react-faq-accordion-components)

### Inferences
- Le projet ayant déjà une scène hero dans un worker et une timeline maîtresse, il vaut mieux garder les effets de section en CSS natif + un petit module pointeur partagé, plutôt qu'ajouter GSAP ou Motion pour ces seuls effets.

### Gaps
- Pas de démo Codrops spécifique trouvée pour magnetic button ou number ticker dans cette session (ces tutoriels existent probablement mais n'ont pas été vérifiés).
- Pas de référence vanilla vérifiée pour les liens à soulignement animé (technique classique `background-size` ou `scaleX` sur `::after`, non sourcée ici).
