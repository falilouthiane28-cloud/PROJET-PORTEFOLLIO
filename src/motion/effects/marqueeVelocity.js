// Bandeau : sa vitesse suit celle du scroll (et s'inverse quand on remonte), puis revient à son allure.
// On ne touche pas à l'animation CSS d'origine : on change seulement sa vitesse de lecture (WAAPI
// updatePlaybackRate, sans à-coup). Rien ne tourne quand le bandeau est hors écran.
// Mouvement réduit : l'animation CSS n'existe pas (site.css), l'effet n'a rien à piloter.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lerpFactor } from '../tokens.js';

export function init(root = document) {
  const track = root.querySelector('.marquee__track');
  const anim = track?.getAnimations()[0];
  if (!anim) return () => {};
  let target = 1, rate = 1, active = false;
  const tick = (t, dt) => {
    rate += (target - rate) * lerpFactor(0.08, dt);
    target += (Math.sign(target) - target) * lerpFactor(0.04, dt);     // retour vers l'allure normale (±1)
    if (Math.abs(rate - anim.playbackRate) > 0.01) anim.updatePlaybackRate(Math.round(rate * 100) / 100);
  };
  const st = ScrollTrigger.create({
    trigger: track.parentElement, start: 'top bottom', end: 'bottom top',
    onUpdate(self) {
      const v = self.getVelocity();                                     // px/s, signé
      const k = Math.min(3, Math.abs(v) / 700);
      target = (v < 0 ? -1 : 1) * (1 + k);
    },
    onToggle(self) {
      if (self.isActive && !active) { gsap.ticker.add(tick); active = true; }
      else if (!self.isActive && active) {
        // hors écran : la boucle s'arrête, on repart à l'allure normale (sinon il repartirait trop vite au retour)
        gsap.ticker.remove(tick); active = false;
        target = rate = Math.sign(target) || 1; anim.updatePlaybackRate(target);
      }
    }
  });
  return () => { st.kill(); gsap.ticker.remove(tick); anim.updatePlaybackRate(1); };
}
