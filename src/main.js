// Point d'entrée Vite : styles puis scripts, dans l'ordre d'origine.
import './styles/fonts.css';
import './styles/site.css';
import './styles/nav.css';
import './styles/hero.css';
import './styles/motion.css';
import './styles/agents.css';
import './styles/responsive.css';
import './styles/loader.css';
import './js/site.js';
import './js/nav.js';
import { initHero } from './js/hero/index.js';
import { initAgentsLoop } from './js/agents/loop.js';
import { initFilm } from './js/agents/film.js';
import { initCrew } from './js/agents/crew.js';

initHero();

const idle = cb => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 2500 }) : setTimeout(cb, 300));

// section Saturn Agents, sous la ligne de flottaison : une tâche chacune, en temps libre, hors de la tâche du hero
// (mesuré sur Lighthouse mobile : dans la même tâche, la tâche longue du script principal prenait ~55 ms de plus)
[initAgentsLoop, initFilm, initCrew].forEach(fn => idle(fn));

// système de mouvement des sections (hors hero) : chargé à la demande, en temps libre après le chargement,
// pour ne rien ajouter au JS initial ni au chemin du LCP
// L'initialisation (découpes, ScrollTriggers) attend un moment calme : 400 ms sans défilement. Mesuré sur mobile
// (Slow 4G, CPU ×4) : chargée pendant le premier geste, elle faisait tomber le premier scroll de 54-58 à 49-52 i/s.
function whenQuiet(cb, ms = 400) {
  let t = setTimeout(done, ms);
  const bump = () => { clearTimeout(t); t = setTimeout(done, ms); };
  const evs = ['scroll', 'wheel', 'touchmove'];
  evs.forEach(e => addEventListener(e, bump, { passive: true }));
  function done() { evs.forEach(e => removeEventListener(e, bump)); idle(cb); }
}
// … et la fin de l'intro du hero : en 4G, le load arrive pendant l'intro et l'initialisation lui volait des images
const loadMotion = () => idle(() => Promise.all([document.fonts.ready, window.__hero?.introDone])
  .then(() => import('./motion/index.js'))
  .then(m => whenQuiet(() => m.initMotion())).catch(e => console.warn('[mouvement] non chargé', e)));
if (document.readyState === 'complete') loadMotion(); else addEventListener('load', loadMotion, { once: true });
