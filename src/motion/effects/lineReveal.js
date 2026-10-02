// Titres de section : les lignes montent une à une depuis un masque (SplitText, GSAP).
// - déclencheurs en IntersectionObserver (Motion inView) et non en ScrollTrigger : aucune lecture de mise en page
//   à la création (10 ScrollTriggers coûtaient une tâche longue au chargement sur mobile, mesuré par Lighthouse)
// - découpe dès que le titre entre par le bas (le bloc parent .reveal est encore à opacité 0 : rien ne clignote),
//   montée quand il atteint 88 % de l'écran
// - à la fin, split.revert() : le DOM et le rendu redeviennent exactement ceux d'origine
//   (le masque couperait sinon l'italique et les jambages au repos)
// Mouvement réduit : effet non chargé (gsap.matchMedia dans motion/index.js).
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { inView } from 'motion';
import { DUR, STAGGER, GSAP_EASE } from '../tokens.js';
import { $$, belowFold, cleanup } from '../util.js';

export function init(root = document) {
  const c = cleanup();
  for (const el of $$('main h2.display', root).filter(belowFold)) {
    let split = null, tween = null;
    const prepare = () => {
      if (split) return;
      split = SplitText.create(el, { type: 'lines', mask: 'lines', aria: 'auto', linesClass: 'mv-line' });
      gsap.set(split.lines, { yPercent: 105 });
    };
    c.add(inView(el, prepare));
    c.add(inView(el, () => {
      prepare();                                      // les deux observateurs peuvent répondre dans la même image
      tween = gsap.to(split.lines, {
        yPercent: 0, duration: DUR.line, ease: GSAP_EASE.outQuint, stagger: STAGGER.line, delay: 0.08,
        onComplete() { split.revert(); tween = null; }
      });
    }, { margin: '0px 0px -12% 0px' }));
    c.add(() => { tween?.kill(); split?.revert(); });
  }
  return c.run;
}
