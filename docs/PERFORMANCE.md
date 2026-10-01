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

## Résultats

Voir la fin de ce fichier : tableau avant/après, rempli en phase 5.
