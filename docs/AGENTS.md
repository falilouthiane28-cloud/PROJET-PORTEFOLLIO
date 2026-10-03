# Section « Saturn Agents » : le film, l'équipe, une mission

Recherche préalable : `reports/Vidéo hero et équipe agents.md`. Mesures : `docs/PERFORMANCE.md`, partie « Section Saturn Agents ».

## Où est quoi

| Fichier | Rôle |
|---|---|
| `index.html`, `<section id="agents">` | Tout le texte : présentation, cinq fiches d'agent, mission. La modale `<dialog id="film">` est en fin de `<body>`. |
| `src/styles/agents.css` | Styles de la section et de la modale. Couleurs et polices de `site.css`, aucune nouvelle. |
| `src/js/agents/loop.js` | L'extrait muet en boucle : quand le charger, quand le lire, le bouton pause. |
| `src/js/agents/film.js` | La modale du film de 40 s : sources, sous-titres, ouverture et fermeture. |
| `src/js/agents/crew.js` | Les onglets de l'équipe (clic, toucher, clavier). |
| `src/motion/effects/missionFlow.js` | L'animation de la mission (système de mouvement, chargé à la demande). |
| `src/assets/video/` | Boucle et film (AV1 + H.264), sous-titres `film.fr.vtt`. |
| `src/assets/img/agents/` | Mascottes, avatars, affiches (AVIF + WebP). Générés par `tools/agents-medias.py`. |
| `test/e2e/agents.spec.mjs` | Tests de la section. Mouvement réduit : `test/reduced-motion/reduced.spec.mjs`. |

## Ce que fait chaque partie

### 1. La présentation filmée

- **Placement :** la vidéo n'est pas dans le hero, mais juste en dessous, après le bandeau. Le hero est une scène canvas épinglée au scroll, avec des titres figés (`CLAUDE.md`) : une vidéo de fond l'aurait remplacé, aurait fait tourner deux moteurs à la fois et changé l'élément LCP.
- **La boucle :** 8,85 s du film, de 8,45 s à 17,3 s : chef d'équipe, analyste, marketing, puis coupe franche, comme les coupes du film.
  - **Chargement :** `preload="none"`, sans `autoplay`. `loop.js` appelle `play()` quand la section arrive à moins de 200 px de l'écran, et seulement après `load`.
  - **Pause automatique :** hors écran, onglet caché, modale ouverte.
  - **Jamais chargée** en mouvement réduit, en économie de données (`saveData`) ou en 2G. L'affiche reste alors, sans bouton pause.
  - **Lecture refusée** (iOS en économie d'énergie, réglage de Firefox) : l'affiche reste aussi.
  - **Affiche :** c'est la première image décodée de la boucle. La vidéo apparaît en fondu d'opacité à l'événement `playing`, sans saut.
- **Bouton pause :** exigé par WCAG 2.2.2, car la boucle dure plus de 5 s. Il est sous l'image et non dessus, parce que le film a ses propres textes dans les coins. `aria-pressed` donne l'état, et la pause choisie est respectée.
- **Le film :** `<dialog>` ouvert par `showModal()`. Le navigateur gère le piège du focus, Échap, l'arrière-plan inerte et le retour du focus au bouton.
  - **Ajouts :**
    - Lenis arrêté (`window.__hero.scroll`) et défilement natif bloqué (`html.has-modal`) ; au toucher, le `body` est en plus fixé à sa position, car sur iOS `overflow: hidden` ne retient pas le doigt ;
    - pause à la fermeture ;
    - fermeture au clic sur le fond.
  - **Chargement :** les sources ne sont posées qu'au premier clic : aucun octet du film avant. Écran en hauteur : version 9:16, sinon 4:5.
  - **Sous-titres :** le film n'a pas de dialogue. La piste française qui décrit la bande-son reste disponible dans le menu du lecteur, mais elle est éteinte par défaut (D30). Le titre de la modale l'annonce : « sans dialogue, musique et bruitages ». Chargée en Blob, elle marche aussi en `file://`.
  - **Description plan par plan :** sous la vidéo, pour ce que l'image dit et que le son ne dit pas (WCAG 1.2.3 et 1.2.5).

### 2. L'équipe

- **Ordinateur :** le chef au centre, les quatre spécialistes sur l'orbite. Chaque avatar est un onglet (motif APG « tabs », activation automatique).
- **Mobile, sous 900 px :** même DOM, une rangée de 5 avatars au-dessus de la fiche.
- **Clavier :** flèches, Début, Fin. Un seul arrêt de Tab dans la liste, puis la fiche.
- **Couleur de l'agent :** l'agent choisi colore la section par un fondu d'opacité entre cinq lueurs, une par agent. On n'anime jamais une couleur.
- **Impulsions :** une impulsion part du chef vers l'agent choisi, vers les quatre quand le chef est choisi. C'est un `transform: translate` en CSS sur un cercle SVG, jamais `stroke-dashoffset`, trop coûteux sur Safari.
- **Animations en continu :** les impulsions et l'onde de l'analyste ne tournent qu'à l'écran (classe `.on`, posée par un IntersectionObserver).
- **Sans JavaScript :** les cinq fiches restent visibles l'une sous l'autre.

### 3. La mission

- **Le parcours :** une impulsion part de la Prospection, passe par l'Analyse d'appels, le Marketing et le Contenu, et s'arrête au Chef d'équipe.
  - Chaque agent s'allume quand elle l'atteint : opacité, plus un léger rebond d'échelle de l'avatar.
  - En 3,4 s, une seule fois, à l'arrivée à l'écran.
  - À l'horizontale sur ordinateur, à la verticale sur mobile.
- **Pas de scroll épinglé :** NN/g le déconseille, surtout sur mobile, et la seule tâche longue du site venait de déclencheurs de scroll.
- **État au repos :** c'est l'état final, tout allumé. Sans JavaScript, en mouvement réduit ou après l'animation, rien ne manque.

### Coût au chargement

`content-visibility: auto` porte sur le schéma de l'équipe et la mission. Le navigateur saute leur mise en page et leurs images tant qu'ils sont loin. Les tailles d'attente (`contain-intrinsic-size`) sont les hauteurs mesurées à 375, 768, 1024 et 1440 px. Si le contenu d'une fiche change beaucoup, mesurez de nouveau, sinon les liens d'ancre s'arrêtent à côté. Les trois scripts s'initialisent en temps libre, chacun dans sa tâche.

## Changer la vidéo

1. **Remplacer le film source :** remplacez `brag-output/brag-4x5.mp4` et `brag-output/brag-9x16.mp4`, ou adaptez les chemins ci-dessous.
2. **Ré-encoder :** les commandes utilisées sont ci-dessous. Gardez `-movflags +faststart` (lecture avant la fin du téléchargement) et `-an` sur la boucle.
3. **Refaire les affiches :** `python tools/agents-medias.py`. L'affiche de la boucle doit être sa première image, et le script la prend dans le fichier encodé.
4. **Changer l'extrait :** si le passage choisi n'est plus le même, changez `-ss` et `-t`, le texte `Extrait du film · 9 s` et l'`alt` de l'affiche dans `index.html`.
5. **Mettre à jour les textes :** `film.fr.vtt` et la description plan par plan (`.film__desc`).
6. **Vérifier les niveaux de codec :** ils sont dans les attributs `type`.

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,level -of csv=p=0 src/assets/video/boucle-av1.mp4
```

- **AV1 :** `level` 4 → `av01.0.04M.08`, 5 → `05M`, 8 → `08M`.
- **H.264 :** 31 → `avc1.64001F`, 40 → `avc1.640028`.

### Commandes ffmpeg utilisées (ffmpeg 9, SVT-AV1 4.2, x264)

```bash
# boucle 720×900, muette : AV1 (CRF 42), puis repli H.264 (CRF 28)
ffmpeg -ss 8.45 -t 8.85 -i brag-output/brag-4x5.mp4 -an -vf "scale=720:900:flags=lanczos,format=yuv420p" -c:v libsvtav1 -preset 5 -crf 42 -g 60 -movflags +faststart src/assets/video/boucle-av1.mp4
ffmpeg -ss 8.45 -t 8.85 -i brag-output/brag-4x5.mp4 -an -vf "scale=720:900:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 28 -profile:v high -g 60 -movflags +faststart src/assets/video/boucle-h264.mp4

# film 4:5 en 1080×1350 : AV1 + Opus, puis repli H.264 + AAC
ffmpeg -i brag-output/brag-4x5.mp4 -vf format=yuv420p -c:v libsvtav1 -preset 5 -crf 38 -g 60 -c:a libopus -b:a 96k -movflags +faststart src/assets/video/film-4x5-av1.mp4
ffmpeg -i brag-output/brag-4x5.mp4 -vf format=yuv420p -c:v libx264 -preset slow -crf 26 -profile:v high -g 60 -c:a aac -b:a 128k -movflags +faststart src/assets/video/film-4x5-h264.mp4

# film 9:16 réduit à 720×1280, mêmes réglages
ffmpeg -i brag-output/brag-9x16.mp4 -vf "scale=720:1280:flags=lanczos,format=yuv420p" -c:v libsvtav1 -preset 5 -crf 38 -g 60 -c:a libopus -b:a 96k -movflags +faststart src/assets/video/film-9x16-av1.mp4
ffmpeg -i brag-output/brag-9x16.mp4 -vf "scale=720:1280:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 26 -profile:v high -g 60 -c:a aac -b:a 128k -movflags +faststart src/assets/video/film-9x16-h264.mp4
```

Poids obtenus :

| Fichier | Poids |
|---|---|
| Boucle AV1 | 0,79 Mo |
| Boucle H.264 | 1,07 Mo |
| Film 4:5 AV1 | 7,0 Mo |
| Film 4:5 H.264 | 10,8 Mo |
| Film 9:16 AV1 | 4,7 Mo |
| Film 9:16 H.264 | 6,5 Mo |

- **Grain synthétique AV1** (`film-grain=12`) : la boucle passe à 0,80 Mo, aucun gain. Le poids vient du mouvement, pas du grain.
- **Recadrage 16:9 :** pas utilisé. La boucle reste en 4:5, dans un cadre, sur ordinateur comme sur mobile, pour ne couper ni les titres ni les mascottes. Pour un 16:9 depuis le 4:5 (1080×1350), il faudrait une bande de 1080×608 :

```bash
ffmpeg -i brag-output/brag-4x5.mp4 -vf "crop=1080:608:0:371" ...
```

## Ajouter un 6ᵉ agent

1. **Images :** ajoutez `mascot-<nom>.png` et `avatar-<nom>.png` (fond transparent) dans `brag-output/work/assets/`. Ajoutez `<nom>` à la liste `AGENTS` de `tools/agents-medias.py`, puis lancez-le.
2. **`index.html` :**
   - un `<span data-for="<nom>">` dans `.crew__glows`, avec sa couleur `--agent`, prise parmi les couleurs du site ;
   - un onglet `<button role="tab" id="tab-<nom>" aria-controls="agent-<nom>" tabindex="-1">`, sur le modèle des autres ;
   - une fiche `<div class="crew__panel" id="agent-<nom>" role="tabpanel" aria-labelledby="tab-<nom>">` ;
   - si l'agent fait partie de la mission, une étape `<li class="mission__step">` ;
   - mettez à jour les numéros (`05/05` → `06/06`) et les textes « cinq » (titre de l'équipe, kicker, lead).
3. **Sur l'orbite :**
   - un `<g class="crew__link" data-to="<nom>">` dans `.crew__links` (centre 300,220) ;
   - sa position dans `agents.css` (`.crew__tab--<nom>{left:…;top:…}`) ;
   - les sélecteurs `[data-agent="<nom>"]` des lueurs, du lien allumé et de l'impulsion ;
   - à six spécialistes, répartissez-les sur l'ellipse : x = 300 + 250·cos θ, y = 220 + 150·sin θ, puis en % de 600×440.
4. **Sur mobile :** passez `.crew__tabs` à `repeat(6, …)`, puis vérifiez à 320 px (`npm test` contrôle le débordement).
5. **Mesurer :** remesurez les hauteurs pour `contain-intrinsic-size`. Le script est dans l'historique : hauteur de `.crew__body` et `.mission` à 375, 768, 1024 et 1440 px.
6. **Tester :** lancez `npm test`, puis mettez à jour les captures de référence si le rendu change exprès (`npx playwright test -g "régression visuelle" --update-snapshots`).

## Suivi des clics (non installé)

Ajouter un outil d'analyse, c'est ajouter un script tiers, ce qui demande une justification écrite (`CLAUDE.md`). Les événements utiles sont déjà émis dans la page (`film:open`, `film:close`). Pour Plausible, il suffirait de les relayer :

```js
addEventListener('film:open', () => plausible('video_open'));
```
