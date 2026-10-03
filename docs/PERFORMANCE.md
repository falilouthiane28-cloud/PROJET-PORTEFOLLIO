# Performance : budgets, point de départ, résultats

## Budgets

Ils sont vérifiés automatiquement par `npm run test:perf` et par le hook pre-commit (taille du bundle).

| Critère | Budget |
|---|---|
| Lighthouse mobile (Slow 4G, CPU ×4) | Performance ≥ 90 · Accessibilité = 100 · Bonnes pratiques ≥ 95 · SEO ≥ 95 |
| LCP / CLS / TBT (mobile) | ≤ 2,0 s / ≤ 0,05 / ≤ 200 ms |
| INP | ≤ 200 ms |
| JS initial (gzip) | ≤ 150 Ko. Effets sous la ligne de flottaison : à la demande. |
| Poids au-dessus de la ligne de flottaison | ≤ 300 Ko |
| Hero, ordinateur | 60 i/s, aucune image perdue visible |
| Hero, mobile moyen bridé | ≥ 50 i/s |
| Console | 0 erreur, 0 avertissement |
| Débordement horizontal (320 à 1920 px) | 0 |

## Comment mesurer

Voir `process.md`, section « Mesurer ». Commandes utiles :

```bash
npm run build && npm run preview                       # sert dist/ sur :4181 (Brotli, cache)
node scripts/bench.mjs http://localhost:4181/ desktop,desktopcpu,mobile 3
node scripts/audit.mjs http://localhost:4181/ perf/audit
npm run test:perf                                       # Lighthouse mobile + budgets
```

**Avant toute mesure :**
- Calibrer la machine : une page vide doit tenir 60 i/s, ce que fait `bench.mjs` sur une URL `data:`.
- Vérifier que l'ordinateur est **sur secteur**. Sur batterie, Windows bride le CPU, et Lighthouse en simulation multiplie ce bridage : on a mesuré un score Performance de 64 à 81 sur batterie, contre 99 sur secteur pour le même code.

## Point de départ (01/10/2026, commit `4441531`, sur batterie)

### Bundle

| Fichier | Taille | gzip |
|---|---|---|
| `index-*.js` (GSAP, ScrollTrigger, Lenis, site, nav, hero) | 156,2 Ko | **58,8 Ko** |
| `worker-*.js` (scène du hero) | 6,9 Ko | chargé après l'intro |
| `index.html` (CSS en ligne) | 65,7 Ko | 17,1 Ko |
| Polices (4 woff2) | 108 Ko | — |

### Lighthouse

| | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | Poids |
|---|---|---|---|---|---|---|---|---|---|
| Mobile n° 1 | 77 | 100 | 100 | 100 | 2,1 s | 3,6 s | 377 ms | 0,06 | 324 Ko |
| Mobile n° 2 | 64 | — | — | — | — | 3,8 s | — | 0 | — |
| Mobile, référence `3f96ffb` | 81 | 100 | 100 | 100 | 2,1 s | 3,2 s | 315 ms | 0 | 324 Ko |
| Desktop | 97 | 100 | 100 | 100 | 0,7 s | 0,9 s | 74 ms | 0 | 241 Ko |

Élément LCP :
- mobile : `p.lead` du hero statique ;
- desktop : le poster AVIF du hero.

Sur secteur, `HERO-BASELINE.md` donnait 99 sur mobile pour ce même hero.

### Images par seconde (`bench.mjs`, 3 passages, même séance)

Format : i/s / images perdues.

| Profil | Intro | Timeline d'intro | Premier scroll | LCP réel |
|---|---|---|---|---|
| Desktop, référence | 29–44 / 6–15 | — | 40–55 / 17–74 | 0,74–1,9 s |
| Desktop, départ | 33–46 / 5–14 | 44–53 / 2–16 | 27–56 / 14–82 | 0,66–2,5 s |
| Desktop CPU ×4, référence | 2–11 | — | 16–29 | 0,8–3,7 s |
| Desktop CPU ×4, départ | 1–23 | 10–39 | 11–30 | 1,3–2,9 s |

**À retenir :** sur batterie, les deux versions sont aussi lentes l'une que l'autre. Ces chiffres ne valent que comme comparaison relative. La mesure finale se fait sur secteur (voir « Résultats »).

## Résultats (02/10/2026)

« Avant » = `4441531`, le départ de la branche. « Après » = la fin de la branche. Les deux builds sont servis côte à côte (`:4182` et `:4181`) et mesurés **en alternance dans la même séance**. Données brutes : `perf/bench-final.txt`.

### I/s, sur secteur, machine calibrée (page vide à 60 i/s)

Format : i/s / images perdues.

| Profil | Phase | Avant | Après | Budget | Statut |
|---|---|---|---|---|---|
| Ordinateur | Timeline d'intro | 54–56 / 2–3 | 53–57 / 2–3 | 60 | Inchangé, sous la cible |
| Ordinateur | Premier scroll | 53–60 / 1–14 | **59 / 3** (×3) | 60 | Plus stable |
| Ordinateur CPU ×4 | Premier scroll | 41–48 | 42–47 | — | Inchangé |
| Mobile (Slow 4G, CPU ×4) | Timeline d'intro | 48–59 | 55–59 | ≥ 50 | OK |
| Mobile (Slow 4G, CPU ×4) | Premier scroll | 56–58 / 10–15 | 56–58 / 12–24 | ≥ 50 | OK |
| Mobile | LCP réel | 1,38–1,80 s | **1,28–1,58 s** | ≤ 2,0 s | OK, meilleur (le poster n'est plus téléchargé) |
| Toutes | CLS réel | 0,002–0,003 | 0,002–0,003 | ≤ 0,05 | OK |
| Toutes | Console | 0 | 0 | 0 | OK |

En cours de route, une régression sur mobile a été mesurée puis corrigée. Le premier scroll était tombé à 49–52 i/s, parce que le système de mouvement s'initialisait pendant le premier geste. Il attend maintenant la fin de l'intro et un moment sans défilement (`793edcf`, `8848d4f`).

### Lighthouse mobile (simulation Slow 4G, CPU ×4)

| | Avant (3 passages, secteur) | Après (3 passages, secteur) | Budget |
|---|---|---|---|
| Performance | 90 / 94 / 95 | 88 / 90 / 91 | ≥ 90 |
| Accessibilité, bonnes pratiques, SEO | 100 / 100 / 100 | 100 / 100 / 100 | 100 / ≥ 95 / ≥ 95 |
| LCP (simulé) | 2,79–2,96 s | 2,77–2,88 s | ≤ 2,0 s : **échec, avant comme après** |
| TBT | 63–194 ms | 189–267 ms | ≤ 200 ms : **échec après** |
| CLS | 0 | 0 (0,06 une fois sur 3) | ≤ 0,05 |
| Poids | 324 Ko | **244–252 Ko** | ≤ 300 Ko : OK |

**TBT.** La hausse venait d'une tâche longue de 504 ms : l'initialisation des 8 effets d'un seul bloc, dont 10 ScrollTriggers qui mesurent la page. Après correction (un effet par tâche en temps libre, titres déclenchés par IntersectionObserver), ses tâches font 67 à 69 ms dans les traces Lighthouse. **Cette correction n'a pas pu être revalidée par un Lighthouse complet sur secteur :** l'ordinateur est repassé sur batterie, et les deux versions sont alors tombées ensemble à 59–88.

**LCP simulé à 2,8 s.** Il existe déjà au départ. L'élément LCP est le paragraphe du hero statique. La plus longue tâche du chargement (0,3 à 1,1 s selon les passages) est l'évaluation du module principal, présente avant comme après. Le profil CPU (mobile ×4) la rattache surtout à la première mise en page, forcée par `drawLines()` de `site.js` pendant l'évaluation du module. Piste : faire ce premier calcul à la première image. Elle n'est pas appliquée, faute d'une mesure stable pour la valider.

### Bundle

| | Avant | Après | Budget |
|---|---|---|---|
| JS initial (gzip) | 56,9 Ko | 57,9 Ko | ≤ 150 Ko : OK |
| JS à la demande | worker 3,3 Ko | worker 3,3 Ko + mouvement 9,2 Ko | — |

### Revues indépendantes (phase 5)

| Agent | Résultat |
|---|---|
| visual-qa | Tout passe : 6 largeurs × mouvement normal/réduit, 26/26 tests e2e, régression visuelle OK à 390, 768 et 1440 px. |
| code-reviewer | Aucun point bloquant ; les points importants sont corrigés (voir `AUDIT.md`, A16 à A23). |
| a11y-reviewer | 2 problèmes corrigés (A15, A18) ; la pause du bandeau (A24) attend une décision du client. |
| perf-auditor | **Non terminé** : la session s'est arrêtée pendant ses mesures. À relancer sur secteur avec `npm run test:perf` et `node test/perf/lh-compare.mjs`. |

## Section Saturn Agents (03/10/2026, branche `video-agents-v1`, sur secteur)

Lighthouse mobile (Slow 4G, CPU ×4), 5 passages en alternance avec `motion-system-v1` (`node test/perf/lh-compare.mjs`), médiane [plage] :

| | Perf | LCP | TBT | FCP | CLS | Poids |
|---|---|---|---|---|---|---|
| Avant (sans la section) | 96 [95–98] | 2 455 ms [2 363–2 512] | 88 ms [45–114] | 1 600 ms | 0 | 252 Ko |
| Après | 95 [92–97] | 2 361 ms [2 259–2 436] | 166 ms [107–245] | 1 676 ms | 0 | 202 Ko |

Budgets (`node test/perf/lighthouse.mjs`, 3 passages) : Perf 97 · A11y 100 · BP 100 · SEO 100 · CLS 0 · TBT 124 ms · 202 Ko. **LCP 2,32 s : au-dessus du budget de 2,0 s, déjà le cas avant la section (2,46 s).** Rapport : `perf/agents/lighthouse-mobile.html`.

Ce qui a été mesuré et corrigé en chemin :

| Version | Perf | LCP | TBT | Poids | Cause |
|---|---|---|---|---|---|
| Première version | 94 | 2 697 ms | 128 ms | 282 Ko | Style et mise en page 451 → 889 ms ; avatars téléchargés deux fois (AVIF + WebP) ; images de la section chargées tôt |
| + `content-visibility`, avatars dédoublonnés | 92 | 2 393 ms | 222 ms | 202 Ko | Initialisation de la section dans la tâche du hero (+55 ms) |
| + initialisation en temps libre | 95–96 | 2 339–2 361 ms | 116–166 ms | 202 Ko | — |

Reste : le TBT dépasse la référence d'environ 50 à 80 ms (plages qui se recouvrent), sous le budget. JS initial : 59,8 Ko gzip (avant 58,1, `check-budget.mjs`). HTML avec CSS en ligne : 24,6 Ko gzip (+7,3 Ko).

Vidéos (hors chargement initial) : boucle 0,79 Mo (AV1) / 1,07 Mo (H.264) ; film 4:5 7,0 / 10,8 Mo ; film 9:16 4,7 / 6,5 Mo.

## Hero animé du téléphone (03/10/2026, branche `responsive-mobile-v1`, **sur batterie**)

**Cadence :** Edge, profil tactile, scène dans le worker : 28 à 30 i/s, 900 particules, DPR 1,5, de 360×640 à 844×390. L'objectif est 30 i/s stables (D29). Le budget « ≥ 50 i/s » vaut pour le hero épinglé de l'ordinateur.

**Lighthouse mobile, 5 passages en alternance avec `motion-system-v1` :**

L'ordinateur était sur batterie : les valeurs absolues sont faussées, seule la comparaison compte.

| | Perf | LCP | TBT |
|---|---|---|---|
| Avant | 80 | 2 634 ms | 570 ms |
| Après | 81 | 2 650 ms | 494 ms |

- Les deux versions sont équivalentes.
- Une première version créait un ScrollTrigger dès le chargement, pour lire la vitesse du défilement. Cela forçait une mise en page et ajoutait environ 70 ms à la tâche du script. Un écouteur passif, branché seulement pendant l'animation, l'a remplacé.
- **À refaire sur secteur :** `npm run test:perf`.
