# Système de mouvement

Règles : `.claude/rules/motion-system.md`. Décisions et sources : `docs/DECISIONS.md`.

## Principe

On ajoute du mouvement **sans changer le design au repos**. Toute animation se termine sur l'état d'origine exact : SplitText est annulé (`revert`), les styles inline sont retirés, les masques reviennent à `inset(0)`. La régression visuelle (`test/e2e`, 3 largeurs × 11 sections) le vérifie.

## Jetons (`src/motion/tokens.js`, `src/styles/motion.css`)

| Jeton | Valeur | Usage |
|---|---|---|
| `EASE.out` / `--ease-out` | `cubic-bezier(.16,1,.3,1)` (≈ `expo.out`) | Arrivées. Courbe d'origine du site. |
| `EASE.outQuint` / `--ease-quint` | `cubic-bezier(.22,1,.36,1)` | Lignes de titre. |
| `EASE.inOut` / `--ease-io` | `cubic-bezier(.65,0,.35,1)` | Allers-retours. Courbe d'origine. |
| `EASE.in` | `cubic-bezier(.55,0,1,.45)` | Sorties, plus courtes que les entrées. |
| `DUR` | press 0,1 · micro 0,3 · base 0,6 · line 1,0 · reveal 1,1 · intro 2,6 (s) | — |
| `STAGGER` | line 0,08 · item 0,09 · word 0,03 (s) | — |
| `DIST` | reveal 36 · item 20 · magnet 10 · parallax 40 (px) | — |
| `SPRING` | pointer (170 / 26), magnet (220 / 22), sans rebond | — |
| `REDUCED` | fondu de 0,3 s, sans déplacement | Variante en mouvement réduit. |

## Rôle de chaque moteur

| Moteur | Possède |
|---|---|
| **GSAP + ScrollTrigger** | Hero (timeline maîtresse, scroll lissé, bandes), titres (SplitText), phrase du studio, captures des projets, bouton magnétique, vitesse du bandeau. |
| **Motion** | `inView` et `animate` (WAAPI) pour les étiquettes ; `hover` pour la lueur des services ; `animate` pour la fermeture de la FAQ. |
| **CSS** | Apparitions `.reveal` d'origine, survols, bandeau (keyframes), ouverture de la FAQ, mouvement réduit. |
| **Lenis** | Défilement doux à la souris, branché sur `gsap.ticker`. |

## Chargement

1. `index.html` : le CSS en ligne pose le titre du hero en masques mot à mot (élément LCP sans JS).
2. `main.js` (JS initial, 57,9 Ko gzip) : `site.js`, `nav.js`, `initHero()`.
3. Après l'intro du hero (≈ 2,5 s), en temps libre : découpe des bandes 2 et 3, puis démarrage du worker de la scène.
4. Après l'événement `load`, une fois les polices prêtes **et l'intro du hero terminée**, `import('./motion/index.js')` charge le système de mouvement (9,2 Ko gzip).
5. Il attend ensuite 400 ms sans défilement, puis initialise **un effet par tâche en temps libre** : aucune tâche longue (mesuré). Les effets ne s'appliquent qu'à ce qui est encore sous l'écran.

## Catalogue

| Animation | Déclencheur | Durée / courbe | Mouvement réduit | Fichier |
|---|---|---|---|---|
| **Hero : intro** | Chargement. Un geste l'accélère (×3,5). | 2,5 s. Orbite (1,1 s, `expo.inOut`), voile (1,7 s), sur-titre, texte, repères, nav (`expo.out`). | Hero statique, sans intro. | `src/js/hero/index.js` |
| Hero : titre | Premier rendu (CSS) | Mots montant de leur masque | Visible tout de suite | `src/styles/site.css`, `hero.css` |
| Hero : scène et bandes | Scroll lissé (lerp 0,12 indépendant de la fréquence) | Liée au scroll | Hero statique | `src/js/hero/` |
| Hero du téléphone (portrait, paysage) | Après l'intro, en temps libre | Scène du worker à 30 i/s : l'anneau tourne, les étoiles scintillent, l'anneau accélère avec la vitesse du défilement (écouteur passif). Fondu 0,9 s par-dessus le dessin statique, retiré ensuite. Pause hors écran et onglet caché | Dessin statique, rien ne tourne | `src/js/hero/index.js` (`startAmbient`), `worker.js` |
| Hero : parallaxe du pointeur | Souris | Lerp 0,08 | — | `src/js/hero/index.js` |
| Hero : bouton magnétique | Souris | `quickTo` 0,5 s, `power3`, via `translate` (garde le survol d'origine) | — | `src/js/hero/index.js` |
| Titres de section (h2) | IntersectionObserver : découpe à l'entrée par le bas, montée à 88 % de l'écran (une fois) | 1,0 s, `quint.out`, décalage 0,08 | Non chargé | `src/motion/effects/lineReveal.js` |
| Phrase du studio, mot à mot | Scroll, de « haut à 85 % » à « bas à 70 % » | Scrub 0,5. Départ à 0,42 d'opacité, soit ≈ 3,7:1 : un mot éteint reste lisible. | Non chargé | `src/motion/effects/wordHighlight.js` |
| Captures des projets (masque et zoom) | Scroll, de « haut en bas d'écran » à « haut à 62 % » | Scrub 0,6, ≥ 1025 px | Non chargé | `src/motion/effects/imageReveal.js` |
| Étiquettes en cascade | 60 % du groupe visible (une fois) | 0,6 s, `EASE.out`, décalage 0,06, délai 0,3 | Non chargé | `src/motion/effects/staggerTags.js` |
| Vitesse du bandeau | Vitesse du scroll, quand le bandeau est à l'écran | Lerp 0,08, retour lerp 0,04, ×1 à ×4, jamais inversé (une animation infinie lue à l'envers s'arrête) | Bandeau à l'arrêt (CSS) | `src/motion/effects/marqueeVelocity.js` |
| FAQ : fermeture | Clic, Entrée ou Espace | 0,22 s, `EASE.in` | Fermeture immédiate | `src/motion/effects/faqSmooth.js` |
| FAQ : ouverture (d'origine) | Ouverture | 0,6 s, `--ease-out` | Immédiate | `src/styles/site.css` |
| Lueur des services | Survol à la souris | Opacité 0,6 s | — | `src/motion/effects/spotlight.js` + `motion.css` |
| Boutons magnétiques (appel final) | Souris | `quickTo` 0,6 s, `power3`, ±14 / ±10 px | — | `src/motion/effects/magnetic.js` |
| Apparitions `.reveal` (d'origine) | 12 % dans l'écran | 1,1 s, `--ease-out` | Visibles | `src/js/site.js`, `site.css` |
| Traits dessinés (d'origine) | Scroll | — | Dessinés | `src/js/site.js` |
| Nav : jauge, repli, retrait (d'origine) | Scroll | Ressorts | — | `src/js/nav.js` |
| Moment « orbite » (d'origine) | Bouton maintenu | 1,6 s | Achevé tout de suite | `src/js/site.js` |
| Agents : extrait en boucle | Section à moins de 200 px de l'écran, après `load` | Lecture vidéo, fondu d'opacité `DUR.base` à `playing` ; pause hors écran, onglet caché, modale ouverte, ou au bouton | Non chargé : affiche seule, sans bouton | `src/js/agents/loop.js` |
| Agents : modale du film | Clic sur « Voir la vidéo » | Entrée 0,6 s (`DUR.base`, `--ease-out`), opacité et 16 px | Immédiate | `src/js/agents/film.js`, `agents.css` |
| Équipe : changement d'agent | Clic, toucher, flèches | Fiche 0,6 s (opacité, 14 px), mascotte 1,1 s (opacité, 28 px, échelle 0,96), lueur 1,1 s | Immédiat | `src/js/agents/crew.js`, `agents.css` |
| Équipe : impulsions et onde | En continu, seulement à l'écran (`.on`) | Impulsion 2,4 s `--ease-io` (`translate`) ; barres 1,1 s (`scaleY`) | Arrêtées | `agents.css` |
| Mission | Arrivée à l'écran (une fois) | 3,4 s : remplissage `scaleX`/`scaleY` et point (`x`/`y`) linéaires ; étapes en opacité 0,3 s + échelle 0,86 → 1 (0,6 s, `expo.out`) tous les 0,62 s | Non chargé : tout allumé | `src/motion/effects/missionFlow.js` |

## Écarts assumés par rapport à la consigne

- **Pas de Three.js** : canvas 2D dans un worker, mesuré à 60 i/s (D14).
- **Pas de curseur personnalisé** (D16), **pas de compteurs** (D17, le site n'affiche aucun chiffre).
- **Pas de nouvel épinglage de section :** l'espace d'épinglage allongerait la page et changerait la mise en page. Le hero est déjà épinglé (sticky).
- **Pas de transitions de page :** le site tient sur une seule page. Les ancres passent par Lenis (souris) ou par le défilement natif.
- **Barre de progression, nav masquée au scroll, menu mobile animé :** déjà présents dans `nav.js`, pas dupliqués.
