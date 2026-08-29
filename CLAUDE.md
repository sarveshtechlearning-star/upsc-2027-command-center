# CLAUDE.md — AI Engineering Guidelines for UPSC 2027 Command Center

This file tells Claude (and any other coding agent) how to safely work on
this repository. It applies whether you are Claude Code, Claude in a chat
interface with repository access, or another AI coding agent contributing
here.

## 1. GitHub is the source of truth

The GitHub repository — not a previous conversation, a prior session's
memory, or previously generated code — is the single source of truth.

Never assume:
- A previous chat's understanding of the code is still current.
- Code you generated earlier in a conversation still matches what's on disk.
- The architecture hasn't changed since you last looked.

The latest commit on the relevant base branch (`main`) is always the
baseline for new work.

## 2. Establish state before meaningful work

Before starting a task that will change code, determine:
- Current branch
- Latest commit SHA and message on `main`
- Working tree status (clean, or pending changes)
- Whether anything relevant has changed since you last checked in this
  session

If the repo has moved since you last looked, treat the newer state as
authoritative and discard stale assumptions. You do not need to re-check
before every trivial step in an ongoing session — only when a change may
have happened (new commit possible, another agent/session may have acted,
or real uncertainty exists).

## 3. Token-efficient, targeted inspection

Do not read the entire repository for every task. Workflow:

```
Understand requirement → search repo → identify relevant files →
inspect dependencies → implement smallest safe change → validate →
review diff
```

Avoid: dumping the whole repo, reading unrelated modules, re-reading files
that haven't changed, reproducing large code blocks in explanations when a
summary will do.

## 4. Existing architecture (current, as of this document)

- **Frontend**: React 18 + Vite. Almost all UI/feature logic lives in the
  single `src/App.jsx` file (daily planner, class tracker, reading tracker,
  syllabus, single pagers, NCERT, standard books, Tamil literature, current
  affairs, GS answer writing, AI learning, topic master, search, weekly
  review). `src/main.jsx` is the entry point.
- **Backend**: Supabase (Postgres + Auth) via `src/supabaseClient.js`,
  configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Data model**: a single `kv_store` table (`user_id`, `key`, `value
  jsonb`), one JSON blob per tracker, scoped per-user with Row Level
  Security (see `supabase/schema.sql`). Trackers are JSON documents, not
  normalized relational tables — cross-tracker relationships are mostly
  resolved in client-side JS, not SQL joins. The Syllabus tracker is the
  hierarchy anchor (Subject → Topic → Subtopic → Micro Topic, each row with
  a stable `id`); Classes and Reading rows created via the Class Lecture
  flow also carry a `syllabusId` pointing at that row (see
  `findSyllabusId`), so they stay correctly grouped in Topic Master even if
  the syllabus topic's text is renamed later.
- **Topic governance**: Syllabus and Current Affairs are the only two
  trackers where a genuinely new Topic/Subtopic/Micro Topic can be created
  (`CascadingSelectCell` with `allowAddNew` true/default). Current
  Affairs' "+ Add new" writes a real row into the Syllabus tracker rather
  than storing free text locally. Every other tracker (Classes, Reading,
  Single Pager, NCERT, Standard Books, Tamil Reading/Writing, GS Answer
  Writing) renders the same component with `allowAddNew={false}` and reads
  its options from the strict `syllabusTopicsForSubject` /
  `syllabusSubtopicsForTopic` helpers — selection only, no creation. AI
  Learning is the one deliberate exception: it's explicitly personal/
  outside the UPSC syllabus, so its Topic field stays free text. Keep new
  topic-entry UI consistent with this pattern rather than adding another
  ad hoc free-text field.
- **Google Drive PDFs**: `DriveFileCell` + `uploadDriveFile`/
  `downloadDriveFile` are generic across trackers — pass a `folderKey`
  (see `DRIVE_FOLDER_NAMES`) to keep each tracker's PDFs in their own
  Drive folder. Currently wired up for Single Pager, Classes, GS Answer
  Writing, and Tamil Reading/Writing. `ensureDriveFolder` falls back to
  the legacy singular `settings.driveFolderId` only for the `singlePager`
  key, to avoid creating a duplicate folder for existing users; new
  folder ids live in `settings.driveFolders[folderKey]`.
- **Import/export**: `xlsx` for Excel, plus JSON export, applied generically
  across trackers. `IMPORT_TARGETS` currently covers classes, reading,
  singlePager, and syllabus; `downloadImportTemplate(key)` generates a
  blank header-only workbook for any of them (surfaced in the
  Import/Export tab) so a new tracker export always has a matching
  fill-in-the-blanks template.
- **Auth**: Supabase email/password, single-user by design.
- **Icons**: `lucide-react`.

This section should be kept up to date when the architecture materially
changes (see Section 12). Don't restate it in full for every task — only
reference what's relevant.

Before introducing a new pattern (new state-management approach, new
styling system, new backend, new framework), look for an existing one
first. Don't introduce a new architectural pattern without a strong
technical reason.

## 5. Minimal, focused changes

Prefer small, targeted diffs. Avoid unrelated refactoring, unnecessary
rewrites, renaming things without reason, or architectural changes to solve
small requirements. If the existing architecture can cleanly support a
request, use it as-is.

## 6. Preserve existing functionality and data

Unless explicitly requested, do not remove or alter existing behavior —
especially auth, navigation, existing tracker workflows, the `kv_store`
schema, responsive layout, or the import/export flows.

The app stores real UPSC preparation data (subjects, topics, subtopics,
classes, notes, one-pagers, current affairs, books/chapters, questions,
answers, revision history, study sessions, progress, tags, links). Never
casually delete, rename, or reset this data or its structure. Any schema
change must have a clear justification, a stated migration plan, and must
preserve existing rows/JSON keys wherever practical.

## 7. Security

Never commit secrets (Supabase URL/keys, tokens, credentials) into source,
docs, tests, commit messages, or PR descriptions. Use `.env` /
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as already established
(`.env.example` documents the required variables). If you discover a
secret already committed, flag it immediately rather than ignoring it.

## 8. Dependencies

Before adding a package, check whether the existing stack (React, Vite,
Supabase, `xlsx`, `lucide-react`) already solves the problem. Justify any
new dependency; consider bundle size and maintenance cost.

## 9. UI/UX and responsiveness

This is a personal study command center: prioritize clarity, speed, low
cognitive load, and consistent navigation over visual flourish. Every UI
change must be considered against mobile, tablet, and desktop — check
overflow, touch targets, tables, forms, and modals rather than assuming a
desktop-first implementation is enough. Reuse existing UI patterns already
present in `App.jsx` before inventing new ones.

## 10. Testing and validation

As of this writing, the repository has **no test suite, linter, or CI/CD
configuration** — only `npm run dev`, `npm run build`, and `npm run
preview` (see `package.json`). Validate changes with `npm run build` at
minimum, plus manual/logical review of the affected feature. Do not claim
a change was "tested" if it wasn't. If a test/lint setup is added later,
this section must be updated to reflect it, and agents should use it.

## 11. Git workflow

Do not commit directly to `main`. Use:

```
main → feature/fix branch → implement → validate → commit → push → PR → review → merge
```

Branch naming examples: `feature/topic-resource-linking`,
`fix/class-filtering`, `ui/mobile-dashboard`, `docs/update-claude-md`.

Never run `git reset --hard`, `git clean -fd`, or `git checkout .` to
"clean up" — these can destroy uncommitted work that isn't yours. If
unrelated uncommitted changes exist, preserve them and only touch what's
needed for the task; tell the user if they block safe progress. Never
force-push a shared branch unless explicitly authorized.

Do not self-merge PRs or bypass review unless explicitly authorized by the
project owner.

## 12. Commit messages

Use meaningful, conventional messages: `feat: ...`, `fix: ...`, `ui: ...`,
`refactor: ...`, `docs: ...`. Avoid vague messages like "update" or
"changes".

## 13. Bug fixing

Find the root cause before patching the symptom. Check whether the bug
affects related areas. Fix the smallest reliable thing; avoid folding in
unrelated refactoring.

## 14. Scope control

Don't silently fix unrelated issues you notice while working. Mention them
to the project owner, or raise a separate issue/PR, unless leaving them
unfixed would make the requested change incorrect or unsafe.

## 15. Requirement interpretation

Requirements are often informal. Translate them into a concrete technical
plan and proceed if the intent is clear. Ask a focused clarifying question
only when ambiguity could genuinely cause data loss, architectural
problems, or significant rework.

## 16. Long-term direction

The app is expected to grow into a connected system relating Subject →
Topic → Subtopic → Classes → Class Notes → One-Pagers → Current Affairs →
Books/Chapters → Questions → Answers → Revision History → Performance.
Favor designs that don't unnecessarily isolate these entities from each
other, but don't build speculative infrastructure for relationships a
current task doesn't need.

## 17. Keeping this document current

When an intentional architectural change is made (new backend, new state
model, testing/CI introduced, etc.), update Section 4 and Section 10 of
this file as part of that same change, or in a dedicated docs PR. This
document should never describe an architecture that no longer exists.

## 18. Repository-specific rules win

If `package.json`, build config, or other project configuration implies a
more specific rule than this document states generically, follow the more
specific rule, provided it doesn't contradict the security, data-integrity,
or git-safety rules above.
