// Boutons magnétiques (appel final) : le bouton suit légèrement la souris, puis revient en douceur.
// On anime la propriété CSS `translate` (via --mx/--my) et non `transform` : le survol d'origine
// (transform: translateY(-2px)) et sa transition restent intacts, les deux se composent.
// GSAP quickTo = ressort sans rebond, interruptible. Souris seulement.
import { gsap } from 'gsap';
import { DIST } from '../tokens.js';
import { $$, cleanup, on } from '../util.js';

const clamp = (v, m) => Math.max(-m, Math.min(m, v));

export function init(root = document) {
  const c = cleanup();
  for (const el of $$('#finalCta, .actions--center .btn--ghost', root)) {
    el.classList.add('mv-magnet');
    const mx = gsap.quickTo(el, '--mx', { duration: 0.6, ease: 'power3' });
    const my = gsap.quickTo(el, '--my', { duration: 0.6, ease: 'power3' });
    // rect relu à chaque mouvement : la page peut défiler sous la souris (Lenis) ; quickTo écrit sur le ticker,
    // donc pas d'écriture synchrone entre deux lectures
    c.add(on(el, 'pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const rect = el.getBoundingClientRect();
      mx(clamp((e.clientX - (rect.left + rect.width / 2)) * 0.3, DIST.magnet * 1.4));
      my(clamp((e.clientY - (rect.top + rect.height / 2)) * 0.35, DIST.magnet));
    }));
    c.add(on(el, 'pointerleave', () => { mx(0); my(0); }));
    c.add(() => { gsap.killTweensOf(el); el.classList.remove('mv-magnet'); el.style.removeProperty('--mx'); el.style.removeProperty('--my'); });
  }
  return c.run;
}
