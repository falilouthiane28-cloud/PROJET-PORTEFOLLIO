// node render.mjs stills 0.5,2.8,...   |   node render.mjs video out.mp4
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');

const ROOT = new URL('../../', import.meta.url).pathname;
const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.webp':'image/webp', '.woff2':'font/woff2', '.png':'image/png' };
const srv = createServer(async (q, r) => {
  try { const f = join(ROOT, decodeURIComponent(q.url.split('?')[0])); r.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); r.end(await readFile(f)); }
  catch { r.writeHead(404); r.end(); }
}).listen(0);
const port = srv.address().port;

const [mode, arg] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--hide-scrollbars', '--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('PAGEERROR', e.message));
page.on('console', m => m.type() === 'error' && console.error('CONSOLE', m.text()));
await page.goto(`http://127.0.0.1:${port}/brag-output/work/scene.html`);
await page.evaluate(() => window.ready);

if (mode === 'stills') {
  for (const t of arg.split(',').map(Number)) {
    await page.evaluate(t => window.seek(t), t);
    await page.screenshot({ path: `stills/t${t.toFixed(2)}.png` });
  }
} else {
  const FPS = 30, dur = await page.evaluate(() => window.DURATION), N = Math.round(dur * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', arg], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < N; i++) {
    await page.evaluate(t => window.seek(t), i / FPS);
    const buf = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${N}`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close(); srv.close();
