// Bandeau : il accélère avec la vitesse du scroll, puis revient à son allure d'origine.
// On ne touche pas à l'animation CSS : seulement sa vitesse de lecture (WAAPI updatePlaybackRate, sans à-coup).
// Jamais de lecture inversée : une animation infinie lue à l'envers s'arrête à currentTime 0 (le bandeau se figeait).
// La boucle ne tourne que pendant le retour à l'allure, et seulement quand le bandeau est à l'écran.
// Mouvement réduit : l'animation CSS n'existe pas (site.css), l'effet n'a rien à piloter.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lerpFactor } from '../tokens.js';

export function init(root = document) {
  const track = root.querySelector('.marquee__track');
  const anim = track?.getAnimations()[0];
  if (!anim) return () => {};
  let target = 1, rate = 1, ticking = false;
  const tick = (t, dt) => {
    rate += (target - rate) * lerpFactor(0.08, dt);
    target += (1 - target) * lerpFactor(0.04, dt);                    // retour vers l'allure d'origine
    if (Math.abs(rate - 1) < 0.01 && Math.abs(target - 1) < 0.01) { rate = target = 1; stop(); }
    anim.updatePlaybackRate(Math.round(rate * 100) / 100);
  };
  const start = () => { if (!ticking) { gsap.ticker.add(tick); ticking = true; } };
  function stop() { if (ticking) { gsap.ticker.remove(tick); ticking = false; } }
  // hors écran : allure d'origine tout de suite (sinon il repartirait trop vite au retour)
  function reset() { stop(); target = rate = 1; anim.updatePlaybackRate(1); }
  const st = ScrollTrigger.create({
    trigger: track.parentElement, start: 'top bottom', end: 'bottom top',
    onUpdate(self) {
      target = Math.max(target, 1 + Math.min(3, Math.abs(self.getVelocity()) / 700));   // ×1 à ×4
      start();
    },
    onLeave: reset, onLeaveBack: reset
  });
  return () => { st.kill(); reset(); };
}
