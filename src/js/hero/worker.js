// Worker de rendu du hero : la scène est dessinée ici (OffscreenCanvas), hors du thread principal.
// Le thread principal ne fait que transmettre le scroll et le pointeur : il reste libre pour le défilement.
// Qualité adaptative : on mesure le temps entre images ; sous 50 i/s on baisse la densité de pixels,
// puis le nombre de particules ; on remonte prudemment quand la marge revient.
import { createScene } from './scene.js';
import { createQuality } from './quality.js';

let canvas = null, ctx = null, scene = null;
let dpr = 1, W = 1, H = 1;
let running = false, visible = false, rafId = 0, last = 0, disposed = false, readySent = false;
let input = { p: 0, vel: 0, ox: 0, oy: 0 };
let quality = null, statsAt = 0, frames = 0;

function applySize() {
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scene.resize(W, H);
}

function frame(now) {
  if (!running) return;
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
  if (last) {
    const change = quality.sample(now - last, now);
    if (change === 'dpr') { dpr = quality.dpr; applySize(); }
    else if (change === 'particles') scene.setParticles(quality.particles);
  }
  last = now;
  scene.step(dt, input);
  scene.draw(ctx);
  frames++;
  if (!readySent) { readySent = true; postMessage({ type: 'ready' }); }
  if (now - statsAt > 1000) {
    postMessage({ type: 'stats', fps: Math.round(1000 / quality.average()), dpr, particles: quality.particles, frames });
    statsAt = now;
  }
  rafId = requestAnimationFrame(frame);
}

function start() { if (running || disposed || !visible) return; running = true; last = 0; quality.reset(); rafId = requestAnimationFrame(frame); }
function stop() { running = false; cancelAnimationFrame(rafId); }

self.onmessage = ({ data: m }) => {
  switch (m.type) {
    case 'init':
      canvas = m.canvas; W = m.width; H = m.height;
      quality = createQuality({ dpr: m.dpr, dprCap: m.dprCap });
      dpr = quality.dpr;
      ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) { postMessage({ type: 'fail', reason: 'contexte 2D indisponible' }); return; }
      scene = createScene({ W, H, particles: quality.particles });
      applySize();
      visible = m.visible !== false; start();
      break;
    case 'resize': W = m.width; H = m.height; if (scene) applySize(); break;
    case 'input': input = m; break;
    case 'visible': visible = m.on; m.on ? start() : stop(); break;
    case 'dispose':
      // démontage : on arrête la boucle, on vide le canvas et on libère la mémoire du worker
      disposed = true; stop();
      if (ctx) ctx.clearRect(0, 0, W, H);
      canvas.width = canvas.height = 1;
      scene = ctx = canvas = null;
      postMessage({ type: 'disposed' });
      self.close();
      break;
  }
};
