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
var CELL_SIZE = 11;
var CELL_GAP = 3;
var STEP = CELL_SIZE + CELL_GAP;
var GRID_TOP = 30;
var GRID_LEFT = 40;
var LEVEL_COLORS_LIGHT = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
var LEVEL_COLORS_DARK = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
function buildCatHead(state, facingLeft) {
  const flip = facingLeft ? 'transform="scale(-1,1) translate(-20,0)"' : "";
  const eyeOpen = `<circle cx="7" cy="9" r="1.5" fill="#222"/><circle cx="13" cy="9" r="1.5" fill="#222"/>`;
  const eyeClosed = `<line x1="5.5" y1="9" x2="8.5" y2="9" stroke="#222" stroke-width="1.5" stroke-linecap="round"/><line x1="11.5" y1="9" x2="14.5" y2="9" stroke="#222" stroke-width="1.5" stroke-linecap="round"/>`;
  const eyeDead = `<text x="5" y="11" font-size="5" fill="#222">\xD7</text><text x="11" y="11" font-size="5" fill="#222">\xD7</text>`;
  const eyeHalf = `<path d="M5.5 9 Q7 7.5 8.5 9" stroke="#222" fill="none" stroke-width="1.5"/><path d="M11.5 9 Q13 7.5 14.5 9" stroke="#222" fill="none" stroke-width="1.5"/>`;
  let eyes = eyeOpen;
  let mouth = `<path d="M8 13 Q10 15 12 13" stroke="#222" fill="none" stroke-width="1.2"/>`;
  let extra = "";
  switch (state) {
    case "eating":
      eyes = eyeOpen;
      mouth = `<path d="M7 13 Q10 16 13 13" stroke="#222" fill="none" stroke-width="1.5"/><circle cx="10" cy="14.5" r="2" fill="#ffd700" opacity="0.6"/>`;
      break;
    case "sleeping":
      eyes = eyeClosed;
      mouth = `<path d="M8 13 Q10 14 12 13" stroke="#222" fill="none" stroke-width="1"/>`;
      extra = `<text x="14" y="7" font-size="6" fill="#888">z</text>`;
      break;
    case "pooping":
      eyes = eyeHalf;
      mouth = `<path d="M8 13 Q10 12 12 13" stroke="#222" fill="none" stroke-width="1"/>`;
      extra = `<text x="-4" y="22" font-size="8">\u{1F4A9}</text>`;
      break;
    case "dead":
      eyes = eyeDead;
      mouth = `<path d="M8 14 Q10 12 12 14" stroke="#222" fill="none" stroke-width="1"/>`;
      break;
    case "walking":
    default:
      break;
  }
  const whiskers = `
    <line x1="1" y1="11" x2="7" y2="12" stroke="#aaa" stroke-width="0.7"/>
    <line x1="1" y1="13" x2="7" y2="13" stroke="#aaa" stroke-width="0.7"/>
    <line x1="13" y1="12" x2="19" y2="11" stroke="#aaa" stroke-width="0.7"/>
    <line x1="13" y1="13" x2="19" y2="13" stroke="#aaa" stroke-width="0.7"/>
  `;
  return `
    <g ${flip}>
      <!-- Head -->
      <ellipse cx="10" cy="11" rx="9" ry="8.5" fill="#FFD700" stroke="#E8C000" stroke-width="0.5"/>
      <!-- Ears -->
      <polygon points="2,5 0,0 6,3" fill="#FFD700" stroke="#E8C000" stroke-width="0.5"/>
      <polygon points="2.5,4.5 1,1 5.5,3" fill="#FFB6C1"/>
      <polygon points="18,5 20,0 14,3" fill="#FFD700" stroke="#E8C000" stroke-width="0.5"/>
      <polygon points="17.5,4.5 19,1 14.5,3" fill="#FFB6C1"/>
      <!-- Eyes -->
      ${eyes}
      <!-- Nose -->
      <polygon points="10,12 9,13 11,13" fill="#FF9999"/>
      ${whiskers}
      <!-- Mouth -->
      ${mouth}
      ${extra}
    </g>
  `;
}
function buildRatHead(facingLeft) {
  const flip = facingLeft ? 'transform="scale(-1,1) translate(-20,0)"' : "";
  return `
    <g ${flip}>
      <!-- Body -->
      <ellipse cx="10" cy="12" rx="8" ry="7" fill="#A0A0A0" stroke="#888" stroke-width="0.5"/>
      <!-- Ears (big round) -->
      <circle cx="4" cy="5" r="4" fill="#C0C0C0" stroke="#888" stroke-width="0.5"/>
      <circle cx="4" cy="5" r="2.5" fill="#FFAAAA"/>
      <circle cx="16" cy="5" r="4" fill="#C0C0C0" stroke="#888" stroke-width="0.5"/>
      <circle cx="16" cy="5" r="2.5" fill="#FFAAAA"/>
      <!-- Eyes -->
      <circle cx="7" cy="10" r="1.5" fill="#FF4444"/>
      <circle cx="13" cy="10" r="1.5" fill="#FF4444"/>
      <circle cx="7.5" cy="9.5" r="0.5" fill="#fff"/>
      <circle cx="13.5" cy="9.5" r="0.5" fill="#fff"/>
      <!-- Snout -->
      <ellipse cx="10" cy="14" rx="3" ry="2" fill="#CCC"/>
      <circle cx="10" cy="13.5" r="1" fill="#FF9999"/>
      <!-- Whiskers -->
      <line x1="2" y1="13" x2="7" y2="14" stroke="#999" stroke-width="0.6"/>
      <line x1="2" y1="15" x2="7" y2="14.5" stroke="#999" stroke-width="0.6"/>
      <line x1="13" y1="14" x2="18" y2="13" stroke="#999" stroke-width="0.6"/>
      <line x1="13" y1="14.5" x2="18" y2="15" stroke="#999" stroke-width="0.6"/>
    </g>
  `;
}
function buildFish(level, colors) {
  const col = colors[level] ?? colors[1];
  return `
    <g>
      <!-- Fish body -->
      <ellipse cx="5.5" cy="5.5" rx="4.5" ry="3" fill="${col}" opacity="0.95"/>
      <!-- Tail -->
      <polygon points="0,3.5 0,7.5 -3,5.5" fill="${col}" opacity="0.8"/>
      <!-- Eye -->
      <circle cx="7" cy="5" r="1" fill="white"/>
      <circle cx="7.2" cy="5" r="0.5" fill="#333"/>
      <!-- Fin -->
      <path d="M4 3 Q6 1 8 3" stroke="${col}" fill="none" stroke-width="0.8" opacity="0.7"/>
    </g>
  `;
}
function buildPoopEmoji() {
  return `<text x="0" y="10" font-size="10" text-anchor="middle">\u{1F4A9}</text>`;
}
function planCatPath(cells) {
  const active = cells.filter((c) => c.level > 0);
  if (active.length === 0) return cells;
  const sorted = [...active].sort(
    (a, b) => a.weekIndex !== b.weekIndex ? a.weekIndex - b.weekIndex : a.dayIndex - b.dayIndex
  );
  return sorted;
}
function generateCatSVG(graph, username, theme = "github") {
  const isDark = theme === "github-dark";
  const levelColors = isDark ? LEVEL_COLORS_DARK : LEVEL_COLORS_LIGHT;
  const bgColor = isDark ? "#0d1117" : "#ffffff";
  const textColor = isDark ? "#c9d1d9" : "#24292f";
  const borderColor = isDark ? "#30363d" : "#d0d7de";
  const weeks = graph.weeks;
  const svgWidth = GRID_LEFT + weeks.length * STEP + 20;
  const svgHeight = GRID_TOP + 7 * STEP + 60;
  const cells = [];
  weeks.forEach((week, wi) => {
    week.days.forEach((day, di) => {
      cells.push({
        weekIndex: wi,
        dayIndex: di,
        x: GRID_LEFT + wi * STEP,
        y: GRID_TOP + di * STEP,
        level: day.level,
        date: day.date,
        eaten: false
      });
    });
  });
  const eatPath = planCatPath(cells);
  const totalCells = eatPath.length;
  const MOVE_DURATION = 400;
  const EAT_DURATION = 300;
  const POOP_DURATION = 800;
  const SLEEP_DURATION = 3e3;
  const RESET_PAUSE = 500;
  const keyframes = [];
  let time = 0;
  let eatCount = 0;
  let prevX = GRID_LEFT;
  let prevY = GRID_TOP + 3 * STEP;
  const poops = [];
  keyframes.push({ t: 0, catX: prevX - STEP, catY: prevY, state: "walking", facingLeft: false, eatenUpTo: 0 });
  for (let i = 0; i < eatPath.length; i++) {
    const cell = eatPath[i];
    const dx = cell.x - prevX;
    time += MOVE_DURATION;
    keyframes.push({
      t: time,
      catX: cell.x,
      catY: cell.y,
      state: "walking",
      facingLeft: dx < 0,
      eatenUpTo: eatCount
    });
    time += EAT_DURATION;
    eatCount++;
    keyframes.push({
      t: time,
      catX: cell.x,
      catY: cell.y,
      state: "eating",
      facingLeft: dx < 0,
      eatenUpTo: eatCount
    });
    if (eatCount % 3 === 0) {
      const poopX = cell.x + (dx >= 0 ? -STEP : STEP);
      const poopY = cell.y;
      poops.push({ t: time, x: poopX, y: poopY });
      time += POOP_DURATION;
      keyframes.push({
        t: time,
        catX: cell.x,
        catY: cell.y,
        state: "pooping",
        facingLeft: dx < 0,
        eatenUpTo: eatCount,
        poopAt: { x: poopX, y: poopY }
      });
      time += SLEEP_DURATION;
      keyframes.push({
        t: time,
        catX: cell.x,
        catY: cell.y,
        state: "sleeping",
        facingLeft: dx < 0,
        eatenUpTo: eatCount
      });
      time += 300;
      keyframes.push({
        t: time,
        catX: cell.x,
        catY: cell.y,
        state: "walking",
        facingLeft: dx < 0,
        eatenUpTo: eatCount
      });
    }
    prevX = cell.x;
    prevY = cell.y;
  }
  time += 1e3;
  const totalDuration = time + RESET_PAUSE;
  const rat1Path = generateRatPath(weeks.length, 0, totalDuration);
  const rat2Path = generateRatPath(weeks.length, 1, totalDuration);
  const gridCellsSVG = cells.map((cell) => {
    const isEatable = cell.level > 0;
    const eatIndex = eatPath.findIndex((e) => e.date === cell.date);
    if (!isEatable || eatIndex === -1) {
      return `<rect x="${cell.x}" y="${cell.y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="2" fill="${levelColors[0]}" stroke="${borderColor}" stroke-width="0.3"/>`;
    }
    const eatKF = keyframes.find((kf) => kf.eatenUpTo === eatIndex + 1 && kf.state === "eating");
    const eatTimeS = eatKF ? (eatKF.t / 1e3).toFixed(2) : "9999";
    return `
      <g id="cell-${cell.date}">
        <rect x="${cell.x}" y="${cell.y}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="2" fill="${levelColors[0]}" stroke="${borderColor}" stroke-width="0.3"/>
        <g transform="translate(${cell.x + 1}, ${cell.y + 1})">
          ${buildFish(cell.level, levelColors)}
          <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;${(Number(eatTimeS) - 0.1 / totalDuration * 1e3).toFixed(4)};${eatTimeS};1" dur="${(totalDuration / 1e3).toFixed(2)}s" repeatCount="indefinite"/>
        </g>
      </g>
    `;
  }).join("\n");
  const poopsSVG = poops.map((p, i) => {
    const showT = (p.t / 1e3 / (totalDuration / 1e3)).toFixed(4);
    const hideT = ((totalDuration - 100) / 1e3 / (totalDuration / 1e3)).toFixed(4);
    return `
      <g transform="translate(${p.x + 5}, ${p.y + 5})" opacity="0">
        ${buildPoopEmoji()}
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${showT};${showT};${hideT};1" dur="${(totalDuration / 1e3).toFixed(2)}s" repeatCount="indefinite"/>
      </g>
    `;
  }).join("\n");
  const catSVG = buildCatAnimation(keyframes, totalDuration);
  const ratsSVG = [rat1Path, rat2Path].map(
    (path2, ri) => buildRatAnimation(path2, totalDuration, ri)
  ).join("\n");
  const monthLabels = buildMonthLabels(weeks, isDark ? "#8b949e" : "#57606a");
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""].map(
    (d, i) => d ? `<text x="${GRID_LEFT - 5}" y="${GRID_TOP + i * STEP + 9}" font-size="8" text-anchor="end" fill="${isDark ? "#8b949e" : "#57606a"}" font-family="monospace">${d}</text>` : ""
  ).join("\n");
  const title = `<text x="${svgWidth / 2}" y="16" font-size="12" text-anchor="middle" fill="${textColor}" font-family="monospace" font-weight="bold">\u{1F431} ${username}'s contribution cat</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <defs>
    <style>
      .cat-head { font-family: monospace; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${svgWidth}" height="${svgHeight}" rx="6" fill="${bgColor}" stroke="${borderColor}" stroke-width="1"/>

  <!-- Title -->
  ${title}

  <!-- Month labels -->
  ${monthLabels}

  <!-- Day labels -->
  ${dayLabels}

  <!-- Grid cells (fish shaped contribution dots) -->
  ${gridCellsSVG}

  <!-- Poop markers -->
  ${poopsSVG}

  <!-- Rats -->
  ${ratsSVG}

  <!-- Cat -->
  ${catSVG}
</svg>`;
}
function buildMonthLabels(weeks, color) {
  const labels = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = week.days.find((d) => d.date);
    if (!firstDay) return;
    const month = new Date(firstDay.date).getMonth();
    if (month !== lastMonth) {
      const monthName = new Date(firstDay.date).toLocaleString("default", { month: "short" });
      labels.push(`<text x="${GRID_LEFT + wi * STEP}" y="${GRID_TOP - 5}" font-size="9" fill="${color}" font-family="monospace">${monthName}</text>`);
      lastMonth = month;
    }
  });
  return labels.join("\n");
}
function buildCatAnimation(keyframes, totalDuration) {
  const durS = (totalDuration / 1e3).toFixed(2);
  const xKT = keyframes.map((kf) => (kf.t / totalDuration).toFixed(4)).join(";");
  const xV = keyframes.map((kf) => kf.catX).join(";");
  const yV = keyframes.map((kf) => kf.catY).join(";");
  const states = ["walking", "eating", "pooping", "sleeping", "dead"];
  const stateAnimations = states.map((state) => {
    const opacities = keyframes.map((kf) => kf.state === state ? "1" : "0").join(";");
    return `
      <g id="cat-state-${state}" opacity="0">
        ${buildCatHead(state, false)}
        <animate attributeName="opacity" values="${opacities}" keyTimes="${xKT}" dur="${durS}s" repeatCount="indefinite" calcMode="discrete"/>
      </g>`;
  }).join("\n");
  const flipValues = keyframes.map((kf) => kf.facingLeft ? "scale(-1,1) translate(-20,0)" : "scale(1,1)").join(";");
  return `
  <g id="cat">
    <animateTransform attributeName="transform" type="translate"
      values="${keyframes.map((kf) => `${kf.catX},${kf.catY}`).join(";")}"
      keyTimes="${xKT}"
      dur="${durS}s"
      repeatCount="indefinite"
      calcMode="linear"/>
    <g>
      ${stateAnimations}
    </g>
  </g>`;
}
function generateRatPath(weekCount, seed, totalDuration) {
  const frames = [];
  const maxX = GRID_LEFT + weekCount * STEP;
  const maxY = GRID_TOP + 6 * STEP;
  const points = 20;
  for (let i = 0; i <= points; i++) {
    const t = i / points * totalDuration;
    const phase = i / points * Math.PI * 4 + seed * Math.PI;
    const x = GRID_LEFT + Math.abs(Math.sin(phase * 0.7 + seed)) * (weekCount - 4) * STEP;
    const y = GRID_TOP + (Math.sin(phase + seed * 2) + 1) / 2 * 5 * STEP;
    const prevX = i > 0 ? GRID_LEFT + Math.abs(Math.sin((i - 1) / points * Math.PI * 4 * 0.7 + seed * 0.7)) * (weekCount - 4) * STEP : x;
    frames.push({ t, x, y, facingLeft: x < prevX });
  }
  return frames;
}
function buildRatAnimation(path2, totalDuration, index) {
  const durS = (totalDuration / 1e3).toFixed(2);
  const xKT = path2.map((f) => (f.t / totalDuration).toFixed(4)).join(";");
  const coords = path2.map((f) => `${f.x},${f.y}`).join(";");
  const flips = path2.map((f) => f.facingLeft ? "scale(-1,1) translate(-20,0)" : "scale(1,1)").join(";");
  return `
  <g id="rat-${index}">
    <animateTransform attributeName="transform" type="translate"
      values="${coords}"
      keyTimes="${xKT}"
      dur="${durS}s"
      repeatCount="indefinite"
      calcMode="linear"/>
    ${buildRatHead(false)}
  </g>`;
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
