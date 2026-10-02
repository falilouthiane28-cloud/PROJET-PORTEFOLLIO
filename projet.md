# Projet : portfolio Saturn Design Studio

Mis à jour le 01/10/2026.

## En bref

Site vitrine du studio Saturn (Dakar) : sites premium, plateformes web, employés IA.
Une seule page en français, design sombre « cosmique » : nuit violette, typo Archivo très large, accents en Instrument Serif italique, étiquettes en JetBrains Mono.
L'appel à l'action principal est WhatsApp.

- **Contacts :**
  - WhatsApp : https://wa.me/message/YXCZMZCCFQKDF1
  - E-mail : saturndesingstudio@gmail.com (orthographe à confirmer)
  - Instagram : @saturn_sn
- **Adresse en ligne :** pas encore définie. `saturn.example` sert de valeur temporaire, voir « DEPLOY STEP » dans `index.html`.

## Pile technique

- HTML, CSS et JavaScript sans framework, construits avec **Vite 8** : fichiers hachés, CSS inséré dans la page, fichiers pré-compressés en `.br` et `.gz`.
- **GSAP 3.15 + ScrollTrigger + Lenis 1.3** pour le hero.
- Pas de Three.js : retiré, la scène du hero est en canvas 2D dans un worker.
- Polices auto-hébergées, réduites au latin français, dans `src/assets/fonts/`.
- Images des projets en AVIF/WebP responsives (`src/assets/img/work/`). Poster du hero dans `src/assets/img/hero/`.

## Structure

```
index.html              page unique (sections : hero, bandeau, projets, services, méthode, studio, FAQ, contact, footer)
src/main.js             point d'entrée
src/styles/
  fonts.css             @font-face des polices d'origine
  site.css              design d'origine (ne pas modifier sans raison)
  nav.css               barre de navigation (pilule noire)
  hero.css              couches et états de l'animation du hero
src/js/
  site.js               horloge, apparitions, traits dessinés, moment « mettre en orbite »
  nav.js                navigation (ressorts, pastille, menu mobile)
  hero/scene.js         dessin de la scène (Saturne, anneau, 4 mondes), sans DOM
  hero/worker.js        rendu dans un worker OffscreenCanvas + qualité adaptative
  hero/index.js         contrôleur : intro, scroll, pointeur, bascule statique/animé
tools/                  rendu du poster du hero depuis la scène
scripts/                serveur façon CDN, mesures (images/s, LCP), résumé Lighthouse, pré-compression
perf/                   rapports Lighthouse, captures, analyse du bundle
AUDIT.md                audit initial + résultats de la refonte (abandonnée)
HERO-BASELINE.md        recherche, mesures de départ et décisions pour le hero
```

## Branches git

Le dépôt git est propre au projet, dans `PROJET-PORTFOLLIO/.git`.

| Branche | Contenu |
|---|---|
| `main` | La refonte blanc/lilas (planète nacrée en 3D). **Le client ne l'a pas retenue**, gardée pour l'historique. |
| `hero-animation-v2` | Design d'origine restauré, puis hero réanimé. |
| `motion-system-v1` | **Branche de travail actuelle.** Système de mouvement (8 effets), corrections, structure Claude Code, tests. Voir `docs/`. |

Commits de repère :
- `6e0680d` : état initial.
- `d7d02c8` : dernier commit avant la refonte.
- `bf8d41d` : restauration.
- `25d30ec` : nouveau hero.

## État d'avancement

- [x] Job 1 : design d'origine restauré à l'identique. Vérifié par captures à 390, 768 et 1440 px : moins de 1 % de pixels différents, venant des images réencodées et des éléments animés.
- [x] Polices d'origine auto-hébergées (rendu identique), SEO invisible (canonical, locale, carte Twitter).
- [x] Hero : scène dans un worker, poster d'abord, intro en timeline GSAP, scroll lissé, pointeur, bouton magnétique, qualité adaptative, niveaux statique / poster / animé.
- [x] Intro différée et premier scroll arbitrés (`motion-system-v1`, voir `docs/PERFORMANCE.md`).
- [x] Système de mouvement, tests (e2e, régression visuelle, a11y, mouvement réduit, unitaires), structure `.claude/`.
- [ ] Décision du client : pause du bandeau (WCAG 2.2.2, `docs/AUDIT.md` A24).
- [ ] Vérification finale : Lighthouse ×3, mouvement réduit, captures 390/768/1440, revue au ralenti, tableau avant/après dans `HERO-BASELINE.md`.
- [ ] Déploiement : choisir l'hébergeur, remplacer `saturn.example`, régénérer `og.jpg` et l'icône Apple dans le style sombre.

## Mesures clés

Machine calibrée : une page vide tient 60 i/s.

| | Hero d'origine | Nouveau hero (`25d30ec`) |
|---|---|---|
| Ordinateur : scroll | 58–59 i/s | 60 i/s, 0–1 image perdue |
| Ordinateur CPU ×4 : scroll | 44–46 i/s, 54 perdues | 55–58 i/s |
| Ordinateur : LCP réel | 0,47–0,62 s | 0,33–0,42 s |
| Mobile (Slow 4G, CPU ×4) : LCP réel | 1,48–1,65 s | 1,32–1,54 s |
| Mobile : scroll | 58 i/s | 53–59 i/s |
| Lighthouse mobile (départ) | 99, LCP 1,88 s, TBT 50 ms, CLS 0 | à remesurer |
| Console | 0 erreur | 0 erreur |
