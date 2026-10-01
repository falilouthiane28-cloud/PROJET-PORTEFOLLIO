// Point d'entrée Vite : styles puis scripts, dans l'ordre d'origine.
import './styles/fonts.css';
import './styles/site.css';
import './styles/nav.css';
import './styles/hero.css';
import './styles/motion.css';
import './js/site.js';
import './js/nav.js';
import { initHero } from './js/hero/index.js';

initHero();

// système de mouvement des sections (hors hero) : chargé à la demande, en temps libre après le chargement,
// pour ne rien ajouter au JS initial ni au chemin du LCP
const idle = cb => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 2500 }) : setTimeout(cb, 300));
const loadMotion = () => idle(() => document.fonts.ready.then(() => import('./motion/index.js')).then(m => m.initMotion()).catch(() => {}));
if (document.readyState === 'complete') loadMotion(); else addEventListener('load', loadMotion, { once: true });
