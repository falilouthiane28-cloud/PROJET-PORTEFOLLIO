# Structuring a small vanilla-JS Vite repo (Windows) for Claude Code — CLAUDE.md, rules, subagents, hooks, git pre-commit

Research date: 2026-10-01. All Claude Code facts come from the current official docs at code.claude.com (fetched today). Doc pages cite features up to Claude Code v2.1.283.

## 1. CLAUDE.md: recommended length/content, @imports, memory hierarchy

### Takeaway
Keep each CLAUDE.md under ~200 lines. Put in it only facts Claude needs in every session and can't work out from the code: commands, conventions that differ from defaults, gotchas, repo etiquette. Use `@path` imports to organise the file, but they don't save context. Files are concatenated (none overrides another), from broadest scope to narrowest: managed → user → project → local.

### Cited Findings
- Locations, in load order: Managed policy (Windows: `C:\Program Files\ClaudeCode\CLAUDE.md`), User `~/.claude/CLAUDE.md`, Project `./CLAUDE.md` **or** `./.claude/CLAUDE.md`, Local `./CLAUDE.local.md` ("add to `.gitignore`") — [Memory docs](https://code.claude.com/docs/en/memory)
- "All discovered files are concatenated into context rather than overriding each other." Content is ordered from the filesystem root down to the cwd. In each directory, `CLAUDE.local.md` is appended after `CLAUDE.md` — [Memory docs](https://code.claude.com/docs/en/memory)
- CLAUDE.md files in subdirectories below the cwd "are included when Claude reads files in those subdirectories" (lazy loading) — [Memory docs](https://code.claude.com/docs/en/memory)
- Size: "target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence." Claude Code loads a CLAUDE.md of up to 4 MiB in full and skips a larger one. You get a startup warning when a file is over the recommended length, or when the files together pass a combined limit — [Memory docs](https://code.claude.com/docs/en/memory)
- Content: "Keep it to facts Claude should hold in every session: build commands, conventions, project layout, 'always do X' rules. If an entry is a multi-step procedure or only matters for one part of the codebase, move it to a skill or a path-scoped rule" — [Memory docs](https://code.claude.com/docs/en/memory)
- Include/Exclude table. Include: "Bash commands Claude can't guess", "Code style rules that differ from defaults", "Testing instructions", "Repository etiquette", "Architectural decisions specific to your project", "Developer environment quirks", "Common gotchas". Exclude: "Anything Claude can figure out by reading code", "Standard language conventions", "Detailed API documentation (link to docs instead)", "Information that changes frequently", "Long explanations or tutorials", "File-by-file descriptions of the codebase", "Self-evident practices like 'write clean code'" — [Best practices](https://code.claude.com/docs/en/best-practices)
- Pruning test: "For each line, ask: 'Would removing this cause Claude to make mistakes?' If not, cut it. Bloated CLAUDE.md files cause Claude to ignore your actual instructions!" For emphasis, add "IMPORTANT" to a single line only: "If you emphasize many lines, none of them stands out." — [Best practices](https://code.claude.com/docs/en/best-practices)
- Write instructions concretely, e.g. "Run `npm test` before committing" rather than "Test your changes". Group them under markdown headers and bullets. Contradictory instructions mean "Claude may pick one arbitrarily" — [Memory docs](https://code.claude.com/docs/en/memory)
- CLAUDE.md is advisory. It is "delivered as a user message after the system prompt". To enforce a rule regardless of what Claude decides, "use a PreToolUse hook". Anything that must run at a fixed point (before every commit, after each edit) belongs in a hook — [Memory docs](https://code.claude.com/docs/en/memory)
- Imports: `@path/to/import`. Relative and absolute paths both work, and relative paths resolve "relative to the file containing the import, not the working directory". Imports can recurse to a "maximum depth of four hops". Imported files "also load at launch", so they don't reduce context cost — [Memory docs](https://code.claude.com/docs/en/memory)
- Paths containing spaces need a backslash before each space (`@Design\ Docs/api.md`). A quoted path is not imported. Imports inside backticks or code blocks are skipped, so writing `` `@README` `` keeps the text literal — [Memory docs](https://code.claude.com/docs/en/memory)
- The first time a project-level file imports something outside the working directory (an external import), Claude Code shows an approval dialog — [Memory docs](https://code.claude.com/docs/en/memory)
- Block-level HTML comments (`<!-- ... -->`) in CLAUDE.md are stripped before injection. Use them for maintainer notes that cost no context — [Memory docs](https://code.claude.com/docs/en/memory)
- The project-root CLAUDE.md is re-read from disk after `/compact`. Nested CLAUDE.md files and path-scoped rules reload only when a matching file is read again — [Memory docs](https://code.claude.com/docs/en/memory)
- Run `/context` to check which memory files loaded, `/memory` to edit them, and `/init` to generate a starter file. `/doctor prompt-audit` (v2.1.283+) audits CLAUDE.md, rules and agents for stale or conflicting content — [Memory docs](https://code.claude.com/docs/en/memory)
- AGENTS.md is read only when no CLAUDE.md/CLAUDE.local.md exists in the cwd or above it (default `claude-md-or-agents-md`, v2.1.277+) — [Memory docs](https://code.claude.com/docs/en/memory)
- Auto memory (`~/.claude/projects/<project>/memory/MEMORY.md`) is separate from CLAUDE.md. Its first 200 lines or 25KB load every session — [Memory docs](https://code.claude.com/docs/en/memory)

### Inferences
- This repo already has `projet.md`, `memory.md` and `process.md` (commit 3f96ffb). A lean root `CLAUDE.md` could list the commands (`npm run dev`, `npm run build`, the frame script) and the critical conventions, then add `@process.md` only if every session needs it. Otherwise point to those files in backticks so they aren't loaded.
- The user already has a global `~/.claude/CLAUDE.md` (graphify). It loads before the project file, so keep the two consistent.

### Gaps
- The docs give no numeric value for the "combined limit" warning threshold.

## 2. `.claude/rules/*.md`: automatic loading, frontmatter, exact behaviour

### Takeaway
Yes, rules load automatically. Every `.md` file under `.claude/rules/` is discovered recursively. A rule without frontmatter loads at launch with the same priority as `.claude/CLAUDE.md`. A rule with `paths:` frontmatter loads only when Claude **reads** a file that matches its globs. `paths` is the only frontmatter field Claude Code reads.

### Cited Findings
- "All `.md` files are discovered recursively, so you can organize rules into subdirectories" — [Memory docs](https://code.claude.com/docs/en/memory)
- "Rules without `paths` frontmatter are loaded at launch with the same priority as `.claude/CLAUDE.md`." — [Memory docs](https://code.claude.com/docs/en/memory)
- Exact syntax:
  ```markdown
  ---
  paths:
    - "src/api/**/*.ts"
  ---
  ```
  "Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use." — [Memory docs](https://code.claude.com/docs/en/memory)
- Frontmatter reference: "`paths` is the only field Claude Code reads from a rule; any other field is ignored without an error." It "Accepts a YAML list or a comma-separated string". The frontmatter is removed before the rule loads into context — [Memory docs](https://code.claude.com/docs/en/memory)
- If the YAML fails to parse, "Claude Code ignores the frontmatter and loads the rule as if it had no `paths`" (run `claude --debug` to see the error) — [Memory docs](https://code.claude.com/docs/en/memory)
- Glob examples: `**/*.ts`, `src/**/*`, `*.md` (root only), and brace expansion `src/**/*.{ts,tsx}`. A rule's `paths` list has a budget of 1,000 expanded patterns. A literal `[` must be escaped as `\[` — [Memory docs](https://code.claude.com/docs/en/memory)
- User-level rules in `~/.claude/rules/` apply to every project and load before project rules. If the two conflict, Claude "may follow either one" — [Memory docs](https://code.claude.com/docs/en/memory)
- Symlinks are supported. A symlink whose target is outside the working directory is treated like an external import that needs approval — [Memory docs](https://code.claude.com/docs/en/memory)
- The docs recommend skills (`.claude/skills/<name>/SKILL.md`) over rules for task-specific instructions, because skills load only when they are invoked or judged relevant — [Memory docs](https://code.claude.com/docs/en/memory)

### Inferences
- Suggested layout for this repo: `.claude/rules/hero.md` with `paths: ["src/js/hero/**/*.js", "src/styles/hero.css"]`, `.claude/rules/css.md` with `paths: "src/styles/**/*.css"`, and possibly a rule with no paths for general conventions. Use quoted glob strings, as the docs do.
- Because loading is triggered by reads, a `paths` rule has no effect when Claude writes a new file without reading a matching file first.

### Gaps
- The docs don't say whether a Write to a new matching file (with no prior Read) triggers a path rule. The wording "when Claude reads files" suggests it doesn't.

## 3. `.claude/agents/*.md` subagent frontmatter

### Takeaway
A subagent file is YAML frontmatter plus a markdown body, and the body is the system prompt. Only `name` and `description` are required. Give `tools` as a comma-separated string or a YAML list; if you omit it, the agent inherits every tool. `model` accepts `sonnet`, `opus`, `haiku`, `fable`, a full model ID, or `inherit`.

### Cited Findings
- Locations by priority: managed settings > `--agents` CLI flag > `.claude/agents/` (project) > `~/.claude/agents/` (user) > a plugin's `agents/`. When two subagents share a name, the higher-priority one wins — [Sub-agents docs](https://code.claude.com/docs/en/sub-agents)
- Frontmatter fields:
  - `name`: required, unique, "Cannot contain `:` or start with `-`"
  - `description`: required, says when Claude should delegate to the agent
  - `tools`: optional comma-separated string or YAML list; "Inherits every tool available to subagents if omitted"
  - `disallowedTools`: same format; removes tools from the inherited or listed set
  - `model`: `sonnet`, `opus`, `haiku`, `fable`, a full ID such as `claude-opus-5-5`, or `inherit`
  - Other fields: `permissionMode` (`default`, `acceptEdits`, `auto`, `dontAsk`, `bypassPermissions`, `plan`, `manual`), `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory` (`user`/`project`/`local`), `background`, `omitClaudeMd`, `effort` (`low`…`max`), `isolation` (`worktree`), `color` (`red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`), `initialPrompt`, `experimental`

  — [Sub-agents docs](https://code.claude.com/docs/en/sub-agents)
- Model resolution order: per-invocation `model` parameter → frontmatter `model` → `CLAUDE_CODE_SUBAGENT_MODEL` env var → main conversation's model — [Sub-agents docs](https://code.claude.com/docs/en/sub-agents)
- Canonical example:
  ```markdown
  ---
  name: code-reviewer
  description: Reviews code for quality and best practices
  tools: Read, Glob, Grep
  model: sonnet
  ---
  You are a code reviewer. ...
  ```
  — [Sub-agents docs](https://code.claude.com/docs/en/sub-agents); a similar `security-reviewer` example with `tools: Read, Grep, Glob, Bash` and `model: opus` — [Best practices](https://code.claude.com/docs/en/best-practices)
- Subagents can have scoped hooks in frontmatter (e.g. `hooks: PreToolUse: - matcher: "Bash" hooks: - type: command command: "./scripts/validate-readonly-query.sh"`) that apply only while the subagent runs — [Sub-agents docs](https://code.claude.com/docs/en/sub-agents), [Hooks reference](https://code.claude.com/docs/en/hooks)
- The main conversation's auto memory is not loaded into subagents (forks excepted) — [Memory docs](https://code.claude.com/docs/en/memory)
- Best practice is to use subagents for investigation and adversarial review in a fresh context, and to tell the reviewer to "flag only gaps that affect correctness or the stated requirements" — [Best practices](https://code.claude.com/docs/en/best-practices)

### Inferences
- For a read-only reviewer or auditor (perf/a11y/motion review), set `tools: Read, Grep, Glob` (plus `Bash` if it must run `npm run build`) and `model: sonnet` or `inherit`. Write the `description` as a "use when…" trigger.

### Gaps
- I didn't fetch the full sub-agents page sections on `memory` and `skills` semantics. The field list above comes from a summarised fetch, so check rare fields (`experimental`, `initialPrompt`) against the page before relying on them.

## 4. Hooks in `.claude/settings.json`: schema, matchers, payload, exit codes, JSON, timeouts, `$CLAUDE_PROJECT_DIR`, Windows

### Takeaway
The structure is `hooks → EventName → [ { matcher, hooks: [ { type: "command", command, args?, timeout?, if?, shell? } ] } ]`. The hook receives JSON on stdin. Exit 2 blocks the action and sends stderr to Claude, but only on events that can block (PreToolUse, Stop and others; PostToolUse can't block because the tool already ran). On Windows, shell-form hooks run in **Git Bash**, or PowerShell when Git Bash is absent. The most robust way to run a Node hook is **exec form**: `"command": "node", "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/x.mjs"]`.

### Cited Findings
**Schema and locations**
- Example shape:
  ```json
  {"hooks":{"PostToolUse":[{"matcher":"Edit|Write","hooks":[{"type":"command","command":"..."}]}]}}
  ```
  Handler types are `command`, `http`, `mcp_tool`, `prompt` and `agent` — [Hooks guide](https://code.claude.com/docs/en/hooks-guide), [Hooks reference](https://code.claude.com/docs/en/hooks)
- Locations: `~/.claude/settings.json` (user), `.claude/settings.json` (project, committable), `.claude/settings.local.json` (project, gitignored), managed policy, plugin `hooks/hooks.json`, skill/agent frontmatter. Hooks from all levels are merged — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Project-settings hooks follow a workspace trust rule — [Hooks reference](https://code.claude.com/docs/en/hooks) (see also [Permissions: workspace trust](https://code.claude.com/docs/en/permissions))
- Settings JSON allows no trailing commas or comments. Edits are "normally picked up automatically"; restart the session if they aren't. `/hooks` opens a read-only browser of configured hooks — [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- `"disableAllHooks": true` disables every hook — [Hooks reference](https://code.claude.com/docs/en/hooks)

**Matchers**
- `"*"`, `""` or an omitted matcher matches everything. A value made only of letters, digits, `_`, `-`, spaces, `,` and `|` is an exact name or a list of names, so `Bash` matches only Bash and `Edit|Write` (or `Edit, Write`) matches either. Any other character makes it an unanchored JavaScript regex: "`Edit.*` matches both `Edit` and `NotebookEdit`; wrap the pattern in `^` and `$`". Matchers are case-sensitive — [Hooks reference](https://code.claude.com/docs/en/hooks), [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- Tool events (`PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PermissionDenied`) match on the tool name. `Stop` and `UserPromptSubmit` don't support matchers and fire every time — [Hooks reference](https://code.claude.com/docs/en/hooks)
- The optional `if` field uses permission-rule syntax, such as `"Bash(git *)"` or `"Edit(*.ts)"`, to filter further. It is evaluated only on tool events; "On other events, a hook with `if` set never runs" — [Hooks reference](https://code.claude.com/docs/en/hooks)

**stdin payload**
- Common fields: `session_id`, `prompt_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name` (plus `agent_id`/`agent_type` inside subagents) — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Tool events add `tool_name`, `tool_input`, `tool_use_id`, and `tool_response` on PostToolUse. For Bash, `tool_input` has `command`, `description`, `timeout` and `run_in_background`. For Write/Edit it has `file_path`, plus `content` (Write) or `old_string`/`new_string` (Edit) — [Hooks reference](https://code.claude.com/docs/en/hooks)
- The official protect-files example normalises Windows backslashes in `file_path` before matching patterns, which implies paths can arrive with `\` separators — [Hooks guide](https://code.claude.com/docs/en/hooks-guide)

**Exit codes**
- Exit 0 means no objection. On PreToolUse it does **not** auto-approve; the normal permission flow still applies. Stdout is parsed as JSON if it starts with `{` and ends with `}`. "Stderr from a hook that exits 0 goes to the debug log only … Claude never sees it." — [Hooks guide](https://code.claude.com/docs/en/hooks-guide), [Hooks reference](https://code.claude.com/docs/en/hooks)
- Exit 2 is a blocking error and stderr becomes the reason. Per event: `PreToolUse` → "Blocks the tool call"; `PostToolUse` → "No | Shows stderr to Claude; the tool already ran"; `Stop` → "Prevents Claude from stopping, continues the conversation"; `SubagentStop` → "Prevents the subagent from stopping" — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Exit 1 or any other code is a non-blocking error. "Exit 1 does NOT block (use exit 2 to block)". The transcript shows a "hook error" notice with the first line of stderr — [Hooks reference](https://code.claude.com/docs/en/hooks), [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- "Use exit 2 to block with a stderr message, or exit 0 with JSON for structured control. Choose one approach per hook." — [Hooks guide](https://code.claude.com/docs/en/hooks-guide)

**JSON output**
- Universal fields: `continue`, `stopReason`, `suppressOutput`, `systemMessage`. Event decisions use `decision: "block"` + `reason` (PostToolUse, Stop) or `hookSpecificOutput` — [Hooks reference](https://code.claude.com/docs/en/hooks)
- PreToolUse: `hookSpecificOutput.hookEventName: "PreToolUse"`, `permissionDecision` (`"allow"`/`"deny"`/`"ask"`, plus `"defer"` only in `-p` mode), `permissionDecisionReason`, `updatedInput`, `additionalContext`. `permissionDecision` must sit **inside** `hookSpecificOutput`. A `deny` blocks the call even in `bypassPermissions` mode, but an `allow` doesn't override settings deny rules — [Hooks guide](https://code.claude.com/docs/en/hooks-guide), [Hooks reference](https://code.claude.com/docs/en/hooks)
- PostToolUse can return `decision: "block"` + `reason` as feedback to Claude (the tool has already run), and `hookSpecificOutput.updatedToolOutput` / `additionalContext` — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Pitfall: an unconditional `echo` in a shell profile (Git Bash sources it) adds text before the JSON. Claude Code then treats the output as plain text and ignores the JSON without any error — [Hooks guide](https://code.claude.com/docs/en/hooks-guide)

**Timeouts and parallelism**
- `timeout` is in **seconds**. The default is 600 s for `command`/`http`/`mcp_tool` (30 s on `UserPromptSubmit`), 30 s for `prompt` and 60 s for `agent` — [Hooks reference](https://code.claude.com/docs/en/hooks)
- "Claude Code runs all matching hooks in parallel." When several hooks return `updatedInput`, the last one to finish wins, which is non-deterministic — [Hooks guide](https://code.claude.com/docs/en/hooks-guide)

**`$CLAUDE_PROJECT_DIR` and Windows/Node**
- `${CLAUDE_PROJECT_DIR}` is "the project root where the session started". It is substituted into `command` and `args` and also exported as an env var, so scripts can read `process.env.CLAUDE_PROJECT_DIR` — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Shell form (no `args`): "`sh -c` on macOS and Linux, Git Bash on Windows, or PowerShell when Git Bash isn't installed." The `shell` field accepts `"bash"` or `"powershell"`, defaults to `"bash"` (or `"powershell"` on Windows without Git Bash), and is ignored when `args` is set. In shell form, "wrap each placeholder in double quotes", as in `"\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh"` — [Hooks reference](https://code.claude.com/docs/en/hooks), [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- Exec form (with `args`) spawns the command directly with no shell and no quoting issues. "On Windows, exec form requires `command` to resolve to a real executable such as a `.exe`. The `.cmd` and `.bat` shims that npm, npx, eslint … install … can't be spawned without a shell … invoke the underlying script with `node` directly … The `node` plus script-path pattern works on every platform because `node.exe` is a real binary." — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Official example: `{"type":"command","command":"node","args":["${CLAUDE_PLUGIN_ROOT}/scripts/format.js","--fix"]}`, with the shell-form equivalent `"node \"${CLAUDE_PROJECT_DIR}\"/scripts/format.js --fix"` — [Hooks reference](https://code.claude.com/docs/en/hooks)
- To get the docs' `jq` examples working on Windows, install jq "or use Python/Node.js for JSON parsing" — [Hooks guide](https://code.claude.com/docs/en/hooks-guide)

### Inferences
- Recommended pattern for this repo: write Node `.mjs` hook scripts in `.claude/hooks/` that read stdin JSON (`let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const p=JSON.parse(s);...})`) and register them in exec form:
  `{"type":"command","command":"node","args":["${CLAUDE_PROJECT_DIR}/.claude/hooks/guard.mjs"],"timeout":30}`.
  This removes the need for jq, avoids Git Bash vs PowerShell differences, and copes with the space-free but long path `C:\Users\fallo\Desktop\PROJET-PORTFOLLIO`.
- Inside the scripts, normalise `tool_input.file_path` with `.replace(/\\/g,'/')` before glob or regex checks.
- PreToolUse with matcher `Bash` can block dangerous commands (exit 2 with a stderr message). PostToolUse with `Edit|Write` can lint or check edited files and report problems through exit 2 stderr, which Claude sees but which doesn't undo the edit.

### Gaps
- I didn't confirm whether exec form expands `${CLAUDE_PROJECT_DIR}` when `command` itself is an npm `.cmd` shim. The docs simply say not to use shims in exec form.

## 5. Stop hook pitfalls (infinite loops, `stop_hook_active`)

### Takeaway
A Stop hook that exits 2 or returns `decision:"block"` makes Claude keep working. Claude Code caps this at **8 consecutive blocks** and then forces the response through. The docs currently describe `stop_hook_active` in two different ways (see below). To detect "I already blocked once", use `previous_response_blocked` (documented in the reference) or check both fields.

### Cited Findings
- `Stop` "fires once per turn after all tool calls complete", "whenever Claude finishes responding, not only at task completion", and not on user interrupts. API errors fire `StopFailure` instead — [Hooks reference](https://code.claude.com/docs/en/hooks), [Hooks guide](https://code.claude.com/docs/en/hooks-guide)
- Decision control: `decision: "block"` + `reason`. The reason reaches Claude as a system reminder. "each session has a cap of 8 consecutive blocked responses before Claude Code forces through and shows the response anyway, preventing infinite loops." `hookSpecificOutput.additionalContext` adds information without blocking — [Hooks reference](https://code.claude.com/docs/en/hooks)
- Stop input fields: `stop_hook_active`, `last_assistant_message`, `turn_number`, `previous_response_blocked` ("When `true`, Claude's previous response in the prior turn was blocked by a `Stop` hook, and the conversation looped") — [Hooks reference](https://code.claude.com/docs/en/hooks)
- **Conflict.** The reference defines `stop_hook_active` as "Boolean indicating whether one or more `Stop` hooks with matching matchers exist in the current session … Requires Claude Code v2.1.249 or later" — [Hooks reference](https://code.claude.com/docs/en/hooks). The guide says: "Claude Code overrides a Stop hook after it blocks eight times in a row without progress. Your hook script needs to check whether it already triggered a continuation. Parse the `stop_hook_active` field from the JSON input and exit early if it's `true`" — [Hooks guide](https://code.claude.com/docs/en/hooks-guide)

### Inferences
- If `stop_hook_active` really means "Stop hooks exist", it would always be `true` inside a Stop hook, and the guide's "exit early if true" would turn the hook into a no-op. The safe pattern is: `if (p.previous_response_blocked || p.stop_hook_active === true && <older semantics needed>) exit 0`. In practice, exit early on `previous_response_blocked === true`, or allow at most one block per turn yourself.
- Keep Stop hooks cheap (e.g. `npm run build` only when files changed), because the hook runs after every response, including simple Q&A turns.

### Gaps
- I couldn't resolve which `stop_hook_active` meaning is current at runtime. Test it by logging the stdin JSON from a trivial Stop hook.

## 6. Git pre-commit without Husky: lightest option

### Takeaway
There are two lightweight options. (a) **Zero-dependency:** commit a `.githooks/pre-commit` shell script and run `git config core.hooksPath .githooks`, ideally from a `prepare` npm script. (b) **simple-git-hooks:** a zero-dependency devDependency configured in `package.json`. Both work with Git for Windows, whose bundled bash runs `#!/bin/sh` hooks. Bypass with `git commit --no-verify`.

### Cited Findings
- Default hooks dir is `$GIT_DIR/hooks`. `core.hooksPath` changes it: "The path can be either absolute or relative. A relative path is taken as relative to the directory where the hooks are run" — [git core.hooksPath doc source](https://raw.githubusercontent.com/git/git/master/Documentation/config/core.adoc), [githooks](https://git-scm.com/docs/githooks)
- In a non-bare repo, Git runs hooks from the root of the working tree, so a relative `core.hooksPath` such as `.githooks` resolves from the repo root — [githooks](https://git-scm.com/docs/githooks)
- pre-commit: "can be bypassed with the `--no-verify` option … Exiting with a non-zero status from this script causes the `git commit` command to abort before creating a commit." — [githooks](https://git-scm.com/docs/githooks)
- "Hooks that don't have the executable bit set are ignored." — [githooks](https://git-scm.com/docs/githooks)
- All hooks can be disabled for one command with `git -c core.hooksPath=/dev/null ...` — [git core.hooksPath doc source](https://raw.githubusercontent.com/git/git/master/Documentation/config/core.adoc)
- simple-git-hooks: `npm install simple-git-hooks --save-dev`, then configure `"simple-git-hooks": { "pre-commit": "npx lint-staged" }` in `package.json` and run `npx simple-git-hooks`. Add it to `"prepare"` for automatic install. Skip with `SKIP_SIMPLE_GIT_HOOKS=1` or `--no-verify`. It describes itself as "Zero dependency" at ~13 kB unpacked. When migrating from husky, check that `git config core.hooksPath` points back to `.git/hooks/`. Uninstall with `node node_modules/simple-git-hooks/uninstall.js` — [simple-git-hooks README](https://github.com/toplenboren/simple-git-hooks)
- Running `claude -p` from a pre-commit hook is a documented pattern — [Best practices](https://code.claude.com/docs/en/best-practices)

### Inferences
- Lightest option for this repo: `.githooks/pre-commit` containing `#!/bin/sh` then `npm run build || exit 1` (or a `node scripts/check.mjs`), plus `"prepare": "git config core.hooksPath .githooks"` in package.json. That adds no dependency and versions the hook with the repo.
- On Windows the executable bit is tracked by git: run `git update-index --chmod=+x .githooks/pre-commit` so the hook works on clones.
- simple-git-hooks writes into `.git/hooks`, so it conflicts with a custom `core.hooksPath`. Choose one approach, not both.
- Claude Code commits are subject to the same pre-commit hook. Claude is told never to skip hooks (`--no-verify`), so the hook also acts as a deterministic gate on commits Claude makes.

### Gaps
- Git for Windows specifics (which bash runs hooks, how it treats the executable bit on NTFS) weren't verified against a primary Git-for-Windows source within the tool budget.
- simple-git-hooks: the README fetch didn't confirm Windows-specific notes, or whether it respects or overrides a pre-existing `core.hooksPath`.
