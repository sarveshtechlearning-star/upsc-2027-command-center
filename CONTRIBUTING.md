# Contributing to UPSC 2027 Command Center

Thanks for contributing. This document covers the developer workflow. For
what the app is and basic setup, see [README.md](./README.md). For AI
coding-agent-specific engineering rules, see [CLAUDE.md](./CLAUDE.md).

## Getting started

```bash
git clone https://github.com/sarveshtechlearning-star/upsc-2027-command-center.git
cd upsc-2027-command-center
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README.md)
npm install
npm run dev
```

This starts the Vite dev server (prints a local URL, typically
`http://localhost:5173`).

Other available commands (from `package.json`):

```bash
npm run build     # production build
npm run preview   # preview a production build locally
```

There is currently no automated test suite, linter, or type checker
configured in this repository. If you add one, please also update
`CLAUDE.md` so AI agents know to run it.

## Branching

`main` is the base branch and should always reflect a working state. Don't
commit directly to it. For any change:

```bash
git checkout main
git pull
git checkout -b feature/your-change-name
```

Use a prefix that matches the change: `feature/`, `fix/`, `ui/`,
`refactor/`, `docs/`.

## Development guidelines

- Follow the existing architecture (React + Vite frontend, Supabase
  backend, `kv_store` JSON-per-tracker data model) rather than introducing
  a new pattern for a single feature.
- Keep changes focused — one logical change per branch/PR.
- Avoid unrelated modifications or drive-by refactors.
- Preserve existing functionality and user data. Treat any change touching
  the `kv_store` schema, a tracker's JSON shape, or auth as high-risk;
  explain the impact in your PR.
- Consider both mobile and desktop when touching UI — check overflow,
  touch targets, and responsive layout.

## Testing your change

Since there's no automated test suite yet, at minimum:

```bash
npm run build
```

...and manually exercise the feature/fix you changed (and anything
obviously adjacent to it) in `npm run dev`.

## Commit messages

Use conventional, descriptive messages:

```
feat: add topic-resource linking
fix: correct revision count calculation
ui: improve mobile topic navigation
refactor: simplify resource lookup
docs: update contributing guide
```

Avoid vague messages like "update", "changes", or "fix".

## Pull requests

Open a PR from your branch into `main`. Keep it focused on one logical
change. Include:

```
## Summary
## Why
## Implementation
## Testing
## Database Changes   (mention if the kv_store schema or a tracker's shape changed)
## Breaking Changes    (or "None")
## Screenshots         (for UI changes, when practical)
```

## Review

PRs should be reviewed before merging according to the repository's branch
protection settings. Review your own diff first for unrelated changes,
debug code, console logs, unused imports, or accidentally committed files.
Don't self-merge unless explicitly authorized by the project owner.

## Security

Never commit secrets — Supabase URLs/keys, tokens, or credentials. Use
environment variables as set up in `.env.example`. If you discover a
security issue, report it privately to the project owner rather than in a
public issue.
