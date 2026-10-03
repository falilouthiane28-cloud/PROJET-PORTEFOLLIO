# Sous-titres désactivés par défaut et liens vers les sites clients

Notes de recherche (octobre 2026). Toutes les affirmations sont sourcées ; les déductions sont rangées sous « Inferences ». Les pages MDN n'ont pas pu être récupérées (domaine bloqué par l'outil) : les points MDN viennent d'extraits de recherche ou de sources équivalentes (WHATWG, caniuse).

---

## A1. WCAG 2.2 : un film sans parole (musique + bruitages) doit-il avoir des sous-titres, et doivent-ils être actifs par défaut ?

### Takeaway
Les sous-titres (captions) couvrent aussi les sons non verbaux, mais seulement ceux « nécessaires pour comprendre le contenu » ; la WAI dit explicitement qu'une vidéo dont le seul son est une musique de fond n'a pas besoin de sous-titres. Aucun texte W3C n'exige que les sous-titres soient affichés par défaut : des sous-titres fermés (que l'utilisateur active) sont une technique suffisante.

### Cited Findings
- Définition WCAG des captions : alternative synchronisée « for both speech and non-speech audio information needed to understand the media content » ; elle inclut effets sonores, musique, rires, identification des locuteurs. — [Understanding SC 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html)
- L'Understanding 1.2.2 distingue sous-titres ouverts (« cannot be turned off ») et sous-titres fermés (« can be turned on and off with some players ») ; les deux figurent parmi les techniques suffisantes, sans préférence obligatoire. — [Understanding SC 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html)
- Techniques suffisantes listées pour 1.2.2 : G93 (sous-titres ouverts), G87 (sous-titres fermés), H95 (élément HTML `track`). — [Understanding SC 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html)
- G87 : les sous-titres fermés permettent au texte de « not to be visible unless the user requests it » ; la procédure de test commence par « Turn on the closed caption feature of the media player ». La technique ne dit rien d'un état activé par défaut. — [G87](https://www.w3.org/WAI/WCAG22/Techniques/general/G87)
- H95 : utilise `track` pour une piste de sous-titres qui fournit « a text version of dialogue and other sounds important to understanding the video » ; pas d'exigence sur l'attribut `default`. — [H95](https://www.w3.org/WAI/WCAG22/Techniques/html/H95)
- Guide WAI « Captions/Subtitles » : à la question « la vidéo a-t-elle une information audio nécessaire pour comprendre ? », si non (« for example, it is just background music ») : « Captions are not needed because there is no important audio content. » — [WAI, Captions/Subtitles](https://www.w3.org/WAI/media/av/captions/)
- La WAI recommande alors d'informer l'utilisateur, par exemple « Captions not needed: The only sound in this video is background music. », ou de fournir une piste minimale du type « [background music] ». — [WAI, Planning Audio and Video Media](https://www.w3.org/WAI/media/av/planning/)
- L'exemple « orchestre » de l'Understanding 1.2.2 montre des sous-titres identifiant les morceaux et décrivant la musique (« Calm melody with a slow tempo ») : la musique est sous-titrée quand elle *est* le contenu. — [Understanding SC 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html)
- SC 1.2.1 (audio seul / vidéo seule) : non vérifié dans cette session (voir Gaps).

### Inferences
- *Déduction :* le film Saturn ne contient aucune parole ; si la musique et les bruitages ne portent aucune information indispensable (ambiance, rythme du montage), 1.2.2 n'impose pas de sous-titres, d'après la règle WAI « just background music ». Point d'attention : les bruitages synchronisés sur des mots affichés à l'écran (« [Gros impact sur « jamais. »] ») soulignent un texte *déjà visible* ; ils ne transmettent pas d'information nouvelle, donc l'argument tient.
- *Déduction :* même si l'on jugeait les bruitages porteurs de sens, des sous-titres fermés disponibles mais désactivés suffisent (G87, H95). Rien n'oblige à les afficher par défaut.
- 1.2.1 ne s'applique pas : le film est un média synchronisé (audio + vidéo), pas un média audio seul ou vidéo seule (*déduction tirée du nom du critère, non vérifiée en ligne dans cette session*).

### Gaps
- Page Understanding 1.2.1 non consultée.
- Aucune source W3C ne tranche le cas limite « musique qui crée une ambiance ». La page WAI ne traite que la musique de fond, sans nuance.

---

## A2. Garder la piste sans `default` : modes de `TextTrack` et menu CC des navigateurs

### Takeaway
Sans `default`, une piste `<track kind="captions">` démarre en mode `disabled` ; le navigateur doit quand même proposer une commande pour activer les sous-titres. En pratique, le bouton CC des contrôles natifs apparaît dès qu'une piste captions/subtitles est présente. Le comportement exact selon le mode (`hidden` notamment) et selon les navigateurs n'a pas pu être vérifié dans une source primaire.

### Cited Findings
- `default` indique que la piste « is to be enabled if the user's preferences do not indicate that another track would be more appropriate » ; au plus une piste `default` par catégorie (captions/subtitles, descriptions, chapters). — [WHATWG HTML, media](https://html.spec.whatwg.org/multipage/media.html)
- Les pistes texte démarrent en mode `disabled`. — [WHATWG HTML, media](https://html.spec.whatwg.org/multipage/media.html)
- La spécification demande aux navigateurs de fournir « controls to enable or disable the display of closed captions, audio description tracks, and other additional data associated with the video stream ». — [WHATWG HTML, media](https://html.spec.whatwg.org/multipage/media.html)
- Modes de `TextTrack` : `disabled` (piste visible dans le DOM mais ignorée : aucun cue actif, aucun événement, cues non chargés) ; `hidden` (piste active, cues non affichés) ; `showing` (affichés). — [MDN, TextTrack.mode, via extrait de recherche](https://developer.mozilla.org/docs/Web/API/TextTrack/mode)
- MDN : un navigateur qui gère les sous-titres HTML ajoute un bouton dans ses contrôles natifs pour y accéder. Avec des contrôles personnalisés, ce bouton n'existe pas et il faut le recréer. — [MDN, Adding captions and subtitles, via extrait de recherche](https://developer.mozilla.org/docs/Web/Guide/Audio_and_video_delivery/Adding_captions_and_subtitles_to_HTML5_video)
- Safari a longtemps affiché les sous-titres automatiquement quand le réglage système « Sous-titres codés et SDH » était coché. Ce comportement serait moins fiable dans les versions récentes ; des utilisateurs signalent aussi des sous-titres « toujours activés » dans Safari. Ce sont des sources communautaires, pas des sources primaires. — [Forum Channels](https://community.getchannels.com/t/closed-captions-default-to-on-in-web-player/31086) ; [Apple Discussions](https://discussions.apple.com/thread/255471908)
- Rendu des sous-titres : WebKit les dessine dans le shadow DOM de la vidéo (pseudo-élément `::-webkit-media-text-track-display`) ; Firefox n'expose aucun pseudo-élément ; Chrome et Safari ont des bugs de positionnement. — [Mux, 2022](https://www.mux.com/blog/if-you-can-read-this-your-browser-captions-are-broken)

### Inferences
- *Déduction :* il suffit de retirer `default` (`<track kind="captions" srclang="fr" label="Français (sons)" src="…">`). La piste reste en `disabled`, le bouton CC reste dans les contrôles natifs, et l'utilisateur peut l'activer. Inutile de forcer `mode = 'hidden'` en JS.
- *Déduction :* un utilisateur iOS/macOS qui a activé « Sous-titres codés et SDH » peut voir la piste s'activer quand même. C'est voulu : la préférence de l'utilisateur prime, et c'est conforme à la sémantique WHATWG des préférences utilisateur.
- *Déduction :* pour ne *jamais* afficher de piste, il faudrait supprimer le `<track>`. Cela retire aussi le bouton CC. Défendable au vu de A1, mais moins prudent.

### Gaps
- Je n'ai trouvé aucune documentation primaire récente (2022–2026) qui dise si Chrome, Firefox et Safari (iOS, macOS) affichent le bouton CC selon le mode de la piste (`disabled` ou `hidden`). À vérifier à la main dans les trois navigateurs : charger la page, ouvrir le menu CC, lire `video.textTracks[0].mode`.
- Le bug WebKit 240601 (préférence CC système) n'a pas pu être consulté (404).

---

## A3. Une description textuelle ou une transcription à côté de la vidéo suffit-elle pour 1.2.3 / 1.2.5 ?

### Takeaway
Pour 1.2.3 (niveau A), une alternative textuelle complète au média suffit. Pour 1.2.5 (niveau AA), il faut une audiodescription, *sauf si* toute l'information visuelle importante passe déjà par la piste audio. Or ici l'image porte l'information (textes à l'écran) et le son n'en porte aucune : l'exemption ne s'applique pas.

### Cited Findings
- 1.2.3 : « An alternative for time-based media or audio description of the prerecorded video content is provided for synchronized media. » — [Understanding SC 1.2.3](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html)
- L'alternative au média est un document texte complet, à la manière d'un scénario, qui décrit actions, contexte visuel, dialogues et sons non verbaux. — [Understanding SC 1.2.3](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html)
- « if all of the important information in the video track is already conveyed in the audio track, no additional audio description is necessary. » — [Understanding SC 1.2.3](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html)
- Au niveau AA, 1.2.5 exige une audiodescription, quel que soit le choix fait au niveau A. — [Understanding SC 1.2.3](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html)
- Exemption : un média qui est « a media alternative for text and is clearly labeled as such ». — [Understanding SC 1.2.3](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html)

### Inferences
- *Déduction :* la transcription ou description textuelle couvre 1.2.3 (A) et sert les utilisateurs sourds et aveugles. Elle ne couvre pas, à elle seule, 1.2.5 (AA).
- *Déduction :* il y a deux voies réalistes pour viser l'AA :
  1. le film reprend des contenus déjà présents en texte sur la page (section Agents), et on l'indique explicitement (« Le film reprend la présentation ci-dessus ») pour bénéficier de l'exemption « media alternative for text » ;
  2. on fournit une piste `kind="descriptions"` ou une version audiodécrite.
- *Déduction :* la piste « captions » actuelle, qui décrit des bruitages, ne sert à rien pour 1.2.3 ou 1.2.5. Ce qui compte pour ces critères, c'est de décrire l'*image*.

### Gaps
- La page Understanding 1.2.5 n'a pas été consultée directement : la règle AA vient de la page 1.2.3.

---

## A4. Recommandation pour le film Saturn (40 s, sans parole)

### Takeaway
On peut retirer `default` sans enfreindre WCAG 2.2. Le plus solide : garder la piste fermée (bouton CC disponible), ajouter une mention courte « Pas de dialogue : musique et bruitages » et une description textuelle du film à côté. On satisfait ainsi la demande du client et 1.2.2 / 1.2.3, et on s'approche de 1.2.5 par l'exemption « alternative à un texte » si le film reprend des contenus déjà présents sur la page.

### Cited Findings
- Sous-titres non nécessaires pour une musique seule ; informer l'utilisateur est recommandé. — [WAI Captions](https://www.w3.org/WAI/media/av/captions/) ; [WAI Planning](https://www.w3.org/WAI/media/av/planning/)
- Les sous-titres fermés activables par l'utilisateur sont suffisants (G87, H95). — [G87](https://www.w3.org/WAI/WCAG22/Techniques/general/G87) ; [H95](https://www.w3.org/WAI/WCAG22/Techniques/html/H95)

### Inferences
- *Recommandation (déduction) :*
  1. Retirer `default` de `<track>` sans rien changer d'autre : aucun JS, pas de forçage de mode.
  2. Dans la `<dialog>`, ajouter une ligne : « Film sans dialogue : musique et bruitages. Sous-titres sonores disponibles (bouton CC). »
  3. Ajouter une description textuelle du film (dans un `<details>` ou sous la vidéo) qui reprend les textes affichés à l'écran (couvre 1.2.3).
  4. Vérifier à la main le bouton CC dans Chrome, Firefox, Safari macOS et iOS.
- Option minimale acceptable selon la WAI : supprimer la piste et afficher « Sous-titres non nécessaires : la bande-son est uniquement musicale ». Moins prudent, parce que les bruitages accentuent des mots.

### Gaps
- Pas de test réel du menu CC dans les navigateurs pendant cette session.

---

## B1. Bonnes pratiques pour les liens externes dans une carte de projet

### Takeaway
Ouvrir dans le même onglet par défaut (GOV.UK). Si l'on garde `target="_blank"`, l'indiquer en texte, visible ou au moins vocalisé : G201, technique conseillée et non obligatoire. `noopener` est désormais implicite dans tous les navigateurs modernes ; `noreferrer` est un choix (il masque le référent au site client).

### Cited Findings
- GOV.UK : « Avoid opening links in a new tab or window » sauf nécessité (par exemple pour ne pas perdre un formulaire en cours). Si c'est nécessaire, mettre « opens in new tab » dans le texte du lien, éventuellement en texte masqué visuellement, et ajouter `rel="noreferrer noopener"` « to reduce the risk of reverse tabnabbing ». — [GOV.UK Design System, Links](https://design-system.service.gov.uk/styles/links/)
- GOV.UK : pour un lien externe, nommer l'organisation dans le texte du lien ; « There's no need to say explicitly that you're linking to an external site » ni d'icône de lien externe. — [GOV.UK Design System, Links](https://design-system.service.gov.uk/styles/links/)
- G201 : prévenir avant l'ouverture d'une nouvelle fenêtre, en texte (« (opens in new window) ») ou avec une icône SVG + `aria-describedby`. Le test exige *à la fois* une annonce par les technologies d'assistance *et* une indication visuelle. Statut : technique conseillée, rattachée au SC 3.2.5 Change on Request (AAA). — [G201](https://www.w3.org/WAI/WCAG22/Techniques/general/G201)
- `target="_blank"` implique `rel="noopener"` depuis Chrome et Edge 88, Firefox 79 et Safari 12.1. — [caniuse, a implicit noopener](https://caniuse.com/mdn-html_elements_a_implicit_noopener)

### Inferences
- *Déduction :* garder `rel="noopener"` explicitement ne coûte rien (navigateurs anciens). `noreferrer` empêche le client de voir dans ses statistiques que du trafic vient du portfolio, ce qui peut desservir une relation commerciale. Recommandation : `rel="noopener"` seul, sauf raison de confidentialité.
- *Déduction :* intitulé conseillé, plutôt qu'un « Voir le site » ou « cliquez ici » répété sur chaque carte : « Voir le site de [Client] » + `<span class="sr">(nouvel onglet)</span>`, avec une petite icône `aria-hidden` qui suffit visuellement. Le design est figé : une icône existante, ou du texte seul.
- *Déduction :* liens en double (capture + bouton) : un seul lien par destination dans l'ordre du focus. Si la capture est cliquable, la sortir du parcours (`tabindex="-1"` + `aria-hidden="true"`) ou rendre toute la carte cliquable avec un seul `<a>` (motif « carte à pseudo-élément étendu »). Sinon, le lecteur d'écran et la touche Tab rencontrent deux fois le même lien.
- Un texte de lien explicite relève du SC 2.4.4 Link Purpose (*connaissance générale, non revérifiée en ligne dans cette session*).

### Gaps
- Pages WebAIM (liens, nouvelles fenêtres) et Understanding 2.4.4 non consultées, faute de budget.
- Je n'ai trouvé aucune source primaire sur le motif « capture cliquable + bouton » dans un portfolio. La recommandation ci-dessus est une déduction.

---

## B2. URL de préproduction et d'aperçu (Vercel protégé, hôtes sslip.io) : risques et recommandation

### Takeaway
Les URL d'aperçu Vercel sont, par défaut (« Standard Protection »), protégées derrière une authentification Vercel et marquées `noindex`. Un visiteur du portfolio tombe alors sur une page de connexion. Il faut lier les domaines de production. `nofollow` / `ugc` ne sont pas faits pour ce cas : un lien vers un vrai client est un lien éditorial normal.

### Cited Findings
- Vercel « Standard Protection », recommandée et disponible sur toutes les offres, « protects all domains except production domains ». Elle protège aussi l'URL générée de production (`*.vercel.app`). — [Vercel Docs, Deployment Protection (maj 15/09/2026)](https://vercel.com/docs/deployment-protection)
- Méthode « Vercel Authentication » : réserve l'accès aux utilisateurs Vercel qui ont les droits. Des liens partageables et un contournement pour l'automatisation existent. — [Vercel Docs, Deployment Protection](https://vercel.com/docs/deployment-protection)
- Vercel ajoute automatiquement `X-Robots-Tag: noindex` à chaque Preview Deployment et à l'ancienne production après une promotion. Pas de `noindex` si un domaine personnalisé est attribué à une branche d'aperçu. — [Vercel KB, Preview indexing](https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines)
- Google : `sponsored` pour les liens payants, `ugc` pour le contenu des utilisateurs, `nofollow` quand on ne veut pas associer son site à la page liée. Les liens qualifiés « will generally not be followed ». Un lien qu'on cautionne n'a besoin d'aucun `rel`. — [Google Search Central, Qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links)

### Inferences
- *Déduction :* un lien d'aperçu protégé montre au prospect un écran « Log in to Vercel ». Effet : impression de site cassé ou non livré, perte de confiance. Et un lien d'aperçu non protégé peut changer ou disparaître à tout moment.
- *Déduction :* un hôte `IP.sslip.io` (DNS générique qui renvoie l'IP contenue dans le nom) signale un serveur de test sans domaine. Le certificat HTTPS peut manquer ou être auto-signé (avertissement navigateur), et l'IP peut changer. À éviter dans un portfolio public. *Aucune source consultée sur sslip.io dans cette session.*
- *Recommandation (déduction) :*
  1. Lier uniquement les domaines de production des clients, en vérifiant au préalable qu'ils répondent en 200 sans authentification.
  2. Si un projet n'a pas de production publique, ne pas mettre de lien : montrer les captures avec la mention « Site en cours de mise en ligne », ou une étude de cas interne.
  3. Pas de `nofollow` / `ugc` pour des clients réels. `nofollow` seulement si l'on ne veut pas cautionner la destination (par exemple un aperçu tiers).
  4. Le lien ne doit pas être une démo hébergée par Vercel avec « Share link » : le jeton de contournement finirait dans le HTML public.

### Gaps
- Je n'ai pas pu confirmer, via l'article Google de 2019, que `nofollow`, `ugc` et `sponsored` sont traités comme des « indices » (« hints ») : la page récupérée était une archive sans le texte.
- Je n'ai trouvé aucune source sur l'effet SEO concret de liens sortants vers des hôtes `noindex` ou protégés. La perte de confiance est une déduction.
- Documentation sslip.io non consultée.
