// PreToolUse (Bash|PowerShell|Read|Grep) : bloque les commandes destructrices et toute lecture de fichiers .env.
// Code 2 = action refusée, le message (stderr) est renvoyé à Claude.
import { readInput } from './lib.mjs';

const input = await readInput();
const t = input.tool_input || {};
const shell = input.tool_name === 'Bash' || input.tool_name === 'PowerShell';
const target = shell ? String(t.command || '') : [t.file_path, t.path, t.glob, t.pattern].filter(Boolean).join(' ');

// un fichier .env, .env.local, .env.production… (pas process.env ni import.meta.env)
const ENV_FILE = /(^|[\s"'=/\\])\.env(\.[\w-]+)*(?=$|[\s"'/\\;|&)])/i;
const SHELL_RULES = [
  [/\brm\s+(-\w*r\w*f\w*|-\w*f\w*r\w*|--recursive\s+--force|--force\s+--recursive)\b/i, 'rm -rf est interdit : supprimer les fichiers un par un après les avoir regardés.'],
  [/Remove-Item\b[^|;]*-Recurse\b[^|;]*-Force|Remove-Item\b[^|;]*-Force\b[^|;]*-Recurse/i, 'Remove-Item -Recurse -Force est interdit.'],
  [/\bgit\s+push\b[^|;&]*\s(--force(-with-lease)?|-f)(\s|$)/i, 'git push --force est interdit (jamais de réécriture d’historique).'],
  [/\bgit\s+reset\b[^|;&]*--hard\b/i, 'git reset --hard est interdit : utiliser git stash ou un nouveau commit.']
];

const rules = [...(shell ? SHELL_RULES : []), [ENV_FILE, 'Lecture des fichiers .env interdite (secrets).']];
for (const [re, msg] of rules) {
  if (re.test(target)) { process.stderr.write(`Bloqué par .claude/hooks/guard-bash.mjs : ${msg}`); process.exit(2); }
}
process.exit(0);
