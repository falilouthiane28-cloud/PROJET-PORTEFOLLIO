# Confier le mouvement à GSAP, l'ornement au CSS

La recommandation principale : **GSAP + ScrollTrigger restent le moteur unique du hero et des scènes de scroll**. Motion (motion.dev) n'apporte rien d'indispensable ici. Au plus, on peut ajouter `inView` (environ 0,5 ko) et `hover`/`press` sur des éléments que GSAP ne touche jamais. Presque tous les effets « 21st.dev » à porter se réduisent à une variable CSS écrite par un seul listener, ou à une animation CSS pure. Sur un site sombre visité par des Android milieu de gamme en 4G, l'enjeu n'est pas d'ajouter une bibliothèque. Il faut éviter trois choses : deux moteurs qui écrivent le même `transform`, un titre LCP qui démarre à `opacity: 0`, et des couches de parallaxe qui se contredisent. Aucune source primaire ne publie de « durée standard » d'intro chez Apple ou chez les lauréats Awwwards. Les valeurs documentées portent sur des briques : révélation de ligne d'environ 1 s, stagger de 0,05 à 0,1 s, `expo.out`, micro-interactions sous 300 ms. Une intro de 2,5 à 3 s se construit donc en **chevauchant** des tweens d'environ 1 s, avec un contenu lisible et cliquable dès la première seconde. Les scroll-driven animations CSS tournent désormais dans Chrome, Edge, Samsung Internet et Safari 26, soit l'essentiel du trafic Android d'Afrique de l'Ouest. Elles peuvent remplacer ScrollTrigger pour les révélations simples, hors du thread principal. Côté outillage, la pratique documentée est un `CLAUDE.md` court (moins de 200 lignes), des règles `.claude/rules/` ciblées par `paths`, un sous-agent relecteur en lecture seule, des hooks Node en « exec form » sous Windows, et un pre-commit sans dépendance via `core.hooksPath`.

## Une intro de trois secondes, lisible dès la première

Les sources ne donnent pas de chronométrage d'intro mesuré sur des pages Apple ou des sites SOTD. Les articles Codrops visés ont renvoyé des erreurs 403. Le plan ci-dessous est donc une **construction à partir de briques documentées**, pas une norme. La doc SplitText de GSAP anime ses morceaux sur **1 s avec un stagger de 0,05 s** ([GSAP SplitText](https://gsap.com/docs/v3/Plugins/SplitText/)). Le motif courant de lignes masquées utilise `yPercent: 100`, un stagger d'environ 0,1 et `expo.out` avec `mask: "lines"` ([Codrops](https://tympanus.net/codrops/2025/05/14/from-splittext-to-morphsvg-5-creative-demos-using-free-gsap-plugins/)). Pour l'interface, Emil Kowalski fixe la barre à **moins de 300 ms** ([Emil Kowalski](https://emilkowal.ski/ui/great-animations)), et le HIG d'Apple demande de préférer des animations « quick, precise » ([Apple HIG](https://developers.apple.com/design/human-interface-guidelines/foundations/motion)). On en tire une timeline maîtresse d'environ 3 s :

- **0 s** : la scène de Saturne entre en fondu avec un scale de 1,04 à 1 (environ 1,6 s, `expo.out`).
- **0,35 s** : les lignes du titre montent depuis leur masque (1 à 1,1 s, stagger de 0,08 à 0,12 s).
- **Vers 1,1 s** : le sous-titre arrive.
- **Vers 1,4 s** : le CTA arrive.
- **Vers 1,5 à 1,7 s** : la nav arrive en dernier.

Tout est chevauché par des offsets de position (`"<0.2"`, `"-=0.6"`). Le dernier élément se pose vers 2,5 s, et la traîne d'easing donne l'impression de 3 s. L'élément le plus fort ouvre la séquence. La nav, faible visuellement mais critique à l'usage, la ferme. Elle reste cliquable dès la première image.

Ce plan est plus long que celui retenu dans la recherche précédente (environ 1,2 s). Les deux se concilient si **l'information arrive tôt et seul l'ambiant s'étire**. Le titre et le CTA doivent être lisibles vers 1,2 à 1,5 s. La planète peut continuer à « se poser » au-delà. L'intro doit aussi être interruptible : si l'utilisateur fait défiler pendant qu'elle joue, on accélère la timeline (`tl.timeScale(3)` ou `tl.progress(1)`) au lieu de bloquer le scroll. C'est le principe WWDC d'animations « réorientables à tout moment » ([WWDC18 Session 803](https://asciiwwdc.com/2018/sessions/803)).

L'easing obéit à une règle simple. Les **entrées scriptées utilisent des ease-out marqués** : `expo.out`, `power4.out`, ou `cubic-bezier(0.22, 1, 0.36, 1)` pour easeOutQuint ([easings.net](https://easings.net/#easeOutQuint)). Les **ressorts sont réservés à ce que le doigt ou le pointeur pilote** : bouton magnétique, inclinaison de la planète au pointeur. Apple conseille de décrire un ressort par son amortissement et sa réponse plutôt que par une durée. Il recommande un amortissement de 100 % par défaut, et d'environ 80 % seulement quand un geste lance l'élément avec de l'élan ([WWDC18 Session 803](https://asciiwwdc.com/2018/sessions/803)).

La profondeur vient de **deux ou trois couches au maximum** (étoiles, planète, texte), pas d'une parallaxe généralisée. La parallaxe, c'est-à-dire un arrière-plan qui bouge à une autre vitesse que le premier plan, est un déclencheur connu de troubles vestibulaires ([web.dev](https://web.dev/articles/prefers-reduced-motion)).

Le titre est très probablement l'élément LCP, ce qui impose une contrainte forte. Chrome ignore les éléments à `opacity: 0` pour le LCP. Un titre qui apparaît en fondu ne devient candidat qu'au repaint suivant, ce qui peut enregistrer un LCP tardif ([DebugBear](https://www.debugbear.com/blog/opacity-animation-poor-lcp)). La révélation par masque garde l'opacité à 1 : le texte est déjà peint, seulement clippé. C'est la bonne approche. Il reste à vérifier dans DevTools qu'un texte entièrement clippé est bien compté comme peint. SplitText doit attendre `document.fonts.ready` ou utiliser `autoSplit: true` avec `onSplit()`, et `aria: "auto"` garde une phrase lisible par les lecteurs d'écran ([GSAP SplitText](https://gsap.com/docs/v3/Plugins/SplitText/)).

En reduced motion, l'intro devient un fondu de 300 à 400 ms sans transform. Ce fondu reste conforme à WCAG 2.3.3, car l'opacité seule ne compte pas comme du mouvement ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)).

## Le scroll premium tient en un seul geste par écran

La technique « Apple » de référence est un flip-book. Un canvas sticky affiche l'image d'index `floor(progress × frameCount)`. L'exemple analysé utilise 148 images, et la page mesurée pesait **55,8 Mo pour 1 609 requêtes**. Apple sert des images statiques en repli sur connexion lente ([CSS-Tricks](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)). Pour un public en 4G, ce coût exclut les séquences d'images. La scène procédurale 2D du worker donne le même effet de « produit piloté par le scroll » pour quelques kilo-octets.

Le principe à retenir est la retenue. Chaque écran porte **un seul mouvement « héros » lié au scroll** : la planète qui recule et pivote pendant que le hero sort, avec un `scrub` léger de 0,5 à 1. Le reste se limite à des révélations d'entrée discrètes qui ne se rejouent pas. Ce qui rend un site bruyant, ce sont plusieurs couches de parallaxe à vitesses opposées, des effets de vitesse partout et des pins longs. Le blog 21st.dev note d'ailleurs que les sections épinglées sont l'endroit où les pages pilotées au scroll « commencent à paraître fausses » ([21st.dev](https://21st.dev/blog/react-scroll-animation-components)). Cette lecture est une synthèse de la retenue prônée par Apple et par Rauno Freiberg, pour qui la nouveauté d'une interaction fréquente s'use vite ([Rauno](https://rauno.me/craft/interaction-design)). Ce n'est pas une règle publiée. Aucun chiffre sourcé n'a été trouvé pour la valeur de scrub ou la longueur de pin.

Pour les révélations simples, les **timelines CSS `scroll()` et `view()`** tournent hors du thread principal, dans Chrome et Edge 115+ et Safari 26+ ([Chrome for Developers](https://developer.chrome.com/docs/css-ui/scroll-driven-animations)). caniuse leur attribue 87 % d'usage mondial, Samsung Internet 23+ compris ([caniuse](https://caniuse.com/mdn-css_properties_animation-timeline_scroll)). MDN ne les classe pas encore en Baseline ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline)). Il faut donc un état final statique derrière `@supports`. ScrollTrigger reste nécessaire pour ce que le CSS ne sait pas faire : le pin, le scrub qui pilote le worker, et SplitText.

Le scroll de l'utilisateur est un mouvement « essentiel » au sens de WCAG, puisque l'utilisateur le contrôle. En revanche, la parallaxe décorative doit pouvoir être désactivée ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)).

## GSAP possède le transform, Motion n'a droit qu'aux marges

Le vrai risque d'un duo GSAP + Motion n'est pas d'avoir deux boucles rAF. Ce sont **deux écrivains sur le même `transform`**. GSAP réécrit tout le `transform` inline à partir de ses valeurs en cache, donc toute écriture extérieure est écrasée ([forum GSAP](https://gsap.com/community/forums/topic/23011-motionpath-and-regular-transform-issue/)). Les transforms indépendants de Motion (`x`, `scale`) passent par des variables CSS composées dans `transform` ([Motion](https://motion.dev/docs/performance)). D'où la règle « une bibliothèque possède un élément » ([OpenReplay](https://blog.openreplay.com/motion-vs-gsap/)). Quand deux effets doivent coexister, on imbrique : un wrapper externe pour GSAP, un nœud interne pour l'autre. Jamais deux moteurs sur l'`opacity` d'un même nœud.

La question de la valeur ajoutée se tranche sur les chiffres, qui viennent de l'éditeur de Motion et sont donc à lire comme du marketing. Le build hybride d'`animate` pèse **environ 18 ko** et recouvre surtout ce que GSAP fait déjà. Le mini `animate` pèse environ 2,3 à 2,6 ko, `inView` environ 0,5 ko et `scroll` environ 5,1 ko ([Motion animate](https://motion.dev/docs/animate) ; [Motion vs GSAP](https://motion.dev/docs/gsap-vs-motion)). Les gains propres de Motion sont réels mais étroits :

- les **ressorts physiques**, absents de GSAP ;
- `hover()`, qui filtre les faux survols émulés au tactile ([Motion hover](https://motion.dev/docs/hover)) ;
- `press()`, qui ajoute l'accessibilité clavier ([Motion press](https://motion.dev/docs/press)) ;
- l'accélération WAAPI, mais **seulement** pour `transform`/`opacity` écrits en chaînes complètes. Les raccourcis `x`/`scale` « ne sont pas accélérés » ([Motion performance](https://motion.dev/docs/performance)).

Verdict : n'ajouter Motion que si un besoin de ressort ou de geste apparaît, et alors uniquement `inView` + `hover`/`press` + mini `animate`, sur des éléments que GSAP ne touche pas. Un lerp de dix lignes dans le module pointeur existant couvre le même besoin sans dépendance.

Côté GSAP, l'ensemble des plugins est gratuit depuis le rachat par Webflow ([GSAP pricing](https://gsap.com/pricing/)). La version 3.15 (avril 2026) n'apporte que `easeReverse` ([GSAP 3.15](https://gsap.com/blog/3-15/)). Les leviers de performance sont documentés dans la doc ScrollTrigger ([ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)) :

- `ScrollTrigger.config({ ignoreMobileResize: true })` évite un recalcul à chaque apparition de la barre d'adresse mobile ;
- `ScrollTrigger.batch()` sert pour les révélations répétées ;
- `pinReparent` est à éviter, la doc le qualifie de « coûteux » ;
- `refresh()` ne doit jamais être appelé dans un handler d'entrée.

`gsap.matchMedia()` avec une condition `reduceMotion` annule proprement toutes les animations quand la préférence change ([gsap.matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/)).

Lenis se branche sur le ticker unique de GSAP via le pont officiel : `lenis.on('scroll', ScrollTrigger.update)`, `lenis.raf(time*1000)` dans `gsap.ticker`, et `lagSmoothing(0)` ([Lenis](https://github.com/darkroomengineering/lenis)). Il respecte `prefers-reduced-motion` par défaut, mais pas les tweens GSAP. Il est plafonné à 60 fps sur Safari et 30 fps en mode économie. Avec `syncTouch: false`, le tactile reste natif, ce qui rend Lenis quasi inutile sur Android. Ne pas l'instancier sous `(pointer: coarse)` économise son évaluation : c'est une déduction, à mesurer.

Pour Three.js, environ **150 ko min+gzip** qui se tree-shakent mal ([threejs-tree-shake](https://github.com/mattdesl/threejs-tree-shake)) confirment le retrait déjà décidé. Si la 3D revient un jour, les bonnes pratiques restent les suivantes :

- `import()` dynamique après l'état idle, et seulement sur les appareils capables ;
- DPR plafonné ;
- rendu à la demande ;
- Draco ou meshopt pour la géométrie ;
- peu de draw calls ([Discover three.js](https://discoverthreejs.com/tips-and-tricks/)).

Pour l'INP, le seuil « bon » est de **200 ms au 75e centile**. Les deux ennemis sont l'évaluation de script au chargement et l'alternance écriture de style / lecture de layout dans une même tâche ([web.dev INP](https://web.dev/articles/optimize-inp)). Le worker 2D attaque directement ces deux postes.

## Huit effets 21st.dev valent le portage, deux non

Les composants 21st.dev dépendent rarement de framer-motion en profondeur. Ils utilisent `useInView`, `useSpring` ou `useScroll`/`useTransform`, qui se remplacent par IntersectionObserver, un lerp en rAF et `animation-timeline: view()`. Les vrais points durs sont `AnimatePresence` et `layout`, absents de la sélection ([Magic UI text-reveal](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/text-reveal.tsx) ; [number-ticker](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/number-ticker.tsx)). Le blog 21st.dev identifie la cause habituelle de surcoût des effets au pointeur : **un listener par carte et un état re-rendu à chaque image**. En vanilla, la réponse est un module pointeur unique, avec un `pointermove` délégué et un rAF, qui écrit des variables CSS pour le magnétisme, le spotlight et le tilt ([21st.dev spotlight](https://21st.dev/blog/react-spotlight-effect-components)). Les nombres de lignes ci-dessous sont des estimations, pas des mesures.

| Effet (source 21st) | Section | Technique vanilla | Coût estimé |
|---|---|---|---|
| [Text Reveal](https://21st.dev/@dillionverma/components/text-reveal) | Manifeste studio, intro Méthode | mots en `<span>`, `view()` + `animation-range` décalé par `--i`, repli IO ; **sans** le pin de 200vh | 20–40 lignes, opacité seule |
| [Magnetic](https://21st.dev/@ibelick/components/magnetic) | CTA WhatsApp, bouton hero | lerp `translate3d`, plafond d'**environ 20 px** ([21st.dev](https://21st.dev/blog/react-magnetic-cursor-effects)) | 30–50 lignes, 1 à 3 éléments |
| [Spotlight Card](https://21st.dev/@easemize/components/spotlight-card) | Services, projets | `--x/--y` + `radial-gradient` sur `::before`, pensé pour fond sombre | 15–25 lignes |
| [Number Ticker](https://21st.dev/@dillionverma/components/number-ticker) | Chiffres studio | IO `once`, rAF easé, `Intl.NumberFormat('fr-FR')`, `tabular-nums`, valeur finale dans le HTML | 25–35 lignes |
| [Marquee](https://21st.dev/@dillionverma/components/marquee) | Bande marquee | keyframes CSS, piste ×2 en `aria-hidden`, pause en reduced motion | 0–10 lignes |
| [Border Beam](https://21st.dev/@dillionverma/components/border-beam) | Un seul CTA contact | masque + `offset-path: rect()` + `offset-distance` ([source](https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui/border-beam.tsx)) | 0 ligne JS, une seule instance |
| [Accordion](https://21st.dev/@ddoemonn/components/accordion) | FAQ | `<details name>` + `interpolate-size` en amélioration progressive (Chrome 129+) ([Chrome](https://developer.chrome.com/docs/css-ui/animate-to-height-auto)) | 0–30 lignes |
| Scroll progress (CSS natif) | Ligne de la section Méthode | `scroll()`/`view()` + `scaleY` ([MDN](https://developer.mozilla.org/en-US/blog/scroll-progress-animations-in-css)) | 0–10 lignes |
| [Tilt Card](https://21st.dev/@tom_ui/components/tilt-card) | Projets (optionnel) | ±4–6°, mutualisé avec le spotlight | +10 lignes, couche 3D par carte |
| [Custom Cursor](https://21st.dev/@designali-in/components/custom-cursor) | À écarter | rAF permanent ; `cursor: none` supprime des aides du système ([21st.dev](https://21st.dev/blog/custom-cursor-react)) | 40–80 lignes |

Les huit premiers forment un socle sobre. Le tilt reste à l'essai, avec le risque de faire « gadget » sur des visuels de projets. Le curseur custom est à exclure, comme les simulations de fluide, les globes et les particules.

Tous les effets au pointeur se montent uniquement sous `(hover: hover) and (pointer: fine)` et se coupent en reduced motion. Le marquee doit offrir une pause s'il dure plus de 5 s (WCAG 2.2.2).

Une limite à signaler : le MCP 21st demandait une authentification et n'a pas pu être utilisé. Le code source n'a été lu que pour les composants Magic UI. Pour les autres, les descriptions viennent des pages publiques et du blog 21st.dev, qui reste un canal promotionnel de la plateforme.

## Claude Code : un CLAUDE.md court, l'application déléguée aux hooks

La documentation officielle est explicite : viser **moins de 200 lignes par CLAUDE.md**, car un fichier plus long consomme du contexte et réduit l'adhésion aux consignes ([Memory](https://code.claude.com/docs/en/memory)). Pour chaque ligne, se demander si la retirer ferait commettre une erreur à Claude. Ne mettre « IMPORTANT » que sur une seule ligne ([Best practices](https://code.claude.com/docs/en/best-practices)). Les fichiers se concatènent du plus large au plus étroit (managed, puis utilisateur, puis projet, puis `CLAUDE.local.md`) sans que l'un écrase l'autre. Les imports `@chemin` se chargent au démarrage, donc ils organisent le contenu sans économiser de contexte. Un chemin avec espaces doit être échappé (`@Design\ Docs/x.md`). Les commentaires HTML sont retirés avant l'injection ([Memory](https://code.claude.com/docs/en/memory)).

Pour ce dépôt, cela donne un `CLAUDE.md` qui liste les commandes (`npm run dev`, `npm run build`, le script de frames) et les invariants du moteur de mouvement. `process.md` et `memory.md` y sont cités entre backticks, pour ne pas être chargés à chaque session.

Les **règles `.claude/rules/*.md` se chargent automatiquement**, avec deux comportements. Sans frontmatter, une règle se charge au lancement comme `.claude/CLAUDE.md`. Avec `paths:`, elle ne se charge que lorsque Claude **lit** un fichier correspondant. `paths` est le seul champ reconnu ([Memory](https://code.claude.com/docs/en/memory)). Cela permet par exemple un `hero.md` ciblé sur `src/js/hero/**/*.js` et `src/styles/hero.css`, et un `motion.md` qui fixe la règle du propriétaire unique. Une règle ciblée ne s'applique pas si Claude écrit un nouveau fichier sans en avoir lu un correspondant : c'est une déduction tirée du texte de la doc.

Les sous-agents (`.claude/agents/*.md`) n'exigent que `name` et `description`. Si `tools` est omis, l'agent hérite de tous les outils. `model` accepte `inherit` ([Sub-agents](https://code.claude.com/docs/en/sub-agents)). Un relecteur « motion/perf/a11y » en `tools: Read, Grep, Glob`, à qui l'on demande de ne signaler que les écarts qui touchent la correction, suit le modèle recommandé ([Best practices](https://code.claude.com/docs/en/best-practices)).

Les hooks portent ce qui doit **toujours** s'appliquer, puisque le CLAUDE.md n'est qu'indicatif ([Memory](https://code.claude.com/docs/en/memory)). Les points clés de la doc ([Hooks](https://code.claude.com/docs/en/hooks)) :

- **Exit codes** : exit 2 bloque l'action et transmet stderr à Claude. Exit 1 ne bloque pas.
- **PostToolUse** : ne peut que signaler, puisque l'outil a déjà tourné.
- **Timeouts** : exprimés en secondes.
- **Sous Windows** : la forme « shell » passe par Git Bash, ou par PowerShell s'il est absent. La forme la plus robuste est l'**exec form** `"command": "node", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/x.mjs"]`, car les shims `.cmd` de npm ne peuvent pas être lancés sans shell.
- **Chemins** : normaliser les `\` de `file_path` dans le script.

Pour un hook Stop, attention à une incohérence de la doc. Le guide dit de sortir si `stop_hook_active` vaut true ([Hooks guide](https://code.claude.com/docs/en/hooks-guide)). La référence définit ce champ autrement et ajoute `previous_response_blocked`, avec un plafond de 8 blocages consécutifs. Il vaut mieux tester `previous_response_blocked`.

Pour Git, l'option la plus légère est un `.githooks/pre-commit` versionné, activé par `git config core.hooksPath .githooks` dans le script `prepare`. Une sortie non nulle annule le commit ([githooks](https://git-scm.com/docs/githooks)). Sous Windows, le script doit être marqué exécutable avec `git update-index --chmod=+x`. simple-git-hooks est une alternative sans dépendance, mais elle écrit dans `.git/hooks`, donc il faut choisir l'une ou l'autre ([simple-git-hooks](https://github.com/toplenboren/simple-git-hooks)).

## Conclusion

Le « niveau Apple » relève moins d'une technique que d'une discipline de propriété. Chaque propriété animée a un seul écrivain. Chaque écran a un seul geste piloté par le scroll. Chaque effet décoratif dispose d'une variante reduced motion et d'un repli statique. Dans ce cadre, la question GSAP contre Motion perd l'essentiel de son intérêt : le budget à surveiller est le thread principal du téléphone, pas le catalogue de fonctions. Le CSS natif (scroll timelines, `offset-path`, `interpolate-size`) absorbe désormais une bonne partie de ce qui justifiait une bibliothèque il y a deux ans.

Deux points restent ouverts et doivent être mesurés plutôt que supposés. D'abord, l'éligibilité LCP d'un titre révélé par masque. Ensuite, le gain réel du retrait de Lenis sur tactile. La même logique vaut pour l'outillage : ce qui doit être vrai à chaque commit (build qui passe, pas de `opacity: 0` sur le H1, pas de second moteur sur un élément GSAP) appartient à un hook ou au pre-commit, pas à une phrase du CLAUDE.md.

## Tableau de décision

| Choix | Raison | Source |
|---|---|---|
| GSAP + ScrollTrigger, moteur unique du hero et des scènes de scroll | Gratuit, timelines mutables, pin/scrub/SplitText impossibles en CSS pur | https://gsap.com/pricing/ |
| Pas de Motion hybride (environ 18 ko) ; au plus `inView` + `hover`/`press` + mini `animate` | Redondant avec GSAP ; gains étroits (ressorts, filtrage tactile, clavier) | https://motion.dev/docs/gsap-vs-motion |
| Règle « une bibliothèque possède un élément », wrappers imbriqués si besoin | GSAP écrase tout `transform` écrit par un autre moteur | https://gsap.com/community/forums/topic/23011-motionpath-and-regular-transform-issue/ |
| Intro chevauchée d'environ 3 s, titre et CTA lisibles vers 1,2–1,5 s | Briques documentées : ligne en 1 s, stagger 0,05–0,1 s | https://gsap.com/docs/v3/Plugins/SplitText/ |
| Entrées en `expo.out` / `cubic-bezier(0.22,1,0.36,1)` | Ease-out = impression de réponse rapide | https://easings.net/#easeOutQuint |
| Ressorts (amortissement 100 %) réservés au pointeur et aux gestes | Recommandation Apple, interruptible | https://asciiwwdc.com/2018/sessions/803 |
| Intro interruptible : `tl.progress(1)` ou `timeScale` au premier scroll | Animations réorientables à tout moment | https://asciiwwdc.com/2018/sessions/803 |
| Titre révélé par masque `yPercent`, jamais depuis `opacity: 0` | `opacity: 0` retarde le LCP | https://www.debugbear.com/blog/opacity-animation-poor-lcp |
| Un seul mouvement scrubbé par écran, 2–3 couches de profondeur maximum | La parallaxe déclenche des troubles vestibulaires | https://web.dev/articles/prefers-reduced-motion |
| Pas de séquence d'images à la Apple | 55,8 Mo / 1 609 requêtes, incompatible avec la 4G | https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/ |
| Révélations simples en `view()` CSS derrière `@supports` | Hors thread principal ; Chrome 115+, Safari 26+ | https://developer.chrome.com/docs/css-ui/scroll-driven-animations |
| `ignoreMobileResize`, `batch()`, pas de `pinReparent` | Évite les recalculs coûteux sur mobile | https://gsap.com/docs/v3/Plugins/ScrollTrigger/ |
| Lenis sur `gsap.ticker`, `lagSmoothing(0)`, `syncTouch: false` | Pont officiel, tactile natif | https://github.com/darkroomengineering/lenis |
| `gsap.matchMedia()` avec `reduceMotion` ; fondu de 300–400 ms en repli | Lenis ne couvre pas les tweens ; l'opacité n'est pas du mouvement | https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html |
| Rester en canvas 2D dans un worker, sans Three.js | Environ 150 ko gzip, tree-shaking faible | https://github.com/mattdesl/threejs-tree-shake |
| Huit effets 21st portés en CSS + un module pointeur unique | Un listener par carte multiplie le coût | https://21st.dev/blog/react-spotlight-effect-components |
| Pas de curseur custom | `cursor: none` supprime des aides du système, rAF permanent | https://21st.dev/blog/custom-cursor-react |
| CLAUDE.md de moins de 200 lignes + `.claude/rules` ciblées par `paths` | Adhésion meilleure, chargement à la lecture | https://code.claude.com/docs/en/memory |
| Hooks Node en exec form ; exit 2 pour bloquer | Robuste sous Windows, sans shims `.cmd` | https://code.claude.com/docs/en/hooks |
| Pre-commit via `.githooks` + `core.hooksPath` | Zéro dépendance, versionné, bloque si le build échoue | https://git-scm.com/docs/githooks |
