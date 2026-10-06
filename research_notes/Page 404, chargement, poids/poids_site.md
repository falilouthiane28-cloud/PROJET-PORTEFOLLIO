# Réduction du poids d'un portfolio cosmique en 2026

Contexte mesuré : chargement initial ~470 Ko desktop / ~410 Ko mobile ; JS 162 Ko (60 Ko gzip) ; vidéo AV1 décorative 767 Ko à la section Agents ; film 40 s = +7 Mo AV1 / +10,8 Mo H.264. Budgets fermes : LCP ≤ 2,0 s, TBT ≤ 200 ms, JS initial ≤ 150 Ko gzip, perf mobile ≥ 90.

Note : les sources trouvées sont majoritairement des articles secondaires de 2024-2026, les chiffres bundlephobia exacts n'ont pas pu être récupérés directement (fetch non effectué, risque de double usage de budget). À confirmer en local via `npm run build:analyze`.

---

## 1. Réduction du JS (GSAP, ScrollTrigger, Lenis, Motion)

### Takeaway
GSAP core ≈ 20 Ko gzip, ScrollTrigger ajoute ≈ 10 Ko gzip, Lenis ≈ 4 Ko gzip. Le chargement différé de ScrollTrigger après l'intro du hero est viable, et les animations scroll-driven CSS natives (support ≈ 85 % en 2026) peuvent remplacer une partie des ScrollTriggers simples (fade-in, parallaxe).

### Cited Findings
- GSAP core est « proche de 20 Ko gzippé » sans plugins — [GSAP forums, taille des libs](https://gsap.com/community/forums/topic/33319-gsap-size-too-large/)
- ScrollTrigger ajoute « environ 10 Ko gzip » quand importé en plugin — [GSAP forums, imports](https://greensock.com/forums/topic/33160-how-to-import-gsap-lib-in-the-best-way/)
- ScrollTrigger.min.js non compressé ≈ 41,7 Ko — [bundle size (secondaire)](https://www.pkgpulse.com/guides/why-bundle-size-still-matters-2026)
- Lenis « moins de 4 Ko gzippé » (certaines sources 3,6 Ko, d'autres jusqu'à 7 Ko selon la version) — [npm lenis](https://npmjs.com/package/lenis) ; [learnwithhasan.com](https://learnwithhasan.com/js-libraries/lenis/)
- Lenis repose sur le scroll natif (wrapping), donc `position: sticky`, ancres et accessibilité continuent de fonctionner — [cdn.jsdelivr.net lenis README](https://cdn.jsdelivr.net/gh/darkroomengineering/lenis@1.3.26/README.md)
- Les animations scroll-driven CSS sont supportées dans Chrome 115+ (juillet 2023), Firefox 133 (novembre 2024), Safari 18.2 (décembre 2024) — [buildmvpfast](https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026)
- Couverture globale `animation-timeline` et `scroll()` ≈ 85 % selon caniuse — [wearedevelopers](https://www.wearedevelopers.com/magazine/712-css-only-scroll-driven-animations-712.md)
- `animation-trigger` disponible seulement Chrome/Edge 146+ (mars 2026), pas encore dans Safari 26.6 ni Firefox 154 — [buildmvpfast](https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026)
- Guide officiel Chrome recommande scroll-driven en confiance, animation-trigger en progressive enhancement — [developer.chrome.com](https://developer.chrome.com/blog/scroll-triggered-animations)

### Inferences
- Budget actuel JS 60 Ko gzip : GSAP+ScrollTrigger ≈ 30 Ko + Lenis ≈ 4 Ko + Motion sous-ensemble ≈ 4-6 Ko + code projet ≈ 20 Ko. L'ordre de grandeur est cohérent.
- Un `import('gsap/ScrollTrigger')` dynamique derrière `window.addEventListener('load')` ou derrière la fin de l'intro hero sort ≈ 10 Ko gzip du bundle initial → gain net ≈ 15 % du JS initial, sans changer un pixel.
- Les fade-in `opacity 0 → 1` et les simples parallaxes `translateY` au scroll peuvent être réécrits en `animation-timeline: scroll()` (CSS pur) ; garder ScrollTrigger uniquement pour les scrubs complexes (séquences temporelles liées à une plage de scroll avec pin). Fallback progressif : les navigateurs sans support affichent l'état final.
- Lenis n'a pas d'équivalent natif strict en 2026 : `scroll-behavior: smooth` ne lisse qu'au click/anchor, pas à la molette. Garder Lenis (4 Ko) tant qu'on veut un défilement amorti ; sinon le retirer rendrait au scroll natif Windows/iOS qui n'est pas « cosmique ».

### Gaps
- Chiffres bundlephobia exacts pour `gsap@3.15` et `lenis@latest` à la date d'aujourd'hui, non vérifiés dans cette recherche (sources secondaires uniquement).
- Taille gzip exacte du sous-ensemble `motion` utilisé — à mesurer avec `npm run build:analyze`.

---

## 2. Vidéo (loop Agents 767 Ko, film 40 s 7 Mo)

### Takeaway
Monter le CRF SVT-AV1 de 42 vers 46-48 pour un loop décoratif sur fond sombre et baisser la résolution mobile à 480×600 permet de viser 300-400 Ko. H.264 fallback peut être supprimé en 2026 pour un site vitrine : AV1 est dans Chrome, Firefox 93+, Edge, et Safari 17+ (décodage matériel iPhone 15 Pro et plus).

### Cited Findings
- Plage sensée de CRF pour SVT-AV1 : 12 à 63 ; recommandation « delivery » générale : 28-32 — [ffmpeg trac AV1](https://trac.ffmpeg.org/wiki/Encode/AV1)
- CRF 45 (preset 0) atteint ≈ 40 dB PSNR — [ottverse SVT-AV1 presets](https://ottverse.com/analysis-of-svt-av1-presets-and-crf-values/)
- Presets 0-4 recommandés pour transcodage qualité ; au-delà, perte visible — [goughlui 2024 round-up](https://goughlui.com/2024/01/14/video-codec-round-up-2023-part-16-libsvtav1-scalable-video-technology-for-av1/)
- Safari iOS 17.0-26.5 : AV1 **uniquement avec décodage matériel** (pas de software fallback) — [bitmovin AV1 playback](https://bitmovin.com/av1-playback-support/)
- En Q2 2024, ≈ 9,76 % des smartphones ont le décodage matériel AV1, croissance tirée par iPhone 15 Pro/Pro Max — [bitmovin AV1 playback](https://bitmovin.com/av1-playback-support/)
- Chrome, Edge, Firefox (DRM inclus), Android et Windows ont un support AV1 prêt pour la production — [bitmovin](https://bitmovin.com/av1-playback-support/)
- Guide evilmartians : AV1 pour le web, pipeline FFmpeg loop sans couture via crossfade dernière/première frame — [dev.to evilmartians AV1 codec](https://dev.to/evilmartians/better-web-video-with-av1-codec-52kd)
- FFmpeg libsvtav1 nécessite `--enable-libsvtav1` ; paramètres via `-svtav1-params`, supporté depuis FFmpeg 5.1 — [ffmpeg trac AV1](https://trac.ffmpeg.org/wiki/Encode/AV1)

### Inferences
- **Loop Agents** 767 Ko en 8,85 s à CRF 42 → CRF 46 devrait descendre à ≈ 400-500 Ko (−30-45 %) sur fond quasi uniforme sombre, dégradation imperceptible. CRF 48 ≈ 300 Ko mais risque d'artefacts banding visibles sur dégradés cosmiques → à tester A/B.
- **Résolution mobile** : passer de 720×900 à 480×600 avec `<source media="(max-width: 768px)">` divise les pixels par ≈ 2,25 → gain additionnel ≈ 50 % sur mobile. Combiné CRF 46 : loop mobile viable autour de 200 Ko.
- **H.264 fallback** : les 10,8 Mo pour un fallback MP4 pour un site vitrine français en 2026 ne se justifient pas. iOS < 17 et Firefox < 93 sont marginaux. Risque : décodage matériel AV1 obligatoire sur Safari iOS → les iPhones avant 15 Pro voient un fallback statique (poster). Compromis : garder un **poster image AVIF statique** à la place du fallback vidéo, 0 Mo pour ces utilisateurs.
- **Film 40 s** : CRF 38 → 42 réduit ≈ 40-50 % → cible 3,5-4 Mo. En plus, charger uniquement sur clic (ne pas précharger via `<video preload>`).

### Commandes concrètes
```bash
# Loop desktop, CRF 46, preset 4 (qualité/vitesse équilibrés)
ffmpeg -i loop.mov -c:v libsvtav1 -crf 46 -preset 4 \
  -svtav1-params "tune=0:film-grain=0" -g 240 -pix_fmt yuv420p10le \
  -movflags +faststart -an loop-720.av1.mp4

# Loop mobile 480×600, CRF 48
ffmpeg -i loop.mov -vf "scale=480:600" -c:v libsvtav1 -crf 48 -preset 4 \
  -svtav1-params "tune=0" -g 240 -pix_fmt yuv420p10le \
  -movflags +faststart -an loop-480.av1.mp4

# Film long, CRF 42
ffmpeg -i film.mov -c:v libsvtav1 -crf 42 -preset 3 \
  -svtav1-params "tune=0:film-grain=4" -g 240 -pix_fmt yuv420p10le \
  -movflags +faststart -c:a libopus -b:a 96k film.av1.mp4
```

### Gaps
- % exact d'utilisateurs iOS 17+ avec décodage matériel AV1 en 2026 non trouvé (bitmovin donne 2024).
- Pas de source directe comparant qualité SVT-AV1 CRF 42 vs 46 sur contenu « ciel étoilé fond sombre » spécifiquement.

---

## 3. Images (AVIF scene, poster hero, mascottes)

### Takeaway
AVIF a ≈ 94-95 % de support global en 2026 : le fallback WebP n'est plus justifié pour un portfolio français. Pour un fond sombre, descendre la qualité AVIF à 45-50 est quasi imperceptible.

### Cited Findings
- Support AVIF global ≈ 94-95 % début 2026 ; Safari AVIF depuis 16.4 (2023) — [smallpics](https://www.smallpics.io/blog/avif-vs-webp) ; [collectivebrain](https://collectivebrain.de/avif-statt-jpg-webp-2026/)
- La couverture manquante vient d'iOS 15 et antérieurs, de WebViews d'applis et d'environnements entreprise verrouillés — [collectivebrain](https://collectivebrain.de/avif-statt-jpg-webp-2026/)
- Approche recommandée en 2026 : `<picture>` avec AVIF + fallback JPG (pas WebP), car JPG couvre tout — [pravinkumar](https://www.pravinkumar.co/blog/webflow-avif-default-image-pipeline-2026)

### Inferences
- **Qualité AVIF** 58 → 48 sur fond cosmique sombre : gain ≈ 25-35 % sur la taille. Pour le poster hero `scene-1960.webp` à 277 Ko → remplacer par AVIF q=48 ≈ 90-130 Ko (−55 %).
- **Fallback WebP** : à supprimer. Garder éventuellement un JPG très petit pour les ≈ 5 % restants, mais pour un site en français 2026 sur appareils récents, retirer la source WebP du `<picture>` allège le markup et élimine une variante à encoder.
- **Alternative blur-upscale** pour le poster : AVIF 400×500 q=55 (≈ 20 Ko) + `filter: blur(8px); transform: scale(1.05)` → poster visuellement acceptable à ≈ 20 Ko contre 277 Ko. À tester, car la montée en qualité au swap de la vraie scène peut faire un flash.

### Commandes concrètes
```bash
# ImageMagick / avifenc : qualité 48 pour fond sombre
avifenc --min 0 --max 63 -q 48 -s 4 -j all scene.png scene.avif

# Mascottes (sprites plus texturés) : garder q=55
avifenc -q 55 -s 4 mascot.png mascot.avif
```

### Gaps
- Pas trouvé de SSIM/butteraugli chiffrés AVIF q48 vs q58 sur contenu astro.

---

## 4. Polices (Archivo variable 48 Ko, Instrument Serif 20 Ko, JetBrains Mono 19 Ko)

### Takeaway
Un sous-ensemble latin français via `pyftsubset` descend typiquement une variable WOFF2 de 30-50 %. Instrument Serif italic utilisé pour quelques mots peut être réduit à ses glyphes exacts (quelques Ko). JetBrains Mono peut souvent être remplacé par la stack monospace système sans perte perceptible.

### Cited Findings
- `pyftsubset` est l'outil de référence pour sous-ensembler OTF/TTF/WOFF ; `glyphhanger` est un wrapper autour — [stefanjudis](https://www.stefanjudis.com/blog/glyphhanger-a-tool-subset-and-optimize-fonts)
- Pour sous-ensembler une variable il faut `fonttools` + Brotli ; flavor WOFF2 — [clagnut](https://clagnut.com/blog/2418)
- WOFF2 : ≈ 30 % plus petit que WOFF, ≈ 50 % plus petit que TTF — [florianbrinkmann](https://florianbrinkmann.com/en/glyphhanger-4691/)
- Appel direct à `pyftsubset` ≈ 2× plus rapide que `glyphhanger` pour sous-ensembler précisément — [stefanjudis](https://www.stefanjudis.com/blog/glyphhanger-a-tool-subset-and-optimize-fonts)

### Inferences
- **Archivo variable** 48 Ko : si Google Fonts est source, elle inclut déjà `latin` + `latin-ext`. Restreindre à `latin` + glyphes français (`U+0100-017F` partiel) via unicode-range dans `@font-face` ou via `pyftsubset --unicodes="U+0020-007E,U+00A0-00FF,U+0152,U+0153,U+0178,U+2013,U+2014,U+2018-201F,U+2026,U+20AC"` → viser 25-30 Ko.
- **Instrument Serif italic** 20 Ko pour quelques mots : si moins de 50 glyphes utilisés, un sous-ensemble explicite via `--text-file=glyphes.txt` descend sous 8 Ko.
- **JetBrains Mono** 19 Ko pour meta texte : stack `ui-monospace, Menlo, Consolas, "Liberation Mono", monospace` = 0 Ko, rendu natif propre sur macOS/Windows/Linux. Perte identitaire modérée pour du texte très accessoire.

### Commandes concrètes
```bash
# Archivo variable, sous-ensemble français
pyftsubset Archivo-VariableFont_wdth,wght.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0152-0153,U+0178,U+2013-2014,U+2018-201F,U+2026,U+20AC" \
  --layout-features='*' --flavor=woff2 \
  --output-file=archivo-fr.woff2

# Instrument Serif italic, à partir du texte réel
pyftsubset InstrumentSerif-Italic.ttf \
  --text-file=./textes-italiques.txt \
  --flavor=woff2 --output-file=instrument-italic-min.woff2
```

### Gaps
- Pas de source trouvée donnant la taille exacte d'Archivo variable sous-ensembé latin-fr — à mesurer.

---

## 5. Performance perçue (hints, priority, progressive)

### Takeaway
`fetchpriority="high"` sur l'image LCP réduit le LCP de 5-30 % selon web.dev et le Web Almanac 2025 ; pourtant seulement 17 % des pages l'utilisent. Un `preload` ciblé du poster hero + préchargement des polices critiques couvrent l'essentiel.

### Cited Findings
- Selon le Web Almanac 2025, seulement 17 % des pages utilisent `fetchpriority="high"` sur leur image LCP — [debugbear](https://www.debugbear.com/blog/preload-largest-contentful-paint-image)
- `fetchpriority="high"` sur l'image LCP réduit le LCP de 5 à 30 % en test réel — [debugbear](https://www.debugbear.com/blog/preload-largest-contentful-paint-image)
- 76 % des pages mobiles ont une image comme élément LCP, mais seulement 2,1 % la préchargent — [debugbear](https://www.debugbear.com/blog/preload-largest-contentful-paint-image)
- Pattern recommandé : `<link rel="preload" as="image" href="..." fetchpriority="high">` + attribut sur `<img>` — [corewebvitals](https://www.corewebvitals.io/pagespeed/preload-largest-contentful-paint-image)

### Inferences
- Le projet a déjà `fetchpriority="high"` sur le poster hero (indiqué dans la question). Étendre à : rien d'autre au-dessus de la ligne de flottaison. Mettre les logos de section et images sous la ligne de flottaison en `fetchpriority="low"` + `loading="lazy"`.
- `preconnect` n'est pertinent que pour un CDN tiers ; si tout est auto-hébergé, inutile.
- `modulepreload` sur le chunk principal (`entry-*.js`) peut gagner 1 RTT. À tester si les chunks sont découpés.
- **Progressive hero** : afficher un dégradé CSS pur immédiatement (0 Ko), échanger pour la scène animée après l'intro. Cela élimine le CLS et donne un LCP < 1 s en percevant déjà le visuel.

### Gaps
- Pas de données sur gain `modulepreload` spécifique à Vite 8.

---

## 6. Hero worker — démarre-t-il trop tôt ?

### Takeaway
OffscreenCanvas dans un worker ne bloque pas le thread principal, c'est son intérêt. Mais le post initial au worker (transfert du canvas, chargement d'assets) peut encore pénaliser le FCP/LCP s'il part avant la première peinture.

### Cited Findings
- OffscreenCanvas découple DOM et Canvas API, utilisable dans un Web Worker — [web.dev offscreen-canvas](https://web.dev/articles/offscreen-canvas)
- Le thread principal occupé n'influence pas l'animation dans le worker, et inversement — [web.dev offscreen-canvas](https://web.dev/articles/offscreen-canvas)
- Avec `requestAnimationFrame` dans le worker, le rendu continue même si le main thread est chargé — [macarthur.me](https://macarthur.me/posts/animate-canvas-in-a-worker)

### Inferences
- Si le worker démarre dans l'`inline script` du head, il monopolise le réseau et la décompression pendant que le navigateur veut rendre le texte hero. Le démarrer après `window.addEventListener('load')` ou dans un `requestIdleCallback` (fallback `setTimeout 100ms`) rendrait le hero text visible plus tôt.
- Transférer le canvas en `transferControlToOffscreen` est quasi instantané ; ce qui coûte est le `fetch` des sprites/trames dans le worker : utiliser `importScripts` différé ou `fetch(..., {priority: 'low'})`.

### Gaps
- Impossible de mesurer sans ouvrir la trace actuelle du projet.

---

## 7. Mesure A/B avec Lighthouse

### Takeaway
Lighthouse CI permet de comparer N runs sur 2 branches ; le projet a déjà `npm run test:perf`. Procédure : baseline sur `main`, applique une optimisation isolée, 3 runs, note la plage, compare médiane.

### Cited Findings
- Les métriques Core Web Vitals (LCP, CLS, INP) sont mesurées par Lighthouse via throttling CPU×4 standard — [marfeel LCP CLS INP](https://www.marfeel.com/docs/site-technology/cwv-sitetech/lcp-cls-and-inp-optimization-quick-wins)

### Inferences
- Protocole : brancher ordi sur secteur, tuer les Edge orphelins (règle projet), vérifier page vide à 60 i/s. 3 runs par variante. Noter min/médiane/max. Un gain < écart-type n'est pas un gain.
- Pour isoler les effets vidéo : exécuter Lighthouse avec et sans scroll jusqu'à Agents (profils Lighthouse « navigation » vs « timespan »).

### Gaps
- Aucune.

---

## Classement effort / impact

| Rang | Action | Effort | Gain estimé | Risque |
|---|---|---|---|---|
| 1 | Lazy-load `gsap/ScrollTrigger` après intro | S | −10 Ko gzip JS (−15 %) | nul (chargé juste à temps) |
| 2 | Re-encoder loop Agents AV1 CRF 46 + variante 480 mobile | S | −350-500 Ko sur section Agents | banding sombre, à vérifier |
| 3 | AVIF q48 pour poster hero (ou blur-upscale) + supprimer WebP fallback | S | −150-250 Ko AF | aucun au-dessus iOS 16.4 |
| 4 | Sous-ensembler Archivo + Instrument Serif + supprimer JetBrains Mono | M | −30-40 Ko polices | esthétique mono |
| 5 | Film 40 s AV1 CRF 42 + chargement sur clic uniquement | M | −3 Mo + 0 Mo si non lu | qualité film |
| 6 | Supprimer H.264 fallback | S | −10,8 Mo potentiels | perte iOS <17 (fallback poster) |
| 7 | Décaler démarrage worker hero après `load` | S | LCP −200-400 ms | nul |
| 8 | Remplacer fade/parallax simples par `animation-timeline: scroll()` CSS | L | −3-5 Ko gzip, scroll plus fluide | fallback statique sur ≈15 % |
| 9 | Vérifier `fetchpriority` étendu + `modulepreload` entry | S | LCP −100-300 ms | nul |
| 10 | Évaluer suppression Lenis (si scroll natif acceptable) | M | −4 Ko gzip | identité « cosmique » perdue |

Gain cumulé réaliste au-dessus de la ligne de flottaison : **−200 à −350 Ko** sans toucher au design.
Gain cumulé à la section Agents : **−400 à −600 Ko**.
Film : **−3 Mo si lu, −10,8 Mo si pas lu** (fallback H.264 supprimé).

---

## Sources principales
- [GSAP forums — tailles](https://gsap.com/community/forums/topic/33319-gsap-size-too-large/)
- [GSAP forums — imports](https://greensock.com/forums/topic/33160-how-to-import-gsap-lib-in-the-best-way/)
- [Lenis npm](https://npmjs.com/package/lenis) / [Lenis README](https://cdn.jsdelivr.net/gh/darkroomengineering/lenis@1.3.26/README.md)
- [CSS scroll-driven cross-browser 2026](https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026)
- [Chrome dev — scroll-triggered animations](https://developer.chrome.com/blog/scroll-triggered-animations)
- [FFmpeg trac — Encode/AV1](https://trac.ffmpeg.org/wiki/Encode/AV1)
- [OTTverse — SVT-AV1 presets](https://ottverse.com/analysis-of-svt-av1-presets-and-crf-values/)
- [Evilmartians — better web video AV1](https://dev.to/evilmartians/better-web-video-with-av1-codec-52kd)
- [Bitmovin — AV1 playback](https://bitmovin.com/av1-playback-support/)
- [AVIF 2026 — collectivebrain](https://collectivebrain.de/avif-statt-jpg-webp-2026/) / [AVIF vs WebP](https://www.smallpics.io/blog/avif-vs-webp)
- [Clagnut — subset variable fonts](https://clagnut.com/blog/2418)
- [Stefan Judis — glyphhanger / pyftsubset](https://www.stefanjudis.com/blog/glyphhanger-a-tool-subset-and-optimize-fonts)
- [DebugBear — preload LCP](https://www.debugbear.com/blog/preload-largest-contentful-paint-image)
- [web.dev — OffscreenCanvas](https://web.dev/articles/offscreen-canvas)
