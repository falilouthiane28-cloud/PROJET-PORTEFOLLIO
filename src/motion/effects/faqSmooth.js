// FAQ : la fermeture devient aussi douce que l'ouverture (qui reste en CSS, keyframes « open »).
// Au clic (ou Entrée / Espace : même événement), la réponse se replie en fondu puis <details> se ferme.
// Motion `animate` (WAAPI) sur le bloc réponse, que rien d'autre ne pilote pendant la fermeture.
import { animate } from 'motion/mini';
import { EASE } from '../tokens.js';
import { $$, cleanup, on } from '../util.js';

const bezier = s => s.match(/[\d.]+/g).map(Number);

export function init(root = document) {
  const c = cleanup();
  for (const d of $$('.faq details', root)) {
    const summary = d.querySelector('summary'), body = d.querySelector(':scope > div');
    if (!summary || !body) continue;
    let closing = null;
    c.add(on(summary, 'click', e => {
      if (closing) { e.preventDefault(); return; }    // deuxième clic pendant le repli : on laisse finir
      if (!d.open) return;
      e.preventDefault();
      closing = animate(body, { opacity: [1, 0], transform: ['translateY(0px)', 'translateY(-6px)'] }, { duration: 0.22, ease: bezier(EASE.in) });
      // motion/mini écrit les valeurs finales en style inline : on les retire, sinon la réponse
      // resterait invisible à la prochaine ouverture
      closing.then(() => { d.open = false; closing.cancel(); body.style.opacity = ''; body.style.transform = ''; closing = null; });
    }));
  }
  return c.run;
}
