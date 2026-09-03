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
  (`db.reading` — a computed overview of Syllabus + other trackers now, see
  the dedicated Topic Completion bullet below), syllabus, single pagers,
  NCERT, standard books, Tamil literature, current affairs, GS answer
  writing, GS answer writing topper copies, AI learning, topic master,
  search, weekly review). `src/main.jsx` is the entry point.
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
  kept current (NCERT and Standard Books are pure reference lists: GS
  Paper/Subject/Micro Topic/Book/Chapter(/Pages) — see the "GS Paper →
  Subject → Micro Topic pattern" bullet further down for how that
  linking works now — no status or dates; Tamil Reading dropped
  Status/Revision). Don't reflexively add a status or date field back
  onto these — that removal was deliberate. Single Pager's Class Notes/
  Handout/NCERT/Standard Books are a simple `INCLUSION_OPTIONS`
  ("Included"/"Not Included") select, not a progress status. Before
  adding a field to any tracker, check its current column list in the
  relevant `*Tab` function rather than assuming parity with
  similar-sounding fields elsewhere.
- **Topic Completion (`ReadingTab`, `db.reading`) is a computed overview,
  not a manually-populated tracker — by request, to kill the double
  bookkeeping that existed when it duplicated data already tracked
  elsewhere.** Its row set is now Syllabus itself: one row per Syllabus
  entry, always, with no "+ Add row"/delete here — add or edit Subject/
  Topic/Subtopic/Micro Topic on the Syllabus tab instead (or tag a new
  Micro Topic from Classes/NCERT/Standard Books/Single Pager/GS Answer
  Writing/Topper Copies' own "+ Add new" popup — either way, a Syllabus
  row is what actually creates the entry Topic Completion picks up). Of
  its six fields, four are fully derived and non-editable:
  - **Class Notes**: "Completed" if any Classes record matching this
    Syllabus row (`classMatchesSyllabusRow`) has `status === "Completed"`;
    "In Progress" if a match exists but none are Completed; "Not Started"
    otherwise. Its PDF (`classNotesFile`) is that Completed match's
    `driveFile`, falling back to any matched class's file.
  - **Standard Material** / **NCERT**: "Completed" if any Standard
    Books/NCERT record matches this row at all, "Not Started" otherwise —
    binary, since neither of those two trackers has a completion field of
    its own; cataloguing the book/chapter there is the only signal there
    is.
  - **Single Pager**: mirrors a matching Single Pager record's own
    `status` field (Completed/In Progress → same; no match → "Not
    Started").
  - **Revision 1** and **Revision 2** remain the only two fields actually
    set by hand, still `READ_STATUS` dropdowns. Persisted on a `db.reading`
    record matched to the Syllabus row by `syllabusId` — editing lazily
    creates that record on the very first edit rather than one existing
    per Syllabus row up front, so `db.reading` is now normally *sparse*
    (only rows where revision has ever been touched), unlike every other
    tracker. **Don't iterate `db.reading` expecting it to mirror all
    Syllabus topics** — iterate `db.syllabus` and call
    `computeTopicCompletionFields(row, indexes)` instead (see the "TOPIC
    COMPLETION — COMPUTED-FIELD HELPERS" block above `TopicMasterTab` for
    the indexing helpers `buildTopicCompletionIndexes`/
    `taggedRecsForSyllabusRow`/`recsForSyllabusRow` — built once per
    relevant `db.*` array reference, same O(records)-not-O(rows×records)
    reasoning as the Syllabus-lookup caches. `taggedRecsForSyllabusRow`
    matches by `microtopics` array membership — Classes, NCERT, Standard
    Books, and Single Pager all use it now that all four tag Micro Topics
    the same way; `recsForSyllabusRow` matches by scalar `syllabusId` +
    full-path text and is only for Reading's own lazily-created revision
    records now). `computePendingTasks`'s revision-due and
    pending-reading sections, the Dashboard's Overall Topic Completion %,
    `SyllabusTab`'s own progress stat, and Topic Master's "Topic
    completion" panel were all migrated to this pattern — if you touch any
    of those, keep them reading from Syllabus + the computed fields, not
    `db.reading` directly. The old "Previous day's class notes" pending
    item was removed entirely, not migrated — it existed to nudge you to
    do a separate manual "class notes" step that no longer exists now that
    Class Notes derives straight from the class's own Completed status.
  - **Syllabus's own `studyStatus`/`revisionStatus` fields are dead** —
    never shown or settable by any UI anymore (they used to sit behind
    this same duplication problem). Existing stored values on old rows are
    left alone untouched, just no longer read anywhere; don't reintroduce
    a status field on the Syllabus tab as part of some other change
    without checking this was intentional.
- **GS Answer Writing (`AnswerWritingTab`) is sub-tabbed like Tamil
  Literature** — "Answer Writing" (`db.answerWriting`) and "Topper Copies"
  (`db.topperCopies`), sharing `gsPaperColumn`/`subjectTagColumn`/
  `microtopicTagColumn` (see the "GS Paper → Subject → Micro Topic
  pattern" bullet further down — this pattern is now shared by several
  other trackers too, not unique to Answer Writing).
  Topper Copies is otherwise a smaller shape — Date/GS Paper/Subject/
  Micro Topic/Question/Observations/Status/PDF, no Word Limit or Self
  Score (you didn't write it, so there's nothing of yours to score).
  Topper Copies *does* opt into `completionRequiresUpload` (`TOPPER_STATUS`
  = `["Not Completed", "Completed"]`, a two-state vocabulary rather than
  `TASK_STATUS`'s five) — Completed still requires the Topper Copy PDF
  uploaded first and still locks the row. The one difference from the
  other four `completionRequiresUpload` trackers: Question and
  Observations are marked `readableWhenLocked: true` (see the
  `completionRequiresUpload` bullet below) so long text stays scrollable
  after the row locks.
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
- **Wake time locks after its first edit each day** (`plan.wakeTimeLocked`,
  set `false` by `initDayPlan`, flipped to `true` inside `changeWakeTime`
  — not inside the shared `regeneratePlan`, since that's also called by
  `changeDayType` and a day-type change must not lock wake time). Once
  locked the `<input type="time">` is `disabled`; the only way back in is
  the Pencil `IconBtn` next to it (`unlockWakeTime`, sets it back to
  `false`) — same deliberate-escape-hatch shape as `GenericTracker`'s
  Completed-row lock. Don't move the lock-setting into `regeneratePlan`
  itself or a day-type change will start locking wake time too.
- **`LiveClock`** (top bar, next to today's date) is a self-contained
  ticking clock — its own `setInterval`/`useState`, cleaned up on
  unmount — not wired to any tracker data. If another live-updating time
  display is ever needed, reuse this component rather than adding a
  second interval.
- **"Add existing task" brings back a slot `applyTrimRules` dropped** —
  computed fresh each render as `buildBaseBlocks(dayType, settings)` minus
  whatever's already in `plan.blocks` (by id), not stored anywhere or
  derived from `droppedLabels` (that array is label-only, for the
  "Adjusted for today" note — no full block data to reconstruct from).
  Only ever contains `REMOVAL_ORDER` slots (study/AI) for this reason:
  Office/commute are never in `REMOVAL_ORDER` so they're never "missing"
  this way, and a slot disabled entirely via Settings never reaches
  `buildBaseBlocks`'s output at all, so it never shows up here either —
  this is specifically for slots that exist today but got trimmed for
  not fitting. Re-added blocks get `restored: true` so they're removable
  again via the same control as a custom task (`b.custom || b.restored`),
  unlike a normal auto-generated block.
  There is no separate end-of-day review anymore (`db.dailyReviews` stays
  defined in the data model/reset flow for old stored data, but nothing
  reads or writes it) — skip reasons live per-block instead: checking a
  block's Skip box opens a small popover (`SkipToggle`) listing
  `SKIP_REASONS`, and `onSkip` only fires (setting `skipped: true,
  skipReason`) once one is picked; unchecking (`onUnskip`) needs no reason
  and clears both fields directly. Don't reintroduce a single daily-level
  reflection/skip-reason field — that was tried and explicitly replaced by
  per-block reasons.
- **Topic governance — Subject/Topic/Subtopic vs. Micro Topic have
  different rules, don't conflate them.** Subject/Topic/Subtopic can only
  be newly created on Syllabus or Current Affairs (`CascadingSelectCell`
  with `allowAddNew` true/default; Current Affairs' "+ Add new" writes a
  real row into Syllabus rather than storing free text locally). Current
  Affairs is the one other tracker that still has its own real Subject/
  Topic/Subtopic/Micro Topic fields (unchanged, `allowAddNew={false}` on
  all four, reading from `syllabusTopicsForSubject`/
  `syllabusSubtopicsForTopic`/`microtopicOptionsForSubtopic`) — selection
  only, no creation. AI Learning remains the one full exception (Topic
  stays free text — it's explicitly personal/outside the UPSC syllabus).
  **Every other tracker (Classes, NCERT, Standard Books, Single Pager, GS
  Answer Writing, Topper Copies) now shares one pattern**, converged from
  several different earlier designs into a single set of column helpers —
  see the next bullet.
- **The GS Paper → Subject → Micro Topic pattern, shared by Classes,
  NCERT, Standard Books, Single Pager, GS Answer Writing, and Topper
  Copies.** These trackers don't show or store Syllabus's own Topic/
  Subtopic levels at all — only GS Paper, Subject, and Micro Topic (the
  UI always labels this column "Topic", even though the underlying field
  is `microtopics` linking to Syllabus's Micro Topic level specifically).
  Three shared column helpers build this:
  - `gsPaperColumn()` — plain select from `GS_PAPERS` (short codes, e.g.
    "GS1"), no side effects on change.
  - `subjectTagColumn(db)` (Answer Writing/Topper Copies only — `rec.subjects`,
    a tag array, since one answer/topper copy can span several Subjects)
    or `subjectSingleSelectColumn(db)` (Classes/NCERT/Standard Books/Single
    Pager — `rec.subject`, single-select, since one class/chapter/
    single-pager is always one Subject's material). Both scope their
    options to Subjects already on Syllabus under the row's GS Paper, and
    both are `allowAddNew={false}` — Subject stays purely Syllabus-governed
    everywhere now, a new Subject is added on Settings/Syllabus instead.
  - `microtopicTagColumn(db, trackerKey, setAddTopicFor, label)` — a tag
    array (`rec.microtopics`, Syllabus row ids, works identically for
    either the single `rec.subject` or the array `rec.subjects` shape
    above) linked via `microtopicRowOptionsForSubjects`: every Micro Topic
    under whichever Subject(s) apply to this row, **deliberately skipping
    Syllabus's own Topic/Subtopic levels** — one row can draw on Micro
    Topics from several different Topics/Subtopics under a Subject (or,
    for Answer Writing/Topper Copies, across several Subjects). "+ Add
    new" never inherits context and creates a row inline — there's no
    single Topic/Subtopic to safely assume even with one Subject known —
    it opens `AddSyllabusRowPopup` via `setAddTopicFor` (one small piece
    of state per tab, tagged with `trackerKey` so the popup knows which
    `db.*` array to tag the new row onto).
  `AddSyllabusRowPopup` replicates Syllabus's own add-a-row flow (GS
  Paper/Subject/Topic/Subtopic pickers, Micro Topic pre-filled with
  whatever was just typed); confirming creates a real Syllabus row and
  also adds its Subject to the row's own Subject field/tags if not
  already set. `GS_PAPER_SHORT_TO_LONG` translates these trackers' own
  short-form GS Paper ("GS1") to Syllabus's long form ("GS Paper I") —
  always go through this map when filtering Syllabus by `rec.gsPaper`
  here, comparing them directly silently matches nothing (this was a real
  bug once, fixed — don't reintroduce it).
  Because these four don't store Topic/Subtopic anymore, every place that
  used to match them to a Syllabus row by a `syllabusId` scalar + full
  text path had to move to id/array-based matching instead:
  `buildTaggedIndex`/`taggedRecsForSyllabusRow` (generalized from what was
  originally Classes-only) power Topic Completion's derivation
  (`computeTopicCompletionFields`) and Topic Master's cross-linking for
  all four; `countSyllabusRowReferences`/`countRecordsLinkedToSyllabus`
  and `getSourceIdentifiedIndex` check `microtopics` array membership
  alongside the legacy `syllabusId` scalar; `renameSyllabusValue`'s
  topic/subtopic-level branches no longer touch these four (they have
  nothing to rename at those levels); `syncSyllabusRowReferences` excludes
  them entirely (their tags resolve live off the Syllabus row via
  `resolveMicrotopicLabelById`, same as Classes always did — no stale
  copy to sync). Import/Export for these four was **not** updated to this
  shape — it still imports into the old `subject`/`topic`/`subtopic`/
  `microtopic` scalar fields (Classes' importer does convert a plain
  `microtopic` column into a one-item `microtopics` array, but the others
  don't even do that) — re-derive this properly before relying on it
  rather than assuming it round-trips.
- **Fixing a typo or a wrong Subject/Topic/Subtopic/Micro Topic pick is a
  cascading rename (`renameSyllabusValue`), not a per-row edit.** The
  pencil icon next to each of these on the Syllabus tab
  (`CascadingSelectCell`'s `onRename`) reuses the same inline text-input
  UI as "+ Add new", but instead of creating something new or only
  touching the current row, it corrects the value everywhere it's used —
  every other Syllabus row sharing that value, and the matching
  subject/topic/subtopic/microtopic text on Classes/Reading/Single
  Pager/NCERT/Standard Books/Current Affairs (Tamil too, for a Topic
  rename under Tamil Literature specifically), plus `settings.subjects`
  for a Subject rename. This exists because Subject/Topic/Subtopic are
  plain repeated strings, not a normalized entity with one stable id — a
  plain per-row edit would silently fork the data into two spellings
  instead of correcting it. **GS Answer Writing is deliberately excluded**
  from every rename cascade — it has no `subject` field, only
  `gsPaper`+`topic`, so there's no reliable way to confirm one of its rows
  actually belongs to the subject being renamed without risking a false
  match against an unrelated subject that happens to reuse a topic name.
  Classes' Micro Topic tags need no separate handling for a microtopic
  rename: an id-based tag resolves its displayed label from the Syllabus
  row itself (already renamed by this same call), so only a legacy
  plain-text tag whose value literally equals the old text needs updating
  — `renameSyllabusValue` handles this distinction internally. If you add
  a new tracker with its own subject/topic/subtopic/microtopic copy,
  add it to the relevant cascade list(s) here — a rename that silently
  misses one tracker is worse than no rename feature at all, since it
  looks correct everywhere you happened to check.
- **Classes, Single Pager, Tamil Writing, GS Answer Writing, and Topper
  Copies gate completion behind having a file uploaded, and lock the row
  once Completed — `GenericTracker`'s `completionRequiresUpload` prop,
  opted into only by those five (the trackers with both a Status column
  and a `driveFile` column).** Trying to set Status to "Completed" without
  `rec.driveFile` set pops a `window.alert` naming the specific file
  column (looked up from `columns`, not hardcoded) and refuses the
  change outright — no flash of "Completed" before reverting. Once a row
  IS Completed, every other cell locks: visually (wrapped in a
  `pointer-events: none`, dimmed `<div>`) and structurally (`updateField`/
  `updateFields` refuse non-status changes on a Completed row as a
  backstop behind the visual lock, in case something ever manages to
  dispatch a change without going through the disabled UI). The status
  field itself stays fully interactive on a locked row — changing it away
  from "Completed" is the deliberate, only escape hatch for fixing a
  mistake after the fact, not an oversight. **Visual treatment: the whole
  locked `<tr>` gets `background: var(--green-soft)` and the lock icon
  turns `var(--green)`** — deliberately not a grey/dimmed "disabled" look,
  since Completed is an achieved state, not a broken one. Non-editable
  cells are still `pointer-events: none` (or, for `readableWhenLocked`
  columns, fully interactive for scrolling) but carry no opacity/dimming
  of their own — the row-level green tint is the only visual signal now.
  Topic Completion (no `driveFile` of its own, and no status column left
  that's actually user-set — see the dedicated Topic Completion bullet
  above) and every other tracker are unaffected by design —
  `completionRequiresUpload` is opt-in per tracker, not a global behavior
  of `GenericTracker`. **A column can also set
  `readableWhenLocked: true`** (currently only Topper Copies' Question and
  Observations) to stay fully interactive (no `pointer-events: none`) on a
  locked row so long text can still be scrolled — the cell stays
  effectively read-only because `updateField`'s Completed-row guard
  refuses the write regardless of what the UI allows clicking on. Use this
  only for long-text fields someone would want to re-read on a locked row,
  not as a general way to loosen the lock.
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
  - **Source mapping %** and **overall topic completion %** are computed
    at **Subtopic level, not Micro Topic** (changed by request — was
    Micro Topic level originally, deliberately loosened since not every
    subtopic needs Micro Topics under it to count as "sourced" or
    "covered"). The denominator is every distinct Subject+Topic+Subtopic
    combination in Syllabus (`subtopicRows`, deduped — a subtopic with
    several Micro Topic rows underneath still counts once); rows with no
    Subtopic at all aren't counted either way. A subtopic is "sourced" if
    any Classes/NCERT/Standard Books record's own subject+topic+subtopic
    matches it, regardless of that record's own Micro Topic
    (`sourcedSubtopicKeys`, a `Set` built once — don't scan per subtopic
    row, same reasoning as the Syllabus-lookup caches elsewhere). Topic
    completion averages `topicCompletionScore` (0..1 partial credit
    across Class Notes/Standard Material/NCERT/Single Pager/Revision
    1/Revision 2, "Not Needed" fields excluded per the usual convention —
    only Revision 1/2 can ever actually be "Not Needed" now, since the
    other four are computed and never produce that value) over every
    **Syllabus row's computed Topic Completion fields**
    (`computeTopicCompletionFields`, see the dedicated Topic Completion
    bullet above) matching that subtopic — there may be zero, one, or
    several (one per Micro Topic), averaged together, not just the first
    one taken. This is a deliberately different, more complete metric
    than `readingCompletionPct` (which excludes revision and powers
    Today's "pending reading" list) — don't merge the two or "simplify" by
    reusing one for the other's purpose. The Syllabus tab's
    own per-row Source Identified column is intentionally NOT part of this
    change — it still uses `isSourceIdentifiedForMicrotopic` at whatever
    granularity that specific row represents, unchanged.
  - **Classes completed by subject**: a literal count of rows with
    `status === "Completed"` vs. that subject's Total Classes, which lives
    in `settings.totalClassesBySubject` (a plain `{ [subject]: number }`
    map, set on the Settings tab — deliberately not a per-class-row field,
    since that was tried before and removed for being redundant/
    error-prone). **Not** the highest `classNumber` seen among Completed
    rows — that was the original behavior and was changed by request,
    since a single Completed row at Class Number 2 reading "2 of 26"
    regardless of how many other rows were Completed or Partially
    Completed didn't match what "X of N completed" means to someone
    reading it. Partially Completed/In Progress/Skipped rows still don't
    count toward it either way — only exactly "Completed" does. A subject
    only appears here once its total is set; "no total set" and "0% done"
    are treated as different things.
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
  same rule as Source Identified and the Dashboard. Its "Topic completion"
  panel shows one computed `computeTopicCompletionFields` result per row
  (`topicCompletion`, not a `.map()` over a `reading` array — that array
  key is gone, since Topic Completion is no longer an independently-sized
  list; see the dedicated Topic Completion bullet above), so `countLinked`
  no longer counts it either — it's always present, never meaningfully "0
  vs linked". Tamil and GS Answer
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
- **`DangerZone` has two separate resets, by request — don't merge them.**
  "Reset all data" (unchanged) wipes every key in `CLEARABLE_DATA_KEYS` at
  once. "Reset one section" wipes exactly one of those same keys, using
  `RESETTABLE_SECTION_LABELS` for its dropdown — that label map must stay
  in sync with `CLEARABLE_DATA_KEYS`'s keys (same set, just human-readable
  names) since it's what makes a section resettable at all. Settings is
  never offered in either reset, on purpose. Only the Syllabus option in
  the section-wise reset gets an extra warning line and a live reference
  count (`countRecordsLinkedToSyllabus`) — every other section stores its
  own readable subject/topic/etc. text and has nothing else depending on
  it, but Syllabus is what Classes' Micro Topic tags (which store a
  Syllabus row id, not text) and every tracker's `syllabusId` ultimately
  point to, so resetting it alone (unlike "Reset all data", which clears
  everything that could hold a stale reference in the same stroke) can
  leave other trackers' data referencing rows that no longer exist. If a
  future section gains an ID-based reference to another *non-Settings*
  section, give it the same warning treatment rather than assuming only
  Syllabus can ever need one.
- **Google Drive PDFs**: `DriveFileCell` + `uploadDriveFile`/
  `downloadDriveFile` are generic across trackers — pass a `folderKey`
  (see `DRIVE_FOLDER_NAMES`) to keep each tracker's PDFs in their own
  Drive folder. Currently wired up for Single Pager, Classes, GS Answer
  Writing, Topper Copies, Tamil Reading/Writing, and Current Affairs.
  `ensureDriveFolder` falls back to the legacy singular
  `settings.driveFolderId` only for the `singlePager` key, to avoid
  creating a duplicate folder for existing users; new folder ids live in
  `settings.driveFolders[folderKey]`.
- **Reset (both "Reset all data" and a per-section reset in `DangerZone`)
  archives each affected tracker's Drive folder before clearing its data —
  by request, since Reset never deletes from Drive and previously left old
  files sitting in the same folder a fresh upload would then reuse,
  silently mixing old and new.** `archiveDriveFolders(db, updateSlice,
  folderKeys, label)`: for whichever of the given tracker keys actually
  have a cached folder id (skips entirely, no Drive calls at all, if none
  do), moves that folder (`moveDriveFolder` — Drive's "move" is really
  add/remove parents, so it reads the current parent first) into one fresh
  dated subfolder (`createDatedArchiveFolder`, name like "Archive
  2026-09-03 14-32 — Classes") under a single shared root folder
  (`ensureArchiveRootFolder`, `ARCHIVE_ROOT_FOLDER_NAME`, cached the same
  way as `ensureDriveFolder`'s per-tracker folders via
  `settings.driveArchiveRootFolderId`), then clears those keys from
  `settings.driveFolders` (and the legacy `driveFolderId` if `singlePager`
  was one of them) so the next upload there starts a genuinely new folder.
  Best-effort and non-blocking: `DangerZone` still clears the app's own
  data even if archiving throws (Drive not configured, offline, auth
  expired) — it just surfaces an alert first, since a reset that silently
  refused to run because Drive was unreachable would be worse than one
  that clears local data but leaves old files unarchived in their normal
  folder (which is exactly what Reset already did before this existed).
  Don't make archiving block or fail the reset.
- **First-time uploads get a standardized name; replacing an existing file
  never renames it.** `DriveFileCell`'s `namePrefix` prop (built per call
  site by `nextFileNamePrefix`) supplies something like
  `Polity_FundamentalRights_2` (no extension — `DriveFileCell` appends the
  uploaded file's own extension), where the trailing number is per
  subject+subtopic (or whatever grouping that tracker's call site passes —
  Tamil uses a fixed "TamilLiterature" label + Topic since it has no
  Subject/Subtopic; GS Answer Writing uses GS Paper + Topic since it has
  no Subject at all). **This is deliberately only computed for a row with
  no existing `driveFile` yet — a replace always keeps the current name
  as-is, full stop, never recomputing.** This isn't an oversight: reusing
  the numbering logic on replace risks two files colliding on the same
  number whenever upload order and row order diverge (row A uploaded
  second gets "_2"; later replacing row B, uploaded first as "_1", would
  ask for "how many others already have a file" and get the same "_2"
  answer, since the count doesn't know which specific number a given row
  was assigned — only "keep whatever's already there" avoids this
  correctly, rather than trying to solve it with more clever counting).
  `DriveDownloadLink` is the read-only variant used in Topic Master, which
  has no `updateSlice` to support uploading.
- **Import/export**: `xlsx` for Excel, plus JSON export, applied generically
  across trackers. `IMPORT_TARGETS` covers every tracker **except Topic
  Completion** (Classes, Single Pager, Syllabus, NCERT, Standard Books,
  Tamil Reading, Tamil Writing, Current Affairs, GS Answer Writing, AI
  Learning) — Topic Completion has no import target since its rows are a
  computed 1:1 overview of Syllabus now, not a freestanding importable
  list (see the dedicated Topic Completion bullet above); don't add one
  back without re-deriving what "importing a Topic Completion row" would
  even mean under that model. When a
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
- **`GenericTracker` paginates at 100 rows (`PAGE_SIZE`) — this is a
  second, separate performance fix from the `getSyllabusIndex`/
  `getSourceIdentifiedIndex` caching described above, not a duplicate of
  it.** The caching fixed the O(n²) *data-lookup* cost (re-scanning the
  full array per row); pagination fixes the *DOM/reconciliation* cost —
  React mounting/diffing hundreds or thousands of `<tr>`s (each with
  several dropdowns and other interactive cells) on every edit, which
  hangs the page regardless of how cheap the underlying lookups are. Fixing
  only one of the two was not sufficient in practice at ~1,150 Syllabus
  rows — both are needed. Filters operate on the *full* `filteredRecords`
  set, not just the current page (correct — you should be able to filter
  to a row on page 9 without paging there first); adding a filter or
  clearing filters resets to page 0, and adding a new row jumps to
  whichever page will contain it (it's appended at the end, so on a large
  table it would otherwise land off-screen on page 1 with no indication
  why). If you touch this pagination logic, keep those three behaviors —
  they're what makes paging invisible during normal use rather than a
  source of "where did my row go" confusion.
- **Weekly Review's "Copy for email" is deliberately client-side only — this
  app has no email-sending backend, and that was a considered decision,
  not a gap to fill in later.** A Vercel Cron + Resend/Gmail-SMTP pipeline
  was built and evaluated, then deliberately abandoned: Resend requires a
  verified domain to email anyone other than the account owner (a real
  blocker once "other recipients" was a stated requirement), and Gmail
  SMTP's own documentation warns that Google's abuse-detection can
  silently block an automated, unattended sign-in pattern with no error
  surfaced — an unacceptable failure mode for something meant to run
  unattended for a year. `copySummaryToClipboard` (`WeeklyReviewTab`)
  writes real HTML to the clipboard via `ClipboardItem` (with a
  `text/plain` fallback for browsers/paste-targets that don't support
  rich content), so pasting into Gmail's own compose window preserves
  formatting — zero servers, zero secrets, zero third-party accounts, and
  the person sends it from their own already-authenticated session. The
  explicit trade made here: automatic send was given up entirely in favor
  of eliminating that risk — don't quietly reintroduce a scheduled
  send without re-raising that trade-off with the person first.
  `escapeHtml` exists specifically to keep user-typed journal/reflection
  text from corrupting the generated HTML (or, worse, injecting markup) —
  any new field added to this summary must go through it too.
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
