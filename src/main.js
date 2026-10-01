// Point d'entrée : uniquement ce qu'il faut pour l'intro et la navigation.
// Le reste arrive par vagues : scroll et interactions juste après, la planète 3D une fois la page au repos.
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/hero.css';
import './styles/nav.css';
import './styles/sections.css';
import './styles/cursor.css';

import { gsap } from 'gsap';
import { playIntro } from './js/intro.js';
import { initNav } from './js/nav.js';
import { initClock } from './js/clock.js';

const html = document.documentElement;

initClock();
const intro = playIntro(gsap);
initNav(gsap);

// vague 2 : scroll fluide (Lenis + ScrollTrigger), apparitions, curseur, moment interactif.
// Chargée à la fin de l'intro (pour ne pas lui voler d'images), ou dès le premier geste de scroll.
let wave2 = null;
const loadWave2 = () => wave2 || (wave2 = import('./js/scroll.js')
  .then(m => m.initScroll())
  .catch(() => html.classList.add('no-motion')));    // filet : tout reste visible si le module échoue
['wheel', 'touchstart', 'keydown', 'scroll'].forEach(t => addEventListener(t, loadWave2, { once: true, passive: true }));
intro.done.then(loadWave2);

// vague 3 : la planète 3D, après l'intro et l'événement load, pendant un moment de repos
const loaded = document.readyState === 'complete'
  ? Promise.resolve()
  : new Promise(r => addEventListener('load', r, { once: true }));
const idle = cb => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 2000 }) : setTimeout(cb, 250));
Promise.all([intro.done, loaded]).then(() => idle(() => {
  import('./js/planet/index.js').then(m => m.initPlanet()).catch(() => { html.dataset.tier = 'poster'; });
}));
