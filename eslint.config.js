// Lint seulement (pas de formatage automatique : le code garde son style compact d'origine).
// Règles visées : erreurs réelles (variables inconnues, code mort, promesses oubliées), pas le style.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'perf/**', 'reports/**', 'research_notes/**', '_conception/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.browser } },
    rules: {
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  },
  {
    files: ['src/js/hero/worker.js'],
    languageOptions: { globals: { ...globals.worker } }
  },
  {
    files: ['scripts/**/*.mjs', 'tools/**/*.{js,mjs}', 'test/**/*.{js,mjs}', '.claude/hooks/**/*.mjs', '*.config.js', '.githooks/**/*.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
    rules: {
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  }
];
