# Différer la vidéo, raconter l'équipe sans détourner le scroll

**La réponse courte :** la boucle muette du hero ne doit pas entrer dans le chargement initial. Elle se pose comme un décor différé : un poster AVIF préchargé porte le LCP, et la vidéo (AV1 puis repli H.264, sans piste audio) est injectée en JS après l'intro, seulement hors mouvement réduit et hors Save-Data. Elle a un bouton pause visible, car WCAG 2.2.2 l'exige même pour un décor qui boucle plus de 5 s. Le film de 40 s, lui, est un contenu. Il s'ouvre au clic dans un `<dialog>` natif avec `showModal()`, des sous-titres français WebVTT activés par défaut et une transcription. Une audiodescription ou un équivalent devient obligatoire au niveau AA si l'image dit des choses que la bande-son ne dit pas. Pour « L'équipe Saturn », les sites d'agents IA vérifiés ne montrent pas de graphe orbital. Ils racontent la collaboration par des cartes de personnages (prénom, poste, une phrase), un élément central partagé et un relais de mission. Le bon format est donc un hub en CSS sur ordinateur et une frise verticale à 375 px, sur le même DOM, avec une animation « mission » de 3 à 4 s déclenchée une fois, et pas une longue section épinglée. L'enjeu est concret : le site tient aujourd'hui 244–252 Ko au-dessus de la ligne de flottaison pour un budget de 300 Ko. Son LCP mobile simulé échoue déjà à 2,8 s (budget 2,0 s) et son score Perf oscille entre 88 et 91 (`docs/PERFORMANCE.md`). Une vidéo chargée naïvement casserait ces trois budgets à la fois. Enfin, aucune étude publique sérieuse ne prouve qu'une vidéo de hero augmente la conversion : il faut la traiter comme un pas de réassurance, et la mesurer.

## Le poster porte le LCP, la boucle arrive après l'intro

Depuis Chrome 116, `<video>` peut être l'élément LCP. Le temps retenu est le plus précoce entre le chargement du poster et l'affichage de la première image ([Chromium, changelog LCP 2023-08](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/2023_08_lcp.md) ; [web.dev, LCP](https://web.dev/articles/lcp)). Chrome a encore ajusté ces entrées vidéo en 2026, dans les versions 151 et 153 ([Chromium, changelog LCP](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/lcp.md)). **Chrome ne sait pas précharger un fichier vidéo**, mais il précharge un poster. Dans la démonstration de DebugBear, le LCP passe de 1,55 s (vidéo seule) à 1,23 s avec un poster, puis à 1,2 s avec le poster préchargé. La vidéo qui remplace ensuite le poster ne crée en général pas de nouveau LCP ([DebugBear](https://www.debugbear.com/blog/optimize-video-lcp)).

Il y a une subtilité propre à Saturn. Une image très sombre et uniforme risque d'être classée « faible entropie » et exclue des candidats LCP ([web.dev, LCP](https://web.dev/articles/lcp)). Le LCP retomberait alors sur le texte du hero, ce qui est déjà le cas sur mobile aujourd'hui (`p.lead`). Dans les deux cas, le paragraphe et le poster doivent s'afficher vite.

Le schéma qui tient les budgets se fait en trois temps. D'abord, un `<link rel="preload" as="image" fetchpriority="high">` sur le poster AVIF, qui est la première image exacte de la boucle extraite du fichier encodé : pas de flash, mêmes couleurs, même grain. Ensuite, une `<video muted loop playsinline preload="none" aria-hidden="true">` dans le HTML, **sans `src` ni `autoplay`**, car l'attribut `autoplay` déclenche le téléchargement dès l'analyse du HTML. Enfin, l'injection des sources et l'appel à `play()` après `load`, puis `requestIdleCallback` (avec un repli `setTimeout` pour Safari), comme la scène du worker aujourd'hui. Cette injection est conditionnée : pas de `prefers-reduced-motion: reduce`, pas de `navigator.connection.saveData`, pas de connexion en `2g`. web.dev décrit cette approche (sources en `data-src` injectées à l'entrée dans le viewport) pour le chargement différé ([web.dev, Lazy loading video](https://web.dev/articles/lazy-loading-video)).

`saveData` n'est pas Baseline : Safari et Firefox ne l'exposent pas, il ne sert donc que d'indice ([MDN, saveData](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData)). `prefers-reduced-data` n'est implémenté par aucun navigateur ([MDN](https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-data)).

Un point reste ouvert : on ignore si Lighthouse 2026 compte les octets d'une vidéo chargée en idle dans le poids total. Il faut le mesurer sur secteur avant de conclure.

Côté CLS, la vidéo se place en `position:absolute; inset:0; object-fit:cover` dans une boîte déjà dimensionnée (`width`/`height` ou `aspect-ratio`) : le passage du poster à la vidéo ne décale rien.

Pour les sources responsives, l'attribut `media` sur `<source>` vidéo est revenu dans Chrome 120 et Firefox 120, et Safari ne l'avait jamais retiré ([Scott Jehl](https://scottjehl.com/posts/using-responsive-video/)). Mais la media query n'est évaluée qu'au chargement ([Scott Jehl](https://scottjehl.com/posts/responsive-video/)). Puisque l'injection se fait de toute façon en JS, le plus simple est de choisir le fichier à ce moment-là, avec `matchMedia` et `canPlayType` : une version portrait 720×900 pour mobile, une version paysage 1280×720 pour ordinateur.

Plusieurs mécanismes d'autoplay échouent même en muet. iOS en mode économie d'énergie bloque l'autoplay, muet compris (bug WebKit 216887, toujours ouvert) ([WebKit Bugzilla](https://bugs.webkit.org/show_bug.cgi?id=216887)). Firefox permet de tout bloquer et n'autorise pas l'autoplay dans un onglet en arrière-plan ([MDN, Autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)). Le code traite donc la promesse de `play()` : sur `NotAllowedError`, on reste sur le poster et on masque le bouton pause. On ne montre pas un gros bouton lecture sur un décor.

WebKit met déjà en pause les vidéos autoplay hors écran ([WebKit](https://webkit.org/blog/6784/new-video-policies-for-ios/)). Ailleurs, un IntersectionObserver et `visibilitychange` font le même travail. La reprise n'a lieu que si l'utilisateur n'a pas mis en pause lui-même. Ce comportement évite aussi que la vidéo concurrence le canvas du worker.

**Décision d'architecture à prendre :** la boucle vidéo et la scène canvas du hero ne doivent pas tourner en même temps. Deux décodeurs ou animations plein écran superposés contredisent le principe « un seul moteur par élément ». C'est aussi la configuration la plus risquée pour les ≥ 50 i/s mobiles déjà mesurés à 55–59 i/s.

## AV1 d'abord, H.264 toujours, et le grain sorti de la vidéo

AV1 couvre **95,02 % de l'usage mondial** selon caniuse ([caniuse AV1](https://caniuse.com/av1)). Mais Safari ne le décode qu'avec un décodeur matériel, présent sur les puces A17 Pro et M3 et plus récentes, sans décodage logiciel ([Bitmovin](https://bitmovin.com/blog/apple-av1-support)). Un repli H.264 en MP4 avec `+faststart` reste donc obligatoire.

HEVC n'est un repli universel nulle part : son support est partiel dans Chrome, Edge et Firefox, qui dépendent du matériel ([caniuse HEVC](https://caniuse.com/hevc)). VP9 est facultatif en 2026. Deux sources suffisent : AV1 puis H.264.

Le paramètre `codecs` doit être exact pour que `canPlayType` refuse AV1 sur un iPhone ancien sans télécharger le fichier. Par exemple `av01.0.05M.08` (niveau 3.1, pour du 720p) ou `av01.0.08M.08` (niveau 4.0, pour du 1080p), et `avc1.4D401F` pour H.264 Main ([MDN, paramètre codecs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/codecs_parameter)). L'extrait MDN consulté se contredit sur la correspondance entre `05M` et le niveau AV1. Il faut donc vérifier l'étiquette avec `ffprobe` sur le fichier réel.

Pour les réglages de départ, la documentation officielle de SVT-AV1 conseille un CRF 30 en 1080p, 32 pour un usage courant et 35 pour un encodage rapide. Le preset 5 est l'équilibre, et il faut environ une image clé par seconde. Le réglage `film-grain` vaut 8 pour une prise de vue réelle et 4–6 pour de l'animation ([SVT-AV1, Ffmpeg.md](https://gitlab.com/AOMediaCodec/SVT-AV1/-/raw/master/Docs/Ffmpeg.md)). Google cible environ 1 024 kb/s en VP9 pour du 720p (CRF 32) et 1 800 kb/s pour du 1080p (CRF 31) ([Google, VP9 VOD](https://developers.google.com/media/vp9/settings/vod)).

Le tableau ci-dessous tire de ces repères des **ordres de grandeur estimés, non mesurés**. Les coupes rapides et le grain font monter le débit, et seul l'encodage du vrai film tranchera.

| Fichier | Définition | Codec, réglage de départ | Taille estimée (à mesurer) |
|---|---|---|---|
| Boucle mobile | 720×900, 30 i/s, 8 s, sans audio | AV1 CRF 36, preset 4 | ~0,3–0,8 Mo |
| Boucle mobile, repli | idem | H.264 Main CRF 26 | ~1,5–2,5 × l'AV1 |
| Boucle ordinateur | 1280×720 | AV1 CRF 34–36 | ~0,5–1 Mo |
| Poster | 720×900 / 1280×720 | AVIF | ~15–50 Ko |
| Film 40 s | 1080p, avec son | AV1 CRF 30 + Opus/AAC | ~6–9 Mo |
| Film 40 s, repli | 1080p | H.264 CRF 22 + AAC 160k | ~12–18 Mo |

Ces commandes sont des points de départ, à mesurer sur la source réelle :

```bash
# Boucle mobile AV1 : muette (-an), 8 bits, image clé toutes les 2 s
ffmpeg -i src.mov -vf "scale=720:-2,fps=30" -an -c:v libsvtav1 -preset 4 -crf 36 -g 60 \
  -pix_fmt yuv420p -svtav1-params tune=0 -movflags +faststart hero-720.av1.mp4

# Repli H.264
ffmpeg -i src.mov -vf "scale=720:-2,fps=30" -an -c:v libx264 -preset slow -crf 26 \
  -profile:v main -g 60 -pix_fmt yuv420p -movflags +faststart hero-720.h264.mp4

# Recadrage 16:9 -> 4:5 pour le mobile
ffmpeg -i src.mov -vf "crop=ih*4/5:ih,scale=720:900" ...

# Film 40 s : AV1 + Opus, et repli H.264 + AAC
ffmpeg -i film.mov -c:v libsvtav1 -preset 4 -crf 30 -g 30 -pix_fmt yuv420p \
  -svtav1-params tune=0:film-grain=8 -c:a libopus -b:a 128k film-1080.av1.webm
ffmpeg -i film.mov -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart film-1080.h264.mp4

# Poster = première image du fichier ENCODÉ
ffmpeg -i hero-720.h264.mp4 -frames:v 1 -update 1 poster.png
```

Le grain sur fond sombre est le pire cas pour un encodeur. La synthèse de grain d'AV1 (`film-grain`) allège beaucoup le fichier, mais H.264 ne sait pas la reproduire : les deux versions n'auraient donc pas le même rendu. La solution la plus robuste est d'encoder la vidéo sans grain et de superposer une petite texture tuilée animée en `transform`. Cette méthode respecte la règle « transform et opacity seulement », donne le même rendu sur tous les codecs et masque aussi les bandes dans les dégradés sombres.

Pour finir, **faire commencer et finir la boucle sur la même image**, afin que poster et reprise coïncident. Côté hébergement, la marge est large : GitHub Pages accepte 1 Go publié et 100 Go/mois de bande passante, une limite souple ([GitHub Docs](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)), et la CLI Vercel Hobby accepte 100 Mo de fichiers source ([Vercel, Limits](https://vercel.com/docs/limits)). La prise en charge des requêtes partielles (`206 Partial Content`) sur les deux hébergeurs reste à vérifier avec `curl` une fois déployé.

## WCAG impose un bouton pause, des sous-titres et peut-être une audiodescription

Le critère 2.2.2 (niveau A) s'applique à tout contenu en mouvement qui démarre seul, dure plus de 5 s et s'affiche à côté d'autres contenus : il faut un moyen de le mettre en pause, de l'arrêter ou de le masquer ([W3C, Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)). Les auditeurs l'appliquent **même au contenu décoratif**. Les fonds vidéo sans contrôle figurent parmi les échecs les plus fréquents en audit ([Disability World](https://www.disabilityworld.org/toolkit/standards/wcag/2-2-2-pause-stop-hide/)). Une boucle de 6–10 s ne peut pas se réclamer de l'exception des 5 s, puisqu'elle recommence sans fin.

Le contrôle attendu est un vrai `<button type="button">` dans le hero, visible sans survol, d'au moins 44 × 44 px. Son nom change selon l'état (« Mettre la vidéo de fond en pause » / « Relancer la vidéo de fond ») ou il porte `aria-pressed`, et il arrive tôt dans l'ordre de tabulation. Le V&A ajoute une bonne pratique : limiter le nombre de boucles à la durée moyenne d'une visite, puis rester sur une image fixe. Cela économise la batterie dans les onglets oubliés, mais ne remplace pas le bouton ([V&A Digital](https://www.vam.ac.uk/blog/digital/moving-backgrounds-the-accessible-way)).

Le même problème se pose déjà sur le site : la pause du bandeau (A24 dans `docs/AUDIT.md`) attend une décision du client. Il serait cohérent de trancher les deux ensemble.

Le contraste 1.4.3 (4,5:1) doit tenir sur **chaque image** de la boucle, pas en moyenne. Un fond constant sous le texte est la seule garantie ([Cloudinary](https://cloudinary.com/documentation/accessible_media_visual_audio_clarity_text)). Comme le design est figé, on agit d'abord sur la vidéo elle-même, assombrie et désaturée à l'export. Si besoin, on ajoute un dégradé local derrière le titre. axe et Lighthouse ne mesurent pas le contraste sur une vidéo : il faut extraire des images (`ffmpeg -vf fps=2`) et vérifier la pire à la main ou par script.

Pour le film de 40 s, le critère 1.2.2 (niveau A) impose des sous-titres. Ils couvrent les paroles **et** les sons utiles : musique, effets, identification de la voix off ([W3C, Understanding 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html)). Le critère 1.2.5 (niveau AA) impose une audiodescription, sauf si la bande-son transmet déjà toute l'information visuelle importante ([W3C, Understanding 1.2.5](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-prerecorded.html)).

C'est le principal risque de conformité du projet. Un film de marque en motion design, monté en coupes rapides, montre des textes à l'écran, des noms de mascottes et des écrans que la voix off ne dit pas forcément. S'il est purement musical, toute l'information est visuelle. Une transcription complète couvre 1.2.3 (niveau A) mais pas, à elle seule, 1.2.5. Il faut donc vérifier le film plan par plan avant de le publier. Les options sont de réécrire la voix off pour qu'elle dise l'essentiel, ou de produire une seconde piste décrite.

En pratique, on place un `<track kind="captions" srclang="fr" label="Français" default>` dans `public/`, pour que Vite ne le hache pas. Le style passe par `::cue`, qui est Baseline mais limité à `color`, `background`, `font*`, `text-shadow` et quelques autres propriétés ([MDN, ::cue](https://developer.mozilla.org/en-US/docs/Web/CSS/::cue)). Le texte suit la typographie française (espace insécable avant « : ; ? ! ») et utilise `<v>` pour le locuteur. Point à tester : la version `build:file` (file://) risque de bloquer le `<track>` dans Chromium. Le repli consiste à créer les cues en JS avec `addTextTrack()` et `VTTCue`.

La modale repose sur `<dialog>` et `showModal()`. Cela fournit nativement la couche supérieure, l'arrière-plan inerte, la fermeture par Échap, et **le retour du focus au bouton déclencheur**. `closedby="any"` ajoute la fermeture par clic à l'extérieur ([MDN, dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)). Comme sa prise en charge n'a pas été vérifiée, on garde un repli JS sur `event.target === dialog`.

Il reste trois choses à coder. D'abord, `lenis.stop()` à l'ouverture et `lenis.start()` à la fermeture ([Lenis](https://npmjs.com/package/lenis)) : le top layer ne bloque pas le scroll de la page derrière. Ensuite, `video.play()` dans le même gestionnaire de clic, pour garder l'activation utilisateur, en particulier sur iOS ([WebKit](https://webkit.org/blog/6784/new-video-policies-for-ios/)). Enfin, `pause()` sur l'événement `close`.

Pour 40 s, **les contrôles natifs (`controls`) suffisent** et suppriment tout un pan de risque d'accessibilité. Des contrôles maison n'apportent qu'un style. L'animation d'ouverture se fait en CSS seul (opacity/transform, `@starting-style`), avec une apparition immédiate en mouvement réduit. Le mouvement réduit ne doit pas empêcher de lire le film, puisque l'utilisateur le demande explicitement. Il peut en revanche ouvrir la modale sans lancer la lecture.

## Cinq sites vérifiés racontent l'équipe par des personnages et des relais, pas par des orbites

Parmi une dizaine de sites d'agents IA examinés, cinq présentent réellement une équipe :

- **Sintra** : 12 personnages illustrés et nommés, chacun avec un métier, présentés en grille ou en carrousel de cartes. Au centre, un « Brain AI » présenté comme « One memory across your whole team » ([sintra.ai](https://sintra.ai)).
- **Marblism** : 7 employés IA en cartes (avatar rond, prénom, rôle, une phrase drôle à la première personne), et surtout une **frise d'une journée** où chacun intervient à son heure, d'Eva à 7 h à Linda à 23 h ([marblism.com](https://www.marblism.com)).
- **Relevance AI** : la promesse « Deploy your first team of agents » et un pipeline de vente en chaîne, de Research & Enricher à Meeting Scheduler ([relevanceai.com](https://relevanceai.com)).
- **11x** : deux « digital workers » nommés, des étapes en onglets et l'idée de relais « Every channel picks up where the last left off » ([11x.ai](https://www.11x.ai)).
- **Salesforce Agentforce** : le discours « Turn agents into teams » sur l'orchestration, mais en simples cartes horizontales, sans diagramme ([Agentforce](https://www.salesforce.com/agentforce/)).

Artisan, Lindy, Sierra et CrewAI ne présentent pas d'équipe d'agents en page d'accueil. Lindy fait même l'inverse avec « Your whole team shares one Lindy » ([lindy.ai](https://www.lindy.ai)).

**Limite importante :** ces pages ont été lues en texte, pas affichées. Leurs animations, leur comportement au scroll et leur rendu à 375 px n'ont pas été observés, et aucun exemple vérifié de hub-and-spoke animé n'a été trouvé. Une vérification dans un navigateur, à 375 px et sur ordinateur, s'impose avant de s'en inspirer visuellement.

Ces références convergent vers trois leviers de « symbiose » transposables :

- un élément central partagé : ici, le Team Lead 01 joue le rôle du cerveau commun ;
- un relais séquentiel : une mission part de 01, passe par 02 → 03 → 04 → 05 et revient à 01 ;
- un vocabulaire d'équipe (« une équipe, une mission »).

Chaque carte suit la recette Marblism : prénom, poste familier aux PME, ce que l'agent fait concrètement, ce qu'il vous évite, en une phrase visible d'emblée. Le détail se déplie avec `aria-expanded`, jamais au seul survol.

Sur ordinateur, la disposition est un hub : 01 au centre et les quatre spécialistes en losange, reliés par des traits fins statiques. Chaque spécialiste est un `<button aria-expanded aria-controls>`. On peut aussi utiliser un `tablist` conforme à l'APG (tabindex itinérant, flèches, Home/End) si un seul panneau s'affiche à la fois ([W3C APG, Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)).

À 375 px, le même DOM passe en frise verticale : 01 en tête, les quatre cartes reliées par un trait vertical, la pastille « mission » qui descend le long du trait. Aucune référence vérifiée ne garde un diagramme orbital sur mobile, et la frise de Marblism est déjà verticale.

L'animation « mission » est une pastille déplacée en `translate` sur des segments droits. Elle se déclenche une fois par IntersectionObserver et dure 3 à 4 s. En mouvement réduit, elle s'arrête sur son état final. On n'anime pas `stroke-dashoffset` : ce seul trait peut faire monter le GPU de Safari à environ 15 % ([WebKit Bugzilla 247241](https://bugs.webkit.org/show_bug.cgi?id=247241)), et les performances s'effondrent sur Safari mobile quand plusieurs chemins sont animés ([forum GSAP](https://gsap.com/community/forums/topic/8821-poor-performance-on-mobile-safari-both-ipad-and-iphone-when-animating-svg-paths-stroke-dashoffset/)). Les traits et la pastille sont en `aria-hidden`, et une liste ordonnée masquée visuellement décrit l'ordre de la mission aux lecteurs d'écran. Rien de tout cela n'a encore été mesuré en i/s sous CPU ×4 : c'est à faire avant d'affirmer que la section tient 60 i/s.

Le scroll épinglé demandé pour le workflow est le point le plus fragile. NN/g conclut que le scrolljacking « should be avoided in most cases ». Il ne le tolère que pour dévoiler progressivement une information utile, avec peu de texte, une navigation visible, sous la ligne de flottaison et **pas sur mobile** ([NN/g, Scrolljacking 101](https://www.nngroup.com/articles/scrolljacking-101/)). Une section épinglée ajouterait aussi des ScrollTriggers qui mesurent la page. Or la dernière hausse de TBT du site venait justement de l'initialisation groupée de 10 ScrollTriggers (`docs/PERFORMANCE.md`). Si l'épinglage est tout de même retenu, il doit rester court, réservé à l'ordinateur et désactivé en mouvement réduit.

## La vidéo rassure, le texte et le CTA convertissent

Aucune étude solide ne relie une vidéo de hero à une hausse de conversion. Dans une méta-analyse secondaire de tests sur le visuel du hero, environ 70 % des tests n'ont pas d'effet mesurable, 12 % gagnent et 18 % perdent ([Lazyweb](https://www.lazyweb.com/research/why-hero-and-cta-tests-arent-measured-lift.md), méthodologie peu documentée). Le chiffre souvent repris « 41,2 % en click-to-play contre 9,7 % en autoplay » n'a pas de source primaire retrouvable : il ne doit pas être cité.

Ce qui est sourcé va dans le sens d'un film court lancé par l'utilisateur. Selon Wistia, les vidéos de moins d'1 min ont le meilleur engagement (50 %) ([CMS Critic, Wistia 2025](https://cmscritic.com/lights-camera-ai-action-key-takeaways-from-wistias-2025-state-of-video-report)). Selon Vidyard, 66 % des spectateurs finissent les vidéos de moins d'1 min ([MarketingProfs](https://marketingprofs.com/charts/2023/49949/business-video-benchmarks-retention-rates-by-length)). NN/g recommande d'afficher la durée avant la lecture et de ne jamais lancer de son automatiquement ([NN/g, Video Usability](https://www.nngroup.com/articles/video-usability/)). Le libellé « ▶ Voir la vidéo (40 s) » applique directement ce conseil, même si aucun test ne mesure l'effet de la durée dans le libellé.

Les références du secteur ont toutes deux CTA dans le hero : un principal engageant (« Request a demo », « Get a Live Demo ») et un secondaire léger, comme le « Meet Julian » de 11x ([artisan.co](https://www.artisan.co/) ; [11x.ai](https://www.11x.ai/)). Pour Saturn, le principal serait la prise de contact, le secondaire « Voir la vidéo (40 s) » ou « Rencontrer l'équipe » (ancre vers la section). Le même CTA principal se répète juste après la section équipe, au moment où l'offre vient d'être expliquée. La fin du film se termine par un écran avec un seul CTA et un bouton « Revoir ». Wistia recommande de placer le CTA à la fin pour les vidéos de moins de 5 min ([Wistia 2024](https://wistia.com/blog/insights-state-of-video-report)).

Un CTA collant sur mobile a donné +25 % de ventes dans un test, mais en e-commerce haut de gamme ([Conversion Rate Experts](https://conversion-rate-experts.com/sticky-cta-win-report/)). Le transposer à une agence de services reste une hypothèse. S'il est ajouté, il apparaît seulement après le hero et se masque quand un autre CTA est visible.

Pour les textes, les pages rédigées simplement convertissent mieux. Dans l'étude Unbounce, les pages écrites à un niveau 5e–7e année (en anglais) atteignent 11 % de conversion, soit +56 % par rapport au niveau suivant ([Hartzer, synthèse Unbounce 2024](https://www.hartzer.com/blog/unbounce-2024-conversion-benchmark-report/)). On préfère donc des verbes de tâche (répondre, relancer, publier) au jargon (« orchestration », « agentique »). En France, la vente trop directe est mal reçue ([Cognism FR](https://www.cognism.com/fr/blog/implanter-marche-francais)), et le vouvoiement reste la forme sûre, à condition de ne jamais alterner ([Cambridge UP](https://assets.cambridge.org/97811075/64763/excerpt/9781107564763_excerpt.pdf)).

Pour le Sénégal, DataReportal 2026 recense 11,5 M d'internautes et 23,3 M de connexions mobiles, mais **ne publie aucun chiffre WhatsApp** ([DataReportal](https://datareportal.com/reports/digital-2026-senegal)). Le chiffre « 87 % des PME sénégalaises sur WhatsApp » ne vient que de blogs d'agences, sans source primaire. Mettre WhatsApp (lien `wa.me` avec message prérempli, sans donnée personnelle) au même niveau que la prise de rendez-vous reste raisonnable, mais c'est un choix de jugement, pas un fait mesuré.

Pour la mesure, une analytique sans cookies comme Plausible permet de suivre quelques événements personnalisés sans bandeau de consentement ([Plausible, événements](https://mintlify.com/plausible/analytics/integration/custom-events)) :

- `video_open` ;
- `video_progress` à 25/50/75/100 % ;
- `video_cta_click` ;
- `team_section_view` ;
- `cta_click`, avec l'emplacement (hero / après équipe / collant / pied) et le canal (whatsapp / rdv / formulaire).

Avec le trafic d'une petite agence, un test A/B atteindra rarement la significativité. Il vaut mieux comparer avant et après sur plusieurs semaines. Le poids du script reste à vérifier face au budget JS.

## Recommandations classées par impact

| Rang | Recommandation | Pourquoi |
|---|---|---|
| 1 | Poster AVIF préchargé, vidéo injectée après l'intro, conditionnée au mouvement réduit et à Save-Data ; aucun octet vidéo dans le chargement initial | Protège le LCP (déjà en échec à 2,8 s simulé) et la marge de ~50 Ko sous le budget de 300 Ko |
| 2 | Choisir entre la scène canvas et la boucle vidéo, sans les superposer | Un seul moteur ; protège les 55–59 i/s mobiles mesurés |
| 3 | Bouton pause visible de 44 px sur la boucle, et décision sur A24 en même temps | 2.2.2 niveau A, sinon A11y < 100 |
| 4 | Vérifier le film plan par plan pour 1.2.5, sous-titres FR `default`, transcription | Seul vrai risque de non-conformité AA |
| 5 | `<dialog>` + `showModal()` + `controls` natifs + `lenis.stop()/start()` | Accessibilité native, peu de code |
| 6 | Section équipe : même DOM en hub (ordinateur) et frise (375 px), cartes `aria-expanded`, mission de 3–4 s déclenchée une fois | Suit les références vérifiées, évite le scrolljacking |
| 7 | Encodage AV1 + H.264, `codecs=` exacts, grain en texture CSS | Poids et rendu identique selon le codec |
| 8 | Hero : CTA principal de contact + secondaire « Voir la vidéo (40 s) », CTA répété après l'équipe, CTA en fin de film | Pratique du secteur, soutenue par Wistia |
| 9 | Événements Plausible et comparaison avant/après | Pas de preuve externe, il faut une mesure propre |

## Points à trancher avant de construire

| Point | Conflit ou question |
|---|---|
| Palette et typographie de marque demandées | `CLAUDE.md` fige couleurs, polices, textes et logo. La section équipe et la modale doivent réutiliser les tokens existants. Une nouvelle palette « Saturn Agents » ou de nouvelles polices contredit cette règle et demande un arbitrage explicite. |
| Titre du hero | Les textes sont figés. Tout nouveau titre ou slogan pour le hero vidéo est une exception à valider, et il change l'élément LCP mobile (`p.lead`). |
| Vidéo ou scène canvas dans le hero | La boucle vidéo remplace-t-elle la scène du worker, ou seulement sur certains écrans ? |
| Workflow en scroll épinglé | Contraire aux recommandations NN/g, surtout sur mobile, et risqué pour le TBT. Proposition : mission déclenchée de 3–4 s, avec un épinglage court réservé à l'ordinateur seulement si vous y tenez. |
| Contenu du film de 40 s | Voix off ou pure musique ? Cela décide si une audiodescription est obligatoire (1.2.5). |
| Canal principal | WhatsApp, prise de rendez-vous, ou les deux au même niveau ; formulaire en repli. |
| Voix de la section | « Notre équipe d'agents » (centré agence) ou « Votre équipe d'employés IA » (centré client), toujours au vouvoiement. |
| Analytique | Ajouter Plausible ou un équivalent, c'est ajouter un script tiers : justification écrite exigée par les règles du projet. |

## Conclusion

Les deux demandes se jouent moins sur l'effet visuel que sur l'endroit où l'on place la complexité. La vidéo devient sûre dès qu'elle cesse d'être une ressource de chargement pour devenir un événement différé et réversible : poster d'abord, boucle ensuite, pause toujours. La vraie difficulté n'est ni le codec ni le LCP. C'est le film de 40 s, dont la conformité AA dépend de ce que dit sa bande-son, ce qui relève du montage et non du code. Il faut donc le vérifier avant l'encodage final, pas après.

Côté équipe, l'écart entre la demande (orbite, scroll épinglé) et les références vérifiées est instructif. Les produits qui vendent des « équipes d'agents » montrent la symbiose par le récit (qui passe la main à qui), pas par la géométrie. Un hub statique qui s'anime une fois et se replie en frise verticale dit la même chose avec une fraction du coût et du risque. Faute de preuve externe sur la conversion, la mesure maison (événements par emplacement et par canal) reste le seul moyen de savoir si ces deux ajouts rapportent quelque chose à Saturn.
