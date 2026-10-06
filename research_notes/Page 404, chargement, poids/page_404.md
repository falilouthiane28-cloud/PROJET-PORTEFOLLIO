# Page 404 — bonnes pratiques pour un portfolio premium (2026)

Notes de recherche pour Saturn Design Studio. Portfolio vitrine français, GitHub Pages, thème sombre cosmique, Saturne et anneau, 4 planètes. Objectif : page `/404.html` sobre, cohérente, légère, accessible.

## 1. Ton et copie (apologétique, ludique, métaphore cosmique)

### Takeaway
Le ton gagnant pour un studio créatif est **bref, humain, légèrement complice** — jamais apologétique au point de culpabiliser le visiteur, jamais trop blagueur au point de masquer l'information. La métaphore cosmique (« page perdue dans l'espace », « orbite inconnue ») est bien acceptée pour un studio dont c'est déjà le langage visuel, à condition de garder une phrase factuelle avant la métaphore.

### Cited Findings
- Un bon message d'erreur doit être « en langage simple, précis sur ce qui s'est mal passé, et constructif sur la suite à donner », selon la ligne historique de Nielsen Norman Group — [Uxcel résumant NN/g](https://uxcel.com/blog/11-best-practices-for-designing-404-pages-656).
- Garder « 8 mots maximum par phrase, éviter le jargon technique, bannir le ton condescendant et les MAJUSCULES » — [Graphiste.com, 28 exemples de pages 404](https://graphiste.com/blog/page-erreur-404-creative).
- La page doit « maintenir le même code visuel que les autres pages, inclure votre logo, votre typographie, refléter votre branding et l'attitude du site » — [Graphiste.com](https://graphiste.com/blog/page-erreur-404-creative).
- Le modèle officiel Canada.ca impose en français un H1 « **Page non trouvée** », suivi d'une explication que la page a pu être déplacée ou supprimée, puis de suggestions concrètes (vérifier l'orthographe de l'URL) — [Canada.ca, page 404](https://conception.canada.ca/modeles-recommandes/page-erreur-404.html).
- Exemple de métaphore spatiale française validée : Kapwing utilise « **Cette page s'est perdue dans l'espace** » suivi d'un court récit lunaire — [Kapwing, illustrations 404](https://www.kapwing.com/fr/404-illustrations).
- GitHub lui-même utilise une référence Star Wars : « **Ce n'est pas la page que vous recherchez** » — repris comme bon exemple par [Tom's Guide](https://www.tomsguide.fr/les-erreurs-404-les-plus-insolites-du-web/).
- NPR liste des choses « toujours recherchées » (l'Atlantide, Amelia Earhart) — approche cultivée plutôt que blagueuse — [Tom's Guide](https://www.tomsguide.fr/les-erreurs-404-les-plus-insolites-du-web/).
- Humour à éviter : Blizzard « insinue avec humour que l'internaute est responsable de la page cassée » — exemple cité mais typiquement classé comme ton à ne pas copier — [Tom's Guide](https://www.tomsguide.fr/les-erreurs-404-les-plus-insolites-du-web/).

### Inferences
- Pour Saturn, un patron sûr : **H1 factuel** (« Page non trouvée » ou « 404 — page introuvable ») + **sous-titre cosmique court** (par ex. « Cette orbite n'existe pas » / « Signal perdu entre les anneaux ») + **phrase d'action** (« Revenir à l'accueil »). Deux niveaux, pas trois.
- Éviter la blague qui blâme (« tu as mal tapé »), préférer la métaphore qui déplace le problème dans l'univers de la marque.

### Gaps
- Pas de source quantitative FR mesurant l'impact du ton (humour vs sobre) sur le taux de retour depuis une 404.

## 2. Éléments essentiels / ce qu'il NE faut pas mettre

### Takeaway
Cinq éléments font le minimum : **statut HTTP correct, message en langage clair, navigation du site, lien d'accueil, liens contextuels** vers les sections populaires. À retirer : redirection automatique vers l'accueil, formulaires longs, encarts marketing, et une recherche si on ne peut pas garantir qu'elle fonctionne.

### Cited Findings
- Les 5 éléments de toute bonne 404 : « code statut correct, message en langage clair, navigation persistante, barre de recherche fonctionnelle, et personnalité de marque optionnelle » — [Uxcel/NN/g](https://uxcel.com/blog/11-best-practices-for-designing-404-pages-656).
- UXPin liste comme essentiels : message d'erreur clair, navigation (header+footer), recherche, liens populaires, cohérence de marque, et **code HTTP 404 (pas 200)** — [UXPin](https://uxpin.com/studio/blog/404-page-best-practices).
- À éviter selon UXPin : « rediriger tous les 404 vers l'accueil », mises en page lourdes qui ralentissent le chargement, voix de marque incohérente, et surtout les **soft 404** (page retournée en 200 avec un contenu d'erreur) — [UXPin](https://uxpin.com/studio/blog/404-page-best-practices).
- Fournir « des options réelles : barre de recherche et liens pertinents — mais vérifier qu'ils ne mènent pas eux-mêmes à des 404 » — [Graphiste.com](https://graphiste.com/blog/page-erreur-404-creative).
- Canada.ca recommande « jusqu'à 10 liens, en commençant par les 3 pages principales » plus une barre de recherche optionnelle — [Canada.ca](https://conception.canada.ca/modeles-recommandes/page-erreur-404.html).

### Inferences
- Pour un portfolio one-page sans vraie recherche, **ne pas mettre de champ de recherche** : il serait factice. Mieux vaut lister 3-4 ancres directes vers les sections (`#projets`, `#agents`, `#services`, `#contact`) + WhatsApp.
- Ne pas inclure la scène canvas du hero : trop lourde, dépend du worker et de GSAP.

### Gaps
- Pas de donnée chiffrée sur l'intérêt d'une recherche sur un one-page.

## 3. Éléments interactifs/animés sobres (pas gadget)

### Takeaway
Les meilleures 404 primées restent **minimalistes** : une illustration unique, une légère animation en boucle, parfois les chiffres « 404 » typographiés en grand. Pour Saturn, cohérent : une Saturne isolée dérivant lentement, ou un anneau brisé, en SVG animé CSS. **Jamais** réutiliser le canvas du hero ni ScrollTrigger ici.

### Cited Findings
- Awwwards présente comme critère que « créativité et fonctionnalité transforment un simple message d'erreur en interaction mémorable » — illustrations ludiques, animations, navigation pratique — [Awwwards, 404 pages](https://www.awwwards.com/websites/404-pages/).
- Exemples cosmiques listés : Iconfinder (un astronaute qui plonge lentement dans un espace mystérieux), Viktor Kern (illusion de profondeur qui donne la sensation de flotter dans l'espace) — [recherche Awwwards synthèse](https://justinmind.com/blog/best-404-pages).
- Pensatori-Irrazionali.com (SOTD 19 sept. 2026) et Boc.Studio (SOTD 20 sept. 2026) sont des pages primées de la catégorie 404 — [Awwwards 404 pages](https://www.awwwards.com/websites/404-pages/). (Note : impossible de récupérer leur rendu via WebFetch, qui ne suit pas les réponses HTTP 404.)
- htmlBurger note des approches « animations minimales » (Kim Kneipp), « statique suggérant une connexion perdue » (Myriad), « vinyl qui tourne » (Spotify) — [htmlBurger](https://htmlburger.com/blog/404-page-examples/).
- Nielsen rappelle qu'« une information non pertinente nuit à la visibilité et peut désorienter » — argument contre les animations gratuites — [Uxcel/NN/g](https://uxcel.com/blog/11-best-practices-for-designing-404-pages-656).

### Inferences
- Patron recommandé pour Saturn : **une Saturne SVG seule**, anneau peut-être décalé ou brisé, légère rotation ou dérive en `@keyframes` CSS pure (transform/opacity), coupée en `prefers-reduced-motion`. Pas de GSAP ici.
- Les chiffres « 404 » animés (parallaxe doux, décalage de teinte lilas) restent dans l'esprit sans peser.

### Gaps
- Les URL directes des 404 primées renvoient HTTP 404 (par conception), donc impossible de décrire pixel-par-pixel sans ouvrir un navigateur. Il faudrait les vérifier manuellement.

## 4. SEO (statut HTTP, meta robots, structured data)

### Takeaway
GitHub Pages sert bien `/404.html` avec un **vrai statut HTTP 404** — pas besoin de bidouille `meta robots`. On ajoute simplement `<meta name="robots" content="noindex">` par sécurité et on **n'ajoute pas de JSON-LD** inutile sur une page sans contenu indexable.

### Cited Findings
- « Un 404 doit retourner un vrai code HTTP 404 » pour que Googlebot n'indexe pas la page comme valide — [Draft.dev, GitHub Pages 404](https://draft.dev/learn/github-pages-404).
- « GitHub Pages sert ce fichier pour toutes les URL inexistantes avec les codes de statut 404 corrects » — [Draft.dev](https://draft.dev/learn/github-pages-404).
- Les erreurs 404 normales « ne pénalisent pas directement le classement, mais coûtent en expérience utilisateur, en link equity, et en budget de crawl » — [Uxcel résumant Google](https://uxcel.com/blog/11-best-practices-for-designing-404-pages-656).
- Les soft 404 (statut 200 avec contenu d'erreur) « confusent les moteurs » — à éviter absolument — [UXPin](https://uxpin.com/studio/blog/404-page-best-practices).

### Inferences
- Sur un site de projet GitHub Pages (`/PROJET-PORTEFOLLIO/`), aucun contournement nécessaire : poser `404.html` à la racine du build (`dist/`) suffit, GitHub le sert pour toute URL inconnue sous le préfixe du dépôt avec statut 404.
- Pas besoin de JSON-LD. Ajouter `<meta name="robots" content="noindex,follow">` et un `<title>` explicite « 404 — Page non trouvée · Saturn Design Studio ».

### Gaps
- La doc GitHub Pages officielle n'énonce pas explicitement le statut HTTP retourné pour les projets en sous-répertoire ; confirmé indirectement par Draft.dev et par observation communautaire.

## 5. Accessibilité (WCAG 2.2)

### Takeaway
Hiérarchie claire (`<h1>` unique « Page non trouvée »), lien d'évitement vers le contenu principal, liens au but explicite (critère 2.4.4), focus visible, et respect de `prefers-reduced-motion`. Les éléments cosmiques décoratifs doivent être `aria-hidden="true"`.

### Cited Findings
- Commencer par « un titre direct et en langage clair qui nomme la situation : "Page non trouvée" ou "Nous ne trouvons pas cette page", suivi d'une ou deux phrases d'explication » — [résumé recherche a11y](https://216digital.com/).
- Un seul `<h1>` par page, hiérarchie logique sans sauter de niveau — [BrowserStack, règle headings](https://www.browserstack.com/docs/accessibility/rules/a11y-engine/6.0/missing-heading-ai).
- Pour les messages de statut dynamiques, utiliser une **ARIA live region** et préférer `aria-live="polite"` à `assertive` — [résumé WCAG](https://216digital.com/).
- Garder « le même cadre que le reste du site — header, footer, typographie — pour que les utilisateurs d'AT ou de zoom reconnaissent qu'ils n'ont pas été parachutés ailleurs » — [résumé a11y](https://216digital.com/).
- Les projets Saturn imposent déjà : focus visible préservé, cible ≥ 44×44 px, mouvement réduit avec apparitions ≤ 0,3 s — [CLAUDE.md local, `.claude/rules/accessibility.md`].

### Inferences
- La 404 doit **réutiliser la nav et le footer** existants pour la cohérence et la navigation clavier.
- Les visuels (Saturne, anneau, étoiles) : `role="img"` + `aria-label` global uniquement si décoratif important ; sinon `aria-hidden="true"`.
- Pas besoin d'`aria-live` ici (contenu statique).

### Gaps
- Aucun critère WCAG spécifique aux pages 404 ; ce sont les critères 2.4.4 (lien), 2.4.6 (titres), 1.3.1 (structure), 2.4.1 (contournement) qui s'appliquent, pas de guideline dédiée.

## 6. Technique GitHub Pages (sous-répertoire, chemins relatifs)

### Takeaway
Pour un project site servi sous `/PROJET-PORTEFOLLIO/`, placer `404.html` **au niveau de la racine du build** (`dist/`). Les chemins vers les assets doivent être **absolus préfixés par la base** (`/PROJET-PORTEFOLLIO/...`) ou purement relatifs à partir de la racine, car la 404 peut être servie depuis n'importe quelle profondeur d'URL (`/PROJET-PORTEFOLLIO/a/b/inconnu`).

### Cited Findings
- « Tout `404.html` à la racine du répertoire `_site` sera servi automatiquement par GitHub Pages » — [Jekyll, custom 404](https://jekyllrb.com/tutorials/custom-404-page/).
- Pour les projets avec sous-répertoires de contenu, le fichier doit avoir `permalink: /404.html` pour atterrir à la racine du build — [Jekyll](https://jekyllrb.com/tutorials/custom-404-page/).
- GitHub : « Placer `404.html` ou `404.md` dans la source de publication » suffit, GitHub Pages le sert pour toutes les URL inexistantes — [GitHub docs](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site).
- Le comportement est « identique sur `github.io` ou domaine personnalisé » — [Draft.dev](https://draft.dev/learn/github-pages-404).

### Inferences
- Dans la config Vite du projet, si `base: '/PROJET-PORTEFOLLIO/'`, la 404 doit référencer `./assets/...` **absolument** en `/PROJET-PORTEFOLLIO/assets/...` sinon les CSS/images ne chargeront pas quand la 404 est servie depuis `/PROJET-PORTEFOLLIO/n-importe-quoi/profond/`.
- Solution robuste : **inliner** tout le CSS et le SVG dans `404.html` → aucune dépendance de chemin, aucun 404 secondaire sur un asset.
- Vérifier que le build Vite copie bien `public/404.html` ou `src/404.html` vers `dist/404.html`.

### Gaps
- Rien ne confirme explicitement, dans la doc GitHub, le code HTTP exact pour les 404 dans un sous-chemin de project site ; Draft.dev et l'observation communautaire indiquent 404.

## 7. Exemples live de pages 404 (studios/portfolios premium)

### Takeaway
Les 404 primées 2026 sur Awwwards sont **minimalistes**, souvent monochromes, avec une typographie démesurée et une petite animation d'ambiance. Trois exemples vérifiables sur Awwwards comme galerie référence ; les URL directes retournent 404 (c'est le but), donc inspection pixel-par-pixel à faire manuellement au navigateur.

### Cited Findings
Références vérifiables (listées par Awwwards avec dates de prix) :
- **Pensatori Irrazionali** — pensatori-irrazionali.com — Developer Award + Site of the Day 20 sept. 2026, catégorie 404 — [Awwwards](https://www.awwwards.com/websites/404-pages/).
- **Boc.Studio** — boc.studio — Developer Award + Site of the Day 19 sept. 2026 — [Awwwards](https://www.awwwards.com/websites/404-pages/).
- **Michael Gatt** — michaelgatt.com — Developer Award + Site of the Day 18 août 2026 — [Awwwards](https://www.awwwards.com/websites/404-pages/).
- **Juan Mora Romero** — juanmoraromero.com — portfolio avec 404 soignée — [Awwwards](https://www.awwwards.com/websites/404-pages/).
- **h2a.lu** — h2a.lu — studio luxembourgeois — [Awwwards](https://www.awwwards.com/websites/404-pages/).
- **LEDUP** — ledup.pt — [Awwwards](https://www.awwwards.com/websites/404-pages/).
- **Columbus Travel** — columbus-travel.com — [Awwwards](https://www.awwwards.com/websites/404-pages/).

Exemples cosmiques historiques souvent cités :
- **Iconfinder** : astronaute qui dérive dans l'espace — [Justinmind](https://justinmind.com/blog/best-404-pages).
- **Viktor Kern** : illustration qui crée une illusion de profondeur, sensation de flotter — [Justinmind](https://justinmind.com/blog/best-404-pages).
- **GitHub** : citation Star Wars « Ce n'est pas la page que vous recherchez » — [Tom's Guide](https://www.tomsguide.fr/les-erreurs-404-les-plus-insolites-du-web/).

### Inferences
- Vérification live impossible via WebFetch pour les 404 (réponse 404 = contenu non retourné par l'outil). Pour valider, ouvrir ces URL au navigateur et observer : taille du bundle, utilisation de WebGL, respect de `prefers-reduced-motion`.
- Modèle à imiter pour Saturn : **typographie monumentale « 404 »** + sous-titre + 1 illustration SVG unique + lien retour, comme Michael Gatt / Juan Mora Romero.

### Gaps
- Pas d'inspection directe du HTML/CSS/JS des 7 pages Awwwards ; nécessite un passage navigateur avant d'arrêter le design final.

## 8. Budget poids / performance de la page

### Takeaway
Une 404 autonome peut tenir en **1 à 5 Ko** (HTML+CSS inlinés) voire **10-15 Ko** avec un SVG animé. Elle ne doit **pas** charger le bundle principal du site ni le worker canvas. Budget raisonnable viser : **< 20 Ko total** (hors police woff2 réutilisée).

### Cited Findings
- Des 404 standalone HTML+CSS existent à **1,23 Ko** (modèle « 404 Page Fun ») — [recherche lightweight 404](https://amirnazar77.gumroad.com/l/Page404).
- Une page Material Design 404 « sans JavaScript et sans images » charge instantanément — [recherche synthèse](https://saif71.gumroad.com/l/dCWUX).
- Pressable sert une **page statique** pour les 404 au lieu d'un rendu PHP « pour que ça charge beaucoup plus vite et consomme très peu de CPU » — [Pressable](https://pressable.com/knowledgebase/light-weight-404s-for-static-files/).
- Une page moyenne peut être ramenée à **3 Ko** avec minification CSS/HTML et une seule requête HTTP — [recherche synthèse](https://benoit.srht.site/2020-12-23-lean-ux-fat-code/).
- Budgets Saturn : JS initial gzip ≤ 150 Ko, au-dessus de la ligne de flottaison ≤ 300 Ko — [`.claude/rules/performance-budget.md`].

### Inferences
- Objectif réaliste pour Saturn `404.html` : **≤ 15 Ko gzip** incluant HTML + CSS inliné + SVG Saturne. Pas de JS. Pas d'import de `main.js`.
- Réutiliser la police woff2 déjà préchargée par le site principal (même origine, même cache). Si la 404 est servie en premier (lien externe cassé), prévoir un fallback `font-display: swap` avec la pile système.
- Pas de bannière cookie, pas de tracking, pas d'`analytics` : la 404 doit rester zéro-dépendance.

### Gaps
- Pas de benchmark public sur des 404 de portfolios primés mesurés (taille, LCP) ; à mesurer soi-même avec Lighthouse une fois construite.
