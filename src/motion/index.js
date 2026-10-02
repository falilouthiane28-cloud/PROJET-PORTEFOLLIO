// Orchestrateur du système de mouvement (hors hero). Chargé à la demande, en temps libre après le premier
// rendu : rien ici n'entre dans le JS initial ni ne touche au LCP.
// gsap.matchMedia : chaque groupe d'effets ne vit que sous ses conditions et est démonté automatiquement quand
// elles changent (préférence modifiée en direct, rotation, souris branchée). Trois groupes séparés : passer le
// seuil de 1025 px ne démonte pas les effets qui n'en dépendent pas.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import * as lineReveal from './effects/lineReveal.js';
import * as wordHighlight from './effects/wordHighlight.js';
import * as imageReveal from './effects/imageReveal.js';
import * as staggerTags from './effects/staggerTags.js';
import * as marqueeVelocity from './effects/marqueeVelocity.js';
import * as faqSmooth from './effects/faqSmooth.js';
import * as spotlight from './effects/spotlight.js';
import * as magnetic from './effects/magnetic.js';

const MOTION = '(prefers-reduced-motion: no-preference)';
const GROUPS = [
  [MOTION, { lineReveal, wordHighlight, staggerTags, marqueeVelocity, faqSmooth }],
  [`${MOTION} and (min-width: 1025px)`, { imageReveal }],
  [`${MOTION} and (hover: hover) and (pointer: fine)`, { spotlight, magnetic }]
];

// un effet par tâche, chacun dans un temps libre : l'initialisation ne forme plus une seule tâche longue
// (mesuré : 504 ms d'un bloc sur mobile Lighthouse, d'où un TBT de 189-267 ms)
const idle = cb => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 1000 }) : setTimeout(cb, 16));
const cancelIdle = h => ('cancelIdleCallback' in window ? cancelIdleCallback(h) : clearTimeout(h));

export function initMotion() {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const mm = gsap.matchMedia();
  const live = (window.__motion = { effects: [] });
  for (const [query, effects] of GROUPS) {
    mm.add(query, () => {
      const destroys = [], pending = new Set();
      for (const [name, fx] of Object.entries(effects)) {
        const h = idle(() => {
          pending.delete(h);
          // un effet en erreur ne doit ni bloquer les autres ni empêcher le démontage de ceux déjà posés
          try { destroys.push(fx.init(document)); live.effects.push(name); } catch (e) { console.error('[mouvement]', name, e); }
        });
        pending.add(h);
      }
      return () => {
        pending.forEach(cancelIdle);
        destroys.reverse().forEach(d => { try { d && d(); } catch {} });
        live.effects = live.effects.filter(n => !(n in effects));
      };
    });
  }
  return { destroy: () => mm.revert() };
}
