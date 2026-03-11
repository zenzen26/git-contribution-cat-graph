"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCatSVG = generateCatSVG;
const CELL = 14;
const GAP = 3;
const STEP = CELL + GAP;
const TOP = 36;
const LEFT = 44;
const ROWS = 7;
const LIGHT_COLORS = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const DARK_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
// ms per cell step
const CAT_MS = 300;
const RAT_MS = 400;
const WEARY_MS = 800;
// total animation duration in ms before looping
const TOTAL_MS = 30000;
// ── Simulation helpers ────────────────────────────────────────────────────────
function buildGrid(cells) {
    const g = new Map();
    for (const c of cells)
        g.set(`${c.col},${c.row}`, c);
    return g;
}
function adj(grid, col, row) {
    return [[0, -1], [0, 1], [-1, 0], [1, 0]]
        .map(([dc, dr]) => grid.get(`${col + dc},${row + dr}`))
        .filter((c) => c !== undefined);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function simulateCat(grid, fishSet, // mutable — dates of remaining fish
startCol, startRow, maxMs) {
    const steps = [];
    const eats = [];
    let col = startCol, row = startRow;
    let t = 0;
    let prevKey = "";
    steps.push({ col, row, t });
    while (t < maxMs) {
        const options = adj(grid, col, row);
        if (!options.length)
            break;
        // prefer forward (no backtrack) and prefer fish cells
        const noBack = options.filter(c => `${c.col},${c.row}` !== prevKey);
        const pool = noBack.length ? noBack : options;
        const withFish = pool.filter(c => fishSet.has(c.date));
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
        // reset fish if all eaten
        if (fishSet.size === 0) {
            // re-add all fish (get from grid)
            for (const c of grid.values()) {
                if (c.level > 0)
                    fishSet.add(c.date);
            }
        }
    }
    return { steps, eats };
}
// ── Pre-simulate rat walk ─────────────────────────────────────────────────────
function simulateRat(grid, startCol, startRow, startDelay, maxMs) {
    const steps = [];
    let col = startCol, row = startRow;
    let t = startDelay;
    let prevKey = "";
    steps.push({ col, row, t: 0 }); // initial position (before animation starts)
    while (t < maxMs) {
        const options = adj(grid, col, row);
        if (!options.length)
            break;
        const noBack = options.filter(c => `${c.col},${c.row}` !== prevKey);
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
// ── Detect weary events (when rat overlaps cat) ───────────────────────────────
function detectWeary(catSteps, rat0Steps, rat1Steps) {
    const events = [];
    // Build a timeline map for rats: t -> {col, row}
    function posAt(steps, t) {
        let last = steps[0];
        for (const s of steps) {
            if (s.t <= t)
                last = s;
            else
                break;
        }
        return last;
    }
    // Sample every CAT_MS to find collisions
    for (const catStep of catSteps) {
        const r0 = posAt(rat0Steps, catStep.t);
        const r1 = posAt(rat1Steps, catStep.t);
        if ((r0.col === catStep.col && r0.row === catStep.row) ||
            (r1.col === catStep.col && r1.row === catStep.row)) {
            events.push({ start: catStep.t, end: catStep.t + WEARY_MS });
        }
    }
    return events;
}
// ── SMIL helpers ──────────────────────────────────────────────────────────────
function toSec(ms) { return (ms / 1000).toFixed(3) + "s"; }
// Build SMIL animate for x and y position from a steps array
// Uses discrete calcMode — jumps instantly to each cell (pac-man style)
function smilMove(id, steps, totalMs, getX, getY) {
    if (steps.length < 2)
        return "";
    const dur = toSec(totalMs);
    const times = steps.map(s => (s.t / totalMs).toFixed(4)).join(";");
    const xs = steps.map(s => getX(s).toFixed(1)).join(";");
    const ys = steps.map(s => getY(s).toFixed(1)).join(";");
    return `
    <animate attributeName="x" calcMode="discrete"
      dur="${dur}" repeatCount="indefinite"
      keyTimes="${times}" values="${xs}"/>
    <animate attributeName="y" calcMode="discrete"
      dur="${dur}" repeatCount="indefinite"
      keyTimes="${times}" values="${ys}"/>`;
}
// SMIL animate for display (fish disappear)
function smilFishDisappear(eatTime, totalMs) {
    const dur = toSec(totalMs);
    // Before eat: inline. At eat: none. Then stays none until reset (loop).
    const t0 = (eatTime / totalMs).toFixed(4);
    return `
    <animate attributeName="display" calcMode="discrete"
      dur="${dur}" repeatCount="indefinite"
      keyTimes="0;${t0}" values="inline;none"/>`;
}
// SMIL for cat weary face — show during weary periods, hide otherwise
function smilWeary(wearyEvents, totalMs, showId, // cat-normal or cat-weary
isWeary // true = this is the weary element
) {
    if (wearyEvents.length === 0)
        return "";
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
// ── Fish SVG ──────────────────────────────────────────────────────────────────
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
// ── Main export ───────────────────────────────────────────────────────────────
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
    // Build cells
    const cells = [];
    weeks.forEach((wk, wi) => {
        wk.days.forEach((day, di) => {
            const px = LEFT + wi * STEP;
            const py = TOP + di * STEP;
            cells.push({
                col: wi, row: di,
                px, py,
                cx: px + CELL / 2,
                cy: py + CELL / 2,
                level: day.level,
                date: day.date,
            });
        });
    });
    const grid = buildGrid(cells);
    // ── Simulate ────────────────────────────────────────────────────────────────
    const fishSet = new Set(cells.filter(c => c.level > 0).map(c => c.date));
    // cat starts col=0 row=3
    const catStart = grid.get("0,3") || grid.get("0,0") || cells[0];
    const { steps: catSteps, eats } = simulateCat(grid, fishSet, catStart.col, catStart.row, TOTAL_MS);
    // Build eat time map: date -> first eat time
    const eatTimeMap = new Map();
    for (const e of eats) {
        if (!eatTimeMap.has(e.date))
            eatTimeMap.set(e.date, e.t);
    }
    // rats start at different positions
    const rat0Start = grid.get(`${Math.floor(W * 0.25)},1`) || cells[Math.floor(cells.length * 0.25)];
    const rat1Start = grid.get(`${Math.floor(W * 0.70)},5`) || cells[Math.floor(cells.length * 0.70)];
    const rat0Steps = simulateRat(grid, rat0Start.col, rat0Start.row, 500, TOTAL_MS);
    const rat1Steps = simulateRat(grid, rat1Start.col, rat1Start.row, 800, TOTAL_MS);
    const wearyEvents = detectWeary(catSteps, rat0Steps, rat1Steps);
    // ── Helper: pixel center of a step ──────────────────────────────────────────
    const getX = (s) => (grid.get(`${s.col},${s.row}`) ?? cells[0]).cx;
    const getY = (s) => (grid.get(`${s.col},${s.row}`) ?? cells[0]).cy;
    // ── Grid SVG ────────────────────────────────────────────────────────────────
    const gridSVG = cells.map(cell => {
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
    // ── Month labels ─────────────────────────────────────────────────────────────
    const monthLabels = [];
    let lastMonth = -1;
    weeks.forEach((wk, wi) => {
        const d = wk.days.find(d => d.date);
        if (!d)
            return;
        const m = new Date(d.date).getMonth();
        if (m !== lastMonth) {
            monthLabels.push(`<text x="${LEFT + wi * STEP}" y="${TOP - 8}" font-size="9"
        fill="${label}" font-family="monospace">${new Date(d.date).toLocaleString("default", { month: "short" })}</text>`);
            lastMonth = m;
        }
    });
    const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => d ? `<text x="${LEFT - 4}" y="${TOP + i * STEP + CELL - 2}" font-size="8"
      text-anchor="end" fill="${label}" font-family="monospace">${d}</text>` : "").join("\n");
    // ── Characters with SMIL ─────────────────────────────────────────────────────
    const wearyNormalAnim = smilWeary(wearyEvents, TOTAL_MS, `${pfx}-cat-normal`, false);
    const wearyWearyAnim = smilWeary(wearyEvents, TOTAL_MS, `${pfx}-cat-weary`, true);
    const catNormalEl = `<text id="${pfx}-cat-normal"
    font-size="${CELL}" dominant-baseline="middle" text-anchor="middle">🐱${smilMove(pfx, catSteps, TOTAL_MS, getX, getY)}${wearyNormalAnim}</text>`;
    const catWearyEl = `<text id="${pfx}-cat-weary"
    font-size="${CELL}" dominant-baseline="middle" text-anchor="middle" display="none">🙀${smilMove(pfx, catSteps, TOTAL_MS, getX, getY)}${wearyWearyAnim}</text>`;
    const rat0El = `<text id="${pfx}-rat0"
    font-size="${CELL}" dominant-baseline="middle" text-anchor="middle">🐹${smilMove(pfx, rat0Steps, TOTAL_MS, getX, getY)}</text>`;
    const rat1El = `<text id="${pfx}-rat1"
    font-size="${CELL}" dominant-baseline="middle" text-anchor="middle">🐹${smilMove(pfx, rat1Steps, TOTAL_MS, getX, getY)}</text>`;
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
//# sourceMappingURL=cat-animator.js.map