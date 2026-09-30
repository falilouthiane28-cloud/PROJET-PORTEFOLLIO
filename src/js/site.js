(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const smooth = (p, e0, e1) => { const t = clamp((p - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  const RM = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- horloge de Dakar (UTC+0 toute l'année) ---------- */
  const clocks = $$('.clock');
  let lastClock = '';
  function tickClock() {
    const d = new Date();
    const s = String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
    if (s !== lastClock) { lastClock = s; clocks.forEach(c => (c.textContent = s)); }
  }
  tickClock(); setInterval(tickClock, 10000);

  /* ---------- découpe des titres en mots et lettres ---------- */
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
  let seed = 11;
  $$('.band').forEach(b => $$('.split', b).forEach(el => split(el, seed++, b.dataset.fx, parseFloat(b.dataset.spread || '0.5'))));

  /* ---------- les bandes du hero ---------- */
  const hero = $('.hero');
  const bands = $$('.band').map((el, i, all) => ({
    el, a: +el.dataset.a, b: +el.dataset.b, first: i === 0, last: i === all.length - 1,
    ramp: el.dataset.ramp ? +el.dataset.ramp : null, op: -1, k: -1, live: null
  }));
  const meta = $('.hero__meta');
  let metaGone = null;
  let loadK = 0; const loadStart = performance.now();

  function updateBands(p, now) {
    loadK = clamp((now - loadStart - 250) / 1400, 0, 1);
    const lk = 1 - Math.pow(1 - loadK, 3);
    bands.forEach(b => {
      const f = Math.min(0.05, (b.b - b.a) / 3);
      const op = (b.first ? 1 : smooth(p, b.a, b.a + f)) * (b.last ? 1 : 1 - smooth(p, b.b - f, b.b));
      const ramp = b.ramp || Math.min(0.06, (b.b - b.a) * 0.35);
      let k = clamp((p - b.a) / ramp, 0, 1);
      if (b.first) k = lk;
      const o2 = Math.round(op * 1000) / 1000;
      if (Math.abs(o2 - b.op) > 0.001) { b.el.style.opacity = o2; b.op = o2; }
      if (Math.abs(k - b.k) > 0.008 || (k === 1 && b.k !== 1) || (k === 0 && b.k !== 0)) { b.el.style.setProperty('--k', k.toFixed(3)); b.k = k; }
      const live = op > 0.5;
      if (live !== b.live) { b.el.classList.toggle('is-live', live); b.live = live; }
    });
    const gone = p > 0.04;
    if (gone !== metaGone) { meta.classList.toggle('is-gone', gone); metaGone = gone; }
  }

  function heroProgress() {
    const range = hero.offsetHeight - innerHeight;
    return range > 0 ? clamp(-hero.getBoundingClientRect().top / range, 0, 1) : 1;
  }

  /* ---------- la scène ---------- */
  const Cosmos = window.Cosmos;
  Cosmos.init($('#cosmos'), $$('.chip'), $('.chips'));
  Cosmos.onFrame = updateBands;

  /* ---------- les 5 conditions du hero statique (identiques au CSS) ---------- */
  const GATES = [
    '(max-width: 720px)',
    '(orientation: portrait) and (max-width: 1024px)',
    '(orientation: portrait) and (pointer: coarse)',
    '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
    '(prefers-reduced-motion: reduce)'
  ];
  const MQLS = GATES.map(q => matchMedia(q));
  let scrubOn = null;
  const onHeroScroll = () => Cosmos.setProgress(heroProgress());
  function applyHeroMode() {
    const stat = MQLS.some(m => m.matches);
    if (stat === !scrubOn && scrubOn !== null) return;
    scrubOn = !stat;
    if (stat) {
      removeEventListener('scroll', onHeroScroll);
      Cosmos.setStatic(true);
    } else {
      bands.forEach(b => { b.op = -1; b.k = -1; b.live = null; });
      Cosmos.setStatic(false);
      requestAnimationFrame(() => { Cosmos.resize(); onHeroScroll(); });
      addEventListener('scroll', onHeroScroll, { passive: true });
    }
  }
  MQLS.forEach(m => m.addEventListener('change', applyHeroMode));
  applyHeroMode();

  new IntersectionObserver(([e]) => Cosmos.setVisible(e.isIntersecting)).observe($('.hero__stage'));

  /* ---------- pause : onglet caché ---------- */
  document.addEventListener('visibilitychange', () => {
    const h = document.hidden;
    document.body.classList.toggle('paused', h);
    Cosmos.setPaused(h);
  });

  /* ---------- entrées à l'apparition ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      io.unobserve(el);
      setTimeout(() => el.classList.add('done'), 1500);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  const mio = new IntersectionObserver(([e]) => e.target.classList.toggle('on', e.isIntersecting));
  mio.observe($('.marquee'));

  /* ---------- traits qui se dessinent au scroll ---------- */
  const drawables = [$('.orbits'), $('#timeline'), $('.footer__word')].map(el => ({ el, v: -1 }));
  const steps = $$('#timeline li');
  let drawQueued = false;
  function drawLines() {
    drawQueued = false;
    const vh = innerHeight;
    drawables.forEach(d => {
      const r = d.el.getBoundingClientRect();
      const v = RM.matches ? 1 : Math.round(clamp((vh * 0.92 - r.top) / (vh * 0.6), 0, 1) * 1000) / 1000;
      if (v !== d.v) {
        d.v = v; d.el.style.setProperty('--draw', v);
        if (d.el.id === 'timeline') steps.forEach((li, i) => li.classList.toggle('is-on', v >= (i + 0.35) / 4));
      }
    });
  }
  addEventListener('scroll', () => { if (!drawQueued) { drawQueued = true; requestAnimationFrame(drawLines); } }, { passive: true });
  addEventListener('resize', drawLines);
  drawLines();

  /* ---------- le moment interactif : mettre sa planète en orbite ---------- */
  const launch = $('#launch'), btn = $('#launchBtn'), cta = $('#contact');
  const orbitSvg = $('.launch__orbit', launch), done = $('.launch__done', launch), label = $('.launch__label', launch);
  let P = 0, holding = false, finished = false, lrId = null, lLast = 0, spin = 0, lVisible = false;
  let geo = { cx: 0, cy: 0, rx: 0, ry: 0 };
  function measure() {
    const r = orbitSvg.getBoundingClientRect(), s = r.width / 400;
    geo = { cy: 80 * s, rx: 180 * s, ry: 52 * s };
    launch.style.setProperty('--cy', geo.cy + 'px');
    placeMoon();
  }
  function placeMoon() {
    const a = (finished ? 1 : P) * Math.PI * 2 + spin;
    launch.style.setProperty('--mx', (Math.cos(a) * geo.rx).toFixed(1) + 'px');
    launch.style.setProperty('--my', (Math.sin(a) * geo.ry).toFixed(1) + 'px');
    launch.style.setProperty('--ms', (0.8 + 0.3 * Math.sin(a) * 0.5 + 0.2 * (finished ? 1 : P)).toFixed(3));
    launch.style.setProperty('--p', (finished ? 1 : P).toFixed(3));
  }
  function complete() {
    finished = true; holding = false;
    launch.classList.add('is-done'); cta.classList.add('is-launched');
    label.textContent = 'En orbite';
    done.textContent = 'Votre marque est en orbite. Il ne manque plus qu’un message.';
    placeMoon();
  }
  function lTick(now) {
    const dt = Math.min(0.1, (now - (lLast || now)) / 1000); lLast = now;
    if (finished) {
      spin += dt * 0.5;                              // la planète continue sa ronde
    } else if (holding) {
      P = Math.min(1, P + dt / 1.6);
      if (P >= 1) complete();
    } else {
      P += (0 - P) * (1 - Math.exp(-dt * 3.2));      // relâché trop tôt : elle redescend en douceur
      if (P < 0.001) P = 0;
    }
    placeMoon();
    const idle = !finished && !holding && P === 0;
    if (idle || !lVisible || RM.matches || document.hidden) { lrId = null; lLast = 0; return; }
    lrId = requestAnimationFrame(lTick);
  }
  const lWake = () => { if (lrId === null && lVisible) lrId = requestAnimationFrame(lTick); };
  function press(e) {
    if (finished) return;
    if (e && e.pointerId !== undefined) btn.setPointerCapture(e.pointerId);
    if (RM.matches) { complete(); return; }
    holding = true; lWake();
  }
  function release() { holding = false; lWake(); }
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('lostpointercapture', release);
  btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(); } });
  btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') release(); });
  btn.addEventListener('contextmenu', e => e.preventDefault());
  new IntersectionObserver(([e]) => { lVisible = e.isIntersecting; if (lVisible) lWake(); }).observe(launch);
  addEventListener('resize', measure);
  measure();

  /* ---------- mouvement réduit, en direct dans les deux sens ---------- */
  RM.addEventListener('change', () => {
    drawLines();
    if (RM.matches && !finished && P > 0) complete();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) lWake(); });
})();
