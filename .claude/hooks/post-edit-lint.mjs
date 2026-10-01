// PostToolUse (Edit|Write) : nettoyage sûr du fichier modifié puis lint.
// « Formatage » volontairement minimal (espaces en fin de ligne, saut de ligne final) : un formateur complet
// réécrirait tout le style compact d'origine. Erreurs de lint → code 2 : le message remonte à Claude.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { relative, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, readInput } from './lib.mjs';

const input = await readInput();
const file = input.tool_input?.file_path;
if (!file || !existsSync(file)) process.exit(0);
const rel = relative(ROOT, file).split('\\').join('/');
if (rel.startsWith('..') || /^(node_modules|dist|perf|reports|research_notes)\//.test(rel)) process.exit(0);

const ext = extname(file);
if (['.js', '.mjs', '.css', '.html', '.md', '.json'].includes(ext)) {
  const src = readFileSync(file, 'utf8');
  const clean = src.replace(/[ \t]+$/gm, '').replace(/\n*$/, '\n');
  if (clean !== src) writeFileSync(file, clean);
}
if (['.js', '.mjs'].includes(ext)) {
  const r = spawnSync(process.execPath, [`${ROOT}/node_modules/eslint/bin/eslint.js`, '--no-warn-ignored', file], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    process.stderr.write(`ESLint a trouvé des erreurs dans ${rel} :\n${r.stdout || r.stderr}`);
    process.exit(2);
  }
}
process.exit(0);
