# Saturn Design Studio : dossier de conception (Tier 1, sans vidéo)

Hero animé en code (canvas), la vidéo Higgsfield viendra plus tard. Ce dossier ne part pas en ligne.

## 1. Le principe de marque

Un seul mot : **gravité**. Une marque bien faite attire vers elle, comme une planète. Le site montre quatre mondes (les projets) qui s'alignent autour de Saturne, et tout converge vers une seule action : écrire au studio sur WhatsApp.

## 2. Palette

```css
:root{
  --canvas:#0b0a12;        /* nuit teintée violet, jamais du noir pur */
  --panel:#15131f;
  --paper:#f4f2f8;         /* sections claires, jamais du blanc pur */
  --accent:#7c3aed;        /* CTA et rares accents */
  --accent-hover:#8b5cf6;
  --accent-muted:rgba(139,92,246,.35);
  --text-primary:#f2f0f7;
  --text-secondary:#a9a4b8;
  --ink:#0e0c16;           /* texte sur sections claires */
}
```
Couleurs des planètes : DakarHouse violet bleuté, iStore Tech argent, Saturn Agents magenta, Teranga rouge carmin.

## 3. Typographie

- Titres : Archivo, largeur 125, graisse 800 (même famille large et lourde que le logo SATURN).
- Accents : Instrument Serif italique (un seul mot par titre).
- Texte : Archivo 400 / 500.
- Petites mentions : JetBrains Mono 400 / 500, capitales espacées.

## 4. Les bandes du hero (500vh, points de départ)

| Bande | Plage | Ce que fait l'animation | Texte | Entrée |
|---|---|---|---|---|
| 1 | 0.00 à 0.26 | Les 4 planètes tournent librement autour de Saturne | « Nous construisons des mondes qui ont de la *gravité*. » + « Sites premium, plateformes web et employés IA pour les marques africaines et internationales. Conçus à Dakar, à la hauteur de n'importe quel marché. » | Montée mot à mot (au chargement) |
| 2 | 0.32 à 0.62 | Les planètes glissent sur leur orbite et s'alignent une à une, une étiquette apparaît sous chacune | « Quatre mondes. » / « Un seul studio. » + « Chaque projet part de zéro, autour de l'entreprise qu'il sert. » | Alignement des lettres (écho de l'alignement) |
| 3 | 0.70 à 1.00 | Alignement complet, l'anneau de Saturne pulse une fois | « La prochaine planète, c'est *votre marque*. » + « Parlez-nous de votre projet. Réponse dans la journée sur WhatsApp. » + boutons « Écrire sur WhatsApp » / « Voir les projets » | Montée mot à mot puis texte puis boutons |

Étiquettes des planètes : « 01 DakarHouse », « 02 iStore Tech », « 03 Saturn Agents », « 04 Teranga ».

## 5. Hero statique (téléphones, mouvement réduit)

Planètes déjà alignées. Titre : « Nous construisons des mondes qui ont de la *gravité*. » Texte : « Sites premium, plateformes web et employés IA. Conçus à Dakar. Réponse dans la journée sur WhatsApp. » Boutons : « Écrire sur WhatsApp » / « Voir les projets ».

## 6. Sections sous le hero (toutes mènent à WhatsApp)

1. Bandeau défilant : Sites premium ● Plateformes web ● Employés IA
2. **Nos réalisations** (clair) : 4 projets alternés, lien « Parler d'un projet similaire → » vers WhatsApp.
3. **Trois orbites** (sombre) : les 3 services en lignes, cercles d'orbite qui se dessinent.
4. **Notre méthode** (clair) : « Un site vitrine premium en 2 à 3 semaines. Et c'est écrit. » Frise en 4 étapes qui se dessine au scroll + 4 engagements (Tout est à vous, Un délai écrit, Réponse dans la journée, On reste après).
5. **Le studio** (sombre) : la phrase manifeste + 3 principes.
6. **Vos questions** (clair) : FAQ en accordéon (prix, délai, propriété, hors Sénégal, après la mise en ligne).
7. **Appel final** (sombre) : « Mettez votre marque *en orbite*. » + moment interactif : maintenir la petite planète pour la mettre en orbite ; une fois en orbite, la ligne « Il ne manque plus qu'un message. » s'allume et le bouton WhatsApp brille.
8. **Footer** : logo, phrase, colonnes Contact (WhatsApp, e-mail), Réseaux (Instagram @saturn_sn), Navigation, grand mot SATURN traversé par un anneau, heure de Dakar en direct.

Formulaire : aucun. Le site renvoie vers WhatsApp (canal préféré des clients à Dakar) et vers l'e-mail.

## 7. Couche vectorielle

- Anneau de Saturne en particules (élément signature).
- Fond fixe : nébuleuse violette qui dérive lentement (90 s) + grain.
- Cercles d'orbite (services) et frise de méthode qui se dessinent au scroll.
- Anneau SVG qui traverse le mot SATURN du footer.
- Mouvement réduit : tout est affiché dans son état final.

## 8. Ingénierie

Boucle rAF avec lissage indépendant de la fréquence, écritures DOM seulement si la valeur change, bandes rythmées en distance de scroll (test des coups de molette), 4 couches de lisibilité, 5 conditions du hero statique identiques en CSS et JS et suivies en direct, pause des animations hors écran et onglet caché, `overflow-x: clip`, focus visible, cibles tactiles de 44px.

## 9. Relecture des textes

Zéro tiret cadratin, zéro mot creux, textes livrés tels qu'écrits ici.
