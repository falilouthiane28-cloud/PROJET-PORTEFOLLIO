// Serveur statique local qui imite un CDN : compression Brotli/gzip et en-têtes de cache.
// Sert à mesurer (Lighthouse, traces) dans des conditions proches de la production.
// Usage : node scripts/serve.mjs <dossier> <port>
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json'
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg', '.txt', '.xml', '.webmanifest']);
const cache = new Map(); // compression faite une seule fois par fichier

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(root, path));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    const info = await stat(file).catch(() => null);
    if (!info || !info.isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404'); return; }
    const ext = extname(file).toLowerCase();
    const headers = { 'content-type': TYPES[ext] || 'application/octet-stream', vary: 'accept-encoding' };
    // fichiers hachés par Vite : cache immuable ; le reste : revalidation
    headers['cache-control'] = /\/assets\/.+-[\w-]{8,}\.\w+$/.test(path) ? 'public, max-age=31536000, immutable' : 'no-cache';
    let body = await readFile(file);
    const accept = req.headers['accept-encoding'] || '';
    if (COMPRESSIBLE.has(ext)) {
      const key = file + info.mtimeMs;
      if (/\bbr\b/.test(accept)) {
        if (!cache.has(key + 'br')) cache.set(key + 'br', brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }));
        body = cache.get(key + 'br'); headers['content-encoding'] = 'br';
      } else if (/\bgzip\b/.test(accept)) {
        if (!cache.has(key + 'gz')) cache.set(key + 'gz', gzipSync(body, { level: 9 }));
        body = cache.get(key + 'gz'); headers['content-encoding'] = 'gzip';
      }
    }
    headers['content-length'] = body.length;
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
}).listen(port, () => console.log(`http://localhost:${port}  <-  ${root}`));
