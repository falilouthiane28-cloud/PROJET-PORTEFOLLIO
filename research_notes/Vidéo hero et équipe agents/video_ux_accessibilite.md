# Vidéo de hero (boucle muette) et vidéo de marque en modale : UX et accessibilité (état 2026)

Périmètre : (a) une boucle muette de 6 à 10 s en fond de hero, (b) une vidéo de marque de 40 s avec son, ouverte par un bouton « ▶ Voir la vidéo (40 s) » dans une modale. Site une page, français, vanilla + Vite, sombre, Lenis.

Avertissement sur les dates : plusieurs sources primaires sont anciennes mais restent la référence normative en vigueur (Chrome autoplay 2017/2018, WebKit 2016). Elles sont signalées « [ancien] ». Les pages MDN consultées ont été mises à jour en 2026.

## 1. Politiques d'autoplay (Chrome, Safari iOS, Firefox), mode économie d'énergie, économie de données, détection de l'échec

### Takeaway
Une vidéo `autoplay muted playsinline loop` démarre partout dans le cas nominal ; avec son, jamais sans geste de l'utilisateur. Mais l'autoplay muet peut quand même échouer (iOS en mode économie d'énergie, préférences Firefox, onglet en arrière-plan) : il faut toujours traiter la promesse de `play()` et garder le poster comme état de repli.

### Cited Findings
- Chrome : « Muted autoplay is always allowed ». L'autoplay avec son exige soit une interaction avec le domaine (clic, tap…), soit (bureau seulement) un seuil du Media Engagement Index franchi, soit un site ajouté à l'écran d'accueil / PWA installée. [ancien : page mise à jour 2017, politique en vigueur depuis avril 2018] — [Chrome for Developers, Autoplay policy](https://developer.chrome.com/blog/autoplay)
- Chrome : le MEI compte une consommation > 7 s, audio présent et non muet, onglet actif, vidéo > 200×140 px ; consultable dans `about://media-engagement`. — [Chrome for Developers](https://developer.chrome.com/blog/autoplay)
- Chrome recommande de toujours lire la promesse retournée par `play()` et, en cas de rejet, d'afficher un bouton de lecture. — [Chrome for Developers](https://developer.chrome.com/blog/autoplay)
- Iframes cross-origin : autoplay seulement avec `allow="autoplay"` ; les iframes same-origin l'ont par défaut (pertinent si la vidéo de 40 s était hébergée sur Vimeo/YouTube/Mux en iframe). — [Chrome for Developers](https://developer.chrome.com/blog/autoplay) ; [MDN, Autoplay guide (modifié 10/09/2026)](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- iOS / WebKit : `<video autoplay>` est honoré si la vidéo n'a pas de piste audio ou est `muted`. Si elle gagne une piste audio ou est démutée sans geste, la lecture se met en pause. Les vidéos en autoplay ne démarrent que visibles à l'écran et se mettent en pause quand elles ne le sont plus. Sur iPhone, `playsinline` évite le passage automatique en plein écran. `play()` renvoie une promesse rejetée si ces conditions ne sont pas remplies. [ancien : juillet 2016, toujours la base du comportement] — [WebKit blog, New video policies for iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/)
- Règle générale (tous navigateurs) : l'autoplay est permis si au moins une condition est vraie : audio muet ou volume à 0, interaction préalable avec le site, site sur liste d'autorisation, ou Permissions Policy pour une iframe. — [MDN, Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- Firefox : préférences `media.autoplay.default` (0 = autoriser, 1 = bloquer, 2 = demander), `media.autoplay.allow-muted` (vrai par défaut), `media.block-autoplay-until-in-foreground` (vrai : pas d'autoplay dans un onglet en arrière-plan). L'utilisateur peut donc bloquer aussi le muet. — [MDN, Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- Détection : rejet de `play()` avec `error.name === "NotAllowedError"` → afficher un bouton de lecture ; les autres erreurs sont à traiter à part. — [MDN, Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- `navigator.getAutoplayPolicy("mediaelement" | élément)` renvoie `"allowed"`, `"allowed-muted"` ou `"disallowed"` ; API marquée **expérimentale**, à détecter avant usage. — [MDN, getAutoplayPolicy](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getAutoplayPolicy)
- Permissions-Policy : `autoplay=(self)` ou `autoplay=()` pour tout désactiver. — [MDN, Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- iOS mode économie d'énergie : bug WebKit 216887 « Low Power mode is disabling video autoplay » (ouvert le 23/09/2020, statut NEW, dernière activité 14/12/2022) : l'autoplay est bloqué, muet compris ; un ingénieur Apple suggère que ce peut être un comportement « désirable » ; bug lié 168985 sur la désactivation de l'autoplay des vidéos muettes en économie d'énergie. — [WebKit Bugzilla 216887](https://bugs.webkit.org/show_bug.cgi?id=216887)
- Le rejet en économie d'énergie se manifeste par `NotAllowedError` (« The request is not allowed by the user agent or the platform… »). — [BytePlus, Autoplay Configuration Guide](https://docs.byteplus.com/en/docs/byteplus-media-live/Autoplay_Configuration_Guide) (source secondaire, cohérente avec le bug WebKit) ; contredit partiellement par la même source qui suggère que « le muet a plus de chances de passer » en économie d'énergie, ce que le bug WebKit dément.
- Économie de données : `prefers-reduced-data` n'est implémenté par **aucun** navigateur (seulement émulable derrière un drapeau Chromium ou dans Polypane) ; l'en-tête HTTP `Save-Data` et `navigator.connection.saveData` sont l'alternative exploitable dans Chromium. — [MDN, prefers-reduced-data](https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-data) ; [Polypane, Creating websites with prefers-reduced-data](https://polypane.app/blog/creating-websites-with-prefers-reduced-data)
- Le CSSWG discute encore en octobre 2025 de problèmes de confidentialité (empreinte) liés à `prefers-reduced-data`. — [public-css-archive, csswg-drafts #10076, oct. 2025](https://lists.w3.org/Archives/Public/public-css-archive/2025Oct/0559.html)

### Inferences
- Balisage minimal de la boucle : `<video muted loop playsinline autoplay preload="none|metadata" poster="…" aria-hidden="true">` avec `<source>` AV1/WebM puis H.264/MP4 ; et en JS, `video.muted = true` avant `play()` (certains navigateurs se fient à la propriété plutôt qu'à l'attribut).
- Plutôt que l'attribut `autoplay` brut, démarrer la boucle en JS (après l'intro, comme la scène du hero est déjà chargée en différé dans ce projet) : cela permet de vérifier mouvement réduit / Save-Data avant de télécharger, et de capter le rejet de `play()` pour rester sur le poster sans afficher de bouton « lecture » cassé.
- En cas de rejet (`NotAllowedError`) pour la boucle décorative : rester sur le poster et masquer le bouton pause (il n'y a rien à mettre en pause). Ne pas afficher un gros bouton lecture sur un fond décoratif.
- La vidéo de 40 s avec son ne pose pas de problème de politique : elle est lancée par un clic sur « Voir la vidéo », qui est une activation utilisateur ; appeler `play()` dans le gestionnaire du clic (ou juste après `showModal()`, dans la même tâche) pour garder l'activation transitoire, surtout sur iOS.
- Si la boucle n'a aucune piste audio, l'exporter sans piste audio (ffmpeg `-an`) : cela satisfait la règle WebKit « pas de piste audio » en plus de `muted`, et allège le fichier.

### Gaps
- Support exact de `getAutoplayPolicy()` : la table de compatibilité MDN n'a pas été rendue. De mémoire (non vérifié ici), seul Firefox l'implémente ; ne pas en dépendre.
- Comportement actuel (iOS 18/26) de l'autoplay muet en mode économie d'énergie : seule source = bug WebKit de 2020–2022, non clos. À tester sur appareil.
- Aucune source 2023–2026 trouvée sur l'effet du mode « Économiseur de données » de Chrome Android sur l'autoplay (le mode Lite a été retiré, mais je ne l'ai pas sourcé ici).

## 2. Boucle de fond ou lecture au clic : quand, preuves d'engagement/conversion, durée de boucle, pause hors écran / onglet masqué

### Takeaway
Le consensus UX : la vidéo qui démarre seule n'est acceptable que muette, lente, décorative et contrôlable ; tout contenu porteur d'information (la vidéo de marque de 40 s) doit être lancé par l'utilisateur. Il n'existe pas de preuve publique solide et récente de gain de conversion d'un fond vidéo.

### Cited Findings
- NN/g (cité via agrégateur, original non consulté) : « When users arrive at a webpage, they don't appreciate being surprised by video or audio content that begins playing without their consent » ; la vidéo n'est utile que si l'utilisateur la contrôle, comprend ce qu'elle contient et a un autre moyen d'accéder au contenu. — [Reelflow, Should videos autoplay on our website](https://www.reelflow.com/insights/should-videos-autoplay-on-our-website) ; [Vidzflow, When to use autoplay](https://www.vidzflow.com/blog/when-to-use-autoplay-and-when-not-to) (sources secondaires, date de l'étude NN/g non vérifiée)
- V&A (musée) : boucles de fond lentes et douces, fondu d'entrée et de sortie, vidéo sombre ou voile sombre, bouton stop toujours visible, fichier compressé sous 3 Mo, et nombre de boucles **limité** à la durée moyenne de visite pour éviter batterie/CPU dans les onglets oubliés. [ancien : 17/10/2018] — [V&A Digital blog, Moving backgrounds the accessible way](https://www.vam.ac.uk/blog/digital/moving-backgrounds-the-accessible-way)
- WebKit met déjà en pause les vidéos autoplay non visibles à l'écran (iOS). — [WebKit blog](https://webkit.org/blog/6784/new-video-policies-for-ios/)
- Firefox bloque par défaut l'autoplay dans les onglets en arrière-plan (`media.block-autoplay-until-in-foreground`). — [MDN, Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- web.dev : la vidéo `autoplay muted loop playsinline` remplace avantageusement le GIF ; pour le chargement différé, mettre l'URL dans `data-src` des `<source>`, un `poster`, puis un IntersectionObserver qui injecte les sources et lance la lecture à l'entrée dans le viewport. — [web.dev, Lazy loading video](https://web.dev/articles/lazy-loading-video)
- Preuve chiffrée : la page Personizely « hero image vs vidéo » ne contient **aucun résultat mesuré**, seulement une « potentielle hausse de 3 à 12 % » hypothétique. À ne pas citer comme preuve. — [Personizely](https://help.personizely.net/en/article/inspiration-product-hero-image-vs-video-test-how-static-banners-and-autoplay-videos-affect-conversions-16oseo5/)
- Les fonds vidéo sans contrôles sur les pages marketing figurent parmi les échecs 2.2.2 les plus fréquents en audit. — [Disability World, WCAG 2.2.2 toolkit](https://www.disabilityworld.org/toolkit/standards/wcag/2-2-2-pause-stop-hide/)

### Inferences
- Pour ce portfolio : (a) boucle 6–10 s = ambiance, muette, sans information propre (le texte du hero porte le message) ; (b) 40 s avec son = contenu, donc clic obligatoire. C'est exactement le partage recommandé.
- Durée : une boucle de 6–10 s dépasse le seuil de 5 s de 2.2.2 dès le premier passage (voir §3) → contrôle pause obligatoire, quelle que soit la longueur. Une boucle plus courte que 5 s ne dispense de rien puisqu'elle boucle indéfiniment.
- Mettre en pause hors écran (IntersectionObserver, seuil ~0) et sur `visibilitychange` (`document.hidden`) : cohérent avec ce que font déjà WebKit et Firefox, économise CPU/batterie, et évite qu'une lecture continue fasse concurrence au canvas worker du hero. Reprendre seulement si l'utilisateur n'a pas mis en pause lui-même (retenir un état « pause utilisateur »).
- Option V&A : arrêter la boucle après N tours (ex. ~30–60 s) en restant sur une image fixe, ce qui réduit aussi l'exposition 2.2.2 (mais ne remplace pas le bouton).
- Poids : viser bien moins que 3 Mo pour rester dans le budget « au-dessus de la ligne de flottaison ≤ 300 Ko » du projet → la vidéo ne doit **pas** compter dans le chargement initial : poster AVIF d'abord (LCP), vidéo chargée après l'intro/idle.

### Gaps
- Pas d'étude 2023–2026 accessible (NN/g, Baymard, A/B publiés) chiffrant l'effet d'un fond vidéo sur l'engagement ou la conversion d'un site d'agence. Article NN/g original non consulté.
- Pas de source sur une « longueur de boucle idéale » ; les 6–10 s viennent de la pratique, pas d'une étude.

## 3. WCAG 2.2 : 2.2.2 (Pause, Stop, Hide), 1.2.2 (sous-titres), 1.2.5 (audiodescription), mouvement réduit, données réduites

### Takeaway
La boucle de fond (démarre seule, > 5 s, présentée avec d'autres contenus) exige un mécanisme pause/arrêt/masquage, même décorative. La vidéo de 40 s exige des sous-titres français (1.2.2, A) et, au niveau AA, une audiodescription sauf si la bande-son transmet déjà toute l'information visuelle importante (1.2.5).

### Cited Findings
- 2.2.2 (niveau A) : pour tout contenu en mouvement, clignotant, défilant ou auto-actualisé qui (1) démarre automatiquement, (2) dure plus de 5 s, (3) est présenté en parallèle d'autres contenus, il existe un mécanisme pour le mettre en pause, l'arrêter ou le masquer, sauf si le mouvement est essentiel. — [W3C WAI, Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- 5 s : choisi car assez long pour capter l'attention, assez court pour qu'on puisse « attendre la fin » de la distraction. — [W3C WAI, Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- Le mécanisme ne doit pas monopoliser l'utilisateur ou le focus ; aucun emplacement imposé. Techniques suffisantes : G4 (pause puis reprise là où on s'était arrêté), SCR33, G186 (contrôle sur la page pour arrêter le mouvement), G11 (< 5 s) ; échecs : F16, F112, F50, F7. — [W3C WAI, Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- L'exigence s'applique « même si le contenu est jugé décoratif ». Le bouton pause doit être contrasté, utilisable au clavier avec focus visible, et exposer rôle, nom et état. — [Disability World](https://www.disabilityworld.org/toolkit/standards/wcag/2-2-2-pause-stop-hide/) ; [AccessibleWeb, autoplay + bouton pause](https://accessibleweb.com/question-answer/does-an-auto-play-video-with-a-pause-button-meet-accessibility-guidelines/)
- 1.2.2 (A) : sous-titres pour tout l'audio préenregistré d'un média synchronisé, sauf média alternatif à un texte clairement signalé. Ils incluent dialogues **et** informations non verbales nécessaires (effets sonores, musique, rires, identification et localisation des locuteurs). Technique suffisante : sous-titres fermés via `<track>`, ou sous-titres incrustés. — [W3C WAI, Understanding 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html)
- 1.2.5 (AA) : audiodescription pour toute vidéo préenregistrée d'un média synchronisé ; non nécessaire si toute l'information importante de la piste vidéo est déjà dans la piste audio. Formes : description standard dans les silences, description étendue (vidéo mise en pause), ou piste audio au choix. — [W3C WAI, Understanding 1.2.5](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-prerecorded.html)
- `prefers-reduced-data` : non implémenté ; `Save-Data` comme substitut. — [MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-data) ; [Polypane](https://polypane.app/blog/creating-websites-with-prefers-reduced-data)

### Inferences
- Boucle de fond : bouton pause/lecture visible dans le hero (pas seulement au survol), `<button type="button" aria-pressed>` ou nom qui change (« Mettre la vidéo de fond en pause » / « Relancer la vidéo de fond »), cible ≥ 44×44 px (règle du projet), placé tôt dans l'ordre de tabulation (juste après le contenu du hero ou dans la nav) pour être atteint vite. La vidéo elle-même en `aria-hidden="true"`, sans `controls`.
- `prefers-reduced-motion: reduce` : ne pas télécharger ni lancer la boucle, afficher le poster seul (cohérent avec la règle du projet « hero statique »). Bascule en direct : écouter `matchMedia(...).addEventListener('change')` → pause + retour au poster, ou reprise. Ce n'est pas une exigence normative WCAG AA (2.3.3 est AAA), c'est une bonne pratique et une règle du projet.
- Pour la vidéo de 40 s, `prefers-reduced-motion` ne doit pas l'empêcher (c'est un choix explicite de l'utilisateur), mais on peut désactiver l'autoplay à l'ouverture de la modale et laisser l'utilisateur appuyer sur lecture — à arbitrer.
- 1.2.5 : une vidéo de marque musicale avec voix off doit être examinée plan par plan ; si des textes à l'écran, noms ou démonstrations ne sont pas dits dans la voix off, il faut soit une piste audiodécrite, soit (solution légère) une transcription texte complète à côté du bouton, ce qui couvre 1.2.3 (A) mais **pas** 1.2.5 (AA) à elle seule. Le bouton peut aussi annoncer la durée (déjà « 40 s ») et la présence de son.
- `Save-Data` : en JS, `if (navigator.connection?.saveData) → poster seul`. Garder la règle CSS `@media (prefers-reduced-data: reduce)` comme amélioration progressive sans effet aujourd'hui.

### Gaps
- Je n'ai pas trouvé de position W3C explicite sur le cas précis « vidéo de fond plein hero sous du texte » au-delà du texte général de 2.2.2 ; l'application (contrôle obligatoire) fait consensus chez les auditeurs mais repose sur l'interprétation.
- Pas de source sur la conformité 1.2.5 d'une vidéo purement musicale (sans voix) : dans ce cas, toute l'information est visuelle, ce qui rendrait l'audiodescription ou une alternative textuelle nécessaire ; à confirmer par un auditeur.

## 4. Sous-titres français en WebVTT : `<track>`, `::cue`, bascule dans des contrôles personnalisés

### Takeaway
`<track kind="captions" srclang="fr" label="Français" src="….vtt" default>` dans la `<video>` de la modale, stylé via `video::cue` (propriétés limitées), et piloté en JS par `video.textTracks[0].mode = 'showing' | 'hidden'` pour un bouton « Sous-titres » personnalisé.

### Cited Findings
- Exemple MDN : `<track default kind="captions" srclang="en" src="/path/to/captions.vtt" />` dans `<video controls>`. — [MDN, ::cue (modifié 17/04/2026)](https://developer.mozilla.org/en-US/docs/Web/CSS/::cue)
- `::cue` est Baseline (largement disponible depuis janvier 2020). Propriétés permises uniquement : `background*`, `color`, `font*`, `line-height`, `opacity`, `outline*`, `ruby-position`, `text-combine-upright`, `text-decoration*`, `text-shadow`, `visibility`, `white-space`. Le fond s'applique à chaque cue séparément. Certaines parties diffèrent dans Safari et Firefox. — [MDN, ::cue](https://developer.mozilla.org/en-US/docs/Web/CSS/::cue)
- `::cue(<sélecteur>)` permet de styler les balises internes WebVTT : `<c>`, `<i>`, `<b>`, `<u>`, `<ruby>`, `<rt>`, `<v>` (voix/locuteur), `<lang>`. Exemple : `::cue { color: white; background-color: rgb(0 0 0 / 60%); }`. — [MDN, ::cue](https://developer.mozilla.org/en-US/docs/Web/CSS/::cue)
- Les sous-titres doivent inclure l'identification des locuteurs et les sons/musique utiles. — [W3C WAI, Understanding 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html)

### Inferences
- Fichier `.vtt` en UTF-8 commençant par `WEBVTT`, avec `<v Nom>` pour la voix off et des indications entre crochets pour la musique (« [Musique électronique douce] »), typographie française (espace insécable avant « : ; ? ! »).
- Le `<track>` doit être servi depuis la même origine (ou avec CORS + `crossorigin` sur la vidéo) ; avec Vite, mettre le `.vtt` dans `public/` pour qu'il ne soit pas haché ni inliné. Attention au mode `build:file` (file://) du projet : le chargement d'un `<track>` en file:// est bloqué dans Chromium (origine nulle) — à tester ; repli possible : cues ajoutés en JS via `addTextTrack()` + `new VTTCue()`.
- Bouton personnalisé : `<button aria-pressed="true">Sous-titres</button>` qui bascule `track.mode`; laisser `default` pour que les sous-titres soient actifs d'office (beaucoup regardent sans son, et c'est le seul moyen de comprendre la vidéo si le son est coupé).
- Ne pas appliquer d'opacité de transition sur les cues : contraste fixe (règle « jamais d'état intermédiaire peu contrasté »).

### Gaps
- Pas de source 2023–2026 détaillant les écarts exacts Safari/Firefox sur `::cue` (MDN ne les liste pas dans l'extrait) ; à tester, en particulier `font-family` et `background` sur iOS, et le rendu des sous-titres en plein écran iOS natif (où le style système de l'utilisateur prime).

## 5. Modale vidéo accessible : `<dialog>` + `showModal()`, retour du focus, contrôles personnalisés, raccourcis, verrouillage du défilement avec Lenis

### Takeaway
`<dialog>` ouvert avec `showModal()` fournit nativement couche supérieure, arrière-plan inerte, `aria-modal`, Échap et retour du focus au déclencheur : c'est désormais la solution recommandée plutôt qu'une modale maison. Il reste à gérer : arrêt de la vidéo à la fermeture, `lenis.stop()/start()`, et des contrôles nommés.

### Cited Findings
- `showModal()` : élément promu en top layer, tout le reste rendu inerte, fermeture par Échap, focus sur le premier élément focalisable ou sur `[autofocus]`, et **retour du focus à l'élément précédemment focalisé à la fermeture** ; `::backdrop` stylable. `<dialog>` est disponible partout depuis mars 2022. — [MDN, &lt;dialog&gt; (modifié 02/10/2026)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
- Attribut `closedby` : `"any"` (bouton, Échap, clic à l'extérieur), `"closerequest"` (bouton, Échap — défaut avec `showModal()`), `"none"`. `requestClose()` déclenche un `cancel` annulable. Commandes déclaratives `commandfor` / `command="close"`. — [MDN, &lt;dialog&gt;](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
- Bonnes pratiques MDN : `autofocus` sur le premier élément utile, bouton de fermeture explicite, ne pas mettre `tabindex` sur le `<dialog>` ; `aria-modal="true"` implicite. — [MDN, &lt;dialog&gt;](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)
- Lenis : `lenis.stop()` met le défilement en pause, `lenis.start()` le reprend ; `data-lenis-prevent` (et `-wheel`, `-touch`) ou l'option `prevent: (node) => …` pour laisser défiler nativement un conteneur (ex. modale). — [Lenis (npm)](https://npmjs.com/package/lenis) ; [Lenis docs (Algolia DocSearch index)](https://docsearch.algolia.com/mcp/docs/repo/darkroomengineering/lenis)
- Le bouton de pause et les contrôles doivent exposer rôle, nom et état et être utilisables au clavier. — [AccessibleWeb](https://accessibleweb.com/question-answer/does-an-auto-play-video-with-a-pause-button-meet-accessibility-guidelines/)

### Inferences
- Schéma : `<dialog id="video-marque" aria-labelledby="titre-video" closedby="any">` contenant un titre (peut être visuellement masqué), la `<video>` (`preload="none"`, sources posées seulement à l'ouverture), les sous-titres et un bouton « Fermer la vidéo ». Ouverture : `lenis.stop()` + `dialog.showModal()` + `video.play()` dans le même gestionnaire de clic. Événement `close` : `video.pause()`, éventuellement `currentTime = 0`, `lenis.start()`. Le focus revient seul au bouton « Voir la vidéo » (natif).
- `closedby="any"` n'est pas encore universel (non sourcé ici) : garder un repli JS « clic sur le backdrop = fermer » (test `event.target === dialog`).
- Le top layer et `inert` gèrent le focus et les lecteurs d'écran, mais **pas** le défilement de la page derrière : avec Lenis, `lenis.stop()` est nécessaire ; sans Lenis, `html { overflow: hidden }` ou `body:has(dialog[open])`. Prévoir `scrollbar-gutter: stable` pour éviter un saut de mise en page (CLS) — inférence non sourcée.
- Contrôles : deux options. (1) `controls` natifs : accessibles et sans code, mais style imposé ; (2) contrôles maison : `<button>` réels avec noms français (« Lire », « Pause », « Couper le son », « Activer le son », « Sous-titres », « Plein écran »), `aria-pressed` pour les bascules, barre de progression en `<input type="range" aria-label="Position dans la vidéo" aria-valuetext="12 secondes sur 40">`. Pour 40 s, les contrôles natifs suffisent largement et réduisent le risque.
- Raccourcis clavier (si contrôles maison) : Espace/K lecture-pause, M son, C sous-titres, F plein écran, flèches ±5 s — limités au focus dans la modale pour ne pas voler les touches des lecteurs d'écran. Convention issue de YouTube, non normative (non sourcé).
- Respecter la règle du projet « un seul moteur par élément » : l'animation d'ouverture du dialog (opacity/transform sur `dialog[open]` et `::backdrop`, ou `@starting-style`) en CSS seulement, pas en GSAP en même temps ; variante mouvement réduit = apparition immédiate.

### Gaps
- Support navigateur de `closedby` et des commandes `commandfor/command` en 2026 : non vérifié dans les tableaux de compatibilité.
- Page officielle de la doc Lenis (lenis.darkroom.engineering) non consultée directement ; méthodes confirmées via le README npm.
- Pas de source sur le comportement VoiceOver iOS avec `<dialog>` + `<video>` plein écran natif en 2026.

## 6. Lisibilité du titre sur la vidéo : voile, scrim, contrôle du contraste sur un fond mobile

### Takeaway
Le contraste 1.4.3 (4,5:1, 3:1 pour le gros texte) doit tenir sur **chaque image** de la boucle, pas en moyenne : on y parvient avec une vidéo sombre et peu contrastée, plus un voile (dégradé ou aplat semi-opaque) sous le texte, et on vérifie sur les images les plus claires.

### Cited Findings
- 1.4.3 : 4,5:1 (3:1 pour le gros texte) ; texte posé sur image, dégradé ou `backdrop-filter` doit garder ce contraste. — [Acquia Web Governance, texte sur image/dégradé](https://docs.acquia.com/web-governance/text-top-image-gradient-or-backdrop-filter-should-have-minimum-contrast) ; [TestParty, guide 1.4.3 (2025)](https://testparty.ai/blog/wcag-1-4-3-contrast-minimum-2025-guide)
- Vidéos sombres ou voile sombre ; texte en gros corps ou dans des aplats pleins couvrant la vidéo ; mouvements lents. [ancien : 2018] — [V&A Digital blog](https://www.vam.ac.uk/blog/digital/moving-backgrounds-the-accessible-way)
- Sur une vidéo, le fond change dans le temps : un fond de couleur constant sous le texte garantit la lisibilité quel que soit le contenu. — [Cloudinary docs, accessible media / visual clarity of text](https://cloudinary.com/documentation/accessible_media_visual_audio_clarity_text)

### Inferences
- Méthode de vérification : extraire des images de la boucle (ex. `ffmpeg -vf fps=2`), mesurer la luminance maximale dans la zone du titre après application du voile, et calculer le contraste avec la couleur du texte sur la pire image. Les outils axe/Lighthouse ne mesurent pas le contraste sur une vidéo (ils voient le fond CSS) : test à faire à la main ou par script.
- Pour un design sombre « cosmique » figé : graduer la vidéo elle-même (réduire luminosité/contraste à l'export) plutôt que d'ajouter un voile visible qui modifierait le design ; un dégradé radial ou linéaire local derrière le titre (élément `::before` en `opacity` seulement) reste conforme à la règle « transform et opacity ».
- Le poster et la première image de la vidéo doivent être identiques (pas de saut au démarrage) et le poster est ce qui compte pour le LCP et le contraste en mouvement réduit.
- Éviter `backdrop-filter: blur()` sur la vidéo : coût GPU à chaque image, et la règle du projet prévoit des surfaces pleines en `prefers-reduced-transparency`.

### Gaps
- Pas de source 2023–2026 de référence (W3C, NN/g, Smashing) dédiée au contrôle du contraste sur fond vidéo ; les sources trouvées sont des guides éditeurs (Acquia, Cloudinary, TestParty) et un billet de 2018.
- Pas d'outil standard repéré qui mesure automatiquement le contraste image par image sur une vidéo web.
