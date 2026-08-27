import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient.js";
import {
  Home, BookOpen, Layers, FileText, Library, BookMarked, Languages,
  Newspaper, PenTool, Brain, Search as SearchIcon, BarChart3,
  Settings as SettingsIcon, Upload, Download, ChevronUp, ChevronDown,
  Plus, Trash2, History, Check, AlertTriangle, Clock, ChevronLeft,
  ChevronRight as ChevronRightIcon, X, LogOut
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
    --study:#29344A; --office:#7A6A52; --travel:#6E7C91; --ai:#B7791F; --break:#D8DBDC;
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
  table.ucc-table{border-collapse:collapse; width:100%; font-size:12.8px;}
  table.ucc-table th{
    text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:0.03em;
    color:var(--ink-muted); border-bottom:1px solid var(--line-strong); padding:6px 8px; white-space:nowrap;
  }
  table.ucc-table td{border-bottom:1px solid var(--line); padding:5px 8px; vertical-align:top;}
  table.ucc-table tr:hover td{background:#FAFAF8;}
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
  .ucc-planblock.section-colored{border-left:4px solid var(--section-color); background:color-mix(in srgb, var(--section-color) 7%, #fff);}
  .ucc-planblock .section-dot{width:9px;height:9px;border-radius:50%;background:var(--section-color);flex-shrink:0;margin-top:5px;}
  .ucc-plan-subblock{display:flex;align-items:center;gap:7px;font-size:11.5px;color:var(--ink-muted);padding:3px 0;}
  .ucc-plan-subblock .dot{width:6px;height:6px;border-radius:50%;background:var(--section-color);flex-shrink:0;}
  .ucc-link{color:var(--navy);text-decoration:underline;text-decoration-color:var(--line-strong);cursor:pointer;background:none;border:0;padding:0;font:inherit;text-align:left;}
  .ucc-link:hover{color:var(--navy-soft);text-decoration-color:var(--navy-soft);}
  .ucc-planblock .time{width:118px; flex-shrink:0;}
  .ucc-planblock .body{flex:1; min-width:0;}
  .ucc-arc{position:relative; height:34px; border-radius:6px; background:var(--grey-soft); overflow:hidden; margin:10px 0 4px 0;}
  .ucc-arc-seg{position:absolute; top:0; bottom:0;}
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
`;

/* ============================================================
   CONSTANTS
   ============================================================ */
const READ_STATUS = ["Yet to Start", "In Progress", "Completed", "Not Needed"];
const SYLLABUS_STATUS = ["Not Started", "In Progress", "Completed", "Revised", "Strong", "Weak"];
const TASK_STATUS = ["Not Started", "In Progress", "Completed", "Partially Completed", "Skipped"];
const SP_STATUS = ["Not Started", "In Progress", "Completed"];
const WRITING_STATUS = ["Not Started", "In Progress", "Done"];
const NCERT_STATUS = ["Not Started", "Reading", "Completed", "Revision"];
const SB_STATUS = ["Not Started", "Reading", "Completed", "Revision"];
const CA_STATUS = ["To Read", "Read", "Noted"];
const AI_STATUS = ["Not Started", "In Progress", "Completed"];
const SKIP_REASONS = ["Time shortage", "Office workload", "Fatigue", "Unexpected work", "Other"];

const STATUS_COLOR = {
  "Not Started": "neutral", "Yet to Start": "neutral", "To Read": "neutral",
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

// First reduce breaks from 15 -> 10 minutes. If the day still does not fit,
// drop removable sections in priority order. Only after those 10-minute breaks
// still cannot make the day fit do we reduce the remaining breaks to 5 minutes.
// The break immediately after Class Lecture (b2) is ALWAYS 15 minutes.
const REMOVAL_ORDER = ["ai", "s4", "s1", "s7", "s5", "s3"];
const BREAK_PAIR = { s1: "b1", s3: "b3", s4: "b4", s5: "b5" };

const SECTION_COLORS = {
  s1: "#53657A", s2: "#315E8C", s3: "#7A4E8C", s4: "#A65D2D",
  s5: "#28756A", s6: "#7B632A", s7: "#8A3F55", ai: "#B7791F",
  office: "#4E5D3C", break: "#A0A6AA"
};

const DAY_TYPES = ["WFH", "WFO", "Weekend"];

function isWeekendISO(dateISO) {
  const [y, m, d] = dateISO.split("-").map(Number);
  return [0, 6].includes(new Date(y, m - 1, d).getDay());
}
function defaultDayType(dateISO) { return isWeekendISO(dateISO) ? "Weekend" : "WFO"; }

// Builds the full candidate block list for a given day type, before any trimming.
function buildBaseBlocks(dayType, settings) {
  const byId = Object.fromEntries((settings.slotTemplate || CORE_SLOT_TEMPLATE).map(b => [b.id, b]));
  let blocks = CORE_SLOT_TEMPLATE.map(b => ({ ...b, duration: (byId[b.id] || b).duration }));

  if (dayType === "WFO") {
    const travel = Math.round((settings.travelHoursEachWay ?? 1) * 60);
    const office = Math.round((settings.officeHoursFixed ?? 6) * 60);

    blocks.push({
      id: "office", label: "Office Work", type: "office", link: "office",
      duration: office + travel * 2, removable: false,
      subBlocks: [
        { id: "travelTo", label: "Commute to office", duration: travel },
        { id: "officeWork", label: "Office work", duration: office },
        { id: "travelFro", label: "Commute from office", duration: travel }
      ]
    });
  } else if (dayType === "WFH") {
    const office = Math.round((settings.officeHoursFixed ?? 6) * 60);
    blocks.push({
      id: "office", label: "Office Work", type: "office", link: "office",
      duration: office, removable: false,
      subBlocks: [
        { id: "officeWork", label: "Office work", duration: office }
      ]
    });
  }

  const aiDefault = byId.ai || AI_BLOCK;
  blocks.push({ ...AI_BLOCK, duration: aiDefault.duration });

  return blocks;
}

// Applies rules (a)-(g) one at a time, stopping as soon as the plan fits.
// Returns the surviving blocks plus a human-readable log of what was adjusted.
function applyTrimRules(blocks, availableMinutes) {
  let working = blocks.map(b => ({ ...b }));
  const totalNeeded = () => working.reduce((sum, b) => sum + b.duration, 0);
  const notes = [];

  if (totalNeeded() <= availableMinutes) return { blocks: working, notes };

  // Pass 1: reduce all normal breaks to 10 minutes. Class Lecture's break stays 15.
  const tenMinShrinkable = working.filter(
    b => b.type === "break" && b.id !== "b2" && b.duration > 10
  );

  if (tenMinShrinkable.length) {
    working = working.map(b =>
      (b.type === "break" && b.id !== "b2" && b.duration > 10)
        ? { ...b, duration: 10 }
        : b
    );

    notes.push(
      "Shortened normal breaks to 10 minutes (Class Lecture break remains 15 minutes)"
    );

    if (totalNeeded() <= availableMinutes) return { blocks: working, notes };
  }

  // Pass 2: drop removable sections while preserving the 10-minute breaks.
  for (const id of REMOVAL_ORDER) {
    const idx = working.findIndex(b => b.id === id);
    if (idx === -1) continue;

    const label = working[idx].label;
    const pairId = BREAK_PAIR[id];

    working = working.filter(
      b => b.id !== id && b.id !== pairId
    );

    notes.push(`Dropped "${label}" today — not enough time`);

    if (totalNeeded() <= availableMinutes) return { blocks: working, notes };
  }

  // Pass 3: only now reduce remaining normal breaks to 5 minutes. b2 remains 15.
  const fiveMinShrinkable = working.filter(
    b => b.type === "break" && b.id !== "b2" && b.duration > 5
  );

  if (fiveMinShrinkable.length) {
    working = working.map(b =>
      (b.type === "break" && b.id !== "b2" && b.duration > 5)
        ? { ...b, duration: 5 }
        : b
    );

    notes.push(
      "Shortened remaining normal breaks to 5 minutes (Class Lecture break remains 15 minutes)"
    );

    if (totalNeeded() <= availableMinutes) return { blocks: working, notes };
  }

  // Pass 4: if still over capacity, continue dropping removable sections.
  for (const id of REMOVAL_ORDER) {
    const idx = working.findIndex(b => b.id === id);
    if (idx === -1) continue;

    const label = working[idx].label;
    const pairId = BREAK_PAIR[id];

    working = working.filter(
      b => b.id !== id && b.id !== pairId
    );

    notes.push(`Dropped "${label}" today — not enough time`);

    if (totalNeeded() <= availableMinutes) return { blocks: working, notes };
  }

  return { blocks: working, notes };
}


/* ============================================================
   SYLLABUS SEED
   ============================================================ */

// Detailed subtopics intentionally left for the user to add / import from the real syllabus PDF.
const SYLLABUS_SEED = [
  { paper: "Prelims", subject: "GS Paper I", topic: "Current Events of National & International Importance" },
  { paper: "Prelims", subject: "GS Paper I", topic: "History of India & Indian National Movement" },
  { paper: "Prelims", subject: "GS Paper I", topic: "Indian & World Geography" },
  { paper: "Prelims", subject: "GS Paper I", topic: "Indian Polity & Governance" },
  { paper: "Prelims", subject: "GS Paper I", topic: "Economic & Social Development" },
  { paper: "Prelims", subject: "GS Paper I", topic: "Environment, Ecology, Biodiversity & Climate Change" },
  { paper: "Prelims", subject: "GS Paper I", topic: "General Science" },
  { paper: "Prelims", subject: "GS Paper II (CSAT)", topic: "Comprehension" },
  { paper: "Prelims", subject: "GS Paper II (CSAT)", topic: "Logical Reasoning & Analytical Ability" },
  { paper: "Prelims", subject: "GS Paper II (CSAT)", topic: "Decision Making & Problem Solving" },
  { paper: "Prelims", subject: "GS Paper II (CSAT)", topic: "General Mental Ability / Basic Numeracy / Data Interpretation" },
  { paper: "Mains", subject: "Essay", topic: "Essay Paper" },
  { paper: "Mains", subject: "GS Paper I", topic: "Indian Heritage & Culture" },
  { paper: "Mains", subject: "GS Paper I", topic: "Indian & World History" },
  { paper: "Mains", subject: "GS Paper I", topic: "Geography of the World & Society" },
  { paper: "Mains", subject: "GS Paper II", topic: "Governance, Constitution, Polity" },
  { paper: "Mains", subject: "GS Paper II", topic: "Social Justice" },
  { paper: "Mains", subject: "GS Paper II", topic: "International Relations" },
  { paper: "Mains", subject: "GS Paper III", topic: "Technology, Economic Development" },
  { paper: "Mains", subject: "GS Paper III", topic: "Biodiversity & Environment" },
  { paper: "Mains", subject: "GS Paper III", topic: "Security & Disaster Management" },
  { paper: "Mains", subject: "GS Paper IV", topic: "Ethics, Integrity & Aptitude" },
  { paper: "Mains", subject: "Optional Paper I", topic: "Tamil Literature — add sections after syllabus import" },
  { paper: "Mains", subject: "Optional Paper II", topic: "Tamil Literature — add sections after syllabus import" },
  { paper: "Interview", subject: "Personality Test", topic: "Personality Test" },
];

const STORAGE_KEYS = [
  "settings", "syllabus", "classes", "reading", "singlePager", "ncert", "standardBooks",
  "tamilReading", "tamilWriting", "currentAffairs", "answerWriting", "aiLearning",
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
      slotTemplate: [...CORE_SLOT_TEMPLATE, AI_BLOCK],
    },

    syllabus: SYLLABUS_SEED.map(s => ({
      id: uid(),
      ...s,
      subtopic: "",
      studyStatus: "Not Started",
      revisionStatus: "Not Started",
      history: []
    })),

    classes: [],
    reading: [],
    singlePager: [],
    ncert: [],
    standardBooks: [],
    tamilReading: [],
    tamilWriting: [],
    currentAffairs: [],
    answerWriting: [],
    aiLearning: [],
    dailyPlans: {},
    dailyReviews: {},
    weeklyReviews: {},
  };
}


/* ============================================================
   UTILITIES
   ============================================================ */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function todayISO() {
  const d = new Date();
  return isoFromDate(d);
}

function isoFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
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

  return dt.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
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

  const h = Math.floor(m / 60);
  const mm = m % 60;

  const hh = String(h).padStart(2, "0");
  const mmS = String(mm).padStart(2, "0");

  return (overflowDays > 0 ? "+1d " : "") + `${hh}:${mmS}`;
}

function normKey(...parts) {
  return parts
    .map(p => String(p || "").trim().toLowerCase())
    .join("|");
}

function weekStartISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);

  const day = dt.getDay();

  // Monday start
  const diff = (day === 0 ? -6 : 1) - day;

  dt.setDate(dt.getDate() + diff);

  return isoFromDate(dt);
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function normalizeSettings(s) {
  const defaults = defaultDB().settings;

  if (!s) return defaults;

  const merged = { ...defaults, ...s };

  if (merged.officeHoursFixed == null) {
    merged.officeHoursFixed =
      s.officeDurationDefault ?? defaults.officeHoursFixed;
  }

  if (merged.travelHoursEachWay == null) {
    merged.travelHoursEachWay = defaults.travelHoursEachWay;
  }

  if (
    !Array.isArray(merged.slotTemplate) ||
    !merged.slotTemplate.some(b => b.id === "s1")
  ) {
    merged.slotTemplate = defaults.slotTemplate;
  }

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
        const { data, error } = await supabase
          .from("kv_store")
          .select("key,value")
          .eq("user_id", userId);

        if (error) throw error;

        const map = {};

        (data || []).forEach(row => {
          map[row.key] = row.value;
        });

        STORAGE_KEYS.forEach(k => {
          out[k] =
            map[k] !== undefined
              ? map[k]
              : defaults[k];
        });

        out.settings = normalizeSettings(out.settings);

      } catch (e) {
        STORAGE_KEYS.forEach(k => {
          out[k] = defaults[k];
        });

        if (!cancelled) {
          setSaveError(
            `Could not load your data — ${e.message || e}`
          );
        }
      }

      if (!cancelled) {
        setDb(out);
        setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const updateSlice = useCallback((key, updater) => {
    setDb(prev => {
      if (!prev) return prev;

      const nextVal =
        typeof updater === "function"
          ? updater(prev[key])
          : updater;

      const next = {
        ...prev,
        [key]: nextVal
      };

      supabase
        .from("kv_store")
        .upsert(
          {
            user_id: userId,
            key,
            value: nextVal,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: "user_id,key"
          }
        )
        .then(({ error }) => {
          if (error) {
            setSaveError(
              `Could not save "${key}" — ${error.message}`
            );
          }
        });

      return next;
    });
  }, [userId]);

  return {
    db,
    loaded,
    updateSlice,
    saveError,
    setSaveError
  };
}


/* ============================================================
   SMALL UI ATOMS
   ============================================================ */

function Badge({ children, tone = "neutral" }) {
  return (
    <span className={`ucc-badge ${tone}`}>
      {children}
    </span>
  );
}

function StatusSelect({ value, options, onChange }) {
  return (
    <select
      className={`ucc-status ${colorFor(value)}`}
      value={value || options[0]}
      onChange={e => onChange(e.target.value)}
    >
      {options.map(o => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function EmptyState({ children }) {
  return (
    <div className="ucc-empty">
      {children}
    </div>
  );
}

function IconBtn({ icon: Icon, onClick, title, danger }) {
  return (
    <button
      className="ucc-btn ghost"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        padding: "5px 7px",
        color: danger ? "var(--red)" : undefined
      }}
    >
      <Icon size={14} />
    </button>
  );
}


/* ============================================================
   GENERIC TRACKER TABLE
   ============================================================ */

function GenericTracker({
  records,
  setRecords,
  columns,
  newRecord,
  emptyMessage,
  dense
}) {
  const [expanded, setExpanded] = useState(() => new Set());

  function updateField(rec, col, val, isStatus) {
    setRecords(prev =>
      prev.map(r => {
        if (r.id !== rec.id) return r;

        const updated = {
          ...r,
          [col.key]: val
        };

        if (isStatus) {
          const from = r[col.key] || "(empty)";

          updated.history = [
            ...(r.history || []),
            {
              field: col.label,
              from,
              to: val,
              at: new Date().toISOString()
            }
          ];
        }

        return updated;
      })
    );
  }

  function removeRecord(id) {
    if (
      window.confirm(
        "Delete this record? This cannot be undone."
      )
    ) {
      setRecords(prev =>
        prev.filter(r => r.id !== id)
      );
    }
  }

  function addRecord() {
    const rec = {
      id: uid(),
      history: [],
      ...newRecord()
    };

    setRecords(prev => [...prev, rec]);
  }

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="ucc-table">
        <thead>
          <tr>
            {columns.map(c => (
              <th
                key={c.key}
                style={{
                  minWidth: c.width || 100
                }}
              >
                {c.label}
              </th>
            ))}

            <th style={{ width: 60 }}>
              Log
            </th>

            <th style={{ width: 40 }}></th>
          </tr>
        </thead>

        <tbody>
          {records.length === 0 && (
            <tr>
              <td colSpan={columns.length + 2}>
                <EmptyState>
                  {emptyMessage ||
                    "No records yet. Add your first one below."}
                </EmptyState>
              </td>
            </tr>
          )}

          {records.map(rec => {
            const histCount =
              (rec.history || []).length;

            return (
              <React.Fragment key={rec.id}>
                <tr>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.type === "status" ? (
                        <StatusSelect
                          value={rec[col.key]}
                          options={col.options}
                          onChange={v =>
                            updateField(
                              rec,
                              col,
                              v,
                              true
                            )
                          }
                        />
                      ) : col.type === "date" ? (
                        <input
                          type="date"
                          className="ucc-input ucc-mono"
                          value={rec[col.key] || ""}
                          onChange={e =>
                            updateField(
                              rec,
                              col,
                              e.target.value
                            )
                          }
                        />
                      ) : col.type === "number" ? (
                        <input
                          type="number"
                          className="ucc-input ucc-mono"
                          value={
                            rec[col.key] ?? ""
                          }
                          onChange={e =>
                            updateField(
                              rec,
                              col,
                              e.target.value
                            )
                          }
                          style={{
                            width: 70
                          }}
                        />
                      ) : col.type === "textarea" ? (
                        <textarea
                          className="ucc-textarea"
                          value={
                            rec[col.key] || ""
                          }
                          onChange={e =>
                            updateField(
                              rec,
                              col,
                              e.target.value
                            )
                          }
                          rows={dense ? 1 : 2}
                        />
                      ) : col.type === "select" ? (
                        <select
                          className="ucc-select"
                          value={
                            rec[col.key] || ""
                          }
                          onChange={e =>
                            updateField(
                              rec,
                              col,
                              e.target.value
                            )
                          }
                        >
                          <option value="">
                            —
                          </option>

                          {col.options.map(o => (
                            <option
                              key={o}
                              value={o}
                            >
                              {o}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          list={col.datalist}
                          className="ucc-input"
                          value={
                            rec[col.key] || ""
                          }
                          onChange={e =>
                            updateField(
                              rec,
                              col,
                              e.target.value
                            )
                          }
                          placeholder={
                            col.placeholder
                          }
                        />
                      )}
                    </td>
                  ))}

                  <td>
                    {histCount > 0 ? (
                      <button
                        className="ucc-btn ghost"
                        style={{
                          padding: "3px 6px"
                        }}
                        onClick={() =>
                          toggleExpand(rec.id)
                        }
                        title="View change history"
                      >
                        <History size={12} />{" "}
                        {histCount}
                      </button>
                    ) : (
                      <span className="ucc-tiny">
                        —
                      </span>
                    )}
                  </td>

                  <td>
                    <IconBtn
                      icon={Trash2}
                      onClick={() =>
                        removeRecord(rec.id)
                      }
                      title="Delete"
                      danger
                    />
                  </td>
                </tr>

                {expanded.has(rec.id) && (
                  <tr className="ucc-histrow">
                    <td
                      colSpan={
                        columns.length + 2
                      }
                    >
                      <strong>
                        Change history
                      </strong>

                      <ul
                        style={{
                          margin: "4px 0 0 0",
                          paddingLeft: 18
                        }}
                      >
                        {(rec.history || [])
                          .slice()
                          .reverse()
                          .map((h, i) => (
                            <li key={i}>
                              {h.field}:{" "}
                              <em>
                                {h.from}
                              </em>{" "}
                              →{" "}
                              <strong>
                                {h.to}
                              </strong>{" "}
                              —{" "}
                              {new Date(
                                h.at
                              ).toLocaleString()}
                            </li>
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

      <button
        className="ucc-btn"
        style={{ marginTop: 10 }}
        onClick={addRecord}
      >
        <Plus size={14} /> Add row
      </button>
    </div>
  );
}


/* ============================================================
   DAY ARC (signature visual)
   ============================================================ */

function DayArc({
  blocks,
  wakeMinutes,
  sleepMinutes
}) {
  let cursor = wakeMinutes;

  const segs = [];

  blocks.forEach(b => {
    const dur = b.skipped
      ? 0
      : b.duration;

    if (dur > 0) {
      segs.push({
        ...b,
        start: cursor,
        end: cursor + dur
      });
    }

    cursor += dur;
  });

  const endMinutes = cursor;

  const totalSpan =
    Math.max(
      endMinutes,
      sleepMinutes
    ) - wakeMinutes;

  const colorFor2 = block =>
    SECTION_COLORS[block.id] ||
    SECTION_COLORS[block.type] ||
    "var(--grey)";

  const markerPct =
    ((sleepMinutes - wakeMinutes) /
      totalSpan) *
    100;

  return (
    <div>
      <div className="ucc-arc">
        {segs.map((s, i) => (
          <div
            key={i}
            className="ucc-arc-seg"
            title={`${s.label}: ${minutesToTime(
              s.start
            )}–${minutesToTime(s.end)}`}
            style={{
              left: `${
                ((s.start - wakeMinutes) /
                  totalSpan) *
                100
              }%`,
              width: `${
                ((s.end - s.start) /
                  totalSpan) *
                100
              }%`,
              background:
                s.end > sleepMinutes
                  ? "repeating-linear-gradient(45deg, var(--red), var(--red) 4px, #fff 4px, #fff 8px)"
                  : colorFor2(s),
              borderRight:
                "1px solid rgba(255,255,255,0.5)"
            }}
          />
        ))}

        <div
          className="ucc-arc-marker"
          style={{
            left: `${markerPct}%`
          }}
          title={`Sleep boundary ${minutesToTime(
            sleepMinutes
          )}`}
        />
      </div>

      <div className="ucc-flex between ucc-tiny ucc-mono">
        <span>
          Wake {minutesToTime(wakeMinutes)}
        </span>

        <span>
          Sleep boundary{" "}
          {minutesToTime(sleepMinutes)}
        </span>
      </div>
    </div>
  );
}


/* ============================================================
   PLANNER LOGIC
   ============================================================ */

function initDayPlan(
  dateISO,
  settings,
  dayType
) {
  const wakeTime =
    settings.wakeTimeDefault;

  const dt =
    dayType ||
    defaultDayType(dateISO);

  const available =
    parseTimeToMinutes(
      settings.sleepTime
    ) -
    parseTimeToMinutes(
      wakeTime
    );

  const base =
    buildBaseBlocks(
      dt,
      settings
    );

  const {
    blocks,
    notes
  } =
    applyTrimRules(
      base,
      available
    );

  return {
    date: dateISO,
    wakeTime,
    dayType: dt,
    trimNotes: notes,

    blocks: blocks.map(b => ({
      ...b,
      status: "Not Started",
      skipped: false,
      completedAt: null
    }))
  };
}

// Re-runs the day-type/wake-time -> composition logic (used whenever either
// input changes), while preserving progress on any block that survives and
// keeping any custom tasks the user added by hand.
function regeneratePlan(
  prevPlan,
  wakeTime,
  dayType,
  settings
) {
  const available =
    parseTimeToMinutes(
      settings.sleepTime
    ) -
    parseTimeToMinutes(
      wakeTime
    );

  const base =
    buildBaseBlocks(
      dayType,
      settings
    );

  const {
    blocks,
    notes
  } =
    applyTrimRules(
      base,
      available
    );

  const prevById =
    new Map(
      (prevPlan.blocks || [])
        .map(b => [b.id, b])
    );

  const merged =
    blocks.map(b => {
      const prev =
        prevById.get(b.id);

      return prev
        ? {
            ...b,
            status: prev.status,
            completedAt:
              prev.completedAt,
            skipped: false
          }
        : {
            ...b,
            status:
              "Not Started",
            completedAt:
              null,
            skipped: false
          };
    });

  const customBlocks =
    (prevPlan.blocks || [])
      .filter(b => b.custom);

  return {
    ...prevPlan,
    wakeTime,
    dayType,
    trimNotes: notes,
    blocks: [
      ...merged,
      ...customBlocks
    ]
  };
}

function computePlanTimes(plan) {
  const wakeMinutes =
    parseTimeToMinutes(
      plan.wakeTime
    );

  let cursor =
    wakeMinutes;

  const timed =
    plan.blocks.map(b => {
      const start =
        cursor;

      const dur =
        b.skipped
          ? 0
          : Number(
              b.duration || 0
            );

      cursor += dur;

      return {
        ...b,
        start,
        end: cursor
      };
    });

  return {
    wakeMinutes,
    endMinutes: cursor,
    blocks: timed
  };
}


/* ============================================================
   PRIORITY / LINKING HELPERS
   ============================================================ */

function upsertReadingForTopic(
  readingArr,
  subject,
  topic,
  classNumber,
  dateISO
) {
  const key =
    normKey(
      subject,
      topic
    );

  const existing =
    readingArr.find(
      r =>
        normKey(
          r.subject,
          r.topic
        ) === key
    );

  if (existing)
    return readingArr;

  return [
    ...readingArr,
    {
      id: uid(),
      date: dateISO,
      subject,
      classNumber:
        classNumber || "",
      topic,
      classNotes:
        "In Progress",
      standardMaterial:
        "Yet to Start",
      ncert:
        "Yet to Start",
      revision1:
        "Yet to Start",
      revision2:
        "Yet to Start",
      history: []
    }
  ];
}

function readingCompletionPct(rec) {
  const fields = [
    "classNotes",
    "standardMaterial",
    "ncert"
  ];

  const applicable =
    fields.filter(
      f =>
        rec[f] !==
        "Not Needed"
    );

  if (
    applicable.length === 0
  )
    return 100;

  const done =
    applicable.filter(
      f =>
        rec[f] ===
        "Completed"
    ).length;

  return Math.round(
    (done /
      applicable.length) *
      100
  );
}

function computePendingTasks(db) {
  const items = [];

  const yISO =
    addDaysISO(
      todayISO(),
      -1
    );

  // 2. Revision due
  db.reading.forEach(r => {
    if (
      r.classNotes ===
        "Completed" &&
      (
        r.revision1 ===
          "Yet to Start" ||
        r.revision1 ===
          "In Progress"
      )
    ) {
      items.push({
        cat: "Revision due",
        label: `${r.subject} — ${r.topic}`,
        detail:
          "Revision 1 pending",
        date: r.date
      });
    } else if (
      r.revision1 ===
        "Completed" &&
      (
        r.revision2 ===
          "Yet to Start" ||
        r.revision2 ===
          "In Progress"
      )
    ) {
      items.push({
        cat: "Revision due",
        label: `${r.subject} — ${r.topic}`,
        detail:
          "Revision 2 pending",
        date: r.date
      });
    }
  });

  // 3. Previous day's class notes
  const yClasses =
    db.classes
      .filter(
        c =>
          c.date === yISO &&
          c.status ===
            "Completed"
      )
      .slice()
      .sort(
        (a, b) =>
          new Date(
            b.completedAt ||
              `${b.date}T00:00:00`
          ) -
          new Date(
            a.completedAt ||
              `${a.date}T00:00:00`
          )
      );

  const latestYesterdayClass =
    yClasses[0];

  if (
    latestYesterdayClass
  ) {
    const r =
      db.reading.find(
        x =>
          normKey(
            x.subject,
            x.topic
          ) ===
          normKey(
            latestYesterdayClass.subject,
            latestYesterdayClass.topic
          )
      );

    if (
      !r ||
      r.classNotes !==
        "Completed"
    ) {
      items.push({
        cat: "Yesterday's class",
        label: `${latestYesterdayClass.subject} — ${latestYesterdayClass.topic}`,
        detail:
          "Class notes reading pending",
        date:
          latestYesterdayClass.date
      });
    }
  }

  // 5. Pending reading for completed classes
  db.reading.forEach(r => {
    if (
      r.classNotes ===
        "Completed" &&
      r.standardMaterial ===
        "Yet to Start"
    ) {
      items.push({
        cat: "Pending reading",
        label: `${r.subject} — ${r.topic}`,
        detail:
          "Standard material yet to start",
        date: r.date
      });
    } else if (
      r.classNotes ===
        "Completed" &&
      r.ncert ===
        "Yet to Start"
    ) {
      items.push({
        cat: "Pending reading",
        label: `${r.subject} — ${r.topic}`,
        detail:
          "NCERT yet to start",
        date: r.date
      });
    }
  });

  // 6. Overdue single pagers
  db.singlePager
    .filter(
      s =>
        s.status !==
        "Completed"
    )
    .forEach(s => {
      items.push({
        cat: "Single pager",
        label: `${s.subject} — ${s.topic}`,
        detail: `Single pager: ${
          s.status ||
          "Not Started"
        }`,
        date:
          s.date || ""
      });
    });

  // 7. Other pending
  db.tamilReading
    .filter(
      t =>
        t.status !==
        "Completed"
    )
    .forEach(t => {
      items.push({
        cat: "Other pending",
        label:
          t.topic,
        detail: `Tamil reading: ${
          t.status ||
          "Not Started"
        }`,
        date: ""
      });
    });

  db.ncert
    .filter(
      n =>
        n.status !==
        "Completed"
    )
    .forEach(n => {
      items.push({
        cat: "Other pending",
        label: `${n.subject} — ${
          n.topic ||
          n.chapter
        }`,
        detail: `NCERT: ${
          n.status ||
          "Not Started"
        }`,
        date: ""
      });
    });

  db.standardBooks
    .filter(
      s =>
        s.status !==
        "Completed"
    )
    .forEach(s => {
      items.push({
        cat: "Other pending",
        label: `${s.subject} — ${
          s.topic ||
          s.chapter
        }`,
        detail: `Standard book: ${
          s.status ||
          "Not Started"
        }`,
        date: ""
      });
    });

  const order = [
    "Revision due",
    "Yesterday's class",
    "Pending reading",
    "Single pager",
    "Other pending"
  ];

  items.sort(
    (a, b) =>
      order.indexOf(a.cat) -
        order.indexOf(b.cat) ||
      (b.date || "")
        .localeCompare(
          a.date || ""
        )
  );

  return items;
}


/* ============================================================
   TODAY / DASHBOARD TAB
   ============================================================ */

function TodayTab({
  db,
  updateSlice,
  onNavigateTab
}) {
  const [
    dateISO,
    setDateISO
  ] = useState(
    todayISO()
  );

  const settings =
    db.settings;

  const plan =
    db.dailyPlans[
      dateISO
    ] ||
    initDayPlan(
      dateISO,
      settings
    );

  useEffect(() => {
    if (
      !db.dailyPlans[
        dateISO
      ]
    ) {
      updateSlice(
        "dailyPlans",
        prev => ({
          ...prev,
          [dateISO]:
            initDayPlan(
              dateISO,
              settings
            )
        })
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateISO]);

  function setPlan(
    updater
  ) {
    updateSlice(
      "dailyPlans",
      prev => {
        const current =
          prev[dateISO] ||
          initDayPlan(
            dateISO,
            settings
          );

        const next =
          typeof updater ===
          "function"
            ? updater(
                current
              )
            : updater;

        return {
          ...prev,
          [dateISO]: next
        };
      }
    );
  }

  function changeWakeTime(
    newWakeTime
  ) {
    setPlan(p =>
      regeneratePlan(
        p,
        newWakeTime,
        p.dayType ||
          defaultDayType(
            dateISO
          ),
        settings
      )
    );
  }

  function changeDayType(
    newDayType
  ) {
    setPlan(p =>
      regeneratePlan(
        p,
        p.wakeTime,
        newDayType,
        settings
      )
    );
  }

  function updateBlock(
    id,
    patch
  ) {
    setPlan(p => ({
      ...p,
      blocks:
        p.blocks.map(
          b =>
            b.id === id
              ? {
                  ...b,
                  ...patch
                }
              : b
        )
    }));
  }

  function moveBlock(
    id,
    dir
  ) {
    setPlan(p => {
      const idx =
        p.blocks.findIndex(
          b =>
            b.id === id
        );

      const newIdx =
        idx + dir;

      if (
        newIdx < 0 ||
        newIdx >=
          p.blocks.length
      )
        return p;

      const blocks = [
        ...p.blocks
      ];

      [
        blocks[idx],
        blocks[newIdx]
      ] = [
        blocks[newIdx],
        blocks[idx]
      ];

      return {
        ...p,
        blocks
      };
    });
  }

  function addCustomBlock() {
    setPlan(p => ({
      ...p,
      blocks: [
        ...p.blocks,
        {
          id: uid(),
          label:
            "Custom task",
          type: "study",
          link: "custom",
          duration: 30,
          status:
            "Not Started",
          skipped: false,
          custom: true
        }
      ]
    }));
  }

  function removeBlock(id) {
    setPlan(p => ({
      ...p,
      blocks:
        p.blocks.filter(
          b =>
            b.id !== id
        )
    }));
  }

  const {
    wakeMinutes,
    endMinutes,
    blocks: timedBlocks
  } =
    computePlanTimes(
      plan
    );

  const sleepMinutes =
    parseTimeToMinutes(
      settings.sleepTime
    );

  const overflow =
    endMinutes -
    sleepMinutes;

  const pending =
    useMemo(
      () =>
        computePendingTasks(
          db
        ),
      [db]
    );

  const revisionDue =
    pending.filter(
      p =>
        p.cat ===
        "Revision due"
    );

  const yISO =
    addDaysISO(
      dateISO,
      -1
    );

  const yClasses =
    db.classes
      .filter(
        c =>
          c.date ===
            yISO &&
          c.status ===
            "Completed"
      )
      .slice()
      .sort(
        (a, b) =>
          new Date(
            b.completedAt ||
              `${b.date}T00:00:00`
          ) -
          new Date(
            a.completedAt ||
              `${a.date}T00:00:00`
          )
      );

  const pendingReadingCount =
    db.reading.filter(
      r =>
        readingCompletionPct(
          r
        ) < 100
    ).length;

  const pendingSP =
    db.singlePager.filter(
      s =>
        s.status !==
        "Completed"
    );

  const todayAnswers =
    db.answerWriting.filter(
      a =>
        a.date ===
        dateISO
    );

  const todayCA =
    db.currentAffairs.filter(
      c =>
        c.date ===
        dateISO
    );

  const syllabusDone =
    db.syllabus.filter(
      s =>
        s.studyStatus ===
          "Completed" ||
        s.studyStatus ===
          "Revised"
    ).length;

  const review =
    db.dailyReviews[
      dateISO
    ] || {
      notes: "",
      skipReason: ""
    };

  function setReview(
    patch
  ) {
    updateSlice(
      "dailyReviews",
      prev => ({
        ...prev,
        [dateISO]: {
          ...(prev[
            dateISO
          ] || {}),
          ...patch
        }
      })
    );
  }

  return (
    <div>
      <div className="ucc-card">
        <div className="ucc-flex between wrap">
          <div className="ucc-flex">
            <IconBtn
              icon={ChevronLeft}
              onClick={() =>
                setDateISO(
                  d =>
                    addDaysISO(
                      d,
                      -1
                    )
                )
              }
              title="Previous day"
            />

            <div>
              <div
                className="ucc-display"
                style={{
                  fontWeight: 700,
                  fontSize: 15
                }}
              >
                {fmtDateLong(
                  dateISO
                )}
              </div>

              {dateISO ===
                todayISO() && (
                <span className="ucc-badge amber">
                  Today
                </span>
              )}
            </div>

            <IconBtn
              icon={
                ChevronRightIcon
              }
              onClick={() =>
                setDateISO(
                  d =>
                    addDaysISO(
                      d,
                      1
                    )
                )
              }
              title="Next day"
            />
          </div>

          <div className="ucc-flex wrap">
            <label className="ucc-tiny">
              Wake time
              <input
                type="time"
                className="ucc-input ucc-mono"
                value={
                  plan.wakeTime
                }
                onChange={e =>
                  changeWakeTime(
                    e.target.value
                  )
                }
                style={{
                  marginLeft: 6,
                  width: 100
                }}
              />
            </label>

            <label className="ucc-tiny">
              Day type
              <select
                className="ucc-select"
                value={
                  plan.dayType ||
                  defaultDayType(
                    dateISO
                  )
                }
                onChange={e =>
                  changeDayType(
                    e.target.value
                  )
                }
                style={{
                  marginLeft: 6,
                  width: 110,
                  display:
                    "inline-block"
                }}
              >
                {DAY_TYPES.map(
                  t => (
                    <option
                      key={t}
                      value={t}
                    >
                      {t}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>
        </div>

        <DayArc
          blocks={
            timedBlocks
          }
          wakeMinutes={
            wakeMinutes
          }
          sleepMinutes={
            sleepMinutes
          }
        />

        {plan.trimNotes &&
          plan.trimNotes
            .length > 0 && (
            <TrimNotes
              notes={
                plan.trimNotes
              }
            />
          )}

        {overflow > 0 && (
          <div className="ucc-overflow-banner">
            <AlertTriangle
              size={15}
            />

            Schedule overflow
            — even after
            trimming
            everything
            adjustable, you
            have{" "}
            {Math.floor(
              overflow / 60
            )}
            h{" "}
            {overflow % 60}m
            of fixed work
            (class, GS
            reading,
            office/commute)
            that cannot fit
            before{" "}
            {
              settings.sleepTime
            }
            .
          </div>
        )}
      </div>

      <div className="ucc-card">
        <h3>
          Today's plan
        </h3>

        {timedBlocks.map(
          (b, i) => (
            <PlanBlock
              key={b.id}
              block={b}
              onUpdate={patch =>
                updateBlock(
                  b.id,
                  patch
                )
              }
              onMoveUp={
                i > 0
                  ? () =>
                      moveBlock(
                        b.id,
                        -1
                      )
                  : null
              }
              onMoveDown={
                i <
                timedBlocks.length -
                  1
                  ? () =>
                      moveBlock(
                        b.id,
                        1
                      )
                  : null
              }
              onRemove={
                b.custom
                  ? () =>
                      removeBlock(
                        b.id
                      )
                  : null
              }
              db={db}
              updateSlice={
                updateSlice
              }
              dateISO={
                dateISO
              }
              yesterdayISO={
                yISO
              }
            />
          )
        )}

        <button
          className="ucc-btn"
          onClick={
            addCustomBlock
          }
        >
          <Plus size={14} /> Add
          custom task
        </button>
      </div>

      <div className="ucc-grid">
        <SummaryCard
          title="Pending"
          count={
            pending.length
          }
        >
          {pending.length ===
          0 ? (
            <EmptyState>
              Nothing pending —
              clean slate.
            </EmptyState>
          ) : (
            pending
              .slice(0, 2)
              .map(
                (p, i) => (
                  <SummaryLinkedItem
                    key={i}
                    item={p}
                    onNavigateTab={
                      onNavigateTab
                    }
                  />
                )
              )
          )}
        </SummaryCard>

        <SummaryCard
          title="Revision due"
          count={
            revisionDue.length
          }
        >
          {revisionDue.length ===
          0 ? (
            <EmptyState>
              No revisions due
              today.
            </EmptyState>
          ) : (
            revisionDue
              .slice(0, 2)
              .map(
                (p, i) => (
                  <SummaryLinkedItem
                    key={i}
                    item={p}
                    onNavigateTab={
                      onNavigateTab
                    }
                  />
                )
              )
          )}
        </SummaryCard>

        <SummaryCard
          title="Class"
          count={
            yClasses.length
          }
        >
          {yClasses.length ===
          0 ? (
            <EmptyState>
              No class logged
              for{" "}
              {fmtDateLong(
                yISO
              )}
              .
            </EmptyState>
          ) : (
            yClasses.map(
              c => (
                <div
                  key={c.id}
                  className="ucc-tiny"
                >
                  {c.subject} #
                  {
                    c.classNumber
                  } —{" "}
                  {c.topic}
                </div>
              )
            )
          )}
        </SummaryCard>

        <SummaryCard
          title="Reading"
          count={
            pendingReadingCount
          }
        >
          {pendingReadingCount ===
          0 ? (
            <EmptyState>
              All tracked reading
              is up to date.
            </EmptyState>
          ) : (
            pending
              .filter(
                p =>
                  p.cat ===
                  "Pending reading"
              )
              .slice(0, 2)
              .map(
                (p, i) => (
                  <SummaryLinkedItem
                    key={i}
                    item={p}
                    onNavigateTab={
                      onNavigateTab
                    }
                  />
                )
              )
          )}
        </SummaryCard>

        <SummaryCard
          title="Single pager"
          count={
            pendingSP.length
          }
        >
          {pendingSP.length ===
          0 ? (
            <EmptyState>
              All tracked single
              pagers are up to
              date.
            </EmptyState>
          ) : (
            pendingSP
              .slice()
              .sort(
                (a, b) =>
                  (
                    b.date || ""
                  ).localeCompare(
                    a.date || ""
                  )
              )
              .slice(0, 2)
              .map(s => (
                <SummaryLinkedItem
                  key={s.id}
                  item={{
                    cat: "Single pager",
                    label: `${s.subject} — ${s.topic}`,
                    detail: `Single pager: ${
                      s.status ||
                      "Not Started"
                    }`
                  }}
                  onNavigateTab={
                    onNavigateTab
                  }
                />
              ))
          )}
        </SummaryCard>

        <SummaryCard
          title="Answer writing today"
          count={
            todayAnswers.length
          }
        >
          {todayAnswers.length ===
          0 ? (
            <EmptyState>
              No answer-writing
              task logged for
              today.
            </EmptyState>
          ) : (
            todayAnswers.map(
              a => (
                <div
                  key={a.id}
                  className="ucc-tiny"
                >
                  {a.gsPaper} —{" "}
                  {a.topic}{" "}
                  <Badge
                    tone={colorFor(
                      a.status
                    )}
                  >
                    {a.status}
                  </Badge>
                </div>
              )
            )
          )}
        </SummaryCard>

        <SummaryCard
          title="Current affairs today"
          count={
            todayCA.length
          }
        >
          {todayCA.length ===
          0 ? (
            <EmptyState>
              No current affairs
              added for today.
            </EmptyState>
          ) : (
            todayCA.map(
              c => (
                <div
                  key={c.id}
                  className="ucc-tiny"
                >
                  {c.title}
                </div>
              )
            )
          )}
        </SummaryCard>

        <SummaryCard
          title="Progress"
          count={
            syllabusDone
          }
        >
          <div className="ucc-tiny">
            {syllabusDone} of{" "}
            {
              db.syllabus
                .length
            } syllabus items
            completed/revised
          </div>

          <div className="ucc-tiny">
            {
              db.classes.filter(
                c =>
                  c.status ===
                  "Completed"
              ).length
            } classes completed
          </div>

          <div className="ucc-tiny">
            {
              db.singlePager.filter(
                s =>
                  s.status ===
                  "Completed"
              ).length
            } single pagers
            completed
          </div>
        </SummaryCard>
      </div>

      <div className="ucc-card">
        <h3>
          End-of-day review
        </h3>

        <div className="ucc-grid">
          <div>
            <label className="ucc-tiny">
              What did I complete /
              partially complete /
              skip — and why?
            </label>

            <textarea
              className="ucc-textarea"
              rows={3}
              value={
                review.notes
              }
              onChange={e =>
                setReview({
                  notes:
                    e.target.value
                })
              }
              placeholder="A few honest lines — this tracker shows discipline, not performance."
            />
          </div>

          <div>
            <label className="ucc-tiny">
              If something was
              skipped, reason
              (optional)
            </label>

            <select
              className="ucc-select"
              value={
                review.skipReason
              }
              onChange={e =>
                setReview({
                  skipReason:
                    e.target.value
                })
              }
            >
              <option value="">
                —
              </option>

              {SKIP_REASONS.map(
                r => (
                  <option
                    key={r}
                    value={r}
                  >
                    {r}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  count,
  children
}) {
  return (
    <div className="ucc-card">
      <div className="ucc-flex between">
        <h3
          style={{
            margin: 0
          }}
        >
          {title}
        </h3>

        <Badge
          tone={
            count > 0
              ? "amber"
              : "grey"
          }
        >
          {count}
        </Badge>
      </div>

      <div
        style={{
          marginTop: 8
        }}
      >
        {children}
      </div>
    </div>
  );
}

function PlanBlock({
  block,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove,
  db,
  updateSlice,
  dateISO,
  yesterdayISO
}) {
  const statusTone =
    colorFor(
      block.status ===
        "Completed"
        ? "Completed"
        : block.status
    );

  return (
    <div
      className={`ucc-planblock ${
        block.skipped
          ? "skipped"
          : ""
      } section-colored`}
      style={{
        "--section-color":
          SECTION_COLORS[
            block.id
          ] ||
          SECTION_COLORS[
            block.type
          ] ||
          "var(--grey)"
      }}
    >
      <div className="time ucc-mono ucc-tiny">
        {block.skipped
          ? "skipped"
          : `${minutesToTime(
              block.start
            )} – ${minutesToTime(
              block.end
            )}`}

        <div
          className="ucc-tiny"
          style={{
            marginTop: 4
          }}
        >
          <input
            type="number"
            className="ucc-input ucc-mono"
            style={{
              width: 60
            }}
            value={
              block.duration
            }
            onChange={e =>
              onUpdate({
                duration:
                  Number(
                    e.target
                      .value
                  )
              })
            }
          />{" "}
          min
        </div>
      </div>

      <div className="body">
        <div className="ucc-flex between wrap">
          <div className="ucc-flex">
            <span
              className="section-dot"
              style={{
                "--section-color":
                  SECTION_COLORS[
                    block.id
                  ] ||
                  SECTION_COLORS[
                    block.type
                  ] ||
                  "var(--grey)"
              }}
            />

            <strong>
              {block.label}
            </strong>
          </div>

          <div className="ucc-flex">
            {onMoveUp && (
              <IconBtn
                icon={ChevronUp}
                onClick={
                  onMoveUp
                }
                title="Move up"
              />
            )}

            {onMoveDown && (
              <IconBtn
                icon={ChevronDown}
                onClick={
                  onMoveDown
                }
                title="Move down"
              />
            )}

            <label className="ucc-tiny">
              <input
                type="checkbox"
                checked={
                  block.skipped
                }
                onChange={e =>
                  onUpdate({
                    skipped:
                      e.target
                        .checked
                  })
                }
              />{" "}
              Skip
            </label>

            {onRemove && (
              <IconBtn
                icon={Trash2}
                onClick={
                  onRemove
                }
                title="Remove"
                danger
              />
            )}
          </div>
        </div>

        {block.subBlocks &&
          block.subBlocks
            .length > 1 && (
            <div
              style={{
                marginTop: 5,
                padding:
                  "4px 0 2px 16px",
                borderLeft:
                  "1px solid var(--line)"
              }}
            >
              {block.subBlocks.map(
                sb => (
                  <div
                    className="ucc-plan-subblock"
                    key={sb.id}
                  >
                    <span
                      className="dot"
                      style={{
                        "--section-color":
                          SECTION_COLORS[
                            block.id
                          ] ||
                          "var(--grey)"
                      }}
                    />

                    {sb.label}

                    <span
                      className="ucc-mono"
                      style={{
                        marginLeft:
                          "auto"
                      }}
                    >
                      {sb.duration}{" "}
                      min
                    </span>
                  </div>
                )
              )}
            </div>
          )}

        {block.type !==
          "break" && (
          <div
            style={{
              marginTop: 6
            }}
          >
            <LinkedTaskInfo
              link={
                block.link
              }
              db={db}
              updateSlice={
                updateSlice
              }
              dateISO={
                dateISO
              }
              yesterdayISO={
                yesterdayISO
              }
            />

            <div
              className="ucc-flex wrap"
              style={{
                marginTop: 6
              }}
            >
              {TASK_STATUS.map(
                s => (
                  <button
                    key={s}
                    className="ucc-btn ghost"
                    style={{
                      padding:
                        "3px 8px",
                      fontWeight:
                        block.status ===
                        s
                          ? 800
                          : 600,
                      background:
                        block.status ===
                        s
                          ? "var(--grey-soft)"
                          : undefined
                    }}
                    onClick={() =>
                      onUpdate({
                        status: s,
                        completedAt:
                          s ===
                          "Completed"
                            ? new Date().toISOString()
                            : block.completedAt
                      })
                    }
                  >
                    {s}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
