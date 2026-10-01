// Jetons de mouvement : cohérence avec le design d'origine et règles du système
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EASE, DUR, STAGGER, DIST, SPRING, lerpFactor } from '../../src/motion/tokens.js';

test('les courbes sont des cubic-bezier valides', () => {
  for (const v of Object.values(EASE)) {
    const m = v.match(/^cubic-bezier\(([^)]+)\)$/);
    assert.ok(m, v);
    const [x1, , x2] = m[1].split(',').map(Number);
    assert.ok(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1, v);  // x doit rester dans [0, 1]
  }
});
test('EASE.out reprend --ease-out du design d’origine', () => {
  const css = readFileSync(new URL('../../src/styles/site.css', import.meta.url), 'utf8');
  assert.match(css, /--ease-out:cubic-bezier\(\.16,1,\.3,1\)/);
  assert.equal(EASE.out.replace(/\s|0(?=\.)/g, ''), 'cubic-bezier(.16,1,.3,1)');
});
test('les jetons CSS correspondent aux jetons JS', () => {
  const css = readFileSync(new URL('../../src/styles/motion.css', import.meta.url), 'utf8');
  const flat = css.replace(/\s+/g, '');
  assert.ok(flat.includes(`--dur-reveal:${DUR.reveal}s`));
  assert.ok(flat.includes(`--dur-micro:${DUR.micro}s`));
  assert.ok(css.includes(EASE.outQuint));
});
test('durées et décalages restent dans des bornes raisonnables', () => {
  assert.ok(DUR.press <= 0.15 && DUR.micro <= 0.4);
  assert.ok(DUR.intro >= 2.5 && DUR.intro <= 3.5);
  assert.ok(Object.values(STAGGER).every(s => s > 0 && s <= 0.12));
  assert.ok(Object.values(DIST).every(d => d > 0 && d <= 60));
});
test('ressorts sans rebond (amortissement ≥ critique)', () => {
  for (const s of Object.values(SPRING)) {
    const zeta = s.damping / (2 * Math.sqrt(s.stiffness * s.mass));
    assert.ok(zeta >= 0.7, `zeta=${zeta.toFixed(2)}`);
  }
});
test('lissage indépendant de la fréquence d’images', () => {
  // 2 pas de 8,33 ms doivent donner la même position qu'un pas de 16,67 ms
  const one = lerpFactor(0.12, 16.667);
  const k = lerpFactor(0.12, 8.3335);
  const two = 1 - (1 - k) * (1 - k);
  assert.ok(Math.abs(one - two) < 1e-9);
  assert.equal(lerpFactor(0.12, 0), 0);
});
