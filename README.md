# UPSC 2027 Command Center

A personal UPSC 2027 preparation planner and tracker — daily planner, class
tracker, reading tracker, syllabus, single pagers, NCERT, standard books,
Tamil literature, current affairs, GS answer writing, AI learning, topic
master, search, and weekly review. Data is stored in Supabase (Postgres) and
scoped to your account, so it syncs across every device you sign into.

## 1. Create a Supabase project

1. Go to https://supabase.com, create a free account and a new project.
2. Open the **SQL Editor** and run the contents of `supabase/schema.sql`
   (creates one table, `kv_store`, with Row Level Security so only you can
   read or write your own rows).
3. Open **Project Settings -> API** and copy:
   - **Project URL**
   - **anon public** key

## 2. Configure and run locally

```bash
cp .env.example .env
# paste your Project URL and anon key into .env

npm install
npm run dev
```

Open the local URL it prints (usually `http://localhost:5173`), click
**Need an account? Create one**, and sign up with your own email/password.
That becomes your one account — everything you enter from then on is
private to it.

> If your Supabase project has email confirmation turned on, check your
> inbox for the confirmation link before your first sign-in.

## 3. (Recommended) Lock down new sign-ups

Once your own account exists, go to **Authentication -> Providers -> Email**
in Supabase and turn off "Allow new users to sign up." This keeps the
public URL from being usable by anyone else to create an account — though
even without this step, Row Level Security means nobody else could ever see
your data.

## 4. Deploy

Push this folder to a GitHub repo, then import it into **Vercel** or
**Netlify**:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  (same values as your `.env`) in the host's project settings.

Deploy, then open the resulting URL on your phone and laptop and sign in
with the same account on both — every change saves straight to Supabase, so
they'll always show the same data.

## 5. (Optional) Google Drive for Single Pager PDFs

The Single Pager tab can upload/download a PDF per topic straight to your
own Google Drive — the PDF itself never passes through or is stored in
Supabase, only its Drive file id/name are. To enable it:

1. In [Google Cloud Console](https://console.cloud.google.com), create (or
   pick) a project, then **APIs & Services -> Library** and enable the
   **Google Drive API**.
2. **APIs & Services -> OAuth consent screen**: choose **External**,
   **Testing** mode, and add your own Google account under **Test users**.
   Since you're the only user, this avoids needing Google's app-review
   process.
3. **APIs & Services -> Credentials -> Create Credentials -> OAuth client
   ID**, application type **Web application**. Under **Authorized
   JavaScript origins**, add every URL you'll open the app from — e.g.
   `http://localhost:5173` for local dev, plus your deployed URL from step 4.
   You don't need a redirect URI for this.
4. Copy the resulting **Client ID** into `VITE_GOOGLE_CLIENT_ID` in your
   `.env` (and in your host's environment variables if deployed).
5. The first time you click **Upload** on a Single Pager row, Google will
   ask you to sign in and approve access — scoped to `drive.file`, meaning
   this app can only see files it creates itself, nothing else in your
   Drive. Files land in a folder named "UPSC 2027 Command Center - Single
   Pagers".

If this isn't configured, the rest of the app works exactly as before —
you'll just see a note on the Single Pager tab and Upload will show an
error if clicked.

## 6. (Optional) Google Calendar sync for Today's Planner

Today's Planner has an **Add to Google Calendar** button that creates a
real event for each of that day's active tasks (skips breaks and any
skipped/dropped slots) directly in your Google Calendar — no extra tabs,
no manual "Save" on Google's side. It reuses the same Google Cloud
project as Drive above, with its own narrower scope:

1. In the same [Google Cloud Console](https://console.cloud.google.com)
   project you used for Drive, go to **APIs & Services -> Library** and
   enable the **Google Calendar API**.
2. If your OAuth consent screen's **Scopes** step asks you to add scopes
   explicitly, add `.../auth/calendar.events` there. (Testing-mode apps
   with your account listed under **Test users** don't need Google's
   app-review process for this, same as Drive.)
3. Nothing else to configure — it uses the same `VITE_GOOGLE_CLIENT_ID`
   as Drive. The first time you click **Add to Google Calendar**, Google
   will ask you to approve this additional scope (a one-time popup, even
   if you'd already approved Drive access before) — scoped to
   `calendar.events`, meaning this app can create/edit events it makes,
   not read the rest of your calendar.

If this isn't configured, the button will show an error when clicked;
the rest of the app is unaffected.

## Notes

- Fonts are loaded from Google Fonts in `index.html`; if you're offline
  often, you can self-host them instead.
- The Excel importer (Import/Export tab) runs entirely in your browser —
  your spreadsheet never leaves your device except to Supabase once you
  click Import.
- "Not Needed" statuses are intentionally excluded from completion
  percentages everywhere in the app.
- Single Pager PDFs (if you set up Google Drive — see section 5) are
  uploaded straight from your browser to your Drive and fetched fresh on
  each download; Supabase only ever stores the Drive file's id and name.
