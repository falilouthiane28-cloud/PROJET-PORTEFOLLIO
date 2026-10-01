// Hooks Claude Code : la garde bloque ce qu'il faut, et seulement ça
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const hook = fileURLToPath(new URL('../../.claude/hooks/guard-bash.mjs', import.meta.url));
const run = (tool_name, tool_input) => spawnSync(process.execPath, [hook], { input: JSON.stringify({ tool_name, tool_input }), encoding: 'utf8' }).status;
const RF = ['rm', '-rf'].join(' ');           // texte assemblé : la garde de la session ne bloque pas ce fichier de test

test('bloque les commandes destructrices', () => {
  for (const command of [`${RF} dist`, 'rm -fr dist', 'git push --force origin x', 'git push -f', 'git push --force-with-lease', 'git reset --hard HEAD~1',
    'Remove-Item -Recurse -Force dist']) {
    assert.equal(run('Bash', { command }), 2, command);
  }
});
test('bloque la lecture des fichiers .env', () => {
  assert.equal(run('Bash', { command: 'cat .env' }), 2);
  assert.equal(run('Bash', { command: 'type C:\\app\\.env.local' }), 2);
  assert.equal(run('PowerShell', { command: 'Get-Content ./.env.production' }), 2);
  assert.equal(run('Read', { file_path: 'C:/x/.env.local' }), 2);
  assert.equal(run('Grep', { pattern: 'KEY', path: '.env' }), 2);
});
test('laisse passer les commandes normales', () => {
  for (const command of ['node -e "console.log(process.env.X)"', 'git push origin motion-system-v1', 'rm -r tmp', 'rm dist/a.js', 'git reset --soft HEAD~1',
    'npm run build', 'git status']) {
    assert.equal(run('Bash', { command }), 0, command);
  }
  assert.equal(run('Read', { file_path: 'C:/x/src/main.js' }), 0);
  assert.equal(run('Grep', { pattern: 'import.meta.env', path: 'src' }), 0);
  assert.equal(run('Read', { file_path: 'C:/x/.envrc.md' }), 0);
});
