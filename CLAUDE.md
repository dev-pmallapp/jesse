@AGENTS.md

## Git worktrees
- Create every worktree under `.worktree/` in this repo, e.g.
  `git worktree add .worktree/<name> -b <type>/<short-kebab-desc> origin/master`.
  Never create sibling directories such as `../jesse-67`: they sit outside the project, so
  subagents working there hit extra-directory permission prompts even in auto mode.
- `.worktree/` is excluded locally via `.git/info/exclude`; don't commit anything under it.
- Remove a worktree with `git worktree remove .worktree/<name>` once its PR is merged.
