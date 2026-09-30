// La barre de navigation : ressorts interruptibles, pastille glissante, jauge de lecture, menu mobile.
// Tout tourne sur gsap.ticker (une seule boucle d'images pour tout le site) et n'anime que transform/opacity.

export function initNav(gsap) {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)');
  const DESK = matchMedia('(min-width: 901px)');

  const nav = $('#nav');
  const linksBox = $('.nav__links', nav);
  const links = $$('a', linksBox);
  const glow = $('.nav__glow', nav);
  const cta = $('.nav__cta', nav);
  const menuBtn = $('.nav__menu', nav);
  const sheet = $('#navSheet');
  const scrim = $('#navScrim');
  const progress = $('.nav__progress', nav);
  const GLOW_W = 100;                          // largeur de base de la pastille, mise à l'échelle en scaleX

  /* ---------- ressort à la Apple : amortissement + réponse, repart toujours de la valeur affichée ---------- */
  function Spring(value, { damping = 1, response = 0.35 } = {}) {
    const w = (2 * Math.PI) / response;
    return {
      x: value, v: 0, t: value,
      step(dt) {
        const a = -w * w * (this.x - this.t) - 2 * damping * w * this.v;
        this.v += a * dt; this.x += this.v * dt;
        if (Math.abs(this.v) < 0.01 && Math.abs(this.x - this.t) < 0.05) { this.x = this.t; this.v = 0; return false; }
        return true;
      },
      set(t, jump) { this.t = t; if (jump) { this.x = t; this.v = 0; } }
    };
  }
  // la pastille glisse avec un léger rebond (le geste du pointeur porte de l'élan) ; la pilule revient sans rebond
  const gx = Spring(0, { damping: 0.82, response: 0.38 });
  const gw = Spring(80, { damping: 0.9, response: 0.38 });
  const bx = Spring(0, { damping: 1, response: 0.4 }), by = Spring(0, { damping: 1, response: 0.4 });
  const springs = [gx, gw, bx, by];

  let animating = false, glowOn = null, glowTarget = null, current = null;
  const cache = { gx: null, gs: null, bx: null, by: null };

  function step(time, deltaTime) {
    const dt = Math.min(1 / 30, deltaTime / 1000);
    let busy = false;
    for (const s of springs) busy = s.step(dt) || busy;
    write();
    if (!busy) { gsap.ticker.remove(step); animating = false; }
  }
  function wake() {
    if (RM.matches) { springs.forEach(s => s.set(s.t, true)); write(); return; }
    if (!animating) { animating = true; gsap.ticker.add(step); }
  }
  function write() {
    const x = Math.round(gx.x * 10) / 10, s = Math.round(gw.x / GLOW_W * 1000) / 1000;
    if (x !== cache.gx || s !== cache.gs) { glow.style.transform = `translate3d(${x}px,0,0) scaleX(${s})`; cache.gx = x; cache.gs = s; }
    const X = Math.round(bx.x * 10) / 10, Y = Math.round(by.x * 10) / 10;
    if (X !== cache.bx || Y !== cache.by) {
      cta.style.setProperty('--bx', X + 'px'); cta.style.setProperty('--by', Y + 'px');
      cta.style.setProperty('--ix', (X * 0.6).toFixed(1) + 'px'); cta.style.setProperty('--iy', (Y * 0.6).toFixed(1) + 'px');
      cache.bx = X; cache.by = Y;
    }
  }

  /* ---------- la pastille suit le survol, puis se repose sur la section en cours ---------- */
  function setGlow(on) { if (on !== glowOn) { linksBox.classList.toggle('has-glow', on); glowOn = on; } }
  function moveGlowTo(a, jump) {
    if (!a) { setGlow(false); return; }
    // lecture groupée des positions (une seule mesure par déplacement)
    const box = linksBox.getBoundingClientRect(), r = a.getBoundingClientRect();
    const first = glowOn !== true;
    gx.set(r.left - box.left, jump || first); gw.set(r.width, jump || first);
    setGlow(true); glowTarget = a; wake();
  }
  links.forEach(a => {
    a.addEventListener('pointerenter', () => moveGlowTo(a));
    a.addEventListener('focus', () => moveGlowTo(a));
  });
  // filet : si l'entrée a été manquée (curseur déjà posé au chargement), le premier mouvement suffit
  linksBox.addEventListener('pointermove', e => {
    const a = e.target.closest('a');
    if (a && (a !== glowTarget || !glowOn)) moveGlowTo(a);
  });
  linksBox.addEventListener('pointerleave', () => moveGlowTo(current));
  linksBox.addEventListener('focusout', e => { if (!linksBox.contains(e.relatedTarget)) moveGlowTo(current); });

  /* ---------- la pilule blanche attirée par le curseur ---------- */
  cta.addEventListener('pointermove', e => {
    if (!FINE.matches) return;
    const r = cta.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    bx.set(Math.max(-6, Math.min(6, dx * 0.14))); by.set(Math.max(-4, Math.min(4, dy * 0.2))); wake();
  });
  cta.addEventListener('pointerleave', () => { bx.set(0); by.set(0); wake(); });

  /* ---------- section en cours ---------- */
  const sections = links.map(a => document.getElementById(a.dataset.id));
  function spy() {
    const mid = innerHeight * 0.45;
    let found = null;
    sections.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top <= mid && r.bottom > mid) found = links[i]; });
    if (found === current) return;
    if (current) current.classList.remove('is-current');
    current = found;
    if (current) current.classList.add('is-current');
    if (!linksBox.matches(':hover') && !linksBox.contains(document.activeElement)) moveGlowTo(current);
  }

  /* ---------- scroll : jauge, repli du mot, retrait en descendant (lu sur le ticker, sans écouteur de scroll) ---------- */
  let lastY = -1, hidden = false, condensed = null, read = -1, spyAt = 0;
  function onTick(time) {
    const y = scrollY;
    if (y === lastY) return;
    const dy = lastY < 0 ? 0 : y - lastY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const r = max > 0 ? Math.round(Math.min(1, y / max) * 1000) / 1000 : 0;
    if (r !== read) { progress.style.setProperty('--read', r); read = r; }
    const c = y > 80;
    if (c !== condensed) {
      nav.classList.toggle('is-condensed', c); condensed = c;
      if (glowTarget && glowOn) gsap.delayedCall(0.75, () => moveGlowTo(glowTarget, true));   // après le repli du mot
    }
    if (!nav.classList.contains('is-open')) {
      if (dy > 8 && y > 480 && !hidden && !nav.contains(document.activeElement)) { nav.classList.add('is-hidden'); hidden = true; }
      else if ((dy < -8 || y < 480) && hidden) { nav.classList.remove('is-hidden'); hidden = false; }
    }
    lastY = y;
    if (time - spyAt > 0.1) { spyAt = time; spy(); }       // ~10 Hz suffit pour la section en cours
  }
  gsap.ticker.add(onTick);
  nav.addEventListener('focusin', () => { if (hidden) { nav.classList.remove('is-hidden'); hidden = false; } });
  addEventListener('resize', () => { if (glowTarget && glowOn) moveGlowTo(glowTarget, true); if (DESK.matches) closeMenu(false); });

  /* ---------- menu mobile : se déplie depuis la barre, se replie par le même chemin ---------- */
  let closeTimer = null;
  const label = menuBtn.querySelector('.sr');
  function openMenu() {
    clearTimeout(closeTimer);
    sheet.hidden = false;
    void sheet.offsetHeight;                     // une seule lecture forcée, pour partir de l'état fermé
    nav.classList.add('is-open'); scrim.classList.add('is-on');
    menuBtn.setAttribute('aria-expanded', 'true');
    label.textContent = 'Fermer le menu';
    const first = sheet.querySelector('a'); if (first) first.focus({ preventScroll: true });
  }
  function closeMenu(restoreFocus = true) {
    if (!nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open'); scrim.classList.remove('is-on');
    menuBtn.setAttribute('aria-expanded', 'false');
    label.textContent = 'Ouvrir le menu';
    closeTimer = setTimeout(() => { sheet.hidden = true; }, RM.matches ? 0 : 450);
    if (restoreFocus) menuBtn.focus({ preventScroll: true });
  }
  menuBtn.addEventListener('click', () => (nav.classList.contains('is-open') ? closeMenu() : openMenu()));
  scrim.addEventListener('click', () => closeMenu());
  sheet.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(false); });
  document.addEventListener('keydown', e => {
    if (!nav.classList.contains('is-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key === 'Tab') {                       // le focus reste dans le menu ouvert
      const f = [menuBtn, ...sheet.querySelectorAll('a')];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
}
