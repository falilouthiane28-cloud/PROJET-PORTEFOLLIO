# Mémoire du projet : décisions et leçons

À relire avant toute reprise. Chaque point a été mesuré, pas supposé.

## Préférences du client

- Langue : **français** partout, y compris les commentaires dans le code.
- Le client **préfère le design sombre d'origine**. Il a rejeté la refonte blanc/lilas (branche `main`).
- Pour le hero : garder le rendu existant et améliorer seulement le mouvement. Ne pas toucher à la palette, aux polices, aux textes, à la mise en page, au logo, à la navigation ni aux autres sections.
- Commits petits, un sujet chacun, messages clairs. Ne jamais supprimer l'historique.
- Ne pas s'arrêter pour demander sauf blocage réel. Annoncer les hypothèses.

## Décisions techniques (et pourquoi)

| Décision | Raison mesurée ou constatée |
|---|---|
| Scène du hero en **canvas 2D dans un worker** (OffscreenCanvas), pas Three.js | Même code de dessin, donc rendu identique. Le dessin des 2 800 particules sur le thread principal faisait chuter le scroll à 44–46 i/s (CPU ×4). |
| **Poster fixe** sur ordinateur, voile animé au-dessus | Chrome ne compte une image animée (opacité ou transform) comme LCP qu'**à la fin** de son animation : 2,5 s mesurées au lieu de 0,6 s. |
| Titre masqué **mot à mot en CSS**, dès le premier rendu | Les coupures de ligne d'origine sont gardées à toutes les largeurs, et le LCP ne dépend pas du JS. |
| Mobile : paragraphe et boutons **non animés** | Avec le titre en masques mot à mot, chaque mot est un petit candidat LCP. Le paragraphe devient l'élément LCP : s'il attend le JS, LCP de 2,8–4,6 s. |
| Mobile : scène statique dessinée une fois, pas de poster | C'est le design d'origine, et une image ajoutée deviendrait l'élément LCP. |
| Lenis **seulement à la souris / au trackpad** | Au doigt, Lenis ne lisse rien mais écoute chaque `touchmove` et double les mises à jour de ScrollTrigger. |
| **Pas de `local()`** dans les `@font-face` | Sous Windows, Chrome énumère toutes les polices du système : le premier rendu était bloqué ~1 s. |
| Pas de `content-visibility` sur les sections animées | Leur hauteur réelle arrivait en plein geste et forçait un `ScrollTrigger.refresh()` (saccade de 1,4 s). |
| Une seule horloge : `gsap.ticker` | Elle pilote Lenis, le lissage du hero, les bandes, les étiquettes et les messages au worker. |
| Filet `intro-skip` à 1 400 ms | Sur Slow 4G le JS arrive tard : on affiche tout en fondu plutôt que de faire attendre. |
| `navigator.connection.effectiveType` « 3g » **non utilisé** pour couper l'animation | C'est une estimation de Chrome qui classe aussi beaucoup de 4G ouest-africaines. |

## Pièges rencontrés

- **GSAP et les états CSS de départ :** si le CSS pose déjà un `translateY(112%)`, GSAP le lit comme un décalage en px et l'ajoute à `yPercent`. Toujours mettre `y: 0` (ou `x: 0` avec `xPercent`) dans le `from`.
- **Three.js r163+ :** `envMapIntensity` du matériau ne s'applique plus à `scene.environment`. Utiliser `scene.environmentIntensity`.
- **Captures « pleine page » (`captureBeyondViewport`) :** elles ne peignent pas les sections en `content-visibility:auto` hors écran. Ce n'est pas un bogue du site.
- **Injection CSS dans les tests :** le style doit aller dans `<head>`, pas avant (sinon il n'est pas appliqué).
- **Machine de mesure :** elle se dégrade après de longues séries (page vide tombée à 30 i/s). Toujours calibrer avant de mesurer et refaire si la page vide n'est pas à 60 i/s.
- **Geste tactile simulé :** `Input.synthesizeScrollGesture` ne fait pas défiler en headless. Utiliser `Input.dispatchTouchEvent` (déjà fait dans `scripts/frames.mjs`).

## Point ouvert (à reprendre)

Modification **non commitée** : l'intro démarre deux images après l'initialisation (`requestAnimationFrame` ×2, timeline créée en pause).

- **Gain :** l'intro passe de 46–48 à 52–55 i/s (ordinateur ×4), et l'intro joue sur mobile (56–58 i/s).
- **Perte :** le premier scroll passe de 57 à 45–47 i/s (ordinateur ×4), et de 58–59 à 53–55 sur mobile. Le travail d'après-intro (découpe des bandes 2 et 3, démarrage du worker) tombe pendant le premier geste.

Pistes :
1. Ne pas découper les bandes en mode statique (elles sont masquées).
2. Faire la découpe juste avant que chaque bande arrive.
3. Démarrer le worker pendant un vrai temps mort, pas pendant un geste.

## Outils et mesure

- Navigateur de test : Edge headless (Chrome non installé), avec `--use-angle=d3d11` pour le GPU.
- Lighthouse : `npx lighthouse@12` avec `CHROME_PATH` pointé vers Edge.
- Safari/WebKit : non disponible sur cette machine Windows.
