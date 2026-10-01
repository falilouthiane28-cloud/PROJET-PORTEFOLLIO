# Audit : branche `motion-system-v1`

Date : 01/10/2026. Point de départ : `4441531`, c'est-à-dire `hero-animation-v2` avec l'intro différée qui n'était pas commitée.
Outils :
- `scripts/audit.mjs` : Playwright + Edge, 6 largeurs, mouvement normal puis réduit, axe-core.
- `scripts/bench.mjs` : i/s, LCP, CLS, tâches longues.
- Lighthouse 12.

> **Machine :** toutes les mesures ont été prises **sur batterie** (CPU bridé par Windows). Les i/s absolus sont donc plus bas que dans `memory.md`. Seules les comparaisons faites dans la même séance ont du sens.

## Résultat global

| Contrôle (320, 390, 768, 1024, 1440, 1920 px × mouvement normal / réduit) | Résultat |
|---|---|
| Débordement horizontal | 0 sur les 12 cas |
| Éléments sortis de l'écran (sans ancêtre qui coupe) | 0 |
| Erreurs ou avertissements console | 0 |
| Requêtes en échec ou 404 | 0 |
| axe-core (WCAG 2.x A/AA) | 0 violation |
| Apparitions jamais déclenchées après un parcours complet | 0 |

Captures : `perf/base/audit/*.png` (non versionnées).

## Bugs trouvés

| # | Gravité | Bug | Preuve | État |
|---|---|---|---|---|
| A1 | **Haute** | Passage du hero statique au mode animé (rotation d'une tablette, fenêtre agrandie) : `transferControlToOffscreen` lève une exception et le hero reste bloqué sur le poster. | Reproduit sur la référence en chargeant à 390 px puis en passant à 1440 px : exception et mode `poster`. | Corrigé (`a2f45e5`) : 0 erreur, mode `worker`. |
| A2 | **Haute** | Le poster du hero (≈ 81 Ko) se téléchargeait sur mobile alors qu'il y est masqué, en concurrence avec le LCP en 4G. | Lighthouse `offscreen-images` : 81 KiB. | Corrigé (`98db2fa`) : une `<source>` 1×1 couvre les 5 conditions du hero statique. Vérifié à 390 px (non chargé) et à 1440 px (chargé). |
| A3 | **Haute (outillage)** | `scripts/frames.mjs` laissait les processus Edge ouverts (147 accumulés), ce qui faussait toutes les mesures suivantes. | Décompte des processus `msedge` avant et après. | Corrigé (`11458ff`) : 0 processus restant après une mesure. |
| A4 | Haute | Premier scroll : la découpe des bandes 2 et 3 et le démarrage du worker tombent pendant le premier geste (régression apportée par l'intro différée, voir `memory.md`). | Mesures de `memory.md` : de 57 à 45–47 i/s (CPU ×4). | Traité en phase 4 (hero). |
| A5 | Moyenne | Sur mobile, Lighthouse mesure un CLS de 0,06 une fois sur trois : `div.hero__static` se décale quand Archivo remplace la police système (le titre se recoupe). | `layout-shifts` du rapport Lighthouse. La mesure réelle (`frames.mjs`) donne 0,002–0,003. | Gardé. La parade habituelle (police de secours `local()` + `size-adjust`) est exclue : sous Windows, `local()` bloquait le premier rendu ~1 s (`memory.md`). |
| A6 | Moyenne | ~80 ms de reflow forcé, deux fois, à l'initialisation du hero (lectures de layout après des écritures DOM). | Lighthouse `forced-reflow-insight`. | Traité en phase 4 (hero). |
| A7 | Moyenne | JavaScript non utilisé au chargement : 29 KiB (ScrollTrigger et Lenis chargés même pour le hero statique). | Lighthouse `unused-javascript`. | Partiellement : les nouveaux effets sont chargés à la demande. |
| A8 | Basse | `will-change` permanent sur chaque lettre des bandes (`.split .c`) : une couche GPU par lettre. | `site.css` l. 155. | Gardé : le retirer décalerait la création des couches au moment où la bande arrive (risque d'à-coup). À mesurer. |
| A9 | Basse | Image du logo plus grande que son affichage (11 Ko). | Lighthouse `image-delivery-insight`. | Gardé (gain minime, image d'origine). |
| A10 | Basse | Les modules (`site.js`, `nav.js`, hero) n'exposent pas de `destroy()`. Page unique, jamais démontée : pas de fuite réelle. | Lecture du code. | Les nouveaux modules ont `init()` / `destroy()`. |
| A11 | Info | Pas de formulaire de contact : le contact passe par WhatsApp et l'e-mail. Les tests vérifient donc ces liens. | `index.html`. | — |
| A12 | Info | Orthographe de l'adresse e-mail (`saturndesingstudio@`) à confirmer par le client. | `projet.md`. | Contenu non modifié. |
| A13 | Info | WebGL n'est pas utilisé (canvas 2D dans un worker) : pas de repli WebGL à prévoir. Le repli sans OffscreenCanvas (thread principal) existe. | `hero/index.js`. | — |

## Points vérifiés et sains

- **100vh sur iOS :** `100svh` avec `100vh` en repli.
- **Polices :** auto-hébergées, `font-display: swap`, préchargées.
- **Mouvement réduit :**
  - hero statique, apparitions immédiates, Lenis coupé ;
  - le « moment orbite » s'achève sans animation.
- **Onglet caché :**
  - les animations CSS se mettent en pause ;
  - le worker s'arrête ;
  - les boucles `requestAnimationFrame` de `site.js` s'arrêtent.
- **ScrollTrigger :** rafraîchi après `document.fonts.ready` ; `ignoreMobileResize` est actif.
