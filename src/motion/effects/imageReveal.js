// Captures des projets : l'image s'ouvre depuis un masque (clip-path) et se pose (léger zoom → 1), liée au scroll.
// GSAP pilote <picture> ; le CSS garde <img> (zoom au survol) et .frame (lévitation) : un moteur par élément.
// Fin de course à 62 % de l'écran (image posée dès qu'elle est bien visible) : au repos, inset 0 et scale 1, rendu identique à l'origine.
// Ordinateur seulement (≥ 1025 px) : un clip-path piloté en JS est repeint à chaque image, trop cher sur mobile.
import { gsap } from 'gsap';
import { $$, belowFold } from '../util.js';

export function init(root = document) {
  const tweens = $$('.project .frame', root).filter(belowFold).map(frame => {
    const pic = frame.querySelector('picture');
    return gsap.fromTo(pic,
      { clipPath: 'inset(9% 7% 9% 7% round 14px)', scale: 1.08 },
      { clipPath: 'inset(0% 0% 0% 0% round 0px)', scale: 1, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'top 62%', scrub: 0.6 } });
  });
  return () => tweens.forEach(t => { t.scrollTrigger?.kill(); t.revert(); });
}
