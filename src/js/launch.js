// Le moment interactif : maintenir le bouton pour mettre sa planète en orbite.
// La progression monte pendant l'appui, redescend en douceur si on relâche trop tôt.
// Tourne sur gsap.ticker, uniquement pendant l'interaction ou quand la planète orbite à l'écran.

export function initLaunch(gsap) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const launch = document.getElementById('launch');
  if (!launch) return;
  const btn = document.getElementById('launchBtn');
  const cta = document.getElementById('contact');
  const orbitSvg = launch.querySelector('.launch__orbit');
  const done = launch.querySelector('.launch__done');
  const label = launch.querySelector('.launch__label');

  let P = 0, holding = false, finished = false, running = false, spin = 0, visible = false;
  let geo = { cy: 0, rx: 0, ry: 0 };

  function measure() {
    const w = orbitSvg.clientWidth, s = w / 400;   // clientWidth : taille de mise en page, sans transform
    geo = { cy: 80 * s, rx: 180 * s, ry: 52 * s };
    launch.style.setProperty('--cy', geo.cy + 'px');
    place();
  }
  function place() {
    const k = finished ? 1 : P;
    const a = k * Math.PI * 2 + spin;
    launch.style.setProperty('--mx', (Math.cos(a) * geo.rx).toFixed(1) + 'px');
    launch.style.setProperty('--my', (Math.sin(a) * geo.ry).toFixed(1) + 'px');
    launch.style.setProperty('--ms', (0.9 + 0.2 * Math.sin(a)).toFixed(3));   // plus grosse devant, plus petite derrière
    launch.style.setProperty('--p', k.toFixed(3));
  }
  function complete() {
    finished = true; holding = false;
    launch.classList.add('is-done'); cta.classList.add('is-launched');
    label.textContent = 'En orbite';
    done.textContent = 'Votre marque est en orbite. Il ne manque plus qu’un message.';
    place();
  }
  function tick(time, deltaTime) {
    const dt = Math.min(0.1, deltaTime / 1000);
    if (finished) spin += dt * 0.5;
    else if (holding) { P = Math.min(1, P + dt / 1.6); if (P >= 1) complete(); }
    else { P += (0 - P) * (1 - Math.exp(-dt * 3.2)); if (P < 0.001) P = 0; }
    place();
    const idle = !finished && !holding && P === 0;
    if (idle || !visible || RM.matches || document.hidden) { gsap.ticker.remove(tick); running = false; }
  }
  const wake = () => { if (!running && visible && !RM.matches) { running = true; gsap.ticker.add(tick); } };
  function press(e) {
    if (finished) return;
    if (e && e.pointerId !== undefined) btn.setPointerCapture(e.pointerId);
    if (RM.matches) { complete(); return; }       // mouvement réduit : état final immédiat, sans maintien
    holding = true; wake();
  }
  function release() { holding = false; wake(); }
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('lostpointercapture', release);
  btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(); } });
  btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') release(); });
  btn.addEventListener('contextmenu', e => e.preventDefault());
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { measure(); wake(); } }).observe(launch);
  addEventListener('resize', measure);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  RM.addEventListener('change', () => { if (RM.matches && !finished && P > 0) complete(); });
}
