// Vague 3 : contrôleur de la planète 3D.
// Choisit un niveau selon l'appareil, lance le rendu dans un worker (OffscreenCanvas) ou, à défaut,
// sur le thread principal, puis fait un fondu enchaîné poster → 3D. Pause hors écran et onglet caché.
import { gsap } from 'gsap';
import { bus } from '../bus.js';

const RM = matchMedia('(prefers-reduced-motion: reduce)');

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();   // on libère aussitôt ce contexte de test
    return !!gl;
  } catch { return false; }
}

// niveaux : 'poster' (pas de 3D), 'low' (mobile / tactile), 'high' (ordinateur)
export function detectTier() {
  const forced = new URLSearchParams(location.search).get('niveau');
  if (['poster', 'low', 'high'].includes(forced)) return forced;
  if (RM.matches) return 'poster';
  const c = navigator.connection || {};
  // mode économie de données ou 2G : pas de 3D. La « 3g » de Chrome est une estimation (RTT ≥ 270 ms) qui
  // classe aussi beaucoup de 4G ouest-africaines : on y garde la 3D, en qualité allégée.
  if (c.saveData || /^(slow-2g|2g)$/.test(c.effectiveType || '')) return 'poster';
  const mem = navigator.deviceMemory, cores = navigator.hardwareConcurrency;
  if ((mem && mem < 4) || (cores && cores < 4)) return 'poster';
  if (!hasWebGL()) return 'poster';
  if (c.effectiveType === '3g') return 'low';
  return matchMedia('(max-width: 767px), (pointer: coarse)').matches ? 'low' : 'high';
}

export async function initPlanet() {
  const html = document.documentElement;
  const planet = document.querySelector('.planet');
  const media = planet.querySelector('.planet__media');
  const canvas = planet.querySelector('.planet__canvas');
  const poster = planet.querySelector('.planet__poster');
  const tier = detectTier();
  html.dataset.tier = tier;
  const info = (window.__planet = { tier, mode: 'poster', stats: null, reason: null, startAt: Math.round(performance.now()) });

  // niveau poster : même chorégraphie, sans 3D ; un flottement lent, en pause hors écran
  function floatPoster() {
    if (RM.matches) return;
    const float = gsap.to(media, { y: -10, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    new IntersectionObserver(([e]) => (e.isIntersecting ? float.play() : float.pause())).observe(planet);
  }
  if (tier === 'poster') { floatPoster(); return; }

  // taille de mise en page (offsetWidth ignore les transform du scroll)
  const box = () => {
    const width = planet.offsetWidth, height = planet.offsetHeight;
    return { width, height, fill: width / height > 1.5 ? 0.74 : 1.15 };
  };
  const options = {
    ...box(),
    dpr: window.devicePixelRatio || 1,
    dprCap: tier === 'high' ? 1.75 : 1.25,
    antialias: tier === 'high',
    segments: tier === 'high' ? 96 : 64,
    dust: tier === 'high' ? 900 : 400
  };

  let send = () => {}, stopped = false, tickers = [];
  const onMsg = m => {
    (info.log || (info.log = [])).push(m.type === 'fail' ? 'fail:' + m.reason : m.type);   // trace courte, lisible dans la console
    if (info.log.length > 12) info.log.shift();
    if (m.type === 'ready') { info.marks = m.marks; info.readyAt = Math.round(performance.now()); reveal(); }
    else if (m.type === 'stats') info.stats = m;
    else if (m.type === 'lost' || m.type === 'fail') fallback(m.reason || m.type);
  };

  try {
    if ('transferControlToOffscreen' in canvas && typeof Worker !== 'undefined') {
      const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      const off = canvas.transferControlToOffscreen();
      worker.onmessage = e => onMsg(e.data);
      worker.onerror = () => fallback('worker');
      worker.postMessage({ type: 'init', canvas: off, options }, [off]);
      send = m => worker.postMessage(m);
      info.mode = 'worker';
    } else {
      // navigateurs sans OffscreenCanvas : même moteur, piloté par gsap.ticker (une seule boucle)
      const { createEngine } = await import('./engine.js');
      const engine = await createEngine(canvas, options, onMsg, { external: true });
      send = m => engine.handle(m);
      const render = time => { if (engine.running) engine.frame(time * 1000); };
      gsap.ticker.add(render); tickers.push(render);
      info.mode = 'main';
    }
  } catch (err) { fallback(String(err)); return; }

  // fondu enchaîné : le poster et la 3D ont le même cadrage, rien ne saute
  function reveal() {
    if (stopped) return;
    gsap.to(canvas, { opacity: 1, duration: 0.9, ease: 'power2.out' });
    gsap.to(poster, { opacity: 0, duration: 0.9, delay: 0.15, ease: 'power2.inOut' });
    updateVisible();
  }

  // pause quand la planète sort de l'écran ou que l'onglet est caché
  let visible = true;
  const updateVisible = () => send({ type: 'visible', on: visible && !document.hidden });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; updateVisible(); }).observe(planet);
  document.addEventListener('visibilitychange', updateVisible);
  new ResizeObserver(() => send({ type: 'resize', ...box() })).observe(planet);

  // parallaxe au pointeur (souris seulement), lissée dans le moteur
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    addEventListener('pointermove', e => {
      bus.px = (e.clientX / innerWidth) * 2 - 1;
      bus.py = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }

  // transmission des entrées une fois par image, seulement si elles changent
  const last = { px: 0, py: 0, scroll: -1, vel: 0 };
  const forward = () => {
    bus.vel *= 0.9;                                   // la vitesse retombe quand le scroll s'arrête
    if (Math.abs(bus.vel) < 1) bus.vel = 0;
    if (bus.px !== last.px || bus.py !== last.py) { send({ type: 'pointer', x: bus.px, y: bus.py }); last.px = bus.px; last.py = bus.py; }
    if (bus.scroll !== last.scroll || bus.vel !== last.vel) { send({ type: 'scroll', p: bus.scroll, v: bus.vel }); last.scroll = bus.scroll; last.vel = bus.vel; }
  };
  gsap.ticker.add(forward); tickers.push(forward);

  // retour au poster : mouvement réduit activé, contexte WebGL perdu, erreur du worker
  function fallback(reason) {
    if (stopped) return;
    stopped = true;
    info.mode = 'poster'; info.reason = reason;
    send({ type: 'dispose' });                        // libère géométries, matériaux, textures et contexte
    tickers.forEach(t => gsap.ticker.remove(t));
    gsap.to(poster, { opacity: 1, duration: 0.4 });
    gsap.to(canvas, { opacity: 0, duration: 0.3 });
    html.dataset.tier = 'poster';
  }
  RM.addEventListener('change', e => { if (e.matches) fallback('reduced-motion'); });
}
