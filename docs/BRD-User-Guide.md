# UPSC 2027 Command Center — BRD & Tester User Guide

> **Document scope**: this describes the app as of commit `42ded49`
> ("Merge pull request #65 — fix: streak requires completion") on `main`.
> If features are added after this document is generated, some sections
> may lag behind the live app — when in doubt, what's on screen wins.
>
> **Audience**: new testers with no prior context on the app, plus anyone
> who wants a single reference for what the app does and how it's put
> together.

---

## 1. What is this application?

UPSC 2027 Command Center is a **personal exam-preparation tracker and
archive** built for one person's UPSC Civil Services 2027 preparation. It
is not a generic to-do app — every table in it is wired back to a single
UPSC syllabus tree, so a class attended, a note made, a book chapter read,
or an answer written can always be traced back to exactly which
Subject → Topic → Subtopic → Micro Topic it belongs to.

**The end goal:** after Prelims 2027, be able to search any topic —
right down to a micro-topic — and instantly see every class attended,
every note made, every answer written, and every source used for it. The
app is meant to become a complete, searchable revision base, not just a
progress-percentage dashboard.

The app is used daily: an hourly planner/journal, 15+ subject-specific
trackers, a consolidated dashboard, and a cross-reference view (**Topic
Master**) that already delivers a slice of that end goal today.

---

## 2. Getting access (read this before testing)

- The app is a normal email/password web app. Each account is **fully
  isolated** — a new sign-up gets a completely empty workspace, never the
  owner's real preparation data. Testers do not need to worry about
  damaging real study data by creating their own accounts and clicking
  around freely.
- **Sign-up may currently be locked down** (Supabase can be configured to
  block new sign-ups once the owner's own account exists). If a tester
  gets stuck at sign-up, this is the first thing to check with the app
  owner — either sign-up needs to be temporarily re-opened, or the owner
  can create the tester's account directly from the Supabase dashboard.
- **Google Drive upload/download (Single Pager, Classes, GS Answer
  Writing, Topper Copies, Tamil Reading/Writing, Current Affairs PDFs) may
  not work for a tester out of the box.** The Google OAuth consent screen
  for this project is normally run in "Testing" mode with only specific
  Google accounts allow-listed. If a tester's Google account isn't on that
  list, clicking **Upload** will show a Google consent error rather than
  a working sign-in. Ask the app owner to add each tester's Google account
  as a test user first, or treat this as a known-skip area during testing.
  If Drive isn't configured at all, the rest of the app still works
  normally — you'll just see a note on the affected tabs.

---

## 3. High-level architecture (for context only)

You don't need to know this to test the app, but it helps explain why some
things behave the way they do:

- **Frontend**: a single-page React app (no separate pages/URLs — one tab
  bar switches between views instantly).
- **Backend**: Supabase (a hosted Postgres database + login system).
  Everything you enter is saved automatically and synced — sign in on a
  phone and a laptop with the same account and both show the same data.
- **Storage shape**: each tracker (Classes, Syllabus, Current Affairs,
  etc.) is stored as one JSON document per user, not spread across many
  database tables. This is why import/export works tracker-by-tracker.
  Files themselves (PDFs) are never stored in the database — only in the
  user's own Google Drive, with just the file's name/id kept in the
  database.
- **Hosting**: deployed on Vercel; every change goes live at a single
  fixed URL.

---

## 4. The core idea: the Syllabus hierarchy

Almost everything in the app hangs off one tree, maintained on the
**Syllabus** tab:

```
Subject
  └── Topic
        └── Subtopic
              └── Micro Topic
```

Every other tracker links back into this tree at some level — most at the
**Micro Topic** level (tagged as "Topic" in their own UI, see §7). This is
what makes cross-referencing possible: e.g. **Topic Master** and
**Dashboard** can answer "is this micro-topic covered yet?" by looking
across Classes, NCERT, and Standard Books at once, because all three point
at the same Syllabus row.

A few practical consequences worth knowing as a tester:

- **You cannot create a new Subject from most trackers.** Subjects are
  only added on **Settings**. Topics/Subtopics/Micro Topics can be added
  either directly on **Syllabus**, or inline via a "**+ Add new**" option
  while filling in most other trackers (this quietly creates the matching
  Syllabus row behind the scenes).
- **Fixing a typo in a Subject/Topic/Subtopic is a global rename**, not a
  per-row edit — use the pencil icon next to the value on the Syllabus
  tab. It corrects that value everywhere it's used across the whole app,
  not just on the one row you clicked.
- **GS Answer Writing** is the one exception — it only stores GS Paper +
  Topic (no Subject), so it's intentionally left out of the rename
  cascade.

---

## 5. Navigating the app

The app has one persistent top bar (today's date, a live clock, a
countdown to Prelims 2027, and the tab switcher) and 17 tabs, in this
order:

| # | Tab label | What it's for |
|---|---|---|
| 1 | **Today** | Hourly day planner + journal, streak, quick summary cards |
| 2 | **Dashboard** | Read-only analytics: completion %, per-subject class progress |
| 3 | **Classes** | Log every class attended |
| 4 | **Topic Completion** | Auto-computed per-topic completion overview |
| 5 | **Syllabus** | The master Subject/Topic/Subtopic/Micro Topic tree |
| 6 | **Single Pager** | One-pager revision notes per topic (+ PDF) |
| 7 | **NCERT** | Reference log of NCERT chapters read |
| 8 | **Standard Books** | Reference log of standard reference books read |
| 9 | **Tamil Literature** | Reading + writing practice for the optional subject |
| 10 | **Current Affairs** | News clippings mapped to the syllabus |
| 11 | **GS Answer Writing** | Mains-style answer practice + topper-copy comparisons |
| 12 | **AI Learning** | Free-form personal learning log (outside the syllabus) |
| 13 | **Topic Master** | Pick any syllabus row, see everything linked to it |
| 14 | **Search** | Free-text search across topics/classes/notes/current affairs |
| 15 | **Weekly Review** | Weekly stats + journal recap + "copy for email" |
| 16 | **Import / Export** | Bulk Excel import, Excel/JSON export & backup |
| 17 | **Settings** | Subjects list, daily plan template, danger zone (resets) |

---

## 6. Feature walkthrough

### 6.1 Today
The daily driver screen.

- **Hourly plan**: a list of time blocks generated from Settings'
  "Default daily slot template" (study blocks, office/commute, breaks,
  etc.), auto-trimmed to fit if the day is short. Each block has an
  editable duration, a free-text **journal** field ("what did you
  actually do"), and a **Skip** toggle (with a reason, e.g. "Time
  shortage", "Fatigue") instead of deletion.
- This is a **journal, not a task tracker** — there's no per-block
  "mark complete" status here. Actual data entry (a class attended, a
  chapter read) always happens on that tracker's own tab, not here.
- **Wake time** locks itself after the first edit each day — use the
  pencil icon next to it to unlock and change it again.
- **Consistency streak**: a big colored counter next to the plan. A day
  counts toward the streak if *anything* was logged that day across
  Classes / Standard Books / NCERT / Answer Writing / Single Pager /
  Tamil Reading / Tamil Writing / Current Affairs. Color escalates the
  longer the streak runs:

  | Streak length | Color |
  |---|---|
  | 0 days | Red |
  | 1–20 days | Blue |
  | 21–99 days | Green |
  | 100+ days | Gold |

- **Summary cards**: Pending, Revision due, Class, Single pager, and
  Answer writing today — each is clickable and jumps straight to the
  relevant tab.
- **Prelims countdown** (top bar, every screen): days remaining to
  May 23, 2027, with the pill changing color as the date gets closer
  (navy → amber → red).

### 6.2 Dashboard
Read-only — no data entry here, everything is computed from the other
trackers.

- **Source mapping %** and **overall topic completion %**, calculated per
  Subject+Topic+Subtopic (not per micro-topic).
- **Classes completed by subject** — "X of N" against the total class
  count you set for that subject on Settings.
- **Classes — overall status** pie chart: Completed / In Progress / Not
  Completed (Not Started, Partially Completed, and Skipped are grouped
  together here).
- **Answers written** — plain counts by GS Paper (GS1–4, Essay) plus a
  Tamil Writing total.

### 6.3 Classes
Log of every class you've attended.

- Columns: Date, Class Number, GS Paper, Subject, Topic (Micro Topic
  tags), ETA, Status, Class Notes PDF, Log.
- Has a **quick-add drawer** (a slide-in panel from a floating button)
  for fast entry without leaving the table view.
- One class can tag **multiple** Micro Topics.
- Marking Status = **Completed** requires a Class Notes PDF to already be
  uploaded — otherwise you'll get a pop-up naming the missing file, and
  the status won't change. Once Completed, the whole row locks (visually
  tinted green) except the Status field itself, which is the only way to
  undo a mistake.

### 6.4 Topic Completion
A read-only-by-default overview, one row per Syllabus entry — there is no
manual "add row" here.

- **Class Notes / Standard Material / NCERT / Single Pager** are all
  auto-computed from the matching records in Classes / Standard Books /
  NCERT / Single Pager.
- **Revision 1** and **Revision 2** are the only two fields you set by
  hand, on a schedule: Revision 1 becomes due 7+ days after a topic's
  Single Pager was marked Completed, Revision 2 at 30+ days.

### 6.5 Syllabus
The master hierarchy — Subject, Topic, Subtopic, Micro Topic, plus a
read-only **Source Identified** column (auto-true if that micro-topic
shows up in Classes, NCERT, or Standard Books).

- New Subjects can't be added here (Settings only); Topic/Subtopic/Micro
  Topic can be added and renamed here, with renames cascading everywhere
  else in the app.
- Deleting a row warns you (with a count) if other trackers still
  reference it — it still lets you delete, it's a warning, not a block.

### 6.6 Single Pager
One consolidated revision note per topic.

- Included/Not Included checklist for Class Notes, Handout, NCERT,
  Standard Books, plus a Status field and a PDF upload (Google Drive).
- Same "Completed requires PDF, then locks the row" behavior as Classes.

### 6.7 NCERT / 6.8 Standard Books
Pure reference catalogs — GS Paper, Subject, Micro Topic, Book, Chapter
(and Pages for Standard Books). Deliberately **no status or date
columns** — these exist purely to record which sources you've used for a
topic, feeding "Source Identified" and Topic Completion.

### 6.9 Tamil Literature
Sub-tabbed like GS Answer Writing: **Reading** and **Writing** practice
tracked separately for the optional subject.

### 6.10 Current Affairs
News clippings mapped to the syllabus: Date, Topic/Title, Source (The
Hindu / Indian Express / PIB / Other), Subject, Topic, Subtopic, Micro
Topic, and a Clipping/PDF upload. This is the one tracker besides Syllabus
itself that can create brand-new Subject/Topic/Subtopic entries directly
(via "+ Add new") — it writes a real row into Syllabus when you do.

### 6.11 GS Answer Writing
Sub-tabbed:

- **Answer Writing** — Date, GS Paper, Subject(s), Topic (Micro Topic
  tags), Question, Word Limit, Status, Self Score, Improvement Notes,
  Answer PDF. Completed requires the PDF uploaded first, then locks.
- **Topper Copies** — reference answers for comparison: Date, GS Paper,
  Subject(s), Topic, Question, Observations, Status, PDF. Same
  upload-then-lock rule, but with a 2-state status (Not Completed /
  Completed) instead of the 5-state one Answer Writing uses.

### 6.12 AI Learning
A free-text personal log for things learned outside the UPSC syllabus
(e.g. tooling, AI, general skills) — the one tracker that's intentionally
**not** linked to the Syllabus tree.

### 6.13 Topic Master
The closest thing today to the app's end-goal "search a topic, see
everything" view. Pick any Syllabus row (with a text filter to find it
quickly) and see every Class, NCERT/Standard Books entry, Single Pager,
and computed Topic Completion status linked to it, in one place.

### 6.14 Search
A simple free-text box that searches across topics, classes, notes, and
current affairs and returns matches grouped by module.

### 6.15 Weekly Review
Weekly stats (blocks logged vs. skipped) plus a day-by-day journal
recap, and a **"Copy for email"** button. This copies a formatted summary
to your clipboard so you can paste it into your own email client —
there is no automatic emailing (by design — no server, no stored email
credentials).

### 6.16 Import / Export
- **Import**: upload an Excel file, map its columns to a tracker's
  fields, preview the mapped rows (with a possible-duplicates count),
  then import. A blank template can be downloaded for any tracker first.
  Covers every tracker **except Topic Completion** (which has no
  standalone rows to import — it's a computed view of Syllabus).
- **Export**: download everything as Excel or JSON for backup.

> **Tester note**: for Classes / NCERT / Standard Books / Single Pager /
> GS Answer Writing / Topper Copies, import currently only round-trips the
> GS Paper + Subject + Micro Topic fields — it does not import
> Topic/Subtopic for these. That's expected today, not a bug to report.

### 6.17 Settings
- **Subjects** — the only place new Subjects are created.
- **Default daily slot template** — durations for each planner block, and
  a checkbox to disable any slot entirely from future days' plans.
- **Danger zone** — "Reset all data" (wipes everything) or "Reset one
  section" (wipes exactly one tracker, with an extra warning and a live
  reference count if you pick Syllabus, since other trackers point at it
  by id). **Testers: avoid this section entirely unless a reset is
  specifically what you're asked to test**, and only ever on a disposable
  test account.

---

## 7. Behaviors that show up in more than one place

- **"Completed requires a file, then locks the row"** applies to Classes,
  Single Pager, Tamil Writing, GS Answer Writing, and Topper Copies. The
  row turns green (not greyed out — green means "achieved," not
  "disabled"). The Status field stays editable so a mistake can always be
  reversed.
- **"+ Add new"** shows up on most trackers' Topic pickers — it lets you
  create a brand-new Micro Topic (and its Subject, if needed) inline,
  without leaving the row you're editing.
- **Every tracker has a "Log" popover** showing that row's edit history —
  look for the small history icon at the end of each row.
- **Filtering**: every column header can filter — either a dropdown of
  existing values, or a search box for long free-text columns. Filters
  apply across the whole table, not just what's on screen.
- **Large tables page at 100 rows** — filtering still searches the full
  table even if you haven't paged through it.
- **"Not Needed" is excluded from all completion percentages** everywhere
  in the app — it's a valid answer, not a form of "0%."

---

## 8. Suggested test scenarios

A reasonable path through the app for a first-time tester:

1. **Sign up** for a fresh account and sign in.
2. On **Settings**, add 2–3 test Subjects and check a couple of daily
   slots on/off.
3. On **Syllabus**, add a Subject → Topic → Subtopic → Micro Topic chain
   by hand.
4. On **Classes**, use the quick-add drawer to log a class against that
   Micro Topic. Try marking it Completed *without* a PDF (should be
   blocked), then upload a dummy PDF and mark it Completed (row should
   lock and turn green).
5. Check **Topic Completion** — the Class Notes field for that topic
   should now read "Completed" automatically.
6. Check **Topic Master** — search for your test topic and confirm the
   class you just logged shows up linked to it.
7. On **Syllabus**, rename your test Subtopic using the pencil icon, then
   confirm the renamed value shows up correctly on Classes too.
8. Try **Search** for a word from your test topic or class notes.
9. On **Today**, log a journal entry for the current time block and
   confirm the **streak** counter updates (and its color) after a day
   with something logged.
10. On **Import/Export**, download a blank template for one tracker,
    fill in one row, and try importing it back in.
11. On **Weekly Review**, try "Copy for email" and paste the clipboard
    content somewhere to confirm formatting comes through.
12. Resize the browser window / open on a phone to check mobile
    responsiveness, especially the tab bar and table scrolling.
13. If Google Drive is configured for your account (see §2), try
    uploading and then downloading a PDF on Single Pager.

Please don't run **Settings → Danger zone** resets against any account
other than a disposable test one.

---

## 9. Known limitations / things still in progress

- **Single-user design, tested at one real user's scale** — this is a
  personal tool, not a multi-user product; each account's data is
  private and isolated, but there's no sharing/collaboration between
  accounts.
- **No automated tests or CI** — manual testing (this document's purpose)
  is currently the only QA net, so specific, reproducible bug reports are
  especially valuable.
- **Syllabus coverage is a work in progress** — some subjects have their
  full Topic/Subtopic/Micro Topic breakdown filled in, others are being
  added incrementally as classes are attended, so don't read a sparse
  subject as a bug.
- **Import doesn't round-trip every field** for the newer GS Paper /
  Subject / Micro Topic-style trackers (see §6.16 note).
- **No spaced-repetition scheduling beyond Revision 1/2's fixed 7/30-day
  windows** yet.
- **Mobile navigation** is a horizontal-scrolling tab bar across all 17
  tabs — usable, but something to give feedback on if it feels cramped.

---

## 10. How to give feedback / report a bug

There's no in-app feedback form, so please send reports directly to the
app owner with:

1. **Which tab** you were on.
2. **What you did**, step by step.
3. **What happened** vs. **what you expected**.
4. A screenshot if the issue is visual.
5. Whether it happens every time or only sometimes.

General usability suggestions (confusing labels, awkward flows, things
that felt missing) are just as useful as hard bugs — that's exactly what
this testing round is for.

---

## 11. Vision & way forward

**Where this is headed:** a complete, searchable revision archive
covering the entire syllabus — usable for last-mile Prelims revision,
for improving Mains answer quality via topper-copy comparisons, and (if
ever needed) reusable rather than rebuilt for a repeat attempt. The app
only organizes preparation that still has to happen through actual
reading, classes, and answer writing — it doesn't do that work itself.

**Planned next, once feature development resumes:**

- Filling in the remaining syllabus subtopics (Economics, Science & Tech,
  Agriculture) as those classes are attended.
- A lightweight spaced-repetition suggestion for Revision 1/2 (e.g.
  fixed +7/+21/+45-day nudges) rather than the current flat windows.
- Pace/velocity forecasting against the exam date, once enough weeks of
  real nightly data exist to make that meaningful.
- Longer-term: splitting the single large `App.jsx` file and adding
  automated tests, once feature work slows down enough to make that a
  good use of time.

This is a living document — as major features ship, this guide should be
refreshed so it keeps matching the real app.

---

## 12. Glossary & reference tables

**Hierarchy terms**

| Term | Meaning |
|---|---|
| Subject | Top-level UPSC subject (e.g. Polity, Geography) |
| Topic | A subdivision of a Subject |
| Subtopic | A subdivision of a Topic |
| Micro Topic | The finest-grained unit — what most trackers actually tag |
| Source Identified | Auto-computed: has any class/NCERT/standard-book entry been logged against this micro-topic? |

**Status vocabularies used across the app**

| Vocabulary | Values | Used by |
|---|---|---|
| `TASK_STATUS` | Not Started, In Progress, Completed, Partially Completed, Skipped | Classes, GS Answer Writing |
| `READ_STATUS` | Yet to Start, In Progress, Completed, Not Needed | Topic Completion's Revision 1/2 |
| `SP_STATUS` / `AI_STATUS` | Not Started, In Progress, Completed | Single Pager, AI Learning |
| `TOPPER_STATUS` | Not Completed, Completed | Topper Copies |
| `INCLUSION_OPTIONS` | Included, Not Included | Single Pager's source checklist |
| `CA_SOURCES` | The Hindu, Indian Express, PIB, Other | Current Affairs |
| Skip reasons | Time shortage, Office workload, Fatigue, Unexpected work, Other | Today's Planner |

**GS Paper naming** — two different vocabularies are used for the same
thing and are matched internally; if a filter looks like it's showing the
wrong paper, this mapping is usually why:

| Short form (Answer Writing / Classes / etc.) | Long form (Syllabus) |
|---|---|
| GS1 | GS Paper I |
| GS2 | GS Paper II |
| GS3 | GS Paper III |
| GS4 | GS Paper IV |
| Essay | Essay |

Syllabus also separately supports CSAT, Optional Paper I/II, and
Personality Test as GS Paper values, which the short-form trackers don't
use.

**Streak colors** — see §6.1.

**Key date**: Prelims 2027 target date used for the countdown widget is
**May 23, 2027**.
