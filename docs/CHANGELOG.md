# Journal des changements

## `motion-system-v1` (01/10/2026)

### Corrections

- `a2f45e5` **hero :** une rotation ou un redimensionnement du mode statique vers le mode animé faisait planter `transferControlToOffscreen`, et le hero restait bloqué sur le poster.
- `98db2fa` **hero :** le poster (≈ 81 Ko) n'est plus téléchargé sur mobile, où il est masqué.
- `18bb43b` **accessibilité :** le focus clavier n'atterrit plus sur un élément invisible (bandes du hero, conflit avec Lenis).
- `d056a3b` **FAQ :** la réponse restait invisible après une fermeture animée.
- `f033c92` **bandeau :** il reprend son allure normale en sortant de l'écran.
- `11458ff` **outils :** les mesures laissaient des processus Edge ouverts, ce qui faussait les mesures suivantes.

### Performance

- `4441531` L'intro du hero démarre deux images après l'initialisation.
- `b91c3d1` La découpe des bandes ne se fait plus pendant le premier geste de scroll. L'intro est interruptible. Plus de reflow forcé dans `measure()`.

### Mouvement

- `0c2cf77` Jetons de mouvement partagés entre le JS et le CSS.
- `ab171be` **Système de mouvement.** Ce commit contient, au-delà de ce qu'annonce son titre :
  - l'orchestrateur `src/motion/index.js` et son chargement à la demande dans `main.js` ;
  - les 8 effets de `src/motion/effects/` : titres ligne par ligne, phrase du studio mot à mot, captures révélées par masque, étiquettes en cascade, vitesse du bandeau, fermeture de la FAQ, lueur des services, boutons magnétiques ;
  - les styles de `motion.css`.
  - Ils devaient former des commits séparés. Après des tentatives bloquées par le pre-commit, les fichiers étaient restés indexés et sont partis ensemble. L'historique n'a pas été réécrit.

### Structure et outillage

- `c18a876` `tier.js` et `quality.js` deviennent des modules purs ; ajout d'ESLint.
- `4f487be` `CLAUDE.md`, `.claude/rules`, `.claude/agents`, hooks Claude Code, pre-commit git.
- `aab5914` et `4bc84cc` Tests : unitaires, e2e, régression visuelle, a11y, mouvement réduit, perf.

### Documentation

- `b0c2b10` `AUDIT.md`, `PERFORMANCE.md`, `scripts/audit.mjs`.
- `b567fee` Recherche de la phase 1 et `DECISIONS.md`.
- Ajout de `ARCHITECTURE.md`, `MOTION-SYSTEM.md` et de ce journal.
