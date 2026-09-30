// Outil de développement : rend la pose de repos de la planète en PNG transparent,
// avec exactement le même cadrage que la scène animée (le fondu poster -> 3D ne saute pas).
// Paramètres d'URL : w, h, fill.
import { WebGLRenderer, NeutralToneMapping } from 'three';
import { createPlanet } from '../src/js/planet/scene.js';

const q = new URLSearchParams(location.search);
const w = +q.get('w') || 1600, h = +q.get('h') || 700, fill = +q.get('fill') || 0.78;
const canvas = document.createElement('canvas');
canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
document.body.appendChild(canvas);
const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, premultipliedAlpha: true });
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = NeutralToneMapping;
renderer.setPixelRatio(1);
renderer.setSize(w, h, false);
const planet = createPlanet(renderer, { segments: 128, dust: 900 });
planet.resize(w, h, 1, fill);
if (q.has('noenv')) planet.scene.environment = null;
if (q.has('nolights')) planet.scene.children.filter(o => o.isLight).forEach(l => (l.visible = false));
planet.update(0);
renderer.render(planet.scene, planet.camera);
window.__png = canvas.toDataURL('image/png');
