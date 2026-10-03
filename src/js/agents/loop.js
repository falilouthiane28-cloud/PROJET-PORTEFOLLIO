// L'extrait muet en boucle de la section Saturn Agents.
// - Rien n'est téléchargé au chargement (preload="none") : la lecture démarre quand la section approche de l'écran,
//   et seulement après `load`, pour ne pas disputer la bande passante au LCP.
// - Jamais en mouvement réduit ni en économie de données : l'affiche reste, sans bouton pause (rien ne bouge).
// - Si le navigateur refuse la lecture (iOS en économie d'énergie, réglage Firefox), l'affiche reste aussi.
// - WCAG 2.2.2 : une boucle de plus de 5 s a un bouton pause visible, et la pause choisie est respectée.
export function initAgentsLoop() {
  const fig = document.querySelector('.agents__film');
  if (!fig) return;
  const video = fig.querySelector('video'), btn = fig.querySelector('.agents__pause');
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const conn = navigator.connection;
  const lean = () => RM.matches || conn?.saveData === true || /(^|-)2g$/.test(conn?.effectiveType || '');

  let near = false, userPaused = false, held = false, refused = false;
  const loaded = new Promise(r => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));

  function update() {
    const off = lean() || refused;
    btn.hidden = off;
    if (off || !near || userPaused || held || document.hidden) { if (!video.paused) video.pause(); if (off) fig.classList.remove('is-playing'); return; }
    if (!video.paused) return;
    loaded.then(() => {
      if (lean() || refused || !near || userPaused || held || document.hidden) return;
      video.play().catch(() => { refused = true; update(); });
    });
  }

  video.addEventListener('playing', () => fig.classList.add('is-playing'));
  btn.addEventListener('click', () => {
    userPaused = !userPaused;
    btn.setAttribute('aria-pressed', String(userPaused));
    update();
  });
  new IntersectionObserver(([e]) => { near = e.isIntersecting; update(); }, { rootMargin: '200px 0px' }).observe(fig);
  document.addEventListener('visibilitychange', update);
  RM.addEventListener('change', update);
  conn?.addEventListener?.('change', update);
  // la modale du film suspend la boucle (un seul film à la fois)
  addEventListener('film:open', () => { held = true; update(); });
  addEventListener('film:close', () => { held = false; update(); });
  update();
}
