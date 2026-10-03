# Encodage et performance vidéo web (2026) : boucle de fond du hero et film de marque 40 s

Contexte : (a) boucle muette 6–10 s en fond de hero ; (b) film 1080p de 40 s avec son (motion design, coupes rapides, fonds sombres en dégradé + grain). Budgets : Lighthouse mobile Perf ≥ 90, LCP ≤ 2,0 s, CLS ≤ 0,05, ≤ 300 Ko au-dessus de la ligne de flottaison, hébergement statique (GitHub Pages / Vercel). Recherche faite le 2026-10-03.

## 1. Support des codecs en 2026 et ordre des `<source>`

### Takeaway
AV1 couvre ~95 % des usages mondiaux selon caniuse, mais Safari (macOS/iOS) ne le décode que sur puces avec décodeur matériel (A17 Pro / M3 et plus récents) : il faut donc toujours une source de repli H.264 (MP4). HEVC n'est complet que dans Safari ; Chrome/Edge/Firefox le décodent partiellement selon le matériel, ce qui en fait un mauvais choix de repli universel. Ordre recommandé : AV1 (MP4) → VP9 (WebM, optionnel) → H.264 (MP4, `+faststart`).

### Cited Findings
- AV1 : 95,02 % d'usage mondial ; Chrome 70+, Firefox 67+, Edge 121+ (support coupé avant Edge 116), Samsung Internet 12+ « full » ; Safari desktop et iOS 17.0+ « partial » — [caniuse AV1](https://caniuse.com/av1)
- Safari ne prend en charge AV1 que sur les appareils Apple dotés d'un décodeur matériel AV1, ajouté avec les puces M3 / A17 Pro (2023) ; pas de décodage logiciel AV1 par Apple — [Bitmovin, Apple AV1 support](https://bitmovin.com/blog/apple-av1-support) ; [testmuai AV1 browser support](https://www.testmuai.com/learning-hub/av1-browser-support/)
- Un bug WebKit récent (n° 311593) et un article italien évoquent l'évolution du support AV1 matériel dans Safari, sans que j'aie pu vérifier le contenu exact — [WebKit Bugzilla 311593](https://bugs.webkit.org/show_bug.cgi?id=311593) ; [macitynet](https://www.macitynet.it/safari-integrera-il-supporto-al-codec-av1-via-hardware/)
- HEVC : 93,53 % d'usage mondial mais Chrome « partial » depuis v107 (dépend du matériel ; support logiciel « WontFix » pour raisons de licence), Edge partiel, Firefox partiel à partir de v137 (désactivé jusqu'à v136), Safari complet depuis v11 — [caniuse HEVC](https://caniuse.com/hevc)
- Chaînes `codecs` exactes (MDN) :
  - AV1 : `av01.P.LLT.DD` ; P=0 (Main), LL niveau (`05M` = niveau 2.1 Main, `08M` = 2.2 Main, `15M` = 5.3 Main), DD=08/10 bits. Exemple : `av01.0.15M.10` — [MDN, codecs parameter](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/codecs_parameter)
  - VP9 : `vp09.PP.LL.DD` (ex. `vp09.00.40.08`) ou simplement `codecs="vp9"` en WebM ; avec Opus : `video/webm;codecs="vp9,opus"` — [MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/codecs_parameter)
  - HEVC : `hvc1.1.6.L186.B0` (préférer `hvc1` à `hev1` pour Safari — voir Inférences) — [MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/codecs_parameter)
  - H.264 : `avc1.42E01E` (Baseline 3.0), `avc1.4D401F` (Main), `avc1.64001E` (High 3.0) ; niveaux : 1E=3.0, 28=4.0, 32=5.0 — [MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/codecs_parameter)
  - Audio : AAC-LC `mp4a.40.2`, Opus `opus` — [MDN](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/codecs_parameter)

### Inferences
- Les niveaux AV1 se calculent : X = 2 + (LL >> 2), Y = LL & 3 (MDN). Donc pour 720p30 → niveau 3.1 (`av01.0.05M.08` est en fait niveau 3.1 : LL=05 → X=2+1=3, Y=1). Correction de la formule de l'exemple MDN récupéré : `05M` = 3.1, `08M` = 4.0, `09M` = 4.1, `12M` = 5.0. Pour du 1080p30 8 bits, `av01.0.08M.08` (niveau 4.0) est l'étiquette usuelle ; pour 720p, `av01.0.05M.08`. (À vérifier avec `ffprobe`/`mediainfo` sur le fichier réel : l'étiquette doit correspondre au flux, sinon `canPlayType` peut répondre faux.) Note : le résumé MDN obtenu indiquait « 05M = niveau 2.1 », ce qui contredit la formule qu'il donne lui-même ; la formule donne 3.1.
- Proposition de balisage (boucle muette) :
  ```html
  <video autoplay muted loop playsinline preload="none" poster="hero-poster.avif" width="720" height="900" aria-hidden="true">
    <source src="hero-720.av1.mp4" type='video/mp4; codecs="av01.0.05M.08"'>
    <source src="hero-720.vp9.webm" type='video/webm; codecs="vp9"'>
    <source src="hero-720.h264.mp4" type='video/mp4; codecs="avc1.4D401F"'>
  </video>
  ```
  Sur un iPhone sans décodeur AV1, `canPlayType` refuse la source AV1 et Safari tombe sur H.264 : le `codecs=` est indispensable pour que ce repli fonctionne sans télécharger le premier fichier.
- VP9 est optionnel en 2026 : tout navigateur qui lit VP9 lit aussi AV1 en logiciel (Chrome/Firefox), sauf vieux Safari. Le garder seulement si l'on veut couvrir des appareils Android anciens sans décodage AV1 efficace. Deux sources (AV1 + H.264) suffisent dans la plupart des cas.
- HEVC n'apporte rien comme repli universel ; utile seulement si l'on veut une vidéo à canal alpha pour Safari (non requis ici).

### Gaps
- La mention caniuse « Chrome Android 154+ full » reflète la dernière version listée, pas la date d'arrivée réelle.
- Je n'ai pas pu confirmer si Safari 26 accepte AV1 en conteneur WebM autant qu'en MP4 ; le MP4 est le choix sûr.
- Le chiffre de part réelle d'iPhones sans décodeur AV1 (antérieurs à l'iPhone 15 Pro) n'a pas été trouvé.

## 2. Débits, CRF, tailles de fichiers et commandes ffmpeg

### Takeaway
Référence Google VP9 VOD : 720p ≈ 1 024 kb/s (CRF 32), 1080p ≈ 1 800 kb/s (CRF 31). SVT-AV1 : CRF de départ 30 en 1080p, 32–35 pour un usage courant, preset 4–6 en qualité ; `film-grain` synthétise le grain au lieu de l'encoder. Pour une boucle de fond muette à fond sombre, viser ~0,5–1 Mo (AV1) ; pour 40 s en 1080p, ~6–9 Mo.

### Cited Findings
- SVT-AV1 (doc officielle FFmpeg) :
  - CRF de départ pour 1080p : 30 ; usage personnel 32 ; rapide 35 ; VOD pro 25. Presets : 2 (efficacité max), 5 (équilibré), 10 (rapide), 13 (max vitesse) — [SVT-AV1 Ffmpeg.md](https://gitlab.com/AOMediaCodec/SVT-AV1/-/raw/master/Docs/Ffmpeg.md)
  - Commande type : `ffmpeg -i in.mkv -c:v libsvtav1 -preset 5 -crf 32 -g 240 -pix_fmt yuv420p10le -svtav1-params tune=0:film-grain=8 -c:a copy out.mkv` — [SVT-AV1 Ffmpeg.md](https://gitlab.com/AOMediaCodec/SVT-AV1/-/raw/master/Docs/Ffmpeg.md)
  - Images clés : environ une par seconde en VOD ; règle empirique « 10 × la cadence, jamais plus de 300 » — [SVT-AV1 Ffmpeg.md](https://gitlab.com/AOMediaCodec/SVT-AV1/-/raw/master/Docs/Ffmpeg.md)
  - `film-grain` : 8 pour du live action, 10–15 pour beaucoup de grain, 4–6 pour l'animation 2D, à omettre sans grain naturel — [SVT-AV1 Ffmpeg.md](https://gitlab.com/AOMediaCodec/SVT-AV1/-/raw/master/Docs/Ffmpeg.md)
- Google, réglages VP9 VOD : 1280×720 → cible 1 024 kb/s (512–1 485), CRF 32, tile-columns 2, threads 4 ; 1920×1080 → 1 800 kb/s (900–2 610), CRF 31 ; 640×360 → 276 kb/s, CRF 36. Deux passes : vitesse 4 puis 1–2, `-quality good`, `-g 240` — [Google VP9 VOD settings](https://developers.google.com/media/vp9/settings/vod)
- Exemple Google (2 passes) : `ffmpeg -i in -vf scale=640x480 -b:v 750k -minrate 375k -maxrate 1088k -tile-columns 1 -g 240 -threads 2 -quality good -crf 33 -c:v libvpx-vp9 -c:a libopus -pass 1 -speed 4 out.webm` puis même ligne avec `-pass 2 -speed 1` — [Google VP9 VOD settings](https://developers.google.com/media/vp9/settings/vod)
- web.dev (remplacer les GIF) : `ffmpeg -i in.gif -b:v 0 -crf 25 -f mp4 -vcodec libx264 -pix_fmt yuv420p out.mp4` ; dimensions impaires : `-vf "crop=trunc(iw/2)*2:trunc(ih/2)*2"` ; WebM : `ffmpeg -i in.gif -c vp9 -b:v 0 -crf 41 out.webm`. Exemple : GIF 3,7 Mo → MP4 551 Ko → WebM 341 Ko — [web.dev, Replace GIFs with videos](https://web.dev/articles/replace-gifs-with-videos)

### Inferences
- Tailles cibles (calcul : débit × durée) : 8 s à 800 kb/s = 0,8 Mo ; 8 s à 500 kb/s = 0,5 Mo. Pour un fond sombre majoritairement dégradé, AV1 à 720×900 et CRF 35–40 devrait tenir dans 300–800 Ko ; H.264 de repli 1,5–2,5× plus lourd. Film 40 s 1080p : à 1,8 Mb/s (référence VP9) = 9 Mo ; AV1 à CRF 30–32 typiquement 20–30 % sous VP9 → ~6–7 Mo ; H.264 CRF 23 probablement 12–18 Mo. Ces chiffres sont des estimations à valider par mesure sur le vrai contenu (le grain et les coupes rapides font monter le débit).
- Commandes proposées (à mesurer) :
  - Boucle mobile AV1, muette, 8 bits pour compatibilité maximale du décodage matériel :
    `ffmpeg -i src.mov -vf "scale=720:-2,fps=30" -an -c:v libsvtav1 -preset 4 -crf 36 -g 60 -pix_fmt yuv420p -svtav1-params tune=0:film-grain=8:film-grain-denoise=1 -movflags +faststart hero-720.av1.mp4`
  - Repli H.264 : `ffmpeg -i src.mov -vf "scale=720:-2,fps=30" -an -c:v libx264 -preset slow -crf 26 -profile:v main -tune grain -g 60 -pix_fmt yuv420p -movflags +faststart hero-720.h264.mp4` (sans `-tune grain` si le grain a été retiré : il gonfle fortement le fichier).
  - VP9 : `ffmpeg -i src.mov -vf scale=720:-2 -an -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -tile-columns 2 -quality good -speed 1 -g 60 -pix_fmt yuv420p hero-720.vp9.webm` (2 passes recommandées par Google).
  - Film 40 s avec son : `ffmpeg -i film.mov -c:v libsvtav1 -preset 4 -crf 30 -g 30 -pix_fmt yuv420p -svtav1-params tune=0:film-grain=8 -c:a libopus -b:a 128k film-1080.av1.webm` ou en MP4 avec `-c:a aac -b:a 160k -movflags +faststart` ; repli `libx264 -crf 22 -preset slow -c:a aac -b:a 160k -movflags +faststart`.
- Grain sur fond sombre : le grain est du bruit haute fréquence, le pire cas pour l'encodeur. Options : (1) débruiter puis laisser AV1 resynthétiser le grain (`film-grain=N`, `film-grain-denoise=1`) → gros gain de poids, rendu proche ; (2) retirer le grain de la vidéo et l'ajouter en CSS/canvas par-dessus (une petite texture tuilée animée en `transform`), ce qui est compatible avec la règle du projet « transform et opacity seulement » et fonctionne aussi sur le repli H.264 qui ne sait pas synthétiser le grain. L'option 2 est la plus robuste ; elle garantit le même rendu sur tous les codecs.
- Dégradés sombres : risque de bandes (banding). Le 10 bits (`yuv420p10le`) réduit le banding en AV1 mais le décodage matériel 10 bits n'est pas garanti partout ; un léger grain (même ajouté en CSS) masque le banding.
- `-g` court (1–2 s) en boucle : facilite le retour au début sans saccade et le seek ; pour le film à coupes rapides, l'encodeur place des images clés aux changements de scène.

### Gaps
- Le wiki FFmpeg (H.264, VP9, AV1) était inaccessible (protection Anubis) : pas de citation directe des plages CRF x264 (défaut 23, plage « raisonnable » 17–28 selon mémoire, non vérifié ici).
- Aucune source chiffrée trouvée sur le poids réel d'une boucle sombre avec grain ; à mesurer sur la source.
- Pas vérifié si le décodage matériel AV1 d'Apple accepte le grain synthétisé et le 10 bits sans repli logiciel.

## 3. Sources responsives (`<source media>`), CLS et recadrage

### Takeaway
L'attribut `media` sur `<source>` dans `<video>` est de nouveau supporté partout : Chrome 120 et Firefox 120 (fin 2023), Safari ne l'avait jamais retiré. Limite : la media query n'est évaluée qu'au chargement, pas au redimensionnement.

### Cited Findings
- Retiré de la spec et des navigateurs (sauf WebKit), puis réintroduit à la mi-2023 après accord Chrome/Firefox — [Scott Jehl, Responsive video](https://scottjehl.com/posts/responsive-video/) (28 sept. 2023)
- Chrome 120 (29 nov. 2023) et Firefox 120 ont rétabli `media` sur `<source>` vidéo ; Safari ne l'avait jamais retiré → support multi-navigateurs — [Scott Jehl, Using responsive video](https://scottjehl.com/posts/using-responsive-video/)
- La sélection se fait à la première source dont `media` et `type` conviennent ; la vidéo n'est réévaluée qu'au chargement, pas au redimensionnement — [Scott Jehl](https://scottjehl.com/posts/responsive-video/) ; [web.dev, video and source tags](https://web.dev/video-and-source-tags)

### Inferences
- Combiner `media` et `type` dans l'ordre : portrait AV1, portrait H.264, puis paysage AV1, paysage H.264 :
  ```html
  <source media="(max-width: 767px)" src="hero-720x900.av1.mp4" type='video/mp4; codecs="av01.0.05M.08"'>
  <source media="(max-width: 767px)" src="hero-720x900.h264.mp4" type='video/mp4; codecs="avc1.4D401F"'>
  <source src="hero-1280x720.av1.mp4" type='video/mp4; codecs="av01.0.05M.08"'>
  <source src="hero-1280x720.h264.mp4" type='video/mp4; codecs="avc1.4D401F"'>
  ```
  Comme on injecte la vidéo après le chargement (voir §4), on peut aussi choisir la source en JS (`matchMedia` + `canPlayType`) au moment de l'injection — c'est l'équivalent, et c'est déjà évalué une seule fois.
- CLS : donner `width`/`height` ou `aspect-ratio` au conteneur, et positionner la vidéo en `position:absolute; inset:0; object-fit:cover` dans une boîte déjà dimensionnée par le poster : aucun décalage quand la vidéo remplace le poster.
- Recadrage ffmpeg : 9:16 → 16:9 (centré) : `-vf "crop=iw:iw*9/16:0:(ih-iw*9/16)/2,scale=1280:720"` ; 16:9 → 4:5 : `-vf "crop=ih*4/5:ih,scale=720:900"` ; 16:9 → 9:16 : `-vf "crop=ih*9/16:ih,scale=720:1280"`. Les dimensions doivent être paires en yuv420p (`scale=720:-2`).

### Gaps
- Pas de source 2026 confirmant l'absence de régression ; données de 2023 (Chrome/Firefox 120), plausibles toujours valides.

## 4. LCP : la vidéo est-elle candidate ? Comment garder un LCP rapide

### Takeaway
Depuis Chrome 116 (août 2023), `<video>` est candidat LCP ; l'horodatage retenu est le plus précoce entre le chargement du poster et la présentation de la première image. En pratique, le poster AVIF préchargé avec `fetchpriority="high"` fixe le LCP, et la vidéo qui le remplace ensuite ne crée généralement pas de nouveau LCP. Chrome a encore affiné les entrées LCP vidéo en 2026 (v151, v153).

### Cited Findings
- Chrome 116 : les vidéos, auparavant ignorées sauf poster, deviennent candidates ; horodatage = présentation de la première image complète — [Chromium, LCP changelog 2023-08](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/2023_08_lcp.md)
- « poster image load time or first frame presentation time for videos is used—whichever is earlier » — [web.dev, LCP](https://web.dev/articles/lcp) (MAJ 4 sept. 2025)
- Changelog LCP : Chrome 112 ignore les images à faible entropie ; Chrome 130 exclut le texte transparent ; Chrome 147 émet les candidats d'après la plus grande image peinte ; Chrome 151 émet plus tôt l'entrée LCP vidéo (RequestMainFrameAfterFirstVideoFrame) et corrige le ramasse-miettes des métadonnées VideoTiming ; Chrome 153 corrige des courses dans l'horodatage des premières images vidéo — [Chromium, LCP changelog](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/lcp.md)
- Les images à faible entropie (placeholders) sont exclues du LCP — [web.dev, LCP](https://web.dev/articles/lcp)
- DebugBear : ajouter un poster, au même ratio que la vidéo, `object-fit: cover` ; précharger le poster avec `fetchpriority="high"` ; « Chrome does not support preloading video files » ; démo : 1,55 s (vidéo seule) → 1,23 s (poster) → 1,2 s (poster préchargé) ; la vidéo qui remplace le poster ne déclenche généralement pas de nouveau LCP — [DebugBear, optimize video LCP](https://www.debugbear.com/blog/optimize-video-lcp)
- Lighthouse : sur le profil mobile simulé, un seul vidéo HD en autoplay peut suffire à faire chuter le score ; TBT pèse 30 % du score — [Framer, guide des scores Lighthouse](https://www.framer.com/help/articles/guide-to-lighthouse-scores/) (source secondaire)

### Inferences
- Risque spécifique au projet : un poster très sombre et uniforme peut être jugé « faible entropie » (Chrome 112+, seuil communément cité de 0,05 bit/pixel — non confirmé ici) et ignoré ; le LCP basculerait alors sur le titre (texte), ce qui n'est pas forcément mauvais. Garder un poster AVIF de qualité correcte (pas un aplat ultra-compressé) si l'on veut qu'il soit l'élément LCP, ou s'assurer que le titre texte s'affiche vite.
- Schéma recommandé pour tenir ≤ 300 Ko au-dessus de la ligne de flottaison :
  1. `<link rel="preload" as="image" href="hero-poster.avif" fetchpriority="high" type="image/avif">` (poster AVIF ~20–60 Ko, rendu de la première image exacte de la boucle) ;
  2. `<video preload="none" poster=...>` sans `src` ni `autoplay` dans le HTML ;
  3. injection des `<source>` + `play()` après l'événement `load` puis `requestIdleCallback` (comme la scène du hero actuelle « après l'intro »), seulement si : pas de `prefers-reduced-motion: reduce`, pas de `saveData`, connexion pas en `2g`/`slow-2g`.
  Ainsi Lighthouse mesure le poster pour le LCP et, si la fenêtre d'observation se termine avant l'idle, ne compte pas les octets vidéo (à vérifier : Lighthouse attend le « network quiet », il est probable qu'il voie la vidéo dans le poids total même s'il ne la compte pas pour le LCP).
- `autoplay` dans le HTML force le téléchargement dès le parsing, en concurrence avec les polices et le poster ; `preload="none"` est ignoré quand `autoplay` est présent (comportement de spec bien connu, non cité ici). D'où l'injection différée.
- Décodage vidéo : se fait hors fil principal, donc peu d'impact direct sur TBT ; le coût est surtout réseau (bande passante simulée 1,6 Mb/s en Lighthouse mobile — chiffre de mémoire, non vérifié) et GPU/batterie.

### Gaps
- Pas de documentation officielle trouvée sur la façon dont Lighthouse (2026) traite les octets d'une vidéo chargée après `load` (poids total « enormous network payloads »).
- Seuil exact de faible entropie non publié dans les sources consultées.

## 5. Pause hors écran, économie de données, hébergement statique

### Takeaway
Safari met déjà en pause les vidéos `autoplay` non visibles ; ailleurs, piloter `play()/pause()` via IntersectionObserver et `visibilitychange`. `navigator.connection.saveData` n'est pas Baseline (absent de Safari/Firefox) : l'utiliser comme indice seulement. GitHub Pages : 1 Go par site, 100 Go/mois de bande passante (soft) ; Vercel Hobby : 100 Mo de fichiers source par déploiement CLI.

### Cited Findings
- WebKit (iOS) : `<video muted>` peut s'auto-lancer sans geste ; une vidéo sans piste audio aussi ; `playsinline` évite le plein écran sur iPhone ; les `<video autoplay>` se mettent en pause quand elles ne sont plus visibles et ne démarrent que visibles — [WebKit, New video policies for iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/) (2016, toujours la base)
- iOS en mode économie d'énergie : l'autoplay est bloqué et un bouton lecture s'affiche — [Webflow forum](https://discourse.webflow.com/t/autoplay-video-not-playing-on-low-power-mode/215057) ; [Apple Developer Forums](https://developer.apple.com/forums/thread/709821) (sources communautaires)
- Chrome : autoplay muet toujours autorisé ; autoplay avec son seulement après interaction ou MEI suffisant — [Chrome, Autoplay policy](https://developer.chrome.com/blog/autoplay)
- `navigator.connection.saveData` : « Limited availability », non Baseline — [MDN, saveData](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData)
- GitHub Pages : site publié ≤ 1 Go, dépôt recommandé ≤ 1 Go, bande passante soft 100 Go/mois, 10 builds/h (hors Actions), déploiement ≤ 10 min — [GitHub Docs, Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- Vercel : envoi de fichiers source via CLI limité à 100 Mo (Hobby) / 1 Go (Pro) — [Vercel, Limits](https://vercel.com/docs/limits) (MAJ 16 sept. 2026)

### Inferences
- Code type : IntersectionObserver (`threshold: 0`) → `pause()` hors écran, `play().catch(()=>{})` en vue ; `document.visibilitychange` → pause ; `matchMedia('(prefers-reduced-motion: reduce)')` écouté en direct → pause + poster (exigence du projet). Prévoir `init()/destroy()`.
- Le bouton « lecture » d'iOS en Low Power Mode sur une vidéo décorative : masquer via `video::-webkit-media-controls-start-playback-button { display:none }` (technique répandue, non citée ici) et garder le poster visible si `play()` est rejeté.
- Film 40 s avec son : `preload="none"` + poster + `controls`, chargé au clic (ou `preload="metadata"` quand la section approche). Pas d'autoplay avec son (bloqué de toute façon).
- Range requests : les CDN de GitHub Pages et de Vercel servent les fichiers statiques avec `Accept-Ranges: bytes` (à vérifier avec `curl -I -H "Range: bytes=0-1"` sur le déploiement : attendre `206 Partial Content`). `-movflags +faststart` place l'atome `moov` en tête pour commencer la lecture sans télécharger la fin.
- Poids total : 4 fichiers de boucle (~3 Mo) + 2 films (~25 Mo) restent très loin des limites ; le risque réel est la bande passante soft de 100 Go/mois de GitHub Pages (≈ 4 000 lectures complètes du film à 25 Mo).

### Gaps
- Pas de source officielle 2026 sur les en-têtes `Accept-Ranges`/cache par défaut de GitHub Pages (max-age=600 de mémoire, non vérifié) ni de Vercel pour les `.mp4`.
- Taille max d'un fichier individuel sur Vercel non trouvée dans l'extrait ; GitHub (dépôt git) bloque les fichiers > 100 Mo (connu, non cité ici).

## 6. Poster : format, taille, correspondance avec la première image

### Takeaway
Le poster doit être la première image exacte de la vidéo, au même ratio, en AVIF (repli WebP impossible dans l'attribut `poster`, qui n'accepte qu'une URL), préchargé en `fetchpriority="high"`.

### Cited Findings
- Poster au même ratio que la vidéo, format moderne, doit charger avant la vidéo, `object-fit: cover` — [DebugBear](https://www.debugbear.com/blog/optimize-video-lcp)
- La vidéo remplaçant le poster ne crée généralement pas de nouveau LCP — [DebugBear](https://www.debugbear.com/blog/optimize-video-lcp)

### Inferences
- Extraire la première image : `ffmpeg -i hero-720.h264.mp4 -frames:v 1 -update 1 poster.png` puis encoder en AVIF (`avifenc -q 60 poster.png poster.avif` ou `ffmpeg -i poster.png -c:v libaom-av1 -still-picture 1 -crf 30 poster.avif`). Extraire depuis le fichier encodé (pas la source) pour que les couleurs et le niveau de bruit correspondent → pas de flash au passage poster → vidéo.
- Pour une boucle, faire commencer et finir la boucle sur la même image afin que le poster soit identique à l'image de reprise.
- L'attribut `poster` ne gère ni `srcset` ni repli de format : si un repli WebP est nécessaire, utiliser un `<picture>` (poster maison) derrière la `<video>` en `position:absolute`, avec `<source media>` 1×1 pour éviter les téléchargements inutiles (méthode déjà employée dans le projet), et ne pas mettre d'attribut `poster`. AVIF est lu par tous les navigateurs modernes ; un poster AVIF seul est acceptable.
- Taille cible : 720×900 AVIF sombre ≈ 15–40 Ko ; 1280×720 ≈ 20–50 Ko (estimation, à mesurer). Laisse la marge pour rester < 300 Ko au-dessus de la ligne de flottaison avec polices et CSS.
- Couleur : encoder en BT.709 (`-colorspace bt709 -color_primaries bt709 -color_trc bt709`) pour éviter un décalage de teinte entre poster (sRGB) et vidéo, visible surtout sur les fonds sombres.

### Gaps
- Pas de source primaire sur les décalages de gamma poster/vidéo selon les navigateurs ; recommandation issue de la pratique.
