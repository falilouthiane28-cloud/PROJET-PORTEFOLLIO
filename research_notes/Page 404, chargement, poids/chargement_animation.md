# Animations d'entrée originales et tasteful (studios premium, 2026)

Portée : patterns de « loading / intro » pour sites de studio ou agence créative, sans retarder le LCP. Contexte Saturn (thème cosmique sombre, hero avec anneau SVG qui se dessine et titre masqué qui monte).

## 1. Patterns d'overlay de chargement en 2026

### Takeaway
Les loaders « premium » en 2026 délaissent le spinner et le skeleton générique au profit de quatre familles : compteur numérique 0→100, dessin de logo au stroke SVG, rideau coulissant (horizontal/vertical) et typographie masquée qui tombe en place. Le signal « éditorial / grille animée » est aussi en vogue sur les sites de studio dark.

### Cited Findings
- Awwwards maintient une section « Loading / Page loader » active en 2026 : AP Studio, Fourmula AI (GSAP), KR8 bureau, DNEG, Studio Flink (typo hero), Mammoth Murals, VBB Advisors, Kalso — [Awwwards – AP Studio loading](https://www.awwwards.com/inspiration/loading-page-animation-ap-studio) ; [Fourmula AI loading](https://www.awwwards.com/inspiration/loading-fourmula-ai) ; [KR8 bureau](https://www.awwwards.com/inspiration/kr8-bureau-loading-animation) ; [Studio Flink](https://www.awwwards.com/inspiration/loading-animation-studio-flink) ; [DNEG](https://www.awwwards.com/inspiration/loading-page-dneg-1) ; [Mammoth Murals](https://www.awwwards.com/inspiration/page-loader-mammoth-murals) ; [VBB Advisors – minimal load](https://www.awwwards.com/inspiration/minimal-load-screen-vbb-advisors) ; [Kalso](https://www.awwwards.com/inspiration/kalso-loading-page).
- « A clean editorial preloader can completely change how a website feels before users even see the actual content » – flexible pour fashion / portfolio / luxe – [Framer Marketplace, Editorial preloader](https://www.framer.com/community/marketplace/components/editorial-preloader/).
- Tendance observée : « animated vertical and horizontal lines to construct a grid in real time, revealing rotating image containers » — [globaldev.tech – 30 captivating preloaders](https://globaldev.tech/blog/30-most-captivating-preloaders-for-website).
- Intros primées 2026 utilisant Webflow + Three.js + GSAP + WebGL : Sleep Well Creative, Tokyo Beast, Radical Face (preloader) — [Awwwards intros](https://www.awwwards.com/inspiration/intro-animation-tokyo-beast).
- Technique SVG stroke-dashoffset : stroke-dasharray = longueur du chemin, offset qui descend vers 0 ; astuce `pathLength="1"` pour normaliser sans mesurer — [SitePoint / tillitsdone](https://tillitsdone.com/blogs/css-property-stroke-dashoffset) ; [Codrops – Page Preloading Effect](https://tympanus.net/codrops/?p=19535).
- Masked word reveal typique : durée 0,7–0,9 s, stagger 0,025–0,045 s par mot, easing `power3.out` / `expo.out` — [userevidence.com – GSAP animated texts](https://userevidence.com/gsap-animated-texts/).

### Inferences
- Pour un thème cosmique, le « compteur 0→100 » gagne à être réinterprété (ex. compteur positionné dans la couronne de Saturne, ou en vernier typographique très fin dans un coin) plutôt que repris tel quel ; inférence basée sur la saturation du pattern Awwwards.
- Le pattern « ligne qui dessine une grille » (globaldev) s'adapte au tracé de l'anneau SVG déjà prévu : on peut unifier dessin de l'anneau + géométrie planétaire comme loader-signature.

### Gaps
- Durées moyennes précises des 10 loaders Awwwards cités (les pages ont été fetchées, l'extrait ne contenait que des métadonnées, pas la vidéo).

## 2. Comment ces patterns évitent de retarder le LCP

### Takeaway
La règle d'or confirmée : l'élément candidat au LCP (ici le titre ou Saturne) ne doit **jamais** démarrer à `opacity: 0`. Chrome exclut explicitement les éléments à opacité nulle de la mesure LCP, ce qui peut doubler ou tripler le score.

### Cited Findings
- « Chrome excludes elements with opacity: 0 from LCP candidacy… the browser waits until the element repaints at a non-zero opacity before recording the LCP event. » — [Shopify – Don't hide LCP behind animations](https://shopify.dev/docs/storefronts/themes/best-practices/performance/dont-hide-lcp-image-behind-animations).
- Études de cas : retrait d'une transition d'entrée a fait passer le LCP mobile de 3,6 s à 2,2 s ; une animation sur titre / logo / image peut coûter « 650 à 900 ms de LCP » — [Shopify, même source](https://shopify.dev/docs/storefronts/themes/best-practices/performance/dont-hide-lcp-image-behind-animations).
- Un preloader qui tourne 1,5 s = 1,5 s de pénalité LCP garantie à chaque chargement — [WebPageTest forum, Animation delaying LCP](https://forums.webpagetest.org/t/animation-delaying-rendering-of-lcp/11445).
- Patterns « sûrs » recommandés : CSS `@keyframes` (démarre dès le premier rendu, l'opacité ne reste jamais à 0 au moment du paint), événement `pagereveal`, déclenchement via `image.onload` plutôt que `DOMContentLoaded`, exempter l'élément LCP de l'animation, garder la durée sous 0,3 s — [Shopify](https://shopify.dev/docs/storefronts/themes/best-practices/performance/dont-hide-lcp-image-behind-animations).
- `display: none` toggled via JS = pire cas (recalcul de layout + CLS) — même source.

### Inferences
- Pour Saturn, le pattern « veil radial qui s'ouvre » est safe à condition : (a) le titre reste rendu dessous dès le premier paint (jamais `opacity: 0`), (b) l'overlay a `pointer-events: none` et une transition ≤ 300 ms, (c) l'anim démarre via `@keyframes` ou `pagereveal`, pas via un `onload` JS tardif.
- Un overlay plein écran qui couvre le titre pendant plus de ~400 ms disqualifiera le budget LCP ≤ 2,0 s à la moindre latence mobile.

### Gaps
- Pas trouvé de valeur chiffrée pour `pagereveal` (support navigateur et pénalité LCP) dans les sources interrogées.

## 3. Ce qui est « frais » en 2026 pour marques cosmiques / éditoriales

### Takeaway
Les loaders « spinner » et « skeleton » sont considérés datés. Le signal 2026 : loader-signature cohérent avec l'esthétique (grille éditoriale animée, dessin de logo, compteur typographique fin, bruit / shader subtil) qui fait partie intégrante de l'intro hero plutôt qu'un sas antérieur.

### Cited Findings
- « Complex loader animations haven't been popular for a while because they used to slow down the page's loading process, however, with processing power increasing, the era of simple loaders is coming to an end. » — [globaldev.tech](https://globaldev.tech/blog/30-most-captivating-preloaders-for-website).
- Preloaders éditoriaux : « premium, editorial feel and create smooth transitions that reinforce structured, grid-based design systems » — [Framer Marketplace](https://www.framer.com/marketplace/components/editorial-preloader/).
- Exemples 2026 avec shader / no-code shader comme pré-loader — [Awwwards – No-code shader preloader](https://www.awwwards.com/inspiration/pre-loader-no-code-shader-2) ; [The Future Label](https://www.awwwards.com/inspiration/pre-loader-the-future-label).

### Inferences
- Pour Saturn, « original » = ne pas afficher de pourcentage de chargement si le site charge < 2 s (ce serait un placebo). Préférer un dévoilement progressif piloté par les ressources réelles (fonts + image hero) et scellé par le dessin de l'anneau.

### Gaps
- Pas de source quantifiée récente sur la perception utilisateur « loader vs pas de loader » en 2026.

## 4. Détecter la fin réelle du chargement

### Takeaway
L'API `document.fonts.ready` combinée à `img.decode()` et un `Promise.all` donne un signal fiable ; prévoir un timer plafond (fallback) de 1,2–1,5 s pour ne pas bloquer sur un réseau lent.

### Cited Findings
- `document.fonts.ready` est une Promise résolue quand toutes les polices sont chargées et le layout mis à jour — [MDN – CSS Font Loading API](https://developer.mozilla.org/it/docs/Web/API/CSS_Font_Loading_API).
- Le callback de `document.fonts.ready.then(…)` est invoqué immédiatement si aucun chargement en cours — [w3.org list, Tab Atkins](https://lists.w3.org/Archives/Public/www-style/2016Feb/0152.html).

### Inferences
- Recette type pour Saturn :
  ```js
  const timeout = new Promise(r => setTimeout(r, 1200));
  const heroImg = document.querySelector('#saturne').decode().catch(() => {});
  const ready = Promise.all([document.fonts.ready, heroImg]);
  Promise.race([ready, timeout]).then(startIntro);
  ```
- Timer plafond nécessaire pour respecter LCP ≤ 2,0 s même sur mobile bridé.

### Gaps
- Pas de donnée mesurée sur le temps typique de `document.fonts.ready` quand les woff2 sont préchargés avec `rel="preload"`.

## 5. Afficher à chaque visite, premier visit, ou connexion lente ?

### Takeaway
Les plugins pros proposent 3 modes et le consensus : « once per session » (via `sessionStorage`) est le réglage par défaut recommandé. Combiner avec `navigator.connection.effectiveType` pour afficher un loader seulement sur `3g` / `slow-2g` est faisable mais rare.

### Cited Findings
- `sessionStorage` persiste tant que l'onglet reste ouvert ; `localStorage` tant que le navigateur n'est pas quitté — [SitePoint community, splash preloader once per visit](https://www.sitepoint.com/community/t/display-splash-preloader-screen-once-per-visit/266148).
- Pattern : `if (!sessionStorage.isVisited) { sessionStorage.isVisited = 'true' }` — [Pinegrow forum, interaction on first visit](https://forum.pinegrow.com/t/have-pinegrow-interaction-run-only-on-first-visit/4713).
- Plugins (LoftLoader) offrent explicitement l'option « once per session » — [LoftLoader docs](https://loftocean.com/doc/loftloader/display-on/).
- `navigator.connection.type` peut être lu pour décider de précharger ou non selon le réseau — [web.dev – fast playback with preload](https://web.dev/articles/fast-playback-with-preload?hl=zh-cn).

### Inferences
- Pour Saturn : loader-intro à la première visite de la session (`sessionStorage`), et pour les retours directs sur l'ancre `#...`, ne lancer que le micro-reveal du titre (pas l'anneau complet). Inférence basée sur UX des exemples Awwwards vus (non confirmée par la source).

### Gaps
- Pas trouvé d'étude A/B publique sur l'impact bounce rate « loader à chaque visite » vs « first visit only ».

## 6. WCAG 2.2.1 (Timing Adjustable) + prefers-reduced-motion

### Takeaway
WCAG 2.2.1 ne s'applique **pas** à un loader < 20 h en soi, mais le vrai critère pour un sas d'entrée est 2.2.2 (Pause/Stop/Hide) si l'animation dépasse 5 s, et 2.3.3 (Animation from Interactions) pour les mouvements non essentiels. `prefers-reduced-motion: reduce` doit couper l'intro et montrer le contenu immédiatement.

### Cited Findings
- WCAG 2.2.1 Timing Adjustable (Level A) : pour toute limite de temps posée par le contenu, l'utilisateur doit pouvoir la désactiver, l'ajuster (×10) ou l'étendre. Exceptions : temps-réel, essentiel, > 20 h. — [W3C WAI – Understanding SC 2.2.1](https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable).
- WCAG 2.2.2 Pause/Stop/Hide s'applique à tout mouvement, clignotement, scroll ou mise à jour auto durant **plus de 5 secondes** — [blog.pope.tech – Design accessible animation](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/).
- WCAG 2.3.3 (AAA) : les animations déclenchées par interaction utilisateur doivent pouvoir être désactivées sauf si essentielles — même source.
- « Allow critical feedback animations (loading spinners, drag previews) to continue at a subtler amplitude when reduced motion is on — they convey function, not flourish » — [blog.pope.tech](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/).

### Inferences
- Pour Saturn, intro ≤ 2,5 s = sous le seuil des 5 s donc 2.2.2 ne mord pas, mais prudence : si la perception subjective dépasse 5 s (chargement lent + intro), prévoir un échappement clavier (Esc) qui saute l'intro et replace le focus sur `#main`.
- En `prefers-reduced-motion: reduce` : zéro overlay, zéro veil radial, zéro dessin d'anneau — titre et Saturne sont déjà peints au premier paint, cohérent avec la règle projet « titre ne démarre jamais à opacité 0 ».

### Gaps
- Pas de jurisprudence récente spécifique aux preloaders de site vitrine sur la conformité WCAG.

## 7. Exemples live vérifiés (sites réels)

### Takeaway
Les pages Awwwards fetchées renvoient surtout des métadonnées (pas l'anim détaillée). Les descriptions ci-dessous combinent le listing Awwwards 2026 et des caractéristiques génériques du pattern — les URLs permettront au rédacteur de rapport de visionner la vidéo. Je marque chaque élément « cité » quand issu de la source, ou « inféré » sinon.

### Cited Findings
- **Studio Flink – Loading animation** : loader couplé à la typographie du hero (le loader et le H1 ne font qu'un) — [Awwwards](https://www.awwwards.com/inspiration/loading-animation-studio-flink).
- **Fourmula AI – Loading** : loader construit avec GSAP — [Awwwards](https://www.awwwards.com/inspiration/loading-fourmula-ai).
- **DNEG – Loading page** : loader + transition de page + animation d'accueil pensés comme un seul mouvement — [Awwwards](https://www.awwwards.com/inspiration/loading-page-dneg-1).
- **KR8 bureau** : loader de bureau de design (CH / AT) — [Awwwards](https://www.awwwards.com/inspiration/kr8-bureau-loading-animation) ; site live [www.kr8bureau.at](https://www.kr8bureau.at).
- **AP Studio – Loading page animation** — [Awwwards](https://www.awwwards.com/inspiration/loading-page-animation-ap-studio).
- **Radical Face – Intro / pre-loader** — [Awwwards](https://www.awwwards.com/inspiration/intro-animation-radical-face).
- **Sleep Well Creative – Intro animations** (Webflow + Three.js + GSAP + WebGL) — [Awwwards](https://www.awwwards.com/inspiration/intro-animations-sleep-well-creative).
- **The Future Label – Pre-loader** — [Awwwards](https://www.awwwards.com/inspiration/pre-loader-the-future-label).
- **Mammoth Murals – Page loader** — [Awwwards](https://www.awwwards.com/inspiration/page-loader-mammoth-murals).

### Inferences (patterns typiques observés dans la catégorie, non vérifiés site par site faute d'accès vidéo)
- Durée moyenne d'un loader « premium » Awwwards : 1,2–2,8 s ; au-delà on perd le badge « Honor » sur mobile faute de LCP.
- Le pattern dominant 2026 sur sites de studio : compteur ou mot-clé qui s'inscrit en typographie corpulente, puis bascule en rideau vertical qui révèle le hero.

### Gaps
- Je n'ai pas pu décrire précisément les 8 exemples (vidéos derrière un lecteur Awwwards non consultable via WebFetch). Le rédacteur devrait les ouvrir pour vérifier.

## 8. Articulation avec l'intro hero existante (veil + anneau + mots)

### Takeaway
Deux options cohérentes, une à préférer : **séquence unifiée** où l'overlay et l'intro hero sont les deux moitiés d'une même timeline, le passage étant un cross-fade de 150 ms ; **deux phases** si et seulement si l'anneau nécessite d'être pleinement initialisé après la fin du préchargement.

### Cited Findings
- GSAP timeline pour hero combine background scale + title opacity/y + subtitle + CTA en stagger, défaut `power3.out` — [userevidence.com, GSAP animated texts](https://userevidence.com/gsap-animated-texts/).
- Les mots qui montent d'un masque : durée 0,7–0,9 s, stagger 0,025–0,045 s par mot — même source.

### Inferences (recommandations spécifiques Saturn)
- **Option unifiée (recommandée)** :
  1. 0–200 ms : `@keyframes` CSS fait apparaître Saturne et le titre déjà positionnés (opacité full dès le premier paint). Overlay-signature = fond cosmique très sombre déjà peint (donc LCP = Saturne, pas l'overlay).
  2. 200–700 ms : compteur fin (`03 → 100`) ou mot-de-passe (ex. « Préparation du système solaire ») apparaît en haut à gauche en typographie fine, et le veil radial commence à s'ouvrir depuis le centre de Saturne (via `clip-path: circle()` qui s'agrandit — pas d'opacité).
  3. 700–1800 ms : l'anneau SVG se dessine (`stroke-dashoffset` → 0, `pathLength="1"`), les mots du titre « respirent » (micro-translation Y + mask-reveal). Le compteur atteint 100 et disparaît.
  4. 1800–2500 ms : les 4 planètes commencent leurs orbites, Lenis est armé, et la nav devient interactive.
- **Clé anti-LCP** : l'overlay n'est jamais au-dessus du titre. Il est **sous** le titre dans la pile Z, ou en `pointer-events:none; mix-blend-mode: screen` qui ne cache rien visuellement. Le titre est peint à 100 % d'opacité à t=0.
- Fallback `prefers-reduced-motion: reduce` : étapes 1 et 4 uniquement (statique → nav armée), zéro mouvement intermédiaire.
- Fallback timeout : si fonts ou image hero > 1,2 s, démarrer l'intro quand même ; le dessin de l'anneau tolère un démarrage légèrement avant la fin de `decode()`.

### Gaps
- Pas de données chiffrées trouvées sur l'impact d'un `clip-path: circle()` animé sur le LCP (inférence : non-pénalisant car l'élément dessous est déjà peint, mais à mesurer avec `test:perf`).

## Sources

- [Awwwards – Loading inspiration (AP Studio, Fourmula, KR8, DNEG, Studio Flink, etc.)](https://www.awwwards.com/inspiration/loading-page-animation-ap-studio)
- [Shopify – Don't hide LCP image behind animations](https://shopify.dev/docs/storefronts/themes/best-practices/performance/dont-hide-lcp-image-behind-animations)
- [WebPageTest forum – Animation Delaying LCP](https://forums.webpagetest.org/t/animation-delaying-rendering-of-lcp/11445)
- [MDN – CSS Font Loading API](https://developer.mozilla.org/it/docs/Web/API/CSS_Font_Loading_API)
- [W3C WAI – Understanding SC 2.2.1 Timing Adjustable](https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable)
- [blog.pope.tech – Design accessible animation (2025)](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)
- [Codrops – Page Preloading Effect](https://tympanus.net/codrops/?p=19535)
- [tillitsdone – stroke-dashoffset](https://tillitsdone.com/blogs/css-property-stroke-dashoffset)
- [Framer Marketplace – Editorial preloader](https://www.framer.com/community/marketplace/components/editorial-preloader/)
- [globaldev.tech – 30 captivating preloaders](https://globaldev.tech/blog/30-most-captivating-preloaders-for-website)
- [SitePoint community – splash preloader once per visit](https://www.sitepoint.com/community/t/display-splash-preloader-screen-once-per-visit/266148)
- [userevidence.com – GSAP animated texts](https://userevidence.com/gsap-animated-texts/)
