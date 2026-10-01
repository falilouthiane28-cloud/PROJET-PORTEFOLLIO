// Petits outils partagés par les effets.
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// « Pas encore vu » : on n'anime que ce qui est sous le bas de l'écran au moment où les effets démarrent
// (ils arrivent en temps libre ; ce qui est déjà affiché ne doit jamais disparaître pour réapparaître).
export const belowFold = el => el.getBoundingClientRect().top > innerHeight;

// pile de fonctions de démontage, vidée dans l'ordre inverse
export function cleanup() {
  const fns = [];
  const add = fn => { if (typeof fn === 'function') fns.push(fn); return fn; };
  const run = () => { while (fns.length) { try { fns.pop()(); } catch {} } };
  return { add, run };
}

// écouteur avec démontage intégré
export function on(target, type, fn, opts) {
  target.addEventListener(type, fn, opts);
  return () => target.removeEventListener(type, fn, opts);
}
