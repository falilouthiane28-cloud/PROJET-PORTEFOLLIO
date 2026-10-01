// Point d'entrée Vite : styles puis scripts, dans l'ordre d'origine.
import './styles/fonts.css';
import './styles/site.css';
import './styles/nav.css';
import './styles/hero.css';
import './js/site.js';
import './js/nav.js';
import { initHero } from './js/hero/index.js';

initHero();
