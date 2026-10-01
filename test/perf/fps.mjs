// I/s du hero : intro et premier scroll, sur ordinateur et sur mobile bridé (CPU ×4), contre les budgets.
// Calibre d'abord la machine (page vide à 60 i/s), sinon refuse de conclure.
// Usage : node test/perf/fps.mjs [url] [passages]   (code 1 si un budget échoue)
import { execFileSync } from 'node:child_process';
import { budgets } from './budgets.mjs';

const url = process.argv[2] || 'http://localhost:4181/';
const runs = +(process.argv[3] || 3);
const measure = (u, profile) => { const o = execFileSync('node', ['scripts/frames.mjs', u, profile], { encoding: 'utf8', maxBuffer: 1e8 }); return JSON.parse(o.slice(o.indexOf('{'))); };

const cal = measure("data:text/html,<div style='height:5000px'></div>", 'desktopcpu');
if (cal.scroll.fps < 58) { console.error(`Machine non calibrée : page vide à ${cal.scroll.fps} i/s. Brancher le secteur, fermer les applications lourdes, relancer.`); process.exit(2); }

let fail = false;
for (const [profile, key] of [['desktop', 'desktop'], ['mobilecpu', 'mobile']]) {
  const rs = Array.from({ length: runs }, () => measure(url, profile));
  const med = k => rs.map(r => r[k]?.fps ?? 0).sort((a, b) => a - b)[Math.floor(runs / 2)];
  const { min, label } = budgets.fps[key];
  for (const phase of ['timeline', 'scroll']) {
    const m = med(phase), ok = m >= min;
    fail ||= !ok;
    console.log(`${label.padEnd(22)} ${phase.padEnd(9)} médiane ${String(m).padStart(3)} i/s (${rs.map(r => r[phase]?.fps ?? '-').join(' / ')}) · budget ≥ ${min} · ${ok ? 'OK' : 'ÉCHEC'}`);
  }
  const long = rs.map(r => r.longTasks).join(' / ');
  console.log(`${''.padEnd(22)} tâches longues : ${long} · console : ${rs.map(r => r.console.length).join(' / ')}`);
  if (rs.some(r => r.console.length)) fail = true;
}
process.exit(fail ? 1 : 0);
