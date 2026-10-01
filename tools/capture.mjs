// Capture window.__png d'une page servie par `vite` (outil de génération du poster).
// Usage : node tools/capture.mjs <url> <sortie.png>
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [,, url, out] = process.argv;
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9800 + Math.floor(Math.random() * 150);
const proc = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'po-'))}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let list;
for (let i = 0; i < 60; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (list.length) break; } catch {} await sleep(200); }
const ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable');
await send('Page.navigate', { url });
let png = null;
for (let i = 0; i < 60 && !png; i++) { await sleep(300); png = (await send('Runtime.evaluate', { expression: 'window.__png || null', returnByValue: true })).result?.result?.value; }
if (!png) { console.error('rendu introuvable'); process.exit(1); }
writeFileSync(out, Buffer.from(png.split(',')[1], 'base64'));
console.log('ok', out);
ws.close(); proc.kill(); process.exit(0);
