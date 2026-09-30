// Curseur personnalisé (souris uniquement) et boutons magnétiques.
// quickTo réutilise un seul tween par axe : aucun objet créé à chaque mouvement.

export function initCursor(gsap) {
  const FINE = matchMedia('(hover: hover) and (pointer: fine)');
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  if (!FINE.matches || RM.matches) return;

  /* ---------- curseur : un point précis + un anneau qui suit avec retard ---------- */
  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="cursor__dot"></span><span class="cursor__ring"><i></i></span>';
  document.body.appendChild(el);
  document.documentElement.classList.add('has-cursor');
  const dot = el.firstChild, ring = el.lastChild;
  const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  let on = false;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    if (!on) { on = true; el.classList.add('is-on'); gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); }
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
  }, { passive: true });
  document.addEventListener('pointerover', e => {
    el.classList.toggle('is-link', !!e.target.closest('a, button, summary, [data-magnetic]'));
  });
  document.documentElement.addEventListener('pointerleave', () => { on = false; el.classList.remove('is-on'); });

  /* ---------- boutons magnétiques : attirés par le pointeur, retour sans rebond ---------- */
  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    let mx = null, my = null;
    btn.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      if (!mx) { mx = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' }); my = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' }); }
      const r = btn.getBoundingClientRect();
      mx(Math.max(-10, Math.min(10, (e.clientX - (r.left + r.width / 2)) * 0.25)));
      my(Math.max(-8, Math.min(8, (e.clientY - (r.top + r.height / 2)) * 0.3)));
    });
    btn.addEventListener('pointerleave', () => { if (mx) { mx(0); my(0); } });
  });
}
