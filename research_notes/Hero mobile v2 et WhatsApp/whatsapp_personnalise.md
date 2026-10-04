# Messages WhatsApp personnalisés pour un portfolio d'agence (fr-SN)

Notes de recherche pour Saturn Design Studio. Objectif : remplacer les 12 liens WhatsApp pointant tous vers `wa.me/message/YXCZMZCCFQKDF1` par des liens à message pré-rempli selon le contexte (hero, 6 cartes projets, services, CTA final, modale film).

## 1. Format d'URL `wa.me` et `wa.me/message` en 2026

### Takeaway
Le format officiel qui accepte un texte pré-rempli est `https://wa.me/<numéro>?text=<encodé>` avec le numéro en E.164 **sans `+`, sans `00`, sans espace ni tiret** ; le format court `wa.me/message/<CODE>` (réponse enregistrée) **n'accepte pas** `?text=` : le message est stocké côté Meta et la limite est de 140 caractères, gérée dans WhatsApp Business, pas dans l'URL. Pour la personnalisation par contexte, il faut donc migrer de `wa.me/message/...` vers `wa.me/<numéro>?text=...`.

### Cited Findings
- Le format officiel est `https://wa.me/<number>?text=<urlencodedtext>`, et le numéro doit être au format international **sans zéros, parenthèses ni tirets** — [Unipile, WhatsApp Link API](https://www.unipile.com/fr/?p=275019)
- Le numéro doit suivre E.164, **chiffres uniquement, pas de `+`, pas de `0` initial, pas d'espace ni de tiret** ; c'est la cause la plus fréquente d'échec silencieux — [u2l.ai, Click-to-Chat Guide 2026](https://u2l.ai/blog/whatsapp-click-to-chat-link.md)
- Encodage : espace = `%20`, saut de ligne = `%0A`, `&` = `%26`, `#` = `%23`, `+` = `%2B` ; pour le reste (accents, emoji) utiliser `encodeURIComponent()` — [Unipile](https://www.unipile.com/fr/?p=275019)
- `wa.me/message/<CODE>` : « Meta's short-link service stores that text separately from the URL », limite dure de **140 caractères**, édition via Business Manager ; `?text=` **ne s'applique pas** à ce format — [Bird, WhatsApp click-to-chat link](https://bird.com/explained/whatsapp/what-is-a-whatsapp-click-to-chat-link)
- Un lien `wa.me/` **sans numéro** ouvre la liste de contacts de l'expéditeur et le `?text=` se remplit après choix du contact — [Unipile](https://www.unipile.com/fr/?p=275019)
- Variante alternative `https://api.whatsapp.com/send?phone=<n>&text=<t>` fonctionne toujours (ancien format documenté par WhatsApp) — [Unipile](https://www.unipile.com/fr/?p=275019)
- Limite pratique de la bulle WhatsApp = 4 096 caractères ; les navigateurs supportent largement cela dans l'URL — [TypeCount WhatsApp Character Counter](https://typecount.com/tools/whatsapp-character-counter)

### Inferences
- Pour Saturn, cela signifie **abandonner `wa.me/message/YXCZMZCCFQKDF1`** et passer à `https://wa.me/221XXXXXXXX?text=...` (indicatif Sénégal 221), sinon aucune personnalisation par page n'est possible.
- Garder les messages **sous 300 caractères** par bulle laisse une marge très confortable vis-à-vis des limites d'URL de navigateurs (généralement 2 000+ caractères sans problème).
- Sous 140 caractères (contrainte du short link `wa.me/message/`), seule une poignée de modèles tiennent — raison supplémentaire d'abandonner ce format.

### Gaps
- La documentation `faq.whatsapp.com` officielle n'a pas pu être récupérée (WebFetch retourne un contenu tronqué) ; les règles exactes de validation côté serveur WhatsApp pour les caractères spéciaux non testés ici ne sont pas confirmées source primaire.

## 2. Rédaction des messages pré-remplis qui convertissent (fr formel, contexte Sénégal)

### Takeaway
Les études convergent : messages **courts (< 300 caractères, 3-4 phrases)**, écrits **du point de vue du visiteur à la première personne**, **spécifiques au contexte** (produit, page, service), avec **une seule question d'ouverture claire**. Au Sénégal, le « vous » formel + « Bonjour » reste la norme professionnelle, avec un ton chaleureux mais non familier car les relations personnelles précèdent la transaction.

### Cited Findings
- « Write the prefilled message from the user's perspective, not your own. "Hi, I'd like to book a demo" beats "Customer interested in demo" since the user is the one sending it. » — [Hyperleap, Create WhatsApp Link 2026](https://hyperleap.ai/blog/create-whatsapp-link)
- Ajouter contexte et spécificité : « "I need the Jakarta enterprise quote" is operationally better than "Hi." » — [Hyperleap](https://hyperleap.ai/blog/create-whatsapp-link)
- « Un bouton qui envoie un message pré-rempli selon la page » est le modèle recommandé pour les sites vitrines sénégalais ; les messages doivent couvrir prix, horaires, disponibilité (60 % des conversations) — [Kolonell, WhatsApp Business Sénégal](https://kolonell.com/fr/blog/whatsapp-business-site-web-combo-gagnant-senegal)
- Au Sénégal, « la culture professionnelle place les relations personnelles devant la transaction » : prévoir une entrée en matière avant la demande commerciale — [Expat.com, Networking in Senegal](https://www.expat.com/en/guide/africa/senegal/37423-networking-in-senegal.html)
- Longueur cible : « under 300 characters, roughly three to four short sentences, since shorter messages get opened and replied to at noticeably higher rates » — [TheConvertWay, WhatsApp Business Description Guide](https://www.theconvertway.com/blog/whatsapp-business-description-guide)
- Ton : « friendly, timely, and helpful — not overly polished or "salesy" », avec un prompt clair vers l'action suivante — [TheConvertWay](https://www.theconvertway.com/blog/whatsapp-business-description-guide)
- Un bon message pré-rempli « can tell you what they want, which service they care about, and where they came from » — [u2l.ai](https://u2l.ai/blog/whatsapp-click-to-chat-link.md)

### Inferences — Modèles proposés (à valider par Saturn)

Convention : chaque message tient en 2-3 lignes, commence par « Bonjour Saturn, », mentionne la page/projet d'origine, se termine par une question ouverte unique.

- **Hero / CTA principal** (générique, visiteur arrivé en haut) :
  « Bonjour Saturn, je découvre votre studio et j'aimerais discuter d'un projet. Pouvez-vous me dire comment on démarre ? »
- **Carte projet DakarHouse** :
  « Bonjour Saturn, j'ai vu DakarHouse sur votre portfolio et j'aimerais un site dans le même esprit. Est-ce qu'on peut en parler ? »
- **Carte projet iStore Tech** (idem pour les 2 variantes iStore Tech / iStore Tech Dakar — ajouter la mention de la page) :
  « Bonjour Saturn, le projet iStore Tech m'a convaincu. J'ai un e-commerce à lancer — quel est le délai habituel ? »
- **Carte projet Saturn Agents** (employés IA) :
  « Bonjour Saturn, je m'intéresse aux employés IA (Saturn Agents). Comment choisit-on ce qui est automatisable chez nous ? »
- **Carte projet Teranga** :
  « Bonjour Saturn, le site Teranga correspond à ce que je cherche pour mon activité. Peut-on en discuter cette semaine ? »
- **Carte projet Saturn Studio** (meta/auto-promo) :
  « Bonjour Saturn, votre propre site m'a donné envie de travailler avec vous. Comment se déroule une collaboration ? »
- **Section services** :
  « Bonjour Saturn, j'ai parcouru vos services et j'aimerais un devis. Quelles infos devez-vous avoir pour commencer ? »
- **CTA final (bas de page)** :
  « Bonjour Saturn, après avoir parcouru votre site je souhaite échanger sur un projet. Quand êtes-vous disponible ? »
- **Modale film / après la vidéo** :
  « Bonjour Saturn, j'ai regardé votre film de présentation et je veux aller plus loin. Comment on commence ? »

À éviter (confirmé par les sources ci-dessus et les règles CRO citées) :
- MAJUSCULES, « DEVIS GRATUIT MAINTENANT », urgence factice (« Plus que 24 h ! »)
- Tutoiement (« Salut ! »), familiarité anglophone (« Hey Saturn »)
- Données sensibles pré-remplies (budget, téléphone du visiteur, email) — c'est le visiteur qui envoie
- Messages longs (> 3 phrases) — réduisent le taux de réponse et paraissent spammeux
- Codes internes visibles (« LEAD-SRC-42 ») en clair dans le texte vu par le prospect

### Gaps
- Aucune étude chiffrée sénégalaise ou francophone avec taux de conversion A/B comparant message vide vs pré-rempli n'a été trouvée dans la fenêtre de recherche ; les chiffres cités (45-60 % conversion sur templates) viennent de contextes anglophones (Inde, Asie du Sud-Est) — [ChatDaddy, 25 WhatsApp Business Tips](https://chatdaddy.tech/blog/whatsapp-business-tips).

## 3. Mobile vs desktop, iOS sans WhatsApp

### Takeaway
Sur mobile, `wa.me/<n>?text=...` ouvre l'app WhatsApp avec texte pré-rempli, prêt à envoyer (l'utilisateur garde le contrôle de l'envoi). Sur desktop, WhatsApp Web ou l'app desktop s'ouvre. Si WhatsApp n'est pas installé, iOS/Android affichent une page web `wa.me` qui propose d'installer l'app (App Store / Play Store) — pas de dead-end, mais pas de fallback contrôlable. Un fallback email/téléphone côté site est **sur-ingénierie** sauf si la cible comporte beaucoup de visiteurs sans WhatsApp (peu probable au Sénégal, 87 % des PME l'utilisent).

### Cited Findings
- « Native wa.me links have no fallback control and no attribution » — [AppsFlyer, WhatsApp deep link](https://www.appsflyer.com/blog/mobile-marketing/whatsapp-deep-link/)
- « If the WhatsApp app is not installed on the visitor's phones, the link will be opened in the browser » — comportement par défaut sans dead-end — [Short.io, WhatsApp resources](https://blog.short.io/whats-app/)
- Sur iOS sans WhatsApp : page web « it seems you don't have Whatsapp installed » avec bouton vers l'App Store — [AppsFlyer](https://www.appsflyer.com/blog/mobile-marketing/whatsapp-deep-link/)
- Pénétration : « 87% of Senegalese SMEs using WhatsApp as their primary communication channel with customers » — [Kolonell](https://kolonell.com/fr/blog/whatsapp-business-site-web-combo-gagnant-senegal)

### Inferences
- Pour Saturn, un fallback explicite (email/téléphone affiché à côté du bouton WhatsApp) peut rester visible en permanence sur la page de contact, mais **pas besoin de détection JS** « WhatsApp installé ? » — cela ajouterait du JS et un risque de faux négatif. La page `wa.me` native suffit.
- Sur iOS, Safari ouvre `wa.me` sans popup intermédiaire si l'app est installée ; sinon le visiteur reste sur une page WhatsApp — pas sur le site Saturn — donc perdre la session. Compensation possible : afficher le même numéro et email en clair sur le site (déjà le cas probablement).

### Gaps
- Comportement précis de WhatsApp Web sur un ordinateur **sans compte connecté** (QR vide) non vérifié ici. À tester.

## 4. Attribution / analytics sans script tiers

### Takeaway
L'attribution « pure URL » se fait **dans le texte même du message** (par ex. une ligne « — Depuis : page projets · DakarHouse »). WhatsApp **n'achemine pas** les paramètres UTM ni query strings annexes vers l'inbox ; seul le texte visible est transmis. C'est compatible avec la contrainte du projet (pas de script analytics tiers).

### Cited Findings
- « Meta does not pass UTM parameters or custom query parameters through WhatsApp links — when a customer clicks and starts a chat, UTM data is silently dropped » — [Capybara / respond.io, Attribute WhatsApp conversations](https://respond.io/vi/help/capture-leads/how-to-attribute-whatsapp-conversations-to-non-meta-ads)
- « A message that says "Hi, I saw the Black Friday banner" is its own attribution, instantly identifying which campaign produced that lead » — [u2l.ai](https://u2l.ai/blog/whatsapp-click-to-chat-link.md)
- Le message pré-rempli peut servir simultanément de source, de contexte et d'intention : « which service they care about, and where they came from » — [u2l.ai](https://u2l.ai/blog/whatsapp-click-to-chat-link.md)

### Inferences
- Pour Saturn, suggérer une **convention de signature invisible** : une dernière ligne discrète séparée par `%0A%0A—%0A` du type `— Saturn.studio · fiche DakarHouse`. Elle sert à Saturn pour trier les leads sans script, et le visiteur peut l'effacer (le texte reste éditable avant envoi).
- Alternative plus propre : ne rien signer explicitement, mais varier la **formulation unique** par contexte (le mot « DakarHouse » apparaît seulement dans le message issu de la carte DakarHouse). L'agence identifie la source par le texte lui-même, sans ligne de métadonnées.

### Gaps
- Pas de retour chiffré sur l'impact de la signature « — Depuis : ... » sur le taux de réponse (visiteurs qui la laissent vs l'effacent).

## 5. Accessibilité et libellé visible

### Takeaway
Le libellé **visible du bouton** doit être court (« Écrire sur WhatsApp »), le `aria-label` doit préciser la destination pour les lecteurs d'écran, et le lien doit garder `target="_blank"` + `rel="noopener"`. Le texte long et contextuel va dans `?text=`, **pas** dans le libellé visible, qui doit rester identique sur toute la page.

### Cited Findings
- « `target="_blank" rel="noopener" aria-label="Chat on WhatsApp"` attributes to make the link both secure and accessible » — [Unipile](https://www.unipile.com/fr/?p=275019)
- Les icônes isolées (sans texte) doivent avoir un nom accessible via `aria-label` — [216 Digital, Accessible Links](https://216digital.com/how-to-write-and-design-accessible-links/)
- `rel="noopener"` protège de la fuite `window.opener`, souvent complété par `noreferrer` pour la privacy — [Unipile](https://www.unipile.com/fr/?p=275019)

### Inferences
- Pour Saturn (fr) : libellé visible « Écrire sur WhatsApp » ou « Discuter sur WhatsApp », `aria-label="Écrire à Saturn sur WhatsApp"` (plus explicite que « Chat on WhatsApp »).
- Les règles d'accessibilité du projet (focus visible, cible 44 × 44 px, mouvement réduit) s'appliquent telles quelles — le lien WhatsApp est un `<a>` standard.

### Gaps
- Aucune divergence source sur ce point.

## 6. Pièges connus et checklist de test

### Takeaway
Les trois pièges silencieux les plus coûteux sont : (1) numéro mal formaté qui ouvre un chat vide ou une erreur ; (2) texte non encodé (notamment `&`, `?`, apostrophes typographiques `’`, accents) qui tronque le message ; (3) tentative de superposer `?text=` sur `wa.me/message/<code>` — ignoré silencieusement.

### Cited Findings
- Erreur la plus fréquente = numéro mal formaté (zéros, parenthèses, tirets, `+`) : « This single requirement causes most failures » — [u2l.ai](https://u2l.ai/blog/whatsapp-click-to-chat-link.md)
- Encodage obligatoire pour `&`, `#`, `+`, espaces, retours ligne — [Unipile](https://www.unipile.com/fr/?p=275019)
- Short link `wa.me/message/<code>` : texte géré hors URL, 140 caractères max — [Bird](https://bird.com/explained/whatsapp/what-is-a-whatsapp-click-to-chat-link)
- Toujours tester avant publication — [u2l.ai](https://u2l.ai/blog/whatsapp-click-to-chat-link.md)

### Inferences — Checklist de test proposée pour Saturn
- [ ] Numéro converti en E.164 : `+221 XX XXX XX XX` → `221XXXXXXXX`
- [ ] Tous les messages passés à `encodeURIComponent()` (pas de concaténation naïve)
- [ ] Vérifier qu'aucune apostrophe typographique `’` ne subsiste (remplacer par `'` droite ou l'encoder correctement)
- [ ] Tester 1 lien par contexte sur : Android Chrome + WhatsApp installé, iOS Safari + WhatsApp installé, desktop Chrome avec WhatsApp Web connecté, desktop sans WhatsApp
- [ ] Vérifier que le texte s'affiche en français avec accents (`é`, `à`, `ç`) et saut de ligne `%0A`
- [ ] Longueur du message : viser 120-250 caractères, max 300
- [ ] Un seul moteur de lien : ne pas mélanger `wa.me/message/...` (ancien) et `wa.me/221.../?text=...` (nouveau) sur la même page

### Gaps
- Comportement exact de l'apostrophe typographique `’` non vérifié source primaire ; expérience terrain à mener.

## Sources citées

- [Unipile — WhatsApp Link API : wa.me & api.whatsapp.com](https://www.unipile.com/fr/?p=275019)
- [u2l.ai — WhatsApp Click-to-Chat Links: The Complete wa.me Guide (2026)](https://u2l.ai/blog/whatsapp-click-to-chat-link.md)
- [Bird — What is a WhatsApp click-to-chat link](https://bird.com/explained/whatsapp/what-is-a-whatsapp-click-to-chat-link)
- [Hyperleap — Create WhatsApp Link: Maximize Conversions in 2026](https://hyperleap.ai/blog/create-whatsapp-link)
- [Kolonell — WhatsApp Business + site web, combo gagnant au Sénégal](https://kolonell.com/fr/blog/whatsapp-business-site-web-combo-gagnant-senegal)
- [TheConvertWay — WhatsApp Business Description Guide for Higher Engagement](https://www.theconvertway.com/blog/whatsapp-business-description-guide)
- [ChatDaddy — 25 WhatsApp Business Tips to Grow Sales](https://chatdaddy.tech/blog/whatsapp-business-tips)
- [AppsFlyer — WhatsApp deep link guide](https://www.appsflyer.com/blog/mobile-marketing/whatsapp-deep-link/)
- [Short.io — WhatsApp resources](https://blog.short.io/whats-app/)
- [respond.io — Attribute WhatsApp conversations to non-Meta ads](https://respond.io/vi/help/capture-leads/how-to-attribute-whatsapp-conversations-to-non-meta-ads)
- [216 Digital — How to Write and Design Accessible Links](https://216digital.com/how-to-write-and-design-accessible-links/)
- [Expat.com — Networking in Senegal](https://www.expat.com/en/guide/africa/senegal/37423-networking-in-senegal.html)
- [TypeCount — WhatsApp Character Counter](https://typecount.com/tools/whatsapp-character-counter)
