// Orchestrateur du système de mouvement (hors hero). Chargé à la demande, en temps libre après le premier
// rendu : rien ici n'entre dans le JS initial ni ne touche au LCP.
// gsap.matchMedia : chaque effet ne vit que sous ses conditions (mouvement autorisé, souris, largeur) et est
// démonté automatiquement quand elles changent (préférence modifiée en direct, rotation, redimensionnement).
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

export function initMotion() {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  const mm = gsap.matchMedia();
  const live = (window.__motion = { effects: [] });
  mm.add({
    motion: '(prefers-reduced-motion: no-preference)',
    fine: '(hover: hover) and (pointer: fine)',
    wide: '(min-width: 1025px)'
  }, ctx => {
    const { motion, fine, wide } = ctx.conditions;
    const list = [];
    if (motion) list.push(['lineReveal', lineReveal], ['wordHighlight', wordHighlight], ['staggerTags', staggerTags], ['marqueeVelocity', marqueeVelocity], ['faqSmooth', faqSmooth]);
    if (motion && wide) list.push(['imageReveal', imageReveal]);
    if (motion && fine) list.push(['spotlight', spotlight], ['magnetic', magnetic]);
    const destroys = list.map(([, fx]) => fx.init(document));
    live.effects = list.map(([name]) => name);
    return () => { destroys.reverse().forEach(d => d && d()); live.effects = []; };
  });
  return { destroy: () => mm.revert() };
}
