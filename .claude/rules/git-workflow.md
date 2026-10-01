# Git

## Branches

- `main` : refonte blanc/lilas rejetée, gardée pour l'historique.
- `hero-animation-v2` : design d'origine restauré et hero réanimé.
- `motion-system-v1` : système de mouvement, structure du projet et tests.
- **Travail nouveau :** sur une nouvelle branche `sujet-vN`.

## Commits

- **Un sujet par commit**, petit et vérifié : modification, build, mesure, commit.
- **Message en français :** `type(portée): résumé`, avec `type` parmi `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `chore`. Le corps du message explique le pourquoi et la mesure.
- **Signature :** chaque commit écrit par Claude se termine par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Pre-commit :** le hook `.githooks/pre-commit` lance lint, tests unitaires et budget du bundle, et bloque en cas d'échec. Pas de `--no-verify`.

## Interdits

- `git push --force`, `git reset --hard` et toute réécriture d'historique : bloqués par le hook `.claude/hooks/guard-bash.mjs`.
- **Secrets :** ne jamais lire ni committer `.env*`, des clés ou des jetons.
- **Pas de push sans demande explicite.**
