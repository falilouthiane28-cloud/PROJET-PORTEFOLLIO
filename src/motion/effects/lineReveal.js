// Titres de section : les lignes montent une à une depuis un masque (SplitText, GSAP).
// - découpe juste avant l'arrivée (le bloc parent .reveal est encore à opacité 0 : rien ne clignote)
// - à la fin, split.revert() : le DOM et le rendu redeviennent exactement ceux d'origine
//   (le masque couperait sinon l'italique et les jambages au repos)
// Mouvement réduit : effet non chargé (gsap.matchMedia dans motion/index.js).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DUR, STAGGER, GSAP_EASE } from '../tokens.js';
import { $$, belowFold } from '../util.js';

export function init(root = document) {
  const triggers = [];
  const splits = [];
  for (const el of $$('main h2.display', root).filter(belowFold)) {
    let split = null;
    triggers.push(ScrollTrigger.create({
      trigger: el, start: 'top bottom', once: true,
      onEnter() {
        split = SplitText.create(el, { type: 'lines', mask: 'lines', aria: 'auto', linesClass: 'mv-line' });
        splits.push(split);
        gsap.set(split.lines, { yPercent: 105 });
      }
    }));
    triggers.push(ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter() {
        if (!split) return;
        gsap.to(split.lines, {
          yPercent: 0, duration: DUR.line, ease: GSAP_EASE.outQuint, stagger: STAGGER.line, delay: 0.08,
          onComplete() { split.revert(); }
        });
      }
    }));
  }
  return () => {
    triggers.forEach(t => t.kill());
    splits.forEach(s => s.revert());
  };
}
