// Worker de rendu du hero : la scène est dessinée ici (OffscreenCanvas), hors du thread principal.
// Le thread principal ne fait que transmettre le scroll et le pointeur : il reste libre pour le défilement.
// Qualité adaptative : on mesure le temps entre images ; sous 50 i/s on baisse la densité de pixels,
// puis le nombre de particules ; on remonte prudemment quand la marge revient.
import { createScene } from './scene.js';

let canvas = null, ctx = null, scene = null;
let dpr = 1, dprCap = 1.75, W = 1, H = 1;
let running = false, visible = false, rafId = 0, last = 0, disposed = false, readySent = false;
let input = { p: 0, vel: 0, ox: 0, oy: 0 };
const samples = [];
let lastChange = 0, goodStreak = 0, statsAt = 0, frames = 0;
const PARTICLE_STEPS = [2800, 1800, 1100];
let level = 0;

function applySize() {
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scene.resize(W, H);
}

function adapt(now) {
  if (samples.length < 60 || now - lastChange < 1500) return;
  const avg = samples.reduce((s, x) => s + x, 0) / samples.length;
  if (avg > 20) {                                   // sous 50 i/s : on allège
    goodStreak = 0;
    if (dpr > 1) { dpr = Math.max(1, dpr - 0.25); applySize(); }
    else if (level < PARTICLE_STEPS.length - 1) scene.setParticles(PARTICLE_STEPS[++level]);
    lastChange = now; samples.length = 0;
  } else if (avg < 15.5) {                          // large marge : on remonte, une marche à la fois
    if (++goodStreak >= 3 && now - lastChange > 4000) {
      if (level > 0) scene.setParticles(PARTICLE_STEPS[--level]);
      else if (dpr < dprCap) { dpr = Math.min(dprCap, dpr + 0.25); applySize(); }
      lastChange = now; goodStreak = 0; samples.length = 0;
    }
  } else goodStreak = 0;
}

function frame(now) {
  if (!running) return;
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
  if (last) { samples.push(now - last); if (samples.length > 90) samples.shift(); }
  last = now;
  scene.step(dt, input);
  scene.draw(ctx);
  frames++;
  if (!readySent) { readySent = true; postMessage({ type: 'ready' }); }
  adapt(now);
  if (now - statsAt > 1000) {
    const avg = samples.length ? samples.reduce((s, x) => s + x, 0) / samples.length : 16.7;
    postMessage({ type: 'stats', fps: Math.round(1000 / avg), dpr, particles: PARTICLE_STEPS[level], frames });
    statsAt = now;
  }
  rafId = requestAnimationFrame(frame);
}

function start() { if (running || disposed || !visible) return; running = true; last = 0; samples.length = 0; rafId = requestAnimationFrame(frame); }
function stop() { running = false; cancelAnimationFrame(rafId); }

self.onmessage = ({ data: m }) => {
  switch (m.type) {
    case 'init':
      canvas = m.canvas; W = m.width; H = m.height; dprCap = m.dprCap;
      dpr = Math.min(m.dpr, dprCap);
      ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) { postMessage({ type: 'fail', reason: 'contexte 2D indisponible' }); return; }
      scene = createScene({ W, H, particles: PARTICLE_STEPS[0] });
      applySize();
      visible = true; start();
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
