// Moteur de rendu de la planète : fonctionne dans un worker (OffscreenCanvas) ou sur le thread principal.
// Qualité adaptative : mesure le temps entre images et ajuste la densité de pixels puis la poussière.
import { WebGLRenderer, NeutralToneMapping } from 'three';
import { createPlanet } from './scene.js';

/**
 * @param canvas  HTMLCanvasElement ou OffscreenCanvas
 * @param o       { width, height, dpr, dprCap, antialias, segments, dust, fill }
 * @param emit    fonction qui renvoie des messages au contrôleur ({ type: 'ready' | 'stats' | 'lost' | 'disposed' })
 * @param external true = la boucle est pilotée de l'extérieur (gsap.ticker sur le thread principal)
 */
export async function createEngine(canvas, o, emit, { external = false } = {}) {
  const t0 = performance.now(), marks = {};
  const renderer = new WebGLRenderer({
    canvas, alpha: true, premultipliedAlpha: true, antialias: o.antialias,
    powerPreference: 'high-performance', stencil: false
  });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NeutralToneMapping;     // garde les blancs nacrés et le violet fidèles
  renderer.toneMappingExposure = 1.0;

  let dpr = Math.min(o.dpr, o.dprCap), width = o.width, height = o.height, fill = o.fill;
  let dust = o.dust;
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);        // false : pas de style sur un OffscreenCanvas

  marks.renderer = Math.round(performance.now() - t0);
  const planet = createPlanet(renderer, { segments: o.segments, dust });
  marks.scene = Math.round(performance.now() - t0);
  planet.resize(width, height, dpr, fill);

  // compilation des shaders en parallèle (KHR_parallel_shader_compile) : pas d'à-coup à la première image
  await renderer.compileAsync(planet.scene, planet.camera);
  marks.compile = Math.round(performance.now() - t0);
  planet.update(0);
  renderer.render(planet.scene, planet.camera);
  marks.first = Math.round(performance.now() - t0);
  emit({ type: 'ready', marks });

  let running = false, last = 0, disposed = false;
  // --- qualité adaptative ---
  const samples = [];
  let lastChange = 0, goodStreak = 0, statsAt = 0, frameCount = 0;
  const DUST_STEPS = [900, 400, 0];

  function setDpr(v) {
    dpr = Math.max(1, Math.min(o.dprCap, Math.round(v * 100) / 100));
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    planet.resize(width, height, dpr, fill);
  }

  function adapt(now) {
    if (samples.length < 60 || now - lastChange < 1500) return;
    const avg = samples.reduce((s, x) => s + x, 0) / samples.length;
    if (avg > 20) {                                  // sous 50 i/s : on allège
      goodStreak = 0;
      if (dpr > 1) setDpr(dpr - 0.25);
      else {
        const i = DUST_STEPS.indexOf(dust);
        if (i < DUST_STEPS.length - 1) { dust = DUST_STEPS[i + 1]; planet.setDust(dust); }
      }
      lastChange = now; samples.length = 0;
    } else if (avg < 15.5) {                         // large marge : on remonte prudemment
      if (++goodStreak >= 3 && now - lastChange > 4000) {
        const i = DUST_STEPS.indexOf(dust);
        if (i > 0) { dust = DUST_STEPS[i - 1]; planet.setDust(dust); }
        else if (dpr < o.dprCap) setDpr(dpr + 0.25);
        lastChange = now; goodStreak = 0; samples.length = 0;
      }
    } else goodStreak = 0;
  }

  function frame(now) {
    if (!running) return;
    try { render(now); } catch (err) {
      // une erreur dans la boucle l'arrêterait en silence : on la remonte et on bascule sur le poster
      stop(); emit({ type: 'fail', reason: String(err && err.stack || err).slice(0, 300) });
    }
  }
  function render(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    if (last) { samples.push(now - last); if (samples.length > 90) samples.shift(); }
    last = now;
    planet.update(dt);
    renderer.render(planet.scene, planet.camera);
    frameCount++;
    adapt(now);
    if (now - statsAt > 1000) {
      const avg = samples.length ? samples.reduce((s, x) => s + x, 0) / samples.length : 16.7;
      emit({ type: 'stats', fps: Math.round(1000 / avg), dpr, dust, frames: frameCount });
      statsAt = now;
    }
  }

  function start() {
    if (running || disposed) return;
    running = true; last = 0; samples.length = 0;
    if (!external) renderer.setAnimationLoop(frame);
  }
  function stop() {
    running = false;
    if (!external) renderer.setAnimationLoop(null);
  }

  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stop(); emit({ type: 'lost' }); });

  function dispose() {
    if (disposed) return;
    disposed = true; stop();
    planet.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    emit({ type: 'disposed' });
  }

  function handle(m) {
    switch (m.type) {
      case 'resize':
        width = m.width; height = m.height; fill = m.fill;
        renderer.setSize(width, height, false);
        planet.resize(width, height, dpr, fill);
        if (!running) { planet.update(0); renderer.render(planet.scene, planet.camera); }
        break;
      case 'pointer': planet.state.tpx = m.x; planet.state.tpy = m.y; break;
      case 'scroll': planet.state.tscroll = m.p; planet.state.tvel = m.v; break;
      case 'visible': m.on ? start() : stop(); break;
      case 'dispose': dispose(); break;
    }
  }

  return { handle, frame, start, stop, dispose, get running() { return running; } };
}
