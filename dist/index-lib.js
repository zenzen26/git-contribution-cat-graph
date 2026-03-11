"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/cat-animator.ts
var cat_animator_exports = {};
__export(cat_animator_exports, {
  generateCatSVG: () => generateCatSVG
});
module.exports = __toCommonJS(cat_animator_exports);
var CELL = 14;
var GAP = 3;
var STEP = CELL + GAP;
var TOP = 36;
var LEFT = 44;
var ROWS = 7;
var LIGHT_COLORS = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
var DARK_COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
function drawFish(cx, cy, color, id) {
  const r = CELL * 0.42;
  const ry = CELL * 0.28;
  const tx = cx - r;
  return `<g id="${id}">
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${ry}" fill="${color}"/>
    <polygon points="${tx},${cy - ry * 0.9} ${tx},${cy + ry * 0.9} ${tx - r * 0.55},${cy}" fill="${color}" opacity="0.85"/>
    <path d="M${cx - r * 0.3},${cy - ry} Q${cx + r * 0.1},${cy - ry * 1.6} ${cx + r * 0.55},${cy - ry}" fill="${color}" opacity="0.65"/>
    <circle cx="${cx + r * 0.5}" cy="${cy - ry * 0.2}" r="${r * 0.18}" fill="white"/>
    <circle cx="${cx + r * 0.55}" cy="${cy - ry * 0.2}" r="${r * 0.09}" fill="#222"/>
  </g>`;
}
function generateCatSVG(graph, username, theme = "github") {
  const dark = theme === "github-dark";
  const svgId = dark ? "ccg-dark" : "ccg-light";
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
      cells.push({
        col: wi,
        row: di,
        x: LEFT + wi * STEP,
        y: TOP + di * STEP,
        level: day.level,
        date: day.date
      });
    });
  });
  const gridSVG = cells.map((cell) => {
    const cx = cell.x + CELL / 2;
    const cy = cell.y + CELL / 2;
    const emptyFill = colors[0];
    if (cell.level === 0) {
      return `<rect x="${cell.x}" y="${cell.y}" width="${CELL}" height="${CELL}" rx="2"
        fill="${emptyFill}" stroke="${border}" stroke-width="0.3"/>`;
    }
    const fishColor = colors[Math.min(cell.level, colors.length - 1)];
    return `<rect x="${cell.x}" y="${cell.y}" width="${CELL}" height="${CELL}" rx="2"
        fill="${emptyFill}" stroke="${border}" stroke-width="0.3"/>
      ${drawFish(cx, cy, fishColor, `${svgId}-fish-${cell.date}`)}`;
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
  const emojiSize = CELL;
  const catEl = `
    <text id="${svgId}-cat-normal" x="${LEFT - STEP}" y="${TOP + 3 * STEP + CELL}"
      font-size="${emojiSize}" dominant-baseline="auto" text-anchor="middle">\u{1F431}</text>
    <text id="${svgId}-cat-weary"  x="${LEFT - STEP}" y="${TOP + 3 * STEP + CELL}"
      font-size="${emojiSize}" dominant-baseline="auto" text-anchor="middle" display="none">\u{1F640}</text>`;
  const ratsEl = `
    <text id="${svgId}-rat0" x="-100" y="-100"
      font-size="${emojiSize}" dominant-baseline="auto" text-anchor="middle">\u{1F439}</text>
    <text id="${svgId}-rat1" x="-100" y="-100"
      font-size="${emojiSize}" dominant-baseline="auto" text-anchor="middle">\u{1F439}</text>`;
  const cellsJSON = JSON.stringify(
    cells.map((c) => ({
      c: c.col,
      r: c.row,
      x: c.x + CELL / 2,
      // emoji x (text-anchor middle)
      y: c.y + CELL,
      // emoji y (text bottom)
      d: c.date,
      l: c.level
    }))
  );
  const script = `<script>//<![CDATA[
(function() {
  var PFX     = '${svgId}';   // unique prefix \u2014 prevents ID collision when two SVGs on same page
  var CAT_MS   = 280;
  var RAT_MS   = 360;
  var WEARY_MS = 900;

  var rawCells = ${cellsJSON};

  // grid lookup: "col,row" -> cell object {c,r,x,y,d,l}
  var grid = {};
  var fishCells = [];
  for (var i = 0; i < rawCells.length; i++) {
    var cell = rawCells[i];
    grid[cell.c + ',' + cell.r] = cell;
    if (cell.l > 0) fishCells.push(cell);
  }

  // Fish visibility: date string -> true (fish visible)
  // We key ONLY by date because that matches the SVG id "fish-DATE"
  var fishDates = {};
  for (var i = 0; i < fishCells.length; i++) fishDates[fishCells[i].d] = true;
  var totalFish  = fishCells.length;
  var eatenCount = 0;

  function $(id) { return document.getElementById(PFX + '-' + id); }
  function show(id) { var e=$(id); if(e) e.setAttribute('display','inline'); }
  function hide(id) { var e=$(id); if(e) e.setAttribute('display','none');   }
  function mvEl(id,x,y){ var e=$(id); if(e){e.setAttribute('x',x);e.setAttribute('y',y);} }

  // 4 adjacent cells \u2014 coerce col/row to numbers to avoid string concat bug
  function adj(col, row) {
    var out = [];
    var c = +col, r = +row;
    var D = [[0,-1],[0,1],[-1,0],[1,0]];
    for (var i = 0; i < D.length; i++) {
      var nb = grid[(c+D[i][0]) + ',' + (r+D[i][1])];
      if (nb) out.push(nb);
    }
    return out;
  }
  function rnd(a) { return a[Math.floor(Math.random()*a.length)]; }

  // \u2500\u2500 Cat \u2500\u2500
  var cs = grid['0,3'] || grid['0,0'] || rawCells[0];
  var catC = +cs.c, catR = +cs.r;
  var wearyUntil = 0, catNextAt = 0;
  var catPrevKey = '';
  mvEl('cat-normal', cs.x, cs.y);
  mvEl('cat-weary',  cs.x, cs.y);

  function stepCat(now) {
    // Weary face toggle
    if (now < wearyUntil) { hide('cat-normal'); show('cat-weary'); }
    else                   { show('cat-normal'); hide('cat-weary'); }

    if (now < catNextAt) return;

    // All fish eaten -> reset
    if (eatenCount >= totalFish) {
      for (var i = 0; i < fishCells.length; i++) {
        fishDates[fishCells[i].d] = true;
        show('fish-' + fishCells[i].d);
      }
      eatenCount = 0;
      catNextAt  = now + 1200;
      return;
    }

    // Pick next adjacent cell \u2014 prefer ones with fish, avoid backtracking
    var options = adj(catC, catR);
    if (!options.length) return;
    // Filter out previous cell to prevent bouncing (unless no other option)
    var forward = options.filter(function(n){ return (n.c+','+n.r) !== catPrevKey; });
    var pool = forward.length ? forward : options;
    var withFish = pool.filter(function(n){ return fishDates[n.d]; });
    var target = rnd(withFish.length ? withFish : pool);

    // Move one cell \u2014 record previous to prevent backtrack
    catPrevKey = catC + ',' + catR;
    catC = +target.c; catR = +target.r;
    mvEl('cat-normal', target.x, target.y);
    mvEl('cat-weary',  target.x, target.y);

    // Only eat if this cell actually has a fish (level > 0 AND still in fishDates)
    if (target.l > 0 && fishDates[target.d]) {
      hide('fish-' + target.d);
      delete fishDates[target.d];
      eatenCount++;
    }
    catNextAt = now + CAT_MS;
  }

  // \u2500\u2500 Rats \u2014 random walkers on grid \u2500\u2500
  function makeRat(preferCol, preferRow, fallbackIdx) {
    var sc = grid[preferCol + ',' + preferRow];
    if (!sc) {
      for (var rr = 0; rr < ${ROWS}; rr++) {
        sc = grid[preferCol + ',' + rr];
        if (sc) break;
      }
    }
    if (!sc) sc = rawCells[fallbackIdx] || rawCells[0];
    return { c: +sc.c, r: +sc.r, x: sc.x, y: sc.y, prevKey: '', nextAt: Infinity };
  }

  var rat0 = makeRat(Math.floor(${W}*0.25), 1, 20);
  var rat1 = makeRat(Math.floor(${W}*0.70), 5, 60);

  // Place rats correctly from the start \u2014 no jump
  mvEl('rat0', rat0.x, rat0.y);
  mvEl('rat1', rat1.x, rat1.y);

  // Stagger their first move after the loop starts
  function initRatTimers(now) {
    rat0.nextAt = now + 500;
    rat1.nextAt = now + 800;
  }
  var ratsInited = false;

  function stepRat(rat, elId, speed, now) {
    if (now < rat.nextAt) return;
    var options = adj(rat.c, rat.r);
    if (!options.length) return;
    var forward = options.filter(function(n){ return (n.c+','+n.r) !== rat.prevKey; });
    var target = rnd(forward.length ? forward : options);
    rat.prevKey = rat.c + ',' + rat.r;
    rat.c = +target.c; rat.r = +target.r;
    mvEl(elId, target.x, target.y);
    rat.nextAt = now + speed;
    if (rat.c === catC && rat.r === catR) wearyUntil = now + WEARY_MS;
  }

  function loop(now) {
    if (!ratsInited) { initRatTimers(now); ratsInited = true; }
    stepCat(now);
    stepRat(rat0, 'rat0', RAT_MS,       now);
    stepRat(rat1, 'rat1', RAT_MS * 1.2, now);
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ requestAnimationFrame(loop); });
  } else {
    requestAnimationFrame(loop);
  }
})();
//]]></script>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
    width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">

  <!-- Background -->
  <rect width="${svgW}" height="${svgH}" rx="6" fill="${bg}" stroke="${border}" stroke-width="1"/>

  <!-- Month labels -->
  ${monthLabels.join("\n")}

  <!-- Day labels -->
  ${dayLabels}

  <!-- Grid cells (fish-shaped SVG dots) -->
  ${gridSVG}

  <!-- Characters -->
  ${catEl}
  ${ratsEl}

  <!-- JS engine -->
  ${script}

</svg>`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateCatSVG
});
