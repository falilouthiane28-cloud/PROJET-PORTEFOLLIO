// Outils communs aux hooks : lecture de l'entrée JSON (stdin) et racine du projet.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

export const ROOT = process.env.CLAUDE_PROJECT_DIR || resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export async function readInput() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
}
