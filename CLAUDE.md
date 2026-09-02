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
  single `src/App.jsx` file (daily planner, class tracker, topic completion
  (formerly "Reading"), syllabus, single pagers, NCERT, standard books,
  Tamil literature, current affairs, GS answer writing, AI learning, topic
  master, search, weekly review). `src/main.jsx` is the entry point.
- **Backend**: Supabase (Postgres + Auth) via `src/supabaseClient.js`,
  configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Data model**: a single `kv_store` table (`user_id`, `key`, `value
  jsonb`), one JSON blob per tracker, scoped per-user with Row Level
  Security (see `supabase/schema.sql`). Trackers are JSON documents, not
  normalized relational tables — cross-tracker relationships are mostly
  resolved in client-side JS, not SQL joins. The Syllabus tracker is the
  hierarchy anchor (Subject → Topic → Subtopic → Micro Topic, each row with
  a stable `id`). Every tracker that links to a Syllabus row — Classes,
  Reading, NCERT, Standard Books, Single Pager, Current Affairs — carries a
  `syllabusId` (`findSyllabusId`), resolved fresh every time its own
  Subject/Topic/Subtopic/Micro Topic selects change. This is what lets
  Source Identified, the Dashboard, and Topic Master stay correctly linked
  even after a Syllabus row's text is edited later — **all three of those
  match by id first and only fall back to text for records saved before
  this existed. If you add a new tracker with its own micro-topic-level
  link to Syllabus, give it a syllabusId the same way, or it'll quietly
  reintroduce the exact fragility this was built to close.** Classes is
  the one exception worth remembering: it tags *multiple* Micro Topics per
  row (`microtopics`), so a single `syllabusId` can't represent that — each
  tag instead stores a Syllabus row id directly (see
  `syllabusRowOptionsForSubtopic` / `TagMultiSelectCell`), with older
  plain-text tags (written before ids existed) still displaying correctly
  via a fallback lookup.
- **`syllabusTopicsForSubject`/`syllabusSubtopicsForTopic`/
  `microtopicOptionsForSubtopic`/`syllabusRowOptionsForSubtopic`/
  `isSourceIdentifiedForMicrotopic` are cached, not naive filters — do not
  "simplify" them back to `db.syllabus.filter(...)` one-liners.** Every
  one of these is called once per row in every cascading-dropdown column,
  across every tracker table. A naive version re-scans the full array on
  every call, which is fine at dozens of rows but becomes O(rows²) at
  scale — with ~1,150 Syllabus rows this measurably hung the page (every
  keystroke anywhere on the page re-triggered the full O(n²) cost via
  React's re-render). The fix (`getSyllabusIndex` / `_syllabusIndexCache`,
  `getSourceIdentifiedIndex` / `_sourceIdentifiedCache`) builds each
  lookup table once per exact array/object reference (`WeakMap`, keyed on
  `db.syllabus` or `db`) and reuses it until that reference actually
  changes — free by construction since this app already treats state
  immutably (a real edit always produces a new array/object, so the cache
  invalidates exactly when it should, automatically). If you add another
  helper that's called per-row across a large table, cache it the same
  way rather than assuming "it's just a filter, it'll be fine" — it won't
  be, once the table it feeds grows.
- **Tracker schemas are intentionally lean, not uniform** — several
  trackers had status/date columns removed because they weren't being
  kept current (NCERT and Standard Books are now pure reference lists:
  Subject/Topic/Subtopic/Micro Topic/Book/Chapter(/Pages), no status or
  dates; Tamil Reading dropped Status/Revision). Don't reflexively add a
  status or date field back onto these — that removal was deliberate.
  Single Pager's Class Notes/Handout/NCERT/Standard Books are a simple
  `INCLUSION_OPTIONS` ("Included"/"Not Included") select, not a progress
  status. Before adding a field to any tracker, check its current column
  list in the relevant `*Tab` function rather than assuming parity with
  similar-sounding fields elsewhere.
- **"Log" column**: most trackers end with a `LogButton` cell
  (`{ key: "log", ... render: rec => <LogButton history={rec.history} /> }`)
  — a read-only popover over the record's existing `history` array (already
  populated by `type: "status"` column edits). It's a pure UI addition, not
  a new data source; don't wire up separate audit logging.
- **Today's Planner is an hourly journal, not a status tracker or an
  editing surface.** Each plan block (`PlanBlock`/`OfficePlanBlock`) shows
  its time range, duration, and label, plus a free-text `journal` field
  ("what did you actually do in this slot") — that's it. There is no
  per-block status control anymore (`TaskStatusButtons`,
  `GATED_LINK_TABS`, the completion-detecting `useEffect`, and
  `LinkedTaskInfo` were all removed as a unit — don't reintroduce a
  status vocabulary or a "click Completed to navigate" flow here; that
  whole approach was tried and explicitly replaced by the journal). The
  earlier embedded add/edit widgets (`ClassLectureWidget`,
  `TodayListWidget`, `QuickPickWidget`, `InlineAddForm`) are also gone —
  actual tracker data entry (topics, PDFs, marks, etc.) always happens on
  that tracker's own tab; the planner is only for the quick per-hour note.
  `block.status`/`completedAt` still exist on already-stored plans for
  backward compatibility but are not read or written anywhere new — don't
  build features on them. Weekly Review's stats and per-day breakdown
  (`WeeklyReviewTab`) are journal-based to match: "Logged" counts blocks
  with non-empty `journal` text, "Skipped" counts `block.skipped`, and the
  per-day list shows each block's real start/end (via `computePlanTimes`,
  since the stored plan only has `duration`) alongside its journal text.
  There is no separate end-of-day review anymore (`db.dailyReviews` stays
  defined in the data model/reset flow for old stored data, but nothing
  reads or writes it) — skip reasons live per-block instead: checking a
  block's Skip box opens a small popover (`SkipToggle`) listing
  `SKIP_REASONS`, and `onSkip` only fires (setting `skipped: true,
  skipReason`) once one is picked; unchecking (`onUnskip`) needs no reason
  and clears both fields directly. Don't reintroduce a single daily-level
  reflection/skip-reason field — that was tried and explicitly replaced by
  per-block reasons.
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
  outside the UPSC syllabus, so its Topic field stays free text. Classes
  additionally supports tagging multiple Micro Topics per row via
  `TagMultiSelectCell` (same "select only" rule, scoped to the row's
  Subtopic). Keep new topic-entry UI consistent with this pattern rather
  than adding another ad hoc free-text field.
- **Source Identified (Syllabus tab)** is read-only and fully computed —
  never add a way to set it by hand. `isSourceIdentifiedForMicrotopic(db,
  syllabusRow)` takes the whole row (not separate fields) so it can match
  on `syllabusId` first, falling back to text for older records; true if
  that micro topic appears in Classes (one of a class's `microtopics`
  tags), NCERT, or Standard Books; false if it doesn't, and the Syllabus
  row's render shows "—" when the row has no Micro Topic set at all
  (nothing to check). If a future tracker gains its own micro-topic field,
  consider whether "source identified" should also look there — but don't
  silently skip updating this helper if you add such a field, since a
  resource that exists but doesn't show up here would look mis-flagged.
- **Dashboard tab** (`DashboardTab`, separate from the `Dashboard`
  top-level app-shell component of the same-ish name — don't confuse the
  two) is read-only, computed from existing data, no new user input:
  - **Source mapping %** and **overall topic completion %** are both
    computed at Micro Topic level, using every Syllabus row with a Micro
    Topic set as the denominator — rows without one aren't counted in
    either. Source mapping reuses `isSourceIdentifiedForMicrotopic`.
    Topic completion uses `topicCompletionScore` (0..1 partial credit per
    micro topic across Class Notes/Standard Material/NCERT/Single
    Pager/Revision 1/Revision 2 — "Not Needed" fields excluded from that
    micro topic's own denominator, matching `readingCompletionPct`'s
    convention), averaged across all micro topics. This is a deliberately
    different, more complete metric than `readingCompletionPct` (which
    excludes revision and powers Today's "pending reading" list) — don't
    merge the two or "simplify" by reusing one for the other's purpose.
  - **Classes completed by subject**: latest *Completed* class# vs. that
    subject's Total Classes, which lives in
    `settings.totalClassesBySubject` (a plain `{ [subject]: number }` map,
    set on the Settings tab — deliberately not a per-class-row field,
    since that was tried before and removed for being redundant/
    error-prone). A subject only appears here once its total is set;
    "no total set" and "0% done" are treated as different things.
  - **Classes — overall status** pie chart buckets every class's status
    into exactly three groups: Completed, In Progress, and Not Completed
    (Not Started + Partially Completed + Skipped, combined). `PieChart` is
    a small dependency-free component (CSS `conic-gradient`, no charting
    library) — reuse it for future charts rather than adding a chart
    dependency for a simple pie/donut.
  - **Answers written**: plain counts, GS Answer Writing by `GS_PAPERS`
    (the shared GS1–4/Essay list, also used by Answer Writing's own
    dropdown) and a single Tamil Writing total (Tamil has no "paper"
    concept to split by).
- **Topic Master** is keyed on the full Subject/Topic/Subtopic/Micro Topic
  path, not just Subject+Topic — one entry per **Syllabus row** (every
  syllabus row is a distinct topic-master entry, since Syllabus is already
  the authoritative hierarchy). `classMatchesSyllabusRow` /
  `recMatchesSyllabusRow` match via `syllabusId` first, text as fallback —
  same rule as Source Identified and the Dashboard. Tamil and GS Answer
  Writing don't carry a Subtopic/Micro Topic themselves, so they attach at
  the Topic level and can legitimately appear under several Micro Topic
  rows that share one Topic — that's expected, not a bug. The sidebar has
  a text filter (`query`) since the row count scales with how finely the
  syllabus has been broken down; don't remove it even if it looks
  unnecessary with a small dataset.
- **"Log" is a single, built-in mechanism — don't add a second one.**
  `GenericTracker` already renders a history expand/collapse control for
  every table automatically (whatever `columns` you pass), driven by each
  record's own `history` array. An earlier session added a duplicate
  per-tab `{ key: "log", ... }` column with a popover (`LogButton`) without
  realizing this — that was a mistake, now removed. If a table's changes
  aren't showing up in the log, the fix is to populate `history` on that
  field's edits (see how `type: "status"` columns already do it in
  `GenericTracker`), not to add another log UI.
- **Deleting a Syllabus row warns if other trackers still reference it.**
  `GenericTracker` accepts an optional `confirmRemove(record)` prop
  returning the confirm-dialog message; Syllabus uses it with
  `countSyllabusRowReferences` to warn (with a count) before deleting a row
  that Classes/Reading/NCERT/Standard Books/Single Pager/Current Affairs
  still point to. It still allows the delete — this is a warning, not a
  block. Other trackers don't have an equivalent yet; if that becomes worth
  doing, reuse the same `confirmRemove` prop rather than inventing another
  pattern.
- **Google Drive PDFs**: `DriveFileCell` + `uploadDriveFile`/
  `downloadDriveFile` are generic across trackers — pass a `folderKey`
  (see `DRIVE_FOLDER_NAMES`) to keep each tracker's PDFs in their own
  Drive folder. Currently wired up for Single Pager, Classes, GS Answer
  Writing, Tamil Reading/Writing, and Current Affairs. `ensureDriveFolder`
  falls back to the legacy singular `settings.driveFolderId` only for the
  `singlePager` key, to avoid creating a duplicate folder for existing
  users; new folder ids live in `settings.driveFolders[folderKey]`.
  `DriveDownloadLink` is the read-only variant used in Topic Master, which
  has no `updateSlice` to support uploading.
- **Import/export**: `xlsx` for Excel, plus JSON export, applied generically
  across trackers. `IMPORT_TARGETS` covers every tracker (Classes, Reading,
  Single Pager, Syllabus, NCERT, Standard Books, Tamil Reading, Tamil
  Writing, Current Affairs, GS Answer Writing, AI Learning) — when a
  tracker's columns change, update its `IMPORT_TARGETS` entry and
  `IMPORT_FIELD_LABELS` in the same change, or the template/import will
  silently drift from the real schema. `downloadImportTemplate(key)`
  generates a blank header-only workbook for any of them (surfaced in the
  Import/Export tab), so a new tracker needs a matching entry added here
  too. Classes' `microtopics` is a tag array — import only accepts a
  single Micro Topic column and seeds it as the row's first tag; there's
  no bulk multi-tag import.
- **Auth**: Supabase email/password, single-user by design.
- **Icons**: `lucide-react`.
- **Syllabus has no "Coverage" (Prelims Only/Mains Only/etc.) field anymore**
  — removed by request, including from `SYLLABUS_SEED`, the Syllabus
  import template, and Topic Master's display. Don't reintroduce it as
  part of some other change without checking this was intentional.
- **Daily plan sections can be turned off entirely**, not just
  auto-trimmed when a day is short on time. `settings.slotsEnabled` is a
  `{ [slotId]: false }` map (unset/true = included), edited via a checkbox
  per row in the same Settings table that sets each slot's default
  duration. `buildBaseBlocks` filters both the slot and its paired break
  out before the day-type/trim logic ever sees them — this is a separate,
  earlier gate than `REMOVAL_ORDER`/`applyTrimRules`, not a replacement
  for it. A disabled slot never appears in newly-generated plans; it does
  not touch days already created.
- **Column-level filtering lives once, in `GenericTracker`** — every
  tracker and Syllabus gets it automatically since they all render through
  it; don't add a separate per-tab filter implementation. It introspects
  each column's actual stored values at render time (no per-column filter
  config needed): a column becomes a dropdown of its distinct existing
  values, a substring-search box if those values are numerous or long
  (free-text fields like Question/Notes), or unfilterable if the stored
  value is an array or object (Classes' `microtopics` tags, `driveFile`).
  If you add a column whose value is an array/object and it should be
  filterable, that needs deliberate handling here, not an assumption that
  it'll "just work" like the primitive-valued columns do.
- **The Office/commute block in Today's Planner is one merged card
  covering up to three underlying blocks** (`travelTo`, `office`,
  `travelFro` — one or three of these depending on WFH/WFO/Weekend).
  Reordering it can't reuse `moveBlock` (which swaps one id with its
  neighbor) since that would let the group fall apart — use
  `moveOfficeGroup(dir)` instead, which moves the whole contiguous run
  past one adjacent block at a time, same granularity as everything else.
  Each of the three durations is independently editable per day (like
  every other block's duration) via `onDurationChange`, not fixed to the
  Settings default — Settings only supplies the value for newly-generated
  days.

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
