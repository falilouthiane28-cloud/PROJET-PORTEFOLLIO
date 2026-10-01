// Audit visuel et technique à 6 largeurs : débordement horizontal, éléments qui sortent de l'écran,
// console, requêtes en échec, axe (a11y), captures. Usage : node scripts/audit.mjs [url] [dossier]
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:4181/';
const out = process.argv[3] || 'perf/audit';
mkdirSync(out, { recursive: true });
const widths = [320, 390, 768, 1024, 1440, 1920];
const browser = await chromium.launch({ channel: 'msedge' });
const report = [];

for (const reduced of [false, true]) {
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference', hasTouch: w < 768, isMobile: w < 768 });
    const page = await ctx.newPage();
    const logs = [], failed = [];
    page.on('console', m => ['error', 'warning'].includes(m.type()) && logs.push(`${m.type()}: ${m.text()}`));
    page.on('pageerror', e => logs.push('exception: ' + e.message));
    page.on('requestfailed', r => failed.push(r.url()));
    page.on('response', r => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3500);
    // parcours de toute la page pour déclencher les apparitions, puis retour en haut
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 600) { await page.mouse.wheel(0, 600); await page.waitForTimeout(120); }
    await page.waitForTimeout(800);
    const res = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const off = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (!r.width || getComputedStyle(el).position === 'fixed') continue;
        if (r.right > vw + 1 || r.left < -1) {
          // ignoré si un ancêtre coupe le débordement
          let p = el.parentElement, clipped = false;
          while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'clip' || o === 'auto') { clipped = true; break; } p = p.parentElement; }
          if (!clipped) off.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} [${Math.round(r.left)}→${Math.round(r.right)}]`);
        }
      }
      // éléments restés invisibles après le parcours (apparition jamais déclenchée)
      const hidden = [...document.querySelectorAll('.reveal, [data-reveal]')].filter(e => +getComputedStyle(e).opacity < 0.5).map(e => e.className);
      return { overflowX: document.documentElement.scrollWidth - vw, off: off.slice(0, 12), hidden: hidden.slice(0, 12) };
    });
    let axe = [];
    if (!reduced) {
      const a = await new AxeBuilder({ page }).analyze();
      axe = a.violations.map(v => `${v.id} (${v.impact}) ×${v.nodes.length}: ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')}`);
    }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/${w}${reduced ? '-reduit' : ''}.png` });
    report.push({ w, reduced, ...res, console: logs, failed, axe });
    await ctx.close();
  }
}
await browser.close();
writeFileSync(`${out}/audit.json`, JSON.stringify(report, null, 1));
for (const r of report) console.log(`${r.w}${r.reduced ? ' réduit' : ''} · overflow ${r.overflowX} · hors écran ${r.off.length} · cachés ${r.hidden.length} · console ${r.console.length} · échecs ${r.failed.length} · axe ${r.axe.length}`,
  [...r.off, ...r.hidden.map(x => 'caché: ' + x), ...r.console, ...r.failed, ...r.axe].map(x => '\n   ' + x).join(''));
