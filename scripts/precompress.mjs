// Pré-compresse les fichiers texte du build (.br et .gz à côté de l'original).
// La plupart des CDN servent automatiquement ces versions : aucune compression à la volée.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

const dir = process.argv[2] || 'dist';
const TEXT = new Set(['.html', '.js', '.css', '.svg', '.json', '.txt', '.xml', '.webmanifest']);
let n = 0, before = 0, after = 0;
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!TEXT.has(extname(p))) continue;
    const buf = readFileSync(p);
    if (buf.length < 1024) continue;
    const br = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } });
    writeFileSync(p + '.br', br);
    writeFileSync(p + '.gz', gzipSync(buf, { level: 9 }));
    n++; before += buf.length; after += br.length;
  }
})(dir);
console.log(`précompression : ${n} fichiers, ${(before / 1024).toFixed(1)} Ko -> ${(after / 1024).toFixed(1)} Ko en Brotli`);
