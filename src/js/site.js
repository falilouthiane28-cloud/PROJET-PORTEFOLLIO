(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
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

  /* (le hero — découpe des titres, bandes, scène, bascule statique — vit maintenant dans js/hero/) */

  /* ---------- pause des animations CSS quand l'onglet est caché ---------- */
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));

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
