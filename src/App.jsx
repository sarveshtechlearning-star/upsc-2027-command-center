import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient.js";
import {
  Home, BookOpen, Layers, FileText, Library, BookMarked, Languages,
  Newspaper, PenTool, Brain, Search as SearchIcon, BarChart3,
  Settings as SettingsIcon, Upload, Download, ChevronUp, ChevronDown,
  Plus, Trash2, History, Check, AlertTriangle, Clock, ChevronLeft,
  ChevronRight as ChevronRightIcon, X, LogOut, LayoutDashboard, Copy, Pencil, Lock
} from "lucide-react";

/* ============================================================
   DESIGN TOKENS / STYLE
   ============================================================ */
const CSS = `
  :root{
    --paper:#F6F7F5; --surface:#FFFFFF; --ink:#171B1F; --ink-muted:#5B6470;
    --line:#E3E6E7; --line-strong:#CBD1D3; --navy:#29344A; --navy-soft:#3B4A68;
    --amber:#B7791F; --amber-soft:#F2E4C8;
    --green:#2F7A4B; --green-soft:#E1F0E6;
    --red:#B4402A; --red-soft:#F6E1DC;
    --grey:#8B939B; --grey-soft:#ECEDEE;
    --blue:#2F5FA8; --blue-soft:#DEE7F5;
    --study:#29344A; --office:#7A6A52; --travel:#A08A68; --ai:#B7791F; --break:#D8DBDC;
    --sec-s1:#3E7C74; --sec-s2:#29344A; --sec-s3:#7C5295; --sec-s4:#B0562F;
    --sec-s5:#9C4F6E; --sec-s6:#3B6B94; --sec-s7:#6E7A3A; --sec-custom:#5B6470;
  }
  *{box-sizing:border-box;}
  .ucc-root{
    font-family:'Inter',system-ui,-apple-system,sans-serif; color:var(--ink);
    background:var(--paper); min-height:100vh; font-size:14px; line-height:1.45;
  }
  .ucc-mono{font-family:'IBM Plex Mono',ui-monospace,monospace; font-variant-numeric:tabular-nums;}
  .ucc-display{font-family:'Space Grotesk',system-ui,sans-serif;}
  .ucc-shell{display:flex; min-height:100vh;}
  .ucc-nav{
    width:224px; background:var(--navy); color:#EDEFF3; flex-shrink:0;
    display:flex; flex-direction:column; padding:20px 0;
  }
  .ucc-nav-brand{padding:0 20px 18px 20px; border-bottom:1px solid rgba(255,255,255,0.12); margin-bottom:10px;}
  .ucc-nav-brand h1{font-size:15px; font-weight:600; margin:0 0 2px 0; letter-spacing:0.02em;}
  .ucc-nav-brand span{font-size:11px; color:#AEB6C4;}
  .ucc-nav-list{list-style:none; margin:0; padding:0 8px; overflow-y:auto; flex:1;}
  .ucc-nav-item{
    display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:6px;
    cursor:pointer; font-size:13px; color:#C7CCD6; margin-bottom:2px; user-select:none;
  }
  .ucc-nav-item:hover{background:rgba(255,255,255,0.06); color:#fff;}
  .ucc-nav-item.active{background:rgba(255,255,255,0.14); color:#fff; font-weight:600;}
  .ucc-nav-item svg{flex-shrink:0;}
  .ucc-main{flex:1; min-width:0; display:flex; flex-direction:column;}
  .ucc-topbar{
    display:flex; align-items:center; justify-content:space-between; padding:14px 26px;
    border-bottom:1px solid var(--line); background:var(--surface); position:sticky; top:0; z-index:5;
  }
  .ucc-topbar h2{margin:0; font-size:17px; font-weight:700;}
  .ucc-topbar .sub{font-size:12px; color:var(--ink-muted); margin-top:2px;}
  .ucc-content{padding:22px 26px 60px 26px; max-width:1180px; width:100%;}
  .ucc-card{background:var(--surface); border:1px solid var(--line); border-radius:8px; padding:16px 18px; margin-bottom:16px;}
  .ucc-card h3{margin:0 0 10px 0; font-size:13px; text-transform:uppercase; letter-spacing:0.04em; color:var(--ink-muted); font-weight:700;}
  .ucc-grid{display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:14px;}
  .ucc-badge{
    display:inline-flex; align-items:center; padding:2px 9px; border-radius:20px; font-size:11.5px;
    font-weight:600; border:1px solid transparent; white-space:nowrap;
  }
  .ucc-badge.neutral{background:var(--grey-soft); color:var(--ink-muted); border-color:var(--line-strong);}
  .ucc-badge.green{background:var(--green-soft); color:var(--green);}
  .ucc-badge.amber{background:var(--amber-soft); color:var(--amber);}
  .ucc-badge.red{background:var(--red-soft); color:var(--red);}
  .ucc-badge.grey{background:var(--grey-soft); color:var(--grey);}
  .ucc-badge.blue{background:var(--blue-soft); color:var(--blue);}
  .ucc-tag{
    display:inline-flex; align-items:center; gap:4px; padding:2px 6px 2px 9px; border-radius:20px; font-size:11px;
    font-weight:600; background:var(--blue-soft); color:var(--blue); white-space:nowrap;
  }
  .ucc-tag button{
    display:inline-flex; align-items:center; justify-content:center; border:none; background:transparent;
    color:inherit; cursor:pointer; padding:2px; opacity:0.7; line-height:0;
  }
  .ucc-tag button:hover{opacity:1;}
  select.ucc-status{
    border:none; border-radius:20px; padding:3px 22px 3px 9px; font-size:11.5px; font-weight:600;
    cursor:pointer; -webkit-appearance:none; appearance:none;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235B6470' stroke-width='3'><path d='M6 9l6 6 6-6'/></svg>");
    background-repeat:no-repeat; background-position:right 7px center;
  }
  select.ucc-status.neutral{background-color:var(--grey-soft); color:var(--ink-muted);}
  select.ucc-status.green{background-color:var(--green-soft); color:var(--green);}
  select.ucc-status.amber{background-color:var(--amber-soft); color:var(--amber);}
  select.ucc-status.red{background-color:var(--red-soft); color:var(--red);}
  select.ucc-status.grey{background-color:var(--grey-soft); color:var(--grey);}
  select.ucc-status.blue{background-color:var(--blue-soft); color:var(--blue);}
  table.ucc-table{border-collapse:collapse; width:100%; font-size:12.8px;}
  table.ucc-table th{
    text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:0.03em;
    color:var(--ink-muted); border-bottom:1px solid var(--line-strong); padding:6px 8px; white-space:nowrap;
  }
  table.ucc-table td{border-bottom:1px solid var(--line); padding:5px 8px; vertical-align:top;}
  table.ucc-table tr:hover td{background:#FAFAF8;}
  /* Locked (Completed) rows: keep the green fill static — the row stays
     "done" whether or not the mouse is over it — rather than letting the
     generic row-hover grey (above) flash over it and read as
     de-highlighting. Higher specificity (extra .ucc-row-locked class)
     than the plain tr:hover rule, so this wins on hover too. */
  table.ucc-table tr.ucc-row-locked td, table.ucc-table tr.ucc-row-locked:hover td{background:var(--green-soft);}
  .ucc-input, .ucc-select, .ucc-textarea{
    border:1px solid var(--line-strong); border-radius:5px; padding:5px 7px; font-size:12.8px;
    font-family:inherit; width:100%; background:#fff; color:var(--ink);
  }
  .ucc-input:focus, .ucc-select:focus, .ucc-textarea:focus{outline:2px solid var(--navy-soft); outline-offset:1px;}
  .ucc-textarea{resize:vertical; min-height:32px;}
  .ucc-btn{
    display:inline-flex; align-items:center; gap:6px; border:1px solid var(--line-strong); background:#fff;
    color:var(--ink); border-radius:6px; padding:6px 12px; font-size:12.5px; font-weight:600; cursor:pointer;
  }
  .ucc-btn:hover{border-color:var(--navy);}
  .ucc-btn.primary{background:var(--navy); color:#fff; border-color:var(--navy);}
  .ucc-btn.primary:hover{background:var(--navy-soft);}
  .ucc-btn.ghost{border-color:transparent; background:transparent;}
  .ucc-btn.ghost:hover{background:var(--grey-soft);}
  .ucc-btn.danger{color:var(--red); border-color:var(--red-soft);}
  .ucc-btn.danger:hover{background:var(--red-soft);}
  .ucc-btn:focus-visible, .ucc-nav-item:focus-visible, select:focus-visible, input:focus-visible{
    outline:2px solid var(--navy-soft); outline-offset:1px;
  }
  .ucc-btn[disabled]{opacity:0.45; cursor:not-allowed;}
  .ucc-empty{
    border:1px dashed var(--line-strong); border-radius:8px; padding:16px; text-align:center;
    color:var(--ink-muted); font-size:12.5px; background:#FBFBFA;
  }
  .ucc-pill-row{display:flex; gap:6px; flex-wrap:wrap;}
  .ucc-tiny{font-size:11px; color:var(--ink-muted);}
  .ucc-hr{border:none; border-top:1px solid var(--line); margin:12px 0;}
  .ucc-flex{display:flex; align-items:center; gap:8px;}
  .ucc-flex.between{justify-content:space-between;}
  .ucc-flex.wrap{flex-wrap:wrap;}
  .ucc-planblock{
    border:1px solid var(--line); border-radius:8px; padding:12px 14px; margin-bottom:8px; background:#fff;
    display:flex; gap:14px; align-items:flex-start;
  }
  .ucc-planblock.skipped{opacity:0.5;}
  .ucc-planblock .time{width:118px; flex-shrink:0;}
  .ucc-planblock .body{flex:1; min-width:0;}
  .ucc-arc{position:relative; height:34px; border-radius:6px; background:var(--grey-soft); overflow:hidden; margin:10px 0 4px 0;}
  .ucc-arc-seg{position:absolute; top:0; bottom:0;}
  .ucc-legend{display:flex; flex-wrap:wrap; gap:10px; margin:6px 0 4px 0;}
  .ucc-legend-item{display:flex; align-items:center; gap:5px; font-size:11px; color:var(--ink-muted);}
  .ucc-legend-dot{width:9px; height:9px; border-radius:2px; flex-shrink:0;}
  .ucc-arc-marker{position:absolute; top:-4px; bottom:-4px; width:2px; background:var(--red);}
  .ucc-overflow-banner{
    display:flex; gap:8px; align-items:center; background:var(--red-soft); color:var(--red);
    border-radius:6px; padding:8px 12px; font-size:12.5px; font-weight:600; margin:8px 0;
  }
  .ucc-tabbar{display:flex; gap:4px; border-bottom:1px solid var(--line); margin-bottom:14px; flex-wrap:wrap;}
  .ucc-tabbar button{
    background:none; border:none; padding:8px 12px; font-size:12.8px; font-weight:600; color:var(--ink-muted);
    cursor:pointer; border-bottom:2px solid transparent;
  }
  .ucc-tabbar button.active{color:var(--navy); border-bottom-color:var(--navy);}
  .ucc-statgrid{display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:10px;}
  .ucc-stat{border:1px solid var(--line); border-radius:8px; padding:10px 12px; background:#fff;}
  .ucc-stat .n{font-family:'Space Grotesk',sans-serif; font-size:22px; font-weight:700; color:var(--navy);}
  .ucc-stat .l{font-size:11px; color:var(--ink-muted); margin-top:1px;}
  .ucc-histrow{background:#FAFAF9; font-size:11.5px; color:var(--ink-muted);}
  .ucc-histrow td{padding:6px 8px 10px 8px;}
  .ucc-mobile-tabs{display:none;}
  @media (max-width: 880px){
    .ucc-nav{display:none;}
    .ucc-mobile-tabs{
      display:flex; overflow-x:auto; gap:4px; background:var(--navy); padding:8px 10px; position:sticky; top:0; z-index:6;
    }
    .ucc-mobile-tabs button{
      flex-shrink:0; background:rgba(255,255,255,0.08); color:#fff; border:none; border-radius:6px;
      padding:7px 11px; font-size:12px; font-weight:600; cursor:pointer;
    }
    .ucc-mobile-tabs button.active{background:#fff; color:var(--navy);}
    .ucc-content{padding:16px;}
    table.ucc-table{display:block; overflow-x:auto; white-space:nowrap;}
  }
  /* Task status toggle buttons — filled with the status's own color when
     selected, so it's obvious a click registered (see PlanBlock / OfficePlanBlock). */
  .ucc-status-btn{padding:4px 10px; border-radius:6px; font-size:12px;}
  .ucc-status-btn.inactive{background:#fff; color:var(--ink-muted); border-color:var(--line-strong);}
  .ucc-status-btn.neutral{background:var(--grey-soft); color:var(--ink-muted); border-color:var(--grey);}
  .ucc-status-btn.blue{background:var(--blue-soft); color:var(--blue); border-color:var(--blue);}
  .ucc-status-btn.green{background:var(--green-soft); color:var(--green); border-color:var(--green);}
  .ucc-status-btn.amber{background:var(--amber-soft); color:var(--amber); border-color:var(--amber);}
  .ucc-status-btn.red{background:var(--red-soft); color:var(--red); border-color:var(--red);}
  /* Weekly report PDF export — print only the .ucc-print-area subtree. */
  @media print{
    body *{visibility:hidden;}
    .ucc-print-area, .ucc-print-area *{visibility:visible;}
    .ucc-print-area{position:absolute; left:0; top:0; width:100%; padding:0 16px;}
    .ucc-no-print, .ucc-no-print *{visibility:hidden !important; display:none !important;}
  }
`;

/* ============================================================
   CONSTANTS
   ============================================================ */
const READ_STATUS = ["Yet to Start", "In Progress", "Completed", "Not Needed"];
const TASK_STATUS = ["Not Started", "In Progress", "Completed", "Partially Completed", "Skipped"];
const GS_PAPERS = ["GS1", "GS2", "GS3", "GS4", "Essay"];
const SP_STATUS = ["Not Started", "In Progress", "Completed"];
const INCLUSION_OPTIONS = ["Included", "Not Included"];
const CA_STATUS = ["To Read", "Read", "Noted"];
const CA_SOURCES = ["The Hindu", "Indian Express", "PIB", "Other"];
const AI_STATUS = ["Not Started", "In Progress", "Completed"];
const TOPPER_STATUS = ["Not Completed", "Completed"];
const SKIP_REASONS = ["Time shortage", "Office workload", "Fatigue", "Unexpected work", "Other"];
const GS_PAPER_OPTIONS = ["GS Paper I", "GS Paper II", "GS Paper III", "GS Paper IV", "Essay", "CSAT", "Optional Paper I", "Optional Paper II", "Personality Test"];
// GS_PAPERS (Answer Writing/Topper Copies' own short-form GS Paper field,
// e.g. "GS1") and GS_PAPER_OPTIONS (Syllabus's long-form field, e.g. "GS
// Paper I") are two different vocabularies for the same thing — comparing
// them directly (s.gsPaper === rec.gsPaper) silently never matches. This
// maps short to long so Answer Writing/Topper Copies can filter Syllabus
// rows (Subject/Micro Topic options) by their own GS Paper correctly.
const GS_PAPER_SHORT_TO_LONG = {
  GS1: "GS Paper I", GS2: "GS Paper II", GS3: "GS Paper III", GS4: "GS Paper IV", Essay: "Essay",
};

// Maps the day-plan's generic task-status vocabulary onto whatever status
// vocabulary a specific tracker uses, so picking a status in Today's plan
// actually lands on the linked tracker page instead of being a dead click.
const STATUS_COLOR = {
  "Not Started": "neutral", "To Read": "neutral", "Not Completed": "neutral",
  "Yet to Start": "blue",
  "In Progress": "amber", "Reading": "amber", "Partially Completed": "amber",
  "Completed": "green", "Done": "green", "Revised": "green", "Strong": "green", "Read": "green", "Noted": "green",
  "Not Needed": "grey", "Not Applicable": "grey", "NA": "grey",
  "Skipped": "red", "Weak": "red",
};
const colorFor = (val) => STATUS_COLOR[val] || "neutral";

const DEFAULT_SUBJECTS = [
  "Polity", "Economy", "Geography", "History", "Art & Culture", "Environment & Ecology",
  "Science & Technology", "Ethics (GS4)", "Tamil Literature", "Current Affairs", "Essay", "CSAT"
];
// Standard UPSC Mains GS-paper mapping, used only as a fallback (see
// defaultGsPaperForSubject) — Tamil Literature, Current Affairs, and CSAT
// are deliberately left unmapped, since none of them corresponds to a
// single GS paper.
const SUBJECT_TO_GS_PAPER = {
  "Polity": "GS2", "Economy": "GS3", "Geography": "GS1", "History": "GS1",
  "Art & Culture": "GS1", "Environment & Ecology": "GS3", "Science & Technology": "GS3",
  "Ethics (GS4)": "GS4", "Essay": "Essay",
};
// Guesses the right GS Paper for a Syllabus row auto-created from Classes/
// NCERT/Standard Books/Current Affairs' "+ Add new" flows, so it doesn't
// start out blank. Prefers whatever GS Paper the user has already been
// using for this subject elsewhere in Syllabus (most-common value wins) —
// this respects the user's own convention and works even for custom
// subjects the hardcoded map below doesn't know about — and only falls
// back to the standard mapping when there's no existing data for the
// subject yet.
function defaultGsPaperForSubject(db, subject) {
  const counts = {};
  db.syllabus.forEach(s => {
    if (s.subject === subject && s.gsPaper) counts[s.gsPaper] = (counts[s.gsPaper] || 0) + 1;
  });
  const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (mostCommon) return mostCommon[0];
  return SUBJECT_TO_GS_PAPER[subject] || "";
}

// Core study slots + their paired breaks. "removable" + "priority" govern the
// auto-trim cascade when the day doesn't have enough hours (see applyTrimRules).
// Lower priority number = removed first. Office/Class Lecture/GS Reading are
// never auto-removed — they're real-world fixed commitments.
const CORE_SLOT_TEMPLATE = [
  { id: "s1", label: "Previous Day's Class Notes & References", type: "study", link: "prevClass", duration: 60, removable: true },
  { id: "b1", label: "Break", type: "break", duration: 15, pairFor: "s1" },
  { id: "s2", label: "Class Lecture", type: "study", link: "classLecture", duration: 150, removable: false },
  { id: "b2", label: "Break", type: "break", duration: 15, pairFor: "s2" },
  { id: "s3", label: "Tamil Literature Reading", type: "study", link: "tamilReading", duration: 60, removable: true },
  { id: "b3", label: "Break", type: "break", duration: 15, pairFor: "s3" },
  { id: "s4", label: "Current Affairs Reading", type: "study", link: "currentAffairs", duration: 60, removable: true },
  { id: "b4", label: "Break", type: "break", duration: 15, pairFor: "s4" },
  { id: "s5", label: "Tamil Literature Answer Writing", type: "study", link: "tamilWriting", duration: 60, removable: true },
  { id: "b5", label: "Break", type: "break", duration: 15, pairFor: "s5" },
  { id: "s6", label: "GS Notes & Reference Reading", type: "study", link: "gsReading", duration: 60, removable: false },
  { id: "b6", label: "Break", type: "break", duration: 15, pairFor: "s6" },
  { id: "s7", label: "GS Answer Writing", type: "study", link: "gsWriting", duration: 60, removable: true },
];
const AI_BLOCK = { id: "ai", label: "AI Learning", type: "ai", link: "aiLearning", duration: 60, removable: true };

// Rule (a) shrinks every break to 5 min first. Rules (b)-(g) then drop whole
// slots in this exact order, stopping as soon as the day fits.
const REMOVAL_ORDER = ["ai", "s4", "s1", "s7", "s5", "s3"];
const BREAK_PAIR = { s1: "b1", s3: "b3", s4: "b4", s5: "b5" };
const DAY_TYPES = ["WFH", "WFO", "Weekend"];

// Default Day Type per weekday, mirroring the real weekly WFH/WFO/Weekend
// schedule — index 0 = Sunday..6 = Saturday to match Date#getDay() directly.
// Sun=Weekend, Mon/Tue/Wed=WFO, Thu/Fri=WFH, Sat=Weekend. Edit this array
// directly if the weekly schedule ever changes; every call site reads it
// live via defaultDayType(), nothing else needs to change.
const DEFAULT_DAY_TYPE_BY_WEEKDAY = ["Weekend", "WFO", "WFO", "WFO", "WFH", "WFH", "Weekend"];

function defaultDayType(dateISO) {
  const [y, m, d] = dateISO.split("-").map(Number);
  return DEFAULT_DAY_TYPE_BY_WEEKDAY[new Date(y, m - 1, d).getDay()];
}

// Builds the full candidate block list for a given day type, before any trimming.
function buildBaseBlocks(dayType, settings) {
  const byId = Object.fromEntries((settings.slotTemplate || CORE_SLOT_TEMPLATE).map(b => [b.id, b]));
  const slotsEnabled = settings.slotsEnabled || {};
  const isSlotEnabled = id => slotsEnabled[id] !== false;
  let blocks = CORE_SLOT_TEMPLATE
    .filter(b => (b.type === "break" ? isSlotEnabled(b.pairFor) : isSlotEnabled(b.id)))
    .map(b => ({ ...b, duration: (byId[b.id] || b).duration }));
  if (dayType === "WFO") {
    const travel = Math.round((settings.travelHoursEachWay ?? 1) * 60);
    const office = Math.round((settings.officeHoursFixed ?? 6) * 60);
    blocks.push({ id: "travelTo", label: "Office Commute (To)", type: "travel", link: "office", duration: travel, removable: false });
    blocks.push({ id: "office", label: "Office Work", type: "office", link: "office", duration: office, removable: false });
    blocks.push({ id: "travelFro", label: "Office Commute (Fro)", type: "travel", link: "office", duration: travel, removable: false });
  } else if (dayType === "WFH") {
    const office = Math.round((settings.officeHoursFixed ?? 6) * 60);
    blocks.push({ id: "office", label: "Office Work", type: "office", link: "office", duration: office, removable: false });
  }
  if (isSlotEnabled("ai")) {
    const aiDefault = byId.ai || AI_BLOCK;
    blocks.push({ ...AI_BLOCK, duration: aiDefault.duration });
  }
  return blocks;
}

// Applies rules (a)-(g) in three phases, stopping as soon as the plan fits:
//   1. Shrink breaks to 10 min (the break right after Class Lecture stays 15 always)
//   2. Drop whole optional slots, one at a time, in priority order
//   3. Last resort: shrink the remaining breaks further, to 5 min
// Returns the surviving blocks plus a plain-language summary of what changed.
function applyTrimRules(blocks, availableMinutes) {
  let working = blocks.map(b => ({ ...b }));
  const totalNeeded = () => working.reduce((sum, b) => sum + b.duration, 0);
  let breakNote = null;
  const droppedLabels = [];
  const shrinkBreaksTo = (mins) => {
    working = working.map(b => (b.type === "break" && b.id !== "b2" && b.duration > mins) ? { ...b, duration: mins } : b);
  };

  if (totalNeeded() <= availableMinutes) return { blocks: working, breakNote, droppedLabels };

  shrinkBreaksTo(10);
  breakNote = "Shortened breaks to 10 minutes";
  if (totalNeeded() <= availableMinutes) return { blocks: working, breakNote, droppedLabels };

  for (const id of REMOVAL_ORDER) {
    const idx = working.findIndex(b => b.id === id);
    if (idx === -1) continue;
    droppedLabels.push(working[idx].label);
    const pairId = BREAK_PAIR[id];
    working = working.filter(b => b.id !== id && b.id !== pairId);
    if (totalNeeded() <= availableMinutes) return { blocks: working, breakNote, droppedLabels };
  }

  shrinkBreaksTo(5);
  breakNote = "Shortened breaks to 5 minutes";
  return { blocks: working, breakNote, droppedLabels };
}


// Detailed subtopics intentionally left for the user to add / import from the real syllabus PDF.
// "gsPaper" captures the exam structure; "subject" is left blank
// (except where obvious, e.g. the optional) so it can be assigned from the
// real subject list on this Settings-managed list — that's what Class
// Lecture's subject-wise dropdowns key off.
const SYLLABUS_SEED = [
  { gsPaper: "GS Paper I", subject: "", topic: "Current Events of National & International Importance" },
  { gsPaper: "GS Paper I", subject: "History", topic: "History of India & Indian National Movement" },
  { gsPaper: "GS Paper I", subject: "Geography", topic: "Indian & World Geography" },
  { gsPaper: "GS Paper I", subject: "Polity", topic: "Indian Polity & Governance" },
  { gsPaper: "GS Paper I", subject: "Economy", topic: "Economic & Social Development" },
  { gsPaper: "GS Paper I", subject: "Environment & Ecology", topic: "Environment, Ecology, Biodiversity & Climate Change" },
  { gsPaper: "GS Paper I", subject: "Science & Technology", topic: "General Science" },
  { gsPaper: "CSAT", subject: "CSAT", topic: "Comprehension" },
  { gsPaper: "CSAT", subject: "CSAT", topic: "Logical Reasoning & Analytical Ability" },
  { gsPaper: "CSAT", subject: "CSAT", topic: "Decision Making & Problem Solving" },
  { gsPaper: "CSAT", subject: "CSAT", topic: "General Mental Ability / Basic Numeracy / Data Interpretation" },
  { gsPaper: "Essay", subject: "Essay", topic: "Essay Paper" },
  { gsPaper: "GS Paper I", subject: "Art & Culture", topic: "Indian Heritage & Culture" },
  { gsPaper: "GS Paper I", subject: "History", topic: "Indian & World History" },
  { gsPaper: "GS Paper I", subject: "Geography", topic: "Geography of the World & Society" },
  { gsPaper: "GS Paper II", subject: "Polity", topic: "Governance, Constitution, Polity" },
  { gsPaper: "GS Paper II", subject: "Polity", topic: "Social Justice" },
  { gsPaper: "GS Paper II", subject: "Polity", topic: "International Relations" },
  { gsPaper: "GS Paper III", subject: "Science & Technology", topic: "Technology, Economic Development" },
  { gsPaper: "GS Paper III", subject: "Environment & Ecology", topic: "Biodiversity & Environment" },
  { gsPaper: "GS Paper III", subject: "", topic: "Security & Disaster Management" },
  { gsPaper: "GS Paper IV", subject: "Ethics (GS4)", topic: "Ethics, Integrity & Aptitude" },
  { gsPaper: "Optional Paper I", subject: "Tamil Literature", topic: "Tamil Literature — add sections after syllabus import" },
  { gsPaper: "Optional Paper II", subject: "Tamil Literature", topic: "Tamil Literature — add sections after syllabus import" },
  { gsPaper: "Personality Test", subject: "", topic: "Personality Test" },
];

const STORAGE_KEYS = [
  "settings", "syllabus", "classes", "reading", "singlePager", "ncert", "standardBooks",
  "tamilReading", "tamilWriting", "currentAffairs", "answerWriting", "topperCopies", "aiLearning",
  "dailyPlans", "dailyReviews", "weeklyReviews"
];

function defaultDB() {
  return {
    settings: {
      wakeTimeDefault: "05:30",
      sleepTime: "23:00",
      officeHoursFixed: 6,
      travelHoursEachWay: 1,
      subjects: DEFAULT_SUBJECTS,
      totalClassesBySubject: {}, // { [subject]: totalClasses } — optional, set on Settings to unlock the Dashboard's per-subject completion %
      slotsEnabled: {}, // { [slotId]: false } — sections turned off entirely skip the daily plan; unset/true means included
      slotTemplate: [...CORE_SLOT_TEMPLATE, AI_BLOCK],
      driveFolderId: null, // cached id of the Google Drive folder used for Single Pager PDFs
    },
    syllabus: SYLLABUS_SEED.map(s => ({ id: uid(), ...s, subtopic: "", microtopic: "", history: [] })),
    classes: [], reading: [], singlePager: [], ncert: [], standardBooks: [],
    tamilReading: [], tamilWriting: [], currentAffairs: [], answerWriting: [], topperCopies: [], aiLearning: [],
    dailyPlans: {}, dailyReviews: {}, weeklyReviews: {},
  };
}

/* ============================================================
   UTILITIES
   ============================================================ */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function todayISO() { const d = new Date(); return isoFromDate(d); }
function isoFromDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDaysISO(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return isoFromDate(dt);
}
function fmtDateLong(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}
function parseTimeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}
function minutesToTime(mins) {
  let m = Math.round(mins);
  const overflowDays = Math.floor(m / 1440);
  m = ((m % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60), mm = m % 60;
  const hh = String(h).padStart(2, "0"), mmS = String(mm).padStart(2, "0");
  return (overflowDays > 0 ? "+1d " : "") + `${hh}:${mmS}`;
}
function normKey(...parts) { return parts.map(p => String(p || "").trim().toLowerCase()).join("|"); }
// Escapes user-typed text (journal entries, reflections) before it goes into
// an HTML string that gets written to the clipboard — otherwise something
// like "<b>" or "&" typed in a journal entry would corrupt the markup when
// pasted into Gmail (or worse, if the text ever looked like a tag).
function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function slugify(s) { return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "none"; }
// Building topics/subtopics/microtopics fresh by filtering db.syllabus on
// every call was fine at small scale, but each of these is invoked once per
// row in every table that renders a cascading dropdown — with N syllabus
// rows that's O(N) work called up to N times just for one column, i.e.
// O(N²). Past roughly a thousand rows that's slow enough to hang the page.
// This builds all three lookup tables in a single O(N) pass and caches them
// against the exact db.syllabus array reference, so every row in every
// table reuses the same cache during a render and it only rebuilds when
// the syllabus data actually changes (a new array reference).
const _syllabusIndexCache = new WeakMap();
function getSyllabusIndex(db) {
  let idx = _syllabusIndexCache.get(db.syllabus);
  if (idx) return idx;
  const topicsBySubject = new Map();
  const subtopicsByKey = new Map();
  const microtopicsByKey = new Map();
  const rowOptionsByKey = new Map();
  const rowOptionsBySubject = new Map();
  db.syllabus.forEach(s => {
    if (s.topic) {
      if (!topicsBySubject.has(s.subject)) topicsBySubject.set(s.subject, new Set());
      topicsBySubject.get(s.subject).add(s.topic);
    }
    if (s.subtopic) {
      const k1 = s.subject + "\u0000" + s.topic;
      if (!subtopicsByKey.has(k1)) subtopicsByKey.set(k1, new Set());
      subtopicsByKey.get(k1).add(s.subtopic);
    }
    if (s.microtopic) {
      const k2 = s.subject + "\u0000" + s.topic + "\u0000" + s.subtopic;
      if (!microtopicsByKey.has(k2)) microtopicsByKey.set(k2, new Set());
      microtopicsByKey.get(k2).add(s.microtopic);
      if (!rowOptionsByKey.has(k2)) rowOptionsByKey.set(k2, []);
      rowOptionsByKey.get(k2).push({ value: s.id, label: s.microtopic });
      if (!rowOptionsBySubject.has(s.subject)) rowOptionsBySubject.set(s.subject, []);
      rowOptionsBySubject.get(s.subject).push({ value: s.id, label: s.microtopic });
    }
  });
  idx = { topicsBySubject, subtopicsByKey, microtopicsByKey, rowOptionsByKey, rowOptionsBySubject };
  _syllabusIndexCache.set(db.syllabus, idx);
  return idx;
}
// Every Micro Topic row across an arbitrary set of Subjects — not scoped to
// a single Topic/Subtopic like microtopicOptionsForSubtopic/
// syllabusRowOptionsForSubtopic are. Powers GS Answer Writing's Micro Topic
// tag picker, which links straight from Subject to Micro Topic and skips
// Syllabus's own Topic/Subtopic levels entirely — one answer can draw on
// Micro Topics from several different Topics under one Subject, or across
// several Subjects at once. Cached the same way as every other per-row
// syllabus lookup (see the warning on getSyllabusIndex above) rather than
// filtering db.syllabus directly, since this runs once per rendered row.
function microtopicRowOptionsForSubjects(db, subjects) {
  if (!subjects || subjects.length === 0) return [];
  const idx = getSyllabusIndex(db);
  const seen = new Set();
  const out = [];
  subjects.forEach(subj => {
    (idx.rowOptionsBySubject.get(subj) || []).forEach(o => {
      if (!seen.has(o.value)) { seen.add(o.value); out.push(o); }
    });
  });
  return out;
}
// Narrowest cascade level: micro-topics already used under one specific
// subject/topic/subtopic combination — powers the Micro Topic dropdown on
// the Syllabus tab.
function microtopicOptionsForSubtopic(db, subject, topic, subtopic) {
  const idx = getSyllabusIndex(db);
  const set = idx.microtopicsByKey.get(subject + "\u0000" + topic + "\u0000" + subtopic);
  return set ? Array.from(set) : [];
}
// Same rows as microtopicOptionsForSubtopic, but as { value: syllabusRowId,
// label: microtopicText } pairs — for Classes' Micro Topic tag picker,
// where each tag stores a stable Syllabus row id (see TagMultiSelectCell)
// rather than the microtopic text itself, so a tag survives a later rename.
function syllabusRowOptionsForSubtopic(db, subject, topic, subtopic) {
  const idx = getSyllabusIndex(db);
  return idx.rowOptionsByKey.get(subject + "\u0000" + topic + "\u0000" + subtopic) || [];
}
// Resolves the stable Syllabus row id for a subject/topic/(subtopic)
// combination, so other trackers can store a real foreign key instead of
// relying on subject/topic text matching, which breaks once a syllabus
// topic is renamed. Prefers an exact subtopic match; falls back to the
// first row for the subject+topic pair when no subtopic is given/matched.
// Returns null when no syllabus row exists yet for that combination.
function findSyllabusId(db, { subject, topic, subtopic, microtopic }) {
  const candidates = db.syllabus.filter(s => s.subject === subject && s.topic === topic);
  if (candidates.length === 0) return null;
  if (subtopic && microtopic) {
    const exact = candidates.find(s => s.subtopic === subtopic && s.microtopic === microtopic);
    if (exact) return exact.id;
  }
  if (subtopic) {
    const exact = candidates.find(s => s.subtopic === subtopic);
    if (exact) return exact.id;
  }
  return candidates[0].id;
}
// Counts records elsewhere that reference this Syllabus row (by id, or by
// text for records saved before syllabusId existed) — used to warn before
// deleting a row that other trackers still point to, since those records
// would otherwise silently go stale with no indication why. Only runs on
// an explicit delete click, not during render, so it doesn't need the
// caching above.
function countSyllabusRowReferences(db, row) {
  const taggedRefs = (arr) => arr.filter(r => r.syllabusId === row.id || (r.microtopics || []).includes(row.id)).length;
  let count = 0;
  count += taggedRefs(db.classes);
  count += db.reading.filter(r => r.syllabusId === row.id).length;
  count += taggedRefs(db.ncert);
  count += taggedRefs(db.standardBooks);
  count += taggedRefs(db.singlePager);
  count += db.currentAffairs.filter(c => c.syllabusId === row.id).length;
  count += db.answerWriting.filter(a => (a.microtopics || []).includes(row.id)).length;
  count += db.topperCopies.filter(a => (a.microtopics || []).includes(row.id)).length;
  return count;
}
// Corrects a Subject/Topic/Subtopic/Micro Topic value everywhere it
// appears, not just on the one Syllabus row being edited — this is what
// "Rename" (the pencil icon in CascadingSelectCell) calls. Without this,
// fixing a typo on one row would leave every other row and every other
// tracker's own copy of that text still showing the old (wrong) value,
// since those are all separately stored strings, not references to a
// single normalized entity.
// `context` carries whatever parent values are needed to scope the
// rename correctly: {} for subject, {subject} for topic, {subject, topic}
// for subtopic, {subject, topic, subtopic} for microtopic.
// Deliberately does not touch GS Answer Writing — it has no subject field
// of its own (only gsPaper + topic), so there's no reliable way to tell
// whether one of its rows' topic belongs to the subject being renamed
// without risking a false match against an unrelated subject that happens
// to share a topic name.
function renameSyllabusValue(db, updateSlice, level, context, oldValue, newValue) {
  if (!newValue || newValue === oldValue) return;
  const { subject, topic, subtopic } = context;

  if (level === "subject") {
    updateSlice("settings", s => (s.subjects.includes(oldValue) ? { ...s, subjects: s.subjects.map(x => x === oldValue ? newValue : x) } : s));
    ["syllabus", "classes", "reading", "singlePager", "ncert", "standardBooks", "currentAffairs"].forEach(key => {
      updateSlice(key, prev => prev.map(r => r.subject === oldValue ? { ...r, subject: newValue } : r));
    });
    // Answer Writing's Subject is a tag array (one answer can span several
    // Subjects), not a single field like every other tracker above.
    updateSlice("answerWriting", prev => prev.map(r => (r.subjects || []).includes(oldValue)
      ? { ...r, subjects: r.subjects.map(s => s === oldValue ? newValue : s) }
      : r));
    return;
  }
  if (level === "topic") {
    const matches = r => r.subject === subject && r.topic === oldValue;
    ["syllabus", "reading"].forEach(key => {
      updateSlice(key, prev => prev.map(r => matches(r) ? { ...r, topic: newValue } : r));
    });
    updateSlice("currentAffairs", prev => prev.map(r => (r.subject === subject && r.relevantSyllabusTopic === oldValue) ? { ...r, relevantSyllabusTopic: newValue } : r));
    if (subject === "Tamil Literature") {
      updateSlice("tamilReading", prev => prev.map(r => r.topic === oldValue ? { ...r, topic: newValue } : r));
      updateSlice("tamilWriting", prev => prev.map(r => r.topic === oldValue ? { ...r, topic: newValue } : r));
    }
    return;
  }
  if (level === "subtopic") {
    const matches = r => r.subject === subject && r.topic === topic && r.subtopic === oldValue;
    ["syllabus", "reading"].forEach(key => {
      updateSlice(key, prev => prev.map(r => matches(r) ? { ...r, subtopic: newValue } : r));
    });
    updateSlice("currentAffairs", prev => prev.map(r =>
      (r.subject === subject && r.relevantSyllabusTopic === topic && r.subtopic === oldValue) ? { ...r, subtopic: newValue } : r));
    return;
  }
  if (level === "microtopic") {
    const matches = r => r.subject === subject && r.topic === topic && r.subtopic === subtopic && r.microtopic === oldValue;
    ["syllabus", "reading"].forEach(key => {
      updateSlice(key, prev => prev.map(r => matches(r) ? { ...r, microtopic: newValue } : r));
    });
    updateSlice("currentAffairs", prev => prev.map(r =>
      (r.subject === subject && r.relevantSyllabusTopic === topic && r.subtopic === subtopic && r.microtopic === oldValue) ? { ...r, microtopic: newValue } : r));
    // Classes/NCERT/Standard Books/Single Pager's microtopics tags store a
    // Syllabus row id for anything tagged after id-based linking existed —
    // those resolve their displayed label from the Syllabus row itself,
    // which the update above already renamed, so nothing more to do there.
    // Only a legacy tag whose stored value IS the old text (predating
    // id-based tags) needs updating here — NCERT/Standard Books/Single
    // Pager never had free-text tags (they only gained microtopics once
    // id-based), so this is really only ever relevant for Classes, but
    // it's harmless to check all four uniformly.
    ["classes", "ncert", "standardBooks", "singlePager"].forEach(key => {
      updateSlice(key, prev => prev.map(r => {
        if (!(r.microtopics || []).includes(oldValue)) return r;
        return { ...r, microtopics: r.microtopics.map(m => m === oldValue ? newValue : m) };
      }));
    });
    return;
  }
}
// After a Syllabus row's own Subject/Topic/Subtopic/Micro Topic changes —
// via the plain per-row reassignment dropdowns, or a direct Micro Topic
// text edit — keeps every OTHER tracker record that links to this SPECIFIC
// row showing the same current classification, instead of silently going
// stale. Matches on syllabusId when present; for older records that predate
// the syllabusId FK (still null/undefined), falls back to a one-time exact
// match against the row's PREVIOUS subject/topic/subtopic/microtopic
// (oldRow) — and backfills their syllabusId while it's at it, so they're
// id-linked from here on. Never matches by text alone once a syllabusId
// exists, so moving or correcting one Micro Topic can't spill onto a
// different, unrelated row that happens to share the old Subtopic text —
// that broader, text-matched propagation is what renameSyllabusValue is for
// (used by "Rename a term" and by editing an existing Micro Topic's text).
// Only Reading's own lazily-created revision records are synced this way
// now — Classes, NCERT, Standard Books, and Single Pager all tag Micro
// Topics via a `microtopics` array instead of a scalar Subject/Topic/
// Subtopic copy (their own Subject field is the user's classification of
// the whole row, not tied 1:1 to one Micro Topic, so it shouldn't silently
// move because a tagged Micro Topic did); their tags resolve their label
// straight from the live Syllabus row instead (see TagMultiSelectCell's
// resolveLabel usage), which stays correct without needing this sync at
// all. Current Affairs still has its own real Subject/Topic/Subtopic/
// Micro Topic fields (unchanged, not part of this conversation's tag
// rework), so it's still synced here.
function syncSyllabusRowReferences(db, updateSlice, oldRow, newRow) {
  const patch = { subject: newRow.subject, topic: newRow.topic, subtopic: newRow.subtopic, microtopic: newRow.microtopic, syllabusId: newRow.id };
  const isLegacyMatch = r => !r.syllabusId && r.subject === oldRow.subject && r.topic === oldRow.topic && r.subtopic === oldRow.subtopic && r.microtopic === oldRow.microtopic;
  updateSlice("reading", prev => prev.map(r => (r.syllabusId === newRow.id || isLegacyMatch(r) ? { ...r, ...patch } : r)));
  updateSlice("currentAffairs", prev => prev.map(r => {
    const legacyMatch = !r.syllabusId && r.subject === oldRow.subject && r.relevantSyllabusTopic === oldRow.topic && r.subtopic === oldRow.subtopic && r.microtopic === oldRow.microtopic;
    return (r.syllabusId === newRow.id || legacyMatch)
      ? { ...r, subject: newRow.subject, relevantSyllabusTopic: newRow.topic, subtopic: newRow.subtopic, microtopic: newRow.microtopic, syllabusId: newRow.id }
      : r;
  }));
}
// Strict topic/subtopic lists scoped to what's actually on the Syllabus tab
// — the only place (besides Current Affairs, which routes new entries into
// Syllabus too) new topics/subtopics/micro topics may be created. Every
// other tracker's topic dropdown reads from these, so nothing but Syllabus
// data ever appears as a selectable option going forward.
function syllabusTopicsForSubject(db, subject) {
  const set = getSyllabusIndex(db).topicsBySubject.get(subject);
  return set ? Array.from(set) : [];
}
function syllabusSubtopicsForTopic(db, subject, topic) {
  const set = getSyllabusIndex(db).subtopicsByKey.get(subject + "\u0000" + topic);
  return set ? Array.from(set) : [];
}
// Read-only, auto-computed "have I identified a source for this micro
// topic" check (Syllabus tab's Source Identified column, and the
// Dashboard's source-mapping %) — never stored or user-editable.
// Takes the full Syllabus row (not just its text fields) so it can match
// on the stable syllabusId every linking tracker now carries, falling back
// to text matching only for older records saved before that id existed.
// Yes if this row shows up in Classes (one of its micro-topic tags), NCERT,
// or Standard Books; No otherwise. No micro topic on the row at all means
// there's nothing to check yet, so callers should treat that as its own
// "—" state.
// Like getSyllabusIndex above, this scans Classes/NCERT/Standard Books once
// per db reference and caches the result, rather than re-scanning all three
// for every Syllabus row — same O(N²)-to-O(N) fix, same reason it matters.
const _sourceIdentifiedCache = new WeakMap();
function getSourceIdentifiedIndex(db) {
  let idx = _sourceIdentifiedCache.get(db);
  if (idx) return idx;
  const idSet = new Set();
  const textKeySet = new Set();
  db.classes.forEach(c => {
    (c.microtopics || []).forEach(m => {
      idSet.add(m); // harmless if m is legacy text rather than an id — it just won't match any real syllabus id
      textKeySet.add(normKey(c.subject, c.topic, c.subtopic, m));
    });
  });
  db.ncert.forEach(n => {
    if (n.syllabusId) idSet.add(n.syllabusId);
    (n.microtopics || []).forEach(m => idSet.add(m));
    if (n.microtopic) textKeySet.add(normKey(n.subject, n.topic, n.subtopic, n.microtopic));
  });
  db.standardBooks.forEach(s => {
    if (s.syllabusId) idSet.add(s.syllabusId);
    (s.microtopics || []).forEach(m => idSet.add(m));
    if (s.microtopic) textKeySet.add(normKey(s.subject, s.topic, s.subtopic, s.microtopic));
  });
  idx = { idSet, textKeySet };
  _sourceIdentifiedCache.set(db, idx);
  return idx;
}
function isSourceIdentifiedForMicrotopic(db, syllabusRow) {
  const { id, subject, topic, subtopic, microtopic } = syllabusRow;
  if (!microtopic) return false;
  const idx = getSourceIdentifiedIndex(db);
  return idx.idSet.has(id) || idx.textKeySet.has(normKey(subject, topic, subtopic, microtopic));
}
function weekStartISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay(); // 0 Sun
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  dt.setDate(dt.getDate() + diff);
  return isoFromDate(dt);
}
function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ============================================================
   GOOGLE DRIVE INTEGRATION (Single Pager PDF attachments)
   The PDF itself is never sent to or stored in Supabase — only the Drive
   file's id and name are kept in the `singlePager` record, and the bytes
   are fetched from Drive again each time you click Download. Requires
   VITE_GOOGLE_CLIENT_ID (a public OAuth Web Client ID, not a secret) from
   a Google Cloud project with the Drive API enabled — see README.
   ============================================================ */
const DRIVE_FOLDER_NAMES = {
  singlePager: "UPSC 2027 Command Center - Single Pagers",
  answerWriting: "UPSC 2027 Command Center - GS Answer Writing",
  topperCopies: "UPSC 2027 Command Center - Topper Copies",
  tamilWriting: "UPSC 2027 Command Center - Tamil Literature Writing",
  tamilReading: "UPSC 2027 Command Center - Tamil Literature Reading",
  classes: "UPSC 2027 Command Center - Class Notes",
  currentAffairs: "UPSC 2027 Command Center - Current Affairs",
};
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

let gisLoadPromise = null;
let gisTokenClient = null;
let cachedDriveToken = null; // { token, expiresAt }

function loadGoogleIdentityScript() {
  if (gisLoadPromise) return gisLoadPromise;
  gisLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google Identity Services — check your connection."));
    document.head.appendChild(script);
  });
  return gisLoadPromise;
}

// Requests a short-lived Drive access token, reusing a cached one while it's
// still valid. First use in a browser session opens Google's consent popup
// (scoped to drive.file — only files this app itself creates); later calls
// in the same session are silent until the token expires (~1 hour).
async function getDriveAccessToken() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Google Drive isn't configured yet — add VITE_GOOGLE_CLIENT_ID to your .env (see README).");
  if (cachedDriveToken && cachedDriveToken.expiresAt > Date.now() + 30000) return cachedDriveToken.token;
  await loadGoogleIdentityScript();
  if (!gisTokenClient) {
    gisTokenClient = window.google.accounts.oauth2.initTokenClient({ client_id: clientId, scope: DRIVE_SCOPE, callback: () => {} });
  }
  function requestToken(prompt) {
    return new Promise((resolve, reject) => {
      gisTokenClient.callback = (resp) => {
        if (resp.error) { reject(new Error(resp.error_description || resp.error)); return; }
        cachedDriveToken = { token: resp.access_token, expiresAt: Date.now() + (resp.expires_in || 3600) * 1000 };
        resolve(resp.access_token);
      };
      gisTokenClient.requestAccessToken({ prompt });
    });
  }
  // Try silently first (works once you've granted access in any earlier
  // session — Google remembers the grant). If nothing was ever granted,
  // fall back to the interactive consent popup.
  try {
    return await requestToken("");
  } catch {
    return requestToken("consent");
  }
}

async function driveFetch(url, accessToken, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google Drive request failed (${res.status}). ${body.slice(0, 200)}`);
  }
  return res;
}

// Finds (or creates once, then remembers in settings) a single dedicated
// Drive folder per tracker, to keep each kind of PDF together rather than
// scattering everything across the user's whole Drive. `folderKey` is one
// of DRIVE_FOLDER_NAMES' keys. Falls back to the legacy singular
// settings.driveFolderId for "singlePager" so existing users' folder isn't
// duplicated by this change.
async function ensureDriveFolder(accessToken, db, updateSlice, folderKey) {
  const folderName = DRIVE_FOLDER_NAMES[folderKey];
  const existingId = (db.settings.driveFolders && db.settings.driveFolders[folderKey])
    || (folderKey === "singlePager" ? db.settings.driveFolderId : null);
  if (existingId) return existingId;
  const q = encodeURIComponent(`name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const searchRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, accessToken);
  const searchData = await searchRes.json();
  let folderId = searchData.files && searchData.files[0] && searchData.files[0].id;
  if (!folderId) {
    const createRes = await driveFetch("https://www.googleapis.com/drive/v3/files?fields=id", accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName, mimeType: "application/vnd.google-apps.folder" }),
    });
    folderId = (await createRes.json()).id;
  }
  updateSlice("settings", prev => ({ ...prev, driveFolders: { ...(prev.driveFolders || {}), [folderKey]: folderId } }));
  return folderId;
}

function buildDriveMultipartBody(metadata, file, boundary) {
  const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeader = `--${boundary}\r\nContent-Type: ${file.type || "application/pdf"}\r\n\r\n`;
  return new Blob([metaPart, fileHeader, file, `\r\n--${boundary}--`]);
}

// Uploads a new PDF, or (when existingFileId is passed) overwrites the same
// Drive file in place so re-uploading a corrected document doesn't leave
// orphaned old copies behind. `desiredName`, when provided, is used as the
// Drive file's name instead of the raw uploaded file's own name — see
// nextFileNamePrefix / DriveFileCell for how callers build a standardized
// name on first upload only (a replace always omits this, keeping
// whatever name Drive already has).
async function uploadDriveFile(db, updateSlice, folderKey, existingFileId, file, desiredName) {
  if (file.type && file.type !== "application/pdf") throw new Error("Please choose a PDF file.");
  const accessToken = await getDriveAccessToken();
  const folderId = await ensureDriveFolder(accessToken, db, updateSlice, folderKey);
  const boundary = "uccdrive" + uid();
  const finalName = desiredName || file.name;
  const metadata = existingFileId ? { name: finalName } : { name: finalName, parents: [folderId] };
  const body = buildDriveMultipartBody(metadata, file, boundary);
  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,name`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name`;
  const res = await driveFetch(url, accessToken, {
    method: existingFileId ? "PATCH" : "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  const data = await res.json();
  return { id: data.id, name: data.name };
}

async function downloadDriveFile(fileId, fileName) {
  const accessToken = await getDriveAccessToken();
  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, accessToken);
  const blob = await res.blob();
  downloadBlob(blob, fileName || "document.pdf", "application/pdf");
}

function normalizeSettings(s) {
  const defaults = defaultDB().settings;
  if (!s) return defaults;
  const merged = { ...defaults, ...s };
  if (merged.officeHoursFixed == null) merged.officeHoursFixed = s.officeDurationDefault ?? defaults.officeHoursFixed;
  if (merged.travelHoursEachWay == null) merged.travelHoursEachWay = defaults.travelHoursEachWay;
  if (!Array.isArray(merged.slotTemplate) || !merged.slotTemplate.some(b => b.id === "s1")) merged.slotTemplate = defaults.slotTemplate;
  return merged;
}

/* ============================================================
   PERSISTENCE HOOK (Supabase-backed, scoped to the signed-in user)
   ============================================================ */
function useDB(userId) {
  const [db, setDb] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    (async () => {
      const defaults = defaultDB();
      const out = {};
      try {
        const { data, error } = await supabase.from("kv_store").select("key,value").eq("user_id", userId);
        if (error) throw error;
        const map = {};
        (data || []).forEach(row => { map[row.key] = row.value; });
        STORAGE_KEYS.forEach(k => { out[k] = map[k] !== undefined ? map[k] : defaults[k]; });
        out.settings = normalizeSettings(out.settings);
      } catch (e) {
        STORAGE_KEYS.forEach(k => { out[k] = defaults[k]; });
        if (!cancelled) setSaveError(`Could not load your data — ${e.message || e}`);
      }
      if (!cancelled) { setDb(out); setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const updateSlice = useCallback((key, updater) => {
    setDb(prev => {
      if (!prev) return prev;
      const nextVal = typeof updater === "function" ? updater(prev[key]) : updater;
      const next = { ...prev, [key]: nextVal };
      supabase.from("kv_store")
        .upsert({ user_id: userId, key, value: nextVal, updated_at: new Date().toISOString() }, { onConflict: "user_id,key" })
        .then(({ error }) => { if (error) setSaveError(`Could not save "${key}" — ${error.message}`); });
      return next;
    });
  }, [userId]);

  return { db, loaded, updateSlice, saveError, setSaveError };
}

/* ============================================================
   SMALL UI ATOMS
   ============================================================ */
function Badge({ children, tone = "neutral" }) {
  return <span className={`ucc-badge ${tone}`}>{children}</span>;
}

function StatusSelect({ value, options, onChange }) {
  return (
    <select className={`ucc-status ${colorFor(value)}`} value={value || options[0]} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}


function EmptyState({ children }) {
  return <div className="ucc-empty">{children}</div>;
}

// Self-contained real-time clock — keeps its own 1-second interval and
// cleans it up on unmount, so only this small component re-renders each
// tick rather than the whole app. Same 24-hour HH:MM:SS style used
// everywhere else time appears in the app (Wake time input, minutesToTime).
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return (
    <span className="ucc-flex" style={{ gap: 4 }}>
      <Clock size={12} />
      <span className="ucc-mono">{hh}:{mm}:{ss}</span>
    </span>
  );
}

// Small dependency-free pie chart (CSS conic-gradient, no charting library)
// for the Dashboard. `segments`: [{ label, value, color }].
function PieChart({ segments, size = 140 }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let cursor = 0;
  const stops = segments.map(seg => {
    const startPct = total ? (cursor / total) * 100 : 0;
    cursor += seg.value;
    const endPct = total ? (cursor / total) * 100 : 0;
    return `${seg.color} ${startPct}% ${endPct}%`;
  }).join(", ");
  return (
    <div className="ucc-flex" style={{ gap: 18, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: total ? `conic-gradient(${stops})` : "var(--grey-soft)",
      }} title={total ? undefined : "No data yet"} />
      <div>
        {segments.map(seg => (
          <div key={seg.label} className="ucc-flex" style={{ gap: 6, marginBottom: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, display: "inline-block", flexShrink: 0 }} />
            <span className="ucc-tiny">{seg.label}: {seg.value}{total ? ` (${Math.round((seg.value / total) * 100)}%)` : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconBtn({ icon: Icon, onClick, title, danger, disabled }) {
  return (
    <button className={`ucc-btn ghost`} onClick={onClick} title={title} aria-label={title} disabled={disabled}
      style={{ padding: "5px 7px", color: danger ? "var(--red)" : undefined, opacity: disabled ? 0.4 : 1 }}>
      <Icon size={14} />
    </button>
  );
}

/* ============================================================
   GENERIC TRACKER TABLE
   ============================================================ */
function GenericTracker({ records, setRecords, columns, newRecord, emptyMessage, dense, datalists, confirmRemove, completionRequiresUpload }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [reorderMode, setReorderMode] = useState(false);
  const PAGE_SIZE = 100;

  // Swaps a record with its immediate neighbor in the underlying (unfiltered,
  // unpaged) records array — always resolved by id inside the updater, so
  // this stays correct regardless of what's currently visible. The "up"/
  // "down" buttons that call this are only shown once filters are cleared
  // (see reorderMode below), so a visible neighbor is always the true
  // array neighbor too.
  function moveRecord(id, direction) {
    setRecords(prev => {
      const idx = prev.findIndex(r => r.id === id);
      if (idx === -1) return prev;
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = prev.slice();
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  // completionRequiresUpload (opt-in — only Classes, Single Pager, Tamil
  // Writing, GS Answer Writing use this, the trackers that have both a
  // Status column and a driveFile PDF column): a row can't be marked
  // Completed until its driveFile is set, and once it IS Completed, every
  // other field on that row locks (pointer-events disabled, dimmed) until
  // the status is changed away from Completed again — that's the
  // deliberate escape hatch for fixing a mistake, not an oversight.
  function updateField(rec, col, val, isStatus) {
    if (completionRequiresUpload && col.type === "status" && val === "Completed" && !rec.driveFile) {
      const driveFileCol = columns.find(c => c.key === "driveFile");
      window.alert(`Upload the ${driveFileCol ? driveFileCol.label : "file"} for this row before marking it Completed.`);
      return;
    }
    // Backstop behind the visual pointer-events lock: once a row is
    // Completed, only its own status field may still change (the
    // deliberate escape hatch for undoing a mistake) — every other field
    // is refused here too, not just visually disabled.
    if (completionRequiresUpload && rec.status === "Completed" && col.type !== "status") return;
    // "Partially Completed" locks every field except Status, Date, and
    // uploading/replacing the row's file — unlike the Completed lock above,
    // this one stays clickable and explains itself with a popup rather than
    // silently no-op'ing, since there's no separate visual dimming to rely
    // on for the explanation. driveFile is excluded because DriveFileCell
    // already uploads to Drive before calling this — refusing here would
    // leave an orphaned upload with no local record of it.
    if (rec.status === "Partially Completed" && col.key !== "status" && col.key !== "date" && col.key !== "driveFile") {
      window.alert('This row is locked because Status is "Partially Completed". Change Status back to "Not Started" or "In Progress" to edit anything other than Date or the uploaded file.');
      return;
    }
    setRecords(prev => prev.map(r => {
      if (r.id !== rec.id) return r;
      const updated = { ...r, [col.key]: val };
      if (isStatus) {
        const from = r[col.key] || "(empty)";
        updated.history = [...(r.history || []), { field: col.label, from, to: val, at: new Date().toISOString() }];
      }
      return updated;
    }));
  }

  // Patches multiple fields on one record at once — used by "custom" columns
  // (e.g. cascading dropdowns) that need to reset sibling fields when a
  // parent selection changes, which a single-field updateField call can't do.
  // Blocked entirely while the row is locked (Completed, completionRequiresUpload) —
  // this is a backstop behind the visual pointer-events lock on the cell,
  // since this always affects non-status fields (the status column itself
  // goes through updateField, not this). Also blocked (with a popup, since
  // there's no visual dimming here to explain it) while Status is
  // "Partially Completed" — custom columns are never Date or Status in this
  // app, so this is safe to block outright without checking col.key.
  function updateFields(rec, patch) {
    if (completionRequiresUpload && rec.status === "Completed") return;
    if (rec.status === "Partially Completed") {
      window.alert('This row is locked because Status is "Partially Completed". Change Status back to "Not Started" or "In Progress" to edit anything other than Date.');
      return;
    }
    setRecords(prev => prev.map(r => (r.id === rec.id ? { ...r, ...patch } : r)));
  }

  function removeRecord(id) {
    const rec = records.find(r => r.id === id);
    const message = (confirmRemove && rec) ? confirmRemove(rec) : "Delete this record? This cannot be undone.";
    if (window.confirm(message)) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  }

  function addRecord() {
    const rec = { id: uid(), history: [], ...newRecord() };
    setRecords(prev => [...prev, rec]);
    setFilters({}); // otherwise the new (mostly blank) row can vanish behind an active filter
    setPage(Math.floor(records.length / PAGE_SIZE)); // new row lands at the end — jump to the page that shows it
  }

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // A column gets a filter control only when its stored value is a plain
  // string/number/boolean on at least one record — array fields (e.g.
  // Classes' microtopics tags) and object fields (e.g. driveFile) are left
  // unfilterable rather than guessed at. Columns with many distinct or long
  // values (free-text fields like Question/Notes) get a substring-search
  // box instead of a dropdown, since a dropdown of 40 unique sentences
  // isn't useful.
  const filterConfig = useMemo(() => {
    const cfg = {};
    columns.forEach(col => {
      const values = new Set();
      let hasComplexValue = false;
      records.forEach(r => {
        const v = r[col.key];
        if (v === null || v === undefined || v === "") return;
        if (Array.isArray(v) || typeof v === "object") { hasComplexValue = true; return; }
        values.add(String(v));
      });
      if (hasComplexValue || values.size === 0) { cfg[col.key] = null; return; }
      const arr = Array.from(values);
      const useText = arr.length > 15 || arr.some(v => v.length > 30);
      cfg[col.key] = { type: useText ? "text" : "select", options: arr.sort() };
    });
    return cfg;
  }, [records, columns]);

  const hasActiveFilters = Object.values(filters).some(v => v);
  const filteredRecords = useMemo(() => {
    if (!hasActiveFilters) return records;
    return records.filter(rec => columns.every(col => {
      const f = filters[col.key];
      if (!f) return true;
      const val = rec[col.key];
      const cfg = filterConfig[col.key];
      if (cfg && cfg.type === "select") return String(val ?? "") === f;
      return String(val ?? "").toLowerCase().includes(f.toLowerCase());
    }));
  }, [records, columns, filters, hasActiveFilters, filterConfig]);

  // Rendering every row unconditionally is fine for a few dozen records, but
  // each row's cascading dropdowns and other custom cells add up — at
  // several hundred+ rows (Syllabus routinely reaches four figures), asking
  // React to mount/reconcile all of them on every edit is what actually
  // hangs the page, independent of how fast the underlying data lookups
  // are. Capping how many rows exist in the DOM at once is what actually
  // fixes that, not just making the per-row lookups cheaper.
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRecords = filteredRecords.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  function setFiltersAndResetPage(updater) {
    setFilters(updater);
    setPage(0);
  }

  return (
    <div style={{ overflowX: "auto" }}>
      {(datalists || []).map(dl => <datalist id={dl.id} key={dl.id}>{dl.options.map(o => <option key={o} value={o} />)}</datalist>)}
      <div className="ucc-flex between" style={{ marginBottom: 6 }}>
        <span className="ucc-tiny">{hasActiveFilters ? `Showing ${filteredRecords.length} of ${records.length}` : `${records.length} row${records.length === 1 ? "" : "s"}`}</span>
        <div className="ucc-flex">
          {hasActiveFilters && (
            <button type="button" className="ucc-btn ghost" style={{ padding: "2px 8px" }} onClick={() => { setFilters({}); setPage(0); }}><X size={11} /> Clear filters</button>
          )}
          <button type="button" className="ucc-btn ghost" style={{ padding: "2px 8px" }} disabled={hasActiveFilters}
            title={hasActiveFilters ? "Clear filters first to reorder rows" : (reorderMode ? "Finish reordering" : "Reorder rows with the up/down arrows")}
            onClick={() => setReorderMode(m => !m)}>
            {reorderMode ? <Check size={11} /> : <><ChevronUp size={11} /><ChevronDown size={11} /></>} {reorderMode ? "Done" : "Reorder"}
          </button>
        </div>
      </div>
      <table className="ucc-table">
        <thead>
          <tr>
            {reorderMode && <th style={{ width: 54 }}></th>}
            {columns.map(c => <th key={c.key} style={{ minWidth: c.width || 100 }}>{c.label}</th>)}
            <th style={{ width: 60 }}>Log</th>
            <th style={{ width: 40 }}></th>
          </tr>
          <tr>
            {reorderMode && <th></th>}
            {columns.map(col => {
              const cfg = filterConfig[col.key];
              return (
                <th key={col.key} style={{ fontWeight: 400, paddingTop: 2, paddingBottom: 4 }}>
                  {cfg && (cfg.type === "select" ? (
                    <select className="ucc-select" style={{ fontSize: 11, padding: "2px 4px", width: "100%" }}
                      value={filters[col.key] || ""} onChange={e => setFiltersAndResetPage(f => ({ ...f, [col.key]: e.target.value }))}>
                      <option value="">All</option>
                      {cfg.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type="text" className="ucc-input" style={{ fontSize: 11, padding: "2px 4px", width: "100%" }}
                      placeholder="Filter…" value={filters[col.key] || ""} onChange={e => setFiltersAndResetPage(f => ({ ...f, [col.key]: e.target.value }))} />
                  ))}
                </th>
              );
            })}
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr><td colSpan={columns.length + 2 + (reorderMode ? 1 : 0)}><EmptyState>{emptyMessage || "No records yet. Add your first one below."}</EmptyState></td></tr>
          )}
          {records.length > 0 && filteredRecords.length === 0 && (
            <tr><td colSpan={columns.length + 2 + (reorderMode ? 1 : 0)}><EmptyState>No rows match the current filters.</EmptyState></td></tr>
          )}
          {pagedRecords.map(rec => {
            const histCount = (rec.history || []).length;
            const locked = completionRequiresUpload && rec.status === "Completed";
            const partiallyLocked = rec.status === "Partially Completed";
            return (
              <React.Fragment key={rec.id}>
                <tr className={locked ? "ucc-row-locked" : undefined}>
                  {reorderMode && (
                    <td>
                      <div className="ucc-flex" style={{ gap: 2 }}>
                        <IconBtn icon={ChevronUp} onClick={() => moveRecord(rec.id, -1)} title="Move up" disabled={rec === pagedRecords[0]} />
                        <IconBtn icon={ChevronDown} onClick={() => moveRecord(rec.id, 1)} title="Move down" disabled={rec === pagedRecords[pagedRecords.length - 1]} />
                      </div>
                    </td>
                  )}
                  {columns.map(col => {
                    const isStatusCol = col.type === "status";
                    const isDateCol = col.key === "date";
                    const isDriveFileCol = col.key === "driveFile";
                    const cell = isStatusCol ? (
                      <div className="ucc-flex" style={{ gap: 4 }}>
                        <StatusSelect value={rec[col.key]} options={col.options} onChange={v => updateField(rec, col, v, true)} />
                        {locked && <Lock size={13} style={{ color: "var(--green)", flexShrink: 0 }} aria-label="Row locked — change Status to edit" />}
                        {partiallyLocked && <Lock size={13} style={{ color: "var(--red)", flexShrink: 0 }} aria-label="Row locked while Partially Completed — change Status to edit anything but Date or the uploaded file" />}
                      </div>
                    ) : col.type === "custom" ? (
                      col.render(rec, (val, isStatus) => updateField(rec, col, val, isStatus), patch => updateFields(rec, patch))
                    ) : col.type === "date" ? (
                      <input type="date" className="ucc-input ucc-mono" value={rec[col.key] || ""} onChange={e => updateField(rec, col, e.target.value)} />
                    ) : col.type === "number" ? (
                      <input type="number" className="ucc-input ucc-mono" value={rec[col.key] ?? ""} onChange={e => updateField(rec, col, e.target.value)} style={{ width: 70 }} />
                    ) : col.type === "textarea" ? (
                      <textarea className="ucc-textarea" value={rec[col.key] || ""} onChange={e => updateField(rec, col, e.target.value)} rows={dense ? 1 : 2} />
                    ) : col.type === "select" ? (
                      <select className="ucc-select" value={rec[col.key] || ""} onChange={e => updateField(rec, col, e.target.value)}>
                        <option value="">—</option>
                        {col.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type="text" list={typeof col.datalist === "function" ? col.datalist(rec) : col.datalist} className="ucc-input" value={rec[col.key] || ""} onChange={e => updateField(rec, col, e.target.value)} placeholder={col.placeholder} />
                    );
                    return (
                      <td key={col.key}>
                        {locked && !isStatusCol && col.readableWhenLocked ? (
                          // Same Completed lock as below, but pointer-events
                          // stay enabled so long text (e.g. Topper Copies'
                          // Question/Observations) can still be scrolled and
                          // read — updateField's own Completed-row guard
                          // already refuses any edit, so this is read-only
                          // in practice without needing a visual disable.
                          // No dimming here (or below) — the row's own
                          // var(--green-soft) background is the "locked/
                          // done" signal now, so the cell content stays at
                          // full contrast/legibility instead of looking
                          // greyed-out/disabled.
                          <div title="Completed rows are locked — change Status to edit again. You can still scroll to read this field.">{cell}</div>
                        ) : locked && !isStatusCol ? (
                          <div style={{ pointerEvents: "none" }} title="Completed rows are locked — change Status to edit again">{cell}</div>
                        ) : partiallyLocked && !isStatusCol && !isDateCol && !isDriveFileCol ? (
                          // Stays clickable (unlike the Completed lock above) —
                          // updateField/updateFields refuse the change and
                          // explain with a popup, since there's no pointer-
                          // events block here to make the lock self-evident.
                          <div style={{ background: "var(--red-soft)", borderRadius: 5 }} title='Locked while Partially Completed — change Status to edit anything but Date or the uploaded file'>{cell}</div>
                        ) : cell}
                      </td>
                    );
                  })}
                  <td>
                    {histCount > 0 ? (
                      <button className="ucc-btn ghost" style={{ padding: "3px 6px" }} onClick={() => toggleExpand(rec.id)} title="View change history">
                        <History size={12} /> {histCount}
                      </button>
                    ) : <span className="ucc-tiny">—</span>}
                  </td>
                  <td><IconBtn icon={Trash2} onClick={() => removeRecord(rec.id)} title="Delete" danger /></td>
                </tr>
                {expanded.has(rec.id) && (
                  <tr className="ucc-histrow">
                    <td colSpan={columns.length + 2 + (reorderMode ? 1 : 0)}>
                      <strong>Change history</strong>
                      <ul style={{ margin: "4px 0 0 0", paddingLeft: 18 }}>
                        {(rec.history || []).slice().reverse().map((h, i) => (
                          <li key={i}>{h.field}: <em>{h.from}</em> → <strong>{h.to}</strong> — {new Date(h.at).toLocaleString()}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      {filteredRecords.length > PAGE_SIZE && (
        <div className="ucc-flex between" style={{ marginTop: 8 }}>
          <span className="ucc-tiny">
            Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length}
          </span>
          <div className="ucc-flex">
            <IconBtn icon={ChevronLeft} onClick={() => setPage(p => Math.max(0, p - 1))} title="Previous page" disabled={safePage === 0} />
            <span className="ucc-tiny">Page {safePage + 1} of {totalPages}</span>
            <IconBtn icon={ChevronRightIcon} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} title="Next page" disabled={safePage === totalPages - 1} />
          </div>
        </div>
      )}
      <button className="ucc-btn" style={{ marginTop: 10 }} onClick={addRecord}><Plus size={14} /> Add row</button>
    </div>
  );
}

const ADD_NEW_VALUE = "__ucc_add_new__";

// One cell in a chained subject → topic → subtopic → microtopic dropdown.
// Shows existing values as options. When `allowAddNew` is true (default)
// it also ends with "+ Add new" (swaps in a small text input, mirroring
// the Class Lecture add-topic flow); when false, the dropdown is strictly
// limited to what's already on the Syllabus tab — used everywhere topics
// must originate from Syllabus (or Current Affairs) only.
// `disabled` enforces the chain — e.g. Topic stays disabled until Subject
// is picked. `onSelect` fires for an existing value, `onAddNew` fires with
// the trimmed typed value when a new one is confirmed.
// `onRename`, when provided, adds a small pencil button (only shown once a
// value is set) that reuses the same text-input UI to correct the CURRENT
// value in place — for fixing a typo or a wrong pick, as opposed to
// picking a different existing value or creating an unrelated new one.
// The caller is responsible for propagating the rename anywhere else that
// value is used (see renameSyllabusValue) — this component only handles
// the input UI.
function CascadingSelectCell({ value, options, placeholder, disabled, onSelect, onAddNew, allowAddNew = true, onRename }) {
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");

  function handleChange(v) {
    if (v === ADD_NEW_VALUE) { setRenaming(false); setAdding(true); setDraft(""); return; }
    onSelect(v);
  }
  function startRename() {
    setDraft(value || "");
    setRenaming(true);
    setAdding(true);
  }
  function confirmAdd() {
    const name = draft.trim();
    setAdding(false); setDraft("");
    if (!name) { setRenaming(false); return; }
    if (renaming) onRename(name); else onAddNew(name);
    setRenaming(false);
  }
  function cancelAdd() { setAdding(false); setDraft(""); setRenaming(false); }

  if (adding) {
    return (
      <div className="ucc-flex">
        <input className="ucc-input" autoFocus placeholder={renaming ? "Rename to…" : "New value"}
          value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") confirmAdd(); if (e.key === "Escape") cancelAdd(); }} />
        <IconBtn icon={Check} onClick={confirmAdd} title={renaming ? "Save rename" : "Add"} />
        <IconBtn icon={X} onClick={cancelAdd} title="Cancel" />
      </div>
    );
  }
  // Keep a legacy/freeform value visible even if it's fallen out of the
  // computed option list, so switching to this component never silently
  // hides already-saved data.
  const allOptions = value && !options.includes(value) ? [value, ...options] : options;
  const noOptionsYet = !disabled && allOptions.length === 0 && !allowAddNew;
  return (
    <div>
      <div className="ucc-flex" style={{ gap: 2 }}>
        <select className="ucc-select" value={value || ""} disabled={disabled} onChange={e => handleChange(e.target.value)}>
          <option value="">{placeholder}</option>
          {allOptions.map(o => <option key={o} value={o}>{o}</option>)}
          {allowAddNew && <option value={ADD_NEW_VALUE}>+ Add new</option>}
        </select>
        {onRename && value && !disabled && (
          <IconBtn icon={Pencil} onClick={startRename} title={`Rename "${value}" everywhere it's used`} />
        )}
      </div>
      {noOptionsYet && <div className="ucc-tiny" style={{ color: "var(--ink-muted)" }}>None yet — add it on the Syllabus tab first.</div>}
    </div>
  );
}

// Multi-select tag picker — e.g. one Class can cover several Micro Topics,
// unlike Subject/Topic/Subtopic which are single-select. `options` is
// [{ value, label }] rather than plain strings so a tag's stored value can
// be a stable Syllabus row id (surviving a later rename) while still
// showing the current micro topic text; a tag written before ids existed
// just has its raw text as `value`, which falls back to being its own
// label since it won't match any option's `value`. A value already picked
// drops out of the dropdown so it can't be added twice. Tags are removed
// with the × on each chip. When `allowAddNew` is set, "+ Add new" swaps in
// a small text input (Enter to confirm, Escape to cancel) — `onAddNew`
// fires with the trimmed typed value so the caller can create whatever
// backing record the tag needs (e.g. a new Syllabus row) before adding it.
// `resolveLabel`, if given, is tried first — it should look up an id-based
// tag's label directly off the live Syllabus row (by id, unscoped), not off
// `options` (which is scoped to the *current row's own* Subject/Topic/
// Subtopic and so can miss a tag whose underlying Syllabus row has since
// been reassigned elsewhere — the tag would otherwise fall through to
// showing its raw stored id instead of a name).
function TagMultiSelectCell({ values, options, placeholder, disabled, onChange, allowAddNew = false, onAddNew, resolveLabel }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  // Once at least one tag is already picked, the full-width dropdown is
  // collapsed into a small "+" — picking a first tag still shows the
  // dropdown outright (nothing to compact yet), but every tag after that
  // is a secondary action that shouldn't take up a whole row of table
  // width by default. Reopens the dropdown on click; closes again once a
  // tag is picked, "+ Add new" is confirmed/cancelled, or it loses focus.
  const [pickerOpen, setPickerOpen] = useState(false);
  const tags = values || [];
  const tagSet = new Set(tags);
  const available = options.filter(o => !tagSet.has(o.value));
  const labelFor = v => {
    const resolved = resolveLabel && resolveLabel(v);
    if (resolved) return resolved;
    const opt = options.find(o => o.value === v);
    return opt ? opt.label : v;
  };
  function addTag(v) {
    if (v === ADD_NEW_VALUE) { setAdding(true); setDraft(""); return; }
    if (v) { onChange([...tags, v]); setPickerOpen(false); }
  }
  function removeTag(v) { onChange(tags.filter(t => t !== v)); }
  function confirmAdd() {
    const name = draft.trim();
    setAdding(false); setDraft(""); setPickerOpen(false);
    if (name && onAddNew) onAddNew(name);
  }
  function cancelAdd() { setAdding(false); setDraft(""); setPickerOpen(false); }

  const showDropdown = !disabled && !adding && (tags.length === 0 || pickerOpen);
  const showCompactAdd = !disabled && !adding && tags.length > 0 && !pickerOpen;

  return (
    <div>
      <div className="ucc-flex wrap" style={{ gap: 4, rowGap: 6 }}>
        {tags.map(t => (
          <span className="ucc-tag" key={t}>
            {labelFor(t)}
            <button type="button" onClick={() => removeTag(t)} title={`Remove ${labelFor(t)}`} aria-label={`Remove ${labelFor(t)}`}><X size={10} /></button>
          </span>
        ))}
        {adding ? (
          <div className="ucc-flex" style={{ gap: 2 }}>
            <input className="ucc-input" autoFocus placeholder="New micro topic" style={{ width: 140 }}
              value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") confirmAdd(); if (e.key === "Escape") cancelAdd(); }} />
            <IconBtn icon={Check} onClick={confirmAdd} title="Add" />
            <IconBtn icon={X} onClick={cancelAdd} title="Cancel" />
          </div>
        ) : showCompactAdd ? (
          <IconBtn icon={Plus} onClick={() => setPickerOpen(true)} title="Add another micro topic tag" />
        ) : showDropdown && (
          <select className="ucc-select" value="" disabled={disabled} autoFocus={pickerOpen} style={{ width: "auto", maxWidth: 170 }}
            onChange={e => addTag(e.target.value)}
            onBlur={() => { if (tags.length > 0) setPickerOpen(false); }}>
            <option value="">{available.length ? placeholder : (allowAddNew ? "+ Add a tag…" : "No more to add")}</option>
            {available.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            {allowAddNew && <option value={ADD_NEW_VALUE}>+ Add new</option>}
          </select>
        )}
      </div>
      {disabled && tags.length === 0 && <div className="ucc-tiny" style={{ color: "var(--ink-muted)" }}>{placeholder}</div>}
    </div>
  );
}

// Resolves a Syllabus row id straight to its current Micro Topic text (or
// null if id isn't a Syllabus row id at all, e.g. a legacy plain-text tag).
// Shared by Classes' tag label resolution and its file naming, so both
// always agree on "what is this micro topic called right now".
function resolveMicrotopicLabelById(db, id) {
  const row = db.syllabus.find(s => s.id === id);
  return row ? row.microtopic : null;
}
// Strips everything except letters/digits, so a label like "Art & Culture"
// becomes "ArtCulture" rather than a messy run of underscores from
// replacing every space and special character individually.
function fileNameToken(s) {
  return String(s || "").replace(/[^a-zA-Z0-9]/g, "");
}
// Above this length (prefix only, before the extension), a
// Subject_Subtopic_MicroTopic_N name is judged "too large" and
// nextFileNamePrefix drops down a tier — see its own comment.
const MAX_FILENAME_PREFIX_LENGTH = 60;
// Builds a Drive filename prefix (no extension — DriveFileCell appends the
// real one) for a FRESH upload only. N is 1 + how many OTHER rows in the
// same tracker, matching the same group key, already have a file — so the
// numbering is per subject+subtopic (or whatever grouping the caller
// passes), not global. Deliberately never called for a replace: reusing
// this to rename an already-uploaded file on replace risks two files
// colliding on the same number if upload order and row order diverge
// (e.g. row A uploaded second gets "_2", then row B — uploaded first,
// "_1" — is replaced and this function is asked for a fresh number: it
// would see both rows already have files and recompute "_2" again).
// Keeping "replace always keeps the existing name" (see DriveFileCell)
// avoids that entirely rather than trying to solve it here.
//
// `labelParts` is either a flat array (unchanged from before — one naming
// scheme, no fallback) or an array of arrays: candidate part-sets tried in
// order from most to least descriptive (e.g. Subject+Subtopic+MicroTopic,
// then Subject+MicroTopic, then MicroTopic alone), stopping at the first
// whose result fits MAX_FILENAME_PREFIX_LENGTH. Falls back to the last
// (shortest) candidate if none fit, rather than erroring or truncating
// a token mid-word.
function nextFileNamePrefix(records, rec, groupKeyFn, labelParts) {
  const key = groupKeyFn(rec);
  const count = records.filter(r => r.id !== rec.id && r.driveFile && groupKeyFn(r) === key).length + 1;
  const tiers = Array.isArray(labelParts[0]) ? labelParts : [labelParts];
  let last = `File_${count}`;
  for (let i = 0; i < tiers.length; i++) {
    const tokens = tiers[i].filter(Boolean).map(fileNameToken).filter(Boolean);
    if (tokens.length === 0) continue;
    const candidate = `${tokens.join("_")}_${count}`;
    last = candidate;
    if (candidate.length <= MAX_FILENAME_PREFIX_LENGTH) return candidate;
  }
  return last;
}

// Upload/Download control for a Google-Drive-backed file attachment on one
// record. The record only ever stores { id, name } (Drive's file id + the
// original filename) via `onChange` — the PDF bytes themselves go straight
// to Google Drive over the network and are never written to Supabase.
// Download re-fetches the bytes from Drive on demand rather than caching them.
// `namePrefix` (no extension), when provided, standardizes the name of a
// FRESH upload only — see nextFileNamePrefix. Replacing an existing file
// always keeps whatever name Drive already has; only the very first upload
// on a row gets renamed.
function DriveFileCell({ driveFile, db, updateSlice, onChange, folderKey, namePrefix }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  async function handleFileSelected(e) {
    const picked = e.target.files && e.target.files[0];
    e.target.value = ""; // so selecting the same file again still fires onChange
    if (!picked) return;
    setBusy(true); setError("");
    try {
      let desiredName;
      if (driveFile) {
        desiredName = driveFile.name; // replace: keep the existing name as-is
      } else if (namePrefix) {
        const ext = (picked.name.match(/\.[a-zA-Z0-9]+$/) || [".pdf"])[0];
        desiredName = `${namePrefix}${ext}`;
      }
      const uploaded = await uploadDriveFile(db, updateSlice, folderKey, driveFile?.id, picked, desiredName);
      onChange(uploaded);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    setBusy(true); setError("");
    try {
      await downloadDriveFile(driveFile.id, driveFile.name);
    } catch (err) {
      setError(err.message || "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleFileSelected} />
      <div className="ucc-flex wrap">
        <button type="button" className="ucc-btn ghost" style={{ padding: "3px 8px" }} disabled={busy} onClick={() => fileInputRef.current?.click()}>
          <Upload size={12} /> {driveFile ? "Replace" : "Upload"}
        </button>
        {driveFile && (
          <button type="button" className="ucc-btn ghost" style={{ padding: "3px 8px" }} disabled={busy} onClick={handleDownload}>
            <Download size={12} /> Download
          </button>
        )}
      </div>
      {busy && <div className="ucc-tiny">Working…</div>}
      {driveFile && !busy && (
        <div className="ucc-tiny" style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={driveFile.name}>
          {driveFile.name}
        </div>
      )}
      {error && <div className="ucc-tiny" style={{ color: "var(--red)" }}>{error}</div>}
    </div>
  );
}
// that have no updateSlice/upload path — just a link to pull the same file
// down from Drive on demand.
function DriveDownloadLink({ driveFile }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!driveFile) return null;
  async function handleDownload() {
    setBusy(true); setError("");
    try {
      await downloadDriveFile(driveFile.id, driveFile.name);
    } catch (err) {
      setError(err.message || "Download failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <span>
      <button type="button" className="ucc-btn ghost" style={{ padding: "1px 6px", fontSize: 11 }} disabled={busy} onClick={handleDownload} title={driveFile.name}>
        <Download size={10} /> {busy ? "…" : "PDF"}
      </button>
      {error && <span className="ucc-tiny" style={{ color: "var(--red)" }}> {error}</span>}
    </span>
  );
}

/* ============================================================
   DAY ARC (signature visual)
   ============================================================ */
// Office + its commute legs share one color family (requirement: commute is
// a sub-section of office, not its own category); every study slot gets its
// own distinct color so the day is scannable at a glance.
function colorForBlock(b) {
  if (b.type === "break") return "var(--break)";
  if (b.id === "office") return "var(--office)";
  if (b.id === "travelTo" || b.id === "travelFro") return "var(--travel)";
  if (b.type === "ai") return "var(--ai)";
  if (["s1", "s2", "s3", "s4", "s5", "s6", "s7"].includes(b.id)) return `var(--sec-${b.id})`;
  return "var(--sec-custom)";
}
function DayArc({ blocks, wakeMinutes, sleepMinutes }) {
  let cursor = wakeMinutes;
  const segs = [];
  blocks.forEach(b => {
    const dur = b.skipped ? 0 : b.duration;
    if (dur > 0) segs.push({ ...b, start: cursor, end: cursor + dur });
    cursor += dur;
  });
  const endMinutes = cursor;
  const totalSpan = Math.max(endMinutes, sleepMinutes) - wakeMinutes;
  const markerPct = ((sleepMinutes - wakeMinutes) / totalSpan) * 100;
  const legendSegs = segs.filter(s => s.type !== "break" && s.id !== "travelTo" && s.id !== "travelFro");
  return (
    <div>
      <div className="ucc-arc">
        {segs.map((s, i) => (
          <div key={i} className="ucc-arc-seg" title={`${s.label}: ${minutesToTime(s.start)}–${minutesToTime(s.end)}`}
            style={{
              left: `${((s.start - wakeMinutes) / totalSpan) * 100}%`,
              width: `${((s.end - s.start) / totalSpan) * 100}%`,
              background: s.end > sleepMinutes ? "repeating-linear-gradient(45deg, var(--red), var(--red) 4px, #fff 4px, #fff 8px)" : colorForBlock(s),
              borderRight: "1px solid rgba(255,255,255,0.5)"
            }} />
        ))}
        <div className="ucc-arc-marker" style={{ left: `${markerPct}%` }} title={`Sleep boundary ${minutesToTime(sleepMinutes)}`} />
      </div>
      <div className="ucc-flex between ucc-tiny ucc-mono">
        <span>Wake {minutesToTime(wakeMinutes)}</span>
        <span>Sleep boundary {minutesToTime(sleepMinutes)}</span>
      </div>
      <div className="ucc-legend">
        {legendSegs.map((s, i) => (
          <span className="ucc-legend-item" key={i}><span className="ucc-legend-dot" style={{ background: colorForBlock(s) }} />{s.id === "office" ? "Office (incl. commute)" : s.label}</span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PLANNER LOGIC
   ============================================================ */
function initDayPlan(dateISO, settings, dayType) {
  const wakeTime = settings.wakeTimeDefault;
  const dt = dayType || defaultDayType(dateISO);
  const available = parseTimeToMinutes(settings.sleepTime) - parseTimeToMinutes(wakeTime);
  const base = buildBaseBlocks(dt, settings);
  const { blocks, breakNote, droppedLabels } = applyTrimRules(base, available);
  return {
    date: dateISO,
    wakeTime,
    wakeTimeLocked: false,
    dayType: dt,
    breakNote,
    droppedLabels,
    blocks: blocks.map(b => ({ ...b, status: "Not Started", skipped: false, skipReason: "", completedAt: null, journal: "" })),
  };
}

// Re-runs the day-type/wake-time -> composition logic (used whenever either
// input changes), while preserving progress on any block that survives and
// keeping any custom tasks the user added by hand.
function regeneratePlan(prevPlan, wakeTime, dayType, settings) {
  const available = parseTimeToMinutes(settings.sleepTime) - parseTimeToMinutes(wakeTime);
  const base = buildBaseBlocks(dayType, settings);
  const { blocks, breakNote, droppedLabels } = applyTrimRules(base, available);
  const prevById = new Map((prevPlan.blocks || []).map(b => [b.id, b]));
  const merged = blocks.map(b => {
    const prev = prevById.get(b.id);
    return prev
      ? { ...b, status: prev.status, completedAt: prev.completedAt, skipped: false, skipReason: "", journal: prev.journal || "" }
      : { ...b, status: "Not Started", completedAt: null, skipped: false, skipReason: "", journal: "" };
  });
  const customBlocks = (prevPlan.blocks || []).filter(b => b.custom);
  return { ...prevPlan, wakeTime, dayType, breakNote, droppedLabels, blocks: [...merged, ...customBlocks] };
}

function computePlanTimes(plan) {
  const wakeMinutes = parseTimeToMinutes(plan.wakeTime);
  let cursor = wakeMinutes;
  const timed = plan.blocks.map(b => {
    const start = cursor;
    const dur = b.skipped ? 0 : Number(b.duration || 0);
    cursor += dur;
    return { ...b, start, end: cursor };
  });
  return { wakeMinutes, endMinutes: cursor, blocks: timed };
}

/* ============================================================
   PRIORITY / LINKING HELPERS
   ============================================================ */
function readingCompletionPct(rec) {
  const fields = ["classNotes", "standardMaterial", "ncert", "singlePager"];
  const applicable = fields.filter(f => rec[f] !== "Not Needed");
  if (applicable.length === 0) return 100;
  const done = applicable.filter(f => rec[f] === "Completed").length;
  return Math.round((done / applicable.length) * 100);
}

// Dashboard-only completion score for ONE micro topic, on a 0..1 scale with
// partial credit (a topic with notes+NCERT done but revision pending scores
// 0.6, not 0). Deliberately separate from readingCompletionPct above (which
// powers Today's "pending reading" list and excludes revision on purpose,
// since a topic should drop off that list after first read) — this one is
// purpose-built for whole-syllabus progress and includes both revisions.
const TOPIC_COMPLETION_FIELDS = ["classNotes", "standardMaterial", "ncert", "singlePager", "revision1", "revision2"];
function topicCompletionScore(readingRec) {
  const applicable = TOPIC_COMPLETION_FIELDS.filter(f => !readingRec || readingRec[f] !== "Not Needed");
  if (applicable.length === 0) return 1;
  const done = applicable.filter(f => readingRec && readingRec[f] === "Completed").length;
  return done / applicable.length;
}

function computePendingTasks(db) {
  const items = [];
  // Topic Completion is a computed overview of Syllabus now (see "TOPIC
  // COMPLETION — COMPUTED-FIELD HELPERS") — these two sections walk
  // db.syllabus instead of db.reading, since db.reading only holds the
  // manually-set Revision 1/2 values for a subset of rows, not a full
  // mirror of every topic anymore. The old "Previous day's class notes"
  // section is gone entirely: Class Notes is now derived directly from a
  // matching Class's own Completed status, so the moment you complete a
  // class, its topic's Class Notes reads Completed too — there's no
  // separate manual step left for this reminder to catch anyone missing.
  const topicCompletionIndexes = buildTopicCompletionIndexes(db);
  // 2. Revision due
  db.syllabus.forEach(row => {
    const f = computeTopicCompletionFields(row, topicCompletionIndexes);
    if (f.classNotes === "Completed" && (f.revision1 === "Yet to Start" || f.revision1 === "In Progress")) {
      items.push({ cat: "Revision due", label: `${row.subject} — ${row.topic}`, detail: "Revision 1 pending", date: "", tab: "reading" });
    } else if (f.revision1 === "Completed" && (f.revision2 === "Yet to Start" || f.revision2 === "In Progress")) {
      items.push({ cat: "Revision due", label: `${row.subject} — ${row.topic}`, detail: "Revision 2 pending", date: "", tab: "reading" });
    }
  });
  // 5. Pending reading (standard material / NCERT) — no longer requires Class Notes to be "Completed" first
  db.syllabus.forEach(row => {
    const f = computeTopicCompletionFields(row, topicCompletionIndexes);
    if (f.standardMaterial !== "Completed") {
      items.push({ cat: "Pending reading", label: `${row.subject} — ${row.topic}`, detail: `Standard material: ${f.standardMaterial}`, date: "", tab: "reading" });
    } else if (f.ncert !== "Completed") {
      items.push({ cat: "Pending reading", label: `${row.subject} — ${row.topic}`, detail: `NCERT: ${f.ncert}`, date: "", tab: "reading" });
    }
  });
  // 6. Overdue single pagers
  db.singlePager.filter(s => s.status !== "Completed").forEach(s => {
    items.push({ cat: "Single pager", label: `${s.subject} — ${s.topic}`, detail: `Single pager: ${s.status || "Not Started"}`, date: s.date || "", tab: "singlePager" });
  });
  const order = ["Revision due", "Pending reading", "Single pager", "Other pending"];
  items.sort((a, b) => order.indexOf(a.cat) - order.indexOf(b.cat) || (a.date || "").localeCompare(b.date || ""));
  return items;
}

/* ============================================================
   TODAY / DASHBOARD TAB
   ============================================================ */
function TodayTab({ db, updateSlice, onNavigate }) {
  const [dateISO, setDateISO] = useState(todayISO());
  const settings = db.settings;
  const plan = db.dailyPlans[dateISO] || initDayPlan(dateISO, settings);

  useEffect(() => {
    if (!db.dailyPlans[dateISO]) {
      updateSlice("dailyPlans", prev => ({ ...prev, [dateISO]: initDayPlan(dateISO, settings) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateISO]);

  function setPlan(updater) {
    updateSlice("dailyPlans", prev => {
      const current = prev[dateISO] || initDayPlan(dateISO, settings);
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [dateISO]: next };
    });
  }

  // Wake time can only be edited once per day plan — meant to mirror
  // reality (you wake up once), not to be freely re-typed. The first edit
  // sets wakeTimeLocked, which disables the input; Edit (Pencil icon,
  // same "deliberate escape hatch" pattern GenericTracker uses for
  // Completed rows) is the only way back in, both for genuinely fixing a
  // mistyped time and for repeated testing right now.
  function changeWakeTime(newWakeTime) {
    setPlan(p => ({ ...regeneratePlan(p, newWakeTime, p.dayType || defaultDayType(dateISO), settings), wakeTimeLocked: true }));
  }
  function unlockWakeTime() {
    setPlan(p => ({ ...p, wakeTimeLocked: false }));
  }
  function changeDayType(newDayType) {
    setPlan(p => regeneratePlan(p, p.wakeTime, newDayType, settings));
  }

  function updateBlock(id, patch) {
    setPlan(p => ({ ...p, blocks: p.blocks.map(b => b.id === id ? { ...b, ...patch } : b) }));
  }
  function moveBlock(id, dir) {
    setPlan(p => {
      const idx = p.blocks.findIndex(b => b.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= p.blocks.length) return p;
      const blocks = [...p.blocks];
      [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
      return { ...p, blocks };
    });
  }
  // Office/commute render as one merged card (see the "office" branch in the
  // render below), so moving it has to shift travelTo+office+travelFro as a
  // contiguous group past one adjacent block, rather than swapping a single
  // id like moveBlock does — otherwise the group would silently fall apart.
  function moveOfficeGroup(dir) {
    setPlan(p => {
      const blocks = [...p.blocks];
      const groupIds = ["travelTo", "office", "travelFro"].filter(id => blocks.some(b => b.id === id));
      if (groupIds.length === 0) return p;
      const indices = groupIds.map(id => blocks.findIndex(b => b.id === id)).sort((a, b) => a - b);
      const first = indices[0], last = indices[indices.length - 1];
      const groupBlocks = blocks.slice(first, last + 1);
      if (dir === -1) {
        if (first === 0) return p;
        const before = blocks[first - 1];
        return { ...p, blocks: [...blocks.slice(0, first - 1), ...groupBlocks, before, ...blocks.slice(last + 1)] };
      } else {
        if (last === blocks.length - 1) return p;
        const after = blocks[last + 1];
        return { ...p, blocks: [...blocks.slice(0, first), after, ...groupBlocks, ...blocks.slice(last + 2)] };
      }
    });
  }
  function addCustomBlock() {
    setPlan(p => ({
      ...p, blocks: [...p.blocks, { id: uid(), label: "Custom task", type: "study", link: "custom", duration: 30, status: "Not Started", skipped: false, skipReason: "", journal: "", custom: true }]
    }));
  }
  // Brings back one of today's standard slots that applyTrimRules dropped
  // for not fitting (or that's simply not in the plan yet for some other
  // reason) — looked up fresh from buildBaseBlocks rather than stored
  // anywhere, so it's always the current Settings-defined version of that
  // slot. Marked `restored` so it can be removed again via the same
  // control as a custom task, unlike a normal auto-generated block.
  function addExistingBlock(blockId) {
    const dayType = plan.dayType || defaultDayType(dateISO);
    const template = buildBaseBlocks(dayType, settings).find(b => b.id === blockId);
    if (!template) return;
    setPlan(p => ({
      ...p,
      droppedLabels: (p.droppedLabels || []).filter(l => l !== template.label),
      blocks: [...p.blocks, { ...template, status: "Not Started", skipped: false, skipReason: "", completedAt: null, journal: "", restored: true }],
    }));
  }
  function removeBlock(id) {
    setPlan(p => ({ ...p, blocks: p.blocks.filter(b => b.id !== id) }));
  }

  const { wakeMinutes, endMinutes, blocks: timedBlocks } = computePlanTimes(plan);
  const sleepMinutes = parseTimeToMinutes(settings.sleepTime);
  const overflow = endMinutes - sleepMinutes;
  // Standard slots that would normally be in today's plan (per Settings)
  // but aren't currently — almost always because applyTrimRules dropped
  // them for not fitting; powers "+ Add existing task" below.
  const missingBlocks = buildBaseBlocks(plan.dayType || defaultDayType(dateISO), settings)
    .filter(b => !plan.blocks.some(pb => pb.id === b.id));

  const pending = useMemo(() => computePendingTasks(db), [db]);
  const revisionDue = pending.filter(p => p.cat === "Revision due");
  const yISO = addDaysISO(dateISO, -1);
  const yClasses = db.classes.filter(c => c.date === yISO && c.status === "Completed");
  // Topic Completion is a computed overview of Syllabus now (see "TOPIC
  // COMPLETION — COMPUTED-FIELD HELPERS"), so "pending" and "fully done"
  // are both measured across db.syllabus, not db.reading (db.reading only
  // holds the manually-set Revision 1/2 values for a subset of rows).
  const topicCompletionIndexes = useMemo(() => buildTopicCompletionIndexes(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.classes, db.ncert, db.standardBooks, db.singlePager, db.reading]);
  const pendingReadingCount = db.syllabus.filter(row => readingCompletionPct(computeTopicCompletionFields(row, topicCompletionIndexes)) < 100).length;
  const pendingSP = db.singlePager.filter(s => s.status !== "Completed");
  const todayAnswers = db.answerWriting.filter(a => a.date === dateISO);
  const todayCA = db.currentAffairs.filter(c => c.date === dateISO);
  const topicsFullyDone = db.syllabus.filter(row => topicCompletionScore(computeTopicCompletionFields(row, topicCompletionIndexes)) === 1).length;

  return (
    <div>
      <div className="ucc-card">
        <div className="ucc-flex between wrap">
          <div className="ucc-flex">
            <IconBtn icon={ChevronLeft} onClick={() => setDateISO(d => addDaysISO(d, -1))} title="Previous day" />
            <div>
              <div className="ucc-display" style={{ fontWeight: 700, fontSize: 15 }}>{fmtDateLong(dateISO)}</div>
              {dateISO === todayISO() && <span className="ucc-badge amber">Today</span>}
            </div>
            <IconBtn icon={ChevronRightIcon} onClick={() => setDateISO(d => addDaysISO(d, 1))} title="Next day" />
          </div>
          <div className="ucc-flex wrap">
            <div className="ucc-flex" style={{ gap: 4 }}>
              <label className="ucc-tiny">Wake time
                <input type="time" className="ucc-input ucc-mono" value={plan.wakeTime} disabled={plan.wakeTimeLocked}
                  onChange={e => changeWakeTime(e.target.value)} style={{ marginLeft: 6, width: 100 }} />
              </label>
              {plan.wakeTimeLocked && (
                <>
                  <Lock size={12} style={{ color: "var(--ink-muted)" }} aria-label="Wake time locked for today" />
                  <IconBtn icon={Pencil} onClick={unlockWakeTime} title="Unlock to edit wake time again" />
                </>
              )}
            </div>
            <label className="ucc-tiny">Day type
              <select className="ucc-select" value={plan.dayType || defaultDayType(dateISO)} onChange={e => changeDayType(e.target.value)} style={{ marginLeft: 6, width: 110, display: "inline-block" }}>
                {DAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
        </div>
        <DayArc blocks={timedBlocks} wakeMinutes={wakeMinutes} sleepMinutes={sleepMinutes} />
        {(plan.breakNote || (plan.droppedLabels && plan.droppedLabels.length > 0)) && (
          <div className="ucc-tiny" style={{ background: "var(--amber-soft)", color: "var(--amber)", borderRadius: 6, padding: "8px 12px", marginTop: 8 }}>
            <strong>Adjusted for today:</strong>{" "}
            {[
              plan.breakNote,
              plan.droppedLabels && plan.droppedLabels.length > 0 ? `Dropped ${plan.droppedLabels.map(l => `"${l}"`).join(", ")}` : null,
            ].filter(Boolean).join(" · ")}
          </div>
        )}
        {overflow > 0 && (
          <div className="ucc-overflow-banner">
            <AlertTriangle size={15} />
            Schedule overflow — even after trimming everything adjustable, you have {Math.floor(overflow / 60)}h {overflow % 60}m of fixed work (class, GS reading, office/commute) that cannot fit before {settings.sleepTime}.
          </div>
        )}
      </div>

      <div className="ucc-card">
        <h3>Today's plan</h3>
        <p className="ucc-tiny" style={{ marginTop: -4 }}>A quick hourly journal — jot a line on what you actually did in each slot. Detailed logging (topics, PDFs, marks) stays on each tracker's own tab.</p>
        {timedBlocks.map((b, i) => {
          if (b.id === "travelTo" || b.id === "travelFro") return null; // shown inside the merged Office card
          if (b.id === "office") {
            const travelTo = timedBlocks.find(x => x.id === "travelTo");
            const travelFro = timedBlocks.find(x => x.id === "travelFro");
            const groupIndices = ["travelTo", "office", "travelFro"]
              .map(id => timedBlocks.findIndex(x => x.id === id))
              .filter(idx => idx !== -1);
            const firstIdx = Math.min(...groupIndices);
            const lastIdx = Math.max(...groupIndices);
            return (
              <OfficePlanBlock key="office-group" office={b} travelTo={travelTo} travelFro={travelFro}
                onSkipAll={reason => {
                  updateBlock("office", { skipped: true, skipReason: reason });
                  if (travelTo) updateBlock("travelTo", { skipped: true, skipReason: reason });
                  if (travelFro) updateBlock("travelFro", { skipped: true, skipReason: reason });
                }}
                onUnskipAll={() => {
                  updateBlock("office", { skipped: false, skipReason: "" });
                  if (travelTo) updateBlock("travelTo", { skipped: false, skipReason: "" });
                  if (travelFro) updateBlock("travelFro", { skipped: false, skipReason: "" });
                }}
                onJournalChange={v => updateBlock("office", { journal: v })}
                onDurationChange={(blockId, duration) => updateBlock(blockId, { duration })}
                onMoveUp={firstIdx > 0 ? () => moveOfficeGroup(-1) : null}
                onMoveDown={lastIdx < timedBlocks.length - 1 ? () => moveOfficeGroup(1) : null} />
            );
          }
          return (
            <PlanBlock key={b.id} block={b} onUpdate={patch => updateBlock(b.id, patch)}
              onMoveUp={i > 0 ? () => moveBlock(b.id, -1) : null}
              onMoveDown={i < timedBlocks.length - 1 ? () => moveBlock(b.id, 1) : null}
              onRemove={(b.custom || b.restored) ? () => removeBlock(b.id) : null} />
          );
        })}
        <div className="ucc-flex wrap" style={{ gap: 8 }}>
          <button className="ucc-btn" onClick={addCustomBlock}><Plus size={14} /> Add custom task</button>
          {missingBlocks.length > 0 && (
            <select className="ucc-select" style={{ width: "auto", maxWidth: 240 }} value=""
              title="Bring back a slot dropped from today's plan"
              onChange={e => { if (e.target.value) addExistingBlock(e.target.value); }}>
              <option value="">+ Add existing task…</option>
              {missingBlocks.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="ucc-grid">
        <SummaryCard title="Pending" count={pending.length}>
          {pending.length === 0 ? <EmptyState>Nothing pending — clean slate.</EmptyState> :
            pending.slice(0, 2).map((p, i) => (
              <div key={i} className="ucc-tiny" style={{ marginBottom: 4, cursor: p.tab ? "pointer" : undefined }} onClick={p.tab ? () => onNavigate(p.tab) : undefined}>
                <Badge tone="amber">{p.cat}</Badge> {p.label} — {p.detail}
              </div>
            ))}
        </SummaryCard>
        <SummaryCard title="Revision due" count={revisionDue.length} onTitleClick={() => onNavigate("reading")}>
          {revisionDue.length === 0 ? <EmptyState>No revisions due today.</EmptyState> :
            revisionDue.slice(0, 2).map((p, i) => <div key={i} className="ucc-tiny" style={{ marginBottom: 4 }}>{p.label} — {p.detail}</div>)}
        </SummaryCard>
        <SummaryCard title="Class" count={yClasses.length} onTitleClick={() => onNavigate("classes")}>
          {yClasses.length === 0 ? <EmptyState>No class logged for {fmtDateLong(yISO)}.</EmptyState> :
            yClasses.map(c => <div key={c.id} className="ucc-tiny">{c.subject} #{c.classNumber} — {c.topic}</div>)}
        </SummaryCard>
        <SummaryCard title="Topic completion" count={pendingReadingCount} onTitleClick={() => onNavigate("reading")}>
          <div className="ucc-tiny">{pendingReadingCount} of {db.syllabus.length} topics have pending reading items.</div>
        </SummaryCard>
        <SummaryCard title="Single pager" count={pendingSP.length} onTitleClick={() => onNavigate("singlePager")}>
          {pendingSP.length === 0 ? <EmptyState>All tracked single pagers are up to date.</EmptyState> :
            pendingSP.slice(0, 2).map(s => <div key={s.id} className="ucc-tiny">{s.subject} — {s.topic}</div>)}
        </SummaryCard>
        <SummaryCard title="Answer writing today" count={todayAnswers.length} onTitleClick={() => onNavigate("answerWriting")}>
          {todayAnswers.length === 0 ? <EmptyState>No answer-writing task logged for today.</EmptyState> :
            todayAnswers.map(a => <div key={a.id} className="ucc-tiny">{a.gsPaper} — {a.topic} <Badge tone={colorFor(a.status)}>{a.status}</Badge></div>)}
        </SummaryCard>
        <SummaryCard title="Current affairs today" count={todayCA.length} onTitleClick={() => onNavigate("currentAffairs")}>
          {todayCA.length === 0 ? <EmptyState>No current affairs added for today.</EmptyState> :
            todayCA.map(c => <div key={c.id} className="ucc-tiny">{c.title}</div>)}
        </SummaryCard>
        <SummaryCard title="Progress" count={topicsFullyDone} onTitleClick={() => onNavigate("reading")}>
          <div className="ucc-tiny">{topicsFullyDone} of {db.syllabus.length} topics fully complete (notes, material, both revisions)</div>
          <div className="ucc-tiny">{db.classes.filter(c => c.status === "Completed").length} classes completed</div>
          <div className="ucc-tiny">{db.singlePager.filter(s => s.status === "Completed").length} single pagers completed</div>
        </SummaryCard>
      </div>
    </div>
  );
}

function SummaryCard({ title, count, children, onTitleClick }) {
  return (
    <div className="ucc-card">
      <div className="ucc-flex between">
        <h3 style={{ margin: 0, cursor: onTitleClick ? "pointer" : undefined, textDecoration: onTitleClick ? "underline" : undefined }} onClick={onTitleClick}>{title}</h3>
        <Badge tone={count > 0 ? "amber" : "grey"}>{count}</Badge>
      </div>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

// Skip checkbox for a plan block, with a reason required up front: checking
// it opens a small popover of SKIP_REASONS (same list the old end-of-day
// review used) instead of immediately marking it skipped — onSkip only
// fires once a reason is picked. Unchecking (already skipped -> not) needs
// no reason, so it fires onUnskip directly.
function SkipToggle({ skipped, skipReason, onSkip, onUnskip }) {
  const [open, setOpen] = useState(false);
  if (skipped) {
    return (
      <span className="ucc-tiny">
        Skipped{skipReason ? `: ${skipReason}` : ""}{" "}
        <button type="button" className="ucc-btn ghost" style={{ padding: "1px 6px", fontSize: 11 }} onClick={onUnskip}>Undo</button>
      </span>
    );
  }
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <label className="ucc-tiny"><input type="checkbox" checked={false} onChange={() => setOpen(true)} /> Skip</label>
      {open && (
        <div style={{
          position: "absolute", zIndex: 30, top: "100%", right: 0, marginTop: 4, background: "#fff",
          border: "1px solid var(--line-strong)", borderRadius: 6, padding: 8, minWidth: 190,
          boxShadow: "0 4px 14px rgba(0,0,0,0.14)",
        }}>
          <div className="ucc-tiny" style={{ marginBottom: 6, fontWeight: 600 }}>Reason for skipping?</div>
          {SKIP_REASONS.map(r => (
            <button key={r} type="button" className="ucc-btn ghost" style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 3, padding: "4px 8px" }}
              onClick={() => { onSkip(r); setOpen(false); }}>{r}</button>
          ))}
          <button type="button" className="ucc-btn ghost" style={{ marginTop: 2, padding: "2px 6px", fontSize: 11 }} onClick={() => setOpen(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function OfficePlanBlock({ office, travelTo, travelFro, onSkipAll, onUnskipAll, onJournalChange, onDurationChange, onMoveUp, onMoveDown }) {
  const skipped = office.skipped;
  const start = (travelTo || office).start;
  const end = (travelFro || office).end;
  const duration = (travelTo ? travelTo.duration : 0) + office.duration + (travelFro ? travelFro.duration : 0);
  return (
    <div className={`ucc-planblock ${skipped ? "skipped" : ""}`}>
      <div className="time ucc-mono ucc-tiny">
        {skipped ? "skipped" : `${minutesToTime(start)} – ${minutesToTime(end)}`}
        <div className="ucc-tiny" style={{ marginTop: 4 }}>{duration} min</div>
      </div>
      <div className="body">
        <div className="ucc-flex between wrap">
          <strong>Office Work{travelTo ? " (incl. commute)" : ""}</strong>
          <div className="ucc-flex">
            {onMoveUp && <IconBtn icon={ChevronUp} onClick={onMoveUp} title="Move up" />}
            {onMoveDown && <IconBtn icon={ChevronDown} onClick={onMoveDown} title="Move down" />}
            <SkipToggle skipped={skipped} skipReason={office.skipReason} onSkip={r => onSkipAll(r)} onUnskip={onUnskipAll} />
          </div>
        </div>
        <div className="ucc-tiny" style={{ margin: "4px 0", color: "var(--ink-muted)" }}>
          Default durations come from Settings — adjust here for just today.
        </div>
        <div className="ucc-flex wrap" style={{ gap: 14, marginBottom: 4 }}>
          {travelTo && (
            <label className="ucc-tiny">Commute (to)
              <input type="number" className="ucc-input ucc-mono" style={{ width: 60, marginLeft: 6 }} value={travelTo.duration}
                onChange={e => onDurationChange("travelTo", Number(e.target.value))} /> min
            </label>
          )}
          <label className="ucc-tiny">Office
            <input type="number" className="ucc-input ucc-mono" style={{ width: 60, marginLeft: 6 }} value={office.duration}
              onChange={e => onDurationChange("office", Number(e.target.value))} /> min
          </label>
          {travelFro && (
            <label className="ucc-tiny">Commute (fro)
              <input type="number" className="ucc-input ucc-mono" style={{ width: 60, marginLeft: 6 }} value={travelFro.duration}
                onChange={e => onDurationChange("travelFro", Number(e.target.value))} /> min
            </label>
          )}
        </div>
        {!skipped && (
          <textarea className="ucc-textarea" rows={2} style={{ marginTop: 4 }}
            placeholder="What's worth noting about today's office block? (optional)"
            value={office.journal || ""} onChange={e => onJournalChange(e.target.value)} />
        )}
      </div>
    </div>
  );
}

function PlanBlock({ block, onUpdate, onMoveUp, onMoveDown, onRemove }) {
  return (
    <div className={`ucc-planblock ${block.skipped ? "skipped" : ""}`}>
      <div className="time ucc-mono ucc-tiny">
        {block.skipped ? "skipped" : `${minutesToTime(block.start)} – ${minutesToTime(block.end)}`}
        <div className="ucc-tiny" style={{ marginTop: 4 }}>
          <input type="number" className="ucc-input ucc-mono" style={{ width: 60 }} value={block.duration}
            onChange={e => onUpdate({ duration: Number(e.target.value) })} /> min
        </div>
      </div>
      <div className="body">
        <div className="ucc-flex between wrap">
          <strong>{block.label}</strong>
          <div className="ucc-flex">
            {onMoveUp && <IconBtn icon={ChevronUp} onClick={onMoveUp} title="Move up" />}
            {onMoveDown && <IconBtn icon={ChevronDown} onClick={onMoveDown} title="Move down" />}
            <SkipToggle skipped={block.skipped} skipReason={block.skipReason}
              onSkip={r => onUpdate({ skipped: true, skipReason: r })}
              onUnskip={() => onUpdate({ skipped: false, skipReason: "" })} />
            {onRemove && <IconBtn icon={Trash2} onClick={onRemove} title="Remove" danger />}
          </div>
        </div>
        {block.type !== "break" && !block.skipped && (
          <textarea className="ucc-textarea" rows={2} style={{ marginTop: 6 }}
            placeholder="What did you actually do in this slot? (a line or two is plenty)"
            value={block.journal || ""} onChange={e => onUpdate({ journal: e.target.value })} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TRACKER TABS
   ============================================================ */
function ClassesTab({ db, updateSlice }) {
  const [addTopicFor, setAddTopicFor] = useState(null); // { trackerKey, recId, typedName, subject } | null
  const bySubject = useMemo(() => {
    const m = {};
    db.classes.forEach(c => { m[c.subject] = m[c.subject] || []; m[c.subject].push(c); });
    return m;
  }, [db.classes]);
  return (
    <div>
      <div className="ucc-statgrid" style={{ marginBottom: 16 }}>
        {Object.keys(bySubject).length === 0 && <EmptyState>No classes logged yet — log your first class from Today's planner (Slot 2) or add one below.</EmptyState>}
        {Object.entries(bySubject).map(([subj, list]) => {
          const completed = list.filter(c => c.status === "Completed").length;
          return (
            <div className="ucc-stat" key={subj}>
              <div className="n">{completed}</div>
              <div className="l">{subj} classes completed (of {list.length} logged)</div>
            </div>
          );
        })}
      </div>
      <div className="ucc-card">
        <h3>Class completion tracker</h3>
        <div className="ucc-tiny" style={{ marginBottom: 8, color: "var(--ink-muted)" }}>
          Subject is scoped to GS Paper and comes from the Syllabus tab — new subjects can't be added here. Tag the Topics this class covered — pick an existing one, or use + Add new to place a brand new one on the Syllabus tab first.
        </div>
        <GenericTracker
          records={db.classes} setRecords={u => updateSlice("classes", u)} completionRequiresUpload
          columns={[
            { key: "date", label: "Date", type: "date", width: 120 },
            { key: "classNumber", label: "Class", type: "number", width: 70 },
            gsPaperColumn(),
            subjectSingleSelectColumn(db),
            microtopicTagColumn(db, "classes", setAddTopicFor, "Topic"),
            { key: "eta", label: "ETA", type: "date", width: 120 },
            { key: "status", label: "Status", type: "status", options: TASK_STATUS, width: 150 },
            {
              key: "driveFile", label: "Class Notes PDF", width: 170, type: "custom",
              render: (rec, onChange) => {
                const firstMicrotopic = (rec.microtopics && rec.microtopics[0] && resolveMicrotopicLabelById(db, rec.microtopics[0])) || null;
                return (
                  <DriveFileCell driveFile={rec.driveFile} db={db} updateSlice={updateSlice} onChange={onChange} folderKey="classes"
                    namePrefix={nextFileNamePrefix(db.classes, rec, r => normKey(r.gsPaper, r.microtopics && r.microtopics[0]), [
                      [rec.subject, firstMicrotopic],
                      [firstMicrotopic],
                    ])} />
                );
              },
            },
          ]}
          newRecord={() => ({ date: todayISO(), gsPaper: "", subject: "", classNumber: "", microtopics: [], eta: "", status: "Not Started", driveFile: null })}
        />
      </div>
      {addTopicFor && (
        <AddSyllabusRowPopup
          db={db} updateSlice={updateSlice}
          initialMicrotopic={addTopicFor.typedName} initialSubject={addTopicFor.subject}
          onCreated={(newId, createdSubject) => {
            updateSlice(addTopicFor.trackerKey, prev => prev.map(r => {
              if (r.id !== addTopicFor.recId) return r;
              return { ...r, microtopics: [...(r.microtopics || []), newId], subject: r.subject || createdSubject };
            }));
            setAddTopicFor(null);
          }}
          onClose={() => setAddTopicFor(null)}
        />
      )}
    </div>
  );
}

// Topic Completion — a computed overview of the other trackers, keyed 1:1
// to Syllabus rows (see the "TOPIC COMPLETION — COMPUTED-FIELD HELPERS"
// block above). Rows aren't added/removed here: add/edit Subject/Topic/
// Subtopic/Micro Topic on the Syllabus tab and a row shows up (or updates)
// automatically. Class Notes, Standard Material, NCERT, and Single Pager
// are all read-only, derived from Classes/Standard Books/NCERT/Single
// Pager. Revision 1 and 2 are the only fields actually set here — editing
// one patches this row's existing "reading" record (matched by syllabusId)
// or lazily creates one on the very first edit.
function ReadingTab({ db, updateSlice }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 100;

  const indexes = useMemo(() => buildTopicCompletionIndexes(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.classes, db.ncert, db.standardBooks, db.singlePager, db.reading]);

  const rows = useMemo(() => {
    return db.syllabus
      .map(row => ({ row, fields: computeTopicCompletionFields(row, indexes) }))
      .sort((a, b) => breadcrumb(a.row).localeCompare(breadcrumb(b.row)));
  }, [db.syllabus, indexes]);

  const filtered = query.trim()
    ? rows.filter(r => breadcrumb(r.row).toLowerCase().includes(query.trim().toLowerCase()))
    : rows;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function updateRevision(row, fields, patch) {
    updateSlice("reading", prev => {
      if (fields.readingRecId) {
        return prev.map(r => (r.id === fields.readingRecId ? { ...r, ...patch } : r));
      }
      return [...prev, {
        id: uid(), syllabusId: row.id, subject: row.subject, topic: row.topic, subtopic: row.subtopic, microtopic: row.microtopic,
        revision1: "Yet to Start", revision2: "Yet to Start", history: [], ...patch,
      }];
    });
  }

  return (
    <div className="ucc-card">
      <h3>Topic completion</h3>
      <p className="ucc-tiny" style={{ marginBottom: 8, color: "var(--ink-muted)" }}>
        One row per Syllabus entry, automatically — add or edit Subject/Topic/Subtopic/Micro Topic on the Syllabus tab, not here. Class Notes, Standard Material, NCERT, and Single Pager are computed from their own trackers; Revision 1 and 2 are the only fields you set here.
      </p>
      {db.syllabus.length === 0 ? (
        <EmptyState>No Syllabus entries yet — add some on the Syllabus tab first.</EmptyState>
      ) : (
        <>
          <input className="ucc-input" style={{ marginBottom: 10, maxWidth: 360 }}
            placeholder="Search subject / topic / subtopic / micro topic…"
            value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} />
          <table className="ucc-table">
            <thead>
              <tr>
                <th style={{ minWidth: 260 }}>Topic</th>
                <th style={{ minWidth: 150 }}>Class Notes</th>
                <th style={{ minWidth: 140 }}>Standard Material</th>
                <th style={{ minWidth: 110 }}>NCERT</th>
                <th style={{ minWidth: 120 }}>Single Pager</th>
                <th style={{ minWidth: 150 }}>Revision 1</th>
                <th style={{ minWidth: 150 }}>Revision 2</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && <tr><td colSpan={7}><EmptyState>No matches.</EmptyState></td></tr>}
              {paged.map(({ row, fields }) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{row.microtopic || row.subtopic || row.topic || "(untitled)"}</div>
                    <div className="ucc-tiny" style={{ color: "var(--ink-muted)" }}>{breadcrumb(row)}</div>
                  </td>
                  <td>
                    <div className="ucc-flex" style={{ gap: 4 }}>
                      <Badge tone={colorFor(fields.classNotes)}>{fields.classNotes}</Badge>
                      <DriveDownloadLink driveFile={fields.classNotesFile} />
                    </div>
                  </td>
                  <td><Badge tone={colorFor(fields.standardMaterial)}>{fields.standardMaterial}</Badge></td>
                  <td><Badge tone={colorFor(fields.ncert)}>{fields.ncert}</Badge></td>
                  <td><Badge tone={colorFor(fields.singlePager)}>{fields.singlePager}</Badge></td>
                  <td><StatusSelect value={fields.revision1} options={READ_STATUS} onChange={v => updateRevision(row, fields, { revision1: v })} /></td>
                  <td><StatusSelect value={fields.revision2} options={READ_STATUS} onChange={v => updateRevision(row, fields, { revision2: v })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > PAGE_SIZE && (
            <div className="ucc-flex between" style={{ marginTop: 8 }}>
              <span className="ucc-tiny">Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
              <div className="ucc-flex">
                <IconBtn icon={ChevronLeft} onClick={() => setPage(p => Math.max(0, p - 1))} title="Previous page" disabled={safePage === 0} />
                <span className="ucc-tiny">Page {safePage + 1} of {totalPages}</span>
                <IconBtn icon={ChevronRightIcon} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} title="Next page" disabled={safePage === totalPages - 1} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Plain text cell for a Syllabus row's own Micro Topic, committing on
// blur/Enter rather than on every keystroke — the caller decides what a
// commit means (direct set vs. propagate-everywhere) based on whether the
// row already had a value, so this stays a dumb input with local draft
// state only.
function SyllabusMicrotopicCell({ value, onCommit }) {
  const [draft, setDraft] = useState(value || "");
  useEffect(() => { setDraft(value || ""); }, [value]);
  function commit() {
    const trimmed = draft.trim();
    if (trimmed !== (value || "")) onCommit(trimmed);
  }
  return (
    <input className="ucc-input" value={draft} placeholder="Micro topic…"
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }} />
  );
}

function SyllabusTab({ db, updateSlice }) {
  const total = db.syllabus.length;
  // "Done" now means fully complete on the computed Topic Completion
  // overview (Class Notes + Standard Material + NCERT + Single Pager + both
  // revisions) — studyStatus/revisionStatus are never set by any UI
  // anymore (existing stored values on old rows are left alone, just no
  // longer read), so a stat based on them would always read 0.
  const topicCompletionIndexes = useMemo(() => buildTopicCompletionIndexes(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.classes, db.ncert, db.standardBooks, db.singlePager, db.reading]);
  const done = useMemo(
    () => db.syllabus.filter(row => topicCompletionScore(computeTopicCompletionFields(row, topicCompletionIndexes)) === 1).length,
    [db.syllabus, topicCompletionIndexes]
  );
  return (
    <div>
      <div className="ucc-card">
        <h3>Syllabus progress</h3>
        <div className="ucc-tiny">{done} of {total} syllabus items fully complete on Topic Completion.</div>
        <div className="ucc-tiny" style={{ marginTop: 6, color: "var(--ink-muted)" }}>
          This starts from the standard top-level UPSC structure only. Upload your actual syllabus PDF via Import/Export to expand it into real sub-topics — nothing here is a substitute for the official document.
        </div>
        <div className="ucc-tiny" style={{ marginTop: 6, color: "var(--ink-muted)" }}>
          <strong>Subject → Topic → Subtopic → Micro Topic</strong> are linked — pick each in order, or choose <strong>+ Add new</strong> to type one in. These also power the subject-wise dropdowns on the Class Lecture slot in Today's plan. New subjects are added to the shared list on the Settings tab automatically.
        </div>
        <div className="ucc-tiny" style={{ marginTop: 6, color: "var(--ink-muted)" }}>
          Picked the wrong Paper/Subject/Topic/Subtopic, or typo'd the Micro Topic, on a row? Just fix that field directly on the row below — Classes, NCERT, Standard Books, Single Pager, and Current Affairs entries already tagged to that exact Micro Topic follow along automatically. To rename a Subject/Topic/Subtopic/Micro Topic <em>everywhere it's used</em> (a genuine spelling fix affecting every Micro Topic under it, not just one), use "Rename a term" below instead.
        </div>
        <div className="ucc-tiny" style={{ marginTop: 6, color: "var(--ink-muted)" }}>
          <strong>Source Identified</strong> is read-only — it's Yes automatically once this exact Micro Topic appears in Classes, NCERT, or Standard Books, and No (or — with no Micro Topic set) otherwise.
        </div>
      </div>
      <SyllabusTermRenamer db={db} updateSlice={updateSlice} />
      <div className="ucc-card">
        <h3>All syllabus items</h3>
        <GenericTracker
          records={db.syllabus} setRecords={u => updateSlice("syllabus", u)}
          confirmRemove={rec => {
            const refs = countSyllabusRowReferences(db, rec);
            const label = [rec.subject, rec.topic, rec.subtopic, rec.microtopic].filter(Boolean).join(" → ") || "this row";
            return refs > 0
              ? `${label} is still referenced by ${refs} record${refs === 1 ? "" : "s"} in Classes/Reading/NCERT/Standard Books/Single Pager/Current Affairs/GS Answer Writing/Topper Copies. Deleting it will leave those pointing at nothing. Delete anyway?`
              : `Delete ${label}? This cannot be undone.`;
          }}
          columns={[
            { key: "gsPaper", label: "GS Paper", type: "select", options: GS_PAPER_OPTIONS, width: 140 },
            {
              // Plain reassignment cell: picking a different existing Subject
              // (or typing a new one) only ever changes this row's own
              // subject field. It deliberately does NOT clear
              // topic/subtopic/microtopic — this row's other fields might
              // already be correct and shouldn't be wiped out just because
              // the subject was mis-picked. Renaming a subject's *text*
              // everywhere it's used lives separately in
              // SyllabusTermRenamer above, not here.
              key: "subject", label: "Subject", width: 160, type: "custom",
              render: (rec, _onChange, updateRecord) => (
                <CascadingSelectCell
                  value={rec.subject} options={db.settings.subjects} placeholder="Select subject…"
                  onSelect={v => {
                    const nextRow = { ...rec, subject: v };
                    updateRecord({ subject: v });
                    syncSyllabusRowReferences(db, updateSlice, rec, nextRow);
                  }}
                  onAddNew={name => {
                    // New subjects join the shared master list (Settings tab)
                    // so they immediately appear in every other subject dropdown.
                    updateSlice("settings", s => (s.subjects.includes(name) ? s : { ...s, subjects: [...s.subjects, name] }));
                    const nextRow = { ...rec, subject: name };
                    updateRecord({ subject: name });
                    syncSyllabusRowReferences(db, updateSlice, rec, nextRow);
                  }}
                />
              ),
            },
            {
              key: "topic", label: "Topic", width: 200, type: "custom",
              render: (rec, _onChange, updateRecord) => (
                <CascadingSelectCell
                  value={rec.topic} options={syllabusTopicsForSubject(db, rec.subject)}
                  placeholder={rec.subject ? "Select topic…" : "Select subject first"} disabled={!rec.subject}
                  onSelect={v => {
                    const nextRow = { ...rec, topic: v };
                    updateRecord({ topic: v });
                    syncSyllabusRowReferences(db, updateSlice, rec, nextRow);
                  }}
                  onAddNew={name => {
                    const nextRow = { ...rec, topic: name };
                    updateRecord({ topic: name });
                    syncSyllabusRowReferences(db, updateSlice, rec, nextRow);
                  }}
                />
              ),
            },
            {
              key: "subtopic", label: "Subtopic", width: 200, type: "custom",
              render: (rec, _onChange, updateRecord) => (
                <CascadingSelectCell
                  value={rec.subtopic} options={syllabusSubtopicsForTopic(db, rec.subject, rec.topic)}
                  placeholder={rec.topic ? "Select subtopic…" : "Select topic first"} disabled={!rec.topic}
                  onSelect={v => {
                    const nextRow = { ...rec, subtopic: v };
                    updateRecord({ subtopic: v });
                    syncSyllabusRowReferences(db, updateSlice, rec, nextRow);
                  }}
                  onAddNew={name => {
                    const nextRow = { ...rec, subtopic: name };
                    updateRecord({ subtopic: name });
                    syncSyllabusRowReferences(db, updateSlice, rec, nextRow);
                  }}
                />
              ),
            },
            {
              // Plain editable text, not a dropdown — a Micro Topic is this
              // row's own identity, so fixing a typo is a direct edit right
              // here. Commits on blur/Enter (not per keystroke): if this row
              // already had a Micro Topic, the edit is treated as a genuine
              // rename and propagated everywhere it's used (Reading/NCERT/
              // Standard Books/Single Pager/Current Affairs, and Classes'
              // legacy text tags) via the same renameSyllabusValue "Rename a
              // term" uses. If it was empty (freshly added), nothing could
              // already reference it, so it's just set directly.
              key: "microtopic", label: "Micro Topic", width: 200, type: "custom",
              render: (rec, _onChange, updateRecord) => (
                <SyllabusMicrotopicCell
                  value={rec.microtopic}
                  onCommit={newValue => {
                    const oldValue = rec.microtopic;
                    if (oldValue && newValue) {
                      renameSyllabusValue(db, updateSlice, "microtopic", { subject: rec.subject, topic: rec.topic, subtopic: rec.subtopic }, oldValue, newValue);
                    } else {
                      updateRecord({ microtopic: newValue });
                    }
                  }}
                />
              ),
            },
            {
              key: "sourceIdentified", label: "Source Identified", width: 130, type: "custom",
              render: rec => rec.microtopic
                ? <Badge tone={isSourceIdentifiedForMicrotopic(db, rec) ? "green" : "grey"}>
                    {isSourceIdentifiedForMicrotopic(db, rec) ? "Yes" : "No"}
                  </Badge>
                : <span className="ucc-tiny" style={{ color: "var(--ink-muted)" }}>—</span>,
            },
          ]}
          newRecord={() => ({ gsPaper: "", subject: "", topic: "", subtopic: "", microtopic: "" })}
          emptyMessage="No syllabus items yet — click Add row below to add your first topic."
        />
      </div>
    </div>
  );
}

// Dedicated, separate tool for the one genuinely different operation:
// renaming a Subject/Topic/Subtopic/Micro Topic's *text* everywhere it's
// used (Classes, NCERT, Standard Books, etc.) — for fixing a real spelling
// mistake in a shared name, not for correcting one row's own selection
// (that happens inline in the table above via renameSyllabusValue).
// Kept as its own collapsed-by-default panel so it's never confused with,
// or accidentally triggered from, the per-row editing controls.
function SyllabusTermRenamer({ db, updateSlice }) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState("subject");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [oldValue, setOldValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [done, setDone] = useState("");

  const topicOptions = subject ? syllabusTopicsForSubject(db, subject) : [];
  const subtopicOptions = (subject && topic) ? syllabusSubtopicsForTopic(db, subject, topic) : [];
  const microtopicOptions = (subject && topic && subtopic) ? microtopicOptionsForSubtopic(db, subject, topic, subtopic) : [];
  const valueOptions = level === "subject" ? db.settings.subjects
    : level === "topic" ? topicOptions
    : level === "subtopic" ? subtopicOptions
    : microtopicOptions;
  const contextReady = level === "subject" ? true
    : level === "topic" ? !!subject
    : level === "subtopic" ? !!(subject && topic)
    : !!(subject && topic && subtopic);

  function resetForm() {
    setSubject(""); setTopic(""); setSubtopic(""); setOldValue(""); setNewValue("");
  }

  function handleRename() {
    const trimmed = newValue.trim();
    if (!oldValue || !trimmed || trimmed === oldValue) return;
    const context = level === "subject" ? {} : level === "topic" ? { subject } : level === "subtopic" ? { subject, topic } : { subject, topic, subtopic };
    renameSyllabusValue(db, updateSlice, level, context, oldValue, trimmed);
    setDone(`Renamed "${oldValue}" to "${trimmed}" everywhere it's used.`);
    setOldValue(""); setNewValue("");
    setTimeout(() => setDone(""), 5000);
  }

  return (
    <div className="ucc-card">
      <h3>Rename a term</h3>
      <p className="ucc-tiny">
        For fixing a spelling mistake in a Subject/Topic/Subtopic/Micro Topic name that's already used across multiple rows or trackers — this renames it everywhere (Classes, NCERT, Standard Books, etc.), not just one row.
      </p>
      {!open ? (
        <button className="ucc-btn ghost" onClick={() => setOpen(true)}><Pencil size={13} /> Rename a term</button>
      ) : (
        <div style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 12 }}>
          <div className="ucc-grid">
            <div>
              <label className="ucc-tiny">Level</label>
              <select className="ucc-select" value={level}
                onChange={e => { setLevel(e.target.value); resetForm(); }}>
                <option value="subject">Subject</option>
                <option value="topic">Topic</option>
                <option value="subtopic">Subtopic</option>
                <option value="microtopic">Micro Topic</option>
              </select>
            </div>
            {level !== "subject" && (
              <div>
                <label className="ucc-tiny">Subject</label>
                <select className="ucc-select" value={subject}
                  onChange={e => { setSubject(e.target.value); setTopic(""); setSubtopic(""); setOldValue(""); }}>
                  <option value="">Select subject…</option>
                  {db.settings.subjects.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}
            {(level === "subtopic" || level === "microtopic") && (
              <div>
                <label className="ucc-tiny">Topic</label>
                <select className="ucc-select" value={topic} disabled={!subject}
                  onChange={e => { setTopic(e.target.value); setSubtopic(""); setOldValue(""); }}>
                  <option value="">Select topic…</option>
                  {topicOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}
            {level === "microtopic" && (
              <div>
                <label className="ucc-tiny">Subtopic</label>
                <select className="ucc-select" value={subtopic} disabled={!topic}
                  onChange={e => { setSubtopic(e.target.value); setOldValue(""); }}>
                  <option value="">Select subtopic…</option>
                  {subtopicOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="ucc-tiny">Current value</label>
              <select className="ucc-select" value={oldValue} disabled={!contextReady}
                onChange={e => setOldValue(e.target.value)}>
                <option value="">Select value…</option>
                {valueOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="ucc-tiny">New value</label>
              <input className="ucc-input" value={newValue} onChange={e => setNewValue(e.target.value)}
                placeholder="Corrected spelling" disabled={!oldValue} />
            </div>
          </div>
          <div className="ucc-flex" style={{ marginTop: 10 }}>
            <button className="ucc-btn primary" disabled={!oldValue || !newValue.trim() || newValue.trim() === oldValue} onClick={handleRename}>
              <Check size={13} /> Rename everywhere
            </button>
            <button className="ucc-btn ghost" onClick={() => { setOpen(false); resetForm(); }}>Cancel</button>
          </div>
        </div>
      )}
      {done && <div className="ucc-tiny" style={{ marginTop: 8, color: "var(--green)" }}>{done}</div>}
    </div>
  );
}

function SinglePagerTab({ db, updateSlice }) {
  const [addTopicFor, setAddTopicFor] = useState(null);
  return (
    <div className="ucc-card">
      <h3>Single pager notes</h3>
      {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <div className="ucc-tiny" style={{ marginBottom: 8 }}>
          PDF upload/download needs Google Drive configured — add <code>VITE_GOOGLE_CLIENT_ID</code> to your <code>.env</code> (see README).
        </div>
      )}
      <div className="ucc-tiny" style={{ marginBottom: 8, color: "var(--ink-muted)" }}>
        Subject is scoped to GS Paper and comes from the Syllabus tab — new subjects can't be added here. Tag the Topics this single-pager covers — pick an existing one, or use + Add new to place a brand new one on the Syllabus tab first.
      </div>
      <GenericTracker
        records={db.singlePager} setRecords={u => updateSlice("singlePager", u)} completionRequiresUpload
        columns={[
          { key: "date", label: "Date", type: "date", width: 110 },
          gsPaperColumn(),
          subjectSingleSelectColumn(db),
          microtopicTagColumn(db, "singlePager", setAddTopicFor, "Topic"),
          { key: "classNotes", label: "Class Notes", type: "select", options: INCLUSION_OPTIONS, width: 120 },
          { key: "handout", label: "Handout", type: "select", options: INCLUSION_OPTIONS, width: 120 },
          { key: "ncert", label: "NCERT", type: "select", options: INCLUSION_OPTIONS, width: 120 },
          { key: "standardBooks", label: "Standard Books", type: "select", options: INCLUSION_OPTIONS, width: 130 },
          { key: "status", label: "Status", type: "status", options: SP_STATUS, width: 120 },
          {
            key: "driveFile", label: "Single Page PDF", width: 170, type: "custom",
            render: (rec, onChange) => {
              const firstMicrotopic = (rec.microtopics && rec.microtopics[0] && resolveMicrotopicLabelById(db, rec.microtopics[0])) || null;
              return (
                <DriveFileCell driveFile={rec.driveFile} db={db} updateSlice={updateSlice} onChange={onChange} folderKey="singlePager"
                  namePrefix={nextFileNamePrefix(db.singlePager, rec, r => normKey(r.gsPaper, r.microtopics && r.microtopics[0]), [
                    [rec.subject, firstMicrotopic],
                    [firstMicrotopic],
                  ])} />
              );
            },
          },
          { key: "revision", label: "Revision", type: "status", options: READ_STATUS, width: 130 },
        ]}
        newRecord={() => ({ date: todayISO(), gsPaper: "", subject: "", microtopics: [], classNotes: "Not Included", handout: "Not Included", ncert: "Not Included", standardBooks: "Not Included", status: "Not Started", driveFile: null, revision: "Yet to Start" })}
      />
      {addTopicFor && (
        <AddSyllabusRowPopup
          db={db} updateSlice={updateSlice}
          initialMicrotopic={addTopicFor.typedName} initialSubject={addTopicFor.subject}
          onCreated={(newId, createdSubject) => {
            updateSlice(addTopicFor.trackerKey, prev => prev.map(r => {
              if (r.id !== addTopicFor.recId) return r;
              return { ...r, microtopics: [...(r.microtopics || []), newId], subject: r.subject || createdSubject };
            }));
            setAddTopicFor(null);
          }}
          onClose={() => setAddTopicFor(null)}
        />
      )}
    </div>
  );
}

function NcertTab({ db, updateSlice }) {
  const [addTopicFor, setAddTopicFor] = useState(null);
  return (
    <div className="ucc-card">
      <h3>NCERT tracker</h3>
      <div className="ucc-tiny" style={{ marginBottom: 8, color: "var(--ink-muted)" }}>
        Subject is scoped to GS Paper and comes from the Syllabus tab — new subjects can't be added here. Tag the Topics this book/chapter covers — pick an existing one, or use + Add new to place a brand new one on the Syllabus tab first.
      </div>
      <GenericTracker
        records={db.ncert} setRecords={u => updateSlice("ncert", u)}
        columns={[
          gsPaperColumn(),
          subjectSingleSelectColumn(db),
          microtopicTagColumn(db, "ncert", setAddTopicFor, "Topic"),
          { key: "book", label: "Book", width: 150 },
          { key: "chapter", label: "Chapter", width: 140 },
        ]}
        newRecord={() => ({ gsPaper: "", subject: "", microtopics: [], book: "", chapter: "" })}
      />
      {addTopicFor && (
        <AddSyllabusRowPopup
          db={db} updateSlice={updateSlice}
          initialMicrotopic={addTopicFor.typedName} initialSubject={addTopicFor.subject}
          onCreated={(newId, createdSubject) => {
            updateSlice(addTopicFor.trackerKey, prev => prev.map(r => {
              if (r.id !== addTopicFor.recId) return r;
              return { ...r, microtopics: [...(r.microtopics || []), newId], subject: r.subject || createdSubject };
            }));
            setAddTopicFor(null);
          }}
          onClose={() => setAddTopicFor(null)}
        />
      )}
    </div>
  );
}

function StandardBooksTab({ db, updateSlice }) {
  const [addTopicFor, setAddTopicFor] = useState(null);
  return (
    <div className="ucc-card">
      <h3>Standard book tracker</h3>
      <div className="ucc-tiny" style={{ marginBottom: 8, color: "var(--ink-muted)" }}>
        Subject is scoped to GS Paper and comes from the Syllabus tab — new subjects can't be added here. Tag the Topics this book/chapter covers — pick an existing one, or use + Add new to place a brand new one on the Syllabus tab first.
      </div>
      <GenericTracker
        records={db.standardBooks} setRecords={u => updateSlice("standardBooks", u)}
        columns={[
          gsPaperColumn(),
          subjectSingleSelectColumn(db),
          microtopicTagColumn(db, "standardBooks", setAddTopicFor, "Topic"),
          { key: "bookName", label: "Book", width: 150 },
          { key: "chapter", label: "Chapter", width: 140 },
          { key: "pages", label: "Pages", width: 80 },
        ]}
        newRecord={() => ({ bookName: "", gsPaper: "", subject: "", chapter: "", microtopics: [], pages: "" })}
      />
      {addTopicFor && (
        <AddSyllabusRowPopup
          db={db} updateSlice={updateSlice}
          initialMicrotopic={addTopicFor.typedName} initialSubject={addTopicFor.subject}
          onCreated={(newId, createdSubject) => {
            updateSlice(addTopicFor.trackerKey, prev => prev.map(r => {
              if (r.id !== addTopicFor.recId) return r;
              return { ...r, microtopics: [...(r.microtopics || []), newId], subject: r.subject || createdSubject };
            }));
            setAddTopicFor(null);
          }}
          onClose={() => setAddTopicFor(null)}
        />
      )}
    </div>
  );
}

function TamilTab({ db, updateSlice }) {
  const [sub, setSub] = useState("reading");
  const topicOptions = syllabusTopicsForSubject(db, "Tamil Literature");
  return (
    <div className="ucc-card">
      <div className="ucc-tabbar">
        <button className={sub === "reading" ? "active" : ""} onClick={() => setSub("reading")}>Reading</button>
        <button className={sub === "writing" ? "active" : ""} onClick={() => setSub("writing")}>Answer Writing</button>
      </div>
      <div className="ucc-tiny" style={{ margin: "8px 0", color: "var(--ink-muted)" }}>
        Topic is chosen from the Syllabus tab (Subject: Tamil Literature) — new topics can't be added here.
      </div>
      {sub === "reading" ? (
        <GenericTracker
          records={db.tamilReading} setRecords={u => updateSlice("tamilReading", u)}
          columns={[
            {
              key: "topic", label: "Topic", width: 200, type: "custom",
              render: (rec, _onChange, updateRecord) => (
                <CascadingSelectCell
                  value={rec.topic} options={topicOptions} allowAddNew={false}
                  placeholder={topicOptions.length ? "Select topic…" : "Add Tamil Literature topics on Syllabus tab"}
                  onSelect={v => updateRecord({ topic: v })}
                />
              ),
            },
            { key: "source", label: "Source", width: 160 },
            { key: "notes", label: "What I've Learned", type: "textarea", width: 220 },
            {
              key: "driveFile", label: "PDF", width: 170, type: "custom",
              render: (rec, onChange) => <DriveFileCell driveFile={rec.driveFile} db={db} updateSlice={updateSlice} onChange={onChange} folderKey="tamilReading"
              namePrefix={nextFileNamePrefix(db.tamilReading, rec, r => normKey(r.topic), ["TamilLiterature", rec.topic])} />,
            },
          ]}
          newRecord={() => ({ topic: "", source: "", notes: "", driveFile: null })}
        />
      ) : (
        <GenericTracker
          records={db.tamilWriting} setRecords={u => updateSlice("tamilWriting", u)} completionRequiresUpload
          columns={[
            { key: "date", label: "Date", type: "date", width: 110 },
            {
              key: "topic", label: "Topic", width: 160, type: "custom",
              render: (rec, _onChange, updateRecord) => (
                <CascadingSelectCell
                  value={rec.topic} options={topicOptions} allowAddNew={false}
                  placeholder={topicOptions.length ? "Select topic…" : "Add Tamil Literature topics on Syllabus tab"}
                  onSelect={v => updateRecord({ topic: v })}
                />
              ),
            },
            { key: "question", label: "Question", type: "textarea", width: 240 },
            { key: "wordLimit", label: "Word Limit", type: "number", width: 90 },
            { key: "selfEvaluation", label: "Remarks Summary", type: "textarea", width: 180 },
            { key: "marksScored", label: "Marks Scored", type: "number", width: 100 },
            { key: "marksMax", label: "Max Marks", type: "number", width: 100 },
            { key: "status", label: "Status", type: "status", options: TASK_STATUS, width: 140 },
            {
              key: "driveFile", label: "Answer PDF", width: 170, type: "custom",
              render: (rec, onChange) => <DriveFileCell driveFile={rec.driveFile} db={db} updateSlice={updateSlice} onChange={onChange} folderKey="tamilWriting"
              namePrefix={nextFileNamePrefix(db.tamilWriting, rec, r => normKey(r.topic), ["TamilLiterature", rec.topic])} />,
            },
          ]}
          newRecord={() => ({ date: todayISO(), topic: "", question: "", wordLimit: 150, answerWritten: "", selfEvaluation: "", marksScored: "", marksMax: "", status: "Not Started", driveFile: null })}
        />
      )}
    </div>
  );
}

function CurrentAffairsTab({ db, updateSlice }) {
  return (
    <div className="ucc-card">
      <h3>Current affairs</h3>
      <div className="ucc-tiny" style={{ marginBottom: 8, color: "var(--ink-muted)" }}>
        Subject/Topic/Subtopic/Micro Topic are linked to the Syllabus tab. Picking <strong>+ Add new</strong> here adds it to Syllabus too — current affairs is the one other place besides Syllabus a genuinely new topic can be created.
      </div>
      <GenericTracker
        records={db.currentAffairs} setRecords={u => updateSlice("currentAffairs", u)}
        columns={[
          { key: "date", label: "Date", type: "date", width: 110 },
          { key: "title", label: "Topic / Title", width: 200 },
          { key: "source", label: "Source", type: "select", options: CA_SOURCES, width: 130 },
          {
            key: "subject", label: "Subject", width: 150, type: "custom",
            render: (rec, _onChange, updateRecord) => (
              <CascadingSelectCell
                value={rec.subject} options={db.settings.subjects} placeholder="Select subject…"
                onSelect={v => updateRecord({ subject: v, relevantSyllabusTopic: "", subtopic: "", microtopic: "", syllabusId: null })}
                onAddNew={name => {
                  updateSlice("settings", s => (s.subjects.includes(name) ? s : { ...s, subjects: [...s.subjects, name] }));
                  updateRecord({ subject: name, relevantSyllabusTopic: "", subtopic: "", microtopic: "", syllabusId: null });
                }}
              />
            ),
          },
          {
            key: "relevantSyllabusTopic", label: "Topic", width: 180, type: "custom",
            render: (rec, _onChange, updateRecord) => (
              <CascadingSelectCell
                value={rec.relevantSyllabusTopic} options={syllabusTopicsForSubject(db, rec.subject)}
                placeholder={rec.subject ? "Select topic…" : "Select subject first"} disabled={!rec.subject}
                onSelect={v => updateRecord({ relevantSyllabusTopic: v, subtopic: "", microtopic: "", syllabusId: findSyllabusId(db, { subject: rec.subject, topic: v }) })}
                onAddNew={name => {
                  // A genuinely new current-affairs topic is added to the
                  // Syllabus tracker itself (the single source of truth),
                  // never stored only as free text on this row. Its id is
                  // captured directly — no need to re-search for it.
                  const newId = uid();
                  updateSlice("syllabus", prev => [...prev, {
                    id: newId, gsPaper: defaultGsPaperForSubject(db, rec.subject), subject: rec.subject, topic: name, subtopic: "", microtopic: "",
                    history: [],
                  }]);
                  updateRecord({ relevantSyllabusTopic: name, subtopic: "", microtopic: "", syllabusId: newId });
                }}
              />
            ),
          },
          {
            key: "subtopic", label: "Subtopic", width: 150, type: "custom",
            render: (rec, _onChange, updateRecord) => (
              <CascadingSelectCell
                value={rec.subtopic} options={syllabusSubtopicsForTopic(db, rec.subject, rec.relevantSyllabusTopic)}
                placeholder={rec.relevantSyllabusTopic ? "Select subtopic…" : "Select topic first"} disabled={!rec.relevantSyllabusTopic}
                onSelect={v => updateRecord({ subtopic: v, microtopic: "", syllabusId: findSyllabusId(db, { subject: rec.subject, topic: rec.relevantSyllabusTopic, subtopic: v }) })}
                onAddNew={name => {
                  const newId = uid();
                  updateSlice("syllabus", prev => [...prev, {
                    id: newId, gsPaper: defaultGsPaperForSubject(db, rec.subject), subject: rec.subject, topic: rec.relevantSyllabusTopic, subtopic: name, microtopic: "",
                    history: [],
                  }]);
                  updateRecord({ subtopic: name, microtopic: "", syllabusId: newId });
                }}
              />
            ),
          },
          {
            key: "microtopic", label: "Micro Topic", width: 150, type: "custom",
            render: (rec, _onChange, updateRecord) => (
              <CascadingSelectCell
                value={rec.microtopic} options={microtopicOptionsForSubtopic(db, rec.subject, rec.relevantSyllabusTopic, rec.subtopic)}
                placeholder={rec.subtopic ? "Select micro topic…" : "Select subtopic first"} disabled={!rec.subtopic}
                onSelect={v => updateRecord({ microtopic: v, syllabusId: findSyllabusId(db, { subject: rec.subject, topic: rec.relevantSyllabusTopic, subtopic: rec.subtopic, microtopic: v }) })}
                onAddNew={name => {
                  const newId = uid();
                  updateSlice("syllabus", prev => [...prev, {
                    id: newId, gsPaper: defaultGsPaperForSubject(db, rec.subject), subject: rec.subject, topic: rec.relevantSyllabusTopic, subtopic: rec.subtopic, microtopic: name,
                    history: [],
                  }]);
                  updateRecord({ microtopic: name, syllabusId: newId });
                }}
              />
            ),
          },
          {
            key: "driveFile", label: "Clipping / PDF", width: 170, type: "custom",
            render: (rec, onChange) => <DriveFileCell driveFile={rec.driveFile} db={db} updateSlice={updateSlice} onChange={onChange} folderKey="currentAffairs"
                namePrefix={nextFileNamePrefix(db.currentAffairs, rec, r => normKey(r.subject, r.subtopic || r.relevantSyllabusTopic), [
                  [rec.subject, rec.subtopic, rec.microtopic],
                  [rec.subject, rec.microtopic],
                  [rec.microtopic],
                ])} />,
          },
        ]}
        newRecord={() => ({ date: todayISO(), title: "", source: CA_SOURCES[0], subject: "", subtopic: "", microtopic: "", relevantSyllabusTopic: "", notes: "", driveFile: null, syllabusId: null })}
      />
    </div>
  );
}

// GS Paper column, shared by every tracker using this paper/subject/micro
// topic pattern (both Answer Writing sub-tabs, and Classes/NCERT/Standard
// Books/Single Pager) — plain select, no side effects on change
// (Subject/Micro Topic below use their own scoping and deliberately
// aren't cleared just because GS Paper changed).
function gsPaperColumn() {
  return {
    key: "gsPaper", label: "GS Paper", width: 90, type: "custom",
    render: (rec, _onChange, updateRecord) => (
      <select className="ucc-select" value={rec.gsPaper || ""} onChange={e => updateRecord({ gsPaper: e.target.value })}>
        {GS_PAPERS.map(g => <option key={g} value={g}>{g}</option>)}
      </select>
    ),
  };
}
// Subject tag column — Answer Writing/Topper Copies only, where one row can
// legitimately span several Subjects. A tag multi-select, options strictly
// the Subjects already on Syllabus under this row's GS Paper, no add-new:
// Subject stays Syllabus-governed.
function subjectTagColumn(db) {
  return {
    key: "subjects", label: "Subject", width: 170, type: "custom",
    render: (rec, _onChange, updateRecord) => {
      const options = Array.from(new Set(db.syllabus.filter(s => s.gsPaper === GS_PAPER_SHORT_TO_LONG[rec.gsPaper] && s.subject).map(s => s.subject)))
        .map(s => ({ value: s, label: s }));
      return (
        <TagMultiSelectCell
          values={rec.subjects || []} options={options}
          placeholder={options.length ? "+ Add subject" : "Set GS Paper on Syllabus subjects first"}
          disabled={!rec.gsPaper}
          onChange={v => updateRecord({ subjects: v })}
        />
      );
    },
  };
}
// Subject single-select column — Classes/NCERT/Standard Books/Single
// Pager, where (unlike Answer Writing) one row is always one Subject's
// material (one class, one chapter, one single-pager). allowAddNew is off
// here too: Subject stays purely Syllabus-governed on every tracker using
// this pattern now, not just Answer Writing — a genuinely new Subject is
// added on the Syllabus/Settings tab instead.
function subjectSingleSelectColumn(db) {
  return {
    key: "subject", label: "Subject", width: 150, type: "custom",
    render: (rec, _onChange, updateRecord) => {
      const options = Array.from(new Set(db.syllabus.filter(s => s.gsPaper === GS_PAPER_SHORT_TO_LONG[rec.gsPaper] && s.subject).map(s => s.subject)));
      return (
        <CascadingSelectCell
          value={rec.subject} options={options} allowAddNew={false}
          placeholder={rec.gsPaper ? "Select subject…" : "Select GS Paper first"} disabled={!rec.gsPaper}
          onSelect={v => updateRecord({ subject: v })}
        />
      );
    },
  };
}
// Micro Topic tag column — shared by Answer Writing/Topper Copies (Subject
// is a tag array there, rec.subjects) and Classes/NCERT/Standard Books/
// Single Pager (Subject is single-select there, rec.subject); works with
// either, since it just needs a list of Subjects to scope by. Tag
// multi-select linked straight to Syllabus Micro Topics, deliberately
// skipping Syllabus's own Topic/Subtopic levels: options are every Micro
// Topic under whichever Subject(s) apply to this row (across all their
// Topics/Subtopics), since one row can draw on several. "+ Add new"
// doesn't invent a row inline — it opens AddSyllabusRowPopup via
// setAddTopicFor, tagged with which tracker (`trackerKey`) the new row
// should attach to, since there's no single Topic/Subtopic here to safely
// assume (even with one Subject, there could be many Topics under it).
function microtopicTagColumn(db, trackerKey, setAddTopicFor, label = "Micro Topic") {
  return {
    key: "microtopics", label, width: 220, type: "custom",
    render: (rec, _onChange, updateRecord) => {
      const subjects = rec.subjects || (rec.subject ? [rec.subject] : []);
      const values = rec.microtopics || (rec.topic ? [rec.topic] : []);
      const options = microtopicRowOptionsForSubjects(db, subjects);
      return (
        <TagMultiSelectCell
          values={values} options={options} allowAddNew
          resolveLabel={v => resolveMicrotopicLabelById(db, v)}
          placeholder={subjects.length ? `+ Add ${label.toLowerCase()}` : "Add a Subject first, or + Add new"}
          onChange={v => updateRecord({ microtopics: v })}
          onAddNew={name => setAddTopicFor({ trackerKey, recId: rec.id, typedName: name, subject: subjects.length === 1 ? subjects[0] : "" })}
        />
      );
    },
  };
}

// Small popup replicating the Syllabus tab's own "add a row" flow — GS
// Paper/Subject/Topic/Subtopic pickers plus a Micro Topic text field
// (pre-filled with whatever was just typed into the tag input) — rather
// than silently inheriting context like Classes' Micro Topic add-new does.
// Answer Writing's Micro Topic tags link across several Subjects at once,
// so there's no single Subject/Topic/Subtopic to safely assume; letting
// the person place the new row properly, the same way they would on
// Syllabus itself, avoids guessing wrong.
function AddSyllabusRowPopup({ db, updateSlice, initialMicrotopic, initialSubject, onCreated, onClose }) {
  const [gsPaper, setGsPaper] = useState("");
  const [subject, setSubject] = useState(initialSubject || "");
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [microtopic, setMicrotopic] = useState(initialMicrotopic || "");

  const topicOptions = subject ? syllabusTopicsForSubject(db, subject) : [];
  const subtopicOptions = (subject && topic) ? syllabusSubtopicsForTopic(db, subject, topic) : [];
  const canAdd = subject.trim() && microtopic.trim();

  function handleAdd() {
    if (!canAdd) return;
    const newId = uid();
    updateSlice("syllabus", prev => [...prev, {
      id: newId,
      gsPaper: gsPaper || defaultGsPaperForSubject(db, subject),
      subject: subject.trim(), topic: topic.trim(), subtopic: subtopic.trim(), microtopic: microtopic.trim(),
      history: [],
    }]);
    onCreated(newId, subject.trim());
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
      onClick={onClose}>
      <div className="ucc-card" style={{ width: 360, maxWidth: "90vw", margin: 0 }} onClick={e => e.stopPropagation()}>
        <h3>Add to Syllabus</h3>
        <p className="ucc-tiny" style={{ marginBottom: 10 }}>
          Creates a real row on the Syllabus tab, same as adding one there — then tags it to this answer.
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <label className="ucc-tiny">GS Paper</label>
            <select className="ucc-select" value={gsPaper} onChange={e => setGsPaper(e.target.value)}>
              <option value="">Select GS Paper…</option>
              {GS_PAPER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="ucc-tiny">Subject</label>
            <CascadingSelectCell
              value={subject} options={db.settings.subjects} placeholder="Select subject…"
              onSelect={v => { setSubject(v); setTopic(""); setSubtopic(""); }}
              onAddNew={name => {
                updateSlice("settings", s => (s.subjects.includes(name) ? s : { ...s, subjects: [...s.subjects, name] }));
                setSubject(name); setTopic(""); setSubtopic("");
              }}
            />
          </div>
          <div>
            <label className="ucc-tiny">Topic (optional)</label>
            <CascadingSelectCell
              value={topic} options={topicOptions} disabled={!subject}
              placeholder={subject ? "Select topic…" : "Select subject first"}
              onSelect={v => { setTopic(v); setSubtopic(""); }}
              onAddNew={name => { setTopic(name); setSubtopic(""); }}
            />
          </div>
          <div>
            <label className="ucc-tiny">Subtopic (optional)</label>
            <CascadingSelectCell
              value={subtopic} options={subtopicOptions} disabled={!topic}
              placeholder={topic ? "Select subtopic…" : "Select topic first"}
              onSelect={v => setSubtopic(v)}
              onAddNew={name => setSubtopic(name)}
            />
          </div>
          <div>
            <label className="ucc-tiny">Micro Topic</label>
            <input className="ucc-input" autoFocus={!initialMicrotopic} value={microtopic} onChange={e => setMicrotopic(e.target.value)} placeholder="Micro topic…" />
          </div>
        </div>
        <div className="ucc-flex" style={{ marginTop: 12 }}>
          <button className="ucc-btn primary" disabled={!canAdd} onClick={handleAdd}><Plus size={13} /> Add to Syllabus</button>
          <button className="ucc-btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function AnswerWritingTab({ db, updateSlice }) {
  const [sub, setSub] = useState("mine");
  const [addTopicFor, setAddTopicFor] = useState(null); // { trackerKey, recId, typedName, subject } | null
  return (
    <div className="ucc-card">
      <div className="ucc-tabbar">
        <button className={sub === "mine" ? "active" : ""} onClick={() => setSub("mine")}>Answer Writing</button>
        <button className={sub === "topper" ? "active" : ""} onClick={() => setSub("topper")}>Topper Copies</button>
      </div>
      {sub === "mine" ? (
        <>
          <div className="ucc-tiny" style={{ margin: "8px 0", color: "var(--ink-muted)" }}>
            Subject is scoped to the GS Paper and comes from the Syllabus tab — new subjects can't be added here. Micro Topic tags every Micro Topic under whichever Subject(s) are picked (across all their Topics/Subtopics) — pick as many as the answer actually touched, or use <strong>+ Add new</strong> to place a brand new one on the Syllabus tab first.
          </div>
          <GenericTracker
            records={db.answerWriting} setRecords={u => updateSlice("answerWriting", u)} completionRequiresUpload
            columns={[
              { key: "date", label: "Date", type: "date", width: 110 },
              gsPaperColumn(),
              subjectTagColumn(db),
              microtopicTagColumn(db, "answerWriting", setAddTopicFor),
              { key: "question", label: "Question", type: "textarea", width: 240 },
              { key: "wordLimit", label: "Word Limit", type: "number", width: 90 },
              { key: "status", label: "Status", type: "status", options: TASK_STATUS, width: 140 },
              { key: "selfScore", label: "Self Score", width: 80 },
              { key: "improvementNotes", label: "Improvement Notes", type: "textarea", width: 200 },
              {
                key: "driveFile", label: "Answer PDF", width: 170, type: "custom",
                render: (rec, onChange) => {
                  const firstMicrotopic = (rec.microtopics && rec.microtopics[0] && resolveMicrotopicLabelById(db, rec.microtopics[0])) || rec.topic;
                  return (
                    <DriveFileCell driveFile={rec.driveFile} db={db} updateSlice={updateSlice} onChange={onChange} folderKey="answerWriting"
                      namePrefix={nextFileNamePrefix(db.answerWriting, rec, r => normKey(r.gsPaper, r.microtopics && r.microtopics[0]), [rec.gsPaper, firstMicrotopic])} />
                  );
                },
              },
            ]}
            newRecord={() => ({ date: todayISO(), gsPaper: "GS1", subjects: [], microtopics: [], question: "", wordLimit: 150, answer: "", status: "Not Started", selfScore: "", improvementNotes: "", driveFile: null })}
          />
        </>
      ) : (
        <>
          <div className="ucc-tiny" style={{ margin: "8px 0", color: "var(--ink-muted)" }}>
            Subject and Micro Topic work exactly like the Answer Writing sub-tab — Subject from Syllabus, Micro Topic tagging every Micro Topic under the picked Subject(s), with <strong>+ Add new</strong> opening the same popup. For a topper's own answer — no Word Limit or Self Score to fill in, since you didn't write it. Use Observations for what stands out about their approach. Status can only be marked Completed once the Topper Copy PDF is uploaded, and the row locks after — Question and Observations stay scrollable to re-read even while locked.
          </div>
          <GenericTracker
            records={db.topperCopies} setRecords={u => updateSlice("topperCopies", u)} completionRequiresUpload
            columns={[
              { key: "date", label: "Date", type: "date", width: 110 },
              gsPaperColumn(),
              subjectTagColumn(db),
              microtopicTagColumn(db, "topperCopies", setAddTopicFor),
              { key: "question", label: "Question", type: "textarea", width: 240, readableWhenLocked: true },
              { key: "observations", label: "Observations", type: "textarea", width: 220, readableWhenLocked: true },
              { key: "status", label: "Status", type: "status", options: TOPPER_STATUS, width: 130 },
              {
                key: "driveFile", label: "Topper Copy PDF", width: 170, type: "custom",
                render: (rec, onChange) => {
                  const firstMicrotopic = (rec.microtopics && rec.microtopics[0] && resolveMicrotopicLabelById(db, rec.microtopics[0])) || rec.topic;
                  return (
                    <DriveFileCell driveFile={rec.driveFile} db={db} updateSlice={updateSlice} onChange={onChange} folderKey="topperCopies"
                      namePrefix={nextFileNamePrefix(db.topperCopies, rec, r => normKey(r.gsPaper, r.microtopics && r.microtopics[0]), [rec.gsPaper, firstMicrotopic])} />
                  );
                },
              },
            ]}
            newRecord={() => ({ date: todayISO(), gsPaper: "GS1", subjects: [], microtopics: [], question: "", observations: "", status: "Not Completed", driveFile: null })}
            emptyMessage="No topper copies logged yet — click Add row below to add your first one."
          />
        </>
      )}
      {addTopicFor && (
        <AddSyllabusRowPopup
          db={db} updateSlice={updateSlice}
          initialMicrotopic={addTopicFor.typedName} initialSubject={addTopicFor.subject}
          onCreated={(newId, createdSubject) => {
            updateSlice(addTopicFor.trackerKey, prev => prev.map(r => {
              if (r.id !== addTopicFor.recId) return r;
              const nextSubjects = (r.subjects || []).includes(createdSubject) ? (r.subjects || []) : [...(r.subjects || []), createdSubject];
              return { ...r, microtopics: [...(r.microtopics || []), newId], subjects: nextSubjects };
            }));
            setAddTopicFor(null);
          }}
          onClose={() => setAddTopicFor(null)}
        />
      )}
    </div>
  );
}

function AiLearningTab({ db, updateSlice }) {
  return (
    <div className="ucc-card">
      <h3>AI learning (personal, outside UPSC syllabus)</h3>
      <GenericTracker
        records={db.aiLearning} setRecords={u => updateSlice("aiLearning", u)}
        columns={[
          { key: "date", label: "Date", type: "date", width: 110 },
          { key: "topic", label: "Topic", width: 220 },
          { key: "duration", label: "Duration (min)", type: "number", width: 100 },
          { key: "status", label: "Status", type: "status", options: AI_STATUS, width: 120 },
          { key: "notes", label: "Notes", type: "textarea", width: 260 },
        ]}
        newRecord={() => ({ date: todayISO(), topic: "", duration: 60, status: "Not Started", notes: "" })}
      />
    </div>
  );
}

/* ============================================================
   TOPIC MASTER PAGE
   ============================================================ */
function DashboardTab({ db }) {
  const settings = db.settings;

  // Source Mapping % and Overall Topic Completion % — computed at Subtopic
  // level (not Micro Topic): the denominator is every distinct
  // Subject+Topic+Subtopic combination in Syllabus, since a subtopic
  // shouldn't have to be broken down into Micro Topics before it counts as
  // "sourced" or "covered" — plenty of subtopics may never get that
  // granular. A Syllabus row with no Subtopic at all isn't counted either
  // way (nothing to aggregate under). Deliberately scoped to this tab only
  // — the Syllabus tab's own per-row Source Identified column stays at
  // whatever granularity that row represents (uses
  // isSourceIdentifiedForMicrotopic, unchanged).
  const subtopicRows = useMemo(() => {
    const seen = new Map();
    db.syllabus.forEach(s => {
      if (!s.subtopic) return;
      const key = normKey(s.subject, s.topic, s.subtopic);
      if (!seen.has(key)) seen.set(key, { subject: s.subject, topic: s.topic, subtopic: s.subtopic });
    });
    return Array.from(seen.values());
  }, [db.syllabus]);

  // A subtopic is "sourced" if any Classes/NCERT/Standard Books record's
  // own subject+topic+subtopic matches it — regardless of that record's
  // own Micro Topic (or lack of one). Built once as a Set (not scanned
  // per subtopic row) for the same reason the Syllabus-lookup caches
  // exist: this is O(records) once instead of O(subtopics × records).
  const sourcedSubtopicKeys = useMemo(() => {
    const keys = new Set();
    db.classes.forEach(c => { if (c.subtopic) keys.add(normKey(c.subject, c.topic, c.subtopic)); });
    db.ncert.forEach(n => { if (n.subtopic) keys.add(normKey(n.subject, n.topic, n.subtopic)); });
    db.standardBooks.forEach(s => { if (s.subtopic) keys.add(normKey(s.subject, s.topic, s.subtopic)); });
    return keys;
  }, [db.classes, db.ncert, db.standardBooks]);
  const sourceIdentifiedCount = useMemo(
    () => subtopicRows.filter(st => sourcedSubtopicKeys.has(normKey(st.subject, st.topic, st.subtopic))).length,
    [subtopicRows, sourcedSubtopicKeys]
  );
  const sourceMappingPct = subtopicRows.length ? Math.round((sourceIdentifiedCount / subtopicRows.length) * 100) : null;

  // Topic Completion rows for the same subtopic (there may be several —
  // one per Micro Topic — or none) are averaged together for that
  // subtopic's score, so partial micro-topic-level tracking still counts
  // proportionally rather than needing every micro topic covered first.
  // Sourced from Syllabus + the computed Topic Completion fields now (see
  // "TOPIC COMPLETION — COMPUTED-FIELD HELPERS" above), not from db.reading
  // directly — db.reading only holds the manually-set Revision 1/2 values.
  const topicCompletionIndexes = useMemo(() => buildTopicCompletionIndexes(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.classes, db.ncert, db.standardBooks, db.singlePager, db.reading]);
  const syllabusRowsBySubtopicKey = useMemo(() => {
    const m = new Map();
    db.syllabus.forEach(row => {
      if (!row.subtopic) return;
      const key = normKey(row.subject, row.topic, row.subtopic);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(row);
    });
    return m;
  }, [db.syllabus]);
  const topicCompletionPct = useMemo(() => {
    if (subtopicRows.length === 0) return null;
    const scores = subtopicRows.map(st => {
      const rows = syllabusRowsBySubtopicKey.get(normKey(st.subject, st.topic, st.subtopic));
      if (!rows || rows.length === 0) return topicCompletionScore(null);
      return rows.reduce((sum, row) => sum + topicCompletionScore(computeTopicCompletionFields(row, topicCompletionIndexes)), 0) / rows.length;
    });
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
  }, [subtopicRows, syllabusRowsBySubtopicKey, topicCompletionIndexes]);

  // Classes completed by subject — a literal count of rows marked
  // Completed vs. that subject's Total Classes (Settings tab), not the
  // highest class number seen (that was the old behavior — it meant a
  // single Completed row with, say, Class Number 2 always read "2 of N"
  // regardless of how many other rows were Completed or Partially
  // Completed, which didn't match what people expect "X of N completed"
  // to mean). Partially Completed/In Progress/Skipped rows still don't
  // count — only exactly "Completed" does. Subjects with no Total set are
  // skipped entirely, since "no total" isn't the same as "0% done".
  const classProgressBySubject = useMemo(() => {
    const totals = settings.totalClassesBySubject || {};
    return settings.subjects
      .filter(subj => totals[subj] != null && totals[subj] > 0)
      .map(subj => {
        const total = totals[subj];
        const completed = db.classes.filter(c => c.subject === subj && c.status === "Completed").length;
        return { subject: subj, completed, total, pct: Math.min(100, Math.round((completed / total) * 100)) };
      });
  }, [settings.subjects, settings.totalClassesBySubject, db.classes]);

  // Overall class status pie: Completed / In Progress / Not Completed
  // (Not Started + Partially Completed + Skipped, bucketed together).
  const classStatusCounts = useMemo(() => {
    const counts = { Completed: 0, "In Progress": 0, "Not Completed": 0 };
    db.classes.forEach(c => {
      if (c.status === "Completed") counts.Completed++;
      else if (c.status === "In Progress") counts["In Progress"]++;
      else counts["Not Completed"]++;
    });
    return counts;
  }, [db.classes]);

  // Only Completed Answer Writing rows — this card is meant to reflect
  // actually-finished practice answers, not every row you've started
  // logging, and never Topper Copies (someone else's answer, not yours).
  const gsCounts = GS_PAPERS.map(p => ({ paper: p, count: db.answerWriting.filter(a => a.gsPaper === p && a.status === "Completed").length }));
  const tamilWritingCount = db.tamilWriting.length;

  return (
    <div>
      <div className="ucc-statgrid" style={{ marginBottom: 16 }}>
        <div className="ucc-stat">
          <div className="n">{sourceMappingPct === null ? "—" : `${sourceMappingPct}%`}</div>
          <div className="l">Source mapping ({sourceIdentifiedCount}/{subtopicRows.length} subtopics)</div>
        </div>
        <div className="ucc-stat">
          <div className="n">{topicCompletionPct === null ? "—" : `${topicCompletionPct}%`}</div>
          <div className="l">Overall topic completion ({subtopicRows.length} subtopics)</div>
        </div>
      </div>
      {subtopicRows.length === 0 && (
        <div className="ucc-card">
          <EmptyState>No Syllabus rows have a Subtopic set yet — add some on the Syllabus tab to see these percentages.</EmptyState>
        </div>
      )}

      <div className="ucc-card">
        <h3>Classes completed by subject</h3>
        <p className="ucc-tiny">Count of classes marked Completed vs. that subject's Total Classes (set on the Settings tab). Subjects with no total set aren't shown here.</p>
        {classProgressBySubject.length === 0 ? (
          <EmptyState>No subjects have a Total Classes set yet — add one on the Settings tab and it'll show up here.</EmptyState>
        ) : (
          <div className="ucc-statgrid">
            {classProgressBySubject.map(cp => (
              <div className="ucc-stat" key={cp.subject}>
                <div className="n">{cp.pct}%</div>
                <div className="l">{cp.subject} — {cp.completed} of {cp.total}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ucc-card">
        <h3>Classes — overall status</h3>
        <PieChart segments={[
          { label: "Completed", value: classStatusCounts.Completed, color: "var(--green)" },
          { label: "In Progress", value: classStatusCounts["In Progress"], color: "var(--amber)" },
          { label: "Not Completed", value: classStatusCounts["Not Completed"], color: "var(--grey)" },
        ]} />
      </div>

      <div className="ucc-card">
        <h3>Answers completed</h3>
        <div className="ucc-statgrid">
          {gsCounts.map(g => (
            <div className="ucc-stat" key={g.paper}><div className="n">{g.count}</div><div className="l">{g.paper}</div></div>
          ))}
          <div className="ucc-stat"><div className="n">{tamilWritingCount}</div><div className="l">Tamil Literature</div></div>
        </div>
      </div>
    </div>
  );
}

function classMatchesSyllabusRow(c, row) {
  if (c.syllabusId === row.id) return true;
  if ((c.microtopics || []).includes(row.id)) return true;
  return row.microtopic ? (c.microtopics || []).some(m => normKey(m) === normKey(row.microtopic)) : false;
}
function recMatchesSyllabusRow(rec, row, topicField = "topic") {
  if (rec.syllabusId === row.id) return true;
  return normKey(rec.subject, rec[topicField], rec.subtopic, rec.microtopic) === normKey(row.subject, row.topic, row.subtopic, row.microtopic);
}
function breadcrumb(row) {
  return [row.subject, row.topic, row.subtopic, row.microtopic].filter(Boolean).join(" › ");
}

/* ============================================================
   TOPIC COMPLETION — COMPUTED-FIELD HELPERS
   ============================================================
   Topic Completion (ReadingTab) is a computed overview keyed 1:1 to
   Syllabus rows, not a separately-populated tracker — see CLAUDE.md. These
   build one-time (per relevant array reference) lookup indexes so deriving
   every Syllabus row's Class Notes/Standard Material/NCERT/Single Pager
   status stays O(records) total instead of O(syllabus rows × records),
   same reasoning as getSyllabusIndex/isSourceIdentifiedForMicrotopic. */

// Generic index for trackers that match a Syllabus row via
// recMatchesSyllabusRow (syllabusId first, full-path text as a fallback
// for records saved before syllabusId existed) — NCERT, Standard Books,
// Single Pager, and Reading's own (legacy or lazily-created) revision
// records.
function buildRecIndex(records) {
  const byId = new Map();
  const byTextKey = new Map();
  records.forEach(rec => {
    if (rec.syllabusId) {
      if (!byId.has(rec.syllabusId)) byId.set(rec.syllabusId, []);
      byId.get(rec.syllabusId).push(rec);
    }
    const key = normKey(rec.subject, rec.topic, rec.subtopic, rec.microtopic);
    if (!byTextKey.has(key)) byTextKey.set(key, []);
    byTextKey.get(key).push(rec);
  });
  return { byId, byTextKey };
}
function recsForSyllabusRow(index, row) {
  const byId = index.byId.get(row.id) || [];
  const byText = index.byTextKey.get(normKey(row.subject, row.topic, row.subtopic, row.microtopic)) || [];
  if (byId.length === 0) return byText;
  if (byText.length === 0) return byId;
  const seen = new Set(byId.map(r => r.id));
  return [...byId, ...byText.filter(r => !seen.has(r.id))];
}

// Index for any tracker whose records tag Syllabus rows via a `microtopics`
// array (Classes always has; NCERT/Standard Books/Single Pager once
// converted to the same tag model) — mirrors classMatchesSyllabusRow: a
// record's own syllabusId (legacy single-link field, still checked for
// records saved before microtopics existed) OR any id in its microtopics
// array, OR for legacy plain-text tags, a name match. A record with several
// tagged Micro Topics is indexed under every one of them, since it
// genuinely relates to all of them, not just one.
function buildTaggedIndex(records) {
  const byId = new Map();
  const byName = new Map();
  records.forEach(rec => {
    const idKeys = [rec.syllabusId, ...(rec.microtopics || [])].filter(Boolean);
    idKeys.forEach(k => {
      if (!byId.has(k)) byId.set(k, []);
      byId.get(k).push(rec);
    });
    (rec.microtopics || []).forEach(m => {
      const key = normKey(m);
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(rec);
    });
  });
  return { byId, byName };
}
function taggedRecsForSyllabusRow(index, row) {
  const byId = index.byId.get(row.id) || [];
  const byName = row.microtopic ? (index.byName.get(normKey(row.microtopic)) || []) : [];
  if (byId.length === 0) return byName;
  if (byName.length === 0) return byId;
  const seen = new Set(byId.map(r => r.id));
  return [...byId, ...byName.filter(r => !seen.has(r.id))];
}

// Builds all the indexes Topic Completion needs at once from a `db`
// snapshot — call once per component render (wrapped in the caller's own
// useMemo keyed on the specific db.* arrays involved), not per Syllabus row.
function buildTopicCompletionIndexes(db) {
  return {
    classesIdx: buildTaggedIndex(db.classes),
    ncertIdx: buildTaggedIndex(db.ncert),
    stdBooksIdx: buildTaggedIndex(db.standardBooks),
    spIdx: buildTaggedIndex(db.singlePager),
    readingIdx: buildRecIndex(db.reading),
  };
}

// The actual per-row computation. Class Notes/Standard Material/NCERT/
// Single Pager are fully derived — Class Notes and Single Pager need a
// matching record whose own status is specifically Completed (Classes and
// Single Pager both track their own completion); Standard Material and
// NCERT only need a matching record to exist at all, since neither of
// those two trackers has a completion field of its own — cataloguing the
// book/chapter there is the only signal available. Revision 1/2 are the
// one thing still manually chosen — pulled from whatever reading record
// (if any) is linked to this Syllabus row, defaulting "Yet to Start" for a
// row that's never had one edited. readingRecId is exposed so the caller
// knows whether to patch an existing reading record or lazily create one.
function computeTopicCompletionFields(row, indexes) {
  const matchedClasses = taggedRecsForSyllabusRow(indexes.classesIdx, row);
  const classNotes = matchedClasses.some(c => c.status === "Completed") ? "Completed"
    : matchedClasses.length > 0 ? "In Progress" : "Not Started";
  const classNotesFile = (matchedClasses.find(c => c.status === "Completed" && c.driveFile)
    || matchedClasses.find(c => c.driveFile) || {}).driveFile || null;

  const standardMaterial = taggedRecsForSyllabusRow(indexes.stdBooksIdx, row).length > 0 ? "Completed" : "Not Started";
  const ncert = taggedRecsForSyllabusRow(indexes.ncertIdx, row).length > 0 ? "Completed" : "Not Started";

  const matchedSP = taggedRecsForSyllabusRow(indexes.spIdx, row);
  const singlePager = matchedSP.some(s => s.status === "Completed") ? "Completed"
    : matchedSP.length > 0 ? "In Progress" : "Not Started";

  const readingRec = recsForSyllabusRow(indexes.readingIdx, row)[0] || null;
  const revision1 = (readingRec && readingRec.revision1) || "Yet to Start";
  const revision2 = (readingRec && readingRec.revision2) || "Yet to Start";

  return { classNotes, classNotesFile, standardMaterial, ncert, singlePager, revision1, revision2, readingRecId: readingRec ? readingRec.id : null };
}

// Topic Master is keyed on the full Subject → Topic → Subtopic → Micro
// Topic path — one entry per Syllabus row, since Syllabus is the single
// source of truth for that hierarchy. Every linking tracker (Classes,
// Reading, NCERT, Standard Books, Single Pager, Current Affairs) matches
// via its syllabusId first, falling back to a full-path text match for any
// record saved before that id existed. Tamil and GS Answer Writing don't
// carry a Subtopic/Micro Topic of their own, so they attach at the Topic
// level only — the same entries can legitimately appear under several
// Micro Topic rows that share one Topic.
function TopicMasterTab({ db, onNavigate }) {
  const [query, setQuery] = useState("");
  const topicCompletionIndexes = useMemo(() => buildTopicCompletionIndexes(db),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db.classes, db.ncert, db.standardBooks, db.singlePager, db.reading]);
  const topics = useMemo(() => {
    return db.syllabus.map(row => ({
      row,
      classes: db.classes.filter(c => classMatchesSyllabusRow(c, row)),
      topicCompletion: computeTopicCompletionFields(row, topicCompletionIndexes),
      ncert: db.ncert.filter(n => classMatchesSyllabusRow(n, row)),
      standardBooks: db.standardBooks.filter(s => classMatchesSyllabusRow(s, row)),
      singlePager: db.singlePager.filter(s => classMatchesSyllabusRow(s, row)),
      currentAffairs: db.currentAffairs.filter(c => recMatchesSyllabusRow(c, row, "relevantSyllabusTopic")),
      tamilReading: row.subject === "Tamil Literature" ? db.tamilReading.filter(t => t.topic === row.topic) : [],
      tamilWriting: row.subject === "Tamil Literature" ? db.tamilWriting.filter(t => t.topic === row.topic) : [],
      // Answer Writing's Micro Topic tags link by Syllabus row id (see
      // AnswerWritingTab) — matches this row directly, same mechanism as
      // Classes. Falls back to a GS Paper + Topic text match only for
      // legacy rows saved before that existed (a plain rec.topic string,
      // predating both the free-text-tag and the id-linked version).
      answerWriting: db.answerWriting.filter(a => (a.microtopics || []).includes(row.id)
        || (row.gsPaper && !a.microtopics && a.gsPaper === row.gsPaper && a.topic === row.topic)),
      // Topper Copies links by Syllabus row id too (see AnswerWritingTab),
      // same as Answer Writing — falls back to GS Paper + Topic text only
      // for legacy rows saved before the Micro Topic tag version existed.
      topperCopies: db.topperCopies.filter(a => (a.microtopics || []).includes(row.id)
        || (row.gsPaper && !a.microtopics && a.gsPaper === row.gsPaper && a.topic === row.topic)),
    })).sort((a, b) => breadcrumb(a.row).localeCompare(breadcrumb(b.row)));
  }, [db]);

  const filtered = query.trim()
    ? topics.filter(t => breadcrumb(t.row).toLowerCase().includes(query.trim().toLowerCase()))
    : topics;

  const [selId, setSelId] = useState(null);
  const active = filtered.find(t => t.row.id === selId) || filtered[0];

  function countLinked(t) {
    return t.classes.length + t.ncert.length + t.standardBooks.length + t.singlePager.length
      + t.currentAffairs.length + t.tamilReading.length + t.tamilWriting.length + t.answerWriting.length + t.topperCopies.length;
  }

  return (
    <div className="ucc-card">
      <h3>Topic master</h3>
      <p className="ucc-tiny" style={{ marginBottom: 8 }}>
        Every row here is a Syllabus entry — add Subject/Topic/Subtopic/Micro Topic on the <a onClick={() => onNavigate && onNavigate("syllabus")} style={{ cursor: "pointer", textDecoration: "underline" }}>Syllabus tab</a> to see it show up.
      </p>
      {db.syllabus.length === 0 ? <EmptyState>No Syllabus entries yet — add some on the Syllabus tab first.</EmptyState> : (
        <div style={{ display: "flex", gap: 18 }}>
          <div style={{ width: 260, flexShrink: 0 }}>
            <input className="ucc-input" style={{ width: "100%", marginBottom: 8 }} placeholder="Search subject / topic / subtopic / micro topic…"
              value={query} onChange={e => setQuery(e.target.value)} />
            <div style={{ maxHeight: 480, overflowY: "auto" }}>
              {filtered.length === 0 && <EmptyState>No matches.</EmptyState>}
              {filtered.map(t => {
                const linked = countLinked(t);
                return (
                  <div key={t.row.id} onClick={() => setSelId(t.row.id)}
                    style={{ padding: "7px 9px", borderRadius: 6, cursor: "pointer", fontSize: 12.5, marginBottom: 2, background: (active && active.row.id === t.row.id) ? "var(--grey-soft)" : "transparent" }}>
                    <div className="ucc-flex between">
                      <strong>{t.row.microtopic || t.row.subtopic || t.row.topic || "(untitled)"}</strong>
                      {linked > 0 && <span className="ucc-tiny" style={{ color: "var(--ink-muted)" }}>{linked}</span>}
                    </div>
                    <span className="ucc-tiny" style={{ color: "var(--ink-muted)" }}>{breadcrumb(t.row)}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {active && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 16, textTransform: "none", letterSpacing: 0, color: "var(--ink)" }}>{breadcrumb(active.row)}</h3>
              <div className="ucc-tiny" style={{ marginBottom: 10 }}>
                {active.row.gsPaper && `${active.row.gsPaper} · `}Source Identified: <Badge tone={isSourceIdentifiedForMicrotopic(db, active.row) ? "green" : "grey"}>{active.row.microtopic ? (isSourceIdentifiedForMicrotopic(db, active.row) ? "Yes" : "No") : "—"}</Badge>
              </div>
              <TopicSection title="Classes">
                {active.classes.length === 0 ? <EmptyState>No classes logged.</EmptyState> :
                  active.classes.map(c => (
                    <div key={c.id} className="ucc-tiny" style={{ marginBottom: 4 }}>
                      {c.date} — Class {c.classNumber} <Badge tone={colorFor(c.status)}>{c.status}</Badge> <DriveDownloadLink driveFile={c.driveFile} />
                    </div>
                  ))}
              </TopicSection>
              <TopicSection title="Topic completion">
                <div className="ucc-tiny" style={{ marginBottom: 4 }}>
                  <Badge tone={colorFor(active.topicCompletion.classNotes)}>Notes {active.topicCompletion.classNotes}</Badge>{" "}
                  <Badge tone={colorFor(active.topicCompletion.standardMaterial)}>Std {active.topicCompletion.standardMaterial}</Badge>{" "}
                  <Badge tone={colorFor(active.topicCompletion.ncert)}>NCERT {active.topicCompletion.ncert}</Badge>{" "}
                  <Badge tone={colorFor(active.topicCompletion.singlePager)}>SP {active.topicCompletion.singlePager}</Badge>{" "}
                  <Badge tone={colorFor(active.topicCompletion.revision1)}>Rev1 {active.topicCompletion.revision1}</Badge>{" "}
                  <Badge tone={colorFor(active.topicCompletion.revision2)}>Rev2 {active.topicCompletion.revision2}</Badge>
                  {active.topicCompletion.classNotesFile && <> <DriveDownloadLink driveFile={active.topicCompletion.classNotesFile} /></>}
                </div>
              </TopicSection>
              <TopicSection title="NCERT">
                {active.ncert.length === 0 ? <EmptyState>Not mapped.</EmptyState> :
                  active.ncert.map(n => <div key={n.id} className="ucc-tiny" style={{ marginBottom: 4 }}>{n.book} — {n.chapter}</div>)}
              </TopicSection>
              <TopicSection title="Standard books">
                {active.standardBooks.length === 0 ? <EmptyState>Not mapped.</EmptyState> :
                  active.standardBooks.map(s => <div key={s.id} className="ucc-tiny" style={{ marginBottom: 4 }}>{s.bookName} — {s.chapter}</div>)}
              </TopicSection>
              <TopicSection title="Single pager">
                {active.singlePager.length === 0 ? <EmptyState>Not started.</EmptyState> :
                  active.singlePager.map(s => (
                    <div key={s.id} className="ucc-tiny" style={{ marginBottom: 4 }}>
                      Status: <Badge tone={colorFor(s.status)}>{s.status}</Badge> · Revision: <Badge tone={colorFor(s.revision)}>{s.revision || "Yet to Start"}</Badge> <DriveDownloadLink driveFile={s.driveFile} />
                    </div>
                  ))}
              </TopicSection>
              <TopicSection title="Current affairs">
                {active.currentAffairs.length === 0 ? <EmptyState>No related entries.</EmptyState> :
                  active.currentAffairs.map(c => (
                    <div key={c.id} className="ucc-tiny" style={{ marginBottom: 4 }}>
                      {c.date} — {c.title} <DriveDownloadLink driveFile={c.driveFile} />
                    </div>
                  ))}
              </TopicSection>
              {active.row.subject === "Tamil Literature" && (
                <TopicSection title="Tamil literature">
                  {active.tamilReading.length === 0 && active.tamilWriting.length === 0 ? <EmptyState>No related entries.</EmptyState> : (
                    <>
                      {active.tamilReading.map(t => <div key={t.id} className="ucc-tiny" style={{ marginBottom: 4 }}>Reading — {t.source} <DriveDownloadLink driveFile={t.driveFile} /></div>)}
                      {active.tamilWriting.map(t => <div key={t.id} className="ucc-tiny" style={{ marginBottom: 4 }}>Writing — {t.date} <Badge tone={colorFor(t.status)}>{t.status}</Badge> <DriveDownloadLink driveFile={t.driveFile} /></div>)}
                    </>
                  )}
                </TopicSection>
              )}
              <TopicSection title="Answer writing">
                {active.answerWriting.length === 0 ? <EmptyState>No related answers.</EmptyState> :
                  active.answerWriting.map(a => (
                    <div key={a.id} className="ucc-tiny" style={{ marginBottom: 4 }}>
                      {a.date} — {a.gsPaper} <Badge tone={colorFor(a.status)}>{a.status}</Badge> <DriveDownloadLink driveFile={a.driveFile} />
                    </div>
                  ))}
              </TopicSection>
              <TopicSection title="Topper copies">
                {active.topperCopies.length === 0 ? <EmptyState>No related topper copies.</EmptyState> :
                  active.topperCopies.map(a => (
                    <div key={a.id} className="ucc-tiny" style={{ marginBottom: 4 }}>
                      {a.date} — {a.gsPaper} <DriveDownloadLink driveFile={a.driveFile} />
                    </div>
                  ))}
              </TopicSection>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function TopicSection({ title, children }) {
  return <div style={{ marginBottom: 12 }}><div className="ucc-tiny" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 4 }}>{title}</div>{children}</div>;
}

/* ============================================================
   SEARCH
   ============================================================ */
function SearchTab({ db }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.toLowerCase();
    const out = [];
    const scan = (arr, module, fields, labelFn) => {
      arr.forEach(r => {
        const hay = fields.map(f => r[f] || "").join(" ").toLowerCase();
        if (hay.includes(needle)) out.push({ module, label: labelFn(r) });
      });
    };
    scan(db.syllabus, "Syllabus", ["subject", "topic", "subtopic"], r => `${r.subject} — ${r.topic}`);
    // Bespoke rather than the generic scan() above — Classes/NCERT/Standard
    // Books/Single Pager's Micro Topic tags store Syllabus row ids (see
    // ClassesTab et al.), which need resolving to their current text before
    // they mean anything as search terms.
    const scanTagged = (arr, module, otherFields, labelFn) => {
      arr.forEach(r => {
        const microtopicLabels = (r.microtopics || []).map(id => resolveMicrotopicLabelById(db, id)).filter(Boolean);
        const legacyTopic = r.microtopics ? "" : (r.topic || "");
        const hay = [...otherFields.map(f => r[f] || ""), ...microtopicLabels, legacyTopic].join(" ").toLowerCase();
        if (hay.includes(needle)) out.push({ module, label: labelFn(r, microtopicLabels.join(", ") || legacyTopic || "Untitled") });
      });
    };
    scanTagged(db.classes, "Classes", ["subject"], (r, topics) => `${r.subject} — Class ${r.classNumber}: ${topics}`);
    // Topic Completion no longer has an independent row set — it's now a
    // 1:1 computed overview of Syllabus (see "TOPIC COMPLETION — COMPUTED-
    // FIELD HELPERS"), so the Syllabus scan above already covers every
    // topic completion "row" there is; a separate db.reading scan would
    // only surface the sparse subset of rows with a manually-set revision.
    scanTagged(db.singlePager, "Single Pager", ["subject"], (r, topics) => `${r.subject} — ${topics}`);
    scanTagged(db.ncert, "NCERT", ["subject", "book", "chapter"], (r, topics) => `${r.subject} — ${r.book} — ${r.chapter} — ${topics}`);
    scanTagged(db.standardBooks, "Standard Books", ["bookName", "subject", "chapter"], (r, topics) => `${r.bookName} — ${topics}`);
    scan(db.tamilReading, "Tamil Reading", ["topic", "source"], r => r.topic);
    scan(db.tamilWriting, "Tamil Writing", ["topic", "question"], r => r.topic);
    scan(db.currentAffairs, "Current Affairs", ["title", "subject", "relevantSyllabusTopic"], r => r.title);
    // Bespoke rather than the generic scan() above — Micro Topic tags now
    // store Syllabus row ids (see AnswerWritingTab), which need resolving
    // to their current text before they mean anything as search terms.
    db.answerWriting.forEach(a => {
      const microtopicLabels = (a.microtopics || []).map(id => resolveMicrotopicLabelById(db, id)).filter(Boolean);
      const legacyTopic = a.microtopics ? "" : (a.topic || "");
      const hay = [a.question, a.gsPaper, ...(a.subjects || []), ...microtopicLabels, legacyTopic].join(" ").toLowerCase();
      if (hay.includes(needle)) out.push({ module: "Answer Writing", label: `${a.gsPaper} — ${microtopicLabels.join(", ") || legacyTopic || "Untitled"}` });
    });
    // Bespoke rather than the generic scan() above — same reason as Answer
    // Writing: Micro Topic tags store Syllabus row ids, which need
    // resolving to their current text before they mean anything as search
    // terms.
    db.topperCopies.forEach(a => {
      const microtopicLabels = (a.microtopics || []).map(id => resolveMicrotopicLabelById(db, id)).filter(Boolean);
      const legacyTopic = a.microtopics ? "" : (a.topic || "");
      const hay = [a.question, a.gsPaper, a.observations, ...(a.subjects || []), ...microtopicLabels, legacyTopic].join(" ").toLowerCase();
      if (hay.includes(needle)) out.push({ module: "Topper Copies", label: `${a.gsPaper} — ${microtopicLabels.join(", ") || legacyTopic || "Untitled"}` });
    });
    scan(db.aiLearning, "AI Learning", ["topic", "notes"], r => r.topic);
    return out;
  }, [q, db]);
  return (
    <div className="ucc-card">
      <h3>Global search</h3>
      <input className="ucc-input" placeholder="Search topics, classes, notes, current affairs…" value={q} onChange={e => setQ(e.target.value)} />
      <div style={{ marginTop: 12 }}>
        {q.trim() && results.length === 0 && <EmptyState>No matches for "{q}".</EmptyState>}
        {results.map((r, i) => (
          <div key={i} className="ucc-flex" style={{ marginBottom: 4 }}>
            <Badge tone="neutral">{r.module}</Badge><span className="ucc-tiny">{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   WEEKLY REVIEW
   ============================================================ */
function WeeklyReviewTab({ db, updateSlice }) {
  const [weekOf, setWeekOf] = useState(weekStartISO(todayISO()));
  const [copyStatus, setCopyStatus] = useState("");
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(weekOf, i));
  const plans = weekDates.map(d => db.dailyPlans[d]).filter(Boolean);
  let planned = 0, logged = 0, missed = 0;
  plans.forEach(p => (p.blocks || []).forEach(b => {
    if (b.type === "break") return;
    planned++;
    if (b.skipped) missed++;
    else if ((b.journal || "").trim()) logged++;
  }));
  const classesThisWeek = db.classes.filter(c => weekDates.includes(c.date)).length;
  const answersThisWeek = db.answerWriting.filter(a => weekDates.includes(a.date)).length;
  const currentAffairsThisWeek = db.currentAffairs.filter(c => weekDates.includes(c.date)).length;
  const reflection = db.weeklyReviews[weekOf] || { wellDone: "", notWell: "", change: "" };
  function setReflection(patch) {
    updateSlice("weeklyReviews", prev => ({ ...prev, [weekOf]: { ...(prev[weekOf] || {}), ...patch } }));
  }
  // Per-day breakdown for the week: every non-break block with its real
  // start/end time (computePlanTimes, since the plan itself only stores
  // duration), its journal entry, and — if skipped — the reason picked at
  // skip time. This is the hourly journal, viewable both per-day (Today
  // tab) and per-week (here).
  const dayLogs = weekDates.map(d => {
    const plan = db.dailyPlans[d];
    const tasks = plan ? computePlanTimes(plan).blocks.filter(b => b.type !== "break") : [];
    const hasJournal = tasks.some(t => (t.journal || "").trim());
    return { date: d, tasks, hasContent: tasks.length > 0 || hasJournal };
  });
  const weekHasContent = dayLogs.some(dl => dl.hasContent);

  // "Copy for email" — no server, no email account, no secrets: this
  // writes real HTML to the clipboard (alongside a plain-text fallback),
  // so pasting into Gmail's own compose window (or Outlook, or anything
  // else with a rich-text editor) keeps the formatting, and *you* send it
  // from your own logged-in session. Deliberately not automatic — that
  // trade was made explicitly in favor of not touching any account's
  // credentials or a third-party email service at all.
  const statsRows = [
    ["Planned sessions", planned], ["Logged", logged], ["Skipped", missed],
    ["Classes this week", classesThisWeek], ["Answers written", answersThisWeek],
    ["Current affairs logged", currentAffairsThisWeek],
  ];
  function buildSummaryHtml() {
    const statsHtml = statsRows.map(([label, val]) =>
      `<tr><td style="padding:3px 16px 3px 0;color:#444;">${escapeHtml(label)}</td><td style="padding:3px 0;font-weight:700;">${val}</td></tr>`
    ).join("");
    const reflectionHtml = [
      ["What went well", reflection.wellDone], ["What did not go well", reflection.notWell], ["What should change next week", reflection.change],
    ].filter(([, v]) => (v || "").trim()).map(([label, v]) =>
      `<p style="margin:4px 0 12px;"><strong>${escapeHtml(label)}:</strong><br>${escapeHtml(v).replace(/\n/g, "<br>")}</p>`
    ).join("");
    const journalHtml = dayLogs.filter(dl => dl.hasContent).map(dl => {
      const tasksHtml = dl.tasks.map(t => {
        const status = t.skipped ? ` <span style="color:#888;">(Skipped${t.skipReason ? ": " + escapeHtml(t.skipReason) : ""})</span>` : "";
        const journalText = !t.skipped ? (t.journal || "").trim() : "";
        return `<div style="margin-bottom:6px;">
          <span style="font-family:monospace;color:#666;font-size:12px;">${minutesToTime(t.start)}–${minutesToTime(t.end)}</span>
          <strong style="margin-left:6px;">${escapeHtml(t.label)}</strong>${status}
          ${journalText ? `<div style="color:#333;font-size:13px;margin-top:2px;">${escapeHtml(journalText)}</div>` : ""}
        </div>`;
      }).join("");
      return `<div style="margin-bottom:16px;"><div style="font-weight:700;margin-bottom:6px;">${escapeHtml(fmtDateLong(dl.date))}</div>${tasksHtml}</div>`;
    }).join("");
    return `<div style="font-family:Arial,sans-serif;max-width:560px;color:#1a1a1a;">
      <h2 style="margin-bottom:2px;">Weekly Review — ${weekOf} to ${addDaysISO(weekOf, 6)}</h2>
      <table style="border-collapse:collapse;margin:12px 0;">${statsHtml}</table>
      ${reflectionHtml}
      <h3 style="margin-top:20px;">Hourly journal</h3>
      ${journalHtml || "<p>No entries logged this week.</p>"}
    </div>`;
  }
  function buildSummaryText() {
    const lines = [`Weekly Review — ${weekOf} to ${addDaysISO(weekOf, 6)}`, ""];
    statsRows.forEach(([label, val]) => lines.push(`${label}: ${val}`));
    [["What went well", reflection.wellDone], ["What did not go well", reflection.notWell], ["What should change next week", reflection.change]]
      .filter(([, v]) => (v || "").trim()).forEach(([label, v]) => lines.push("", `${label}:`, v));
    lines.push("", "Hourly journal:");
    dayLogs.filter(dl => dl.hasContent).forEach(dl => {
      lines.push("", fmtDateLong(dl.date));
      dl.tasks.forEach(t => {
        const status = t.skipped ? ` (Skipped${t.skipReason ? ": " + t.skipReason : ""})` : "";
        lines.push(`  ${minutesToTime(t.start)}–${minutesToTime(t.end)} ${t.label}${status}`);
        if (!t.skipped && (t.journal || "").trim()) lines.push(`    ${t.journal.trim()}`);
      });
    });
    return lines.join("\n");
  }
  async function copySummaryToClipboard() {
    const html = buildSummaryHtml();
    const text = buildSummaryText();
    try {
      if (!navigator.clipboard || !window.ClipboardItem) throw new Error("Rich clipboard not supported");
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) }),
      ]);
      setCopyStatus("Copied — paste into a new Gmail message (or any rich-text email) to send it.");
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setCopyStatus("Copied as plain text — this browser doesn't support formatted copy, but the text is ready to paste.");
      } catch {
        setCopyStatus("Couldn't copy automatically — try Download as PDF instead.");
      }
    }
    setTimeout(() => setCopyStatus(""), 6000);
  }

  return (
    <div>
      <div className="ucc-card ucc-no-print">
        <div className="ucc-flex between wrap">
          <h3>Weekly review</h3>
          <div className="ucc-flex">
            <IconBtn icon={ChevronLeft} onClick={() => setWeekOf(w => addDaysISO(w, -7))} title="Previous week" />
            <span className="ucc-mono ucc-tiny">Week of {weekOf} – {addDaysISO(weekOf, 6)}</span>
            <IconBtn icon={ChevronRightIcon} onClick={() => setWeekOf(w => addDaysISO(w, 7))} title="Next week" />
          </div>
        </div>
      </div>

      <div className="ucc-print-area">
        <div className="ucc-card">
          <div className="ucc-flex between wrap">
            <h3>Week of {weekOf} – {addDaysISO(weekOf, 6)}</h3>
            <div className="ucc-flex ucc-no-print">
              <button className="ucc-btn ghost" onClick={copySummaryToClipboard}
                title="Copies a formatted summary — paste it into a new Gmail message to send it yourself">
                <Copy size={14} /> Copy for email
              </button>
              <button className="ucc-btn primary" onClick={() => window.print()}
                title="Opens your browser's print dialog — choose “Save as PDF” as the destination">
                <Download size={14} /> Download as PDF
              </button>
            </div>
          </div>
          {copyStatus && <div className="ucc-tiny ucc-no-print" style={{ color: "var(--green)", marginTop: 4 }}>{copyStatus}</div>}
          <div className="ucc-statgrid" style={{ margin: "12px 0" }}>
            <div className="ucc-stat"><div className="n">{planned}</div><div className="l">Planned sessions</div></div>
            <div className="ucc-stat"><div className="n">{logged}</div><div className="l">Logged</div></div>
            <div className="ucc-stat"><div className="n">{missed}</div><div className="l">Skipped</div></div>
            <div className="ucc-stat"><div className="n">{classesThisWeek}</div><div className="l">Classes this week</div></div>
            <div className="ucc-stat"><div className="n">{answersThisWeek}</div><div className="l">Answers written</div></div>
            <div className="ucc-stat"><div className="n">{currentAffairsThisWeek}</div><div className="l">Current affairs logged</div></div>
          </div>
          <div className="ucc-grid">
            <div><label className="ucc-tiny">What went well?</label><textarea className="ucc-textarea" rows={3} value={reflection.wellDone} onChange={e => setReflection({ wellDone: e.target.value })} /></div>
            <div><label className="ucc-tiny">What did not go well?</label><textarea className="ucc-textarea" rows={3} value={reflection.notWell} onChange={e => setReflection({ notWell: e.target.value })} /></div>
            <div><label className="ucc-tiny">What should change next week?</label><textarea className="ucc-textarea" rows={3} value={reflection.change} onChange={e => setReflection({ change: e.target.value })} /></div>
          </div>
        </div>

        <div className="ucc-card">
          <h3>Hourly journal</h3>
          {!weekHasContent && <EmptyState>No daily plans or journal entries logged for this week yet.</EmptyState>}
          {dayLogs.filter(dl => dl.hasContent).map(dl => (
            <div key={dl.date} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{fmtDateLong(dl.date)}</div>
              {dl.tasks.map(t => (
                <div key={t.id} style={{ marginBottom: 6 }}>
                  <div className="ucc-flex wrap" style={{ gap: 6 }}>
                    <span className="ucc-tiny ucc-mono" style={{ minWidth: 110 }}>{minutesToTime(t.start)}–{minutesToTime(t.end)} ({t.duration}m)</span>
                    <span className="ucc-tiny" style={{ fontWeight: 600 }}>{t.label}</span>
                    {t.skipped && <Badge tone="grey">Skipped{t.skipReason ? `: ${t.skipReason}` : ""}</Badge>}
                  </div>
                  {!t.skipped && (
                    <div className="ucc-tiny" style={{ color: (t.journal || "").trim() ? "var(--ink)" : "var(--ink-muted)", marginTop: 2 }}>
                      {(t.journal || "").trim() || "— no journal entry —"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SETTINGS
   ============================================================ */
function SettingsTab({ db, updateSlice }) {
  const s = db.settings;
  function patch(p) { updateSlice("settings", prev => ({ ...prev, ...p })); }
  const [newSubject, setNewSubject] = useState("");
  return (
    <div className="ucc-card">
      <h3>Settings</h3>
      <div className="ucc-grid">
        <div>
          <label className="ucc-tiny">Default wake-up time</label>
          <input type="time" className="ucc-input ucc-mono" value={s.wakeTimeDefault} onChange={e => patch({ wakeTimeDefault: e.target.value })} />
        </div>
        <div>
          <label className="ucc-tiny">Fixed sleep boundary</label>
          <input type="time" className="ucc-input ucc-mono" value={s.sleepTime} onChange={e => patch({ sleepTime: e.target.value })} />
        </div>
        <div>
          <label className="ucc-tiny">Fixed office hours (WFH/WFO)</label>
          <input type="number" step="0.5" className="ucc-input ucc-mono" value={s.officeHoursFixed} onChange={e => patch({ officeHoursFixed: Number(e.target.value) })} />
        </div>
        <div>
          <label className="ucc-tiny">Fixed travel hours, each way (WFO only)</label>
          <input type="number" step="0.5" className="ucc-input ucc-mono" value={s.travelHoursEachWay} onChange={e => patch({ travelHoursEachWay: Number(e.target.value) })} />
        </div>
      </div>
      <div className="ucc-hr" />
      <h3>Default daily slot template</h3>
      <p className="ucc-tiny">Study slots, breaks, and AI learning — their default duration before any day-fit trimming happens, and whether they're generated at all. Office and commute time come from the fixed hours above instead. Changes here set the default for new days — days you've already opened keep their own snapshot until you change wake time or day type.</p>
      <table className="ucc-table">
        <thead><tr><th>Enabled</th><th>Slot</th><th>Type</th><th>Default duration (min)</th></tr></thead>
        <tbody>
          {s.slotTemplate.map((b, i) => {
            const enabled = (s.slotsEnabled || {})[b.id] !== false;
            return (
              <tr key={b.id} style={{ opacity: enabled ? 1 : 0.55 }}>
                <td>
                  <input type="checkbox" checked={enabled}
                    onChange={e => patch({ slotsEnabled: { ...(s.slotsEnabled || {}), [b.id]: e.target.checked } })} />
                </td>
                <td>{b.label}</td>
                <td><Badge tone="neutral">{b.type}</Badge></td>
                <td>
                  <input type="number" className="ucc-input ucc-mono" style={{ width: 80 }} value={b.duration} disabled={!enabled}
                    onChange={e => {
                      const dur = Number(e.target.value);
                      patch({ slotTemplate: s.slotTemplate.map((x, xi) => xi === i ? { ...x, duration: dur } : x) });
                    }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="ucc-hr" />
      <h3>Subjects</h3>
      <p className="ucc-tiny">Total Classes is optional — set it once per subject to see that subject's class-completion % on the Dashboard.</p>
      <table className="ucc-table" style={{ marginBottom: 8 }}>
        <thead><tr><th>Subject</th><th>Total Classes</th><th></th></tr></thead>
        <tbody>
          {s.subjects.map(sub => (
            <tr key={sub}>
              <td>{sub}</td>
              <td>
                <input type="number" min="0" className="ucc-input ucc-mono" style={{ width: 90 }} placeholder="—"
                  value={(s.totalClassesBySubject || {})[sub] ?? ""}
                  onChange={e => {
                    const next = { ...(s.totalClassesBySubject || {}) };
                    const raw = e.target.value;
                    if (raw === "") delete next[sub]; else next[sub] = Number(raw);
                    patch({ totalClassesBySubject: next });
                  }} />
              </td>
              <td>
                <button className="ucc-btn ghost" style={{ padding: "0 0 0 6px", border: "none" }}
                  onClick={() => {
                    const next = { ...(s.totalClassesBySubject || {}) };
                    delete next[sub];
                    patch({ subjects: s.subjects.filter(x => x !== sub), totalClassesBySubject: next });
                  }}><X size={11} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ucc-flex">
        <input className="ucc-input" style={{ maxWidth: 220 }} placeholder="Add subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
        <button className="ucc-btn" onClick={() => { if (newSubject.trim()) { patch({ subjects: [...s.subjects, newSubject.trim()] }); setNewSubject(""); } }}><Plus size={13} /> Add</button>
      </div>
      <DangerZone db={db} updateSlice={updateSlice} />
    </div>
  );
}

// Every StorageKey except "settings" — what "Reset all data" wipes back to
// empty, using each key's genuinely-empty shape (not defaultDB()'s syllabus
// seed, since a reset should mean *empty*, not *repopulated with the sample
// curriculum*). Also the single source of truth for which sections the
// section-wise reset can target — add a label below rather than a second
// list, so the two resets can't drift out of sync with each other.
const CLEARABLE_DATA_KEYS = {
  syllabus: [], classes: [], reading: [], singlePager: [], ncert: [], standardBooks: [],
  tamilReading: [], tamilWriting: [], currentAffairs: [], answerWriting: [], topperCopies: [], aiLearning: [],
  dailyPlans: {}, dailyReviews: {}, weeklyReviews: {},
};
const RESETTABLE_SECTION_LABELS = {
  syllabus: "Syllabus", classes: "Classes", reading: "Topic Completion", singlePager: "Single Pager",
  ncert: "NCERT", standardBooks: "Standard Books", tamilReading: "Tamil Literature Reading",
  tamilWriting: "Tamil Literature Writing", currentAffairs: "Current Affairs", answerWriting: "GS Answer Writing",
  topperCopies: "Topper Copies", aiLearning: "AI Learning", dailyPlans: "Daily Plans", dailyReviews: "End-of-day reviews", weeklyReviews: "Weekly reviews",
};
// Only Syllabus needs its own extra warning in the section-wise reset:
// every other tracker stores its own readable subject/topic/etc. text, so
// resetting it alone doesn't corrupt anything elsewhere. Syllabus is
// different — Classes' Micro Topic tags store a Syllabus row id rather
// than text, so wiping Syllabus alone leaves those tags unable to resolve
// to a name. This gives a live count of how many records currently rely
// on Syllabus rows still existing, for that warning.
function countRecordsLinkedToSyllabus(db) {
  let count = 0;
  count += db.classes.filter(c => c.syllabusId || (c.microtopics || []).length > 0).length;
  count += db.reading.filter(r => r.syllabusId).length;
  count += db.ncert.filter(n => n.syllabusId || (n.microtopics || []).length > 0).length;
  count += db.standardBooks.filter(s => s.syllabusId || (s.microtopics || []).length > 0).length;
  count += db.singlePager.filter(s => s.syllabusId || (s.microtopics || []).length > 0).length;
  count += db.currentAffairs.filter(c => c.syllabusId).length;
  count += db.answerWriting.filter(a => (a.microtopics || []).length > 0).length;
  count += db.topperCopies.filter(a => (a.microtopics || []).length > 0).length;
  return count;
}

function DangerZone({ db, updateSlice }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [done, setDone] = useState(false);

  const [sectionOpen, setSectionOpen] = useState(false);
  const [sectionKey, setSectionKey] = useState("");
  const [sectionConfirmText, setSectionConfirmText] = useState("");
  const [sectionDone, setSectionDone] = useState("");

  function resetAllData() {
    Object.entries(CLEARABLE_DATA_KEYS).forEach(([key, emptyValue]) => updateSlice(key, () => emptyValue));
    setOpen(false); setConfirmText(""); setDone(true);
    setTimeout(() => setDone(false), 5000);
  }

  function resetSection() {
    if (!sectionKey) return;
    const label = RESETTABLE_SECTION_LABELS[sectionKey];
    updateSlice(sectionKey, () => CLEARABLE_DATA_KEYS[sectionKey]);
    setSectionOpen(false); setSectionKey(""); setSectionConfirmText("");
    setSectionDone(label);
    setTimeout(() => setSectionDone(""), 5000);
  }

  const linkedToSyllabusCount = sectionKey === "syllabus" ? countRecordsLinkedToSyllabus(db) : 0;

  return (
    <div>
      <div className="ucc-hr" />
      <h3 style={{ color: "var(--red)" }}>Danger zone</h3>

      {!sectionOpen ? (
        <button className="ucc-btn ghost" style={{ borderColor: "var(--red)", color: "var(--red)", marginBottom: 8 }} onClick={() => setSectionOpen(true)}>
          <Trash2 size={14} /> Reset one section
        </button>
      ) : (
        <div style={{ border: "1px solid var(--red)", background: "var(--red-soft)", borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <label className="ucc-tiny">Section to reset</label>
          <select className="ucc-select" style={{ display: "block", margin: "4px 0 8px", maxWidth: 280 }}
            value={sectionKey} onChange={e => { setSectionKey(e.target.value); setSectionConfirmText(""); }}>
            <option value="">Select a section…</option>
            {Object.entries(RESETTABLE_SECTION_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
          {sectionKey && (
            <>
              <p className="ucc-tiny">
                This permanently clears <strong>{RESETTABLE_SECTION_LABELS[sectionKey]}</strong> only — every other
                section (including Settings) is left exactly as it is. This cannot be undone.
                {sectionKey === "syllabus" && (
                  <> <strong>Heads up:</strong> other trackers still reference Syllabus rows
                  {linkedToSyllabusCount > 0 ? ` (${linkedToSyllabusCount} record${linkedToSyllabusCount === 1 ? "" : "s"} right now)` : ""} —
                  Classes', NCERT's, Standard Books', Single Pager's, GS Answer Writing's, and Topper Copies' Micro Topic tags in particular may show an unreadable value once those rows are gone, and
                  every tracker's Topic/Subtopic/Micro Topic dropdowns won't offer anything new until Syllabus is
                  repopulated.</>
                )}
              </p>
              <p className="ucc-tiny">Type <strong>RESET</strong> to confirm.</p>
              <div className="ucc-flex">
                <input className="ucc-input" style={{ maxWidth: 140 }} value={sectionConfirmText} onChange={e => setSectionConfirmText(e.target.value)} placeholder="RESET" />
                <button className="ucc-btn primary" style={{ background: "var(--red)", borderColor: "var(--red)" }} disabled={sectionConfirmText !== "RESET"} onClick={resetSection}>
                  <Trash2 size={14} /> Confirm reset
                </button>
                <button className="ucc-btn ghost" onClick={() => { setSectionOpen(false); setSectionKey(""); setSectionConfirmText(""); }}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}
      {sectionDone && <p className="ucc-tiny" style={{ color: "var(--green)" }}>{sectionDone} cleared.</p>}

      {!open ? (
        <button className="ucc-btn ghost" style={{ borderColor: "var(--red)", color: "var(--red)" }} onClick={() => setOpen(true)}>
          <Trash2 size={14} /> Reset all data
        </button>
      ) : (
        <div style={{ border: "1px solid var(--red)", background: "var(--red-soft)", borderRadius: 8, padding: 12 }}>
          <p className="ucc-tiny">
            This permanently clears <strong>Syllabus, Classes, Reading, Single Pager, NCERT, Standard Books,
            Tamil Literature Reading &amp; Writing, Current Affairs, GS Answer Writing, AI Learning, all Daily
            Plans, End-of-day reviews, and Weekly reviews.</strong> Your Settings (subjects, wake time, slot
            template) are kept exactly as configured. This cannot be undone — any PDFs already in Google Drive
            are left untouched, only the app's own data is cleared.
          </p>
          <p className="ucc-tiny">Type <strong>RESET</strong> to confirm.</p>
          <div className="ucc-flex">
            <input className="ucc-input" style={{ maxWidth: 140 }} value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="RESET" />
            <button className="ucc-btn primary" style={{ background: "var(--red)", borderColor: "var(--red)" }} disabled={confirmText !== "RESET"} onClick={resetAllData}>
              <Trash2 size={14} /> Confirm reset
            </button>
            <button className="ucc-btn ghost" onClick={() => { setOpen(false); setConfirmText(""); }}>Cancel</button>
          </div>
        </div>
      )}
      {done && <p className="ucc-tiny" style={{ color: "var(--green)" }}>All tracked data cleared — your Settings were kept.</p>}
    </div>
  );
}

/* ============================================================
   IMPORT / EXPORT
   ============================================================ */
const IMPORT_TARGETS = {
  classes: {
    label: "Classes", fields: ["date", "subject", "classNumber", "topic", "subtopic", "microtopic", "eta", "status"],
    aliases: {
      date: ["date"], subject: ["subject"], classNumber: ["class", "today's class number", "class number", "classno", "class no"],
      topic: ["topic"], subtopic: ["subtopic", "sub topic"], microtopic: ["microtopic", "micro topic"], eta: ["eta"], status: ["status"],
    },
    dupKey: r => normKey(r.subject, r.topic, r.classNumber),
  },
  // Topic Completion (reading) has no import target anymore — rows are a
  // computed 1:1 overview of Syllabus now (see "TOPIC COMPLETION —
  // COMPUTED-FIELD HELPERS"), not a freestanding importable list; Class
  // Notes/Standard Material/NCERT/Single Pager are all derived, and
  // Revision 1/2 are set directly on the Topic Completion tab itself.
  singlePager: {
    label: "Single Pager",
    fields: ["date", "subject", "topic", "subtopic", "microtopic", "classNotes", "handout", "ncert", "standardBooks", "status", "revision"],
    aliases: {
      date: ["date"], subject: ["subject"], topic: ["topic"], subtopic: ["subtopic", "sub topic"], microtopic: ["microtopic", "micro topic"],
      classNotes: ["class notes"], handout: ["handout"], ncert: ["ncert"], standardBooks: ["standard books"], status: ["status"], revision: ["revision"],
    },
    dupKey: r => normKey(r.subject, r.topic),
  },
  syllabus: {
    label: "Syllabus", fields: ["gsPaper", "subject", "topic", "subtopic", "microtopic"],
    aliases: {
      gsPaper: ["gs paper", "gspaper", "paper"], subject: ["subject"], topic: ["topic"],
      subtopic: ["subtopic", "sub topic"], microtopic: ["microtopic", "micro topic"],
    },
    dupKey: r => normKey(r.subject, r.topic, r.subtopic, r.microtopic),
  },
  ncert: {
    label: "NCERT",
    fields: ["subject", "topic", "subtopic", "microtopic", "book", "chapter"],
    aliases: {
      subject: ["subject"], topic: ["topic"], subtopic: ["subtopic", "sub topic"], microtopic: ["microtopic", "micro topic"],
      book: ["book"], chapter: ["chapter"],
    },
    dupKey: r => normKey(r.subject, r.topic, r.subtopic, r.microtopic, r.book, r.chapter),
  },
  standardBooks: {
    label: "Standard Books",
    fields: ["subject", "topic", "subtopic", "microtopic", "bookName", "chapter", "pages"],
    aliases: {
      subject: ["subject"], topic: ["topic"], subtopic: ["subtopic", "sub topic"], microtopic: ["microtopic", "micro topic"],
      bookName: ["book", "book name"], chapter: ["chapter"], pages: ["pages"],
    },
    dupKey: r => normKey(r.subject, r.topic, r.subtopic, r.microtopic, r.bookName, r.chapter),
  },
  tamilReading: {
    label: "Tamil Reading",
    fields: ["topic", "source", "notes"],
    aliases: { topic: ["topic"], source: ["source"], notes: ["notes", "what i've learned", "what ive learned"] },
    dupKey: r => normKey(r.topic, r.source),
  },
  tamilWriting: {
    label: "Tamil Writing",
    fields: ["date", "topic", "question", "wordLimit", "selfEvaluation", "marksScored", "marksMax", "status"],
    aliases: {
      date: ["date"], topic: ["topic"], question: ["question"], wordLimit: ["word limit", "wordlimit"],
      selfEvaluation: ["remarks summary", "self eval", "selfevaluation"], marksScored: ["marks scored", "scored"],
      marksMax: ["max marks", "maximum marks", "marksmax"], status: ["status"],
    },
    dupKey: r => normKey(r.date, r.topic),
  },
  currentAffairs: {
    label: "Current Affairs",
    fields: ["date", "title", "source", "subject", "relevantSyllabusTopic", "subtopic", "microtopic"],
    aliases: {
      date: ["date"], title: ["topic / title", "title"], source: ["source"], subject: ["subject"],
      relevantSyllabusTopic: ["topic", "syllabus topic", "relevant syllabus topic"],
      subtopic: ["subtopic", "sub topic"], microtopic: ["microtopic", "micro topic"],
    },
    dupKey: r => normKey(r.date, r.title),
  },
  answerWriting: {
    label: "GS Answer Writing",
    fields: ["date", "gsPaper", "topic", "question", "wordLimit", "status", "selfScore", "improvementNotes"],
    aliases: {
      date: ["date"], gsPaper: ["gs paper", "gspaper"], topic: ["topic"], question: ["question"],
      wordLimit: ["word limit", "wordlimit"], status: ["status"], selfScore: ["self score", "score"],
      improvementNotes: ["improvement notes", "notes"],
    },
    dupKey: r => normKey(r.date, r.gsPaper, r.topic),
  },
  topperCopies: {
    label: "Topper Copies",
    fields: ["date", "gsPaper", "topic", "question", "observations", "status"],
    aliases: {
      date: ["date"], gsPaper: ["gs paper", "gspaper"], topic: ["topic"], question: ["question"],
      observations: ["observations", "notes"], status: ["status"],
    },
    dupKey: r => normKey(r.date, r.gsPaper, r.topic),
  },
  aiLearning: {
    label: "AI Learning",
    fields: ["date", "topic", "duration", "status", "notes"],
    aliases: { date: ["date"], topic: ["topic"], duration: ["duration", "duration (min)"], status: ["status"], notes: ["notes"] },
    dupKey: r => normKey(r.date, r.topic),
  },
};

const IMPORT_FIELD_LABELS = {
  date: "Date", subject: "Subject", classNumber: "Class", eta: "ETA",
  topic: "Topic", status: "Status", classNotes: "Class Notes", ncert: "NCERT",
  singlePager: "Single Pager", revision: "Revision",
  handout: "Handout", standardBooks: "Standard Books",
  gsPaper: "GS Paper", subtopic: "Subtopic", microtopic: "Micro Topic",
  book: "Book", chapter: "Chapter", bookName: "Book", pages: "Pages",
  source: "Source", notes: "Notes", question: "Question", wordLimit: "Word Limit",
  selfEvaluation: "Remarks Summary", marksScored: "Marks Scored", marksMax: "Max Marks",
  title: "Topic / Title", relevantSyllabusTopic: "Topic", duration: "Duration (min)",
  selfScore: "Self Score", improvementNotes: "Improvement Notes", observations: "Observations",
};
// A blank workbook with just the header row (friendly labels) for one
// import target — lets someone fill it in offline in the exact shape the
// importer expects, rather than guessing column names.
function downloadImportTemplate(targetKey) {
  const cfg = IMPORT_TARGETS[targetKey];
  const headerRow = cfg.fields.map(f => IMPORT_FIELD_LABELS[f] || f);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headerRow]);
  XLSX.utils.book_append_sheet(wb, ws, cfg.label.slice(0, 31));
  XLSX.writeFile(wb, `upsc-2027-${targetKey}-template.xlsx`);
}

function ImportExportTab({ db, updateSlice }) {
  const [file, setFile] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [sheet, setSheet] = useState("");
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [target, setTarget] = useState("classes");
  const [mapping, setMapping] = useState({});
  const [skipDup, setSkipDup] = useState({});
  const [summary, setSummary] = useState(null);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "array" });
      setSheetNames(wb.SheetNames);
      setSheet(wb.SheetNames[0]);
      loadSheet(wb, wb.SheetNames[0]);
      window.__uccWb = wb;
    };
    reader.readAsArrayBuffer(f);
  }
  function loadSheet(wb, name) {
    const ws = wb.Sheets[name];
    const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
    setRows(json);
    setHeaders(json.length ? Object.keys(json[0]) : []);
    autoMap(json.length ? Object.keys(json[0]) : []);
  }
  function autoMap(cols) {
    const cfg = IMPORT_TARGETS[target];
    const m = {};
    cfg.fields.forEach(f => {
      const aliasList = cfg.aliases[f] || [f];
      const found = cols.find(c => aliasList.some(a => c.toLowerCase().replace(/[^a-z0-9]/g, "").includes(a.replace(/[^a-z0-9]/g, ""))));
      m[f] = found || "";
    });
    setMapping(m);
  }
  useEffect(() => { if (headers.length) autoMap(headers); /* eslint-disable-next-line */ }, [target]);

  const cfg = IMPORT_TARGETS[target];
  const existing = db[target] || [];
  const mappedPreview = rows.slice(0, 300).map(r => {
    const rec = {};
    cfg.fields.forEach(f => { rec[f] = mapping[f] ? r[mapping[f]] : ""; });
    rec.__dupKey = cfg.dupKey(rec);
    rec.__isDup = existing.some(e => cfg.dupKey(e) === rec.__dupKey && rec.__dupKey.trim() !== "|" && rec.__dupKey.trim() !== "");
    return rec;
  });

  function runImport() {
    const toAdd = [];
    let skipped = 0;
    mappedPreview.forEach((rec, i) => {
      const shouldSkip = rec.__isDup && skipDup[i] !== false;
      if (shouldSkip) { skipped++; return; }
      const clean = { id: uid(), history: [] };
      cfg.fields.forEach(f => { clean[f] = rec[f]; });
      if (target === "singlePager") {
        ["classNotes", "handout", "ncert", "standardBooks"].forEach(f => { if (!clean[f]) clean[f] = "Not Included"; });
        if (!clean.status) clean.status = "Not Started";
        if (!clean.revision) clean.revision = "Yet to Start";
      }
      // Classes/NCERT/Standard Books/Single Pager all tag Micro Topics as an
      // array now (rec.microtopics) instead of the single rec.microtopic a
      // plain import column can give us — that one value becomes the sole
      // starting tag; more can be added on the tracker's own tab afterwards.
      // GS Paper isn't part of any of these four's import columns yet, so an
      // imported row starts with it blank — set it on the tracker's own tab
      // (needed before Subject options will show up there).
      if (["classes", "ncert", "standardBooks", "singlePager"].includes(target)) {
        clean.microtopics = clean.microtopic ? [clean.microtopic] : [];
        delete clean.microtopic;
      }
      if (target === "classes" && !clean.status) clean.status = "Completed";
      if (target === "tamilWriting" && !clean.status) clean.status = "Not Started";
      if (target === "currentAffairs") {
        clean.driveFile = null;
      }
      if (target === "answerWriting" && !clean.status) clean.status = "Not Started";
      if (target === "topperCopies" && !clean.status) clean.status = "Not Completed";
      if (target === "aiLearning" && !clean.status) clean.status = "Not Started";
      toAdd.push(clean);
    });
    updateSlice(target, prev => [...prev, ...toAdd]);
    setSummary({ imported: toAdd.length, skipped });
  }

  function exportAllExcel() {
    const wb = XLSX.utils.book_new();
    STORAGE_KEYS.filter(k => Array.isArray(db[k])).forEach(k => {
      const clean = db[k].map(({ history, ...rest }) => rest);
      const ws = XLSX.utils.json_to_sheet(clean.length ? clean : [{}]);
      XLSX.utils.book_append_sheet(wb, ws, k.slice(0, 31));
    });
    XLSX.writeFile(wb, "upsc-2027-export.xlsx");
  }
  function exportJSON() {
    downloadBlob(JSON.stringify(db, null, 2), "upsc-2027-export.json", "application/json");
  }

  return (
    <div>
      <div className="ucc-card">
        <h3>Import from Excel</h3>
        <p className="ucc-tiny">Upload your existing tracker file. Nothing is saved until you review the preview and click Import.</p>
        <div className="ucc-tiny" style={{ marginBottom: 6 }}>New to this? Download a blank template below, fill it in, then upload it.</div>
        <div className="ucc-flex wrap" style={{ marginBottom: 12 }}>
          {Object.entries(IMPORT_TARGETS).map(([k, v]) => (
            <button key={k} type="button" className="ucc-btn ghost" style={{ padding: "4px 10px" }} onClick={() => downloadImportTemplate(k)}>
              <Download size={12} /> {v.label} template
            </button>
          ))}
        </div>
        <div className="ucc-flex wrap" style={{ marginBottom: 10 }}>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
          {sheetNames.length > 0 && (
            <select className="ucc-select" style={{ maxWidth: 200 }} value={sheet} onChange={e => { setSheet(e.target.value); loadSheet(window.__uccWb, e.target.value); }}>
              {sheetNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          <select className="ucc-select" style={{ maxWidth: 200 }} value={target} onChange={e => setTarget(e.target.value)}>
            {Object.entries(IMPORT_TARGETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        {headers.length > 0 && (
          <>
            <h3>Column mapping</h3>
            <div className="ucc-grid" style={{ marginBottom: 12 }}>
              {cfg.fields.map(f => (
                <div key={f}>
                  <label className="ucc-tiny">{f}</label>
                  <select className="ucc-select" value={mapping[f] || ""} onChange={e => setMapping(m => ({ ...m, [f]: e.target.value }))}>
                    <option value="">— not mapped —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <h3>Preview ({mappedPreview.length} rows{mappedPreview.some(r => r.__isDup) ? `, ${mappedPreview.filter(r => r.__isDup).length} possible duplicates` : ""})</h3>
            <div style={{ maxHeight: 300, overflow: "auto", border: "1px solid var(--line)", borderRadius: 6 }}>
              <table className="ucc-table">
                <thead><tr>{cfg.fields.map(f => <th key={f}>{f}</th>)}<th>Duplicate?</th><th>Action</th></tr></thead>
                <tbody>
                  {mappedPreview.slice(0, 100).map((r, i) => (
                    <tr key={i}>
                      {cfg.fields.map(f => <td key={f} className="ucc-tiny">{String(r[f] ?? "")}</td>)}
                      <td>{r.__isDup ? <Badge tone="amber">Possible duplicate</Badge> : <Badge tone="grey">New</Badge>}</td>
                      <td>
                        {r.__isDup && (
                          <label className="ucc-tiny"><input type="checkbox" checked={skipDup[i] !== false} onChange={e => setSkipDup(s => ({ ...s, [i]: !e.target.checked }))} /> Skip</label>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="ucc-btn primary" style={{ marginTop: 10 }} onClick={runImport}><Upload size={14} /> Import into {cfg.label}</button>
            {summary && <div className="ucc-tiny" style={{ marginTop: 8 }}>Imported {summary.imported} record(s), skipped {summary.skipped} likely duplicate(s).</div>}
          </>
        )}
      </div>
      <div className="ucc-card">
        <h3>Export / backup</h3>
        <div className="ucc-flex wrap">
          <button className="ucc-btn" onClick={exportAllExcel}><Download size={14} /> Export all as Excel</button>
          <button className="ucc-btn" onClick={exportJSON}><Download size={14} /> Export all as JSON</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   APP SHELL
   ============================================================ */
const TABS = [
  { id: "today", label: "Today", icon: Home },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "classes", label: "Classes", icon: Layers },
  { id: "reading", label: "Topic Completion", icon: BookOpen },
  { id: "syllabus", label: "Syllabus", icon: Library },
  { id: "singlePager", label: "Single Pager", icon: FileText },
  { id: "ncert", label: "NCERT", icon: BookMarked },
  { id: "standardBooks", label: "Standard Books", icon: BookMarked },
  { id: "tamil", label: "Tamil Literature", icon: Languages },
  { id: "currentAffairs", label: "Current Affairs", icon: Newspaper },
  { id: "answerWriting", label: "GS Answer Writing", icon: PenTool },
  { id: "aiLearning", label: "AI Learning", icon: Brain },
  { id: "topics", label: "Topic Master", icon: SearchIcon },
  { id: "search", label: "Search", icon: SearchIcon },
  { id: "weekly", label: "Weekly Review", icon: BarChart3 },
  { id: "importExport", label: "Import / Export", icon: Upload },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function Dashboard({ session }) {
  const { db, loaded, updateSlice, saveError } = useDB(session.user.id);
  const [tab, setTab] = useState("today");

  if (!loaded || !db) {
    return (
      <div className="ucc-root">
        <style>{CSS}</style>
        <div style={{ padding: 60, textAlign: "center", color: "var(--ink-muted)" }}>Loading your preparation data…</div>
      </div>
    );
  }

  const activeTabDef = TABS.find(t => t.id === tab);

  let body = null;
  if (tab === "today") body = <TodayTab db={db} updateSlice={updateSlice} onNavigate={setTab} />;
  else if (tab === "dashboard") body = <DashboardTab db={db} />;
  else if (tab === "classes") body = <ClassesTab db={db} updateSlice={updateSlice} />;
  else if (tab === "reading") body = <ReadingTab db={db} updateSlice={updateSlice} />;
  else if (tab === "syllabus") body = <SyllabusTab db={db} updateSlice={updateSlice} />;
  else if (tab === "singlePager") body = <SinglePagerTab db={db} updateSlice={updateSlice} />;
  else if (tab === "ncert") body = <NcertTab db={db} updateSlice={updateSlice} />;
  else if (tab === "standardBooks") body = <StandardBooksTab db={db} updateSlice={updateSlice} />;
  else if (tab === "tamil") body = <TamilTab db={db} updateSlice={updateSlice} />;
  else if (tab === "currentAffairs") body = <CurrentAffairsTab db={db} updateSlice={updateSlice} />;
  else if (tab === "answerWriting") body = <AnswerWritingTab db={db} updateSlice={updateSlice} />;
  else if (tab === "aiLearning") body = <AiLearningTab db={db} updateSlice={updateSlice} />;
  else if (tab === "topics") body = <TopicMasterTab db={db} onNavigate={setTab} />;
  else if (tab === "search") body = <SearchTab db={db} />;
  else if (tab === "weekly") body = <WeeklyReviewTab db={db} updateSlice={updateSlice} />;
  else if (tab === "importExport") body = <ImportExportTab db={db} updateSlice={updateSlice} />;
  else if (tab === "settings") body = <SettingsTab db={db} updateSlice={updateSlice} />;

  return (
    <div className="ucc-root">
      <style>{CSS}</style>
      <div className="ucc-mobile-tabs">
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="ucc-shell">
        <nav className="ucc-nav">
          <div className="ucc-nav-brand">
            <h1 className="ucc-display">UPSC 2027 Command Center</h1>
            <span>Personal preparation tracker</span>
          </div>
          <ul className="ucc-nav-list">
            {TABS.map(t => (
              <li key={t.id} className={`ucc-nav-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)} tabIndex={0}
                onKeyDown={e => { if (e.key === "Enter") setTab(t.id); }}>
                <t.icon size={15} /> {t.label}
              </li>
            ))}
          </ul>
          <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <div className="ucc-tiny" style={{ color: "#AEB6C4", marginBottom: 6, wordBreak: "break-all" }}>{session.user.email}</div>
            <button className="ucc-btn ghost" style={{ color: "#EDEFF3", width: "100%", justifyContent: "flex-start" }}
              onClick={() => supabase.auth.signOut()}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </nav>
        <div className="ucc-main">
          <div className="ucc-topbar">
            <div>
              <h2 className="ucc-display">{activeTabDef ? activeTabDef.label : ""}</h2>
              <div className="sub ucc-mono ucc-flex" style={{ gap: 8 }}>
                <span>{fmtDateLong(todayISO())}</span>
                <span>•</span>
                <LiveClock />
              </div>
            </div>
            {saveError && <div className="ucc-tiny" style={{ color: "var(--red)" }}><AlertTriangle size={12} /> {saveError}</div>}
          </div>
          <div className="ucc-content">{body}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   AUTH SCREEN
   ============================================================ */
function AuthScreen() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(""); setInfo(""); setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setInfo("Account created. If your Supabase project requires email confirmation, check your inbox, then sign in.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ucc-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <style>{CSS}</style>
      <form className="ucc-card" style={{ width: 340 }} onSubmit={submit}>
        <h1 className="ucc-display" style={{ fontSize: 17, margin: "0 0 4px 0" }}>UPSC 2027 Command Center</h1>
        <p className="ucc-tiny" style={{ marginBottom: 14 }}>Sign in to sync your preparation data across devices.</p>
        <label className="ucc-tiny">Email</label>
        <input className="ucc-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: 8, marginTop: 2 }} />
        <label className="ucc-tiny">Password</label>
        <input className="ucc-input" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: 12, marginTop: 2 }} />
        {error && <div className="ucc-tiny" style={{ color: "var(--red)", marginBottom: 8 }}>{error}</div>}
        {info && <div className="ucc-tiny" style={{ color: "var(--green)", marginBottom: 8 }}>{info}</div>}
        <button className="ucc-btn primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button type="button" className="ucc-btn ghost" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setInfo(""); }}>
          {mode === "signin" ? "Need an account? Create one" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}

/* ============================================================
   ROOT (auth gate)
   ============================================================ */
export default function Root() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="ucc-root">
        <style>{CSS}</style>
        <div style={{ padding: 60, textAlign: "center", color: "var(--ink-muted)" }}>Loading…</div>
      </div>
    );
  }
  if (!session) return <AuthScreen />;
  return <Dashboard session={session} />;
}
//Added for deployment of new environment variables
