// Qualité adaptative du rendu du hero
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createQuality, PARTICLE_STEPS } from '../../src/js/hero/quality.js';

// alimente n images de durée ms, à partir de t, et renvoie [changements, t]
function feed(q, n, ms, t) { const ch = []; for (let i = 0; i < n; i++) { t += ms; const c = q.sample(ms, t); if (c) ch.push(c); } return [ch, t]; }

test('plafonne la densité de pixels', () => {
  assert.equal(createQuality({ dpr: 3, dprCap: 1.75 }).dpr, 1.75);
  assert.equal(createQuality({ dpr: 1, dprCap: 1.75 }).dpr, 1);
});
test('60 i/s stables : aucun changement', () => {
  const q = createQuality({ dpr: 1.75 });
  const [ch] = feed(q, 600, 16.7, 2000);
  assert.deepEqual(ch, []);
  assert.equal(q.particles, PARTICLE_STEPS[0]);
});
test('sous 50 i/s : baisse la densité de pixels d’abord, puis les particules', () => {
  const q = createQuality({ dpr: 1.5 });
  const [ch] = feed(q, 2000, 30, 0);
  assert.deepEqual(ch.slice(0, 2), ['dpr', 'dpr']);
  assert.equal(q.dpr, 1);
  assert.ok(ch.includes('particles'));
  assert.equal(q.particles, PARTICLE_STEPS.at(-1));        // ne descend pas sous la dernière marche
});
test('attend 60 images et 1,5 s entre deux changements', () => {
  const q = createQuality({ dpr: 1.75 });
  let [ch, t] = feed(q, 59, 30, 2000);
  assert.deepEqual(ch, []);
  [ch, t] = feed(q, 1, 30, t);
  assert.deepEqual(ch, ['dpr']);
  [ch] = feed(q, 45, 30, t);                                 // 1,35 s : trop tôt
  assert.deepEqual(ch, []);
});
test('remonte une marche à la fois quand la marge revient', () => {
  const q = createQuality({ dpr: 1 });
  let [, t] = feed(q, 1200, 30, 0);                          // descend jusqu'à la dernière marche
  assert.equal(q.level, PARTICLE_STEPS.length - 1);
  let ch; [ch, t] = feed(q, 3000, 12, t);                    // 83 i/s pendant 36 s
  assert.equal(ch[0], 'particles');
  assert.equal(q.level, 0);
  assert.ok(q.dpr > 1 && q.dpr <= 1.75);
});
