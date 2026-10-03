# Journal des changements

## `responsive-mobile-v1` (03/10/2026)

- `6bc0b77` **Recherche :** `reports/Hero mobile et responsive.md`.
- `ef53c33` **Hero du téléphone animé :** la scène tourne dans le worker à 30 i/s, sans épinglage, par-dessus le dessin statique.
- `8ca1e1d` **Responsive :**
  - le hero ne chevauche plus son texte, en portrait comme en paysage ;
  - liens « Voir le site » vers les sites des clients ;
  - « Retour en haut » à 44 px au toucher ;
  - espaces insécables.
- `4110faa` **Film :** sous-titres éteints par défaut, défilement bloqué au toucher (iOS).
- `bbc9e49` **Tests :** hero du téléphone, liens, sous-titres. Références visuelles mises à jour.

## `video-agents-v1` (03/10/2026)

### Section Saturn Agents

- `3e442aa` **Recherche :** le brief de la phase 1, validé par le client (`reports/Vidéo hero et équipe agents.md`).
- `36070dd` **Médias :**
  - boucle de 8,85 s (AV1 0,79 Mo, H.264 1,07 Mo) ;
  - film de 40 s en 4:5 et en 9:16 ;
  - sous-titres FR ;
  - mascottes et affiches en AVIF et WebP.
- `fedb92a` **Section :**
  - extrait en boucle différé avec bouton pause ;
  - film dans un `<dialog>` ;
  - équipe en onglets ;
  - lien « Agents » dans la nav.
  - Voir `docs/AGENTS.md`.
- `78cd883` **Mouvement :** la mission traverse l'équipe, une fois, sans scroll épinglé.
- `6544ae6` **Tests :** 5 tests e2e et 1 en mouvement réduit. 9 nouvelles références visuelles, Projets et Studio mis à jour.

### Mesures (Lighthouse mobile, 5 passages en alternance)

| | Perf | LCP | TBT | Poids |
|---|---|---|---|---|
| Avant | 96 | 2,46 s | 88 ms | 252 Ko |
| Après | 95 | 2,36 s | 166 ms | 202 Ko |

Le TBT reste sous le budget de 200 ms. Détail dans `docs/PERFORMANCE.md`.

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

### Phase 5 : revues indépendantes et mesures

- `793edcf` et `8848d4f` Les effets attendent la fin de l'intro et un moment sans défilement : sur mobile, le premier scroll est revenu de 49–52 à 56–58 i/s.
- `3a991ba` Le focus clavier seul déclenche un défilement (revue a11y). Le worker démarre avec sa visibilité réelle. Bouton magnétique du hero via `translate`.
- `e4587a1` Préchargement du poster aligné sur les conditions du hero animé.
- `28e50db` Le bandeau ne se fige plus après une remontée.
- `dc490a1` Contraste des mots « éteints » du studio porté à ≈ 3,7:1.
- `8d1102f` Démontage complet des effets ; un effet en erreur n'arrête plus les autres.
- `944ffa0` Un effet par tâche en temps libre ; titres déclenchés par IntersectionObserver (tâche de 504 ms découpée) ; outil `test/perf/lh-compare.mjs`.

### Structure et outillage

- `c18a876` `tier.js` et `quality.js` deviennent des modules purs ; ajout d'ESLint.
- `4f487be` `CLAUDE.md`, `.claude/rules`, `.claude/agents`, hooks Claude Code, pre-commit git.
- `aab5914` et `4bc84cc` Tests : unitaires, e2e, régression visuelle, a11y, mouvement réduit, perf.

### Documentation

- `b0c2b10` `AUDIT.md`, `PERFORMANCE.md`, `scripts/audit.mjs`.
- `b567fee` Recherche de la phase 1 et `DECISIONS.md`.
- Ajout de `ARCHITECTURE.md`, `MOTION-SYSTEM.md` et de ce journal.
