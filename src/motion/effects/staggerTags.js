// Étiquettes des projets et services : elles arrivent en cascade, juste après leur bloc.
// Motion `inView` (déclencheur) + `animate` en WAAPI (opacité et transform en chaînes complètes : accéléré).
// À la fin, on retire tout style inline : rendu au repos identique à l'origine.
import { inView, stagger } from 'motion';
import { animate } from 'motion/mini';
import { EASE } from '../tokens.js';
import { $$, belowFold, cleanup } from '../util.js';

const bezier = s => s.match(/[\d.]+/g).map(Number);

export function init(root = document) {
  const c = cleanup();
  const groups = $$('.project .tags, .service .tags', root).filter(belowFold);
  const all = groups.flatMap(g => [...g.children]);
  all.forEach(li => { li.style.opacity = '0'; });
  const reset = lis => lis.forEach(li => { li.style.opacity = ''; li.style.transform = ''; });
  const running = new Set();
  c.add(() => { running.forEach(a => a.cancel()); reset(all); });
  c.add(inView(groups, group => {
    const lis = [...group.children];
    const a = animate(lis, { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0px)'] },
      { duration: 0.6, ease: bezier(EASE.out), delay: stagger(0.06, { startDelay: 0.3 }) });
    running.add(a);
    a.then(() => { running.delete(a); reset(lis); a.cancel(); });
  }, { amount: 0.6 }));
  return c.run;
}
