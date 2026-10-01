// Contrôleur du hero « l'alignement des mondes ».
// - intro : une timeline GSAP maîtresse (anneau → la scène émerge → sur-titre → texte → repère → nav) ;
//   le titre, lui, monte en CSS dès le premier rendu (LCP sans attendre le JS)
// - scroll : progression lissée (ScrollTrigger + Lenis), bandes de texte avec parallaxe douce,
//   vitesse du scroll transmise à l'anneau, sortie en douceur vers la section suivante
// - pointeur : parallaxe lissée de la scène, bouton principal magnétique (souris seulement)
// - rendu : la scène tourne dans un worker (OffscreenCanvas) ; le poster couvre l'attente, puis fondu enchaîné
// Une seule horloge sur le thread principal : gsap.ticker.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { createScene, layoutFor, PLANETS, align, scaleAt, project, smooth, TILT, E } from './scene.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const FINE = matchMedia('(hover: hover) and (pointer: fine)');
// les 5 conditions du hero statique, identiques au CSS (site.css et hero.css)
const GATES = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)'
];

/* ---------- découpe des titres des bandes 2 et 3 (effet d'origine, mot à mot / lettre à lettre) ---------- */
function split(el, seed, fx, spread) {
  const r = rng(seed);
  const sr = document.createElement('span');
  sr.className = 'sr'; sr.textContent = el.textContent;
  const vis = document.createElement('span');
  vis.setAttribute('aria-hidden', 'true');
  const words = [];
  const walk = (node, into) => {
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { into.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          [...part].forEach(ch => { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; w.appendChild(c); });
          into.appendChild(w); words.push(w);
        });
      } else if (n.nodeType === 1) {
        const clone = document.createElement(n.tagName); walk(n, clone); into.appendChild(clone);
      }
    });
  };
  walk(el, vis);
  el.textContent = ''; el.append(sr, vis);
  const chars = words.flatMap(w => [...w.children]);
  if (fx === 'align') {
    chars.forEach((c, i) => {
      c.style.setProperty('--th', (i / chars.length * spread + r() * 0.06).toFixed(3));
      c.style.setProperty('--jx', ((r() < 0.5 ? -1 : 1) * (40 + r() * 110)).toFixed(0) + 'px');
    });
  } else {
    words.forEach((w, i) => w.style.setProperty('--th', (i / Math.max(1, words.length) * 0.5).toFixed(3)));
  }
}

// appareil modeste ou économie de données : pas d'animation continue (poster + même chorégraphie)
function weakDevice() {
  const forced = new URLSearchParams(location.search).get('niveau');   // tests : ?niveau=poster ou ?niveau=live
  if (forced) return forced === 'poster';
  const c = navigator.connection || {};
  const mem = navigator.deviceMemory, cores = navigator.hardwareConcurrency;
  return !!c.saveData || (mem && mem < 4) || (cores && cores < 4);
}

export function initHero() {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.ticker.lagSmoothing(0);

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const hero = $('.hero'), stage = $('.hero__stage'), sceneEl = $('.hero__scene');
  const posterEl = $('.hero__poster'), orbit = $('.hero__orbit ellipse'), meta = $('.hero__meta');
  const chips = $$('.chip'), chipBox = $('.chips');
  const info = (window.__hero = { mode: null, tier: null, stats: null, introDoneAt: null });
  let canvas = $('#cosmos');

  /* ---------- texte des bandes : découpe des bandes 2 et 3 (invisibles au départ) reportée après l'intro ---------- */
  let splitDone = false;
  const splitBands = () => {
    if (splitDone) return;
    splitDone = true;
    let seed = 11;
    $$('.band').forEach(b => $$('.split', b).forEach(el => split(el, seed++, b.dataset.fx, parseFloat(b.dataset.spread || '0.5'))));
  };
  const bands = $$('.band').map((el, i, all) => ({
    el, a: +el.dataset.a, b: +el.dataset.b, first: i === 0, last: i === all.length - 1,
    ramp: el.dataset.ramp ? +el.dataset.ramp : null, op: -1, k: -1, live: null, y: null
  }));

  /* ---------- Lenis : défilement doux à la souris (au doigt, le défilement reste natif) ---------- */
  let lenis = null;
  const lenisRaf = t => lenis.raf(t * 1000);
  function startLenis() {
    if (lenis || RM.matches || !FINE.matches) return;
    lenis = new Lenis({ autoRaf: false, lerp: 0.1, anchors: { offset: -84 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisRaf);
  }
  function stopLenis() { if (!lenis) return; gsap.ticker.remove(lenisRaf); lenis.destroy(); lenis = null; }
  startLenis();

  /* ---------- état partagé, lissé à chaque image ---------- */
  const st = { target: 0, shown: 0, vel: 0, px: 0, py: 0, ox: 0, oy: 0 };
  let L = { W: 1, H: 1, cx: 0, cy: 0, R: 1 };
  let chipSize = [], chipCache = chips.map(() => ({ x: null, y: null, o: null }));
  let isStatic = null, metaGone = null, exitCache = null, sent = null;
  let worker = null, mainScene = null, mainCtx = null, sceneReady = false;

  // mesures (une fois au démarrage et au redimensionnement, jamais dans la boucle)
  function measure() {
    const box = isStatic ? sceneEl : stage;
    const W = box.clientWidth, H = box.clientHeight;
    L = { W, H, ...layoutFor(W, H) };
    stage.style.setProperty('--cx', L.cx.toFixed(1) + 'px');
    stage.style.setProperty('--cy', L.cy.toFixed(1) + 'px');
    stage.style.setProperty('--R', L.R.toFixed(2) + 'px');
    // l'anneau du préchargement épouse le bord extérieur de l'anneau de Saturne
    const rx = 2.22 * L.R;
    orbit.setAttribute('cx', L.cx); orbit.setAttribute('cy', L.cy);
    orbit.setAttribute('rx', rx); orbit.setAttribute('ry', rx * E);
    orbit.setAttribute('transform', `rotate(${(TILT * 180 / Math.PI).toFixed(2)} ${L.cx} ${L.cy})`);
    chipBox.classList.toggle('is-tight', L.R * 1.7 < 165);
    chipSize = chips.map(c => [c.offsetWidth, c.offsetHeight]);
    chipCache.forEach(c => { c.x = null; c.o = null; });
    sent = null;
  }

  /* ---------- étiquettes : à la position finale de chaque monde, elles apparaissent quand il s'aligne ---------- */
  function placeChips(p) {
    const Rs = L.R * scaleAt(p);
    const showChips = isStatic || info.tier === 'live';
    PLANETS.forEach((pl, i) => {
      const [x0, y0] = project(L.cx + st.ox, L.cy + st.oy, pl.f * Rs, Math.PI);
      const [cw, ch] = chipSize[i] || [0, 0];
      const r = Rs * pl.size, below = i % 2 === 0;
      const x = Math.round(x0 - cw / 2), y = Math.round(below ? y0 + r + 12 : y0 - r - 12 - ch);
      const o = isStatic ? 1 : showChips ? Math.round(align(i, p) * 100) / 100 : 0;
      const c = chipCache[i];
      if (c.x !== x || c.y !== y) { chips[i].style.transform = `translate(${x}px,${y}px)`; c.x = x; c.y = y; }
      if (c.o !== o) { chips[i].style.opacity = o; c.o = o; }
    });
  }

  /* ---------- bandes : rythme d'origine + légère parallaxe (scroll et pointeur) ---------- */
  function updateBands(p) {
    bands.forEach(b => {
      const f = Math.min(0.05, (b.b - b.a) / 3);
      const op = (b.first ? 1 : smooth(p, b.a, b.a + f)) * (b.last ? 1 : 1 - smooth(p, b.b - f, b.b));
      const ramp = b.ramp || Math.min(0.06, (b.b - b.a) * 0.35);
      const k = b.first ? 1 : clamp((p - b.a) / ramp, 0, 1);
      const o2 = Math.round(op * 1000) / 1000;
      if (Math.abs(o2 - b.op) > 0.001) { b.el.style.opacity = o2; b.op = o2; }
      if (Math.abs(k - b.k) > 0.008 || (k === 1 && b.k !== 1) || (k === 0 && b.k !== 0)) { b.el.style.setProperty('--k', k.toFixed(3)); b.k = k; }
      const live = op > 0.5;
      if (live !== b.live) { b.el.classList.toggle('is-live', live); b.live = live; }
      // parallaxe : le texte monte un peu plus vite que la scène pendant sa bande
      const local = clamp((p - b.a) / (b.b - b.a), 0, 1);
      const y = Math.round(((b.first ? -local * 18 : (0.5 - local) * 36) - st.oy * 0.3) * 10) / 10;
      const x = Math.round(-st.ox * 0.3 * 10) / 10;
      if (op > 0 && (y !== b.y || x !== b.x)) { b.el.style.transform = `translate3d(${x}px,${y}px,0)`; b.y = y; b.x = x; }
    });
    const gone = p > 0.04;
    if (gone !== metaGone) { meta.classList.toggle('is-gone', gone); metaGone = gone; }
  }

  /* ---------- sortie : la scène remonte et s'estompe avant la section suivante (pas de coupure) ---------- */
  function updateExit(p) {
    const e = Math.round(smooth(p, 0.92, 1) * 1000) / 1000;
    if (e === exitCache) return;
    exitCache = e;
    sceneEl.style.transform = e ? `translate3d(0,${(-e * 5).toFixed(2)}vh,0) scale(${(1 - 0.03 * e).toFixed(4)})` : '';
    sceneEl.style.opacity = e ? (1 - 0.45 * e).toFixed(3) : '';
  }

  /* ---------- la boucle unique (gsap.ticker) ---------- */
  function tick(time, deltaMs) {
    if (isStatic) return;                                       // hero statique : rien à animer en continu
    const dt = Math.min(100, deltaMs);
    const k = 1 - Math.pow(1 - 0.12, dt / 16.667);              // lissage indépendant de la fréquence
    st.shown += (st.target - st.shown) * k;
    if (Math.abs(st.target - st.shown) < 0.0004) st.shown = st.target;
    st.vel *= Math.pow(0.9, dt / 16.667);                       // la vitesse retombe quand le scroll s'arrête
    if (Math.abs(st.vel) < 1) st.vel = 0;
    const kp = 1 - Math.pow(1 - 0.08, dt / 16.667);              // pointeur : plus lent, plus doux
    st.ox += (st.px * 14 - st.ox) * kp;
    st.oy += (st.py * 10 - st.oy) * kp;
    if (Math.abs(st.px * 14 - st.ox) < 0.01) st.ox = st.px * 14;
    if (Math.abs(st.py * 10 - st.oy) < 0.01) st.oy = st.py * 10;

    const p = st.shown;
    updateBands(p);
    placeChips(p);
    updateExit(p);
    const input = { p, vel: st.vel, ox: st.ox, oy: st.oy };
    if (worker && (!sent || sent.p !== p || sent.vel !== st.vel || sent.ox !== st.ox || sent.oy !== st.oy)) {
      worker.postMessage({ type: 'input', ...input }); sent = input;
    }
    if (mainScene && visible && !document.hidden) { mainScene.step(dt / 1000, input); mainScene.draw(mainCtx); }
  }

  /* ---------- rendu de la scène ---------- */
  let visible = true;
  const postVisible = () => worker && worker.postMessage({ type: 'visible', on: visible && !document.hidden });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; postVisible(); }).observe(stage);
  document.addEventListener('visibilitychange', postVisible);

  function freshCanvas() {
    // un canvas transféré au worker ne peut plus être repris : on le remplace par un neuf
    const c = canvas.cloneNode(false);
    c.removeAttribute('style');
    canvas.replaceWith(c);
    canvas = c;
  }
  function teardown() {
    if (worker) { worker.postMessage({ type: 'dispose' }); worker = null; freshCanvas(); }
    mainScene = mainCtx = null;
    sceneReady = false;
  }

  // dessin unique (hero statique) : même code, sur le thread principal, une image, comme à l'origine
  function drawStatic() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(L.W * dpr); canvas.height = Math.round(L.H * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sc = createScene({ W: L.W, H: L.H, particles: L.W < 720 ? 1300 : 2800 });
    sc.setStatic();
    sc.draw(ctx);
  }

  function startLive() {
    if (worker || mainScene || isStatic || info.tier !== 'live') return;
    gsap.set(canvas, { opacity: 0 });
    const opts = { width: L.W, height: L.H, dpr: window.devicePixelRatio || 1, dprCap: 1.75 };
    if ('transferControlToOffscreen' in canvas) {
      worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data: m }) => {
        if (m.type === 'ready') crossfade();
        else if (m.type === 'stats') info.stats = m;
        else if (m.type === 'fail') { info.tier = 'poster'; teardown(); }
      };
      worker.onerror = () => { info.tier = 'poster'; teardown(); };
      const off = canvas.transferControlToOffscreen();
      worker.postMessage({ type: 'init', canvas: off, ...opts }, [off]);
      sent = null;
      info.mode = 'worker';
    } else {
      // navigateurs sans OffscreenCanvas : même scène, dessinée sur gsap.ticker (une seule boucle)
      const dpr = Math.min(opts.dpr, 1.5);
      canvas.width = Math.round(L.W * dpr); canvas.height = Math.round(L.H * dpr);
      mainCtx = canvas.getContext('2d'); mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mainScene = createScene({ W: L.W, H: L.H, particles: 1800 });
      info.mode = 'main';
      crossfade();
    }
  }
  function crossfade() {
    if (sceneReady) return;
    sceneReady = true;
    gsap.to(canvas, { opacity: 1, duration: 0.9, ease: 'power2.out' });
    gsap.to(posterEl, { opacity: 0, duration: 0.9, delay: 0.1, ease: 'power2.inOut' });
  }

  /* ---------- scroll du hero ---------- */
  let heroST = null;
  function createScroll() {
    heroST = ScrollTrigger.create({
      trigger: hero, start: 'top top', end: 'bottom bottom',
      onUpdate: self => { st.target = self.progress; st.vel = self.getVelocity(); },
      onRefresh: self => { st.target = self.progress; }
    });
    st.target = st.shown = heroST.progress;
  }

  /* ---------- bascule hero statique / animé, en direct (rotation, redimensionnement, préférence) ---------- */
  const MQLS = GATES.map(q => matchMedia(q));
  let liveRequested = false;
  function applyMode() {
    const stat = MQLS.some(m => m.matches);
    if (stat === isStatic) return;
    isStatic = stat;
    info.mode = stat ? 'statique' : 'poster';
    teardown();
    if (stat) {
      if (heroST) { heroST.kill(); heroST = null; }
      bands.forEach(b => { b.el.style.removeProperty('transform'); b.y = b.x = null; });
      sceneEl.style.transform = sceneEl.style.opacity = ''; exitCache = null;
      st.target = st.shown = 1;
      measure(); drawStatic(); placeChips(1);
      gsap.set(posterEl, { clearProps: 'opacity' });
    } else {
      info.tier = weakDevice() ? 'poster' : 'live';
      bands.forEach(b => { b.op = b.k = -1; b.live = null; });
      measure(); createScroll();
      gsap.set(posterEl, { opacity: 1 });
      if (liveRequested) startLive();
    }
    RM.matches ? stopLenis() : startLenis();
  }
  // (le mouvement réduit fait partie des conditions : l'activer en direct démonte aussi le rendu animé)
  MQLS.forEach(m => m.addEventListener('change', applyMode));
  applyMode();
  gsap.ticker.add(tick);

  new ResizeObserver(() => {
    measure();
    if (isStatic) { drawStatic(); placeChips(1); }
    else if (worker) worker.postMessage({ type: 'resize', width: L.W, height: L.H });
    else if (mainScene) { const dpr = Math.min(window.devicePixelRatio || 1, 1.5); canvas.width = Math.round(L.W * dpr); canvas.height = Math.round(L.H * dpr); mainCtx.setTransform(dpr, 0, 0, dpr, 0, 0); mainScene.resize(L.W, L.H); }
  }).observe(stage);
  document.fonts?.ready.then(() => { measure(); ScrollTrigger.refresh(); });

  /* ---------- pointeur : parallaxe lissée et bouton magnétique (souris seulement) ---------- */
  if (FINE.matches) {
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || isStatic) return;
      st.px = (e.clientX / innerWidth) * 2 - 1;
      st.py = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
    const btn = $('.band--3 .btn--accent');
    if (btn) {
      let mx = null, my = null;
      btn.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        if (!mx) { mx = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' }); my = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' }); }
        const r = btn.getBoundingClientRect();
        mx(clamp((e.clientX - (r.left + r.width / 2)) * 0.25, -10, 10));
        my(clamp((e.clientY - (r.top + r.height / 2)) * 0.3, -8, 8));
      });
      btn.addEventListener('pointerleave', () => { if (mx) { mx(0); my(0); } });
    }
  }

  /* ---------- l'intro : une timeline maîtresse ---------- */
  const intro = playIntro();
  // le rendu animé démarre après l'intro (il ne lui vole aucune image), ou dès le premier geste de scroll
  const requestLive = () => {
    splitBands();                                   // au premier geste de scroll, les bandes doivent être prêtes
    if (liveRequested) return;
    liveRequested = true;
    const idle = cb => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 200));
    idle(startLive);
  };
  intro.done.then(() => { splitBands(); requestLive(); });
  ['wheel', 'touchstart', 'keydown'].forEach(t => addEventListener(t, requestLive, { once: true, passive: true }));

  function playIntro() {
    // mobile : le paragraphe et les boutons restent visibles dès le premier rendu. Le titre étant masqué mot
    // à mot, le paragraphe devient le plus grand bloc de texte, donc l'élément LCP : il ne doit pas attendre le JS.
    const heroParts = isStatic ? ['.hero__static .eyebrow'] : ['.band--1 .eyebrow', '.band--1 .lead'];
    const nav = $('#nav'), veil = $('.hero__veil');
    if (!html.classList.contains('intro') || html.classList.contains('intro-skip')) {
      html.classList.remove('intro');
      info.introDoneAt = Math.round(performance.now());
      return { done: Promise.resolve() };
    }
    window.__introStarted = true;
    let resolveDone;
    const done = new Promise(r => (resolveDone = r));
    const targets = [...heroParts, '.hero__meta', nav, veil];
    gsap.set(targets, { willChange: 'transform, opacity' });

    // créée en pause : elle démarre deux images plus tard, une fois l'initialisation du hero terminée
    // (sinon sa première image tombe pendant cette tâche et saute)
    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'expo.out' },
      onComplete() {
        // on rend la main au CSS et on retire les will-change
        gsap.set(targets, { clearProps: 'transform,opacity,willChange' });
        gsap.set(veil, { autoAlpha: 0 });
        info.introDoneAt = Math.round(performance.now());
        resolveDone();
      }
    });
    tl.fromTo(orbit, { strokeDashoffset: 1, opacity: 0.9 }, { strokeDashoffset: 0, duration: 1.1, ease: 'expo.inOut' }, 0)
      // la scène émerge de la nuit : le voile se dissout et s'ouvre depuis Saturne
      .fromTo(veil, { opacity: 1, scale: 1 }, { opacity: 0, scale: 1.35, duration: 1.7 }, 0.25)
      .fromTo(heroParts[0], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1 }, 0.6);
    heroParts.slice(1).forEach((sel, i) => tl.fromTo(sel, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.1 }, 0.85 + i * 0.12));
    tl.fromTo('.hero__meta', { opacity: 0 }, { opacity: 1, duration: 1, ease: 'power2.out' }, 1.15)
      // la nav est centrée par translate(-50%) : on le reprend explicitement (x:0 + xPercent) pour ne pas le doubler
      .fromTo(nav, { opacity: 0, x: 0, xPercent: -50, yPercent: -80 }, { opacity: 1, xPercent: -50, yPercent: 0, duration: 1.2 }, 1.3)
      .to(orbit, { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 1.45);
    // les états de départ sont maintenant en styles inline : la classe CSS peut partir
    html.classList.remove('intro');
    // revue au ralenti : ?ralenti=4 joue l'intro 4 fois plus lentement
    const slow = +new URLSearchParams(location.search).get('ralenti');
    if (slow > 1) tl.timeScale(1 / slow);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      info.introStartAt = Math.round(performance.now());   // repère pour les mesures
      tl.play(0);
    }));
    return { done };
  }
}
