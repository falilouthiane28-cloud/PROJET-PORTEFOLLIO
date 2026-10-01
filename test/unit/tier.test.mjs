// Niveau d'appareil du hero
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deviceTier, readTierSignals } from '../../src/js/hero/tier.js';

test('appareil courant : rendu animé', () => {
  assert.equal(deviceTier({ memory: 8, cores: 8 }), 'live');
  assert.equal(deviceTier({}), 'live');                      // signaux absents (Safari, Firefox) : on ne pénalise pas
});
test('appareil modeste ou économie de données : poster', () => {
  assert.equal(deviceTier({ saveData: true, memory: 8, cores: 8 }), 'poster');
  assert.equal(deviceTier({ memory: 2, cores: 8 }), 'poster');
  assert.equal(deviceTier({ memory: 8, cores: 2 }), 'poster');
});
test('forçage par paramètre ?niveau=', () => {
  assert.equal(deviceTier({ forced: 'poster', memory: 8, cores: 8 }), 'poster');
  assert.equal(deviceTier({ forced: 'live', saveData: true }), 'live');
  assert.equal(deviceTier({ forced: 'nimporte', memory: 8, cores: 8 }), 'live');
});
test('lecture des signaux du navigateur', () => {
  const s = readTierSignals({ connection: { saveData: true }, deviceMemory: 4, hardwareConcurrency: 6 }, '?niveau=poster');
  assert.deepEqual(s, { forced: 'poster', saveData: true, memory: 4, cores: 6 });
  assert.equal(readTierSignals({}, '').saveData, false);
});
