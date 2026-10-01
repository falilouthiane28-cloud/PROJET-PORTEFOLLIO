// L'intro : une seule timeline maîtresse d'environ 2,8 s.
// Anneau qui se dessine (préchargement) → la planète se révèle → le titre monte de ses masques
// → sous-titre → boutons → navigation. Easing expo.out (≈ cubic-bezier(0.16, 1, 0.3, 1)), décalages mesurés.
// Le titre est lisible vers 1,2 s ; rien ne bloque la page pendant ce temps (scroll et clics restent actifs).

export function playIntro(gsap) {
  const html = document.documentElement;
  // le titre n'est pas ici : il monte en CSS dès le premier rendu (voir hero.css, .title-rise)
  const heroParts = ['.hero__eyebrow', '.hero__lead', '.hero__actions > *', '.hero__meta'];

  // pas d'intro : mouvement réduit, pas de classe .intro, ou filet déjà déclenché (JS arrivé trop tard)
  if (!html.classList.contains('intro') || html.classList.contains('intro-skip')) {
    html.classList.remove('intro');
    return { tl: null, done: Promise.resolve() };
  }
  window.__introStarted = true;

  let resolveDone;
  const done = new Promise(r => (resolveDone = r));
  const nav = document.getElementById('nav');
  const media = document.querySelector('.planet__media');
  const poster = document.querySelector('.planet__poster');

  // si le poster n'est pas encore là (réseau lent), il apparaîtra en fondu à son arrivée plutôt que d'un coup
  if (poster && !poster.complete) {
    gsap.set(poster, { opacity: 0 });
    poster.addEventListener('load', () => gsap.to(poster, { opacity: 1, duration: 0.6, ease: 'power2.out' }), { once: true });
  }

  const tl = gsap.timeline({
    defaults: { ease: 'expo.out' },
    onComplete() {
      // on rend la main au CSS (survols, classes de la nav) et on retire les will-change
      gsap.set([nav, ...heroParts], { clearProps: 'transform,opacity,willChange' });
      gsap.set(media, { clearProps: 'willChange' });
      window.__introDoneAt = Math.round(performance.now());   // repère pour les mesures
      resolveDone();
    }
  });

  gsap.set([media, ...heroParts], { willChange: 'transform, opacity' });

  tl.fromTo('.planet__orbit ellipse', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'expo.inOut' }, 0)
    .fromTo(media, { opacity: 0, scale: 0.9, rotation: -5, yPercent: 4 },
      { opacity: 1, scale: 1, rotation: 0, yPercent: 0, duration: 1.7 }, 0.3)
    .fromTo('.hero__eyebrow', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1 }, 0.55)
    .fromTo('.hero__lead', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.1 }, 0.95)
    .fromTo('.hero__actions > *', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 }, 1.1)
    // la nav est centrée par translate(-50%) : on le reprend explicitement (x:0 + xPercent) pour ne pas le doubler
    .fromTo(nav, { opacity: 0, x: 0, xPercent: -50, yPercent: -80 }, { opacity: 1, xPercent: -50, yPercent: 0, duration: 1.2 }, 1.3)
    .fromTo('.hero__meta', { opacity: 0 }, { opacity: 1, duration: 1.1, ease: 'power2.out' }, 1.6)
    .to('.planet__orbit', { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 1.5);

  // les états de départ viennent maintenant des styles inline posés ci-dessus : la classe CSS peut partir
  html.classList.remove('intro');

  // revue au ralenti : ?ralenti=4 joue l'intro 4 fois plus lentement
  const slow = +new URLSearchParams(location.search).get('ralenti');
  if (slow > 1) tl.timeScale(1 / slow);

  return { tl, done };
}
