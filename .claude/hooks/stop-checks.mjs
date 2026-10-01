// Stop : vérifications rapides avant de rendre la main (lint, tests unitaires, build).
// Ne relance rien si les sources n'ont pas changé depuis la dernière vérification réussie (cache par empreinte).
// Échec → code 2 : Claude voit l'erreur et continue. Une seule relance par état, pour éviter les boucles.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { ROOT, readInput } from './lib.mjs';

const input = await readInput();
const git = args => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' }).stdout || '';
const state = createHash('sha1').update(git(['status', '--porcelain', '--', 'src', 'test', 'index.html', 'vite.config.js', 'package.json']) + git(['diff', '--', 'src', 'test', 'index.html']) + git(['rev-parse', 'HEAD'])).digest('hex');
const cacheDir = `${ROOT}/.claude/.cache`; mkdirSync(cacheDir, { recursive: true });
const okFile = `${cacheDir}/stop-ok`, failFile = `${cacheDir}/stop-fail`;
if (existsSync(okFile) && readFileSync(okFile, 'utf8') === state) process.exit(0);
if ((input.stop_hook_active || input.previous_response_blocked) && existsSync(failFile) && readFileSync(failFile, 'utf8') === state) process.exit(0);

const node = process.execPath;
const steps = [
  ['lint', [`${ROOT}/node_modules/eslint/bin/eslint.js`, '.']],
  ['tests unitaires', ['--test', 'test/unit/*.test.mjs']],
  ['build', [`${ROOT}/node_modules/vite/bin/vite.js`, 'build', '--logLevel', 'error']]
];
for (const [name, args] of steps) {
  const r = spawnSync(node, args, { cwd: ROOT, encoding: 'utf8', timeout: 110000 });
  if (r.status !== 0) {
    writeFileSync(failFile, state);
    process.stderr.write(`Vérification « ${name} » en échec :\n${(r.stdout + r.stderr).slice(-3000)}`);
    process.exit(2);
  }
}
writeFileSync(okFile, state);
process.exit(0);
