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
    records now). Today's Planner widgets (`computePendingTasks`), the
    Dashboard's Overall Topic Completion %, `SyllabusTab`'s own progress
    stat, and Topic Master's "Topic completion" panel were all migrated to
    this pattern — if you touch any of those, keep them reading from
    Syllabus + the computed fields, not `db.reading` directly. The old
    "Previous day's class notes" pending item was removed entirely, not
    migrated — it existed to nudge you to do a separate manual "class
    notes" step that no longer exists now that Class Notes derives straight
    from the class's own Completed status.
  - **`computePendingTasks` has three categories, each powering its own
    Today's Planner widget** (not one combined "Pending" list anymore):
    "Pending" (a Class that's started but not finished with an ETA set, or
    a topic whose Class Notes are done but Single Pager isn't — the
    natural next step after a class), "Revision due" (a real
    spaced-repetition schedule now, not "the moment Class Notes/Revision 1
    finish" — Revision 1 at 7+ days and Revision 2 at 30+ days, both
    measured from the same anchor: `statusCompletedAt` on whichever Single
    Pager record actually got marked Completed, read from that record's
    own change history, not just "is it Completed now"), and "Single
    pager" (any topic with Class Notes *or* Standard Books *or* NCERT done
    but no Single Pager yet — deliberately broader than "Pending"'s
    Class-specific condition, since a topic's source material doesn't have
    to come from a class). `statusCompletedAt(rec, fieldLabel)` is generic
    — reusable anywhere else "when did this last become Completed" matters
    — and returns the *most recent* match, so an undo-then-redo doesn't
    anchor to a stale timestamp.
  - **The Consistency streak widget sits beside "Today's plan", not in
    the summary grid below it** (`computeConsistencyStreak`; briefly
    tried in the header row beside Wake time/Day type on Sep 13, moved
    back beside the plan card the same day after seeing it live)
    — a day counts if *any* of Classes/Standard Books/NCERT/Answer
    Writing/Single Pager/Tamil Reading/Tamil Writing/Current Affairs has a
    record dated that day; counts backward from today, or from yesterday
    if today has nothing logged yet (the day isn't over, so an empty today
    shouldn't zero out an otherwise-alive streak). NCERT and Standard Books
    gained a `date` field for this specifically — neither had one before,
    since neither needed one until a cross-tracker "was something logged
    today" check existed. Its color is driven by `streakTone(streak)`
    (0 → red, 1–20 → blue, 21–99 → green, 100+ → gold, via
    `STREAK_TONE_COLORS`), not a fixed red — the widget's background,
    border, icon, and text all key off the same tone lookup, so adding a
    new tier means updating `streakTone`'s thresholds and
    `STREAK_TONE_COLORS`' palette, not the widget's JSX itself. `--gold`/
    `--gold-soft` were added to the `:root` token list for this since
    nothing gold-ish existed in the palette before.
  - **Negative-streak widget (shipped Sep 13, 2026 as part of a one-day
    freeze exception — see backlog history below) sits directly beneath
    the streak card, and "This week's tasks" sits beneath both of those —
    all three now one stacked column beside "Today's plan"** (that
    column briefly lived in the header row on Sep 13 before moving back
    here the same day; see the Weekly Planner entry below for how
    "This week's tasks" ended up folded into this same column instead of
    sitting beside it as its own flex item) — `computeMissedDays(db)`
    counts consecutive zero-activity days ending **yesterday**;
    **updated same day** (Sarvesh, after seeing it live) to always give
    today itself the real streak's own "day isn't over yet" leniency,
    regardless of whether today already has activity — the original
    version counted today too and reset to 0 the instant today got
    activity, which showed "1 day missed" the moment you opened the app
    each morning before logging anything; the fix always starts the
    count at yesterday, so it only reflects fully-passed missed days
    (0 if yesterday was fine, 1 if only yesterday was missed, 2 if
    yesterday and the day before were both missed, etc.) and nudges for
    today via copy alone ("Today's still in — keep it that way" /
    "Log anything today to reset this"), never via the count. Both
    streak functions now share an extracted `dayHasActivity(db, iso)`
    helper so their definition of "activity" can't drift apart.
    Deliberately structurally distinct from the streak card per
    Sarvesh's design ask: a slim horizontal banner (not the same
    centered-square shape), a `Frown` icon (not `Flame`), and its own
    `missedDaysTone`/`MISSED_DAYS_TONE_COLORS` severity ramp (calm →
    amber → orange → red) rather than a reuse of `streakTone`. A
    `ucc-missed-pulse` CSS animation is the one motion cue, applied only
    at the worst ("severe") tier. Fully independent of the streak's own
    state — reads `db` directly, nothing shared with `streakTone`/
    `STREAK_TONE_COLORS`.
  - **Weekly Planner (shipped Sep 13, 2026, same freeze exception) —
    `db.weeklyPlanner: { [weekStartISO]: { tasks: [{id, text, status}] } }`,
    status one of `"pending" | "completed" | "skipped"`.** `"incomplete"`
    is never written — `taskEffectiveStatus(task, weekStart)` derives it
    at read time once `todayISO() > addDaysISO(weekStart, 6)`, so it's
    always correct with no cron/write-back needed. Uses the *same*
    Monday-start `weekStartISO()` as the pre-existing Weekly Review
    journal (originally spec'd as its own Sun-Sat week on Sep 11; changed
    to Monday-start at Sarvesh's request on Sep 13 specifically so task
    counts fold into the same weekly report rather than needing a second,
    misaligned one). Shared `WeeklyTaskPanel` component (checkbox
    complete/revert, separate Skip button, add/remove when `allowAdd`) is
    used in two places: `TodayTab`'s "This week's tasks" card (keyed to
    `weekStartISO(dateISO)` — follows whichever date is selected via that
    tab's own date navigator, changed from an earlier always-real-week
    version on Sarvesh's request the same day, Sep 13; the card itself
    now stacks beneath the streak/missed-days widgets in the single
    column beside "Today's plan" — see the streak widget note above for
    that column's Sep 13 history) and
    `WeeklyReviewTab`'s "Weekly task planner" card (tasks are set
    here, against the same `weekOf` cursor as the journal above it).
    Per-week Completed/Not Completed(`incomplete`)/Skipped counts are
    pushed into `WeeklyReviewTab`'s existing `statsRows` array, so they
    show up in both the on-screen stat grid and the printed/emailed
    report with no separate report-building logic. Explicitly independent
    of streak logic — no reference anywhere to `computeConsistencyStreak`/
    `streakTone`/`STREAK_TONE_COLORS`/`computeMissedDays`.
  - **PDF View button (shipped Sep 13, 2026, same freeze exception)** —
    `DriveFilesCell` has a View button next to Download on every file row,
    opening `https://drive.google.com/file/d/{file.id}/view` in a new tab
    (`window.open(..., "_blank", "noopener,noreferrer")`). No new state,
    no Drive API call — just a URL built from the file id already on hand.
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
- **Today's Planner has no auto-generated slots — it's a plain, user-built
  task list, gated by a two-step confirm/finalize flow** (replaced the old
  `CORE_SLOT_TEMPLATE`/`buildBaseBlocks`/`applyTrimRules` auto-population-
  and-drop system entirely — Sep 17, 2026, Sarvesh-authorized freeze
  exception, see Section 19 history). Each plan block (`PlanBlock`) shows
  an editable time, editable duration, and a free-text `journal` field
  ("what did you actually do in this slot") — that's it. There is no
  per-block status control (`TaskStatusButtons`, `GATED_LINK_TABS`, the
  completion-detecting `useEffect`, and `LinkedTaskInfo` were all removed
  as a unit, well before this change — don't reintroduce a status
  vocabulary or a "click Completed to navigate" flow here). Actual tracker
  data entry (topics, PDFs, marks, etc.) always happens on that tracker's
  own tab; the planner is only for the quick per-hour note. The earlier
  embedded add/edit widgets (`ClassLectureWidget`, `TodayListWidget`,
  `QuickPickWidget`, `InlineAddForm`) are gone for this same reason — don't
  reintroduce them.
  `block.status`/`completedAt` still exist on already-stored plans for
  backward compatibility but are not read or written anywhere new — don't
  build features on them. Weekly Review's stats and per-day breakdown
  (`WeeklyReviewTab`) are journal-based to match: "Logged" counts blocks
  with non-empty `journal` text, "Skipped" counts `block.skipped`, and the
  per-day list shows each block's real start/end via `computePlanTimes`.
- **The confirm/finalize flow itself**: `initDayPlan` returns `blocks: []`
  plus `dayConfirmed: false, finalized: false` — nothing is auto-populated
  going forward. (1) Enter wake time + day type, click Confirm
  (`confirmDay`, sets `dayConfirmed: true`) — locks both inputs; the
  Pencil `IconBtn` (`unlockDay`) is the only way back in, same
  deliberate-escape-hatch shape as `GenericTracker`'s Completed-row lock.
  (2) Once confirmed, "Available today" shows `settings.sleepTime −
  wakeTime` (`fmtHM`), raw — deliberately NOT subtracting office/commute
  (Sarvesh's explicit call when this was built); treat fixed-commitment-
  aware availability as a separate future ask, not something to add back
  in silently. (3) "Add tasks" opens a small panel: pick from this week's
  `db.weeklyPlanner` tasks not already pulled in (deduped via
  `fromWeeklyTaskId`) or type a new one (`addTaskFromWeekly`/
  `addNewTask`) — both default a new task's `time` to right after the
  previous task's end (`nextTaskDefaultTime`, via `computePlanTimes`) and
  `duration: 30`, both freely editable afterward. (4) "Finalize today"
  (`finalizeDay`, sets `finalized: true`) hides "Add tasks" — no more
  tasks can be added — but every task's own time/duration inputs stay
  editable (`PlanBlock` never checks `finalized`; only the "Add tasks"
  control in `TodayTab` does). Removing a task stays available even after
  finalize — only *adding* was asked to be locked; don't extend the lock
  to removal or to journal/skip editing without a separate ask.
- **Each block now carries its own explicit `time` (HH:MM), not just a
  `duration`** — tasks no longer have to be contiguous or run in a fixed
  cascade. `computePlanTimes` uses `block.time` when present; for blocks
  saved before this change (no `.time`) it falls back to the old
  cascading-cursor calculation off `plan.wakeTime`, so historical Daily/
  Weekly Review data renders exactly as it used to, with no migration.
- **Backward compatibility for plans saved before Sep 17, 2026**: a stored
  plan with no `dayConfirmed`/`finalized` field is treated as
  `dayConfirmed: true, finalized: false` (`TodayTab`'s `??` fallback) — old
  days skip the confirm gate and keep "Add tasks" available, exactly like
  before this change; only plans `initDayPlan` creates going forward get
  the new gated flow. The old auto-injected Office/commute group and its
  merged card (`OfficePlanBlock`) are gone — historical WFH/WFO days with
  `office`/`travelTo`/`travelFro` blocks now render as plain individual
  tasks instead of one merged card. Data is untouched; this is a
  display-only change for old days. `CalendarSyncButton` is still handed
  `timedBlocks.filter(b => b.type !== "break")` for this same
  backward-compatibility reason, even though no block created going
  forward is ever type `"break"`.
- **Day Arc colors freeform tasks by a hash of their own label**
  (`hashTaskColor`, `TASK_COLOR_PALETTE` — fixed Sep 17, 2026, same day as
  the daily-plan-template removal above, once the resulting bug was
  reported live). Since every task added going forward has no fixed slot
  id, `colorForBlock`'s old fallback (`var(--sec-custom)`) was hit by
  *every* task — the whole arc rendered as one solid color. The fix reuses
  the same 8-color palette (`--sec-s1`..`--sec-s7`, `--sec-custom` — s1-s7
  are otherwise dead now that no new block ever has those ids) via a
  simple string hash of `block.label`, so the same task name gets the same
  color every time it recurs and different names are very likely (7/8
  odds per pair, not guaranteed — don't "fix" an occasional same-day color
  repeat, that's expected) to differ. `s1`-`s7` ids on plans saved before
  Sep 17, 2026 still resolve to their original fixed colors first, via the
  existing id check ahead of the hash fallback — unaffected.
- **`LiveClock`** (top bar, next to today's date) is a self-contained
  ticking clock — its own `setInterval`/`useState`, cleaned up on
  unmount — not wired to any tracker data. If another live-updating time
  display is ever needed, reuse this component rather than adding a
  second interval.
- **`PrelimsCountdown`** (top bar, right side, every screen — it lives in
  the app-shell `ucc-topbar` markup, not inside any per-tab `body`) shows
  days remaining to `PRELIMS_2027_DATE` (`"2027-05-23"`, hardcoded near
  the other date utilities — update this constant, not the component, if
  the exam date is ever officially notified differently). Recomputes on a
  60s `setInterval` (daily-precision display doesn't need `LiveClock`'s
  1s tick). Pill color escalates navy → amber → red (with a CSS pulse) as
  the date gets closer (`>100` / `31–100` / `≤30` days out), purely via
  the `days` value — no separate settings/config for the thresholds.
- **There is no separate end-of-day review** (`db.dailyReviews` stays
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
  - `microtopicTagColumn(db, setAddTopicFor, label)` — a tag
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
    of state per tab). `setAddTopicFor` stores an `attach(newId,
    createdSubject)` closure captured from *that render call's own*
    `updateRecord`, not a `{trackerKey, recId}` pair to re-find the record
    by id afterwards — the latter used to be how this worked, and it
    silently dropped the new tag whenever the triggering row wasn't in
    `records` yet (a Classes quick-add drawer draft, for one — a real bug,
    fixed). If you add another place `microtopicTagColumn` renders against
    something that isn't a `records` entry, this is why it'll still work:
    `attach` only ever depends on the closure, never on looking anything
    back up by id.
  - **Single Pager's Micro Topic dedup (shipped Sep 13, 2026, freeze
    exception)**: `microtopicTagColumn` takes an optional 4th param,
    `dedupWithinRecords` — when passed a tracker's own full records array,
    a Micro Topic already used on one row of that **same tracker** is
    filtered out of the dropdown when adding it to a *different* row.
    Single Pager is the only caller that passes this (`db.singlePager`
    at its one call site in `SinglePagerTab`); Classes/NCERT/Standard
    Books/Answer Writing all omit it and keep the original unfiltered
    behavior, since they legitimately need to reuse a Micro Topic across
    multiple rows. Scoped to that one tracker's own rows, never
    cross-tracker. The row being edited keeps its own already-picked
    value(s) available regardless — `TagMultiSelectCell` already excludes
    anything in `values` from its own "available to add" list
    independently of `options`, and resolves an already-picked tag's
    label via `resolveLabel`, never `options` — so no extra guard was
    needed to keep that row editable.
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
  - **Orphaned class-subject warning (bug fix, shipped Sep 13, 2026)** —
    `orphanedClassSubjects` flags any subject present on logged Classes
    rows but absent from `settings.subjects` entirely, and an amber banner
    above the two cards above names each one with its affected class
    count. Root cause it surfaces: Classes' subject dropdown is
    Syllabus-driven (`subjectSingleSelectColumn`), but
    `classProgressBySubject`/`classStatusCounts` only iterate
    `settings.subjects` — the two lists are maintained independently and
    can drift. Found live: 19 "Modern India" classes (all In Progress)
    were invisible to both cards because Settings only had "Modern
    History" (which has no real Syllabus rows at all) with a Total
    Classes of 19 — the pie showed 8 In Progress instead of the real 27,
    and a phantom 19 "Not Completed" for a subject with no real
    not-yet-logged classes. This banner only catches the "subject unknown
    to Settings" case, not a subject that's known but has no Total Classes
    set — that's already handled by the existing "no total set" messaging
    and isn't a bug. Doesn't touch `NcertTab`/`StandardBooksTab`/
    `SinglePagerTab`, which also use `subjectSingleSelectColumn` — their
    subjects never feed into a `settings.subjects`-keyed aggregate (they
    resolve via `syllabusId`/subtopic matching instead), so this failure
    mode is specific to Classes' Dashboard cards.
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
- **Google Drive PDFs**: `DriveFilesCell` + `uploadDriveFile`/
  `downloadDriveFile` are generic across trackers — pass a `folderKey`
  (see `DRIVE_FOLDER_NAMES`) to keep each tracker's PDFs in their own
  Drive folder. Wired up for Single Pager, Classes, GS Answer Writing,
  Topper Copies, Tamil Reading/Writing, Current Affairs, and (Sep 13,
  2026, freeze exception) NCERT and Standard Books. `ensureDriveFolder`
  falls back to the legacy singular `settings.driveFolderId` only for
  the `singlePager` key, to avoid creating a duplicate folder for
  existing users; new folder ids live in `settings.driveFolders[folderKey]`.
  - **NCERT/Standard Books deliberately have no upload gating.** Neither
    tracker has a status column at all — `dayHasActivity` (see the
    streak-widget entries above) already treats any dated NCERT/Standard
    Books row as activity regardless of files, and that stays true
    unchanged. So there's no `completionRequiresUpload`-style check to
    add, and none was added — uploading is just optional, same as every
    other field on those two rows. Sarvesh was explicit about this (Sep
    13): "that need not be linked with completed status." Multi-file
    support (see below) came for free from the shared `DriveFilesCell`/
    `getRowFiles` plumbing — no separate work was needed to support more
    than one file per row.
  **Multiple files per row**: a row's `driveFile` field holds an ARRAY of
  `{id, name, tag}` once touched by `DriveFilesCell` — never renamed to
  `driveFiles`, never migrated in bulk. Every read site goes through
  `getRowFiles(rec)` (returns `[]` for null, wraps a legacy single
  `{id,name}` object in a 1-element array, passes an array through
  as-is), so rows saved before this existed keep working untouched
  forever. **Do not read or write `rec.driveFile` directly anywhere** —
  always `getRowFiles(rec)` for reads; writes go through
  `DriveFilesCell`'s own `onChange(nextFilesArray)`, which the column's
  generic `updateField` then assigns straight to `rec.driveFile` (no
  separate field, so all the existing `completionRequiresUpload`/
  "Partially Completed" lock-exception logic keyed on
  `col.key === "driveFile"` keeps working unmodified). Each fresh "Add"
  (not a Replace) triggers the tag popup whenever the row's `tagOptions`
  has more than one entry — the chosen tag is stored on that file
  (`file.tag`), not just used for naming, so a Classes row tagged to
  several Micro Topics can carry one file per topic. `DriveDownloadLinks`
  (plural) is the read-only variant used in Topic Master for a raw
  record's full file list; `DriveDownloadLink` (singular) still exists
  for spots that already resolved down to one specific file (e.g.
  `bestFileForRow`'s pick for Topic Master's summary table).
  - **NCERT/Standard Books wired into Topic Master (Sep 13, 2026,
    freeze exception, immediately following their upload support
    above)**: `computeTopicCompletionFields` now also returns
    `standardMaterialFile`/`ncertFile` via the same `bestFileForRow`
    call already used for `classNotesFile` — no changes to
    `bestFileForRow` itself were needed, since neither tracker has a
    `status` field, so its "prefer a Completed record's file" tier
    already falls straight through to "any matched record's file" for
    them. Both the summary table (next to the Standard Material/NCERT
    badges) and the detail panel's Topic Completion badges show the
    linked file the same way Class Notes already did. The detail
    panel's raw per-record NCERT/Standard Books lists also gained
    `DriveDownloadLinks files={getRowFiles(...)}`, matching the Classes
    section's existing pattern, so every uploaded file for a topic is
    reachable from Topic Master, not just the one `bestFileForRow` picks
    as "the" file.
- **Enforced status-transition flow (shipped Sep 13, 2026, freeze
  exception)** — `GenericTracker`'s "status" columns now go through
  `FlowStatusSelect` instead of the plain `StatusSelect` (which still
  exists unchanged, used only for the Reading tab's revision1/revision2
  cells — out of scope for this feature). `STATUS_FLOW_CHAINS` +
  `statusFlowChainFor(options)` map each status vocabulary to its
  intended stage order by **reference equality against the vocabulary
  consts** (`TASK_STATUS` → `fourStage`, `SP_STATUS`/`AI_STATUS` →
  `threeStage`, `TOPPER_STATUS` → `binary`) — this is the resolution of
  the "array order isn't flow order" ambiguity (`TASK_STATUS` itself
  still lists Completed before Partially Completed; the chain is a
  separate, authoritative ordering). Confirmed flow (Sarvesh, Sep 13):
  `Not Started → In Progress → Completed`, with Partially Completed as
  an **optional** stop between In Progress and Completed — reachable
  from In Progress, never directly from Not Started. `"Skipped"` is
  deliberately absent from every chain (decide how it fits in after Sep
  30) — it's an unconstrained escape hatch, selectable and reachable
  from anywhere with no ordering or reason requirement.
  - **Forward moves**: `FlowStatusSelect` filters invalid targets out of
    the `<select>` entirely (can't select what isn't shown) — no
    alert/rejection needed since an invalid forward jump was never an
    option. Options are also re-sorted into chain order for display, so
    the dropdown doesn't visually contradict the flow the way
    `TASK_STATUS`'s raw array order would.
  - **Backward moves** (to any earlier chain stage) are always allowed,
    but selecting one opens a small anchored reason popover (same visual
    pattern as `SkipToggle`'s) — nothing commits until Save; Cancel/
    Escape leaves the record untouched. Confirmed (Sarvesh, Sep 13): no
    reason needed on forward moves, only backward.
  - **Per-row log**: reuses the `rec.history` array and the History-icon-
    plus-expandable-row UI that already existed for every status change
    (pre-dates this feature) — a reason, when given, is now attached as
    `entry.reason` and shown inline. No new log infrastructure was
    needed. Confirmed (Sarvesh, Sep 13): visible now, not deferred.
  - **Composes with, doesn't replace**, the existing
    `completionRequiresUpload`/"Partially Completed" row-lock behavior
    (PRs #68–69) — those checks still run in `updateField`/
    `updateDraftField` exactly as before; `FlowStatusSelect` only
    constrains which options even reach that point.
- **Google Calendar + Tasks sync (Today's Planner)**: `CalendarSyncButton` +
  `addBlocksToGoogleCalendar`/`createCalendarEvent`/`createTask` mirror
  the Drive integration's shape — same `VITE_GOOGLE_CLIENT_ID`/Google
  Cloud project, own token client (`gisCalendarTokenClient`/
  `cachedCalendarToken`, distinct from Drive's) so a Drive-only grant
  never silently covers this. One button in `TodayTab` creates, per
  active block, BOTH a Calendar event (`POST .../calendars/primary/events`
  — the timed slot) AND a linked Google Task (`POST
  .../tasks/v1/lists/@default/tasks` — the completion checkbox), since
  Calendar events have no checkbox and Tasks have no time-of-day; neither
  product alone covers both. One combined scope
  (`calendar.events tasks`, space-separated) rather than two separate
  token clients, since these two calls always happen together for this
  feature. `TodayTab` pre-filters `timedBlocks` to non-skipped, non-break
  before handing them to the button; dropped slots are already absent
  from `timedBlocks` entirely (they never made it into `plan.blocks`), so
  no separate filtering for those is needed.

  **Cross-referencing, not merging**: Events and Tasks are separate
  Google object types with no shared UI representation — there's no API
  field that embeds one inside the other, confirmed against Google's own
  REST docs before building this. Instead each points at the other:
  the event's `description` gets a link to the task (via the task's own
  `webViewLink`, Google-populated, not something we construct), and the
  task's `notes` gets a link back to the event (via the event's own
  `htmlLink`, same idea). Three sequential calls per block, in a fixed
  order since each needs an id/link the previous one produced: create
  event -> create task (with a note pointing at the event) -> patch the
  event's description (with a link pointing at the task). Not
  `Promise.all` — partial failure should be attributable to one task, not
  an ambiguous batch error; a block only counts as succeeded if all three
  calls land.
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
  never renames it.** `DriveFilesCell`'s `namePrefix` prop (built per call
  site by `nextFileNamePrefix`) supplies something like
  `Polity_FundamentalRights_2` (no extension — `DriveFilesCell` appends the
  uploaded file's own extension), where the trailing number is per
  subject+subtopic (or whatever grouping that tracker's call site passes —
  Tamil uses a fixed "TamilLiterature" label + Topic since it has no
  Subject/Subtopic; GS Answer Writing uses GS Paper + Topic since it has
  no Subject at all). **This is deliberately only computed for a FRESH
  add (no `replaceFile` passed to `beginUpload`) — a replace always keeps
  the current name as-is, full stop, never recomputing.** This isn't an
  oversight: reusing the numbering logic on replace risks two files
  colliding on the same number whenever upload order and row order diverge (row A uploaded
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
- **The Settings "Default daily slot template" editor and the Fixed
  office/travel hours inputs are gone** (Sep 17, 2026) — they only ever
  configured `buildBaseBlocks`/`applyTrimRules`, which no longer exist
  (see the Today's Planner confirm/finalize bullets above). `settings.
  officeHoursFixed`/`travelHoursEachWay` remain in `defaultDB()` purely as
  harmless unused leftover values — not worth a schema migration to strip.
  `slotsEnabled`/`slotsDeleted`/`slotTemplate` were removed from
  `defaultDB()` and `normalizeSettings` entirely since they referenced the
  now-deleted `CORE_SLOT_TEMPLATE`/`AI_BLOCK` constants; any already-saved
  Supabase settings blob that still has these keys keeps them harmlessly
  in storage, nothing reads them anymore.
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
- **Quick-add drawer (`GenericTracker`'s optional `quickAddLabel` prop,
  e.g. `quickAddLabel="class"` on Classes) is a real draft/commit flow —
  the one place in this app where edits aren't saved immediately.** A
  local `draft` state (initialized via `newRecord()`) backs every field;
  typing into Date/GS Paper/etc. only updates `draft`, never
  `records`/Supabase. The row is created (via `submitQuickAdd`, `{id:
  uid(), history: [], ...draft}`) only when "Add {label}" is clicked,
  which also resets `draft` to blank and closes the drawer
  (`quickAddOpen` state) back to the plain table view. Closed by default —
  a small fixed tab-button (`.ucc-quickadd-fab`) on the right edge of the
  viewport opens it as an overlay (`.ucc-quickadd-drawer` +
  `.ucc-quickadd-backdrop`, `position:fixed`, closes on backdrop click or
  the × ). Deliberately an overlay rather than a permanent layout column
  (an earlier version of this tried that — see git history on the Classes
  quick-add PRs if you need the reasoning) so it never costs the table any
  width while closed, which is most of the time. `quickAddOrder`
  (optional array of column keys) controls the drawer's field order
  independently of the table's column order — Classes uses it to show
  Date, GS Paper, Subject, Class, Topic, ETA, Status, File in that order
  even though the table itself keeps Date, Class, GS Paper, Subject...
  Both the drawer and the table `<td>`s render every column through the
  same `renderCellForColumn(rec, col, { onChange, onPatch, locked,
  partiallyLocked })` helper — the table passes callbacks that call
  `updateField`/`updateFields` (writes to `records`), the drawer passes
  `updateDraftField`/`updateDraftFields` (writes to local `draft` state,
  mirroring the same completionRequiresUpload/"Partially Completed"
  guards). This is why custom columns (cascading GS Paper → Subject, the
  Micro Topic tag picker, the Drive uploader) work in the drawer with no
  special-casing — they only ever depend on `rec` and the two callbacks,
  never on being inside a `<tr>` or on `rec` already existing in
  `records`. Classes also gets a moderate width bump over the app default
  (`.ucc-content-wide`, `max-width:1450px` vs. the normal `1180px`,
  applied in the shell via `tab === "classes"`) — a fixed, deliberately
  more modest number than the table would need if the drawer were a
  permanent column, since it no longer is. Currently wired up for Classes
  only — enable it on another `GenericTracker`-based tab by adding
  `quickAddLabel`/`quickAddOrder` to that tab's `<GenericTracker>` call
  (and its own `-wide` content class in the shell, if it also needs more
  table width); no other plumbing required.
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

`main` has GitHub branch protection enabled (added Sep 4, 2026) — a direct
push to `main` will be rejected by GitHub itself now, not just discouraged
by this doc. This shouldn't change anything in practice since the
branch→PR flow above never pushed to `main` directly anyway, but if a
push to `main` ever fails unexpectedly, this is almost certainly why —
don't try to work around it (e.g. force-push, or push to a differently-
named branch that's secretly `main`); branch off and open a PR instead,
same as always.

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

## 19. Deferred feature backlog

Non-bug feature requests intentionally deferred during the Sep 3–30, 2026
code freeze. Targeted to resume **Oct 1, 2026** — check this section first
when picking work back up.

**Standing rule, effective Sep 13, 2026 through Dec 31, 2026 — weekly
unfreeze window (supersedes the "tightened Sep 7" ad-hoc-exception policy
below; that policy is kept only as history):**

- **Genuine bugs — something broken, not something merely wanted — are
  fixed immediately, any day, no window required.** This was already the
  rule under the old policy too; restated here because it's easy to
  conflate with the feature policy below. Don't make Sarvesh wait until
  Sunday for something that's actually broken.
- **Feature requests and small "I need this on the go" wants queue all
  week in this Section 19 backlog**, same as before.
- **The only time queued features get built is Sunday afternoon through
  Sunday night.** Nothing outside that window.
- There is no ad-hoc exception process anymore. If a feature request
  (however small, however badly wanted, "I need it" included) arrives on
  any day other than Sunday, the answer is always "queued for Sunday" —
  never "let's just do this one now." Don't re-litigate whether *this
  particular* feature is different enough to jump the window; that
  re-litigation is exactly what produced two ad-hoc exceptions in the
  first ten days under the old rule (see the dated notes below).
- If Sunday's window isn't enough time to finish something, it waits for
  the following Sunday rather than bleeding into the rest of the week.

_Sep 13, 2026: the standing weekly window above replaced the ad-hoc
"tightened Sep 7" exception policy that follows, after two ad-hoc
exceptions in the freeze's first ten days — "Multiple files per row"
(Sep 7) and a five-item batch (Sep 13, the same day as this policy
change) — showed that a strict-but-negotiable rule doesn't hold in
practice; each exception makes the next one easier to justify. Sarvesh's
own reasoning for the change: the app isn't finished and he needs some
features and fixes on the go, so a predictable weekly slot is more
sustainable than treating the freeze as airtight and re-litigating it
every time something comes up. Window runs through Dec 31, 2026 —
deliberately well past the original Oct 1 freeze-end date, since the
weekly cadence is meant to replace full daily-build resumption, not just
bridge to it._

**Freeze policy, tightened Sep 7, 2026 (superseded Sep 13, 2026 — kept
for history only, see the standing rule above):** the one exception
granted so far ("Multiple files per row", pulled forward and built the
same day — see below) is the last one for this freeze window. From Sep 7
through Sep 30, only a genuine bug — something broken, not something
merely wanted — qualifies as a freeze exception. If a request in this
window is a feature (however small, however badly wanted, "I need it"
included), the answer is: add it to this list and build it Oct 1. Don't
re-litigate whether *this particular* feature is different — flag it as
a feature and queue it, same as any other.

_Sep 7, 2026: "Multiple files per row" was pulled forward and built as an
explicit, Sarvesh-authorized freeze exception rather than waiting for Oct
1 — see the Google Drive PDFs bullet in Section 4 for what shipped. This
is the exception that prompted the stricter policy above._

_Sep 13, 2026: a second explicit, Sarvesh-authorized exception — this
time a full day rather than a single item, requested and confirmed as a
standalone decision (not bundled into an unrelated instruction) after
Claude flagged the freeze tension per policy. All five items queued in
this section were pulled forward and shipped that day: the Single Pager
Micro Topic dedup, the PDF View button, the negative-streak widget, the
Weekly Planner, and the enforced status-transition flow (the last one
only after resolving its own open design questions in conversation
first, rather than guessing across every tracker). See each item's own
Section 4 entry for what shipped and where — nothing is left queued in
this backlog as of this PR. This is the second exception referenced in
the standing-rule note above._

_Sep 17, 2026: a third explicit, Sarvesh-authorized exception — Claude
flagged the freeze tension (a Thursday, non-Sunday feature request) and
also flagged that it cut short the Sep 13 decision to hold the 8-block
template unchanged through Sep 30 as a diagnostic; Sarvesh confirmed
building it now anyway. Squashed the entire auto-generated/auto-trimmed
daily-plan template (`CORE_SLOT_TEMPLATE`/`buildBaseBlocks`/
`applyTrimRules`) and replaced it with a confirm-then-add-tasks-then-
finalize flow — see the Today's Planner bullets in Section 4 for the full
design. This supersedes the "Finalize the Day" button spec below rather
than building it as originally specified; see that entry.

_Sep 13, 2026: the four items below were surfaced from the Sep 3–6
audit (`claude/app-audit-2026-09-03.md`) — they'd been discussed and,
in one case, explicitly called "queued," but never actually made it
into this section. Added now for Oct 1 pickup; none of them shipped
same-day._

- **JSON import for the Import/Export tab.** Queued by Sarvesh, Sep 6
  (per the audit). Only Excel import currently exists on that tab; JSON
  export/backup exists ("Export all as JSON" under EXPORT/BACKUP) but
  there's no matching import path to restore from one. Scope per the
  audit: parse the same JSON shape produced by "Export all as JSON,"
  reuse the existing preview-before-import UX and dedup-key logic
  already in place for Excel import, and validate against the same
  per-tracker schemas Excel import already uses.
- **Spaced-repetition suggestion for Revision 1/2.** Not a firm
  request — noted as a "still open" idea in the audit (e.g. +7/+21/+45
  day nudges off the Reading tab's revision1/revision2 fields). Worth a
  scope-confirmation pass with Sarvesh before building, rather than
  guessing at trigger timing or where the nudge should surface.
- **`App.jsx` split + test coverage.** Claude's own recommendation from
  the audit, not something Sarvesh asked for — revisit once feature
  velocity slows down or a regression actually occurs, not on a fixed
  timeline. The file is a single ~6,000+ line monolith with no test
  suite, linter, or CI configured (confirmed in `CONTRIBUTING.md` as of
  the audit).
- **Pace/velocity-vs-target-date forecasting.** Deliberately deferred
  in the audit itself in favor of the simpler consistency-streak metric
  that shipped instead — revisit once 4–6 weeks of real nightly data
  exists to forecast against, not before.

_Sep 14, 2026: one new item added directly by Sarvesh (not sourced from
the audit) — queued for the next Sunday window like everything else
above._

- **"Finalize the Day" button (Today tab). SUPERSEDED Sep 17, 2026 — not
  built as specified below.** Sarvesh's underlying need (a confirm step at
  the start of the day, a lock against further changes) was instead met by
  squashing the whole auto-generated template and replacing it with the
  confirm/finalize task-list flow described in Section 4 — see the Sep 17
  entry above. That flow has no `planned`-vs-`journal` distinction (there
  is no pre-populated template to plan against anymore — the task list
  itself, added via "Add tasks," is the plan), so the design below was not
  carried over. Kept here as history only; do not build this as written.
  Original spec, new request Sep 14, 2026:
  Intended flow: (1) a new button on the Today tab opens a confirmation
  popup along the lines of "I've planned what to do today and consent to
  complete as much of it as possible"; confirming it (2) locks that day's
  wake time — reuses the existing `plan.wakeTimeLocked` mechanism, but
  needs reconciling with the current auto-lock-on-first-edit behavior
  (see `changeWakeTime` note in Section 4) so an explicit button-driven
  lock and the implicit edit-driven lock don't fight each other; once
  locked, (3) a second popup lists that day's slots (`plan.blocks`) and
  asks for a planned task/intent per slot; submitting that (4) logs the
  entries into that day's journal and onto the Daily/Weekly Review page.
  **Design question resolved (Sarvesh, Sep 14, 2026):** keep both,
  side by side, per slot — a new **planned** field ("what I wanted to
  do," captured via this button's popup at the start of the day) sitting
  alongside the existing **`journal`** field ("what I've done," still
  filled in the normal retrospective way). Not a merge or an overwrite —
  the point is being able to see intent vs. outcome for the same slot at
  a glance, both in that day's planner view and on Daily/Weekly Review.
  Implementation notes for Sunday: add the new field (e.g.
  `plan.blocks[].planned`) rather than repurposing `journal`; Weekly
  Review's existing Logged/Skipped counts should keep keying off
  `journal` alone (actual, not planned) unless Sarvesh asks otherwise
  when this is built; the Daily/Weekly Review UI needs both values shown
  per block, not just one. **Confirmed Sep 14, 2026 (per mockup shown to
  Sarvesh):** once saved via the finalize popup, `planned` renders as a
  highlighted, read-only line (tinted background, no input/textarea) —
  not editable afterward, unlike `journal` which stays a normal editable
  textarea. No unlock/pencil escape hatch requested for this field
  (contrast with the wake-time lock's pencil unlock in Section 4) — if
  Sarvesh wants one later, treat that as a separate ask rather than
  assuming it's needed now.
