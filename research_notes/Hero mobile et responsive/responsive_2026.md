# Responsive « complet » en 2026 pour un portfolio premium d'une page (téléphones et tablettes)

Notes de recherche, 3 octobre 2026. Chaque affirmation est sourcée ; les inférences et la connaissance générale non vérifiée dans cette session sont signalées comme telles. Sources antérieures à 2023 signalées « [ancien] ».

## 1. Largeurs d'appareils à tester (monde, Afrique, Sénégal), tablettes, paysage, pliables

### Takeaway
Au Sénégal en septembre 2026, les viewports mobiles dominants sont 360×800, 414×896, 360×806, 385×854, 384×832 et 390×844 : 360, 384/385 et 414 doivent entrer dans la matrice, en plus de 320 (plancher) et 390. Côté tablette, 768×1024, 800×1280 et 820×1180 dominent dans le monde.

### Cited Findings
- **Sénégal, mobile, septembre 2026 :** 360×800 (14,3 %), 414×896 (12,16 %), 360×806 (11,53 %), 385×854 (10,62 %), 384×832 (7,23 %), 390×844 (4,64 %). — [StatCounter Sénégal mobile](https://gs.statcounter.com/screen-resolution-stats/mobile/senegal)
- **Afrique, mobile, septembre 2026 :** 360×800 (12,7 %), 384×832 (10,35 %), 414×896 (8,74 %), 385×854 (6,66 %), 360×806 (6,01 %), 412×915 (4,49 %). — [StatCounter Afrique mobile](https://gs.statcounter.com/screen-resolution-stats/mobile/africa)
- **Monde, mobile, septembre 2026 :** 414×896 (13,35 %), 360×800 (7,54 %), 384×832 (7,1 %), 390×844 (6,05 %), 393×873 (4,18 %), 360×780 (3,39 %). — [StatCounter monde mobile](https://gs.statcounter.com/screen-resolution-stats/mobile/worldwide)
- **Tablettes, monde, septembre 2026 :** 768×1024 (8,09 %), 800×1280 (7,86 %), 1280×800 (7,85 %), 820×1180 (5,06 %), 810×1080 (5,03 %), 601×1007 (3,29 %). — [StatCounter tablettes monde](https://gs.statcounter.com/screen-resolution-stats/tablet/worldwide)
- **Paysage :** 1280×800 en troisième position chez les tablettes ; le paysage n'est donc pas marginal. — [StatCounter tablettes monde](https://gs.statcounter.com/screen-resolution-stats/tablet/worldwide)

### Inferences
- **Matrice proposée** (inférence tirée des chiffres ci-dessus) :
  - téléphones : 320 (plancher, petits Android ou zoom texte), 360×800, 385×854, 390×844, 414×896, 412×915 ;
  - tablettes : 601×1007 (petite tablette Android ou pliable ouvert), 768×1024, 800×1280, 820×1180, 1024 ;
  - paysage téléphone : 800×360 et 896×414 ;
  - paysage tablette : 1280×800.
- **Écart avec les tests actuels :** la matrice (320, 390, 768, 1024, 1440, 1920) ne couvre pas 360, 384/385 ni 414, qui représentent ensemble plus de 50 % du trafic mobile sénégalais. Ajouter au minimum 360 et 414.
- **Hauteurs :** elles varient de 780 à 915 px en mobile portrait. Les mises en page épinglées ou plein écran (hero) doivent être vérifiées à 360×640 environ (barres de navigateur affichées) et en paysage, où la hauteur utile tombe sous 400 px.
- **Point de rupture 720 :** les tailles 384 et 385 se situent entre 360 et 390. Vérifier qu'aucun point de rupture intermédiaire (600, 720) ne bascule de façon inattendue à 601 (pliable ou petite tablette).

### Gaps
- Pas de statistiques spécifiques aux pliables (Galaxy Z Fold, environ 344 px plié et environ 690–884 px ouvert selon la connaissance générale, non sourcé ici).
- StatCounter mesure des résolutions CSS déclarées et non la hauteur réellement visible (les barres d'outils la réduisent).

## 2. Unités de viewport sur mobile : svh, lvh, dvh contre vh

### Takeaway
`100vh` correspond au grand viewport (barres masquées) : un hero à 100vh est rogné tant que la barre d'adresse est visible. Utiliser `svh` pour un hero qui doit tenir au premier affichage, `dvh` pour les modales et les panneaux plein écran dont le pied doit rester visible, et jamais `dvh` pour la typographie ni les propriétés recalculées pendant le scroll.

### Cited Findings
- **Définitions :**
  - `svh` correspond au viewport avec les barres du navigateur affichées ;
  - `lvh` correspond au viewport avec les barres rétractées, et `100lvh` équivaut à l'ancien `100vh` ;
  - `dvh` correspond à ce qui est visible à l'instant et se met à jour pendant que la barre glisse.
  — [modern-css.com](https://modern-css.com/articles/modern-css-units-you-should-know/)
- **Hero, écran de connexion, modale qui doivent tenir au premier affichage :** `svh`, le choix prudent qui ne déborde jamais. — [modern-css.com](https://modern-css.com/articles/modern-css-units-you-should-know/)
- **Recommandations d'Ahmad Shadeed** (juillet 2023) :
  - `svh` avec `calc()` pour soustraire la hauteur de l'en-tête dans un hero ;
  - `dvh` (ou `svh`) pour les modales à en-tête et pied collants ;
  - éviter `dvh` pour `font-size` : changement visuel « déroutant » pendant le scroll, et recalcul possiblement coûteux.
  — [ishadeed.com, New viewport units](https://ishadeed.com/article/new-viewport-units/)
- **iOS Safari, Chrome et Firefox Android :** `100vh` crée une zone de débordement invisible derrière l'interface du navigateur. — [ishadeed.com](https://ishadeed.com/article/new-viewport-units/)
- **Ancien bug Safari iOS :** il ne distinguait pas `svh` de `dvh`. Le bug est marqué RESOLVED FIXED. — [WebKit bug 261185](https://bugs.webkit.org/show_bug.cgi?id=261185)
- **Safari 26.1** (3 novembre 2025) corrige « un vide en bas sur les mises en page avec conteneurs fixes à la taille du viewport sur iOS ». — [WebKit, Safari 26.1](https://webkit.org/blog/17541/webkit-features-for-safari-26-1/)
- **Safari 26, éléments plein viewport en `fixed` ou `sticky` :** des problèmes sont signalés. — [Apple Discussions, viewport bug iOS 26](https://discussions.apple.com/thread/256138682) (fil d'utilisateurs, fiabilité moyenne).

### Inferences
- **Hero épinglé avec ScrollTrigger :**
  - utiliser `min-height: 100svh`, et garder `100vh` avant en repli, ligne précédente ;
  - éviter `dvh` sur un élément épinglé : chaque rétraction de la barre changerait sa hauteur, donc relancerait le calcul de l'épinglage et produirait un saut. C'est une inférence fondée sur l'avertissement de Shadeed sur les recalculs.
- **Modale vidéo `<dialog>` :** `max-height: 100dvh` (ou `90dvh`) pour que la fermeture reste atteignable quand la barre réapparaît.
- **Panneau 4:5 :** préférer `aspect-ratio` avec un `max-height` en `svh`, pour qu'il ne dépasse pas l'écran en paysage.

### Gaps
- Pas de mesure publiée récente du coût de `dvh` en performance.
- Comportement exact de Safari 26 (barre d'onglets « Liquid Glass » flottante) vis-à-vis de `svh` et `lvh` non documenté par WebKit dans les sources consultées.

## 3. Zones sûres (safe areas)

### Takeaway
`env(safe-area-inset-*)` ne vaut quelque chose que si la meta viewport contient `viewport-fit=cover`. La nav flottante, tout élément collé en bas et la feuille du menu mobile doivent ajouter l'inset à leur marge ou à leur padding, sans réduire la cible tactile. iOS 26 teinte ses barres selon le fond des éléments fixes.

### Cited Findings
- **Prérequis :** `viewport-fit=cover` dans `<meta name="viewport">` est nécessaire pour accéder aux insets. — [mohammadshehadeh.com, safe area insets](https://mohammadshehadeh.com/css/safe-area-insets/) ; [benfrain.com](https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/)
- **Élément fixe à `bottom: 0` :** il se place au bord du viewport, pas au bord de la zone sûre, et l'indicateur d'accueil peut le chevaucher. Solution : `padding-bottom: env(safe-area-inset-bottom)`. Ajouter du padding en plus (`calc(env(...) + 44px)`) pour garder une cible tactile suffisante. — [mohammadshehadeh.com](https://mohammadshehadeh.com/css/safe-area-insets/) ; [openreplay, 5 problèmes du web mobile](https://blog.openreplay.com/es/5-mobile-web-problemas-soluciones/)
- **iOS 26 Safari** (Ben Frain, 16 novembre 2025) :
  - la teinte du « front » et du « menton » vient du `background-color` du body, sauf quand un élément fixe est affiché : iOS prend alors la couleur de fond de cet élément ;
  - iOS 26 a abandonné la prise en charge de la meta `theme-color` ;
  - aucun contournement efficace ; un correctif est peut-être prévu en 26.2.
  — [benfrain.com](https://benfrain.com/ios26-safari-theme-color-tab-tinting-with-fixed-position-elements/)

### Inferences
- **Nav pilule fixe en haut :** `top: max(12px, env(safe-area-inset-top))`, et en paysage `padding-inline` avec `env(safe-area-inset-left/right)` (encoche latérale).
- **Feuille du menu mobile :** `padding-bottom: calc(24px + env(safe-area-inset-bottom))`.
- **Teinte des barres iOS 26 :** le body a un fond sombre explicite, mais une nav pilule fixe semi-transparente ou floutée pourrait faire teinter les barres d'une autre couleur. À vérifier sur un vrai iPhone.
- **Ajouter `viewport-fit=cover` :** c'est un changement global. Vérifier que rien ne passe sous l'encoche en paysage.

### Gaps
- Pas de confirmation WebKit officielle du correctif de teinte en 26.2.

## 4. Typographie : clamp(), champs de 16 px, mots français longs, text-wrap

### Takeaway
Combiner `overflow-wrap: anywhere` (ou `break-word`) et `hyphens: auto` avec `lang="fr"` pour empêcher les mots longs de déborder sur 320–360 px. `text-wrap: balance` pour les titres et `pretty` pour les paragraphes, en amélioration progressive.

### Cited Findings
- **`overflow-wrap` :** il autorise la coupure d'un mot autrement insécable pour éviter un débordement. `anywhere` diffère de `break-word` dans le calcul des tailles intrinsèques (min-content). — [CSS-Tricks, overflow-wrap](https://css-tricks.com/?p=250100) ; [MDN word-wrap / overflow-wrap](https://developer.mozilla.org/en/docs/Web/CSS/word-wrap)
- **`hyphens: auto` :** il dépend de la langue déclarée (`lang`) ; sans `lang`, pas de césure correcte. — [Stefan Judis, hyphenation et langue du document](https://www.stefanjudis.com/blog/automatic-hyphenation-depends-on-the-defined-document-language)
- **`text-wrap` :** Baseline « newly available » en 2024. `pretty` est pris en charge par Chrome et Edge, arrive dans Safari (Technology Preview, avril 2025), et n'est pas pris en charge par Firefox en septembre 2025. — [LogRocket, balance vs pretty](https://blog.logrocket.com/css-text-wrap-balance-vs-text-wrap-pretty/)

### Inferences
- **Mot-symbole géant en contour du footer et titres en `clamp()` :** vérifier la borne basse du `clamp()` à 320 px. Le préférer en `cqi` ou en `vw` avec `max-width: 100%`, et `overflow-wrap` inopérant sur un seul mot non coupable. Le risque principal de débordement horizontal vient d'un texte `white-space: nowrap` ou d'un SVG plus large que l'écran.
- **Champs de saisie à 16 px** (connaissance générale non sourcée ici) : iOS Safari zoome sur un `input` dont le `font-size` est inférieur à 16 px. À garder si le site a un formulaire.
- **`hyphens: auto` :** l'appliquer seulement aux paragraphes étroits, pas aux titres de marque (la césure d'un nom propre serait laide).

### Gaps
- Statut 2026 exact de `text-wrap: pretty` dans Safari stable et Firefox non revérifié (source datée de 2025).
- Pas de source consultée pour la règle des 16 px sur iOS (connue mais non citée ici).

## 5. Toucher : cibles, survol, :hover collant

### Takeaway
WCAG 2.2 AA (2.5.8) exige 24×24 px CSS, ou un espacement équivalent ; le projet vise 44×44, ce qui est plus exigeant. Placer les effets de survol sous `@media (hover: hover)` pour éviter les états collants après un tap.

### Cited Findings
- **Critère 2.5.8 :**
  - cible d'au moins 24×24 px CSS ;
  - exceptions : espacement (cercle de 24 px de diamètre centré sur chaque cible sans intersection), contrôle équivalent, cible en ligne dans du texte, cible du user agent, cas essentiel.
  — [W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- **Zone de cible :** c'est la zone d'activation, pas le graphisme visible. Du padding agrandit la cible d'une petite icône. — [BOIA, target size WCAG 2.2](https://www.boia.org/blog/understanding-target-size-under-wcag-2.2-and-how-it-affects-people-with-disabilities)
- **`@media (hover: hover | none)` :**
  - `hover` teste l'entrée **principale** ; `none` désigne un appareil où le survol est impossible ou malcommode (appui long des mobiles) ;
  - Baseline « widely available » depuis décembre 2018 [ancien mais stable].
  — [MDN @media hover](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover)
- **`any-hover` et `any-pointer` :** ils reflètent toutes les entrées disponibles ; `pointer: coarse` correspond au tactile. — [CSS-Tricks, interaction media features](https://css-tricks.com/?p=320427)

### Inferences
- **Effets magnétiques et de survol** (boutons, cadres de projets) :
  - les envelopper dans `@media (hover: hover) and (pointer: fine)` ;
  - en tactile, les désactiver côté JS avec `matchMedia`, sans quoi `pointermove` ne sert à rien.
- **Information portée par le survol :** toute information visible seulement au survol (légendes de projets, étiquettes) doit être visible par défaut en `(hover: none)`.
- **Onglets de la section agents :** chaque onglet doit atteindre 44 px de haut ; s'ils défilent horizontalement, prévoir une indication.

### Gaps
- Aucune.

## 6. Bugs de mise en page : débordement horizontal, overflow clip, images, container queries, grille

### Takeaway
Remplacer `overflow-x: hidden` par `overflow-x: clip` sur `html`/`body` et les wrappers, car `hidden` crée un conteneur de défilement qui casse `position: sticky`. Les container queries conviennent aux composants réutilisés : cartes d'agents, cadres de navigateur.

### Cited Findings
- **`overflow: hidden`** crée un conteneur de défilement, ce qui provoque :
  - des éléments sticky qui ne collent plus ;
  - des problèmes de smooth scroll ;
  - du défilement horizontal parasite sur mobile.
  **`overflow: clip`** rogne sans créer de conteneur de défilement. — [Framer, Overflow: Clip](https://www.framer.com/help/articles/overflow-clip/)
- **`overflow-x: hidden` sur un ancêtre** empêche un en-tête sticky de coller, car il devient la référence de collage ; `overflow-x: clip` corrige le problème. — [Go Make Things](https://gomakethings.com/the-overflow-hidden-property-and-sticky-headers/) ; [DEV, overflow clip](https://dev.to/nicm42/overflow-clip-4n98)
- **Discussion au CSSWG (novembre 2025)** sur la prise en charge de sticky à l'intérieur d'ancêtres `overflow: hidden/auto` : le problème n'est pas résolu côté spécification. — [W3C public-css-archive](https://lists.w3.org/Archives/Public/public-css-archive/2025Nov/0151.html)
- **Container queries :**
  - `container-type: inline-size` et `@container (width > …)` ;
  - unités `cqi`/`cqw` ; sans conteneur, elles se rabattent sur les unités du petit viewport ;
  - `inline-size` applique une containment de layout, de style et de taille inline : le conteneur ne grandit plus en largeur selon ses enfants.
  — [MDN Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)

### Inferences
- **Sources de débordement à chasser** (connaissance générale non sourcée ici) :
  - `width: 100vw`, qui inclut la barre de défilement sur ordinateur ;
  - marges négatives ;
  - `translateX` d'animations d'entrée, avant leur exécution ;
  - mot-symbole SVG ou texte `nowrap` ;
  - `gap` et `grid-template-columns: 1fr`, où `1fr` vaut `minmax(auto, 1fr)` et ne rétrécit pas sous le min-content : utiliser `minmax(0, 1fr)` ;
  - `<pre>` et URL longues.
- **Script Playwright de détection :** comparer `document.documentElement.scrollWidth > innerWidth` à chaque largeur, puis lister les éléments dont `getBoundingClientRect().right > innerWidth`.
- **Images et CLS :** `width`/`height` explicites ou `aspect-ratio` sur les cadres de navigateur et le panneau 4:5 ; déjà exigé par les règles du projet.
- **Container queries :** les réserver aux composants placés dans des colonnes de largeur variable. Ne pas en mettre sur un ancêtre d'un élément épinglé par ScrollTrigger sans test, car la containment de layout pourrait interférer. C'est une inférence.

### Gaps
- Pas de source récente consultée sur le support `overflow: clip` dans les vieux Safari iOS (moins de 16).

## 7. Performance mobile : backdrop-filter, flous, fonds fixes, content-visibility

### Takeaway
`backdrop-filter` sur une barre fixe au-dessus d'un contenu qui défile est une cause connue de saccades sur Android d'entrée de gamme. Les sections lourdes sous la ligne de flottaison peuvent utiliser `content-visibility: auto` avec `contain-intrinsic-size`.

### Cited Findings
- **Défilement saccadé avec `backdrop-filter` :**
  - sur apple.com avec un Moto G5 sous Firefox ;
  - sur m.youtube.com, où le flou est posé sur des barres fixes.
  — [Mozilla bug 1732817](https://bugzilla.mozilla.org/show_bug.cgi?id=1732817) [2021, ancien]
- **Réduire le coût :** un rayon de flou plus faible, une surface floutée plus petite, peu de flous simultanés. — [technetexperts](https://www.technetexperts.com/flutter-progressive-blur-fps-fix/) (contexte Flutter, transposition prudente)
- **`content-visibility: auto` :**
  - saute le rendu hors écran ;
  - le contenu reste dans le DOM et l'arbre d'accessibilité, donc reste trouvable avec Ctrl+F ;
  - `contain-intrinsic-size` sert de taille de remplacement.
  — [web.dev, content-visibility](https://web.dev/articles/content-visibility)

### Inferences
- **Nav pilule floutée sur mobile :**
  - mesurer en i/s sous CPU ×4 ;
  - si la cadence chute, fond plein ou flou réduit sous `(hover: none)` ou `(max-width: 720px)`, en gardant l'apparence ;
  - la règle `prefers-reduced-transparency` du projet couvre déjà le cas « surfaces pleines ».
- **`content-visibility` :** ne pas l'appliquer aux sections suivies par ScrollTrigger (positions faussées tant que la taille est estimée) ni à celles qui contiennent l'élément épinglé. Elle convient à la FAQ et au footer.
- **`background-attachment: fixed`** (connaissance générale non sourcée ici) : ignoré ou coûteux sur iOS ; à éviter.

### Gaps
- Pas de mesure récente (2024–2026) publiée sur le coût de `backdrop-filter` dans Chrome Android.

## 8. Pièges propres à iOS Safari en 2026 (dialog, sticky, vidéo, 300 ms, fond fixe)

### Takeaway
`<dialog>.showModal()` rend le reste de la page inert, mais ne bloque pas le défilement tactile du fond sur iOS : il faut la technique du body fixe avec restauration de la position (en tenant compte de Lenis). Une vidéo en lecture automatique exige `muted` et `playsinline`.

### Cited Findings
- **Blocage du défilement avec `<dialog>`** (janvier 2026) :
  - `showModal()` rend l'extérieur inert ;
  - `body:has(dialog[open]) { overflow: hidden }` ne suffit pas sur iOS Safari, où le défilement tactile contourne la règle ;
  - `overscroll-behavior: contain` empêche le chaînage du défilement, pas le défilement lui-même ;
  - solution robuste : `body { position: fixed; top: -scrollY; width: 100% }` puis `scrollTo` à la fermeture ;
  - compenser la largeur de la barre de défilement par un `padding-right`.
  — [OpenReplay, stop page scrolling](https://blog.openreplay.com/stop-page-scrolling-dialog-open/)
- **Politique vidéo iOS :**
  - lecture automatique sans geste si la vidéo est `muted` ou sans piste audio ;
  - lecture seulement quand la vidéo est visible, pause hors écran ;
  - `playsinline` est nécessaire pour éviter le plein écran forcé sur iPhone.
  — [WebKit, New video policies for iOS](https://webkit.org/blog/6784/) [2016, ancien mais toujours la référence]
- **Safari 26.1 :**
  - corrige `offsetParent` pour les éléments fixes dont le bloc conteneur est un élément transformé ;
  - améliore l'ancrage (anchor positioning) au défilement.
  — [WebKit, Safari 26.1](https://webkit.org/blog/17541/webkit-features-for-safari-26-1/)

### Inferences
- **Lenis et la modale :** Lenis doit être arrêté (`lenis.stop()`) à l'ouverture de la modale, en plus de la technique du body fixe ; sinon les deux mécanismes se contredisent. La technique du body fixe ramène le scroll en haut : restaurer la position et rafraîchir ScrollTrigger si besoin.
- **Délai de 300 ms au tap** (connaissance générale non sourcée ici) : supprimé depuis longtemps quand la meta viewport contient `width=device-width`. `touch-action: manipulation` reste une sécurité.
- **Éléments fixes dans un parent transformé :** `position: fixed` à l'intérieur d'un parent avec `transform` (animations GSAP) se positionne par rapport à ce parent, d'où le correctif `offsetParent` de 26.1. La nav et la modale doivent rester hors des wrappers animés.

### Gaps
- Pas de source WebKit de 2026 sur `position: sticky` dans un conteneur `overflow` propre à iOS.
- Le `<dialog>` iOS avec `::backdrop` et le clavier virtuel n'ont pas été couverts.

## 9. Outils d'audit : matrice Playwright, limites du mode appareil, vrais appareils

### Takeaway
Playwright (viewport, `isMobile`, `hasTouch`, `deviceScaleFactor`) couvre bien la mise en page, mais ne reproduit ni les barres d'iOS Safari ni `100vh`, ni les safe areas, ni le clavier, ni les performances GPU. Ces points demandent un vrai iPhone et un Android d'entrée de gamme.

### Cited Findings
- **Ce que Playwright émule :**
  - viewport, user agent, `deviceScaleFactor` ;
  - `isMobile` (gestion de la meta viewport) et `hasTouch` (événements tactiles) ;
  - plus de cent appareils prédéfinis.
  — [playwright.dev, Emulation](https://playwright.dev/python/docs/emulation)
- **Limites de l'émulation :**
  - les particularités de Mobile Safari (comportement de 100vh, gestes iOS) ;
  - le clavier virtuel, l'encoche et les safe areas ;
  - le rendu propre à chaque moteur ;
  - la performance, puisque c'est le CPU de la machine de test qui travaille.
  Recommandation : émulation pour la largeur de couverture, vrais appareils ou cloud d'appareils pour les parcours clés. — [TestDino, Playwright mobile 2026](https://www.testdino.com/blog/playwright-mobile-testing)

### Inferences
- **Matrice recommandée :**
  - projets Playwright à 320, 360, 385, 390, 414, 601, 768, 820, 1024 en portrait, plus 800×360 et 896×414 en paysage, avec `isMobile` et `hasTouch` ;
  - projets `webkit` (iPhone) et `chromium` (Pixel ou Galaxy) pour couvrir les deux moteurs.
- **Vérifications automatiques à chaque largeur :** absence de débordement horizontal, cibles ≥ 44 px, axe, absence d'erreur console, CLS.
- **Sur appareil réel :** un iPhone (barres, teinte iOS 26, safe areas, modale vidéo et blocage du défilement) et un Android d'entrée de gamme en 360×800 (cadence du hero, flou de la nav).

### Gaps
- Le moteur `webkit` de Playwright sous Windows n'est pas iOS Safari : il ne reproduit pas les barres dynamiques (inférence cohérente avec la source TestDino).
