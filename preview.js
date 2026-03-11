#!/usr/bin/env node
// Run: node preview.js
// Then open preview.html in your browser

const fs = require("fs");

// Load the bundled lib
let generateCatSVG;
try {
  ({ generateCatSVG } = require("./dist/index-lib.js"));
} catch(e) {
  console.error("Run npm run build first!");
  process.exit(1);
}

// Mock data - realistic contribution graph
function mockGraph() {
  const weeks = [];
  const now = new Date();
  for (let w = 52; w >= 0; w--) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - w * 7 - (6 - d));
      const rand = Math.random();
      const count = rand < 0.35 ? 0
        : rand < 0.6  ? Math.ceil(Math.random() * 3)
        : rand < 0.8  ? Math.ceil(Math.random() * 6) + 3
        : rand < 0.93 ? Math.ceil(Math.random() * 8) + 6
        : Math.ceil(Math.random() * 12) + 10;
      const level = count === 0 ? 0 : count < 4 ? 1 : count < 8 ? 2 : count < 12 ? 3 : 4;
      days.push({ date: date.toISOString().split("T")[0], count, level });
    }
    weeks.push({ days });
  }
  return { weeks, totalContributions: 420 };
}

const graph = mockGraph();
const svgLight = generateCatSVG(graph, "zenzen26", "github");
const svgDark  = generateCatSVG(graph, "zenzen26", "github-dark");

fs.writeFileSync("preview-light.svg", svgLight);
fs.writeFileSync("preview-dark.svg",  svgDark);

// Embed directly in HTML so the JS inside SVG executes
const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cat Contribution Graph Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: monospace; }
    .panel { padding: 32px 40px; }
    .light { background: #f6f8fa; }
    .dark  { background: #0d1117; }
    h3 { font-size: 13px; margin-bottom: 16px; }
    .light h3 { color: #24292f; }
    .dark  h3 { color: #c9d1d9; }
    .note { font-size: 11px; color: #888; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="panel light">
    <h3>☀️ Light theme</h3>
    ${svgLight}
    <p class="note">Tip: refresh to regenerate with new random data</p>
  </div>
  <div class="panel dark">
    <h3>🌙 Dark theme</h3>
    ${svgDark}
  </div>
</body>
</html>`;

fs.writeFileSync("preview.html", html);
console.log("✅ preview.html written — open it in your browser");
console.log("   Windows: start preview.html");
console.log("   Mac:     open preview.html");