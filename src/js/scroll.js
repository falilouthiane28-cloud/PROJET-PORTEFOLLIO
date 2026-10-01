// Vague 2 : scroll fluide et mouvement de page.
// Une seule horloge : gsap.ticker pilote Lenis, ScrollTrigger, la nav, le curseur et la planète.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { bus } from './bus.js';
import { initCursor } from './cursor.js';
import { initLaunch } from './launch.js';

export function initScroll() {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });     // la barre d'adresse mobile ne relance pas tout le calcul
  gsap.ticker.lagSmoothing(0);
  const RM = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Lenis, branché sur le ticker GSAP (pas de seconde boucle) ---------- */
  let lenis = null;
  const lenisRaf = t => lenis.raf(t * 1000);
  // Lenis seulement à la souris / au trackpad : au doigt il ne lisse rien (défilement natif)
  // mais écouterait chaque touchmove et doublerait les mises à jour de ScrollTrigger
  const FINE = matchMedia('(hover: hover) and (pointer: fine)');
  function startLenis() {
    if (lenis || RM.matches || !FINE.matches) return;
    // syncTouch:false (défaut) : sur mobile le défilement reste natif, le moins coûteux sur Android
    lenis = new Lenis({ autoRaf: false, lerp: 0.1, anchors: { offset: -96 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(lenisRaf);
  }
  function stopLenis() {
    if (!lenis) return;
    gsap.ticker.remove(lenisRaf); lenis.destroy(); lenis = null;
  }
  startLenis();
  RM.addEventListener('change', () => (RM.matches ? stopLenis() : startLenis()));

  /* ---------- apparitions groupées, seulement à l'entrée dans l'écran ---------- */
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    once: true,
    onEnter: els => gsap.to(els, {
      opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, overwrite: true,
      onComplete() { els.forEach(el => { el.classList.add('is-in'); gsap.set(el, { clearProps: 'opacity,transform' }); }); }
    })
  });
  // état final porté par une classe, pour que les survols CSS reprennent la main
  const style = document.createElement('style');
  style.textContent = '.js .reveal.is-in{opacity:1;transform:none}';
  document.head.appendChild(style);

  /* ---------- mouvement lié au scroll (désactivé proprement en mouvement réduit) ---------- */
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const hero = document.querySelector('.hero');
    const heroST = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };

    // parallaxe du texte : le titre part plus vite que la planète, puis s'efface
    gsap.to('.hero__title', { yPercent: -30, opacity: 0.15, ease: 'none', scrollTrigger: heroST });
    gsap.to('.hero__foot, .hero__eyebrow', { y: -70, ease: 'none', scrollTrigger: heroST });
    // la planète descend moins vite et grossit un peu : elle accompagne l'entrée dans la page
    gsap.to('.planet', {
      yPercent: 16, scale: 1.1, ease: 'none',
      scrollTrigger: {
        ...heroST,
        onUpdate: self => { bus.scroll = self.progress; bus.vel = self.getVelocity(); }
      }
    });

    // captures des projets : léger mouvement interne (transform uniquement)
    gsap.utils.toArray('.frame img').forEach(img => {
      gsap.fromTo(img, { yPercent: -3, scale: 1.07 }, {
        yPercent: 3, scale: 1.07, ease: 'none',
        scrollTrigger: { trigger: img.closest('.frame'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // traits qui se dessinent : orbites des services, frise de la méthode, anneau du footer
    const draw = (sel, start, end, extra) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.style.setProperty('--draw', 0);
      ScrollTrigger.create({
        trigger: el, start, end, scrub: true,
        onUpdate: self => { el.style.setProperty('--draw', self.progress.toFixed(3)); extra && extra(self.progress); }
      });
      return () => el.style.removeProperty('--draw');
    };
    const steps = document.querySelectorAll('#timeline li');
    const undo = [
      draw('.orbits', 'top bottom', 'center center'),
      draw('#timeline', 'top 85%', 'top 40%', p => steps.forEach((li, i) => li.classList.toggle('is-on', p >= (i + 0.35) / 4))),
      draw('.footer__word', 'top bottom', 'top 50%')
    ];
    return () => { undo.forEach(u => u && u()); steps.forEach(li => li.classList.add('is-on')); };
  });
  // mouvement réduit : la frise est entièrement « allumée »
  if (RM.matches) document.querySelectorAll('#timeline li').forEach(li => li.classList.add('is-on'));

  /* ---------- le bandeau ne tourne que visible ---------- */
  ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top', toggleClass: { targets: '.marquee', className: 'on' } });

  /* ---------- recalcul quand les polices sont là (jamais pendant un geste de scroll) ---------- */
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  initCursor(gsap);
  initLaunch(gsap);
  return { lenis };
}
