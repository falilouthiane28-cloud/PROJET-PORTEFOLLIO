// Lighthouse mobile en alternance sur deux builds (A puis B, N fois) : sur une machine bruitée, seule une
// comparaison entrelacée dans la même séance est fiable. Usage : node test/perf/lh-compare.mjs <urlA> <urlB> [N]
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';

const [, , A = 'http://localhost:4182/', B = 'http://localhost:4181/', n = '5'] = process.argv;
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
mkdirSync('perf/lh-compare', { recursive: true });
const rows = { A: [], B: [] };
for (let i = 0; i < +n; i++) {
  for (const [k, url] of [['A', A], ['B', B]]) {
    const out = `perf/lh-compare/${k}-${i}.json`;
    spawnSync('npx', ['-y', 'lighthouse@12', url, '--output=json', `--output-path=${out}`, '--chrome-flags=--headless=new', '--quiet'],
      { env: { ...process.env, CHROME_PATH: EDGE }, shell: true, stdio: 'ignore' });
    const j = JSON.parse(readFileSync(out, 'utf8')), a = j.audits;
    rows[k].push({ perf: Math.round(j.categories.performance.score * 100), lcp: a['largest-contentful-paint'].numericValue, tbt: a['total-blocking-time'].numericValue,
      fcp: a['first-contentful-paint'].numericValue, cls: a['cumulative-layout-shift'].numericValue, kb: a['total-byte-weight'].numericValue / 1024 });
  }
}
const med = (arr, k) => { const v = arr.map(r => r[k]).sort((x, y) => x - y); return v[Math.floor(v.length / 2)]; };
const fmt = (k, v) => (k === 'cls' ? v.toFixed(3) : Math.round(v));
console.log('            ' + ['perf', 'lcp', 'tbt', 'fcp', 'cls', 'kb'].map(k => k.padStart(18)).join(''));
for (const k of ['A', 'B']) {
  console.log(`${k === 'A' ? 'avant (A)' : 'après (B)'}   ` + ['perf', 'lcp', 'tbt', 'fcp', 'cls', 'kb'].map(m =>
    `${fmt(m, med(rows[k], m))} [${rows[k].map(r => fmt(m, r[m])).join('/')}]`.padStart(18)).join(''));
}
