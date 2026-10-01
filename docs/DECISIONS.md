# Décisions

Format court, à la manière des ADR. Rapport complet et sources : `reports/Système de mouvement portfolio.md` (phase 1, 01/10/2026). Décisions plus anciennes : `memory.md` et `HERO-BASELINE.md`.

| # | Décision | Raison | Source |
|---|---|---|---|
| D1 | GSAP + ScrollTrigger est le moteur du hero et des scènes de scroll. | Gratuit (plugins compris, SplitText inclus). Gère timelines, pin, scrub et découpe de texte, ce que le CSS seul ne fait pas. | https://gsap.com/pricing/ |
| D2 | Motion n'est utilisé qu'en sous-ensemble : `inView`, `hover`, `press`. Pas la version hybride d'`animate` (≈ 18 Ko). | Redondant avec GSAP. `hover` et `press` apportent le filtrage tactile et le clavier pour quelques Ko. | https://motion.dev/docs/gsap-vs-motion |
| D3 | Un moteur par élément. Si deux effets doivent coexister, on imbrique un élément enveloppant. | GSAP écrase tout `transform` écrit par un autre moteur. | https://gsap.com/community/forums/topic/23011-motionpath-and-regular-transform-issue/ |
| D4 | Intro d'environ 2,6 s, avec titre et CTA lisibles avant 1,5 s. Seule la scène continue après. | Briques documentées : une ligne en 1 s, 0,05 à 0,1 s de décalage. La recherche précédente visait ~1,2 s pour le contenu. | https://gsap.com/docs/v3/Plugins/SplitText/ |
| D5 | Les entrées utilisent `expo.out` (≈ `--ease-out` d'origine), les textes `quint.out`. | Une courbe ease-out donne une impression de réponse immédiate. | https://easings.net/#easeOutQuint |
| D6 | Ressorts sans rebond (amortissement ≈ 1), réservés au pointeur. | Recommandation Apple ; ils restent interruptibles. | https://asciiwwdc.com/2018/sessions/803 |
| D7 | Intro interruptible : un geste de scroll la termine en accéléré. | Une animation doit pouvoir être réorientée à tout moment. | https://asciiwwdc.com/2018/sessions/803 |
| D8 | Le titre se révèle par masque, jamais en partant de `opacity: 0`. | Une opacité nulle retarde le LCP. | https://www.debugbear.com/blog/opacity-animation-poor-lcp |
| D9 | Un seul mouvement lié au scroll par écran, 2 à 3 couches de profondeur au plus. | La parallaxe déclenche des troubles vestibulaires. | https://web.dev/articles/prefers-reduced-motion |
| D10 | Pas de séquence d'images à la Apple. | La page étudiée pèse 55,8 Mo pour 1 609 requêtes : incompatible avec la 4G. | https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/ |
| D11 | ScrollTrigger avec `ignoreMobileResize` et `batch()`, sans `pinReparent`. | Évite des recalculs coûteux sur mobile. | https://gsap.com/docs/v3/Plugins/ScrollTrigger/ |
| D12 | Lenis tourne sur `gsap.ticker` avec `lagSmoothing(0)`, à la souris seulement. | C'est le pont officiel ; au doigt, Lenis doublait les mises à jour sans rien lisser (mesuré). | https://github.com/darkroomengineering/lenis |
| D13 | `gsap.matchMedia()` gère le mouvement réduit, avec un fondu ≤ 0,3 s en repli. | Lenis ne couvre pas les tweens. Une simple variation d'opacité ne compte pas comme du mouvement. | https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html |
| D14 | **Pas de Three.js.** Le hero reste en canvas 2D dans un worker. | Three.js pèse ≈ 150 Ko gzip et se réduit mal à l'import. Le rendu 2D en worker est déjà mesuré à 60 i/s (`memory.md`). La consigne demandait Three.js pour le hero ; c'est un écart assumé. | https://github.com/mattdesl/threejs-tree-shake |
| D15 | Les effets de 21st.dev sont portés en CSS et JS vanilla, avec un seul module pointeur. | Un écouteur par carte multiplie le coût. Ni React ni Tailwind dans le projet. | https://21st.dev/blog/react-spotlight-effect-components |
| D16 | Pas de curseur personnalisé. | `cursor: none` supprime les aides du système et impose une boucle d'animation permanente. | https://21st.dev/blog/custom-cursor-react |
| D17 | Pas de compteurs animés. | Le site n'affiche aucun chiffre : en ajouter changerait le texte, qui est figé. | `index.html` |
| D18 | `CLAUDE.md` court, avec des `.claude/rules` ciblées par `paths`. | Les règles sont mieux suivies et ne se chargent qu'à la lecture des fichiers concernés. | https://code.claude.com/docs/en/memory |
| D19 | Hooks en Node, code de sortie 2 pour bloquer. Pas de formateur complet. | Robuste sous Windows. Un formateur réécrirait le style compact d'origine. | https://code.claude.com/docs/en/hooks |
| D20 | Pre-commit via `.githooks` et `core.hooksPath`. | Zéro dépendance, versionné, bloque si le lint, les tests ou le budget échouent. | https://git-scm.com/docs/githooks |
| D21 | Playwright avec l'Edge installé (`channel: 'msedge'`), plus axe-core. ESLint en dépendance de dev. | Aucun navigateur à télécharger. Dépendances de dev seulement : aucun poids ajouté au site. | — |
