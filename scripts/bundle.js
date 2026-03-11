const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

async function bundle() {
  // 1. CLI bundle (for GitHub Actions — no shebang duplication)
  await esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    target: "node20",
    outfile: "dist/index.js",
    minify: false,
    sourcemap: false,
  });

  // Prepend shebang manually (avoids duplicate from source file)
  const cli = fs.readFileSync("dist/index.js", "utf8").replace(/^#!.*\n/, "");
  fs.writeFileSync("dist/index.js", "#!/usr/bin/env node\n" + cli);
  fs.chmodSync("dist/index.js", "755");

  // 2. Library bundle (for local preview — exports generateCatSVG)
  await esbuild.build({
    entryPoints: ["src/cat-animator.ts"],
    bundle: true,
    platform: "node",
    target: "node20",
    outfile: "dist/index-lib.js",
    format: "cjs",
    minify: false,
    sourcemap: false,
  });

  console.log("✅ dist/index.js     (CLI bundle)");
  console.log("✅ dist/index-lib.js (preview lib)");
}

bundle().catch(err => { console.error(err); process.exit(1); });