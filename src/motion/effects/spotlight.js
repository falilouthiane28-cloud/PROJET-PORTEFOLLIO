// Lueur qui suit le pointeur sur les lignes de services (section sombre). Souris seulement.
// Motion `hover` filtre le tactile ; un seul écouteur pointermove, actif uniquement pendant le survol.
// La lueur est un ::before en CSS (styles/motion.css) piloté par --sx/--sy ; invisible au repos.
import { hover } from 'motion';
import { $$ } from '../util.js';

export function init(root = document) {
  const rows = $$('.service', root);
  rows.forEach(r => r.classList.add('mv-spot'));
  const active = new Set();                         // le cancel() de hover n'appelle pas les fins de survol en cours
  const stop = hover(rows, el => {
    let rect = el.getBoundingClientRect();
    const move = e => {
      el.style.setProperty('--sx', `${Math.round(e.clientX - rect.left)}px`);
      el.style.setProperty('--sy', `${Math.round(e.clientY - rect.top)}px`);
    };
    const remeasure = () => { rect = el.getBoundingClientRect(); };
    el.addEventListener('pointermove', move, { passive: true });
    addEventListener('scroll', remeasure, { passive: true });
    el.classList.add('is-lit');
    const end = () => {
      active.delete(end);
      el.classList.remove('is-lit');
      el.removeEventListener('pointermove', move);
      removeEventListener('scroll', remeasure);
    };
    active.add(end);
    return end;
  });
  return () => { [...active].forEach(f => f()); stop(); rows.forEach(r => { r.classList.remove('mv-spot', 'is-lit'); r.style.removeProperty('--sx'); r.style.removeProperty('--sy'); }); };
}
