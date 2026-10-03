# Hero animé (canvas 2D, particules + planètes) sur mobile en 2026 : performance et batterie

Notes de recherche du 3 octobre 2026. Les sources antérieures à 2023 sont signalées **[ancien]**. Les inférences sont rangées dans les sections « Inférences ».

## 1. Prise en charge d'OffscreenCanvas, de transferControlToOffscreen et de rAF dans un worker (iOS, Android, Samsung)

### Takeaway
En 2026, le rendu d'un canvas 2D dans un worker (OffscreenCanvas avec `requestAnimationFrame` dans le worker) est pris en charge partout où cela compte : iOS Safari depuis 16.4, avec une prise en charge complète depuis 17.0, ainsi que Chrome Android et Samsung Internet. Un repli sur le thread principal ne sert plus qu'aux iPhone restés sous iOS ≤ 16.3.

### Cited Findings
- **Safari iOS :**
  - aucune prise en charge jusqu'à 16.1 ;
  - prise en charge partielle de 16.2 à 16.7 ;
  - prise en charge complète de 17.0 à 27.2. — [caniuse : OffscreenCanvas](https://caniuse.com/offscreencanvas)
- **Chrome Android** (version actuelle 154) est pris en charge. **Samsung Internet** l'est de 10.1 à 30. — [caniuse : OffscreenCanvas](https://caniuse.com/offscreencanvas)
- **Support selon web.dev :** « Chrome 69+, Edge 79+, Firefox 105+, Safari 16.4+ ». — [web.dev, Tim Dresser, mis à jour le 8/12/2023](https://web.dev/articles/offscreen-canvas)
- **rAF dans le worker :** `DedicatedWorkerGlobalScope.requestAnimationFrame` est disponible dans Safari 16.4 et iOS 16.4 (mars 2023). Le worker doit avoir une fenêtre propriétaire, c'est-à-dire avoir été créé par une fenêtre ou par un worker dédié qui en a une. — [MDN : DedicatedWorkerGlobalScope.requestAnimationFrame](https://developer.mozilla.org/docs/Web/API/DedicatedWorkerGlobalScope/requestAnimationFrame)
- **`commit()` est déprécié :** il faut utiliser `requestAnimationFrame` dans le worker. — [web.dev](https://web.dev/articles/offscreen-canvas)
- **Transfert du canvas :** `canvas.transferControlToOffscreen()`, puis `worker.postMessage({canvas: offscreen}, [offscreen])`. L'OffscreenCanvas n'a pas de propriétés DOM. — [web.dev](https://web.dev/articles/offscreen-canvas)
- **Ce que les notes de Safari 26.0 ne disent pas :** les notes de version (15/09/2025) ne mentionnent ni OffscreenCanvas ni le mode économie d'énergie. Elles citent seulement des correctifs canvas (redessin avec largeurs relatives) et le débogage des workers dans le Web Inspector. — [WebKit : Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

### Inférences
- **Le « partiel » de 16.2 à 16.7** correspond probablement à l'absence de WebGL dans OffscreenCanvas et de rAF dans le worker avant 16.4. Comme le hero est en 2D, la bonne détection de fonctionnalité porte sur deux tests :
  - `'transferControlToOffscreen' in HTMLCanvasElement.prototype` ;
  - la présence de `self.requestAnimationFrame` dans le worker, avec un repli sur `setTimeout(…, 1000/30)`.
  *(Inférence : caniuse n'affiche pas la note détaillée.)*
- **Le chemin worker existant du bureau peut être réutilisé tel quel sur mobile.** Le repli à prévoir est l'image statique actuelle, et non un rendu sur le thread principal.

### Gaps
- La part réelle d'iOS ≤ 16.3 et de Samsung Internet < 10 en Afrique de l'Ouest n'a pas été trouvée (StatCounter par pays non consulté).

## 2. Thread principal ou worker sur téléphone, cadence, DPR, nombre de particules et mode économie d'énergie d'iOS

### Takeaway
Le worker protège le thread principal (TBT, INP, défilement), mais ne réduit pas le coût énergétique : le GPU et le compositeur travaillent autant. Les leviers d'économie sont :
- un plafond de 30 i/s pour un décor ambiant ;
- un DPR plafonné vers 1,5 ;
- beaucoup moins de particules, en évitant surtout les modes de fusion ;
- l'arrêt complet hors écran.

iOS en mode économie d'énergie bride de toute façon rAF à 30 i/s.

### Cited Findings
- **Fluidité malgré un thread principal chargé :** un canvas classique se fige quand le thread principal est surchargé, alors que la version OffscreenCanvas en worker « joue de façon fluide ». Le worker donne « plus de marge » au thread principal. — [web.dev : OffscreenCanvas](https://web.dev/articles/offscreen-canvas)
- **Banc d'essai multi-appareils (Journal of Imaging, 2026), avec un iPhone 17 Pro sous iOS 26.1 et un Samsung Galaxy A52s 5G (milieu de gamme) sous Android 14 :**
  - l'animation canvas reste viable jusqu'à environ **5 000 objets** et se dégrade nettement à 10 000 ;
  - iOS tient le maximum d'images par seconde plus longtemps qu'Android ;
  - **les opérations de fusion (blending) causent la plus forte chute d'images par seconde** ;
  - sur mobile, seules les images par seconde ont été mesurées, car les navigateurs mobiles ne fournissent pas de métriques CPU ou GPU fiables. — [PMC12843483](https://pmc.ncbi.nlm.nih.gov/articles/PMC12843483/)
- **Mode économie d'énergie d'iOS :**
  - rAF est bridé à 30 i/s, volontairement, pour économiser la batterie ;
  - historique WebKit : r213169 introduit le bridage, r244182 le casse, r261113 le rétablit ;
  - il n'y a pas de contournement recommandé. — [WebKit Bug 215745](https://bugs.webkit.org/show_bug.cgi?id=215745) **[ancien, 2020]**
- **Ce que bride iOS :** iOS bride rAF en mode économie d'énergie, ainsi que toutes les animations CSS. Safari bride aussi les iframes d'origine croisée jusqu'à une interaction. — [Motion Magazine, Matt Perry, 01/10/2020](https://motion.dev/magazine/when-browsers-throttle-requestanimationframe) **[ancien]**
- **Confirmation côté GSAP :** l'écran de l'iPhone est « réduit à environ 30 Hz » en mode économie d'énergie (Cassie, GSAP, 02/01/2024). Dans ce fil, la saccade constatée venait surtout du redimensionnement dû à la barre d'adresse. — [Forum GSAP 39457](https://gsap.com/community/forums/topic/39457-persistent-issue-with-gsap-scroll-trigger-on-iphone-in-battery-save-mode/)
- **Mode Energy Saver de Chrome (Chrome 108) :** il réduit la fréquence d'affichage. rAF et les animations CSS s'y adaptent, mais une boucle qui suppose 16,67 ms entre deux images tourne deux fois plus lentement. Il faut donc animer au temps écoulé (delta temps) et tester avec ce mode activé. — [Chrome for Developers, 08/12/2022](https://developer.chrome.com/blog/memory-and-energy-saver-mode) **[ancien]**. L'article ne précise pas les plateformes ; la presse parle d'ordinateurs portables et de Chromebooks ([Engadget](https://engadget.com/google-chromes-memory-and-battery-saver-modes-are-rolling-out-to-everyone-213051151.html?src=rss)).
- **Pratiques pour les fonds animés en WebGL, de type « gradient Stripe » :**
  - plafonner le devicePixelRatio vers **1,5**, ou rendre à demi-résolution ;
  - **diviser la cadence par deux**, puisqu'un fond paraît identique à 30 i/s ;
  - arrêter la boucle hors écran ou quand l'onglet est caché ;
  - prévoir un repli statique.
  
  Une boucle continue à 60 i/s, même onglet caché, « garde le GPU chaud ». — [21st.dev : React shader background components](https://21st.dev/blog/react-shader-background-components). Source secondaire d'une plateforme de composants : avis de praticien, pas de mesure publiée.

### Inférences
- **Pour un hero ambiant mobile**, une base raisonnable serait :
  - 30 i/s par défaut (rendu une image sur deux, avec un pas de temps en delta) ;
  - DPR plafonné à 1,5, voire 1 pour le niveau bas ;
  - 400 à 900 particules sur Android milieu de gamme, au lieu de 2 800 ;
  - aucune `globalCompositeOperation` additive, ou alors des sprites pré-rendus.
  
  Ces valeurs sont des inférences : le seuil de 5 000 objets de l'étude concerne un canvas plein écran sans autre charge, sur un A52s, plus puissant que l'entrée de gamme visée en Afrique de l'Ouest. Elles sont à valider par la mesure (`npm run test:perf`, CPU ×4).
- **Le budget de « 50 i/s ou plus sur mobile bridé » du projet** entre en conflit avec le bridage obligatoire à 30 i/s d'iOS en mode économie d'énergie. Il faut considérer 30 i/s stables comme acceptables pour un décor ambiant, et détecter le bridage par les écarts de rAF au lieu de dégrader la qualité à tort. *(Inférence.)*
- **La qualité adaptative existante** (baisse du DPR, puis du nombre de particules sous 50 i/s) doit ignorer les baisses dues au bridage à 30 Hz : un intervalle stable d'environ 33 ms signale un bridage, pas une surcharge. *(Inférence.)*

### Gaps
- Je n'ai trouvé **aucune mesure publiée et fiable** de la consommation d'un canvas 2D continu sur téléphone en mAh ou en °C, ni de comparaison de mémoire entre worker et thread principal sur mobile. Un worker ajoute un contexte JS, de quelques Mo selon l'inférence courante, sans chiffre sourcé.
- Je n'ai trouvé aucune recommandation officielle (web.dev, WebKit) donnant un nombre de particules ou un plafond de DPR précis.

## 3. Règles de pause : IntersectionObserver, visibilitychange, mouvement réduit, Save-Data, deviceMemory et hardwareConcurrency

### Takeaway
Il faut couper la boucle dès que le hero sort de l'écran (IntersectionObserver côté page, puis message au worker) ou que la page est cachée (`visibilitychange`), et respecter `prefers-reduced-motion`. Pour la hiérarchie des appareils, `deviceMemory` et `saveData` n'existent que sur Chromium (Chrome Android, Samsung), et pas sur Safari ni Firefox. Ce sont donc des signaux d'appoint, jamais l'unique critère.

### Cited Findings
- **Pause sur deux signaux :** mettre en pause quand `document.hidden` est vrai (onglet en arrière-plan, écran verrouillé) et quand le canvas sort de l'écran (IntersectionObserver sur le canvas lui-même), annuler rAF hors écran et reprendre au retour. — [21st.dev](https://21st.dev/blog/react-shader-background-components) (source secondaire)
- **`navigator.deviceMemory` :**
  - valeur arrondie à une puissance de 2 et bornée selon le navigateur (par exemple 2, 4, 8…), pour limiter l'empreinte numérique ;
  - **contexte sécurisé (HTTPS) obligatoire** ;
  - pas encore Baseline. — [MDN : deviceMemory](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory)
  - **Support :** Chrome Android et Samsung Internet (8.2 à 30) oui ; Safari, Safari iOS (jusqu'à 27.2) et Firefox non. — [caniuse : deviceMemory](https://caniuse.com/mdn-api_navigator_devicememory)
- **`navigator.hardwareConcurrency` :** pris en charge par Safari iOS depuis 15.4. — [caniuse : hardwareConcurrency](https://caniuse.com/hardwareconcurrency)
  - **Valeur bornée sur iOS : les sources se contredisent.** Selon une copie de la documentation MDN, Safari borne la valeur à 4 ou 8 ; une autre formule dit « 2 sur iOS, 8 ailleurs ». — [w3cub : hardwareConcurrency](https://docs.w3cub.com/dom/navigator/hardwareconcurrency). La page MDN actuelle ne mentionne plus ce bornage ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency)). **Conflit non résolu.**
- **Save-Data :** l'en-tête HTTP et `navigator.connection.saveData` signalent un choix explicite de l'utilisateur d'économiser des données. Il faut vérifier que `navigator.connection` existe : l'API Network Information n'existe que dans Chrome, Chrome Android et Samsung Internet. — [web.dev : Save-Data](https://web.dev/articles/optimizing-content-efficiency-save-data) **[article d'origine ancien]** ; Safari et Firefox ne l'exposent pas ([modpagespeed](https://modpagespeed.com/blog/save-data-bandwidth/), source secondaire). Cette même source affirme que des navigateurs tiers sur iOS pourraient l'envoyer. C'est douteux, puisque tous les navigateurs iOS utilisent WebKit : **non vérifié**.
- **Bascule à chaud du mouvement réduit :** l'abandon du mode économie d'énergie n'est pas exposé aux pages. La seule façon de le détecter est de comparer les horodatages de rAF successifs. — [Chrome for Developers](https://developer.chrome.com/blog/memory-and-energy-saver-mode) **[ancien]**

### Inférences
- **Hiérarchie proposée.** *(Inférence ; les seuils sont à calibrer par la mesure.)*
  - **Niveau 0 (image statique)** si l'un des cas suivants est vrai :
    - `prefers-reduced-motion: reduce` ;
    - `saveData === true` ;
    - `deviceMemory ≤ 2` ;
    - OffscreenCanvas absent.
  - **Niveau 1 (léger)** si `deviceMemory ≤ 4` ou `hardwareConcurrency ≤ 4`.
  - **Niveau 2** sinon.
  - **Sur iOS**, sans `deviceMemory`, on se fie à la sonde d'images par seconde des 2 premières secondes, qui existe déjà dans la qualité adaptative.
- **Sur Android d'entrée de gamme en Afrique de l'Ouest,** le mode économie de données de Chrome et de Samsung est un signal réel et peu coûteux à respecter. *(Inférence.)*

### Gaps
- Je n'ai pas trouvé de source primaire WebKit à jour sur la valeur exacte de `hardwareConcurrency` sous iOS 26.
- Je n'ai pas trouvé l'état de `prefers-reduced-data` en 2026 (non recherché faute de budget). Il était non livré dans les navigateurs grand public à ma connaissance, ce qui est à vérifier.

## 4. Épinglage au défilement sur mobile : les problèmes, pourquoi l'éviter, et l'effet lié au défilement sans pin

### Takeaway
Sur un écran tactile, un pin de 300 à 500 vh cumule plusieurs problèmes :
- la barre d'adresse qui redimensionne le viewport, ce qui déclenche des refresh et des sauts ;
- l'inertie d'iOS, et des pins qui « dépassent » ;
- un défilement long et frustrant.

Les remèdes de GSAP (`ignoreMobileResize`, `normalizeScroll`) ont des contreparties et ne règlent pas tout : en portrait, iOS impose encore la barre d'adresse. Un hero ambiant de hauteur 100svh, dont la progression de sortie pilote quelques paramètres, est plus sûr.

### Cited Findings
- **`normalizeScroll()`** force le défilement sur le thread JS. Il empêche le masquage et l'affichage de la barre d'adresse sur la plupart des mobiles, corrige la gigue d'iOS (mauvaise position et mauvais touch rapportés) en « sautant un touchmove sur deux », supprime les sauts des éléments épinglés et uniformise l'inertie. — [GSAP Docs : normalizeScroll](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.normalizeScroll()/)
  - **Limites :**
    - sur iOS récent en **portrait**, l'affichage et le masquage de la barre restent « impossibles à contourner » ;
    - il se met en pause sur les gestes multi-touch et le pinch ;
    - la barre de défilement native peut ne pas apparaître ;
    - il est désactivé par défaut, pour garder un comportement « pur » du navigateur. — [même source](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.normalizeScroll()/)
- **`ignoreMobileResize: true` :** ScrollTrigger ne relance pas `refresh()` sur un redimensionnement vertical dû à la barre d'adresse, sur appareil uniquement tactile. Contrepartie : des positions de début et de fin légèrement inexactes. — [Forum GSAP 39457, GreenSock, 02/01/2024](https://gsap.com/community/forums/topic/39457-persistent-issue-with-gsap-scroll-trigger-on-iphone-in-battery-save-mode/) ; [GSAP 3.10 release](https://www.gsap.com/blog/3-10/)
- **Signalements en série :** plusieurs fils du forum GSAP font état de problèmes de pin propres à iOS et à mobile. — [Forum 40858](https://gsap.com/community/forums/topic/40858-problems-with-scrolltrigger-only-on-ios-mobile/), [Forum 36502 : normalizeScroll ne marche pas sur certains iOS](https://gsap.com/community/forums/topic/36502-scrolltriggernormalizescroll-doesnt-work-on-some-ios-devices/), [Forum 41007 : pin dans l'app Instagram](https://gsap.com/community/forums/topic/41007-pin-element-with-scrolltrigger-and-ignoremobileresize-inside-instagram-app) (contenu non lu en détail).
- **Lenis sur écran tactile :** il laisse le défilement natif par défaut (`syncTouch: false`). `syncTouch` « peut être instable sur iOS < 16 ». — [Lenis README](https://github.com/darkroomengineering/lenis)
- **Animations CSS liées au défilement (`animation-timeline: scroll()/view()`) :**
  - disponibles dans Chrome 115+ et Safari 26.0 ;
  - les animations liées au défilement sont exécutées hors du thread principal (threaded) dans Safari 26.4. — [WebKit : Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), [Chrome for Developers](https://developer.chrome.com/docs/css-ui/scroll-driven-animations), [buildmvpfast](https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026) (secondaire, pour le 26.4)

### Inférences
- **Hero sans pin sur mobile.** Section en `100svh` (unité stable, insensible à la barre d'adresse), avec un ScrollTrigger **sans `pin`** qui suit la sortie du hero (`start: 'top top'`, `end: 'bottom top'`). La progression de 0 à 1 est envoyée au worker par `postMessage`, au plus une fois par image. Elle module :
  - le zoom ou le recul de la caméra ;
  - la vitesse orbitale ;
  - le fondu des particules.
  
  On garde `ignoreMobileResize: true` et on évite `normalizeScroll`, qui intercepte le défilement natif et entre en conflit avec l'idée d'un défilement « pur » sur un téléphone d'entrée de gamme. *(Inférence.)*
- **Le CSS lié au défilement** peut gérer le texte et l'opacité du hero sans JS, mais pas le contenu du canvas : la progression doit rester en JS pour le worker. *(Inférence.)*

### Gaps
- Je n'ai pas trouvé de source qui chiffre l'abandon ou la frustration causés par un pin long sur mobile (étude UX). L'argument repose sur les problèmes techniques documentés.

## 5. Impact sur le LCP et le TBT d'un démarrage différé du worker, et moment du démarrage

### Takeaway
Un `<canvas>` n'est pas candidat au LCP. Le LCP mobile reste donc le titre ou le poster, à condition de garder l'image statique comme premier rendu. Le worker décharge le thread principal, mais le chargement de son script et son initialisation restent à placer **après le LCP**, découpés en petites tâches, pour ne pas peser sur le TBT ni l'INP.

### Cited Findings
- **Éléments candidats au LCP :** `<img>`, `<image>` dans un SVG, `<video>`, arrière-plan chargé par `url()`, blocs de texte. `<canvas>` n'y figure pas ; la liste est limitée « intentionnellement ». — [web.dev : LCP, mis à jour le 04/09/2025](https://web.dev/articles/lcp)
- **Tâches longues :** une tâche de plus de 50 ms est longue ; l'excédent compte comme temps bloquant. Il faut céder la main avec `scheduler.yield()`, ou `setTimeout(0)` en repli, environ toutes les 50 ms, et différer le travail de fond. — [web.dev : Optimize long tasks, 19/12/2024](https://web.dev/articles/optimize-long-tasks)
- **L'animation du worker continue même quand le thread principal est occupé** (hydratation, autres effets). — [web.dev : OffscreenCanvas](https://web.dev/articles/offscreen-canvas)

### Inférences
- **Séquence recommandée sur mobile** *(inférence, cohérente avec la règle du projet « scène du hero dans le worker après l'intro »)* :
  1. Premier rendu : l'image statique actuelle, qui reste le repli et le poster.
  2. Après le LCP et la fin de l'intro, dans `requestIdleCallback` (avec `timeout` ; repli `setTimeout` sur Safari, qui n'a pas `requestIdleCallback` à ma connaissance, à vérifier), on crée le worker, on transfère le canvas et on le fait apparaître en fondu par-dessus l'image statique, en n'animant que l'`opacity`.
  3. Si le niveau est 0, on ne charge jamais le worker.
- **Un démarrage à la première interaction** est une option prudente pour le niveau bas. Mais le client veut voir l'animation sans rien faire, d'où l'idle avec un délai court. *(Inférence.)*
- **Lighthouse mobile** mesure surtout la fenêtre de chargement. Une boucle démarrée après l'idle n'apparaît pas dans le TBT, sauf si le transfert ou l'initialisation produit une tâche longue sur le thread principal (par exemple un décodage d'image synchrone). Il faut la vérifier dans la trace. *(Inférence, à mesurer.)*

### Gaps
- Je n'ai trouvé aucune mesure publiée de l'impact sur le TBT et l'INP du démarrage d'un worker OffscreenCanvas sur mobile. Il faut la produire avec `npm run test:perf`.
- La prise en charge de `requestIdleCallback` par Safari en 2026 n'a pas été vérifiée.

## 6. Exemples de sites haut de gamme qui gardent un hero animé léger sur mobile

### Takeaway
Je n'ai **vérifié en direct aucun site**, faute de budget d'outils. Le seul schéma documenté est celui des fonds animés « type Stripe » : DPR plafonné, 30 i/s, pause hors écran et repli statique.

### Cited Findings
- **Recette de réduction pour les fonds shader et canvas sur mobile** (DPR ≈ 1,5, 30 i/s, pause hors écran ou onglet caché, repli statique). — [21st.dev](https://21st.dev/blog/react-shader-background-components) (source secondaire, sans site nommé et vérifié)

### Inférences
- Aucune.

### Gaps
- **Aucun exemple de site vérifié en direct sur mobile.** C'est à faire avec un émulateur mobile et un CPU ×4, sur des candidats comme stripe.com, linear.app ou des lauréats Awwwards, en relevant le DPR du canvas, les images par seconde et le comportement hors écran.
