// Phrase du studio : les mots s'allument un à un au fil du scroll (scrub GSAP, réversible).
// Au repos, une fois la phrase passée, tous les mots sont à opacité 1 : rendu identique à l'origine.
// Lecteurs d'écran : même motif que le reste du site, la phrase entière dans un span.sr et la version
// découpée en aria-hidden (un aria-label sur un <p> est interdit : axe aria-prohibited-attr).
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { $$, belowFold } from '../util.js';

export function init(root = document) {
  const undo = [];
  for (const el of $$('.studio__statement', root).filter(belowFold)) {
    const original = [...el.childNodes];
    const sr = document.createElement('span');
    sr.className = 'sr'; sr.textContent = el.textContent;
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    vis.append(...original);
    el.append(sr, vis);
    const split = SplitText.create(vis, { type: 'words', aria: 'none', wordsClass: 'mv-word' });
    const tween = gsap.fromTo(split.words, { opacity: 0.18 }, {
      opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 70%', scrub: 0.5 }
    });
    undo.push(() => { tween.scrollTrigger?.kill(); tween.kill(); split.revert(); el.replaceChildren(...vis.childNodes); });
  }
  return () => undo.forEach(f => f());
}
