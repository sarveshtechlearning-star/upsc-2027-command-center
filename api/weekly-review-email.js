// Vercel serverless function — sends the weekly review email.
// Triggered automatically by the cron entry in vercel.json (Vercel adds an
// `Authorization: Bearer <CRON_SECRET>` header itself; see
// https://vercel.com/docs/cron-jobs/manage-cron-jobs). Can also be
// triggered manually (e.g. via curl) with the same header, for testing —
// there is deliberately no separate "test mode": a manual trigger sends a
// real email through the same path the cron job uses, so a successful
// manual test is proof the automatic version will work too.
//
// Required environment variables (set in Vercel -> Settings -> Environment
// Variables, NOT prefixed with VITE_ — these must stay server-only and
// never ship in the client bundle):
//   CRON_SECRET               - random string, also used for manual testing
//   SUPABASE_SERVICE_ROLE_KEY - Supabase -> Project Settings -> API -> service_role
//                               (bypasses Row Level Security - this function
//                               has no logged-in user session to satisfy RLS
//                               with, and this app is single-user by design,
//                               so it just reads every row)
//   RESEND_API_KEY            - from resend.com -> API Keys
//   WEEKLY_REVIEW_EMAIL_TO    - the recipient address
// Optional:
//   EMAIL_FROM                - defaults to Resend's sandbox sender, which
//                               can only send to the address you signed up
//                               to Resend with. Verify a domain in Resend to
//                               send from your own address / to anyone else.
//
// Reuses VITE_SUPABASE_URL (already set for the client build) — that one
// env var is fine to read server-side too; the VITE_ prefix only controls
// what Vite inlines into the browser bundle, not what a serverless
// function can see.

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const to = process.env.WEEKLY_REVIEW_EMAIL_TO;
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !to) {
    return res.status(500).json({ error: "Missing one or more required environment variables" });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase.from("kv_store").select("key, value");
    if (error) throw error;

    const db = {};
    (data || []).forEach(row => { db[row.key] = row.value; });

    const html = buildWeeklyEmailHtml(db);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "UPSC 2027 Command Center <onboarding@resend.dev>",
        to: [to],
        subject: `Weekly Review — week of ${weekLabel()}`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text();
      throw new Error(`Resend API error (${resendRes.status}): ${detail}`);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("weekly-review-email failed:", err);
    return res.status(500).json({ error: String(err) });
  }
}

// --- content is a placeholder for now, per "we'll talk about content
// separately" — a simple last-7-days count summary, just enough to prove
// the pipeline end to end. Replace this once content is decided. ---

function daysAgoISO(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function weekLabel() {
  return `${daysAgoISO(6)} to ${daysAgoISO(0)}`;
}

function countSince(arr, cutoff) {
  return (arr || []).filter(r => r && r.date && r.date >= cutoff).length;
}

function buildWeeklyEmailHtml(db) {
  const cutoff = daysAgoISO(6);
  const classesCount = countSince(db.classes, cutoff);
  const answersCount = countSince(db.answerWriting, cutoff);
  const tamilWritingCount = countSince(db.tamilWriting, cutoff);
  const currentAffairsCount = countSince(db.currentAffairs, cutoff);

  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="margin-bottom: 4px;">Your week: ${weekLabel()}</h2>
      <p style="color: #666; font-size: 13px; margin-top: 0;">This is a placeholder summary — we're still deciding what should actually be in this email.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Classes logged</td><td style="text-align: right; font-weight: 600;">${classesCount}</td></tr>
        <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">GS answers written</td><td style="text-align: right; font-weight: 600;">${answersCount}</td></tr>
        <tr><td style="padding: 6px 0; border-bottom: 1px solid #eee;">Tamil answers written</td><td style="text-align: right; font-weight: 600;">${tamilWritingCount}</td></tr>
        <tr><td style="padding: 6px 0;">Current affairs logged</td><td style="text-align: right; font-weight: 600;">${currentAffairsCount}</td></tr>
      </table>
    </div>
  `;
}
