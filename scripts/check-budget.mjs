// Budget du bundle : JS initial (gzip) = scripts et modulepreload référencés par dist/index.html.
// Les chunks chargés à la demande (effets, worker) sont listés à part, sans budget bloquant.
// Usage : node scripts/check-budget.mjs [--build]   (code 1 si le budget est dépassé)
import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';

const BUDGET_INITIAL_KB = 150;
if (process.argv.includes('--build')) {
  const r = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--logLevel', 'error'], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(1);
}
const html = readFileSync('dist/index.html', 'utf8');
const initial = new Set([...html.matchAll(/<(?:script[^>]+src|link[^>]+rel="modulepreload"[^>]+href)="\/?(assets\/[^"]+\.js)"/g)].map(m => m[1]));
const gz = f => gzipSync(readFileSync(`dist/${f}`), { level: 9 }).length / 1024;
let total = 0;
for (const f of initial) { const k = gz(f); total += k; console.log(`initial   ${k.toFixed(1).padStart(6)} Ko  ${f}`); }
for (const f of readdirSync('dist/assets').filter(f => f.endsWith('.js') && !initial.has(`assets/${f}`))) {
  console.log(`à la demande ${gz(`assets/${f}`).toFixed(1).padStart(5)} Ko  assets/${f}`);
}
const ok = total <= BUDGET_INITIAL_KB;
console.log(`JS initial : ${total.toFixed(1)} Ko gzip / budget ${BUDGET_INITIAL_KB} Ko → ${ok ? 'OK' : 'DÉPASSÉ'}`);
process.exit(ok ? 0 : 1);
