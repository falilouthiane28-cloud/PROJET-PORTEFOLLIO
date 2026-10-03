// La mission traverse l'équipe : une impulsion part de la Prospection et s'arrête au Chef d'équipe, chaque agent
// s'allume quand elle l'atteint. Une seule fois, à l'arrivée à l'écran, en 3,4 s : pas de défilement épinglé
// (déconseillé par NN/g, surtout sur mobile ; voir reports/Vidéo hero et équipe agents.md).
// État au repos = état final (tout allumé) : sans JS, en mouvement réduit ou après l'animation, rien ne manque.
// Horizontal sur ordinateur, vertical sous 900 px (même DOM) : on lit l'orientation au moment de jouer.
import { gsap } from 'gsap';
import { inView } from 'motion';
import { DUR, GSAP_EASE } from '../tokens.js';
import { belowFold, cleanup } from '../util.js';

const STEP = 0.62;                                   // une étape par passage de relais

export function init(root = document) {
  const c = cleanup();
  const flow = root.querySelector('.mission__flow');
  if (!flow || !belowFold(flow)) return c.run;       // déjà vue : on ne l'éteint pas pour la rallumer
  const steps = [...flow.querySelectorAll('.mission__step')];
  const fill = flow.querySelector('.mission__fill'), dot = flow.querySelector('.mission__dot'), track = flow.querySelector('.mission__track');
  const ctx = gsap.context(() => {
    gsap.set(steps, { opacity: 0.32 });
    gsap.set(fill, { scaleX: 0, scaleY: 0 });
  });
  c.add(() => ctx.revert());

  let played = false;
  c.add(inView(flow, () => {
    if (played) return;                              // inView rappelle à chaque retour à l'écran
    played = true;
    // lectures groupées avant toute écriture
    const vertical = matchMedia('(max-width: 900px)').matches;
    const len = vertical ? track.offsetHeight : track.offsetWidth;
    const axis = vertical ? 'y' : 'x', scale = vertical ? 'scaleY' : 'scaleX';
    const total = (steps.length - 1) * STEP;
    const light = (tl, s, at) => tl
      .to(s, { opacity: 1, duration: DUR.micro }, at)
      .fromTo(s.querySelector('img'), { scale: 0.86 }, { scale: 1, duration: DUR.base, ease: GSAP_EASE.out }, at);
    ctx.add(() => {
      gsap.set(fill, vertical ? { scaleX: 1 } : { scaleY: 1 });
      const tl = gsap.timeline({ delay: 0.15 });
      light(tl, steps[0], 0);
      tl.fromTo(dot, { opacity: 0, x: 0, y: 0 }, { opacity: 1, duration: DUR.micro }, 0)
        .addLabel('go', DUR.micro)
        .to(fill, { [scale]: 1, duration: total, ease: 'none' }, 'go')
        .to(dot, { [axis]: len, duration: total, ease: 'none' }, 'go');
      steps.slice(1).forEach((s, i) => light(tl, s, `go+=${(i + 1) * STEP}`));
      tl.to(dot, { opacity: 0, duration: DUR.micro }, `go+=${total}`);
    });
  }, { margin: '0px 0px -20% 0px' }));
  return c.run;
}
