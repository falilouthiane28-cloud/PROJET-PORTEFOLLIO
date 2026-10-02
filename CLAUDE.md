# Saturn Design Studio : portfolio

Site vitrine en une page, en français, au design sombre « cosmique ». **Le design est figé** : couleurs, polices, mise en page, textes, logo et images ne changent pas. On ajoute du mouvement et de la structure, jamais un nouveau style.

## Pile

- HTML, CSS et JS vanilla, construits avec Vite 8.
- GSAP 3.15 + ScrollTrigger, Lenis, Motion (`motion`, sous-ensemble).
- Scène du hero : canvas 2D dans un worker (OffscreenCanvas). **Pas de Three.js**, retiré après mesure, voir `docs/DECISIONS.md`.

## Commandes

```bash
npm run dev            # serveur Vite
npm run build          # dist/ + .br/.gz
npm run preview        # sert dist/ comme un CDN sur :4181
npm run build:file     # dist-local/index.html : s'ouvre en double-clic (file://), sans serveur
npm test               # lint + unitaires + e2e + a11y + mouvement réduit
npm run test:perf      # Lighthouse + budgets + i/s sous CPU ×4 (sur secteur)
npm run lint
npm run build:analyze  # carte du bundle : perf/bundle-analyse.html
```

## Règles (détail dans `.claude/rules/`)

- Commentaires et messages de commit **en français**.
- Petits commits, un sujet chacun. Jamais de force-push ni de réécriture d'historique.
- On n'anime que `transform` et `opacity`. Un seul moteur par élément. Tout effet a `init()` / `destroy()` et une variante en mouvement réduit.
- Aucune nouvelle dépendance sans justification écrite (poids ou risque en baisse).
- IMPORTANT : ne rien affirmer sans mesure. Avant de mesurer : la machine est sur secteur et une page vide tient 60 i/s.

## Où trouver quoi

- Architecture et ordre de chargement : `docs/ARCHITECTURE.md`
- Système de mouvement, catalogue des animations : `docs/MOTION-SYSTEM.md`
- Budgets et mesures : `docs/PERFORMANCE.md`
- Décisions et leurs sources : `docs/DECISIONS.md`
- Bugs connus : `docs/AUDIT.md`
- Historique : `docs/CHANGELOG.md`
- Contexte client et leçons apprises : `projet.md`, `memory.md`, `process.md`
- Agents spécialisés : `.claude/agents/` (motion-engineer, perf-auditor, visual-qa, a11y-reviewer, code-reviewer)
