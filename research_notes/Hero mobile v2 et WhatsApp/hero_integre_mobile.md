# Hero mobile intégré : patterns et références

> Note de méthode : WebFetch renvoie du texte, pas de rendu visuel. Les sites de studios (Lusion, Active Theory, Exo Ape, 14islands, Basement, Cuberto) ne livrent, par cette voie, qu'un extrait HTML sans leur CSS ni leur canvas. Impossible donc de « vérifier en direct » une mise en page mobile par simple fetch : je m'appuie sur des études de cas documentées (Codrops, articles de tendance) et des patterns techniques sourcés. Les sites nommés plus bas sont connus pour leurs partis-pris, mais chaque capture mobile reste à confirmer manuellement.

## Q1 — Patterns d'intégration canvas + texte sur mobile

### Takeaway
Cinq familles reviennent : (a) canvas plein cadre en fond avec scrim radial + text-shadow, (b) scène recadrée en « portrait » centrale avec texte qui chevauche, (c) objet focal diagonal (Saturne) occupant l'écran, titre dans le vide négatif, (d) « breakout » d'un élément (anneau ou planète) qui passe devant le titre pour fabriquer de la profondeur, (e) scène plein écran au chargement qui recule au scroll pour libérer le texte. Les trois dernières lisent le plus « éditorial / premium » et correspondent le mieux à l'ADN Saturn.

### Cited Findings
- Les mises en page éditoriales (titre + chapô + visuel + petites accroches, à la une d'un magazine) remplacent depuis fin 2025 les hero mono-slogan ; +4,2 s de temps sur le premier écran et +18 % de profondeur de défilement selon Webflow Analyze — [Pravin Kumar — Editorial layouts replace hero sections (2026)](https://www.pravinkumar.co/blog/editorial-layouts-replace-hero-sections-webflow-2026)
- Les layouts dits « bento » compartimentent le hero en tuiles de poids variables (Apple, Linear, Bolt cités) — [Pravin Kumar — Bento box hero sections](https://www.pravinkumar.co/blog/bento-box-hero-sections-webflow-design-2026)
- Les mises en page éditoriales à chevauchement : « des images qui franchissent des frontières invisibles, de grands mots qui interagissent avec le sujet, disparaissent derrière un corps ou occupent le vide négatif » — [JRNL NAU — Negative space in poster design](https://jrnl.nau.edu.ua/index.php/Design/article/view/20803)
- Règle du vide négatif : réserver 20–30 % du cadre d'un hero pour le texte, 40–50 % sur des miniatures lues au mobile — [Lovart — Negative space for text](https://www.lovart.ai/ru/blog/creating-negative-space-ai-leave-room-for-text)
- Les hero sections modernes utilisent le chevauchement et l'« overhang » pour créer de la profondeur et casser les bordures de section — [Lynton — Hero overlapping image](https://www.lyntonweb.com/hubspot-cms-themes/vertical/sections/hero-overlapping-image)
- Un canvas en fond plein écran avec `position: fixed`, pleine fenêtre, `pointer-events: none` laisse passer clics et scroll vers l'UI au-dessus — [Codeshack — pointer-events](https://codeshack.io/references/css/pointer-events/)
- Un « scrim » (voile translucide) est le moyen classique de rattraper la lisibilité d'un texte sur une image/canvas, souvent complété par un `text-shadow` de la couleur du scrim — [Bookmachine — Improving legibility of text on images](https://bookmachine.org/?p=25397)

### Inferences
- Pour un hero cosmique dense, le pattern (c) « objet focal diagonal, texte dans le vide négatif » protège mieux la lisibilité qu'un plein cadre pur : la zone de texte n'a jamais à combattre un fond mouvant. C'est la version mobile fidèle du desktop (Saturne + anneau + planètes), simplement recadrée.
- Le pattern (d) « breakout d'un anneau par-dessus la ligne du titre » suffit à faire sentir une seule couche d'illustration — c'est l'astuce la moins coûteuse en lisibilité et la plus éditoriale.

### Gaps
- Pas de donnée publique sur l'impact LCP d'un canvas plein cadre vs. poster statique sur un hero mobile précis ; à mesurer dans le projet.

## Q2 — Lequel préserve la marque, tient à 360 px et respecte le LCP ?

### Takeaway
Pattern (c) + (d) combinés : une Saturne cadrée haut-droit en « poster » PNG/AVIF statique pour le premier rendu (LCP = cette image), le canvas démarrant après `requestIdleCallback`, et un anneau qui passe devant la première ligne du titre. Les 4 planètes se logent dans la marge basse ou sur l'anneau, cliquables, sans jamais traverser la zone de texte.

### Cited Findings
- Images hero : « plein bord à plein bord ; l'image ou le motif ne doit pas nuire à la lisibilité du texte superposé ; placer le point focal à l'opposé du texte » — [RapiDevelopers — Full-screen hero section](https://www.rapidevelopers.com/md/webflow-tutorials/webflow-hero-section)
- Hero sections : « doivent fonctionner sur des écrans aussi étroits que 320 px ; les titres qui marchent au desktop peuvent être trop grands au mobile et casser maladroitement » — [RapiDevelopers — Full-screen hero section](https://www.rapidevelopers.com/md/webflow-tutorials/webflow-hero-section)
- `mix-blend-mode: difference` inverse le texte quel que soit le fond et garantit sa visibilité — [CSS-Tricks — Basics of CSS Blend Modes](https://css-tricks.com/basics-css-blend-modes/)
- `mix-blend-mode: overlay` sur un titre sombre produit un intégré visuel sans retirer la lisibilité ; `multiply` avec texte blanc sur fond noir pour un effet transparent — [CSS-Tricks — Basics of CSS Blend Modes](https://css-tricks.com/basics-css-blend-modes/)
- Les masques SVG (knockout text) scalent automatiquement en taille / inter-lettre / icônes sans resize manuel par breakpoint, « idéal pour hero sections et portfolios où l'on veut une typo massive qui tient au mobile » — [Speckyboy — CSS, SVG, Canvas masks](https://speckyboy.com/css-svg-canvas-masks.md)
- Référence pratique de knockout text par SVG mask (rect blanc, texte noir dans un `<mask>`) — [Viget — Reverse Knockout Text Mask Effect with SVG](https://viget.com/articles/reverse-knockout-text-mask-effect-with-svg)

### Inferences
- Le `mix-blend-mode: difference` sur le H1 permettrait au titre d'« inverser » la couleur de la Saturne sous-jacente — effet premium et autoadaptatif. Attention : il casse l'anti-aliasing sous-pixel sur WebKit et impose un `isolation: isolate` sur un conteneur, à mesurer.
- Un poster AVIF basse résolution servi dans un `<picture>` avec `fetchpriority="high"` reste la voie fiable pour un LCP ≤ 2 s, le canvas prenant le relais après `requestIdleCallback`.

### Gaps
- Confirmer sur appareils réels (Pixel bridé) que le passage poster → canvas ne génère pas de CLS si la boîte est verrouillée en `aspect-ratio`.

## Q3 — Références live

### Takeaway
Je liste 7 sites réputés pour un hero mobile « intégré » plutôt que « stacké ». WebFetch ne restitue pas leur rendu : à ouvrir manuellement sur un téléphone pour validation finale. Pour chacun j'indique l'intention observée dans la littérature publique.

### Cited Findings
- Oscar Pico — Portfolio 2024, étude de cas Codrops : hero avec intégration poussée du texte et des éléments 3D/scroll ; collaboration Oscar Pico × Nam Hai documentée (processus de design / dev) — [Codrops — Case Study: Oscar Pico Portfolio 2024](https://tympanus.net/codrops/tag/portfolio) (fiche d'index ; article de détail inaccessible sans crawl manuel)
- Ronin161 — nouveau portfolio 2024, « from ideas to code », Toon Shader custom ; cité comme référence hero WebGL — [Codrops — Case Study: Ronin161 (listing)](https://tympanus.net/codrops/tag/case-study/page/3)
- Vendredi Society — étude de cas Codrops référencée au même index — [Codrops — Case Study: Vendredi Society](https://tympanus.net/codrops/tag/case-study/page/3)
- `itsnotviolent.com` — étude de cas Codrops indexée — [Codrops — Case Study: itsnotviolent.com](https://tympanus.net/codrops/tag/case-study/page/4)
- Teknosfere (Webflow Made in) : « animation de hero pilotée par scroll avec séquence JPEG rendue sur Canvas HTML, animations texte GSAP, nav plein écran, esthétique sombre et technique » — [Webflow — Teknosfere](https://webflow.com/made-in-webflow/website/teknosfere)
- Portfolio sombre animé — exemple Contra d'un portfolio dark avec hero intégré GSAP — [Contra — Animated Portfolio Website Dark par Om Dwivedi](https://contra.com/p/EUv3NNU6-animated-portfolio-website-dark)
- Awwwards « Mobile hero section — Aludoors » : exemple curé catégorie « mobile hero section » — [Awwwards — Mobile Hero Section Aludoors](https://www.awwwards.com/inspiration/mobile-hero-section-aludoors)
- Awwwards « Initial hero section animation — Nucleus by Nillion » : hero animé avec texte, référencé dans la catégorie animation — [Awwwards — Nucleus by Nillion](https://www.awwwards.com/inspiration/initial-hero-section-animation-nucleus-by-nillion)

### Inferences
- La majorité de ces références reposent sur une « séquence d'images sur canvas » (Teknosfere) plutôt qu'un WebGL plein cadre : plus léger à exécuter au mobile, plus prédictible pour le LCP (le premier frame est une image).
- Un visuel qui « occupe l'écran » + un titre en bas (ou en haut) dans son vide négatif est la mise en page qui revient le plus souvent dans les captures Awwwards de la catégorie Mobile Hero Section.

### Gaps
- Impossible, via WebFetch (403 ou texte sans structure visuelle), de citer le rendu exact de Lusion, Active Theory, Exo Ape, 14islands, Basement, Cuberto. Je recommande une seconde passe en navigation réelle (Chrome DevTools device mode à 360 px) pour sélectionner 2–3 références finales à joindre à la décision.

## Q4 — Techniques spécifiques utilisables

### Takeaway
Six techniques combinables, toutes faisables sur le canvas 2D worker existant, sans Three.js ni nouvelle dépendance.

### Cited Findings
- Canvas plein cadre derrière le texte : `position: fixed` ou `absolute`, pleine fenêtre, `pointer-events: none` laisse passer clics/scroll — [Codeshack — pointer-events](https://codeshack.io/references/css/pointer-events/)
- Scrim radial sombre centré sur la zone de titre (gradient CSS) + `text-shadow` empilé (0 1px 2px #000, 0 0 24px rgba(0,0,0,.8)) pour garantir 4,5:1 sur la frame la plus claire — [Bookmachine — Legibility](https://bookmachine.org/?p=25397)
- `backdrop-filter: blur()` sur un bloc texte translucide : fournit un fond flouté localisé sans ajouter d'image — à conditionner à `prefers-reduced-transparency` et à `@supports` — [CSS-Tricks — Basics of CSS Blend Modes](https://css-tricks.com/basics-css-blend-modes/) (contexte matériaux)
- Masque SVG « knockout » : le H1 troue un rectangle noir pour laisser transparaître la scène à travers les lettres — [Viget — Reverse knockout text](https://viget.com/articles/reverse-knockout-text-mask-effect-with-svg)
- `mix-blend-mode: difference` sur le H1 : inversion automatique selon le pixel sous-jacent — [CSS-Tricks — Blend Modes](https://css-tricks.com/basics-css-blend-modes/)
- GSAP positionne la scène derrière le texte en animant `transform/opacity` du canvas, le `z-index` et `pointer-events: none` sont réglés en CSS une fois pour toutes (compatible contrainte « transform et opacity uniquement » du projet) — [Codeshack — pointer-events](https://codeshack.io/references/css/pointer-events/)

### Inferences
- Combinaison recommandée pour Saturn :
  1. Poster AVIF de Saturne cadrée haut-droit, `fetchpriority="high"`, verrouillé en `aspect-ratio` : c'est le LCP.
  2. Canvas OffscreenCanvas démarré en `requestIdleCallback`, cross-fade `opacity` 0 → 1 sur 400 ms, `pointer-events: none`.
  3. Titre en bas-gauche sur deux-trois lignes, dans le vide négatif ; `text-shadow` + scrim radial local.
  4. L'anneau passe devant la première ligne du titre (élément SVG séparé, `z-index` au-dessus, `pointer-events: none`) pour l'effet « breakout » éditorial.
  5. Les 4 planètes sont posées sur l'anneau, taille cible ≥ 44 × 44 px, cliquables.
  6. Pas de `mix-blend-mode: difference` sur le H1 en v1 : à tester en v2 car coûteux sur certains WebKit et instable sur sous-pixel.

### Gaps
- `backdrop-filter` et `mix-blend-mode` imposent chacun un passage en couche de composition supplémentaire ; mesurer leur coût en i/s sur mobile bridé avant adoption.

## Q5 — Pièges à éviter

### Takeaway
Cinq risques, tous mesurables. Les deux premiers viennent directement de la contrainte accessibilité du projet.

### Cited Findings
- Toute animation ne doit jamais laisser un texte à un état intermédiaire peu contrasté une fois terminée (règle projet) ; contrastes 4,5:1 normal, 3:1 gros — fichier `.claude/rules/accessibility.md` du projet (règle locale).
- Cibles tactiles ≥ 44 × 44 px, le survol n'est jamais le seul moyen (règle projet) — fichier `.claude/rules/accessibility.md` du projet (règle locale).
- `pointer-events: none` sur un overlay empêche qu'un décor vole les taps — [Codeshack — pointer-events](https://codeshack.io/references/css/pointer-events/)
- Scrim obligatoire sous le texte quand le fond est mouvant, sinon la lisibilité tombe à certains frames — [Bookmachine — Legibility](https://bookmachine.org/?p=25397)

### Inferences
- Dépassement horizontal : forcer `overflow-x: hidden` sur `main`, et borner la scène à `100vw` + `100svh` (pas `100vh`, qui provoque un saut avec la barre d'adresse mobile).
- Collision planètes / texte : réserver une « safe area » en pourcentage de hauteur ; mesurer sur la frame la plus défavorable (planètes alignées sur l'anneau de face).
- Dégradés décoratifs qui tuent WCAG : vérifier le contraste sur toutes les frames clés, pas seulement sur l'état initial.
- Perte de FPS si le canvas plein cadre tourne sans throttling : brider à 30 i/s mobile (budget projet) et pauser quand la section quitte le viewport.

### Gaps
- Pas de mesure projet publiée pour le coût d'un canvas plein cadre vs. canvas « quart haut-droit » sur Pixel bridé — à produire via `npm run test:perf`.
