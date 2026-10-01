// Lance frames.mjs plusieurs fois par profil et résume (i/s intro / timeline / scroll, LCP, CLS, tâches longues).
// Usage : node scripts/bench.mjs <url> [profils=desktop,desktopcpu,mobile] [passages=3] [options frames.mjs…]
import { execFileSync } from 'node:child_process';
const [,, url = 'http://localhost:4181/', profs = 'desktop,desktopcpu,mobile', n = '3', ...extra] = process.argv;
const f = w => (w ? `${w.fps}/${w.dropped}` : '-');
for (const p of profs.split(',')) {
  for (let i = 0; i < +n; i++) {
    const out = execFileSync('node', ['scripts/frames.mjs', url, p, ...extra], { encoding: 'utf8', maxBuffer: 1e8 });
    const r = JSON.parse(out.slice(out.indexOf('{')));
    console.log([p, `intro ${f(r.intro)}`, `timeline ${f(r.timeline)}`, `scroll ${f(r.scroll)}`, `LCP ${r.lcp?.[0] ?? r.lcp}`,
      `CLS ${r.cls}`, `long ${r.longTasks}/${r.longMs}ms`, `tier ${r.tier}`, `overflow ${r.overflowX}`, `console ${r.console.length}`].join(' · '));
    if (r.console.length) console.log('  ', r.console.join('\n   '));
  }
}
