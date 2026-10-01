# Budget de performance

Les budgets ci-dessous sont vérifiés par `npm run test:perf` et, pour la taille du bundle, par le pre-commit.

| Critère | Budget |
|---|---|
| Lighthouse mobile | Perf ≥ 90 · A11y = 100 · BP ≥ 95 · SEO ≥ 95 |
| LCP | ≤ 2,0 s |
| CLS | ≤ 0,05 |
| INP | ≤ 200 ms |
| TBT | ≤ 200 ms |
| JS initial (gzip) | ≤ 150 Ko. Le montant actuel est dans `docs/PERFORMANCE.md`. |
| Au-dessus de la ligne de flottaison | ≤ 300 Ko |
| Hero | 60 i/s sur ordinateur, ≥ 50 i/s sur mobile bridé, aucune image perdue visible |

## Chargement

- **Chargés à la demande :**
  - les effets sous la ligne de flottaison, par `import()` dynamique, après la première peinture ou en idle ;
  - la scène animée du hero, dans le worker, après l'intro.
- **Rien de bloquant :**
  - aucun script tiers ;
  - le CSS est inséré dans la page (plugin `css-en-ligne`).

## Images

- AVIF, puis WebP en repli, avec `srcset` et `sizes`, `width` et `height` explicites, et `loading="lazy"` sous la ligne de flottaison.
- Une image masquée selon le contexte ne doit pas être téléchargée : utiliser une `<source media>` 1×1 (voir le poster du hero).

## Polices

- Auto-hébergées en woff2, réduites au latin français, préchargées, avec `font-display: swap`.
- **Pas de `local()`** : sous Windows, le premier rendu était bloqué environ 1 s (mesuré).

## Mesurer

Avant toute mesure :
- l'ordinateur est **sur secteur** ;
- les processus Edge ont été fermés ;
- une page vide tient 60 i/s.

Faire 3 passages par profil et noter la plage, pas une valeur unique.
