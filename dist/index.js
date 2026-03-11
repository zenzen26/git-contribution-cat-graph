#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));

// src/contribution-graph.ts
async function fetchContributionGraph(username, token) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables: { login: username } })
  });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
  const data = await response.json();
  const calendar = data.data.user.contributionsCollection.contributionCalendar;
  const levelMap = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4
  };
  return {
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks.map((week) => ({
      days: week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        level: levelMap[day.contributionLevel] ?? 0
      }))
    }))
  };
}

// src/cat-animator.ts
var CELL = 14;
var GAP = 3;
var STEP = CELL + GAP;
var TOP = 36;
var LEFT = 44;
var ROWS = 7;
var LIGHT_COLORS = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
var DARK_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
var CAT_MS = 300;
var RAT_MS = 400;
var WEARY_MS = 800;
var TOTAL_MS = 3e4;
function buildGrid(cells) {
  const g = /* @__PURE__ */ new Map();
  for (const c of cells) g.set(`${c.col},${c.row}`, c);
  return g;
}
function adj(grid, col, row) {
  return [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dc, dr]) => grid.get(`${col + dc},${row + dr}`)).filter((c) => c !== void 0);
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function simulateCat(grid, fishSet, startCol, startRow, maxMs) {
  const steps = [];
  const eats = [];
  let col = startCol, row = startRow;
  let t = 0;
  let prevKey = "";
  steps.push({ col, row, t });
  while (t < maxMs) {
    const options = adj(grid, col, row);
    if (!options.length) break;
    const noBack = options.filter((c) => `${c.col},${c.row}` !== prevKey);
    const pool = noBack.length ? noBack : options;
    const withFish = pool.filter((c) => fishSet.has(c.date));
    const target = pick(withFish.length ? withFish : pool);
    prevKey = `${col},${row}`;
    col = target.col;
    row = target.row;
    t += CAT_MS;
    steps.push({ col, row, t });
    if (target.level > 0 && fishSet.has(target.date)) {
      fishSet.delete(target.date);
      eats.push({ date: target.date, t });
    }
    if (fishSet.size === 0) {
      for (const c of grid.values()) {
        if (c.level > 0) fishSet.add(c.date);
      }
    }
  }
  return { steps, eats };
}
function simulateRat(grid, startCol, startRow, startDelay, maxMs) {
  const steps = [];
  let col = startCol, row = startRow;
  let t = startDelay;
  let prevKey = "";
  steps.push({ col, row, t: 0 });
  while (t < maxMs) {
    const options = adj(grid, col, row);
    if (!options.length) break;
    const noBack = options.filter((c) => `${c.col},${c.row}` !== prevKey);
    const pool = noBack.length ? noBack : options;
    const target = pick(pool);
    prevKey = `${col},${row}`;
    col = target.col;
    row = target.row;
    steps.push({ col, row, t });
    t += RAT_MS;
  }
  return steps;
}
function detectWeary(catSteps, rat0Steps, rat1Steps) {
  const events = [];
  function posAt(steps, t) {
    let last = steps[0];
    for (const s of steps) {
      if (s.t <= t) last = s;
      else break;
    }
    return last;
  }
  for (const catStep of catSteps) {
    const r0 = posAt(rat0Steps, catStep.t);
    const r1 = posAt(rat1Steps, catStep.t);
    if (r0.col === catStep.col && r0.row === catStep.row || r1.col === catStep.col && r1.row === catStep.row) {
      events.push({ start: catStep.t, end: catStep.t + WEARY_MS });
    }
  }
  return events;
}
function toSec(ms) {
  return (ms / 1e3).toFixed(3) + "s";
}
function smilMove(id, steps, totalMs, getX, getY) {
  if (steps.length < 2) return "";
  const dur = toSec(totalMs);
  const times = steps.map((s) => (s.t / totalMs).toFixed(4)).join(";");
  const xs = steps.map((s) => getX(s).toFixed(1)).join(";");
  const ys = steps.map((s) => getY(s).toFixed(1)).join(";");
  return `
    <animate attributeName="x" calcMode="discrete"
      dur="${dur}" repeatCount="indefinite"
      keyTimes="${times}" values="${xs}"/>
    <animate attributeName="y" calcMode="discrete"
      dur="${dur}" repeatCount="indefinite"
      keyTimes="${times}" values="${ys}"/>`;
}
function smilFishDisappear(eatTime, totalMs) {
  const dur = toSec(totalMs);
  const t0 = (eatTime / totalMs).toFixed(4);
  return `
    <animate attributeName="display" calcMode="discrete"
      dur="${dur}" repeatCount="indefinite"
      keyTimes="0;${t0}" values="inline;none"/>`;
}
function smilWeary(wearyEvents, totalMs, showId, isWeary) {
  if (wearyEvents.length === 0) return "";
  const dur = toSec(totalMs);
  const times = ["0"];
  const vals = [isWeary ? "none" : "inline"];
  for (const ev of wearyEvents) {
    const ts = (ev.start / totalMs).toFixed(4);
    const te = (ev.end / totalMs).toFixed(4);
    if (ts !== times[times.length - 1]) {
      times.push(ts);
      vals.push(isWeary ? "inline" : "none");
    }
    times.push(te);
    vals.push(isWeary ? "none" : "inline");
  }
  return `
    <animate attributeName="display" calcMode="discrete"
      dur="${dur}" repeatCount="indefinite"
      keyTimes="${times.join(";")}" values="${vals.join(";")}"/>`;
}
function drawFish(cx, cy, color, id, eatTime, totalMs) {
  const r = CELL * 0.42;
  const ry = CELL * 0.28;
  const tx = cx - r;
  const disappear = eatTime !== null ? smilFishDisappear(eatTime, totalMs) : "";
  return `<g id="${id}">${disappear}
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${ry}" fill="${color}"/>
    <polygon points="${tx},${cy - ry * 0.9} ${tx},${cy + ry * 0.9} ${tx - r * 0.55},${cy}" fill="${color}" opacity="0.85"/>
    <path d="M${cx - r * 0.3},${cy - ry} Q${cx + r * 0.1},${cy - ry * 1.6} ${cx + r * 0.55},${cy - ry}" fill="${color}" opacity="0.65"/>
    <circle cx="${cx + r * 0.5}" cy="${cy - ry * 0.2}" r="${r * 0.18}" fill="white"/>
    <circle cx="${cx + r * 0.55}" cy="${cy - ry * 0.2}" r="${r * 0.09}" fill="#222"/>
  </g>`;
}
function generateCatSVG(graph, username, theme = "github") {
  const dark = theme === "github-dark";
  const pfx = dark ? "ccg-dark" : "ccg-light";
  const colors = dark ? DARK_COLORS : LIGHT_COLORS;
  const bg = dark ? "#0d1117" : "#ffffff";
  const fg = dark ? "#c9d1d9" : "#24292f";
  const border = dark ? "#30363d" : "#d0d7de";
  const label = dark ? "#8b949e" : "#57606a";
  const weeks = graph.weeks;
  const W = weeks.length;
  const svgW = LEFT + W * STEP + 20;
  const svgH = TOP + ROWS * STEP + 48;
  const cells = [];
  weeks.forEach((wk, wi) => {
    wk.days.forEach((day, di) => {
      const px = LEFT + wi * STEP;
      const py = TOP + di * STEP;
      cells.push({
        col: wi,
        row: di,
        px,
        py,
        cx: px + CELL / 2,
        cy: py + CELL / 2,
        level: day.level,
        date: day.date
      });
    });
  });
  const grid = buildGrid(cells);
  const fishSet = new Set(cells.filter((c) => c.level > 0).map((c) => c.date));
  const catStart = grid.get("0,3") || grid.get("0,0") || cells[0];
  const { steps: catSteps, eats } = simulateCat(grid, fishSet, catStart.col, catStart.row, TOTAL_MS);
  const eatTimeMap = /* @__PURE__ */ new Map();
  for (const e of eats) {
    if (!eatTimeMap.has(e.date)) eatTimeMap.set(e.date, e.t);
  }
  const rat0Start = grid.get(`${Math.floor(W * 0.25)},1`) || cells[Math.floor(cells.length * 0.25)];
  const rat1Start = grid.get(`${Math.floor(W * 0.7)},5`) || cells[Math.floor(cells.length * 0.7)];
  const rat0Steps = simulateRat(grid, rat0Start.col, rat0Start.row, 500, TOTAL_MS);
  const rat1Steps = simulateRat(grid, rat1Start.col, rat1Start.row, 800, TOTAL_MS);
  const wearyEvents = detectWeary(catSteps, rat0Steps, rat1Steps);
  const getX = (s) => (grid.get(`${s.col},${s.row}`) ?? cells[0]).cx;
  const getY = (s) => (grid.get(`${s.col},${s.row}`) ?? cells[0]).cy;
  const gridSVG = cells.map((cell) => {
    if (cell.level === 0) {
      return `<rect x="${cell.px}" y="${cell.py}" width="${CELL}" height="${CELL}" rx="2"
        fill="${colors[0]}" stroke="${border}" stroke-width="0.3"/>`;
    }
    const fishColor = colors[Math.min(cell.level, colors.length - 1)];
    const eatTime = eatTimeMap.get(cell.date) ?? null;
    return `<rect x="${cell.px}" y="${cell.py}" width="${CELL}" height="${CELL}" rx="2"
        fill="${colors[0]}" stroke="${border}" stroke-width="0.3"/>
      ${drawFish(cell.cx, cell.cy, fishColor, `${pfx}-fish-${cell.date}`, eatTime, TOTAL_MS)}`;
  }).join("\n");
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((wk, wi) => {
    const d = wk.days.find((d2) => d2.date);
    if (!d) return;
    const m = new Date(d.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push(`<text x="${LEFT + wi * STEP}" y="${TOP - 8}" font-size="9"
        fill="${label}" font-family="monospace">${new Date(d.date).toLocaleString("default", { month: "short" })}</text>`);
      lastMonth = m;
    }
  });
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""].map(
    (d, i) => d ? `<text x="${LEFT - 4}" y="${TOP + i * STEP + CELL - 2}" font-size="8"
      text-anchor="end" fill="${label}" font-family="monospace">${d}</text>` : ""
  ).join("\n");
  const wearyNormalAnim = smilWeary(wearyEvents, TOTAL_MS, `${pfx}-cat-normal`, false);
  const wearyWearyAnim = smilWeary(wearyEvents, TOTAL_MS, `${pfx}-cat-weary`, true);
  const catNormalEl = `<text id="${pfx}-cat-normal"
    font-size="${CELL}" dominant-baseline="middle" text-anchor="middle">\u{1F431}${smilMove(pfx, catSteps, TOTAL_MS, getX, getY)}${wearyNormalAnim}</text>`;
  const catWearyEl = `<text id="${pfx}-cat-weary"
    font-size="${CELL}" dominant-baseline="middle" text-anchor="middle" display="none">\u{1F640}${smilMove(pfx, catSteps, TOTAL_MS, getX, getY)}${wearyWearyAnim}</text>`;
  const rat0El = `<text id="${pfx}-rat0"
    font-size="${CELL}" dominant-baseline="middle" text-anchor="middle">\u{1F439}${smilMove(pfx, rat0Steps, TOTAL_MS, getX, getY)}</text>`;
  const rat1El = `<text id="${pfx}-rat1"
    font-size="${CELL}" dominant-baseline="middle" text-anchor="middle">\u{1F439}${smilMove(pfx, rat1Steps, TOTAL_MS, getX, getY)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg"
    width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">

  <rect width="${svgW}" height="${svgH}" rx="6" fill="${bg}" stroke="${border}" stroke-width="1"/>

  ${monthLabels.join("\n  ")}
  ${dayLabels}

  ${gridSVG}

  ${catNormalEl}
  ${catWearyEl}
  ${rat0El}
  ${rat1El}

</svg>`;
}

// src/index.ts
async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag, defaultVal) => {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
    return defaultVal;
  };
  const username = getArg("--username") ?? getArg("-u") ?? process.env.GITHUB_USER_NAME;
  const token = getArg("--token") ?? process.env.GITHUB_TOKEN;
  const theme = getArg("--theme") ?? "github";
  const output = getArg("--output") ?? "dist/cat-contribution-graph.svg";
  if (!username) {
    console.error("Error: --username is required (or set GITHUB_USER_NAME env var)");
    process.exit(1);
  }
  if (!token) {
    console.error("Error: --token is required (or set GITHUB_TOKEN env var)");
    process.exit(1);
  }
  console.log(`\u{1F431} Fetching contribution data for ${username}...`);
  const graph = await fetchContributionGraph(username, token);
  console.log(`\u{1F4CA} Found ${graph.totalContributions} contributions across ${graph.weeks.length} weeks`);
  console.log(`\u{1F3A8} Generating ${theme} themed SVG...`);
  const svg = generateCatSVG(graph, username, theme);
  const outDir = path.dirname(output);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(output, svg, "utf-8");
  console.log(`\u2705 Saved to ${output}`);
}
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
