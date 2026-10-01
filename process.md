# Process : comment travailler sur le projet

## Lancer et construire

```bash
npm install              # une fois
npm run dev              # serveur de développement Vite
npm run build            # build de production dans dist/ (+ fichiers .br/.gz)
npm run preview          # sert dist/ comme un CDN (Brotli, cache) sur http://localhost:4181
npm run analyze          # build + carte du bundle dans perf/bundle-analyse.html
```

## Règles de travail

1. **Branche :** travailler sur `hero-animation-v2` ou sur une nouvelle branche. Ne jamais réécrire l'historique. La refonte abandonnée reste sur `main`.
2. **Petites étapes vérifiées :** une modification, puis build, puis mesure, puis commit. Un sujet par commit, message en français, terminé par la ligne Co-Authored-By.
3. **Périmètre du hero :** ne toucher que `src/js/hero/`, `src/styles/hero.css` et le balisage du hero dans `index.html`. `site.css` et les autres sections ne changent pas.
4. **Commentaires du code en français.**
5. **Aucune nouvelle dépendance** sans justification écrite (poids ou risque en baisse).

## Mesurer

Toujours dans cet ordre :

1. **Servir le build :** `node scripts/serve.mjs dist 4181`.
2. **Calibrer la machine :** une page vide doit tenir 60 i/s. Sinon, attendre ou relancer, et ne rien conclure.
3. **Images par seconde, LCP, tâches longues (3 passages par profil) :**
   ```bash
   node scripts/frames.mjs http://localhost:4181/ desktop
   node scripts/frames.mjs http://localhost:4181/ desktopcpu   # CPU ×4
   node scripts/frames.mjs http://localhost:4181/ mobile       # Slow 4G + CPU ×4, gestes tactiles
   ```
   Options :
   - `--trace fichier.json` : trace de performance.
   - `--reduced` : mouvement réduit.
   - `--no-webgl` : WebGL désactivé.
   - `--css "…"` : injecte une règle CSS (tests A/B).
   - `--block "*motif*"` : bloque des URL.

   Sortie :
   - `timeline` : images par seconde pendant la timeline d'intro seule.
   - `intro` : du premier rendu au début du scroll.
   - `scroll` : premier scroll.
4. **Lighthouse mobile ×3 et desktop ×1 :**
   ```bash
   CHROME_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" npx -y lighthouse@12 http://localhost:4181/ --output=json --output-path=rapport.json --chrome-flags="--headless=new"
   node scripts/lh-summary.mjs rapport.json --fails
   ```
5. **Vérifications visuelles :**
   - Captures à 390, 768 et 1440 px.
   - Débordement horizontal de 320 à 1920 px.
   - Console vide.
   - Revue de l'intro au ralenti avec `?ralenti=4`.
6. **Forcer un niveau du hero :** `?niveau=poster` (appareil modeste) ou `?niveau=live`.

## Objectifs à tenir

| Critère | Cible |
|---|---|
| Hero ordinateur | 60 i/s, aucune image perdue visible à l'intro ni au premier scroll |
| Hero mobile bridé (CPU ×4) | ≥ 50 i/s |
| Lighthouse mobile | Performance ≥ 90, LCP ≤ 2,0 s, CLS ≤ 0,05, TBT ≤ 200 ms, et jamais pire que le point de départ |
| Console | 0 erreur, 0 avertissement |
| Mise en page | aucun débordement horizontal de 320 à 1920 px |
| Reste du site | visuellement inchangé |

## Régénérer le poster du hero

À faire **après chaque changement** de `src/js/hero/scene.js`.

1. Lancer le serveur de développement : `npx vite --port 5191`.
2. Rendre le poster :
   ```bash
   node tools/capture.mjs "http://localhost:5191/tools/hero-poster.html?R=200" scene-200.png
   ```
3. Encoder en AVIF et WebP, en 1300 et 1960 px de large (Pillow, qualité ~58), dans `src/assets/img/hero/`.

## Mettre en ligne

À faire quand l'hébergeur est choisi.

1. Remplacer `saturn.example` partout dans `index.html` (repère « DEPLOY STEP »).
2. Régénérer `public/og.jpg` (1200×630) et `public/apple-touch-icon.png` dans le style sombre.
3. `npm run build`, puis déployer le **contenu** de `dist/`. `public/_headers` gère le cache des fichiers hachés.
4. Vérifier en ligne : HTTPS, console, Lighthouse mobile.

## Tenir ces fichiers à jour

- `projet.md` : état d'avancement et mesures clés, à chaque étape terminée.
- `memory.md` : chaque nouvelle décision ou leçon mesurée, avec sa raison.
- `process.md` : chaque changement de commande ou d'outil.
