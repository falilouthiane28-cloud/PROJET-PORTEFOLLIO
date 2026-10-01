// Outil de développement : rend l'état de départ de la scène du hero en PNG transparent, sans étoiles,
// recadré sur la boîte 9,8R × 6,8R centrée sur Saturne (celle que hero.css utilise pour poser le poster).
// Paramètre d'URL : R (rayon de référence en pixels).
import { createScene } from '../src/js/hero/scene.js';

const R = +new URLSearchParams(location.search).get('R') || 200;
const W = Math.round(9.8 * R), H = Math.round(6.8 * R);
const canvas = document.createElement('canvas');
canvas.width = W; canvas.height = H;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');
const sc = createScene({ W, H, particles: 2800 });
// même état que la première image du worker : temps 0, progression 0, pas de pointeur
Object.assign(sc, { W, H, cx: 4.9 * R, cy: 3.4 * R, R });
sc.draw(ctx, { drawStars: false });
window.__png = canvas.toDataURL('image/png');
