# Audit du portfolio Saturn, avant refonte

Mesuré le 30/09/2026 sur la version `6e0680d` (site vanilla sans build), servie par `scripts/serve.mjs` (Brotli + en-têtes de cache, comme un CDN).
Outils : Lighthouse 12 (Edge headless, profil mobile = Slow 4G + CPU ×4), `scripts/frames.mjs` (mesure réelle des images, LCP, CLS, tâches longues), captures à 320 / 390 / 768 / 1024 / 1440 / 1920 px.
Safari/WebKit n'est pas disponible sur cette machine Windows : tests faits sur Chromium (Edge) uniquement.

## Mesures de départ

| Mesure | Mobile | Desktop | Objectif |
|---|---|---|---|
| Lighthouse Performance | **56** | **61** | ≥ 90 |
| Accessibilité / Bonnes pratiques / SEO | 100 / 100 / 100 | 100 / 100 / 100 | 100 / ≥ 95 / ≥ 95 |
| FCP (simulé) | 8,5 s | 2,1 s | |
| LCP (simulé) | **8,5 s** | **5,9 s** | ≤ 2,0 s |
| TBT | 0 ms | 0 ms | ≤ 200 ms |
| CLS | 0,026 | 0,026 | ≤ 0,05 |
| Poids transféré | 835 Ko (dont 701 Ko d'images, 108 Ko de polices) | 173 Ko | héros ≤ 300 Ko |
| LCP réel (Slow 4G, CPU ×4) | 3,05 s | 2,38 s | ≤ 2,0 s |
| Premier scroll | 45 i/s, 31 images perdues | 41 i/s, 43 images perdues | 60 i/s desktop, ≥ 50 mobile |
| Tâches longues pendant le chargement | 5 (1,74 s au total) | 4 (0,61 s) | |
| Erreurs console | 0 | 0 | 0 |
| Débordement horizontal (320 → 1920 px) | aucun | aucun | aucun |

Rapports complets : `perf/lh-avant-mobile.json`, `perf/lh-avant-desktop.json`.

## Écarts entre le brief et le projet réel

- Le brief décrit une pile Vite + GSAP + ScrollTrigger + Lenis + Three.js. Le projet réel n'en contenait aucune : c'était du HTML/CSS/JS sans build, avec un hero en canvas 2D. **Hypothèse retenue :** cette pile est la cible voulue, on migre vers elle.
- Le brief parle d'un formulaire de contact. Il n'y en a pas : le contact passe par des liens WhatsApp et e-mail, qui sont conservés tels quels.

## Bogues et problèmes

Gravité : **Critique** = casse un objectif mesuré de façon majeure · **Haute** = dégrade nettement l'expérience ou une mesure · **Moyenne** · **Basse**.

| # | Gravité | Problème | Où | Correction |
|---|---|---|---|---|
| C1 | Critique | FCP/LCP mobile à 8,5 s : chaîne bloquante Google Fonts (2 origines tierces), 2 feuilles CSS bloquantes, `body` qui apparaît en fondu depuis `opacity:0` | `index.html` `<head>`, `site.css` (`body{animation:pagein}`) | Polices auto-hébergées et préchargées, CSS critique en ligne, suppression du fondu de page |
| C2 | Critique | LCP desktop à 5,9 s : le H1 est découpé en lettres et reste invisible jusqu'à ce que le JS le fasse apparaître (rampe de 1,4 s) | `site.js` (`split`, `updateBands`), bande 1 du hero | H1 visible dès le HTML, révélation courte en transform uniquement, filet CSS si le JS tarde |
| H1 | Haute | 701 Ko d'images sur mobile : 4 captures JPEG de 1 824 px servies à un écran de 390 px, sans AVIF/WebP ni `srcset` | `index.html` (section Projets) | AVIF + WebP en 480/800/1200/1600 px, `srcset`/`sizes`, `decoding="async"` |
| H2 | Haute | Images perdues au scroll (desktop 41 i/s, mobile 45 i/s) : le canvas redessine 2 800 particules et 22 ellipses à chaque image sur le thread principal, plus une nébuleuse plein écran animée et un grain en `mix-blend-mode` | `cosmos.js`, `.env__nebula`, `.env__grain` | Hero reconstruit : 3D dans un worker OffscreenCanvas, suppression du fond animé et du grain |
| H3 | Haute | Plusieurs boucles `requestAnimationFrame` indépendantes (scène, ressorts de la nav, lancement) et plusieurs écouteurs de scroll | `cosmos.js`, `nav.js`, `site.js` | Une seule horloge : `gsap.ticker` pilote Lenis, ScrollTrigger, la nav et les interactions |
| H4 | Haute | À 320 px, les étiquettes des planètes et la ligne « Studio de design et web » se chevauchent dans le hero statique | `.hero__static`, `.chips` | Nouveau hero, mise en page mobile dédiée |
| H5 | Haute | Fichiers non hachés : impossible de les mettre en cache long (`uses-long-cache-ttl`) | tous les assets | Build Vite (noms hachés) + `_headers` en cache immuable + fichiers pré-compressés |
| M1 | Moyenne | Fond plein écran qui bouge en permanence (nébuleuse, 90 s) : coûteux sur GPU modeste et gênant pour les personnes sensibles au mouvement | `.env` | Supprimé, remplacé par un dégradé fixe |
| M2 | Moyenne | Deux `<h1>` dans le DOM (un caché selon l'écran) | hero | Un seul `<h1>` |
| M3 | Moyenne | `og:image` pointe vers un fichier qui n'existe pas, `og:url` est un exemple | `<head>` | Image de partage générée depuis le rendu 3D, URL à compléter au déploiement |
| M4 | Moyenne | Changement de police à l'arrivée d'Archivo élargi : CLS 0,026 | polices | Polices de repli ajustées (`size-adjust`, `ascent-override`) |
| M5 | Moyenne | `scroll-behavior:smooth` en CSS entrerait en conflit avec Lenis | `site.css` | Remplacé par la navigation d'ancres via Lenis |
| M6 | Moyenne | Palette sombre multicolore (planètes rouge, magenta, argent), contraire à la nouvelle direction | tout le site | Palette blanc + lilas, violet en accent seulement |
| L1 | Basse | Pas de `robots.txt`, pas de `canonical`, pas d'icône Apple | racine | Ajoutés (URL canonique à compléter au déploiement) |
| L2 | Basse | L'adresse « saturndesingstudio@gmail.com » ressemble à une faute de frappe | contact | Laissée telle quelle, **à confirmer par le client** |
| L3 | Basse | Pas de `decoding="async"` sur les images | projets | Ajouté |

Points vérifiés sans défaut : aucune erreur console, aucune 404, pas de débordement horizontal, navigation clavier complète (menu, FAQ, bouton maintenu), repères `header`/`nav`/`main`/`footer`, lien d'évitement, `prefers-reduced-motion` respecté, contrastes AA sur la palette actuelle.

Les correctifs C1, C2, H1, H3 et H5 passent par la migration vers Vite, les polices et les images, faites **avant** la refonte visuelle. H2 et H4 concernent l'ancien hero : ils sont réglés par sa reconstruction complète.
