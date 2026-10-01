// Mesure réelle (pas simulée) : LCP, CLS, tâches longues et images perdues pendant
// l'intro puis le premier scroll, avec bridage CPU et réseau optionnels.
// Usage : node scripts/frames.mjs <url> <profil: desktop|mobile> [--trace fichier.json] [--no-webgl] [--reduced]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [,, url, profile = 'desktop', ...rest] = process.argv;
const flag = f => rest.includes(f);
const traceOut = flag('--trace') ? rest[rest.indexOf('--trace') + 1] : null;
const P = profile === 'desktopcpu'
  ? { w: 1440, h: 900, dpr: 1, mobile: false, cpu: 4, net: null }
  : profile === 'mobilecpu'
  ? { w: 390, h: 844, dpr: 3, mobile: true, cpu: 4, net: null }
  : profile === 'mobile'
  ? { w: 390, h: 844, dpr: 3, mobile: true, cpu: 4, net: { latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 } }
  : { w: 1440, h: 900, dpr: 1, mobile: false, cpu: 1, net: null };

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9400 + Math.floor(Math.random() * 400);
const profileDir = mkdtempSync(join(tmpdir(), 'fr-'));
const args = ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`,
  '--no-first-run', '--hide-scrollbars', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--use-angle=d3d11', 'about:blank'];
if (flag('--no-webgl')) args.push('--disable-webgl', '--disable-3d-apis');
const proc = spawn(EDGE, args, { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let list;
for (let i = 0; i < 60; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (list.length) break; } catch {} await sleep(200); }
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(); const logs = []; const traceEvents = []; let traceDone;
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) logs.push(m.params.type.toUpperCase() + ' ' + m.params.args.map(a => a.value ?? a.description).join(' '));
  if (m.method === 'Log.entryAdded' && ['error', 'warning'].includes(m.params.entry.level)) logs.push('LOG ' + m.params.entry.level + ' ' + m.params.entry.text + ' ' + (m.params.entry.url || ''));
  if (m.method === 'Tracing.dataCollected') traceEvents.push(...m.params.value);
  if (m.method === 'Tracing.tracingComplete') traceDone?.();
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJS = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable'); await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: P.w, height: P.h, deviceScaleFactor: P.dpr, mobile: P.mobile });
if (P.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
if (flag('--reduced')) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
if (P.cpu > 1) await send('Emulation.setCPUThrottlingRate', { rate: P.cpu });
if (P.net) await send('Network.emulateNetworkConditions', { offline: false, ...P.net });
const blockIdx = rest.indexOf('--block');
if (blockIdx >= 0) await send('Network.setBlockedURLs', { urls: rest[blockIdx + 1].split(',') });

// enregistreur injecté avant tout script de la page (mesure uniquement)
const cssIdx = rest.indexOf('--css');
if (cssIdx >= 0) await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const css = ${JSON.stringify(rest[cssIdx + 1] || '')}; const add = () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }; document.head ? add() : document.addEventListener('DOMContentLoaded', add); new MutationObserver((m, o) => { if (document.head) { add(); o.disconnect(); } }).observe(document.documentElement, { childList: true }); })();` });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.__m = { frames: [], long: [], lcp: [], cls: 0, t0: performance.now() };
  (function loop(t){ __m.frames.push(t); requestAnimationFrame(loop); })(performance.now());
  new PerformanceObserver(l => l.getEntries().forEach(e => __m.long.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver(l => l.getEntries().forEach(e => __m.lcp.push([Math.round(e.startTime), (e.element && (e.element.tagName + '.' + e.element.className).slice(0, 60)) || '?', e.size]))).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) __m.cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
` });

if (traceOut) await send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline.frame,blink.user_timing,loading', transferMode: 'ReportEvents' });
await send('Page.navigate', { url });
await sleep(profile.startsWith('mobile') ? 7000 : 4000);                 // chargement + intro
const introEnd = await evalJS('performance.now()');
// premier scroll : sur mobile un vrai geste tactile (défilement natif), sur ordinateur 24 crans de molette
const scrollStart = Date.now();
if (P.mobile) {
  // 6 balayages du doigt de 480 px (doigt posé, 16 déplacements à ~60 Hz, doigt levé)
  const x = Math.round(P.w / 2);
  for (let k = 0; k < 6; k++) {
    let y = Math.round(P.h * 0.8);
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 0; i < 16; i++) { y -= 30; await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await sleep(16); }
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(120);
  }
} else {
  for (let i = 0; i < 24; i++) {
    await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: P.w / 2, y: P.h / 2, deltaX: 0, deltaY: 120 });
    await sleep(60);
  }
}
await sleep(1500);
const scrollMs = Date.now() - scrollStart;
if (traceOut) { const done = new Promise(r => (traceDone = r)); await send('Tracing.end'); await done; writeFileSync(traceOut, JSON.stringify({ traceEvents })); }

const res = await evalJS(`(() => {
  const f = __m.frames, split = ${introEnd};
  const win = (a, b) => { const d = []; for (let i = 1; i < f.length; i++) if (f[i] > a && f[i] <= b) d.push(f[i] - f[i-1]);
    const dropped = d.filter(x => x > 25).length; const avg = d.reduce((s, x) => s + x, 0) / (d.length || 1);
    return { frames: d.length, fps: Math.round(1000 / avg), dropped, worstMs: Math.round(Math.max(0, ...d)) }; };
  const first = f.find(t => t > 0) || 0;
  let gl = 'n/a'; try { const c = document.createElement('canvas').getContext('webgl'); const x = c && c.getExtension('WEBGL_debug_renderer_info'); gl = c ? (x ? c.getParameter(x.UNMASKED_RENDERER_WEBGL) : 'webgl') : 'none'; } catch (e) { gl = 'error'; }
  return {
    intro: win(first + 300, split), timeline: (window.__hero && window.__hero.introStartAt) ? win(window.__hero.introStartAt, window.__hero.introDoneAt || split) : null, scroll: win(split, split + ${scrollMs}),
    lcp: __m.lcp.at(-1), lcpAll: __m.lcp.map(x => x.join('|')).join('  '), cls: +__m.cls.toFixed(3), longTasks: __m.long.length, longList: __m.long.map(x => x.join('+')).join(' '), introEndAt: Math.round(split), introDoneAt: window.__introDoneAt || null, planetAt: window.__planet && window.__planet.startAt, longMs: __m.long.reduce((s, x) => s + x[1], 0),
    overflowX: document.documentElement.scrollWidth - innerWidth, webgl: gl,
    tier: document.documentElement.dataset.tier || '-', scrollY: Math.round(scrollY)
  };
})()`);
console.log(JSON.stringify({ profile, ...res, console: logs }, null, 1));
ws.close();
// sous Windows, Edge relance ses processus hors de l'arbre de proc : on ferme tous ceux qui utilisent
// notre profil temporaire (sinon ils s'accumulaient, 147 trouvés, et faussaient les mesures suivantes)
if (process.platform === 'win32') {
  const dir = profileDir.split(/[\\/]/).pop();
  spawn('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -like '*${dir}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' })
    .on('exit', () => process.exit(0));
} else { proc.kill(); process.exit(0); }
