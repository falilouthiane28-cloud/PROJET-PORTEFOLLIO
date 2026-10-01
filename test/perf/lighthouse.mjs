// Lighthouse mobile (Slow 4G, CPU ×4) contre les budgets. Médiane de N passages (défaut 3).
// Usage : node test/perf/lighthouse.mjs [url] [passages]   (code 1 si un budget échoue)
// Prérequis : le build servi sur :4181 (npm run preview), ordinateur sur secteur.
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { budgets } from './budgets.mjs';

const url = process.argv[2] || 'http://localhost:4181/';
const runs = +(process.argv[3] || 3);
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
mkdirSync('perf/lh', { recursive: true });

const battery = spawnSync('powershell', ['-NoProfile', '-Command', '(Get-CimInstance Win32_Battery).BatteryStatus'], { encoding: 'utf8' }).stdout.trim();
if (battery === '1') console.warn('ATTENTION : ordinateur sur batterie, le CPU est bridé et les scores sont faussés (voir docs/PERFORMANCE.md).');

const results = [];
for (let i = 0; i < runs; i++) {
  const out = `perf/lh/mobile-${i}.json`;
  const r = spawnSync('npx', ['-y', 'lighthouse@12', url, '--output=json', `--output-path=${out}`, '--chrome-flags=--headless=new', '--quiet'],
    { env: { ...process.env, CHROME_PATH: EDGE }, shell: true, stdio: 'inherit' });
  if (r.status !== 0) { console.error('Lighthouse a échoué'); process.exit(1); }
  const j = JSON.parse(readFileSync(out, 'utf8'));
  const a = j.audits, c = j.categories;
  results.push({
    perf: c.performance.score * 100, a11y: c.accessibility.score * 100, bp: c['best-practices'].score * 100, seo: c.seo.score * 100,
    lcp: a['largest-contentful-paint'].numericValue, cls: a['cumulative-layout-shift'].numericValue, tbt: a['total-blocking-time'].numericValue,
    kb: a['total-byte-weight'].numericValue / 1024
  });
}
const median = k => results.map(r => r[k]).sort((x, y) => x - y)[Math.floor(results.length / 2)];
let fail = false;
console.log('\nCritère      médiane   plage            budget');
for (const [k, { max, min, label }] of Object.entries(budgets.lighthouse)) {
  const m = median(k), vals = results.map(r => r[k]);
  const ok = (max === undefined || m <= max) && (min === undefined || m >= min);
  fail ||= !ok;
  const f = v => (k === 'cls' ? v.toFixed(3) : Math.round(v));
  console.log(`${label.padEnd(12)} ${String(f(m)).padStart(7)}   ${vals.map(f).join(' / ').padEnd(16)} ${min !== undefined ? '≥ ' + min : '≤ ' + max}  ${ok ? 'OK' : 'ÉCHEC'}`);
}
process.exit(fail ? 1 : 0);
