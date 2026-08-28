import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
const SYLLABUS_STATUS = ["Not Started", "In Progress", "Completed", "Revised", "Strong", "Weak"];
const TASK_STATUS = ["Not Started", "In Progress", "Completed", "Partially Completed", "Skipped"];
const SP_STATUS = ["Not Started", "In Progress", "Completed"];
const WRITING_STATUS = ["Not Started", "In Progress", "Done"];
const NCERT_STATUS = ["Not Started", "Reading", "Completed", "Revision"];
const SB_STATUS = ["Not Started", "Reading", "Completed", "Revision"];
const CA_STATUS = ["To Read", "Read", "Noted"];
const AI_STATUS = ["Not Started", "In Progress", "Completed"];
const SKIP_REASONS = ["Time shortage", "Office workload", "Fatigue", "Unexpected work", "Other"];
const COVERAGE_OPTIONS = ["Prelims Only", "Mains Only", "Prelims + Mains", "Interview"];
const GS_PAPER_OPTIONS = ["GS Paper I", "GS Paper II", "GS Paper III", "GS Paper IV", "Essay", "CSAT", "Optional Paper I", "Optional Paper II", "Personality Test"];

// Maps the day-plan's generic task-status vocabulary onto whatever status
// vocabulary a specific tracker uses, so picking a status in Today's plan
// actually lands on the linked tracker page instead of being a dead click.
const STATUS_BRIDGE_MAP = {
  "Not Started": ["Yet to Start", "Not Started", "To Read"],
  "In Progress": ["In Progress", "Reading"],
  "Completed": ["Completed", "Done", "Read"],
  "Partially Completed": ["Partially Completed", "In Progress", "Reading"],
  "Skipped": ["Skipped", "Not Needed", "To Read"],
};
function bridgeStatus(taskStatus, targetOptions) {
  const candidates = STATUS_BRIDGE_MAP[taskStatus] || [taskStatus];
  for (const c of candidates) if (targetOptions.includes(c)) return c;
  return targetOptions[0];
}

const STATUS_COLOR = {
  "Not Started": "neutral", "To Read": "neutral",
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
    blocks.push({ id: "travelTo", label: "Office Commute (To)", type: "travel", link: "office", duration: travel, removable: false });
    blocks.push({ id: "office", label: "Office Work", type: "office", link: "office", duration: office, removable: false });
    blocks.push({ id: "travelFro", label: "Office Commute (Fro)", type: "travel", link: "office", duration: travel, removable: false });
  } else if (dayType === "WFH") {
    const office = Math.round((settings.officeHoursFixed ?? 6) * 60);
    blocks.push({ id: "office", label: "Office Work", type: "office", link: "office", duration: office, removable: false });
  }
  const aiDefault = byId.ai || AI_BLOCK;
  blocks.push({ ...AI_BLOCK, duration: aiDefault.duration });
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
// "gsPaper" + "coverage" capture the exam structure; "subject" is left blank
// (except where obvious, e.g. the optional) so it can be assigned from the
// real subject list on this Settings-managed list — that's what Class
// Lecture's subject-wise dropdowns key off.
const SYLLABUS_SEED = [
  { coverage: "Prelims Only", gsPaper: "GS Paper I", subject: "", topic: "Current Events of National & International Importance" },
  { coverage: "Prelims Only", gsPaper: "GS Paper I", subject: "History", topic: "History of India & Indian National Movement" },
  { coverage: "Prelims Only", gsPaper: "GS Paper I", subject: "Geography", topic: "Indian & World Geography" },
  { coverage: "Prelims Only", gsPaper: "GS Paper I", subject: "Polity", topic: "Indian Polity & Governance" },
  { coverage: "Prelims Only", gsPaper: "GS Paper I", subject: "Economy", topic: "Economic & Social Development" },
  { coverage: "Prelims Only", gsPaper: "GS Paper I", subject: "Environment & Ecology", topic: "Environment, Ecology, Biodiversity & Climate Change" },
  { coverage: "Prelims Only", gsPaper: "GS Paper I", subject: "Science & Technology", topic: "General Science" },
  { coverage: "Prelims Only", gsPaper: "CSAT", subject: "CSAT", topic: "Comprehension" },
  { coverage: "Prelims Only", gsPaper: "CSAT", subject: "CSAT", topic: "Logical Reasoning & Analytical Ability" },
  { coverage: "Prelims Only", gsPaper: "CSAT", subject: "CSAT", topic: "Decision Making & Problem Solving" },
  { coverage: "Prelims Only", gsPaper: "CSAT", subject: "CSAT", topic: "General Mental Ability / Basic Numeracy / Data Interpretation" },
  { coverage: "Mains Only", gsPaper: "Essay", subject: "Essay", topic: "Essay Paper" },
  { coverage: "Prelims + Mains", gsPaper: "GS Paper I", subject: "Art & Culture", topic: "Indian Heritage & Culture" },
  { coverage: "Prelims + Mains", gsPaper: "GS Paper I", subject: "History", topic: "Indian & World History" },
  { coverage: "Prelims + Mains", gsPaper: "GS Paper I", subject: "Geography", topic: "Geography of the World & Society" },
  { coverage: "Prelims + Mains", gsPaper: "GS Paper II", subject: "Polity", topic: "Governance, Constitution, Polity" },
  { coverage: "Mains Only", gsPaper: "GS Paper II", subject: "Polity", topic: "Social Justice" },
  { coverage: "Mains Only", gsPaper: "GS Paper II", subject: "Polity", topic: "International Relations" },
  { coverage: "Prelims + Mains", gsPaper: "GS Paper III", subject: "Science & Technology", topic: "Technology, Economic Development" },
  { coverage: "Prelims + Mains", gsPaper: "GS Paper III", subject: "Environment & Ecology", topic: "Biodiversity & Environment" },
  { coverage: "Mains Only", gsPaper: "GS Paper III", subject: "", topic: "Security & Disaster Management" },
  { coverage: "Mains Only", gsPaper: "GS Paper IV", subject: "Ethics (GS4)", topic: "Ethics, Integrity & Aptitude" },
  { coverage: "Mains Only", gsPaper: "Optional Paper I", subject: "Tamil Literature", topic: "Tamil Literature — add sections after syllabus import" },
  { coverage: "Mains Only", gsPaper: "Optional Paper II", subject: "Tamil Literature", topic: "Tamil Literature — add sections after syllabus import" },
  { coverage: "Interview", gsPaper: "Personality Test", subject: "", topic: "Personality Test" },
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
      driveFolderId: null, // cached id of the Google Drive folder used for Single Pager PDFs
    },
    syllabus: SYLLABUS_SEED.map(s => ({ id: uid(), ...s, subtopic: "", studyStatus: "Not Started", revisionStatus: "Not Started", history: [] })),
    classes: [], reading: [], singlePager: [], ncert: [], standardBooks: [],
    tamilReading: [], tamilWriting: [], currentAffairs: [], answerWriting: [], aiLearning: [],
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
function slugify(s) { return String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "none"; }
// Distinct topics/subtopics already associated with a subject — powers the
// subject-scoped datalist dropdowns on Class Lecture entry, ready to line up
// with the Syllabus tracker once it's populated from the real syllabus.
function topicOptionsForSubject(db, subject) {
  const set = new Set();
  db.syllabus.filter(s => s.subject === subject && s.topic).forEach(s => set.add(s.topic));
  db.classes.filter(c => c.subject === subject && c.topic).forEach(c => set.add(c.topic));
  db.reading.filter(r => r.subject === subject && r.topic).forEach(r => set.add(r.topic));
  return Array.from(set);
}
function subtopicOptionsForSubject(db, subject) {
  const set = new Set();
  db.syllabus.filter(s => s.subject === subject && s.subtopic).forEach(s => set.add(s.subtopic));
  db.classes.filter(c => c.subject === subject && c.subtopic).forEach(c => set.add(c.subtopic));
  return Array.from(set);
}
// Narrower than the above: subtopics for one specific topic under a subject —
// powers the cascading Subtopic dropdown on Class Lecture entry.
function subtopicOptionsForTopic(db, subject, topic) {
  const set = new Set();
  db.syllabus.filter(s => s.subject === subject && s.topic === topic && s.subtopic).forEach(s => set.add(s.subtopic));
  db.classes.filter(c => c.subject === subject && c.topic === topic && c.subtopic).forEach(c => set.add(c.subtopic));
  return Array.from(set);
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
const DRIVE_FOLDER_NAME = "UPSC 2027 Command Center - Single Pagers";
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
// Drive folder to keep all Single Pager PDFs together rather than scattering
// them across the user's whole Drive.
async function ensureDriveFolder(accessToken, db, updateSlice) {
  if (db.settings.driveFolderId) return db.settings.driveFolderId;
  const q = encodeURIComponent(`name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const searchRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, accessToken);
  const searchData = await searchRes.json();
  let folderId = searchData.files && searchData.files[0] && searchData.files[0].id;
  if (!folderId) {
    const createRes = await driveFetch("https://www.googleapis.com/drive/v3/files?fields=id", accessToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: DRIVE_FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
    });
    folderId = (await createRes.json()).id;
  }
  updateSlice("settings", prev => ({ ...prev, driveFolderId: folderId }));
  return folderId;
}

function buildDriveMultipartBody(metadata, file, boundary) {
  const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeader = `--${boundary}\r\nContent-Type: ${file.type || "application/pdf"}\r\n\r\n`;
  return new Blob([metaPart, fileHeader, file, `\r\n--${boundary}--`]);
}

// Uploads a new PDF, or (when existingFileId is passed) overwrites the same
// Drive file in place so re-uploading a corrected single-pager doesn't leave
// orphaned old copies behind.
async function uploadSinglePagerFile(db, updateSlice, existingFileId, file) {
  if (file.type && file.type !== "application/pdf") throw new Error("Please choose a PDF file.");
  const accessToken = await getDriveAccessToken();
  const folderId = await ensureDriveFolder(accessToken, db, updateSlice);
  const boundary = "uccdrive" + uid();
  const metadata = existingFileId ? { name: file.name } : { name: file.name, parents: [folderId] };
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

async function downloadSinglePagerFile(fileId, fileName) {
  const accessToken = await getDriveAccessToken();
  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, accessToken);
  const blob = await res.blob();
  downloadBlob(blob, fileName || "single-pager.pdf", "application/pdf");
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

// Today's-plan task status row: a filled, colored toggle per status (rather
// than a near-invisible bold/grey tweak) so a click is unmistakably visible —
// this sets the day-plan block's own status, which feeds the Weekly Review's
// planned/completed/skipped counts and daily log, and mirrors onto the linked
// tracker automatically where that link is unambiguous (see getLinkedStatusBridge).
function TaskStatusButtons({ value, onChange }) {
  return (
    <div className="ucc-flex wrap" style={{ marginTop: 6 }}>
      {TASK_STATUS.map(s => {
        const active = value === s;
        return (
          <button key={s} type="button" className={`ucc-btn ucc-status-btn ${active ? colorFor(s) : "inactive"}`}
            style={{ fontWeight: active ? 700 : 600 }} aria-pressed={active} onClick={() => onChange(s)}>
            {s}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ children }) {
  return <div className="ucc-empty">{children}</div>;
}

function IconBtn({ icon: Icon, onClick, title, danger }) {
  return (
    <button className={`ucc-btn ghost`} onClick={onClick} title={title} aria-label={title}
      style={{ padding: "5px 7px", color: danger ? "var(--red)" : undefined }}>
      <Icon size={14} />
    </button>
  );
}

/* ============================================================
   GENERIC TRACKER TABLE
   ============================================================ */
function GenericTracker({ records, setRecords, columns, newRecord, emptyMessage, dense, datalists }) {
  const [expanded, setExpanded] = useState(() => new Set());

  function updateField(rec, col, val, isStatus) {
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

  function removeRecord(id) {
    if (window.confirm("Delete this record? This cannot be undone.")) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  }

  function addRecord() {
    const rec = { id: uid(), history: [], ...newRecord() };
    setRecords(prev => [...prev, rec]);
  }

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ overflowX: "auto" }}>
      {(datalists || []).map(dl => <datalist id={dl.id} key={dl.id}>{dl.options.map(o => <option key={o} value={o} />)}</datalist>)}
      <table className="ucc-table">
        <thead>
          <tr>
            {columns.map(c => <th key={c.key} style={{ minWidth: c.width || 100 }}>{c.label}</th>)}
            <th style={{ width: 60 }}>Log</th>
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 && (
            <tr><td colSpan={columns.length + 2}><EmptyState>{emptyMessage || "No records yet. Add your first one below."}</EmptyState></td></tr>
          )}
          {records.map(rec => {
            const histCount = (rec.history || []).length;
            return (
              <React.Fragment key={rec.id}>
                <tr>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.type === "status" ? (
                        <StatusSelect value={rec[col.key]} options={col.options} onChange={v => updateField(rec, col, v, true)} />
                      ) : col.type === "custom" ? (
                        col.render(rec, (val, isStatus) => updateField(rec, col, val, isStatus))
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
                      )}
                    </td>
                  ))}
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
                    <td colSpan={columns.length + 2}>
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
      <button className="ucc-btn" style={{ marginTop: 10 }} onClick={addRecord}><Plus size={14} /> Add row</button>
    </div>
  );
}

// Upload/Download control for a Google-Drive-backed file attachment on one
// record. The record only ever stores { id, name } (Drive's file id + the
// original filename) via `onChange` — the PDF bytes themselves go straight
// to Google Drive over the network and are never written to Supabase.
// Download re-fetches the bytes from Drive on demand rather than caching them.
function DriveFileCell({ driveFile, db, updateSlice, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  async function handleFileSelected(e) {
    const picked = e.target.files && e.target.files[0];
    e.target.value = ""; // so selecting the same file again still fires onChange
    if (!picked) return;
    setBusy(true); setError("");
    try {
      const uploaded = await uploadSinglePagerFile(db, updateSlice, driveFile?.id, picked);
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
      await downloadSinglePagerFile(driveFile.id, driveFile.name);
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
    dayType: dt,
    breakNote,
    droppedLabels,
    blocks: blocks.map(b => ({ ...b, status: "Not Started", skipped: false, completedAt: null })),
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
      ? { ...b, status: prev.status, completedAt: prev.completedAt, skipped: false }
      : { ...b, status: "Not Started", completedAt: null, skipped: false };
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
function upsertReadingForTopic(readingArr, subject, topic, classNumber, dateISO) {
  const key = normKey(subject, topic);
  const existing = readingArr.find(r => normKey(r.subject, r.topic) === key);
  if (existing) return readingArr;
  return [...readingArr, {
    id: uid(), date: dateISO, subject, classNumber: classNumber || "", topic,
    classNotes: "In Progress", standardMaterial: "Yet to Start", ncert: "Yet to Start",
    revision1: "Yet to Start", revision2: "Yet to Start", history: [],
  }];
}

function readingCompletionPct(rec) {
  const fields = ["classNotes", "standardMaterial", "ncert"];
  const applicable = fields.filter(f => rec[f] !== "Not Needed");
  if (applicable.length === 0) return 100;
  const done = applicable.filter(f => rec[f] === "Completed").length;
  return Math.round((done / applicable.length) * 100);
}

function computePendingTasks(db) {
  const items = [];
  const yISO = addDaysISO(todayISO(), -1);
  // 2. Revision due
  db.reading.forEach(r => {
    if (r.classNotes === "Completed" && (r.revision1 === "Yet to Start" || r.revision1 === "In Progress")) {
      items.push({ cat: "Revision due", label: `${r.subject} — ${r.topic}`, detail: "Revision 1 pending", date: r.date, tab: "reading" });
    } else if (r.revision1 === "Completed" && (r.revision2 === "Yet to Start" || r.revision2 === "In Progress")) {
      items.push({ cat: "Revision due", label: `${r.subject} — ${r.topic}`, detail: "Revision 2 pending", date: r.date, tab: "reading" });
    }
  });
  // 3. Previous day's class notes
  db.classes.filter(c => c.date === yISO && c.status === "Completed").forEach(c => {
    const r = db.reading.find(x => normKey(x.subject, x.topic) === normKey(c.subject, c.topic));
    if (!r || r.classNotes !== "Completed") {
      items.push({ cat: "Yesterday's class", label: `${c.subject} — ${c.topic}`, detail: "Class notes reading pending", date: c.date, tab: "classes" });
    }
  });
  // 5. Pending reading (standard material / NCERT) — no longer requires Class Notes to be "Completed" first
  db.reading.forEach(r => {
    if (r.standardMaterial !== "Completed" && r.standardMaterial !== "Not Needed") {
      items.push({ cat: "Pending reading", label: `${r.subject} — ${r.topic}`, detail: `Standard material: ${r.standardMaterial}`, date: r.date, tab: "reading" });
    } else if (r.ncert !== "Completed" && r.ncert !== "Not Needed") {
      items.push({ cat: "Pending reading", label: `${r.subject} — ${r.topic}`, detail: `NCERT: ${r.ncert}`, date: r.date, tab: "reading" });
    }
  });
  // 6. Overdue single pagers
  db.singlePager.filter(s => s.status !== "Completed").forEach(s => {
    items.push({ cat: "Single pager", label: `${s.subject} — ${s.topic}`, detail: `Single pager: ${s.status || "Not Started"}`, date: s.date || "", tab: "singlePager" });
  });
  // 7. Other pending
  db.tamilReading.filter(t => t.status !== "Completed").forEach(t => {
    items.push({ cat: "Other pending", label: t.topic, detail: `Tamil reading: ${t.status || "Not Started"}`, date: "", tab: "tamil" });
  });
  db.ncert.filter(n => n.status !== "Completed").forEach(n => {
    items.push({ cat: "Other pending", label: `${n.subject} — ${n.topic || n.chapter}`, detail: `NCERT: ${n.status || "Not Started"}`, date: "", tab: "ncert" });
  });
  db.standardBooks.filter(s => s.status !== "Completed").forEach(s => {
    items.push({ cat: "Other pending", label: `${s.subject} — ${s.topic || s.chapter}`, detail: `Standard book: ${s.status || "Not Started"}`, date: "", tab: "standardBooks" });
  });
  const order = ["Revision due", "Yesterday's class", "Pending reading", "Single pager", "Other pending"];
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

  function changeWakeTime(newWakeTime) {
    setPlan(p => regeneratePlan(p, newWakeTime, p.dayType || defaultDayType(dateISO), settings));
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
  function addCustomBlock() {
    setPlan(p => ({
      ...p, blocks: [...p.blocks, { id: uid(), label: "Custom task", type: "study", link: "custom", duration: 30, status: "Not Started", skipped: false, custom: true }]
    }));
  }
  function removeBlock(id) {
    setPlan(p => ({ ...p, blocks: p.blocks.filter(b => b.id !== id) }));
  }

  const { wakeMinutes, endMinutes, blocks: timedBlocks } = computePlanTimes(plan);
  const sleepMinutes = parseTimeToMinutes(settings.sleepTime);
  const overflow = endMinutes - sleepMinutes;

  const pending = useMemo(() => computePendingTasks(db), [db]);
  const revisionDue = pending.filter(p => p.cat === "Revision due");
  const yISO = addDaysISO(dateISO, -1);
  const yClasses = db.classes.filter(c => c.date === yISO && c.status === "Completed");
  const pendingReadingCount = db.reading.filter(r => readingCompletionPct(r) < 100).length;
  const pendingSP = db.singlePager.filter(s => s.status !== "Completed");
  const todayAnswers = db.answerWriting.filter(a => a.date === dateISO);
  const todayCA = db.currentAffairs.filter(c => c.date === dateISO);
  const syllabusDone = db.syllabus.filter(s => s.studyStatus === "Completed" || s.studyStatus === "Revised").length;
  const review = db.dailyReviews[dateISO] || { notes: "", skipReason: "" };

  function setReview(patch) {
    updateSlice("dailyReviews", prev => ({ ...prev, [dateISO]: { ...(prev[dateISO] || {}), ...patch } }));
  }

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
            <label className="ucc-tiny">Wake time
              <input type="time" className="ucc-input ucc-mono" value={plan.wakeTime} onChange={e => changeWakeTime(e.target.value)} style={{ marginLeft: 6, width: 100 }} />
            </label>
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
        {timedBlocks.map((b, i) => {
          if (b.id === "travelTo" || b.id === "travelFro") return null; // shown inside the merged Office card
          if (b.id === "office") {
            const travelTo = timedBlocks.find(x => x.id === "travelTo");
            const travelFro = timedBlocks.find(x => x.id === "travelFro");
            return (
              <OfficePlanBlock key="office-group" office={b} travelTo={travelTo} travelFro={travelFro}
                onSkipAll={val => {
                  updateBlock("office", { skipped: val });
                  if (travelTo) updateBlock("travelTo", { skipped: val });
                  if (travelFro) updateBlock("travelFro", { skipped: val });
                }}
                onStatusChange={s => {
                  const completedAt = s === "Completed" ? new Date().toISOString() : b.completedAt;
                  updateBlock("office", { status: s, completedAt });
                  if (travelTo) updateBlock("travelTo", { status: s });
                  if (travelFro) updateBlock("travelFro", { status: s });
                }} />
            );
          }
          return (
            <PlanBlock key={b.id} block={b} onUpdate={patch => updateBlock(b.id, patch)}
              onMoveUp={i > 0 ? () => moveBlock(b.id, -1) : null}
              onMoveDown={i < timedBlocks.length - 1 ? () => moveBlock(b.id, 1) : null}
              onRemove={b.custom ? () => removeBlock(b.id) : null}
              db={db} updateSlice={updateSlice} dateISO={dateISO} yesterdayISO={yISO} onNavigate={onNavigate} />
          );
        })}
        <button className="ucc-btn" onClick={addCustomBlock}><Plus size={14} /> Add custom task</button>
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
        <SummaryCard title="Reading" count={pendingReadingCount} onTitleClick={() => onNavigate("reading")}>
          <div className="ucc-tiny">{pendingReadingCount} of {db.reading.length} topics have pending reading items.</div>
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
        <SummaryCard title="Progress" count={syllabusDone} onTitleClick={() => onNavigate("syllabus")}>
          <div className="ucc-tiny">{syllabusDone} of {db.syllabus.length} syllabus items completed/revised</div>
          <div className="ucc-tiny">{db.classes.filter(c => c.status === "Completed").length} classes completed</div>
          <div className="ucc-tiny">{db.singlePager.filter(s => s.status === "Completed").length} single pagers completed</div>
        </SummaryCard>
      </div>

      <div className="ucc-card">
        <h3>End-of-day review</h3>
        <div className="ucc-grid">
          <div>
            <label className="ucc-tiny">What did I complete / partially complete / skip — and why?</label>
            <textarea className="ucc-textarea" rows={3} value={review.notes} onChange={e => setReview({ notes: e.target.value })} placeholder="A few honest lines — this tracker shows discipline, not performance." />
          </div>
          <div>
            <label className="ucc-tiny">If something was skipped, reason (optional)</label>
            <select className="ucc-select" value={review.skipReason} onChange={e => setReview({ skipReason: e.target.value })}>
              <option value="">—</option>
              {SKIP_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
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

function OfficePlanBlock({ office, travelTo, travelFro, onSkipAll, onStatusChange }) {
  const skipped = office.skipped;
  const start = (travelTo || office).start;
  const end = (travelFro || office).end;
  return (
    <div className={`ucc-planblock ${skipped ? "skipped" : ""}`}>
      <div className="time ucc-mono ucc-tiny">{skipped ? "skipped" : `${minutesToTime(start)} – ${minutesToTime(end)}`}</div>
      <div className="body">
        <div className="ucc-flex between wrap">
          <strong>Office Work{travelTo ? " (incl. commute)" : ""}</strong>
          <label className="ucc-tiny"><input type="checkbox" checked={skipped} onChange={e => onSkipAll(e.target.checked)} /> Skip</label>
        </div>
        <div className="ucc-tiny" style={{ margin: "4px 0" }}>
          {travelTo && <span>Commute (to): {minutesToTime(travelTo.start)}–{minutesToTime(travelTo.end)} ({travelTo.duration}m) · </span>}
          <span>Office: {minutesToTime(office.start)}–{minutesToTime(office.end)} ({office.duration}m)</span>
          {travelFro && <span> · Commute (fro): {minutesToTime(travelFro.start)}–{minutesToTime(travelFro.end)} ({travelFro.duration}m)</span>}
        </div>
        <div className="ucc-tiny" style={{ marginBottom: 4 }}>Fixed hours — change in Settings.</div>
        <TaskStatusButtons value={office.status} onChange={onStatusChange} />
        <div className="ucc-tiny" style={{ marginTop: 4 }}>Sets today's status for this block — counted in your Weekly Review.</div>
      </div>
    </div>
  );
}

// Finds the single, unambiguous tracker record a plan block's status buttons
// should write through to (so picking "Completed" etc. here shows up on the
// Reading / Tamil / Current Affairs / GS Answer Writing / AI Learning pages
// instead of only changing the day-plan's own copy of the status). Returns
// null when there's no linked record, or more than one and it'd be a guess
// which one the person means — in that case the button only affects the
// day-plan block itself, same as before.
function getLinkedStatusBridge(link, db, updateSlice, dateISO) {
  if (link === "tamilReading") {
    const target = db.tamilReading.find(r => r.status !== "Completed");
    if (!target) return null;
    return { options: READ_STATUS, apply: val => updateSlice("tamilReading", prev => prev.map(x => x.id === target.id
      ? { ...x, status: val, history: [...(x.history || []), { field: "Status", from: x.status || "(empty)", to: val, at: new Date().toISOString() }] } : x)) };
  }
  if (link === "tamilWriting") {
    const todays = db.tamilWriting.filter(t => t.date === dateISO);
    if (todays.length !== 1) return null;
    return { options: TASK_STATUS, apply: val => updateSlice("tamilWriting", prev => prev.map(x => x.id === todays[0].id ? { ...x, status: val } : x)) };
  }
  if (link === "currentAffairs") {
    const todays = db.currentAffairs.filter(c => c.date === dateISO);
    if (todays.length !== 1) return null;
    return { options: CA_STATUS, apply: val => updateSlice("currentAffairs", prev => prev.map(x => x.id === todays[0].id ? { ...x, status: val } : x)) };
  }
  if (link === "gsWriting") {
    const todays = db.answerWriting.filter(a => a.date === dateISO);
    if (todays.length !== 1) return null;
    return { options: TASK_STATUS, apply: val => updateSlice("answerWriting", prev => prev.map(x => x.id === todays[0].id ? { ...x, status: val } : x)) };
  }
  if (link === "aiLearning") {
    const todays = db.aiLearning.filter(a => a.date === dateISO);
    if (todays.length !== 1) return null;
    return { options: AI_STATUS, apply: val => updateSlice("aiLearning", prev => prev.map(x => x.id === todays[0].id ? { ...x, status: val } : x)) };
  }
  return null;
}

function PlanBlock({ block, onUpdate, onMoveUp, onMoveDown, onRemove, db, updateSlice, dateISO, yesterdayISO, onNavigate }) {
  const statusTone = colorFor(block.status === "Completed" ? "Completed" : block.status);
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
            <label className="ucc-tiny"><input type="checkbox" checked={block.skipped} onChange={e => onUpdate({ skipped: e.target.checked })} /> Skip</label>
            {onRemove && <IconBtn icon={Trash2} onClick={onRemove} title="Remove" danger />}
          </div>
        </div>
        {block.type !== "break" && (
          <div style={{ marginTop: 6 }}>
            <LinkedTaskInfo link={block.link} db={db} updateSlice={updateSlice} dateISO={dateISO} yesterdayISO={yesterdayISO} onNavigate={onNavigate} />
            <TaskStatusButtons value={block.status} onChange={s => {
              onUpdate({ status: s, completedAt: s === "Completed" ? new Date().toISOString() : block.completedAt });
              const bridge = getLinkedStatusBridge(block.link, db, updateSlice, dateISO);
              if (bridge) bridge.apply(bridgeStatus(s, bridge.options));
            }} />
            <div className="ucc-tiny" style={{ marginTop: 4 }}>Sets this session's status for your Weekly Review — synced to the linked tracker above where that's unambiguous.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function LinkedTaskInfo({ link, db, updateSlice, dateISO, yesterdayISO, onNavigate }) {
  const [prevTab, setPrevTab] = useState("notes");
  if (link === "prevClass") {
    // Just the single most recently completed class before today — not every
    // pending item, and not strictly "yesterday" (in case a day was skipped).
    const latest = db.classes
      .filter(c => c.status === "Completed" && c.date < dateISO)
      .sort((a, b) => (b.date + (b.completedAt || "")).localeCompare(a.date + (a.completedAt || "")))[0];
    if (!latest) return <EmptyState>No completed class to review yet.</EmptyState>;
    const readingKey = normKey(latest.subject, latest.topic);
    const r = db.reading.find(x => normKey(x.subject, x.topic) === readingKey);
    const sp = db.singlePager.find(x => normKey(x.subject, x.topic) === readingKey);

    // Writes straight into the same "reading" record shown on the Reading
    // tab — creating it first (matching upsertReadingForTopic) if the class
    // was logged before this widget existed.
    function updateReadingField(field, val) {
      updateSlice("reading", prev => {
        const exists = prev.some(x => normKey(x.subject, x.topic) === readingKey);
        const base = exists ? prev : upsertReadingForTopic(prev, latest.subject, latest.topic, latest.classNumber, latest.date);
        return base.map(x => normKey(x.subject, x.topic) === readingKey
          ? { ...x, [field]: val, history: [...(x.history || []), { field, from: x[field] || "(empty)", to: val, at: new Date().toISOString() }] }
          : x);
      });
    }
    // Same idea for the linked Single Pager record.
    function updateSinglePagerStatus(val) {
      updateSlice("singlePager", prev => {
        const exists = prev.some(x => normKey(x.subject, x.topic) === readingKey);
        const base = exists ? prev : [...prev, { id: uid(), subject: latest.subject, topic: latest.topic, classNotes: "", handout: "", ncert: "", standardBooks: "", writing: "Not Started", status: "Not Started", history: [] }];
        return base.map(x => normKey(x.subject, x.topic) === readingKey
          ? { ...x, status: val, history: [...(x.history || []), { field: "Status", from: x.status || "(empty)", to: val, at: new Date().toISOString() }] }
          : x);
      });
    }

    const PC_TABS = [
      { id: "notes", label: "Class Notes" },
      { id: "std", label: "Std Books" },
      { id: "ncert", label: "NCERT" },
      { id: "sp", label: "Single Pager" },
      { id: "revision", label: "Revision" },
    ];

    return (
      <div>
        <div className="ucc-tiny" style={{ marginBottom: 6 }}>
          Read <strong>{latest.subject} — Class {latest.classNumber}: {latest.topic}</strong>
          {latest.date !== yesterdayISO && <span className="ucc-tiny" style={{ marginLeft: 6 }}>(from {latest.date})</span>}
        </div>
        <div className="ucc-tabbar" style={{ marginBottom: 8 }}>
          {PC_TABS.map(t => (
            <button key={t.id} className={prevTab === t.id ? "active" : ""} onClick={() => setPrevTab(t.id)}>{t.label}</button>
          ))}
        </div>
        {prevTab === "notes" && (
          <div className="ucc-flex"><span className="ucc-tiny">Class notes:</span>
            <StatusSelect value={r ? r.classNotes : "Yet to Start"} options={READ_STATUS} onChange={v => updateReadingField("classNotes", v)} /></div>
        )}
        {prevTab === "std" && (
          <div className="ucc-flex"><span className="ucc-tiny">Standard material:</span>
            <StatusSelect value={r ? r.standardMaterial : "Yet to Start"} options={READ_STATUS} onChange={v => updateReadingField("standardMaterial", v)} /></div>
        )}
        {prevTab === "ncert" && (
          <div className="ucc-flex"><span className="ucc-tiny">NCERT:</span>
            <StatusSelect value={r ? r.ncert : "Yet to Start"} options={READ_STATUS} onChange={v => updateReadingField("ncert", v)} /></div>
        )}
        {prevTab === "sp" && (
          <div className="ucc-flex"><span className="ucc-tiny">Single pager:</span>
            <StatusSelect value={sp ? sp.status : "Not Started"} options={SP_STATUS} onChange={updateSinglePagerStatus} /></div>
        )}
        {prevTab === "revision" && (
          <div className="ucc-flex wrap">
            <span className="ucc-tiny">Revision 1:</span>
            <StatusSelect value={r ? r.revision1 : "Yet to Start"} options={READ_STATUS} onChange={v => updateReadingField("revision1", v)} />
            <span className="ucc-tiny">Revision 2:</span>
            <StatusSelect value={r ? r.revision2 : "Yet to Start"} options={READ_STATUS} onChange={v => updateReadingField("revision2", v)} />
          </div>
        )}
      </div>
    );
  }
  if (link === "classLecture") return <ClassLectureWidget db={db} updateSlice={updateSlice} dateISO={dateISO} onNavigate={onNavigate} />;
  if (link === "tamilReading") return <QuickPickWidget list={db.tamilReading} setList={u => updateSlice("tamilReading", u)}
    labelFn={r => r.topic} statusField="status" statusOptions={READ_STATUS.filter(s => s !== "Not Needed")}
    empty="No Tamil literature reading topics tracked yet." addFields={[{ key: "topic", label: "Topic" }, { key: "source", label: "Source" }]} newRecord={() => ({ topic: "", source: "", status: "Yet to Start", notes: "", revision: "Yet to Start" })}
    noteField="notes" noteLabel="What I've Learned" />;
  if (link === "tamilWriting") {
    const todays = db.tamilWriting.filter(t => t.date === dateISO);
    return <TodayListWidget items={todays} labelFn={t => `${t.topic} (${t.wordLimit || "?"} words)`} statusField="status" statusOptions={TASK_STATUS}
      setList={u => updateSlice("tamilWriting", u)} empty="No Tamil answer-writing task logged for today."
      addFields={[{ key: "topic", label: "Topic" }, { key: "question", label: "Question", textarea: true }, { key: "wordLimit", label: "Word limit" }]}
      newRecord={() => ({ date: dateISO, question: "", topic: "", wordLimit: 150, answerWritten: "", selfEvaluation: "", status: "Not Started" })} />;
  }
  if (link === "currentAffairs") {
    const todays = db.currentAffairs.filter(c => c.date === dateISO);
    return <TodayListWidget items={todays} labelFn={c => c.title || "(untitled)"} statusField="status" statusOptions={CA_STATUS}
      setList={u => updateSlice("currentAffairs", u)} empty="No current affairs added for today."
      addFields={[
        { key: "title", label: "Title" },
        { key: "source", label: "Source" },
        { key: "subject", label: "Subject" },
        { key: "subtopic", label: "Subtopic" },
      ]}
      newRecord={() => ({ date: dateISO, title: "", source: "", subject: "", subtopic: "", relevantSyllabusTopic: "", prelims: false, mains: false, notes: "", status: "To Read", history: [] })} />;
  }
  if (link === "gsReading") {
    // Any topic with pending reference reading — no longer requires Class
    // Notes to already be "Completed", so a freshly logged class shows up
    // here right away (it starts as "In Progress").
    const pend = db.reading.filter(r => (r.standardMaterial !== "Completed" && r.standardMaterial !== "Not Needed") || (r.ncert !== "Completed" && r.ncert !== "Not Needed")).slice(0, 3);
    if (pend.length === 0) return <EmptyState>No pending GS reading identified. Add reading records in the Reading tracker.</EmptyState>;
    return (
      <div>
        {pend.map(r => (
          <div key={r.id} className="ucc-tiny" style={{ marginBottom: 4 }}>
            <strong>{r.subject} — {r.topic}</strong>{" "}
            {r.standardMaterial !== "Completed" && r.standardMaterial !== "Not Needed" && (
              <span>Read Standard Material <Badge tone={colorFor(r.standardMaterial)}>{r.standardMaterial}</Badge></span>
            )}
            {r.ncert !== "Completed" && r.ncert !== "Not Needed" && (
              <span style={{ marginLeft: 6 }}>NCERT <Badge tone={colorFor(r.ncert)}>{r.ncert}</Badge></span>
            )}
          </div>
        ))}
      </div>
    );
  }
  if (link === "gsWriting") {
    const todays = db.answerWriting.filter(a => a.date === dateISO);
    return <TodayListWidget items={todays} labelFn={a => `${a.gsPaper || "GS"} — ${a.topic}`} statusField="status" statusOptions={TASK_STATUS}
      setList={u => updateSlice("answerWriting", u)} empty="No GS answer-writing target set for today."
      addFields={[
        { key: "gsPaper", label: "GS Paper", options: ["GS1", "GS2", "GS3", "GS4", "Essay"] },
        { key: "topic", label: "Topic" },
        { key: "question", label: "Question", textarea: true },
        { key: "wordLimit", label: "Word limit" },
      ]}
      newRecord={() => ({ date: dateISO, gsPaper: "GS1", topic: "", question: "", wordLimit: 150, answer: "", status: "Not Started", selfScore: "", improvementNotes: "", history: [] })} />;
  }
  if (link === "aiLearning") {
    const todays = db.aiLearning.filter(a => a.date === dateISO);
    return <TodayListWidget items={todays} labelFn={a => a.topic || "(untitled)"} statusField="status" statusOptions={AI_STATUS}
      setList={u => updateSlice("aiLearning", u)} empty="No AI learning topic logged for today."
      addNew={() => updateSlice("aiLearning", prev => [...prev, { id: uid(), date: dateISO, topic: "", duration: 60, status: "Not Started", notes: "", history: [] }])} />;
  }
  if (link === "office") return <div className="ucc-tiny">Fixed block — no linked tracker.</div>;
  return null;
}

const NEW_TOPIC_VALUE = "__new_topic__";

function ClassLectureWidget({ db, updateSlice, dateISO }) {
  const [subject, setSubject] = useState(db.settings.subjects[0] || "");
  const [classNumber, setClassNumber] = useState("");
  const [topic, setTopic] = useState("");
  const [subtopic, setSubtopic] = useState("");
  const [eta, setEta] = useState("");
  const [addingTopic, setAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const topicOptions = topicOptionsForSubject(db, subject);
  const subtopicOptions = subtopicOptionsForTopic(db, subject, topic);

  function onSubjectChange(v) { setSubject(v); setTopic(""); setSubtopic(""); setAddingTopic(false); setNewTopicName(""); }
  function onTopicChange(v) {
    if (v === NEW_TOPIC_VALUE) { setAddingTopic(true); setNewTopicName(""); return; }
    setTopic(v); setSubtopic("");
  }
  // Adds a new Syllabus row for this subject right from the Class Lecture
  // form (mirrors the Syllabus tab's own "Add row" defaults), then selects
  // it as this class's topic — no more bouncing over to the Syllabus tab first.
  function confirmNewTopic() {
    const name = newTopicName.trim();
    if (!name) { setAddingTopic(false); return; }
    updateSlice("syllabus", prev => [...prev, {
      id: uid(), coverage: "", gsPaper: "", subject, topic: name, subtopic: "",
      studyStatus: "Not Started", revisionStatus: "Not Started", history: [],
    }]);
    setTopic(name); setSubtopic(""); setAddingTopic(false); setNewTopicName("");
  }
  function cancelNewTopic() { setAddingTopic(false); setNewTopicName(""); }

  function markCompleted() {
    if (!topic) { window.alert("Select a topic (added on the Syllabus tab) before marking the class completed."); return; }
    const classNum = classNumber || (Math.max(0, ...db.classes.filter(c => c.subject === subject).map(c => Number(c.classNumber) || 0)) + 1);
    updateSlice("classes", prev => [...prev, {
      id: uid(), date: dateISO, subject, totalClasses: "", classNumber: classNum, eta, topic, subtopic,
      status: "Completed", completedAt: new Date().toISOString(), history: [{ field: "Status", from: "(new)", to: "Completed", at: new Date().toISOString() }]
    }]);
    updateSlice("reading", prev => upsertReadingForTopic(prev, subject, topic, classNum, dateISO));
    setTopic(""); setSubtopic(""); setClassNumber(""); setEta("");
  }

  return (
    <div>
      <div className="ucc-grid" style={{ gridTemplateColumns: "1fr 0.7fr 1.4fr 1.4fr 1fr auto" }}>
        <select className="ucc-select" value={subject} onChange={e => onSubjectChange(e.target.value)}>
          {db.settings.subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className="ucc-input ucc-mono" type="number" inputMode="numeric" placeholder="Class #" value={classNumber}
          onChange={e => setClassNumber(e.target.value.replace(/[^0-9]/g, ""))} />
        {addingTopic ? (
          <div className="ucc-flex">
            <input className="ucc-input" autoFocus placeholder="New topic name" value={newTopicName}
              onChange={e => setNewTopicName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") confirmNewTopic(); if (e.key === "Escape") cancelNewTopic(); }} />
            <IconBtn icon={Check} onClick={confirmNewTopic} title="Add topic to Syllabus" />
            <IconBtn icon={X} onClick={cancelNewTopic} title="Cancel" />
          </div>
        ) : (
          <select className="ucc-select" value={topic} onChange={e => onTopicChange(e.target.value)}>
            <option value="">Select topic…</option>
            {topicOptions.map(t => <option key={t} value={t}>{t}</option>)}
            <option value={NEW_TOPIC_VALUE}>+ New topic</option>
          </select>
        )}
        <select className="ucc-select" value={subtopic} onChange={e => setSubtopic(e.target.value)} disabled={!topic}>
          <option value="">{subtopicOptions.length ? "Select subtopic (optional)…" : "—"}</option>
          {subtopicOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className="ucc-input" type="date" placeholder="ETA" value={eta} onChange={e => setEta(e.target.value)} />
        <button className="ucc-btn primary" onClick={markCompleted}><Check size={14} /> Mark class completed</button>
      </div>
    </div>
  );
}

function InlineAddForm({ fields, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => Object.fromEntries(fields.filter(f => f.options).map(f => [f.key, f.options[0]])));
  return (
    <div className="ucc-flex wrap" style={{ marginTop: 6 }}>
      {fields.map(f => f.options ? (
        <select key={f.key} className="ucc-select" style={{ maxWidth: 140 }} value={draft[f.key] ?? f.options[0]}
          onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}>
          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : f.textarea ? (
        <textarea key={f.key} className="ucc-textarea" placeholder={f.label} value={draft[f.key] || ""}
          onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))} style={{ minWidth: 200, flex: "1 1 200px" }} rows={2} />
      ) : (
        <input key={f.key} className="ucc-input" placeholder={f.label} value={draft[f.key] || ""}
          onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))} style={{ maxWidth: 160 }} />
      ))}
      <button className="ucc-btn primary" style={{ padding: "5px 9px" }} onClick={() => onSave(draft)}><Check size={12} /> Save</button>
      <button className="ucc-btn ghost" style={{ padding: "5px 9px" }} onClick={onCancel}>Cancel</button>
    </div>
  );
}

function TodayListWidget({ items, labelFn, statusField, statusOptions, setList, empty, addNew, addFields, newRecord }) {
  const [adding, setAdding] = useState(false);
  return (
    <div>
      {items.length === 0 ? <EmptyState>{empty}</EmptyState> : items.map(it => (
        <div key={it.id} className="ucc-flex between" style={{ marginBottom: 4 }}>
          <span className="ucc-tiny">{labelFn(it)}</span>
          <StatusSelect value={it[statusField]} options={statusOptions} onChange={v => setList(prev => prev.map(x => x.id === it.id ? { ...x, [statusField]: v } : x))} />
        </div>
      ))}
      {addFields ? (
        adding ? (
          <InlineAddForm fields={addFields}
            onSave={draft => { setList(prev => [...prev, { id: uid(), history: [], ...newRecord(), ...draft }]); setAdding(false); }}
            onCancel={() => setAdding(false)} />
        ) : (
          <button className="ucc-btn ghost" style={{ marginTop: 4 }} onClick={() => setAdding(true)}><Plus size={12} /> Add</button>
        )
      ) : (
        <button className="ucc-btn ghost" style={{ marginTop: 4 }} onClick={addNew}><Plus size={12} /> Quick add</button>
      )}
    </div>
  );
}

function QuickPickWidget({ list, setList, labelFn, statusField, statusOptions, empty, newRecord, addFields, noteField, noteLabel }) {
  const [adding, setAdding] = useState(false);
  const pending = list.filter(r => r[statusField] !== "Completed");
  const next = pending[0];
  return (
    <div>
      {!next ? <EmptyState>{empty}</EmptyState> : (
        <div>
          <div className="ucc-flex between">
            <span className="ucc-tiny">{labelFn(next)}</span>
            <StatusSelect value={next[statusField]} options={statusOptions} onChange={v => setList(prev => prev.map(x => x.id === next.id ? { ...x, [statusField]: v } : x))} />
          </div>
          {noteField && (
            <div style={{ marginTop: 6 }}>
              <label className="ucc-tiny">{noteLabel || "Notes"}</label>
              <textarea className="ucc-textarea" rows={2} value={next[noteField] || ""}
                onChange={e => setList(prev => prev.map(x => x.id === next.id ? { ...x, [noteField]: e.target.value } : x))} />
            </div>
          )}
        </div>
      )}
      {addFields ? (
        adding ? (
          <InlineAddForm fields={addFields}
            onSave={draft => { setList(prev => [...prev, { id: uid(), history: [], ...newRecord(), ...draft }]); setAdding(false); }}
            onCancel={() => setAdding(false)} />
        ) : (
          <button className="ucc-btn ghost" style={{ marginTop: 4 }} onClick={() => setAdding(true)}><Plus size={12} /> Add</button>
        )
      ) : (
        <button className="ucc-btn ghost" style={{ marginTop: 4 }} onClick={() => setList(prev => [...prev, { id: uid(), history: [], ...newRecord() }])}><Plus size={12} /> Quick add</button>
      )}
    </div>
  );
}

/* ============================================================
   TRACKER TABS
   ============================================================ */
function ClassesTab({ db, updateSlice }) {
  const bySubject = useMemo(() => {
    const m = {};
    db.classes.forEach(c => { m[c.subject] = m[c.subject] || []; m[c.subject].push(c); });
    return m;
  }, [db.classes]);
  const subjectDatalists = useMemo(() => {
    const out = [];
    db.settings.subjects.forEach(subj => {
      out.push({ id: "topics-" + slugify(subj), options: topicOptionsForSubject(db, subj) });
      out.push({ id: "subtopics-" + slugify(subj), options: subtopicOptionsForSubject(db, subj) });
    });
    return out;
  }, [db]);
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
        <GenericTracker
          records={db.classes} setRecords={u => updateSlice("classes", u)}
          datalists={subjectDatalists}
          columns={[
            { key: "date", label: "Date", type: "date", width: 120 },
            { key: "subject", label: "Subject", width: 130 },
            { key: "classNumber", label: "Class #", type: "number", width: 70 },
            { key: "totalClasses", label: "Total Classes", width: 90 },
            { key: "topic", label: "Topic", width: 180, datalist: rec => "topics-" + slugify(rec.subject) },
            { key: "subtopic", label: "Subtopic", width: 160, datalist: rec => "subtopics-" + slugify(rec.subject) },
            { key: "eta", label: "ETA", type: "date", width: 120 },
            { key: "status", label: "Status", type: "status", options: TASK_STATUS, width: 150 },
          ]}
          newRecord={() => ({ date: todayISO(), subject: db.settings.subjects[0] || "", classNumber: "", totalClasses: "", topic: "", subtopic: "", eta: "", status: "Not Started" })}
        />
      </div>
    </div>
  );
}

function ReadingTab({ db, updateSlice }) {
  return (
    <div className="ucc-card">
      <h3>Reading tracker</h3>
      <p className="ucc-tiny">"Not Needed" items are excluded from completion — they never count against you.</p>
      <GenericTracker
        records={db.reading} setRecords={u => updateSlice("reading", u)}
        columns={[
          { key: "date", label: "Date", type: "date", width: 110 },
          { key: "subject", label: "Subject", width: 120 },
          { key: "classNumber", label: "Class #", type: "number", width: 65 },
          { key: "topic", label: "Topic", width: 200 },
          { key: "classNotes", label: "Class Notes", type: "status", options: READ_STATUS, width: 130 },
          { key: "standardMaterial", label: "Standard Material", type: "status", options: READ_STATUS, width: 130 },
          { key: "ncert", label: "NCERT", type: "status", options: READ_STATUS, width: 130 },
          { key: "revision1", label: "Revision 1", type: "status", options: READ_STATUS, width: 130 },
          { key: "revision2", label: "Revision 2", type: "status", options: READ_STATUS, width: 130 },
        ]}
        newRecord={() => ({ date: todayISO(), subject: db.settings.subjects[0] || "", classNumber: "", topic: "", classNotes: "Yet to Start", standardMaterial: "Yet to Start", ncert: "Yet to Start", revision1: "Yet to Start", revision2: "Yet to Start" })}
      />
    </div>
  );
}

function SyllabusTab({ db, updateSlice }) {
  const total = db.syllabus.length;
  const done = db.syllabus.filter(s => s.studyStatus === "Completed" || s.studyStatus === "Revised").length;
  return (
    <div>
      <div className="ucc-card">
        <h3>Syllabus progress</h3>
        <div className="ucc-tiny">{done} of {total} syllabus items completed or revised.</div>
        <div className="ucc-tiny" style={{ marginTop: 6, color: "var(--ink-muted)" }}>
          This starts from the standard top-level UPSC structure only. Upload your actual syllabus PDF via Import/Export to expand it into real sub-topics — nothing here is a substitute for the official document.
        </div>
        <div className="ucc-tiny" style={{ marginTop: 6, color: "var(--ink-muted)" }}>
          Set <strong>Subject</strong> on each row below — that's what powers the subject-wise Topic/Subtopic dropdowns on the Class Lecture slot in Today's plan. Add or rename subjects on the Settings tab.
        </div>
      </div>
      <div className="ucc-card">
        <h3>All syllabus items</h3>
        <GenericTracker
          records={db.syllabus} setRecords={u => updateSlice("syllabus", u)}
          columns={[
            { key: "coverage", label: "Coverage", type: "select", options: COVERAGE_OPTIONS, width: 130 },
            { key: "gsPaper", label: "GS Paper", type: "select", options: GS_PAPER_OPTIONS, width: 140 },
            { key: "subject", label: "Subject", type: "select", options: db.settings.subjects, width: 150 },
            { key: "topic", label: "Topic", width: 240 },
            { key: "subtopic", label: "Subtopic", width: 180 },
            { key: "studyStatus", label: "Study Status", type: "status", options: SYLLABUS_STATUS, width: 130 },
            { key: "revisionStatus", label: "Revision Status", type: "status", options: SYLLABUS_STATUS, width: 130 },
          ]}
          newRecord={() => ({ coverage: "", gsPaper: "", subject: db.settings.subjects[0] || "", topic: "", subtopic: "", studyStatus: "Not Started", revisionStatus: "Not Started" })}
          emptyMessage="No syllabus items yet — click Add row below to add your first topic."
        />
      </div>
    </div>
  );
}

function SinglePagerTab({ db, updateSlice }) {
  return (
    <div className="ucc-card">
      <h3>Single pager notes</h3>
      {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
        <div className="ucc-tiny" style={{ marginBottom: 8 }}>
          PDF upload/download needs Google Drive configured — add <code>VITE_GOOGLE_CLIENT_ID</code> to your <code>.env</code> (see README).
        </div>
      )}
      <GenericTracker
        records={db.singlePager} setRecords={u => updateSlice("singlePager", u)}
        columns={[
          { key: "subject", label: "Subject", width: 120 },
          { key: "topic", label: "Topic", width: 180 },
          { key: "classNotes", label: "Class Notes", placeholder: "e.g. 19 pages", width: 130 },
          { key: "handout", label: "Handout", placeholder: "e.g. Handout 1 - 37p", width: 150 },
          { key: "ncert", label: "NCERT", placeholder: "NA / pages", width: 100 },
          { key: "standardBooks", label: "Standard Books", placeholder: "NA / ref", width: 130 },
          { key: "writing", label: "Writing", type: "status", options: WRITING_STATUS, width: 110 },
          { key: "status", label: "Status", type: "status", options: SP_STATUS, width: 120 },
          {
            key: "driveFile", label: "Single Pager PDF", width: 170, type: "custom",
            render: (rec, onChange) => <DriveFileCell driveFile={rec.driveFile} db={db} updateSlice={updateSlice} onChange={onChange} />,
          },
        ]}
        newRecord={() => ({ date: todayISO(), subject: db.settings.subjects[0] || "", topic: "", classNotes: "", handout: "", ncert: "", standardBooks: "", writing: "Not Started", status: "Not Started", driveFile: null })}
      />
    </div>
  );
}

function NcertTab({ db, updateSlice }) {
  return (
    <div className="ucc-card">
      <h3>NCERT tracker</h3>
      <GenericTracker
        records={db.ncert} setRecords={u => updateSlice("ncert", u)}
        columns={[
          { key: "subject", label: "Subject", width: 120 },
          { key: "book", label: "Book", width: 150 },
          { key: "className", label: "Class", width: 80 },
          { key: "chapter", label: "Chapter", width: 140 },
          { key: "topic", label: "Topic", width: 160 },
          { key: "status", label: "Status", type: "status", options: NCERT_STATUS, width: 110 },
          { key: "dateStarted", label: "Started", type: "date", width: 120 },
          { key: "dateCompleted", label: "Completed", type: "date", width: 120 },
        ]}
        newRecord={() => ({ subject: db.settings.subjects[0] || "", book: "", className: "", chapter: "", topic: "", status: "Not Started", dateStarted: "", dateCompleted: "" })}
      />
    </div>
  );
}

function StandardBooksTab({ db, updateSlice }) {
  return (
    <div className="ucc-card">
      <h3>Standard book tracker</h3>
      <GenericTracker
        records={db.standardBooks} setRecords={u => updateSlice("standardBooks", u)}
        columns={[
          { key: "bookName", label: "Book", width: 150 },
          { key: "subject", label: "Subject", width: 120 },
          { key: "chapter", label: "Chapter", width: 140 },
          { key: "topic", label: "Topic", width: 150 },
          { key: "pages", label: "Pages", width: 80 },
          { key: "status", label: "Status", type: "status", options: SB_STATUS, width: 110 },
          { key: "startDate", label: "Start", type: "date", width: 120 },
          { key: "completionDate", label: "Completed", type: "date", width: 120 },
        ]}
        newRecord={() => ({ bookName: "", subject: db.settings.subjects[0] || "", chapter: "", topic: "", pages: "", status: "Not Started", startDate: "", completionDate: "" })}
      />
    </div>
  );
}

function TamilTab({ db, updateSlice }) {
  const [sub, setSub] = useState("reading");
  return (
    <div className="ucc-card">
      <div className="ucc-tabbar">
        <button className={sub === "reading" ? "active" : ""} onClick={() => setSub("reading")}>Reading</button>
        <button className={sub === "writing" ? "active" : ""} onClick={() => setSub("writing")}>Answer Writing</button>
      </div>
      {sub === "reading" ? (
        <GenericTracker
          records={db.tamilReading} setRecords={u => updateSlice("tamilReading", u)}
          columns={[
            { key: "topic", label: "Topic", width: 200 },
            { key: "source", label: "Source", width: 160 },
            { key: "status", label: "Status", type: "status", options: READ_STATUS, width: 120 },
            { key: "revision", label: "Revision", type: "status", options: READ_STATUS, width: 120 },
            { key: "notes", label: "What I've Learned", type: "textarea", width: 220 },
          ]}
          newRecord={() => ({ topic: "", source: "", status: "Yet to Start", revision: "Yet to Start", notes: "" })}
        />
      ) : (
        <GenericTracker
          records={db.tamilWriting} setRecords={u => updateSlice("tamilWriting", u)}
          columns={[
            { key: "date", label: "Date", type: "date", width: 110 },
            { key: "topic", label: "Topic", width: 160 },
            { key: "question", label: "Question", type: "textarea", width: 240 },
            { key: "wordLimit", label: "Word Limit", type: "number", width: 90 },
            { key: "selfEvaluation", label: "Self Eval", type: "textarea", width: 180 },
            { key: "status", label: "Status", type: "status", options: TASK_STATUS, width: 140 },
          ]}
          newRecord={() => ({ date: todayISO(), topic: "", question: "", wordLimit: 150, answerWritten: "", selfEvaluation: "", status: "Not Started" })}
        />
      )}
    </div>
  );
}

function CurrentAffairsTab({ db, updateSlice }) {
  return (
    <div className="ucc-card">
      <h3>Current affairs</h3>
      <GenericTracker
        records={db.currentAffairs} setRecords={u => updateSlice("currentAffairs", u)}
        columns={[
          { key: "date", label: "Date", type: "date", width: 110 },
          { key: "title", label: "Topic / Title", width: 200 },
          { key: "source", label: "Source", width: 130 },
          { key: "subject", label: "Subject", width: 120 },
          { key: "subtopic", label: "Subtopic", width: 140 },
          { key: "relevantSyllabusTopic", label: "Syllabus Topic", width: 160 },
          { key: "prelims", label: "Prelims", type: "select", options: ["Yes", "No"], width: 90 },
          { key: "mains", label: "Mains", type: "select", options: ["Yes", "No"], width: 90 },
          { key: "status", label: "Status", type: "status", options: CA_STATUS, width: 110 },
        ]}
        newRecord={() => ({ date: todayISO(), title: "", source: "", subject: "", subtopic: "", relevantSyllabusTopic: "", prelims: "", mains: "", notes: "", status: "To Read" })}
      />
    </div>
  );
}

function AnswerWritingTab({ db, updateSlice }) {
  return (
    <div className="ucc-card">
      <h3>GS answer writing</h3>
      <GenericTracker
        records={db.answerWriting} setRecords={u => updateSlice("answerWriting", u)}
        columns={[
          { key: "date", label: "Date", type: "date", width: 110 },
          { key: "gsPaper", label: "GS Paper", type: "select", options: ["GS1", "GS2", "GS3", "GS4", "Essay"], width: 90 },
          { key: "topic", label: "Topic", width: 160 },
          { key: "question", label: "Question", type: "textarea", width: 240 },
          { key: "wordLimit", label: "Word Limit", type: "number", width: 90 },
          { key: "status", label: "Status", type: "status", options: TASK_STATUS, width: 140 },
          { key: "selfScore", label: "Self Score", width: 80 },
          { key: "improvementNotes", label: "Improvement Notes", type: "textarea", width: 200 },
        ]}
        newRecord={() => ({ date: todayISO(), gsPaper: "GS1", topic: "", question: "", wordLimit: 150, answer: "", status: "Not Started", selfScore: "", improvementNotes: "" })}
      />
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
function TopicMasterTab({ db }) {
  const topics = useMemo(() => {
    const map = new Map();
    function ensure(subject, topic) {
      const key = normKey(subject, topic);
      if (!key.trim()) return null;
      if (!map.has(key)) map.set(key, { subject, topic, classes: [], reading: [], singlePager: [], currentAffairs: [], answerWriting: [], syllabus: [] });
      return map.get(key);
    }
    db.classes.forEach(c => { const t = ensure(c.subject, c.topic); if (t) t.classes.push(c); });
    db.reading.forEach(r => { const t = ensure(r.subject, r.topic); if (t) t.reading.push(r); });
    db.singlePager.forEach(s => { const t = ensure(s.subject, s.topic); if (t) t.singlePager.push(s); });
    db.syllabus.forEach(s => { const t = ensure(s.subject, s.topic); if (t) t.syllabus.push(s); });
    db.currentAffairs.forEach(c => { const t = ensure(c.subject, c.relevantSyllabusTopic); if (t) t.currentAffairs.push(c); });
    db.answerWriting.forEach(a => { const t = ensure(a.gsPaper, a.topic); if (t) t.answerWriting.push(a); });
    return Array.from(map.values());
  }, [db]);
  const [sel, setSel] = useState(null);
  const active = topics.find(t => normKey(t.subject, t.topic) === sel) || topics[0];

  return (
    <div className="ucc-card">
      <h3>Topic master</h3>
      {topics.length === 0 ? <EmptyState>No topics yet — add classes, reading, or syllabus records first.</EmptyState> : (
        <div style={{ display: "flex", gap: 18 }}>
          <div style={{ width: 240, flexShrink: 0, maxHeight: 480, overflowY: "auto" }}>
            {topics.map(t => {
              const key = normKey(t.subject, t.topic);
              return (
                <div key={key} onClick={() => setSel(key)}
                  style={{ padding: "7px 9px", borderRadius: 6, cursor: "pointer", fontSize: 12.5, marginBottom: 2, background: (active && normKey(active.subject, active.topic) === key) ? "var(--grey-soft)" : "transparent" }}>
                  <strong>{t.topic || "(untitled)"}</strong><br /><span className="ucc-tiny">{t.subject}</span>
                </div>
              );
            })}
          </div>
          {active && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 16, textTransform: "none", letterSpacing: 0, color: "var(--ink)" }}>{active.topic}</h3>
              <div className="ucc-tiny" style={{ marginBottom: 10 }}>{active.subject}</div>
              <TopicSection title="Syllabus">
                {active.syllabus.length === 0 ? <EmptyState>Not mapped to a syllabus item.</EmptyState> :
                  active.syllabus.map(s => <div key={s.id} className="ucc-tiny">{s.coverage} · <Badge tone={colorFor(s.studyStatus)}>{s.studyStatus}</Badge></div>)}
              </TopicSection>
              <TopicSection title="Classes">
                {active.classes.length === 0 ? <EmptyState>No classes logged.</EmptyState> :
                  active.classes.map(c => <div key={c.id} className="ucc-tiny">{c.date} — Class {c.classNumber} <Badge tone={colorFor(c.status)}>{c.status}</Badge></div>)}
              </TopicSection>
              <TopicSection title="Reading & Revision">
                {active.reading.length === 0 ? <EmptyState>No reading record.</EmptyState> :
                  active.reading.map(r => (
                    <div key={r.id} className="ucc-tiny" style={{ marginBottom: 4 }}>
                      <Badge tone={colorFor(r.classNotes)}>Notes {r.classNotes}</Badge>{" "}
                      <Badge tone={colorFor(r.standardMaterial)}>Std {r.standardMaterial}</Badge>{" "}
                      <Badge tone={colorFor(r.ncert)}>NCERT {r.ncert}</Badge>{" "}
                      <Badge tone={colorFor(r.revision1)}>Rev1 {r.revision1}</Badge>{" "}
                      <Badge tone={colorFor(r.revision2)}>Rev2 {r.revision2}</Badge>
                    </div>
                  ))}
              </TopicSection>
              <TopicSection title="Single pager">
                {active.singlePager.length === 0 ? <EmptyState>Not started.</EmptyState> :
                  active.singlePager.map(s => <div key={s.id} className="ucc-tiny">Writing: <Badge tone={colorFor(s.writing)}>{s.writing}</Badge> · Overall: <Badge tone={colorFor(s.status)}>{s.status}</Badge></div>)}
              </TopicSection>
              <TopicSection title="Current affairs">
                {active.currentAffairs.length === 0 ? <EmptyState>No related entries.</EmptyState> :
                  active.currentAffairs.map(c => <div key={c.id} className="ucc-tiny">{c.date} — {c.title}</div>)}
              </TopicSection>
              <TopicSection title="Answer writing">
                {active.answerWriting.length === 0 ? <EmptyState>No related answers.</EmptyState> :
                  active.answerWriting.map(a => <div key={a.id} className="ucc-tiny">{a.date} — {a.gsPaper} <Badge tone={colorFor(a.status)}>{a.status}</Badge></div>)}
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
    scan(db.classes, "Classes", ["subject", "topic"], r => `${r.subject} — Class ${r.classNumber}: ${r.topic}`);
    scan(db.reading, "Reading", ["subject", "topic"], r => `${r.subject} — ${r.topic}`);
    scan(db.singlePager, "Single Pager", ["subject", "topic"], r => `${r.subject} — ${r.topic}`);
    scan(db.ncert, "NCERT", ["subject", "book", "chapter", "topic"], r => `${r.subject} — ${r.book} — ${r.chapter}`);
    scan(db.standardBooks, "Standard Books", ["bookName", "subject", "chapter", "topic"], r => `${r.bookName} — ${r.topic}`);
    scan(db.tamilReading, "Tamil Reading", ["topic", "source"], r => r.topic);
    scan(db.tamilWriting, "Tamil Writing", ["topic", "question"], r => r.topic);
    scan(db.currentAffairs, "Current Affairs", ["title", "subject", "relevantSyllabusTopic"], r => r.title);
    scan(db.answerWriting, "Answer Writing", ["topic", "question", "gsPaper"], r => `${r.gsPaper} — ${r.topic}`);
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
  const weekDates = Array.from({ length: 7 }, (_, i) => addDaysISO(weekOf, i));
  const plans = weekDates.map(d => db.dailyPlans[d]).filter(Boolean);
  let planned = 0, completed = 0, missed = 0;
  plans.forEach(p => (p.blocks || []).forEach(b => {
    if (b.type === "break") return;
    if (b.skipped) return;
    planned++;
    if (b.status === "Completed") completed++;
    else if (b.status === "Skipped") missed++;
  }));
  const reflection = db.weeklyReviews[weekOf] || { wellDone: "", notWell: "", change: "" };
  function setReflection(patch) {
    updateSlice("weeklyReviews", prev => ({ ...prev, [weekOf]: { ...(prev[weekOf] || {}), ...patch } }));
  }
  // Per-day breakdown for the week: every non-break task with its status,
  // plus that day's End-of-day review — this is the "log" the daily plan and
  // end-of-day review otherwise disappear into with no later record of them.
  const dayLogs = weekDates.map(d => {
    const plan = db.dailyPlans[d];
    const rev = db.dailyReviews[d];
    const tasks = plan ? (plan.blocks || []).filter(b => b.type !== "break") : [];
    const hasReview = !!(rev && (rev.notes || rev.skipReason));
    return { date: d, tasks, review: rev, hasContent: tasks.length > 0 || hasReview };
  });
  const weekHasContent = dayLogs.some(dl => dl.hasContent);
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
            <button className="ucc-btn primary ucc-no-print" onClick={() => window.print()}
              title="Opens your browser's print dialog — choose “Save as PDF” as the destination">
              <Download size={14} /> Download as PDF
            </button>
          </div>
          <div className="ucc-statgrid" style={{ margin: "12px 0" }}>
            <div className="ucc-stat"><div className="n">{planned}</div><div className="l">Planned sessions</div></div>
            <div className="ucc-stat"><div className="n">{completed}</div><div className="l">Completed</div></div>
            <div className="ucc-stat"><div className="n">{missed}</div><div className="l">Skipped</div></div>
            <div className="ucc-stat"><div className="n">{db.classes.filter(c => weekDates.includes(c.date)).length}</div><div className="l">Classes this week</div></div>
            <div className="ucc-stat"><div className="n">{db.answerWriting.filter(a => weekDates.includes(a.date)).length}</div><div className="l">Answers written</div></div>
            <div className="ucc-stat"><div className="n">{db.currentAffairs.filter(c => weekDates.includes(c.date)).length}</div><div className="l">Current affairs logged</div></div>
          </div>
          <div className="ucc-grid">
            <div><label className="ucc-tiny">What went well?</label><textarea className="ucc-textarea" rows={3} value={reflection.wellDone} onChange={e => setReflection({ wellDone: e.target.value })} /></div>
            <div><label className="ucc-tiny">What did not go well?</label><textarea className="ucc-textarea" rows={3} value={reflection.notWell} onChange={e => setReflection({ notWell: e.target.value })} /></div>
            <div><label className="ucc-tiny">What should change next week?</label><textarea className="ucc-textarea" rows={3} value={reflection.change} onChange={e => setReflection({ change: e.target.value })} /></div>
          </div>
        </div>

        <div className="ucc-card">
          <h3>Daily log</h3>
          {!weekHasContent && <EmptyState>No daily plans or end-of-day reviews logged for this week yet.</EmptyState>}
          {dayLogs.filter(dl => dl.hasContent).map(dl => (
            <div key={dl.date} style={{ marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{fmtDateLong(dl.date)}</div>
              {dl.tasks.map(t => (
                <div key={t.id} className="ucc-flex" style={{ marginBottom: 3 }}>
                  <span className="ucc-tiny" style={{ minWidth: 220 }}>{t.label}</span>
                  <Badge tone={colorFor(t.skipped ? "Skipped" : (t.status || "Not Started"))}>{t.skipped ? "Skipped" : (t.status || "Not Started")}</Badge>
                </div>
              ))}
              {dl.review && (dl.review.notes || dl.review.skipReason) && (
                <div style={{ marginTop: 6 }}>
                  {dl.review.notes && <div className="ucc-tiny"><strong>End-of-day review:</strong> {dl.review.notes}</div>}
                  {dl.review.skipReason && <div className="ucc-tiny">Skip reason: {dl.review.skipReason}</div>}
                </div>
              )}
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
      <p className="ucc-tiny">Study slots, breaks, and AI learning — their default duration before any day-fit trimming happens. Office and commute time come from the fixed hours above instead. Changes here set the default for new days — days you've already opened keep their own snapshot until you change wake time or day type.</p>
      <table className="ucc-table">
        <thead><tr><th>Slot</th><th>Type</th><th>Default duration (min)</th></tr></thead>
        <tbody>
          {s.slotTemplate.map((b, i) => (
            <tr key={b.id}>
              <td>{b.label}</td>
              <td><Badge tone="neutral">{b.type}</Badge></td>
              <td>
                <input type="number" className="ucc-input ucc-mono" style={{ width: 80 }} value={b.duration}
                  onChange={e => {
                    const dur = Number(e.target.value);
                    patch({ slotTemplate: s.slotTemplate.map((x, xi) => xi === i ? { ...x, duration: dur } : x) });
                  }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ucc-hr" />
      <h3>Subjects</h3>
      <div className="ucc-pill-row" style={{ marginBottom: 8 }}>
        {s.subjects.map(sub => (
          <span key={sub} className="ucc-badge neutral">{sub}
            <button className="ucc-btn ghost" style={{ padding: "0 0 0 6px", border: "none" }} onClick={() => patch({ subjects: s.subjects.filter(x => x !== sub) })}><X size={11} /></button>
          </span>
        ))}
      </div>
      <div className="ucc-flex">
        <input className="ucc-input" style={{ maxWidth: 220 }} placeholder="Add subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
        <button className="ucc-btn" onClick={() => { if (newSubject.trim()) { patch({ subjects: [...s.subjects, newSubject.trim()] }); setNewSubject(""); } }}><Plus size={13} /> Add</button>
      </div>
      <DangerZone updateSlice={updateSlice} />
    </div>
  );
}

// Every StorageKey except "settings" — what "Reset all data" wipes back to
// empty, using each key's genuinely-empty shape (not defaultDB()'s syllabus
// seed, since a reset should mean *empty*, not *repopulated with the sample
// curriculum*).
const CLEARABLE_DATA_KEYS = {
  syllabus: [], classes: [], reading: [], singlePager: [], ncert: [], standardBooks: [],
  tamilReading: [], tamilWriting: [], currentAffairs: [], answerWriting: [], aiLearning: [],
  dailyPlans: {}, dailyReviews: {}, weeklyReviews: {},
};

function DangerZone({ updateSlice }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [done, setDone] = useState(false);

  function resetAllData() {
    Object.entries(CLEARABLE_DATA_KEYS).forEach(([key, emptyValue]) => updateSlice(key, () => emptyValue));
    setOpen(false); setConfirmText(""); setDone(true);
    setTimeout(() => setDone(false), 5000);
  }

  return (
    <div>
      <div className="ucc-hr" />
      <h3 style={{ color: "var(--red)" }}>Danger zone</h3>
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
    label: "Classes", fields: ["date", "subject", "totalClasses", "classNumber", "eta", "topic", "status"],
    aliases: { date: ["date"], subject: ["subject"], totalClasses: ["total classes", "totalclasses"], classNumber: ["today's class number", "class number", "classno", "class no"], eta: ["eta"], topic: ["topic"], status: ["status"] },
    dupKey: r => normKey(r.subject, r.topic, r.classNumber),
  },
  reading: {
    label: "Reading", fields: ["date", "subject", "classNumber", "topic", "classNotes", "standardMaterial", "ncert", "revision1", "revision2"],
    aliases: { date: ["date"], subject: ["subject"], classNumber: ["class number", "classno"], topic: ["topic"], classNotes: ["class notes"], standardMaterial: ["standard material"], ncert: ["ncert"], revision1: ["revision 1", "revision1"], revision2: ["revision 2", "revision2"] },
    dupKey: r => normKey(r.subject, r.topic),
  },
  singlePager: {
    label: "Single Pager", fields: ["subject", "topic", "classNotes", "handout", "ncert", "standardBooks", "writing"],
    aliases: { subject: ["subject"], topic: ["topic"], classNotes: ["class notes"], handout: ["handout"], ncert: ["ncert"], standardBooks: ["standard books"], writing: ["writing"] },
    dupKey: r => normKey(r.subject, r.topic),
  },
  syllabus: {
    label: "Syllabus", fields: ["coverage", "gsPaper", "subject", "topic", "subtopic", "studyStatus", "revisionStatus"],
    aliases: {
      coverage: ["coverage"], gsPaper: ["gs paper", "gspaper", "paper"], subject: ["subject"], topic: ["topic"],
      subtopic: ["subtopic", "sub topic"], studyStatus: ["study status", "studystatus"], revisionStatus: ["revision status", "revisionstatus"],
    },
    dupKey: r => normKey(r.subject, r.topic, r.subtopic),
  },
};

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
      if (target === "reading") {
        ["classNotes", "standardMaterial", "ncert", "revision1", "revision2"].forEach(f => { if (!clean[f]) clean[f] = "Yet to Start"; });
      }
      if (target === "classes" && !clean.status) clean.status = "Completed";
      if (target === "syllabus") {
        if (!clean.studyStatus) clean.studyStatus = "Not Started";
        if (!clean.revisionStatus) clean.revisionStatus = "Not Started";
      }
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
  { id: "classes", label: "Classes", icon: Layers },
  { id: "reading", label: "Reading", icon: BookOpen },
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
  else if (tab === "topics") body = <TopicMasterTab db={db} />;
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
              <div className="sub ucc-mono">{fmtDateLong(todayISO())}</div>
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
