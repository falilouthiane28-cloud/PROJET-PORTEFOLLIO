// Qualité adaptative du rendu, en fonction pure (testable sans navigateur).
// On mesure le temps entre images ; sous 50 i/s on baisse la densité de pixels, puis le nombre de particules ;
// on remonte prudemment (une marche à la fois) quand la marge revient.
export const PARTICLE_STEPS = [2800, 1800, 1100];

export function createQuality({ dpr = 1, dprCap = 1.75, steps = PARTICLE_STEPS } = {}) {
  const s = { dpr: Math.min(dpr, dprCap), dprCap, level: 0, samples: [], lastChange: 0, goodStreak: 0 };

  // une image de plus ; renvoie le changement à appliquer ('dpr', 'particles') ou null
  function sample(frameMs, now) {
    s.samples.push(frameMs);
    if (s.samples.length > 90) s.samples.shift();
    if (s.samples.length < 60 || now - s.lastChange < 1500) return null;
    const avg = average();
    if (avg > 20) {                                   // sous 50 i/s : on allège
      s.goodStreak = 0;
      let change = null;
      if (s.dpr > 1) { s.dpr = Math.max(1, s.dpr - 0.25); change = 'dpr'; }
      else if (s.level < steps.length - 1) { s.level++; change = 'particles'; }
      s.lastChange = now; s.samples.length = 0;
      return change;
    }
    if (avg < 15.5) {                                 // large marge : on remonte, une marche à la fois
      if (++s.goodStreak >= 3 && now - s.lastChange > 4000) {
        let change = null;
        if (s.level > 0) { s.level--; change = 'particles'; }
        else if (s.dpr < s.dprCap) { s.dpr = Math.min(s.dprCap, s.dpr + 0.25); change = 'dpr'; }
        s.lastChange = now; s.goodStreak = 0; s.samples.length = 0;
        return change;
      }
      return null;
    }
    s.goodStreak = 0;
    return null;
  }
  const average = () => (s.samples.length ? s.samples.reduce((a, x) => a + x, 0) / s.samples.length : 16.7);
  const reset = () => { s.samples.length = 0; };

  return {
    sample, reset, average,
    get dpr() { return s.dpr; },
    get particles() { return steps[s.level]; },
    get level() { return s.level; }
  };
}
